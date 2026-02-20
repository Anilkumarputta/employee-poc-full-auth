import React, { useContext, useEffect, useState } from "react";
import "./login-animated.css";
import { AuthContext } from "./authContext";
import { apiLogin, apiGoogleLogin, toFrontendRole } from "./api";
import { API_URL } from "../config/api";
import {
  getCurrentFestivalTheme,
  FESTIVAL_THEMES,
  setFestivalDemoOverride,
} from "../festivalThemes";

type Props = {
  goRegister: () => void;
  goForgot: () => void;
};

export const LoginPage: React.FC<Props> = ({ goRegister, goForgot }) => {
  const { setAuth } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoFestival, setDemoFestival] = useState<string>("");
  const festival = getCurrentFestivalTheme();

  useEffect(() => {
    // Warm up backend while user is on login screen to reduce first-login delay.
    fetch(`${API_URL}/health`, { method: "GET", cache: "no-store" }).catch(() => {});
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiLogin(email, password);
      setAuth({
        user: { id: res.user.id, email: res.user.email, role: toFrontendRole(res.user.role) },
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      });
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const onGoogleDemo = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await apiGoogleLogin("google-demo@example.com", "Google Demo");
      setAuth({
        user: { id: res.user.id, email: res.user.email, role: toFrontendRole(res.user.role) },
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      });
    } catch (err: any) {
      setError(err.message || "Google login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    setDemoFestival(name);
    setFestivalDemoOverride(name ? { name } : null);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: festival
          ? `linear-gradient(135deg, ${festival.colors[0]} 0%, ${festival.colors[1]} 100%)`
          : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "clamp(16px, 4vw, 32px)",
        transition: "background 0.5s",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "20px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          padding: "clamp(28px, 5vw, 50px) clamp(22px, 6vw, 60px)",
          maxWidth: "520px",
          width: "100%",
        }}
      >
        <div style={{ marginBottom: 16, textAlign: "center" }}>
          <label style={{ fontSize: 14, color: "#888" }}>
            Demo Festival Theme:
            <select value={demoFestival} onChange={handleDemoChange} style={{ marginLeft: 8, padding: 4 }}>
              <option value="">(Auto)</option>
              {FESTIVAL_THEMES.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {festival && (
          <div
            style={{
              background: festival.colors[1],
              color: festival.colors[2],
              borderRadius: "12px",
              padding: "12px",
              textAlign: "center",
              marginBottom: "24px",
              fontWeight: 600,
              fontSize: "1.2rem",
              letterSpacing: "0.5px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            {festival.greeting}
          </div>
        )}

        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div
            style={{
              width: "80px",
              height: "80px",
              margin: "0 auto 20px",
              background: festival
                ? `linear-gradient(135deg, ${festival.colors[0]} 0%, ${festival.colors[1]} 100%)`
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              boxShadow: festival
                ? `0 10px 25px ${festival.colors[0]}33`
                : "0 10px 25px rgba(102, 126, 234, 0.3)",
              overflow: "hidden",
            }}
          >
            <img
              src="/logo.svg"
              alt="PulseDesk logo"
              style={{ width: "54px", height: "54px", objectFit: "contain" }}
            />
          </div>
          <h1 className="animated-employee-poc" style={{ margin: 0 }}>
            PulseDesk
          </h1>
          <p
            style={{
              margin: "10px 0 0 0",
              color: "#7f8c8d",
              fontSize: "16px",
            }}
          >
            Sign in to access your portal
          </p>
        </div>

        <form onSubmit={onSubmit} className="auth-form" autoComplete="off">
          <label>
            Email
            <input
              name="loginEmail"
              type="email"
              autoComplete="off"
              data-lpignore="true"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              name="loginPassword"
              type="password"
              autoComplete="off"
              data-lpignore="true"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <button type="button" className="secondary-btn" onClick={onGoogleDemo} disabled={loading}>
            Continue with Google (demo)
          </button>
        </form>

        <div className="auth-footer">
          <button type="button" className="link-btn" onClick={goForgot}>
            Forgot password?
          </button>
          <span> | </span>
          <button type="button" className="link-btn" onClick={goRegister}>
            Create account
          </button>
        </div>
      </div>
    </div>
  );
};


