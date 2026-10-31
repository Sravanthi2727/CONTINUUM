#!/usr/bin/env node
import "dotenv/config";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { submitRunEvent } from "./tools/submitRunEvent";

const API_BASE_URL = (process.env.API_BASE_URL || "https://continuum-api-rkp4.onrender.com").replace(/\/$/, "");

const server = new Server(
  { name: "continuum-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "getProjectHistory",
      description:
        "Retrieve the recent run history for a project via the CONTINUUM API. Returns runs with their events, verdicts, and status.",
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
        "Search for past failures similar to the given error text via the CONTINUUM API. Returns similar past failure clusters with similarity scores.",
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
        "Submit an event for the current agent run directly to CONTINUUM API. Used to log tool calls, plan steps, errors, and test results.",
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
        const { project_id } = args as { project_id: string };
        const res = await fetch(`${API_BASE_URL}/runs?project_id=${project_id}`);
        const data = await res.json();
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }

      case "findSimilarFailures": {
        const { error_text } = args as { error_text: string };
        const res = await fetch(`${API_BASE_URL}/intelligence/similar?error_text=${encodeURIComponent(error_text)}`);
        const data = await res.json();
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }

      case "submitRunEvent": {
        const { run_id, event_id, type, step, payload, error_message } = args as any;
        const result = await submitRunEvent(API_BASE_URL, {
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
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`🚀 CONTINUUM MCP server running on stdio (Connected to API: ${API_BASE_URL})`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
