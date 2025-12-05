import React, { useState } from "react";

export const PreferencesPage: React.FC = () => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [theme, setTheme] = useState("light");

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Preferences</h1>
      <p>Customize your application settings and preferences.</p>

      <div style={{ marginTop: "2rem", maxWidth: "600px" }}>
        <div style={{ padding: "2rem", background: "white", borderRadius: "8px", border: "1px solid #e5e7eb", marginBottom: "1rem" }}>
          <h3 style={{ margin: "0 0 1rem 0" }}>Notifications</h3>
          
          <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label style={{ fontWeight: "500", color: "#374151" }}>Email Notifications</label>
            <input 
              type="checkbox" 
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              style={{ width: "20px", height: "20px", cursor: "pointer" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label style={{ fontWeight: "500", color: "#374151" }}>Push Notifications</label>
            <input 
              type="checkbox" 
              checked={pushNotifications}
              onChange={(e) => setPushNotifications(e.target.checked)}
              style={{ width: "20px", height: "20px", cursor: "pointer" }}
            />
          </div>
        </div>

        <div style={{ padding: "2rem", background: "white", borderRadius: "8px", border: "1px solid #e5e7eb", marginBottom: "1rem" }}>
          <h3 style={{ margin: "0 0 1rem 0" }}>Appearance</h3>
          
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", color: "#374151" }}>
              Theme
            </label>
            <select 
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "6px" }}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>
        </div>

        <div style={{ padding: "2rem", background: "white", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
          <h3 style={{ margin: "0 0 1rem 0" }}>Language & Region</h3>
          
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", color: "#374151" }}>
              Language
            </label>
            <select 
              style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "6px" }}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", color: "#374151" }}>
              Timezone
            </label>
            <select 
              style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "6px" }}
            >
              <option value="utc">UTC</option>
              <option value="est">Eastern Time (EST)</option>
              <option value="pst">Pacific Time (PST)</option>
            </select>
          </div>
        </div>

        <button 
          style={{ 
            marginTop: "1rem",
            padding: "0.75rem 1.5rem", 
            background: "#3b82f6", 
            color: "white", 
            border: "none", 
            borderRadius: "6px", 
            cursor: "pointer"
          }}
          onClick={() => alert("Settings saved!")}
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
};
