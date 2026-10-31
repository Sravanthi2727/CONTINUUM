#!/usr/bin/env node
import "dotenv/config";
import { program } from "commander";
import fs from "fs";
import path from "path";
import { execSync, spawn } from "child_process";
import { v4 as uuidv4 } from "uuid";

const CONFIG_FILE = ".continuum.json";
const API_URL = process.env.CONTINUUM_API_URL || "https://continuum-api-rkp4.onrender.com";

function loadConfig(): { project_id: string; project_name: string } | null {
  const configPath = path.join(process.cwd(), CONFIG_FILE);
  if (!fs.existsSync(configPath)) return null;
  return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

function saveConfig(config: object) {
  fs.writeFileSync(
    path.join(process.cwd(), CONFIG_FILE),
    JSON.stringify(config, null, 2)
  );
}

async function apiPost(endpoint: string, body: object) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: text, status: res.status };
  }
}

async function apiPatch(endpoint: string, body: object) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: text, status: res.status };
  }
}

async function apiGet(endpoint: string) {
  const res = await fetch(`${API_URL}${endpoint}`);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: text, status: res.status };
  }
}

program.name("cnt").description("CONTINUUM CLI — memory that outlives the session").version("1.0.0");

// cnt init
program
  .command("init")
  .description("Register this directory as a CONTINUUM project")
  .option("-n, --name <name>", "Project name (defaults to directory name)")
  .option("-r, --repo <url>", "Repository URL")
  .action(async (opts) => {
    const name = opts.name || path.basename(process.cwd());
    console.log(`🚀 Initializing CONTINUUM project: ${name}`);
    const project = await apiPost("/projects", {
      name,
      repo_url: opts.repo,
      owner_id: "demo",
    });
    if ((project as any).error) {
      console.error("❌ Failed to create project:", (project as any).error);
      process.exit(1);
    }
    saveConfig({ project_id: (project as any)._id, project_name: name });
    console.log(`✅ Project registered. ID: ${(project as any)._id}`);
    console.log(`📄 Config saved to ${CONFIG_FILE}`);
  });

// cnt run "command"
program
  .command("run <cmd>")
  .description("Wrap a command and log its events to CONTINUUM")
  .option("--commit <sha>", "Commit SHA to associate with this run")
  .action(async (cmd: string, opts) => {
    const config = loadConfig();
    if (!config) {
      console.error("❌ No .continuum.json found. Run `cnt init` first.");
      process.exit(1);
    }

    // Create a run
    const run = await apiPost("/runs", {
      project_id: config.project_id,
      source: "human",
      triggered_by: process.env.USER || "user",
      commit_sha: opts.commit || "HEAD",
      task_description: cmd,
    }) as any;

    if (run.error) {
      console.error("❌ Failed to create run:", run.error);
      process.exit(1);
    }

    console.log(`▶️  Run started: ${run._id}`);
    console.log(`   Command: ${cmd}`);

    // Log command_run event
    await apiPost("/events", {
      _id: uuidv4(),
      run_id: run._id,
      type: "command_run",
      step: 0,
      payload: { command: cmd },
    });

    // Execute the command
    const startTime = Date.now();
    let exitCode = 0;

    try {
      const output = execSync(cmd, { encoding: "utf8", stdio: "pipe" });
      console.log(output);

      // Log success event
      await apiPost("/events", {
        _id: uuidv4(),
        run_id: run._id,
        type: "test_result",
        step: 1,
        payload: { status: "pass", output: output.slice(0, 500), duration_ms: Date.now() - startTime },
      });

      await apiPatch(`/runs/${run._id}`, { status: "success" });
      console.log(`✅ Run completed successfully in ${Date.now() - startTime}ms`);
      console.log(`🔗 View at: ${API_URL.replace("3001", "5173")}/runs/${run._id}`);
    } catch (err: any) {
      exitCode = err.status || 1;
      const errorMsg = err.stderr || err.stdout || err.message || "Command failed";

      // Log error event
      await apiPost("/events", {
        _id: uuidv4(),
        run_id: run._id,
        type: "error",
        step: 1,
        payload: { exit_code: exitCode, stderr: String(errorMsg).slice(0, 500) },
        error_message: String(errorMsg).slice(0, 1000),
      });

      await apiPatch(`/runs/${run._id}`, { status: "failed" });
      console.error(`❌ Run failed (exit ${exitCode}) in ${Date.now() - startTime}ms`);
      console.error(`   Error: ${String(errorMsg).slice(0, 200)}`);
      console.log(`🔗 View divergence at: ${API_URL.replace("3001", "5173")}/runs/${run._id}`);
      process.exit(exitCode);
    }
  });

// cnt history
program
  .command("history")
  .description("Print the last N runs for this project")
  .option("-n, --limit <n>", "Number of runs to show", "10")
  .action(async (opts) => {
    const config = loadConfig();
    if (!config) {
      console.error("❌ No .continuum.json found. Run `cnt init` first.");
      process.exit(1);
    }

    const runs = await apiGet(`/runs?project_id=${config.project_id}`) as any[];
    if (!Array.isArray(runs) || runs.length === 0) {
      console.log("No runs found.");
      return;
    }

    console.log(`\n📜 Last ${Math.min(runs.length, parseInt(opts.limit))} runs for: ${config.project_name}\n`);
    console.log("STATUS   | SOURCE | STARTED              | COMMIT     | RUN ID");
    console.log("-".repeat(80));

    runs.slice(0, parseInt(opts.limit)).forEach((r) => {
      const status = r.status === "success" ? "✅ ok   " : r.status === "failed" ? "❌ fail " : "🔄 run  ";
      const started = new Date(r.started_at).toLocaleString();
      const commit = (r.commit_sha || "N/A").slice(0, 7);
      console.log(`${status} | ${r.source.padEnd(5)} | ${started} | ${commit}     | ${r._id}`);
    });
    console.log();
  });

// cnt link-agent
program
  .command("link-agent")
  .description("Print the MCP server config snippet for your AI agent (Cursor / Claude Code / Copilot)")
  .action(() => {
    const config = loadConfig();
    const mcpConfig = {
      mcpServers: {
        continuum: {
          command: "continuum-mcp",
          env: {
            API_BASE_URL: API_URL,
          },
        },
      },
    };
    console.log("\n📋 Universal MCP Configuration (Works on any machine with `continuum-mcp`):\n");
    console.log(JSON.stringify(mcpConfig, null, 2));
    console.log("\n💡 Or run directly via relative path in the repo:\n");
    console.log(JSON.stringify({
      mcpServers: {
        continuum: {
          command: "node",
          args: ["./packages/mcp-server/dist/index.js"],
          env: { API_BASE_URL: API_URL },
        },
      },
    }, null, 2));
    if (config) {
      console.log(`\n💡 Current project_id: ${config.project_id}`);
    }
  });

program.parse();
