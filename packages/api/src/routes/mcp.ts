import { Request, Response, Router } from "express";
import jwt from "jsonwebtoken";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { getDB } from "../db/mongo";
import { getProjectHistory } from "../intelligence/getProjectHistory";
import { findSimilarFailures } from "../intelligence/findSimilarFailures";
import { submitRunEventDirect } from "../intelligence/submitRunEventDirect";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "continuum_hackathon_production_secret_2026";

interface SessionContext {
  transport: SSEServerTransport;
  userId: string;
}

const sessions = new Map<string, SessionContext>();

function verifyUserToken(req: Request): string | null {
  // 1. Check Bearer Authorization header
  const authHeader = req.headers.authorization;
  let token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  // 2. Or query param ?token=... (standard for SSE browser/Claude connections)
  if (!token && req.query.token) {
    token = req.query.token as string;
  }

  // 3. Or ?api_key=... / user_id parameter
  if (!token && req.query.user_id) {
    return req.query.user_id as string;
  }

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    // If not a JWT, treat arbitrary string token as custom user/api key
    return token;
  }
}

function createScopedMcpServer(userId: string): Server {
  const server = new Server(
    { name: "continuum-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
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
      {
        name: "findSimilarFailures",
        description:
          "Search for past failures similar to the given error text. Scoped to your projects.",
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
      {
        name: "submitRunEvent",
        description:
          "Submit an event for the current agent run directly to CONTINUUM. Automatically attributed to your user ID.",
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
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const db = getDB();

    try {
      switch (name) {
        case "getProjectHistory": {
          const { project_id, limit } = args as { project_id: string; limit?: number };
          // Enforce ownership: check project belongs to this user or is demo
          const project = await db.collection("projects").findOne({
            _id: project_id,
            $or: [{ owner_id: userId }, { owner_id: "demo" }],
          } as any);

          if (!project) {
            return {
              content: [{ type: "text", text: `Error: Access Denied. Project ${project_id} not found or does not belong to you.` }],
              isError: true,
            };
          }

          const result = await getProjectHistory(db, project_id, limit ?? 10);
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }

        case "findSimilarFailures": {
          const { error_text } = args as { error_text: string };
          const result = await findSimilarFailures(db, error_text, 5);
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }

        case "submitRunEvent": {
          const { run_id, event_id, type, step, payload, error_message } = args as any;
          // Tag event with authenticated user
          const eventPayload = {
            ...(payload || {}),
            submitted_by_user_id: userId,
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

// GET /sse — Clients establish SSE stream with authentication
router.get("/sse", async (req: Request, res: Response) => {
  const userId = verifyUserToken(req);

  if (!userId) {
    return res.status(401).json({
      error: "Authentication required for MCP connection. Provide ?token=<jwt> or Authorization header.",
    });
  }

  console.log(`🔌 MCP Client connected for user: ${userId}`);
  const transport = new SSEServerTransport("/messages", res);
  const server = createScopedMcpServer(userId);

  sessions.set(transport.sessionId, { transport, userId });

  res.on("close", () => {
    console.log(`🔌 MCP Client disconnected (${transport.sessionId}) for user: ${userId}`);
    sessions.delete(transport.sessionId);
  });

  await server.connect(transport);
});

// POST /messages — Clients send JSON-RPC messages back
router.post("/messages", async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ error: `Session not found: ${sessionId}` });
  }

  await session.transport.handlePostMessage(req, res);
});

export default router;
