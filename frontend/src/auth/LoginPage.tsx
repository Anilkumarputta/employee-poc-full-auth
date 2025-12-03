import React, { useContext, useState } from "react";
import { AuthContext } from "./authContext";
import { apiLogin, apiGoogleLogin } from "./api";

type Props = {
  goRegister: () => void;
  goForgot: () => void;
};

export const LoginPage: React.FC<Props> = ({ goRegister, goForgot }) => {
  const { setAuth } = useContext(AuthContext);
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiLogin(email, password);
      setAuth({
        user: { id: res.user.id, email: res.user.email, role: res.user.role },
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
        user: { id: res.user.id, email: res.user.email, role: res.user.role },
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      });
    } catch (err: any) {
      setError(err.message || "Google login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h1>Employee POC</h1>
      <p className="auth-subtitle">Sign in to manage employees.</p>

      <form onSubmit={onSubmit} className="auth-form">
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <div className="auth-error">{error}</div>}

        <button type="submit" className="primary-btn" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <button
          type="button"
          className="secondary-btn"
          onClick={onGoogleDemo}
          disabled={loading}
        >
          Continue with Google (demo)
        </button>
      </form>

      <div className="auth-footer">
        <button type="button" className="link-btn" onClick={goForgot}>
          Forgot password?
        </button>
        <span> · </span>
        <button type="button" className="link-btn" onClick={goRegister}>
          Create account
        </button>
      </div>
    </div>
  );
};
