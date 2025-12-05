import React, { useContext } from "react";
import { AuthContext } from "../auth/authContext";

export const ProfilePage: React.FC = () => {
  const { user } = useContext(AuthContext);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Profile</h1>
      <p>View and manage your profile information.</p>

      <div style={{ marginTop: "2rem", maxWidth: "600px" }}>
        <div style={{ padding: "2rem", background: "white", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", color: "#374151" }}>
              Email
            </label>
            <input 
              type="email" 
              value={user?.email || ""} 
              disabled 
              style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "6px", background: "#f9fafb" }}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", color: "#374151" }}>
              Role
            </label>
            <input 
              type="text" 
              value={user?.role || ""} 
              disabled 
              style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "6px", background: "#f9fafb", textTransform: "capitalize" }}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", color: "#374151" }}>
              User ID
            </label>
            <input 
              type="text" 
              value={user?.id || ""} 
              disabled 
              style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "6px", background: "#f9fafb" }}
            />
          </div>

          <button 
            style={{ 
              padding: "0.75rem 1.5rem", 
              background: "#3b82f6", 
              color: "white", 
              border: "none", 
              borderRadius: "6px", 
              cursor: "pointer",
              marginRight: "1rem"
            }}
            onClick={() => alert("Change password functionality would be implemented here")}
          >
            Change Password
          </button>
          
          <button 
            style={{ 
              padding: "0.75rem 1.5rem", 
              background: "#6b7280", 
              color: "white", 
              border: "none", 
              borderRadius: "6px", 
              cursor: "pointer"
            }}
            onClick={() => alert("Edit profile functionality would be implemented here")}
          >
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
};
