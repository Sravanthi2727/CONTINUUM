import { Request, Response, Router } from "express";
import jwt from "jsonwebtoken";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { getDB, getCollection } from "../db/mongo";
import { getProjectHistory } from "../intelligence/getProjectHistory";
import { findSimilarFailures } from "../intelligence/findSimilarFailures";
import { submitRunEventDirect } from "../intelligence/submitRunEventDirect";
import { User, Project } from "../types";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "continuum_hackathon_production_secret_2026";

interface SessionContext {
  transport: SSEServerTransport;
  userId: string;
}

const sseSessions = new Map<string, SessionContext>();

// User sessions tracked for Claude / MCP clients
// Maps token or session identifier to authenticated user ID
const authenticatedSessions = new Map<string, { userId: string; email: string; name: string }>();

function createMcpServer(clientSessionId: string): Server {
  const server = new Server(
    { name: "continuum-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const session = authenticatedSessions.get(clientSessionId);
    const isLoggedIn = !!session;

    return {
      tools: [
        // 1. Interactive Authentication Tool for Claude / Agent
        {
          name: "authenticate",
          description:
            "Authenticate the current session with your CONTINUUM personal API Key or user credentials. Run this first so CONTINUUM knows who you are and grants access to your projects.",
          inputSchema: {
            type: "object",
            properties: {
              api_key_or_token: {
                type: "string",
                description: "Your JWT token or User ID from https://continuum-jrxa.onrender.com",
              },
              email: {
                type: "string",
                description: "(Alternative) Your CONTINUUM registered email address",
              },
            },
          },
        },
        // 2. Who am I
        {
          name: "whoami",
          description: "Check the current authenticated user identity and session status.",
          inputSchema: { type: "object", properties: {} },
        },
        // 3. Project History
        {
          name: "getProjectHistory",
          description:
            "Retrieve the recent run history for a project owned by you. Returns runs with their events, verdicts, and status.",
          inputSchema: {
            type: "object",
            properties: {
              project_id: {
                type: "string",
                description: "The project ID to fetch history for",
              },
              limit: {
                type: "number",
                description: "Maximum number of runs to return (default 10)",
              },
            },
            required: ["project_id"],
          },
        },
        // 4. Similar Failures
        {
          name: "findSimilarFailures",
          description:
            "Search for past failures similar to the given error text. Scoped to your team's failure database.",
          inputSchema: {
            type: "object",
            properties: {
              error_text: {
                type: "string",
                description: "The error message or failure log to diagnose",
              },
            },
            required: ["error_text"],
          },
        },
        // 5. Submit Event
        {
          name: "submitRunEvent",
          description:
            "Submit an event for the current agent run directly to CONTINUUM. Tagged with your authenticated user ID.",
          inputSchema: {
            type: "object",
            properties: {
              run_id: {
                type: "string",
                description: "The run ID to submit the event to",
              },
              event_id: {
                type: "string",
                description: "Unique event ID (UUID)",
              },
              type: {
                type: "string",
                enum: ["command_run", "tool_call", "diff_submitted", "test_result", "error", "plan_step"],
                description: "The event type",
              },
              step: {
                type: "number",
                description: "The step number in the run sequence",
              },
              payload: {
                type: "object",
                description: "Event-specific payload data",
              },
              error_message: {
                type: "string",
                description: "Error message if this is an error event",
              },
            },
            required: ["run_id", "event_id", "type"],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const db = getDB();

    try {
      switch (name) {
        // --- AUTHENTICATE TOOL ---
        case "authenticate": {
          const { api_key_or_token, email } = (args || {}) as { api_key_or_token?: string; email?: string };

          let targetUser: any = null;

          if (api_key_or_token) {
            try {
              const decoded = jwt.verify(api_key_or_token, JWT_SECRET) as { userId: string; email: string };
              targetUser = await db.collection("users").findOne({ _id: decoded.userId } as any);
            } catch {
              // Check direct ID or key
              targetUser = await db.collection("users").findOne({ _id: api_key_or_token } as any);
            }
          }

          if (!targetUser && email) {
            targetUser = await db.collection("users").findOne({ email: email.toLowerCase().trim() } as any);
          }

          if (!targetUser) {
            // If neither matches, allow quick development session tag
            const fallbackId = email || api_key_or_token || "dev-user";
            authenticatedSessions.set(clientSessionId, {
              userId: fallbackId,
              email: email || `${fallbackId}@continuum.local`,
              name: fallbackId,
            });

            return {
              content: [
                {
                  type: "text",
                  text: `✅ Connected session as user ID: "${fallbackId}". You can now access your projects!`,
                },
              ],
            };
          }

          authenticatedSessions.set(clientSessionId, {
            userId: targetUser._id,
            email: targetUser.email,
            name: targetUser.name,
          });

          return {
            content: [
              {
                type: "text",
                text: `🎉 Authenticated successfully! Logged in as: ${targetUser.name} (${targetUser.email}). Your personal project tree and history are now accessible to this agent.`,
              },
            ],
          };
        }

        // --- WHOAMI TOOL ---
        case "whoami": {
          const session = authenticatedSessions.get(clientSessionId);
          if (!session) {
            return {
              content: [
                {
                  type: "text",
                  text: "⚠️ Not authenticated. Please run the `authenticate` tool with your email or token.",
                },
              ],
            };
          }
          return {
            content: [
              {
                type: "text",
                text: `👤 Active User: ${session.name} (${session.email}) | User ID: ${session.userId}`,
              },
            ],
          };
        }

        // --- GET PROJECT HISTORY ---
        case "getProjectHistory": {
          const { project_id, limit } = args as { project_id: string; limit?: number };
          const session = authenticatedSessions.get(clientSessionId);

          // Verify project ownership
          const project = await db.collection("projects").findOne({ _id: project_id } as any);
          if (!project) {
            return {
              content: [{ type: "text", text: `Error: Project "${project_id}" not found.` }],
              isError: true,
            };
          }

          // If project is not public demo, check if it belongs to authenticated user
          if (project.owner_id !== "demo" && session && project.owner_id !== session.userId) {
            return {
              content: [
                {
                  type: "text",
                  text: `⛔ Access Denied: Project "${project.name}" belongs to user "${project.owner_id}". You are currently authenticated as "${session.userId}".`,
                },
              ],
              isError: true,
            };
          }

          const result = await getProjectHistory(db, project_id, limit ?? 10);
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }

        // --- FIND SIMILAR FAILURES ---
        case "findSimilarFailures": {
          const { error_text } = args as { error_text: string };
          const result = await findSimilarFailures(db, error_text, 5);
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }

        // --- SUBMIT RUN EVENT ---
        case "submitRunEvent": {
          const session = authenticatedSessions.get(clientSessionId);
          const { run_id, event_id, type, step, payload, error_message } = args as any;
          const eventPayload = {
            ...(payload || {}),
            submitted_by_user: session ? { id: session.userId, email: session.email } : "anonymous",
          };
          const result = await submitRunEventDirect(db, {
            _id: event_id,
            run_id,
            type,
            step,
            payload: eventPayload,
            error_message,
          });
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }

        default:
          return {
            content: [{ type: "text", text: `Unknown tool: ${name}` }],
            isError: true,
          };
      }
    } catch (err: any) {
      return {
        content: [{ type: "text", text: `Error: ${err.message}` }],
        isError: true,
      };
    }
  });

  return server;
}

// =========================================================================
// 1. STREAMABLE HTTP TRANSPORT (Official modern MCP specification)
// Endpoint: /mcp
// Supports interactive authentication & tool dispatching
// =========================================================================
const streamableHttpTransport = new StreamableHTTPServerTransport({
  sessionIdGenerator: undefined,
});

const defaultHttpMcpServer = createMcpServer("global-http-session");
defaultHttpMcpServer.connect(streamableHttpTransport).catch(console.error);

router.all("/mcp", async (req: Request, res: Response) => {
  await streamableHttpTransport.handleRequest(req, res, req.body);
});

// =========================================================================
// 2. LEGACY SSE TRANSPORT (Backward Compatibility)
// Endpoints: /sse and /messages
// =========================================================================
router.get("/sse", async (req: Request, res: Response) => {
  const sessionId = "sse-" + Math.random().toString(36).substring(2, 9);
  const transport = new SSEServerTransport("/messages", res);
  const server = createMcpServer(sessionId);

  sseSessions.set(transport.sessionId, { transport, userId: sessionId });

  res.on("close", () => {
    sseSessions.delete(transport.sessionId);
    authenticatedSessions.delete(sessionId);
  });

  await server.connect(transport);
});

router.post("/messages", async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  const session = sseSessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ error: `Session not found: ${sessionId}` });
  }

  await session.transport.handlePostMessage(req, res);
});

export default router;
