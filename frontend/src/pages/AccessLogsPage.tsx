import React from "react";

export const AccessLogsPage: React.FC = () => {
  const logs = [
    { id: 1, user: "admin@example.com", action: "Login", ip: "192.168.1.100", timestamp: "2024-12-05 10:30:15", status: "success" },
    { id: 2, user: "manager@example.com", action: "View Employee", ip: "192.168.1.105", timestamp: "2024-12-05 09:15:42", status: "success" },
    { id: 3, user: "unknown@example.com", action: "Login", ip: "203.45.67.89", timestamp: "2024-12-05 08:20:11", status: "failed" },
    { id: 4, user: "admin@example.com", action: "Create Employee", ip: "192.168.1.100", timestamp: "2024-12-04 16:45:30", status: "success" },
    { id: 5, user: "employee@example.com", action: "Login", ip: "192.168.1.112", timestamp: "2024-12-04 14:22:05", status: "success" },
  ];

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Access Logs</h1>
      <p>Monitor system access and security events.</p>

      <div style={{ marginTop: "2rem", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "white", borderRadius: "8px", overflow: "hidden", border: "1px solid #e5e7eb" }}>
          <thead style={{ background: "#f9fafb" }}>
            <tr>
              <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>ID</th>
              <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>User</th>
              <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Action</th>
              <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>IP Address</th>
              <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Timestamp</th>
              <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb" }}>{log.id}</td>
                <td style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb" }}>{log.user}</td>
                <td style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb" }}>{log.action}</td>
                <td style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb", fontFamily: "monospace" }}>{log.ip}</td>
                <td style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb" }}>{log.timestamp}</td>
                <td style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb" }}>
                  <span style={{ 
                    padding: "0.25rem 0.75rem", 
                    background: log.status === "success" ? "#d1fae5" : "#fee2e2", 
                    color: log.status === "success" ? "#065f46" : "#991b1b", 
                    borderRadius: "12px",
                    fontSize: "0.875rem",
                    textTransform: "capitalize"
                  }}>
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
