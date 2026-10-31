import { Request, Response, Router } from "express";
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

// Map of active transports by session ID
const transports = new Map<string, SSEServerTransport>();

function createMcpServer(): Server {
  const server = new Server(
    { name: "continuum-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "getProjectHistory",
        description:
          "Retrieve the recent run history for a project. Returns runs with their events, verdicts, and status.",
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
          "Search for past failures similar to the given error text. Returns similar past failure clusters with similarity scores.",
        inputSchema: {
          type: "object",
          properties: {
            error_text: {
              type: "string",
              description: "The error message or failure log to find similar past issues for",
            },
          },
          required: ["error_text"],
        },
      },
      {
        name: "submitRunEvent",
        description:
          "Submit an event for the current agent run directly to CONTINUUM. Used to log tool calls, plan steps, errors, and test results.",
        inputSchema: {
          type: "object",
          properties: {
            run_id: {
              type: "string",
              description: "The run ID to submit the event to",
            },
            event_id: {
              type: "string",
              description: "Unique event ID (for dedup). Use a UUID.",
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
          const result = await submitRunEventDirect(db, {
            _id: event_id,
            run_id,
            type,
            step,
            payload: payload || {},
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

// GET /sse — Clients establish SSE stream
router.get("/sse", async (req: Request, res: Response) => {
  console.log("🔌 MCP Client connected via SSE");
  const transport = new SSEServerTransport("/messages", res);
  const server = createMcpServer();

  transports.set(transport.sessionId, transport);

  res.on("close", () => {
    console.log("🔌 MCP Client disconnected (SSE session closed):", transport.sessionId);
    transports.delete(transport.sessionId);
  });

  await server.connect(transport);
});

// POST /messages — Clients send JSON-RPC messages back
router.post("/messages", async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports.get(sessionId);

  if (!transport) {
    return res.status(404).json({ error: `Session not found: ${sessionId}` });
  }

  await transport.handlePostMessage(req, res);
});

export default router;
