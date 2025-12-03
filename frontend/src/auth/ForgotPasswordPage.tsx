import React, { useState } from "react";
import { apiForgotPassword } from "./api";

type Props = {
  goLogin: () => void;
};

export const ForgotPasswordPage: React.FC<Props> = ({ goLogin }) => {
  const [email, setEmail] = useState("admin@example.com");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    try {
      await apiForgotPassword(email);
      setStatus("If this email exists, a reset link has been sent.");
    } catch (err: any) {
      setStatus("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h1>Forgot password</h1>
      <p className="auth-subtitle">
        Enter your email address and we&apos;ll send a reset link.
      </p>

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

        {status && <div className="auth-info">{status}</div>}

        <button type="submit" className="primary-btn" disabled={loading}>
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>

      <div className="auth-footer">
        <button type="button" className="link-btn" onClick={goLogin}>
          Back to sign in
        </button>
      </div>
    </div>
  );
};
