import React, { useContext } from "react";
import { AuthContext } from "../auth/authContext";
import { Link } from "react-router-dom";

const EmployeeSelfServicePortal: React.FC = () => {
  const { user } = useContext(AuthContext);

  return (
    <div style={{ padding: "2rem", maxWidth: 700, margin: "0 auto" }}>
      <h1>Employee Self-Service Portal</h1>
      <div style={{ marginBottom: "2rem" }}>
        <h2>Welcome, {user?.email}</h2>
        <p>Role: {user?.role}</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        <Link to="/profile" style={cardStyle}>Edit Profile</Link>
        <Link to="/leaveRequests" style={cardStyle}>Request Leave</Link>
        <Link to="/messages" style={cardStyle}>View Messages</Link>
        <Link to="/notificationInbox" style={cardStyle}>Notifications</Link>
        <Link to="/analyticsDashboard" style={cardStyle}>Performance & Attendance</Link>
      </div>
    </div>
  );
};

const cardStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f7f9fc",
  borderRadius: "12px",
  padding: "2rem",
  fontSize: "1.2rem",
  color: "#667eea",
  textDecoration: "none",
  fontWeight: 600,
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  transition: "background 0.2s",
};

export default EmployeeSelfServicePortal;
