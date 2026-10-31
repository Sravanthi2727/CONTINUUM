#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const commander_1 = require("commander");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const readline_1 = __importDefault(require("readline"));
const child_process_1 = require("child_process");
const uuid_1 = require("uuid");
const CONFIG_FILE = ".continuum.json";
const API_URL = process.env.CONTINUUM_API_URL || "https://continuum-api-rkp4.onrender.com";
function getAuthFilePath() {
    const dir = path_1.default.join(os_1.default.homedir(), ".continuum");
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
    return path_1.default.join(dir, "auth.json");
}
function loadAuth() {
    const tokenFromEnv = process.env.CONTINUUM_TOKEN;
    if (tokenFromEnv) {
        return { token: tokenFromEnv };
    }
    const authPath = getAuthFilePath();
    if (fs_1.default.existsSync(authPath)) {
        try {
            return JSON.parse(fs_1.default.readFileSync(authPath, "utf8"));
        }
        catch {
            return null;
        }
    }
    return null;
}
function saveAuth(auth) {
    const authPath = getAuthFilePath();
    fs_1.default.writeFileSync(authPath, JSON.stringify(auth, null, 2), "utf8");
}
function clearAuth() {
    const authPath = getAuthFilePath();
    if (fs_1.default.existsSync(authPath)) {
        fs_1.default.unlinkSync(authPath);
    }
}
function getAuthHeaders() {
    const auth = loadAuth();
    const headers = { "Content-Type": "application/json" };
    if (auth?.token) {
        headers["Authorization"] = `Bearer ${auth.token}`;
    }
    return headers;
}
function loadConfig() {
    const configPath = path_1.default.join(process.cwd(), CONFIG_FILE);
    if (!fs_1.default.existsSync(configPath))
        return null;
    try {
        return JSON.parse(fs_1.default.readFileSync(configPath, "utf8"));
    }
    catch {
        return null;
    }
}
function saveConfig(config) {
    fs_1.default.writeFileSync(path_1.default.join(process.cwd(), CONFIG_FILE), JSON.stringify(config, null, 2), "utf8");
}
function promptLine(query) {
    const rl = readline_1.default.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => {
        rl.question(query, (ans) => {
            rl.close();
            resolve(ans.trim());
        });
    });
}
async function apiPost(endpoint, body) {
    const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
    });
    const text = await res.text();
    try {
        return JSON.parse(text);
    }
    catch {
        return { error: text, status: res.status };
    }
}
async function apiPatch(endpoint, body) {
    const res = await fetch(`${API_URL}${endpoint}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
    });
    const text = await res.text();
    try {
        return JSON.parse(text);
    }
    catch {
        return { error: text, status: res.status };
    }
}
async function apiGet(endpoint) {
    const res = await fetch(`${API_URL}${endpoint}`, {
        headers: getAuthHeaders(),
    });
    const text = await res.text();
    try {
        return JSON.parse(text);
    }
    catch {
        return { error: text, status: res.status };
    }
}
async function apiDelete(endpoint) {
    const res = await fetch(`${API_URL}${endpoint}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });
    const text = await res.text();
    try {
        return JSON.parse(text);
    }
    catch {
        return { error: text, status: res.status };
    }
}
commander_1.program
    .name("cnt")
    .description("CONTINUUM CLI — Memory that outlives the session (Unified Human & Agent Stack)")
    .version("1.1.0");
// ==========================================
// 1. AUTHENTICATION: login, register, whoami, logout
// ==========================================
commander_1.program
    .command("login")
    .description("Authenticate user and store session in ~/.continuum/auth.json")
    .option("-e, --email <email>", "User email")
    .option("-p, --password <password>", "User password")
    .option("-t, --token <token>", "Explicit JWT token to save directly")
    .action(async (opts) => {
    if (opts.token) {
        saveAuth({ token: opts.token });
        console.log("✅ Authenticated via provided token. Saved to ~/.continuum/auth.json");
        return;
    }
    const email = opts.email || (await promptLine("Enter email: "));
    const password = opts.password || (await promptLine("Enter password: "));
    if (!email || !password) {
        console.error("❌ Email and password required.");
        process.exit(1);
    }
    console.log(`🔐 Logging into ${API_URL}...`);
    const res = await apiPost("/auth/login", { email, password });
    if (res.token) {
        saveAuth({ token: res.token, user: res.user });
        console.log(`✅ Welcome back, ${res.user?.name || res.user?.email || "developer"}!`);
        console.log(`🔑 Token safely persisted in ~/.continuum/auth.json`);
    }
    else {
        console.error("❌ Login failed:", res.error || "Invalid credentials");
        process.exit(1);
    }
});
commander_1.program
    .command("register")
    .description("Create a new CONTINUUM user account")
    .option("-e, --email <email>", "User email")
    .option("-p, --password <password>", "User password")
    .option("-n, --name <name>", "Full name")
    .action(async (opts) => {
    const email = opts.email || (await promptLine("Enter email: "));
    const name = opts.name || (await promptLine("Enter your name: "));
    const password = opts.password || (await promptLine("Enter password: "));
    if (!email || !password) {
        console.error("❌ Email and password required.");
        process.exit(1);
    }
    console.log(`✨ Registering user on ${API_URL}...`);
    const res = await apiPost("/auth/register", { email, password, name });
    if (res.token) {
        saveAuth({ token: res.token, user: res.user });
        console.log(`✅ Account created! Authenticated as ${res.user?.name} (${res.user?.email})`);
        console.log(`🔑 Credentials saved to ~/.continuum/auth.json`);
    }
    else {
        console.error("❌ Registration failed:", res.error || "Could not register");
        process.exit(1);
    }
});
commander_1.program
    .command("whoami")
    .description("Display the active user and authenticated status")
    .action(async () => {
    const auth = loadAuth();
    if (!auth?.token) {
        console.log("👤 Not authenticated (operating as anonymous / demo).");
        console.log("👉 Run `cnt login` or `cnt register` to connect your account.");
        return;
    }
    console.log("🔍 Checking active session on cloud API...");
    const me = await apiGet("/auth/me");
    if (me.user) {
        console.log(`✅ Authenticated user:`);
        console.log(`   ID:    ${(me.user.id || me.user._id)}`);
        console.log(`   Email: ${me.user.email}`);
        console.log(`   Name:  ${me.user.name}`);
        console.log(`   Token: ${auth.token.slice(0, 15)}...`);
    }
    else {
        console.log("⚠️ Stored token has expired or is invalid. Run `cnt login` to refresh.");
    }
});
commander_1.program
    .command("logout")
    .description("Clear stored credentials from local machine")
    .action(() => {
    clearAuth();
    console.log("👋 Logged out. Stored credentials removed from ~/.continuum/auth.json");
});
// ==========================================
// 2. PROJECT MANAGEMENT: init, projects, clean
// ==========================================
commander_1.program
    .command("init")
    .description("Initialize or link a repository to a CONTINUUM project")
    .option("-n, --name <name>", "Project name (defaults to current directory name)")
    .option("-r, --repo <url>", "Git repository URL")
    .option("--interactive", "Prompt for project details")
    .action(async (opts) => {
    const auth = loadAuth();
    let name = opts.name;
    let repo = opts.repo;
    // Detect git remote if possible
    if (!repo) {
        try {
            repo = (0, child_process_1.execSync)("git config --get remote.origin.url", { stdio: "pipe", encoding: "utf8" }).trim();
        }
        catch {
            // git not found or no remote
        }
    }
    if (opts.interactive || (!name && process.stdin.isTTY && !opts.name)) {
        const defaultName = path_1.default.basename(process.cwd());
        const inputName = await promptLine(`Project Name [${defaultName}]: `);
        name = inputName || defaultName;
        const inputRepo = await promptLine(`Repository URL [${repo || "none"}]: `);
        if (inputRepo)
            repo = inputRepo;
    }
    else {
        name = name || path_1.default.basename(process.cwd());
    }
    console.log(`🚀 Initializing CONTINUUM project: ${name}`);
    if (auth?.user?.email) {
        console.log(`👤 Linking project to user: ${auth.user.email}`);
    }
    const project = await apiPost("/projects", {
        name,
        repo_url: repo,
        owner_id: auth?.user?.id || "demo",
    });
    if (project.error) {
        console.error("❌ Failed to create project:", project.error);
        process.exit(1);
    }
    saveConfig({ project_id: project._id, project_name: name });
    console.log(`✅ Project successfully registered!`);
    console.log(`   Project ID: ${project._id}`);
    console.log(`   Project Name: ${name}`);
    console.log(`📄 Saved configuration to .continuum.json`);
    console.log(`🔗 Web Dashboard: https://continuum-jrxa.onrender.com/projects/${project._id}`);
});
commander_1.program
    .command("projects")
    .description("List all projects available for your account")
    .action(async () => {
    console.log("📂 Fetching projects from CONTINUUM cloud...");
    const projects = await apiGet("/projects");
    if (!Array.isArray(projects) || projects.length === 0) {
        console.log("No projects found. Run `cnt init` to create one.");
        return;
    }
    console.log("\nPROJECT ID                           | NAME                | CREATED");
    console.log("-".repeat(78));
    for (const p of projects) {
        const date = new Date(p.created_at).toLocaleDateString();
        console.log(`${p._id.padEnd(36)} | ${(p.name || "Untitled").padEnd(19)} | ${date}`);
    }
    console.log();
});
commander_1.program
    .command("clean")
    .description("Delete local .continuum.json or delete cloud project records")
    .option("--cloud", "Delete this project and all its runs/events permanently from the database")
    .option("--local", "Delete only the local .continuum.json file")
    .action(async (opts) => {
    const config = loadConfig();
    if (opts.cloud) {
        if (!config) {
            console.error("❌ No .continuum.json found. Cannot identify project to delete.");
            process.exit(1);
        }
        const confirm = await promptLine(`⚠️ Are you sure you want to delete project '${config.project_name}' (${config.project_id}) from CLOUD? (yes/no): `);
        if (confirm.toLowerCase() !== "yes") {
            console.log("Aborted.");
            return;
        }
        console.log(`🗑️  Deleting project ${config.project_id} from cloud...`);
        const res = await apiDelete(`/projects/${config.project_id}`);
        if (res.error) {
            console.error("❌ Failed to delete project:", res.error);
        }
        else {
            console.log(`✅ ${res.message || "Project deleted successfully"}`);
        }
        const configPath = path_1.default.join(process.cwd(), CONFIG_FILE);
        if (fs_1.default.existsSync(configPath))
            fs_1.default.unlinkSync(configPath);
        return;
    }
    // Default: clean local
    const configPath = path_1.default.join(process.cwd(), CONFIG_FILE);
    if (fs_1.default.existsSync(configPath)) {
        fs_1.default.unlinkSync(configPath);
        console.log("🧹 Removed local .continuum.json config.");
    }
    else {
        console.log("No local .continuum.json found.");
    }
});
// ==========================================
// 3. EXECUTION: run (Human or Agent)
// ==========================================
commander_1.program
    .command("run <cmd>")
    .description("Wrap any command and stream command_run, test_result, and error events to CONTINUUM")
    .option("--commit <sha>", "Commit SHA to associate with this run")
    .option("-s, --source <source>", "Run source: human | agent", "human")
    .option("-a, --agent <name>", "Agent name (if source=agent, e.g. Claude, Cursor, AGY)")
    .option("-t, --task <desc>", "Task description")
    .action(async (cmd, opts) => {
    const config = loadConfig();
    if (!config) {
        console.error("❌ No .continuum.json found. Run `cnt init` first.");
        process.exit(1);
    }
    const auth = loadAuth();
    const source = opts.source === "agent" ? "agent" : "human";
    const triggeredBy = auth?.user?.email || (source === "agent" ? (opts.agent || "AI Agent") : (process.env.USER || "developer"));
    // Create a run in DB
    const run = await apiPost("/runs", {
        project_id: config.project_id,
        source,
        agent_name: opts.agent || (source === "agent" ? "Coding Agent" : undefined),
        triggered_by: triggeredBy,
        commit_sha: opts.commit || "HEAD",
        task_description: opts.task || cmd,
    });
    if (run.error) {
        console.error("❌ Failed to create run:", run.error);
        process.exit(1);
    }
    console.log(`\n▶️  CONTINUUM Run started: ${run._id} (${source.toUpperCase()})`);
    console.log(`   Project: ${config.project_name} [${config.project_id}]`);
    console.log(`   Command: ${cmd}`);
    // Step 0: command_run
    await apiPost("/events", {
        _id: (0, uuid_1.v4)(),
        run_id: run._id,
        type: "command_run",
        step: 0,
        payload: { command: cmd },
    });
    const startTime = Date.now();
    let exitCode = 0;
    try {
        const output = (0, child_process_1.execSync)(cmd, { encoding: "utf8", stdio: "pipe" });
        console.log(output);
        // Step 1: test_result (pass)
        await apiPost("/events", {
            _id: (0, uuid_1.v4)(),
            run_id: run._id,
            type: "test_result",
            step: 1,
            payload: { status: "pass", output: output.slice(0, 500), duration_ms: Date.now() - startTime },
        });
        await apiPatch(`/runs/${run._id}`, { status: "success" });
        console.log(`✅ Run completed successfully in ${Date.now() - startTime}ms`);
        console.log(`🔗 Live Dashboard: https://continuum-jrxa.onrender.com/runs/${run._id}`);
    }
    catch (err) {
        exitCode = err.status || 1;
        const errorMsg = err.stderr || err.stdout || err.message || "Command execution failed";
        // Step 1: error
        await apiPost("/events", {
            _id: (0, uuid_1.v4)(),
            run_id: run._id,
            type: "error",
            step: 1,
            payload: { exit_code: exitCode, stderr: String(errorMsg).slice(0, 500) },
            error_message: String(errorMsg).slice(0, 1000),
        });
        await apiPatch(`/runs/${run._id}`, { status: "failed" });
        console.error(`\n❌ Run failed (exit ${exitCode}) in ${Date.now() - startTime}ms`);
        console.error(`   Error snippet: ${String(errorMsg).slice(0, 200)}`);
        console.log(`🔍 Live Divergence & Diagnosis: https://continuum-jrxa.onrender.com/runs/${run._id}`);
        process.exit(exitCode);
    }
});
// ==========================================
// 4. AGENT & USER EVENT INGESTION: log
// ==========================================
commander_1.program
    .command("log")
    .description("Insert custom lifecycle events (plan_step, tool_call, diff_submitted, test_result, error)")
    .requiredOption("-t, --type <type>", "Event type: plan_step | tool_call | diff_submitted | test_result | error")
    .option("-r, --run <run_id>", "Target run ID (defaults to active run or creates one)")
    .option("-s, --step <n>", "Step index", "0")
    .option("-p, --payload <json>", "JSON payload data", "{}")
    .option("-m, --message <text>", "Error message or summary string")
    .action(async (opts) => {
    let runId = opts.run;
    const config = loadConfig();
    if (!runId) {
        if (!config) {
            console.error("❌ Specify --run <id> or initialize project with `cnt init`");
            process.exit(1);
        }
        // Create ad-hoc run
        const auth = loadAuth();
        const newRun = await apiPost("/runs", {
            project_id: config.project_id,
            source: "agent",
            agent_name: "CLI Agent logger",
            triggered_by: auth?.user?.email || "agent",
            task_description: `Custom ${opts.type} event`,
        });
        runId = newRun._id;
        console.log(`Created new run for event: ${runId}`);
    }
    let parsedPayload = {};
    try {
        parsedPayload = JSON.parse(opts.payload);
    }
    catch {
        parsedPayload = { text: opts.payload };
    }
    if (opts.message && !parsedPayload.message) {
        parsedPayload.message = opts.message;
    }
    const eventId = (0, uuid_1.v4)();
    console.log(`📤 Sending ${opts.type} event to CONTINUUM...`);
    const res = await apiPost("/events", {
        _id: eventId,
        run_id: runId,
        type: opts.type,
        step: parseInt(opts.step),
        payload: parsedPayload,
        error_message: opts.type === "error" ? (opts.message || JSON.stringify(parsedPayload)) : undefined,
    });
    if (res.error) {
        console.error("❌ Failed to log event:", res.error);
    }
    else {
        console.log(`✅ Event logged successfully! ID: ${eventId}`);
        console.log(`🔗 Run: https://continuum-jrxa.onrender.com/runs/${runId}`);
    }
});
// ==========================================
// 5. COMBINED AGENT RUN DEBUGGER & VERIFIER: divergence & verify
// ==========================================
commander_1.program
    .command("divergence")
    .description("Isolate exact divergence point between a run and the baseline successful run")
    .requiredOption("-r, --run <run_id>", "Run ID to debug")
    .action(async (opts) => {
    console.log(`🔍 Analyzing run divergence for: ${opts.run}...`);
    const div = await apiGet(`/runs/${opts.run}/divergence`);
    if (div.error) {
        console.error("❌ Failed to get divergence:", div.error);
        return;
    }
    console.log("\n=================== DIVERGENCE REPORT ===================");
    console.log(`Target Run:       ${div.run_id}`);
    console.log(`Baseline Run:     ${div.baseline_run_id || "None found (first run)"}`);
    console.log(`Diverged:         ${div.diverged ? "⚠️  YES (Deviation detected)" : "✅ NO (Runs matched)"}`);
    if (div.diverged_at_step !== undefined && div.diverged_at_step !== null) {
        console.log(`Diverged at Step: ${div.diverged_at_step}`);
    }
    if (div.first_divergence_point) {
        console.log(`Divergence Point: ${div.first_divergence_point}`);
    }
    if (div.aligned && Array.isArray(div.aligned)) {
        console.log("\n--- STEP BY STEP ALIGNMENT ---");
        for (const step of div.aligned) {
            const flag = step.match ? "✓ MATCH" : "✗ MISMATCH";
            console.log(`[Step ${step.step}] ${flag.padEnd(10)} | Curr: ${step.current?.type || "None"} | Base: ${step.baseline?.type || "None"}`);
        }
    }
    console.log("=========================================================\n");
});
commander_1.program
    .command("verify")
    .description("Audit coding agent claims against diff_submitted and test_result events (Verdicts: safe | risky | blocked)")
    .requiredOption("-r, --run <run_id>", "Run ID to verify")
    .option("-c, --claims <json>", "JSON array of claims: [{\"requirement\": \"tests pass\", \"evidence_test\": \"test\"}]")
    .action(async (opts) => {
    let claims = [];
    if (opts.claims) {
        try {
            claims = JSON.parse(opts.claims);
        }
        catch {
            console.error("❌ Invalid JSON in --claims. Expected array of objects.");
            process.exit(1);
        }
    }
    else {
        claims = [
            { requirement: "All automated tests executed and passing", evidence_test: "npm test" },
            { requirement: "Clean code changes submitted without regression" },
        ];
    }
    console.log(`🛡️  Auditing Agent Claims for Run ${opts.run}...`);
    const result = await apiPost("/intelligence/verify", {
        run_id: opts.run,
        claims,
    });
    if (result.error) {
        console.error("❌ Verification failed:", result.error);
        return;
    }
    console.log("\n=================== CLAIM VERIFICATION ===================");
    const vColor = result.verdict === "safe" ? "✅ SAFE TO SHIP" : result.verdict === "risky" ? "⚠️  RISKY" : "🚫 BLOCKED";
    console.log(`VERDICT: ${vColor}`);
    console.log(`Computed At: ${new Date(result.computed_at).toLocaleString()}`);
    console.log("\nAudited Claims:");
    for (const c of result.claims || []) {
        const statusIcon = c.status === "proven" ? "✓ PROVEN" : "✗ UNPROVEN";
        console.log(`  ${statusIcon.padEnd(12)} - ${c.requirement}`);
        if (c.evidence_test)
            console.log(`                 Evidence: ${c.evidence_test}`);
    }
    console.log("==========================================================\n");
});
// ==========================================
// 6. HISTORY & AGENT LINKING
// ==========================================
commander_1.program
    .command("history")
    .description("Print recent runs for this project")
    .option("-n, --limit <n>", "Number of runs to show", "10")
    .action(async (opts) => {
    const config = loadConfig();
    if (!config) {
        console.error("❌ No .continuum.json found. Run `cnt init` first.");
        process.exit(1);
    }
    const runs = await apiGet(`/runs?project_id=${config.project_id}`);
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
commander_1.program
    .command("link-agent")
    .description("Generate Model Context Protocol (MCP) Streamable HTTP configuration for Claude, Cursor, Copilot, AGY")
    .option("-t, --token <token>", "Your user JWT auth token to scope agent data")
    .action((opts) => {
    const auth = loadAuth();
    const config = loadConfig();
    const token = opts.token || auth?.token;
    const mcpConfig = {
        mcpServers: {
            continuum: {
                url: "https://continuum-api-rkp4.onrender.com/mcp",
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            },
        },
    };
    console.log("\n🔒 User-Authenticated MCP Configuration (Streamable HTTP):\n");
    console.log(JSON.stringify(mcpConfig, null, 2));
    console.log("\n📌 Copy and paste this directly into Claude Desktop or Cursor MCP settings.");
    if (config) {
        console.log(`💡 Current project: ${config.project_name} (${config.project_id})`);
    }
});
commander_1.program.parse();
