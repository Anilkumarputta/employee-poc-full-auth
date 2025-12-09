import React, { useContext, useState } from "react";
import { AuthContext } from "./authContext";
import { apiLogin, apiGoogleLogin } from "./api";

type Props = {
  goRegister: () => void;
  goForgot: () => void;
};

export const LoginPage: React.FC<Props> = ({ goRegister, goForgot }) => {
  const { setAuth } = useContext(AuthContext);
  const [email, setEmail] = useState("director@example.com");
  const [password, setPassword] = useState("director123");
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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        padding: '50px 60px',
        maxWidth: '480px',
        width: '100%'
      }}>
        {/* Logo/Title */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)'
          }}>
            👥
          </div>
          <h1 style={{ 
            margin: 0, 
            fontSize: '32px', 
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Employee POC
          </h1>
          <p style={{ 
            margin: '10px 0 0 0', 
            color: '#7f8c8d',
            fontSize: '16px'
          }}>
            Sign in to access your portal
          </p>
        </div>

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
    </div>
  );
};
