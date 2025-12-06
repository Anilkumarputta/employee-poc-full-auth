import React, { useContext, useState } from "react";
import { AuthContext } from "../auth/authContext";
import { graphqlRequest } from "../lib/graphqlClient";

const CHANGE_PASSWORD_MUTATION = `
  mutation ChangePassword($currentPassword: String!, $newPassword: String!) {
    changePassword(currentPassword: $currentPassword, newPassword: $newPassword) {
      success
      message
    }
  }
`;

export const SettingsPage: React.FC = () => {
  const { accessToken, user } = useContext(AuthContext);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessageType("error");
      setMessage("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setMessageType("error");
      setMessage("New password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const data: any = await graphqlRequest(
        CHANGE_PASSWORD_MUTATION,
        { currentPassword, newPassword },
        accessToken!
      );

      if (data.changePassword.success) {
        setMessageType("success");
        setMessage(data.changePassword.message);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessageType("error");
        setMessage(data.changePassword.message);
      }
    } catch (err: any) {
      setMessageType("error");
      setMessage(err.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Account Settings</h1>
      <p>Manage your account security and preferences.</p>

      <div style={{ marginTop: "2rem", maxWidth: "600px" }}>
        <div style={{ padding: "2rem", background: "white", borderRadius: "8px", border: "1px solid #e5e7eb", marginBottom: "1.5rem" }}>
          <h3 style={{ margin: "0 0 0.5rem 0" }}>Account Information</h3>
          <p style={{ color: "#6b7280", marginBottom: "1rem" }}>Your current account details</p>
          
          <div style={{ padding: "1rem", background: "#f9fafb", borderRadius: "6px" }}>
            <p style={{ margin: "0 0 0.5rem 0", color: "#374151" }}>
              <strong>Email:</strong> {user?.email}
            </p>
            <p style={{ margin: 0, color: "#374151" }}>
              <strong>Role:</strong> <span style={{ 
                padding: "0.25rem 0.5rem", 
                background: user?.role === "director" ? "#dbeafe" : "#fef3c7",
                color: user?.role === "director" ? "#1e40af" : "#92400e",
                borderRadius: "4px",
                fontSize: "0.875rem"
              }}>{user?.role}</span>
            </p>
          </div>
        </div>

        <div style={{ padding: "2rem", background: "white", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
          <h3 style={{ margin: "0 0 0.5rem 0" }}>Change Password</h3>
          <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>Update your password to keep your account secure</p>

          {message && (
            <div style={{ 
              padding: "1rem", 
              marginBottom: "1rem", 
              background: messageType === "success" ? "#d1fae5" : "#fee2e2",
              border: `1px solid ${messageType === "success" ? "#10b981" : "#ef4444"}`,
              borderRadius: "6px",
              color: messageType === "success" ? "#065f46" : "#991b1b"
            }}>
              {message}
            </div>
          )}

          <form onSubmit={handleChangePassword}>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", color: "#374151" }}>
                Current Password
              </label>
              <input 
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={loading}
                style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "6px" }}
              />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", color: "#374151" }}>
                New Password
              </label>
              <input 
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
                style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "6px" }}
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", color: "#374151" }}>
                Confirm New Password
              </label>
              <input 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
                style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "6px" }}
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              style={{ 
                padding: "0.75rem 1.5rem", 
                background: loading ? "#9ca3af" : "#3b82f6", 
                color: "white", 
                border: "none", 
                borderRadius: "6px", 
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: "600"
              }}
            >
              {loading ? "Updating..." : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
