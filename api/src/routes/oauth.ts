import { Request, Response, Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { getCollection } from "../db/mongo";
import { User } from "../types";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "continuum_hackathon_production_secret_2026";
const API_BASE = "https://continuum-api-rkp4.onrender.com";

// In-memory store for pending PKCE authorization codes (short-lived: 10 mins)
interface AuthCodeRecord {
  code: string;
  userId: string;
  clientId: string;
  redirectUri: string;
  codeChallenge?: string;
  expiresAt: number;
}
const authCodes = new Map<string, AuthCodeRecord>();

// --------------------------------------------------------------------------
// 1. RFC 9728: Protected Resource Metadata (PRM)
// Discovery endpoint that tells Claude / Cursor where the Authorization Server lives
// --------------------------------------------------------------------------
router.get("/.well-known/oauth-protected-resource", (_req: Request, res: Response) => {
  res.json({
    resource: `${API_BASE}/mcp`,
    authorization_servers: [API_BASE],
    scopes_supported: ["read", "write", "history"],
    bearer_methods_supported: ["header"],
  });
});

// --------------------------------------------------------------------------
// 2. RFC 8414: OAuth 2.0 Authorization Server Metadata
// --------------------------------------------------------------------------
router.get("/.well-known/oauth-authorization-server", (_req: Request, res: Response) => {
  res.json({
    issuer: API_BASE,
    authorization_endpoint: `${API_BASE}/oauth/authorize`,
    token_endpoint: `${API_BASE}/oauth/token`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "client_credentials"],
    code_challenge_methods_supported: ["S256", "plain"],
    token_endpoint_auth_methods_supported: ["none", "client_secret_basic", "client_secret_post"],
    registration_endpoint: API_BASE + "/oauth/register",
  });
});

// RFC 7591: Dynamic Client Registration (DCR) for Claude Desktop
router.post("/oauth/register", (req: Request, res: Response) => {
  const clientId = uuidv4();
  res.status(201).json({
    client_id: clientId,
    client_name: req.body?.client_name || "Claude Desktop",
    redirect_uris: req.body?.redirect_uris || [],
    grant_types: ["authorization_code"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
  });
});

// --------------------------------------------------------------------------
// 3. OAuth 2.1 Browser Login / Authorization Screen: /oauth/authorize
// When Claude opens browser, user sees this clean login & consent dialog
// --------------------------------------------------------------------------
router.get("/oauth/authorize", (req: Request, res: Response) => {
  const { client_id, redirect_uri, response_type, state, code_challenge, code_challenge_method } = req.query;

  // Render a clean HTML Login & Consent page directly
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Connect Claude to CONTINUUM</title>
  <style>
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #0d0f14; color: #e2e8f0; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; }
    .card { background: #161b25; border: 1px solid #2a3348; border-radius: 12px; padding: 32px; width: 100%; max-width: 420px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .brand { font-size: 20px; font-weight: 700; color: #38bdf8; text-align: center; margin-bottom: 8px; }
    .tagline { color: #8895ae; font-size: 13px; text-align: center; margin-bottom: 24px; }
    .agent-prompt { background: #1e2535; border-radius: 8px; padding: 12px; font-size: 13px; margin-bottom: 20px; border-left: 4px solid #38bdf8; }
    .form-group { margin-bottom: 16px; }
    label { display: block; font-size: 12px; font-weight: 600; color: #8895ae; margin-bottom: 6px; }
    input { width: 100%; background: #0d0f14; border: 1px solid #2a3348; border-radius: 6px; padding: 10px 12px; color: #fff; font-size: 14px; outline: none; }
    input:focus { border-color: #38bdf8; }
    .btn { width: 100%; background: #38bdf8; color: #000; font-weight: 700; border: none; border-radius: 6px; padding: 12px; cursor: pointer; font-size: 14px; margin-top: 8px; }
    .btn:hover { opacity: 0.9; }
    .error { background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #ef4444; padding: 10px; border-radius: 6px; font-size: 13px; margin-bottom: 16px; display: none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">● CONTINUUM</div>
    <div class="tagline">Memory that outlives the session</div>

    <div class="agent-prompt">
      🤖 <strong>Claude Desktop</strong> is requesting access to read and record run diagnostics in your CONTINUUM workspace.
    </div>

    <div id="errorBox" class="error"></div>

    <form id="authForm" method="POST" action="/oauth/authorize">
      <input type="hidden" name="client_id" value="${client_id || "claude-client"}">
      <input type="hidden" name="redirect_uri" value="${redirect_uri || ""}">
      <input type="hidden" name="state" value="${state || ""}">
      <input type="hidden" name="code_challenge" value="${code_challenge || ""}">
      <input type="hidden" name="code_challenge_method" value="${code_challenge_method || ""}">

      <div class="form-group">
        <label>CONTINUUM Email</label>
        <input type="email" name="email" required placeholder="matin@gmail.com" />
      </div>

      <div class="form-group">
        <label>Password</label>
        <input type="password" name="password" required placeholder="••••••••" />
      </div>

      <button type="submit" class="btn">Authorize Claude</button>
    </form>
  </div>
</body>
</html>`);
});

// POST /oauth/authorize — User signs in, receives auth code redirect
router.post("/oauth/authorize", async (req: Request, res: Response) => {
  try {
    const { email, password, redirect_uri, state, code_challenge, client_id } = req.body;

    const col = getCollection<User>("users");
    const user = await col.findOne({ email: String(email).toLowerCase().trim() } as any);

    if (!user) {
      return res.status(401).send("Invalid email or password. Please go back and try again.");
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).send("Invalid email or password. Please go back and try again.");
    }

    // Generate authorization code
    const code = "auth_" + uuidv4().replace(/-/g, "");
    authCodes.set(code, {
      code,
      userId: user._id,
      clientId: client_id || "claude-client",
      redirectUri: redirect_uri,
      codeChallenge: code_challenge,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    if (redirect_uri) {
      const redirectUrl = new URL(redirect_uri);
      redirectUrl.searchParams.set("code", code);
      if (state) redirectUrl.searchParams.set("state", String(state));
      return res.redirect(redirectUrl.toString());
    }

    // If no redirect URI provided (manual entry), show code on screen
    res.send(`
      <body style="background:#0d0f14;color:#fff;font-family:sans-serif;padding:40px;text-align:center;">
        <h2 style="color:#38bdf8;">Authorization Successful!</h2>
        <p>Copy this code and paste it back into your application if prompted:</p>
        <code style="background:#1e2535;padding:10px 20px;font-size:18px;border-radius:6px;display:inline-block;margin:20px;">${code}</code>
      </body>
    `);
  } catch (err: any) {
    res.status(500).send("Authorization error: " + err.message);
  }
});

// --------------------------------------------------------------------------
// 4. Token Exchange: /oauth/token
// Claude exchanges the code for a cryptographically signed Access Token
// --------------------------------------------------------------------------
router.post("/oauth/token", async (req: Request, res: Response) => {
  try {
    const { grant_type, code, redirect_uri } = req.body;

    if (grant_type !== "authorization_code") {
      return res.status(400).json({ error: "unsupported_grant_type" });
    }

    const record = authCodes.get(code);
    if (!record || record.expiresAt < Date.now()) {
      return res.status(400).json({ error: "invalid_grant", error_description: "Code expired or invalid" });
    }

    authCodes.delete(code); // One-time use

    // Issue standard OAuth 2.1 Access Token bound to the user
    const access_token = jwt.sign(
      { userId: record.userId, client_id: record.clientId },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      access_token,
      token_type: "Bearer",
      expires_in: 30 * 24 * 3600,
      scope: "read write history",
    });
  } catch (err: any) {
    res.status(500).json({ error: "server_error", error_description: err.message });
  }
});

export default router;
