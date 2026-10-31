import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../api";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = isRegister
        ? await registerUser(email, password, name)
        : await loginUser(email, password);

      if (res.ok) {
        navigate("/");
      } else {
        setError(res.data?.error || "Authentication failed");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>{isRegister ? "Create Continuum Account" : "Sign in to Continuum"}</h2>
        <p className="login-subtitle">Memory that outlives the session</p>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {isRegister && (
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                placeholder="Developer Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              required
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Processing..." : isRegister ? "Register" : "Sign In"}
          </button>
        </form>

        <div className="auth-toggle">
          {isRegister ? (
            <p>
              Already have an account?{" "}
              <button className="btn-link" onClick={() => setIsRegister(false)}>
                Sign in
              </button>
            </p>
          ) : (
            <p>
              New here?{" "}
              <button className="btn-link" onClick={() => setIsRegister(true)}>
                Create an account
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
