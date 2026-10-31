import "dotenv/config";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { MongoClient, Db } from "mongodb";
import { z } from "zod";
import { getProjectHistory } from "./tools/getProjectHistory";
import { findSimilarFailures } from "./tools/findSimilarFailures";
import { submitRunEvent } from "./tools/submitRunEvent";

let db: Db;

async function connectDB() {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  db = client.db("continuum");
  console.error("✅ MCP server connected to MongoDB");
}

const server = new Server(
  { name: "continuum-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "getProjectHistory",
      description:
        "Retrieve the recent run history for a project. Returns runs with their events and verdicts.",
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
        "Search for past failures similar to the given error text using semantic similarity. Returns the most similar past failures with similarity scores.",
      inputSchema: {
        type: "object",
        properties: {
          error_text: {
            type: "string",
            description: "The error message or text to find similar past failures for",
          },
          limit: {
            type: "number",
            description: "Maximum number of results to return (default 5)",
          },
        },
        required: ["error_text"],
      },
    },
    {
      name: "submitRunEvent",
      description:
        "Submit an event for the current agent run. Used to log tool calls, plan steps, errors, and test results.",
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

  try {
    switch (name) {
      case "getProjectHistory": {
        const { project_id, limit } = args as { project_id: string; limit?: number };
        const result = await getProjectHistory(db, project_id, limit ?? 10);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "findSimilarFailures": {
        const { error_text, limit } = args as { error_text: string; limit?: number };
        const result = await findSimilarFailures(db, error_text, limit ?? 5);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "submitRunEvent": {
        const { run_id, event_id, type, step, payload, error_message } = args as any;
        const apiUrl = process.env.API_BASE_URL || "http://localhost:3001";
        const result = await submitRunEvent(apiUrl, {
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

async function main() {
  await connectDB();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("🚀 CONTINUUM MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
