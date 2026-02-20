import React, { useContext, useState } from "react";
import { AuthContext } from "./authContext";
import { apiRegister, toFrontendRole, type BackendAuthRole } from "./api";

type Props = {
  goLogin: () => void;
};

export const RegisterPage: React.FC<Props> = ({ goLogin }) => {
  const { setAuth } = useContext(AuthContext);
  const [email, setEmail] = useState("director@example.com");
  const [password, setPassword] = useState("password123");
  const [role, setRole] = useState<BackendAuthRole>("director");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiRegister(email, password, role);
      setAuth({
        user: { id: res.user.id, email: res.user.email, role: toFrontendRole(res.user.role) },
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      });
    } catch (err: any) {
      setError(err.message || "Register failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h1>Create account</h1>
      <p className="auth-subtitle">Set up a director, manager, or employee profile.</p>

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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <label>
          Role
          <select value={role} onChange={(e) => setRole(e.target.value as BackendAuthRole)}>
            <option value="director">Director</option>
            <option value="manager">Manager</option>
            <option value="employee">Employee</option>
          </select>
        </label>

        {error && <div className="auth-error">{error}</div>}

        <button type="submit" className="primary-btn" disabled={loading}>
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>

      <div className="auth-footer">
        <button type="button" className="link-btn" onClick={goLogin}>
          Already have an account? Sign in
        </button>
      </div>
    </div>
  );
};
