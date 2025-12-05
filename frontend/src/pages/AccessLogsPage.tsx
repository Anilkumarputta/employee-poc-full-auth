import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../auth/authContext";
import { graphqlRequest } from "../lib/graphqlClient";

type AccessLog = {
  id: number;
  userId: number;
  userEmail: string;
  action: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
};

const ACCESS_LOGS_QUERY = `
  query AccessLogs($page: Int, $pageSize: Int) {
    accessLogs(page: $page, pageSize: $pageSize) {
      id
      userId
      userEmail
      action
      details
      ipAddress
      createdAt
    }
  }
`;

export const AccessLogsPage: React.FC = () => {
  const { accessToken, user } = useContext(AuthContext);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data: any = await graphqlRequest(ACCESS_LOGS_QUERY, { page: 1, pageSize: 50 }, accessToken);
      setLogs(data.accessLogs);
    } catch (err) {
      console.error("Failed to fetch access logs:", err);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== "admin") {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>Access Logs</h1>
        <div style={{ marginTop: "2rem", padding: "2rem", background: "#fee2e2", border: "1px solid #fecaca", borderRadius: "8px" }}>
          <h2 style={{ margin: "0 0 1rem 0", color: "#991b1b" }}>Access Denied</h2>
          <p style={{ color: "#7f1d1d", margin: 0 }}>
            Only administrators can view access logs.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>Access Logs</h1>
        <p>Loading access logs...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ margin: 0 }}>Access Logs</h1>
          <p style={{ margin: "0.5rem 0 0 0", color: "#6b7280" }}>Monitor system access and security events</p>
        </div>
        <button onClick={fetchLogs} style={{ padding: "0.5rem 1rem", background: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
          Refresh
        </button>
      </div>

      <div style={{ marginTop: "2rem", overflowX: "auto" }}>
        {logs.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", background: "white", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
            <p style={{ color: "#6b7280", margin: 0 }}>No access logs found</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", background: "white", borderRadius: "8px", overflow: "hidden", border: "1px solid #e5e7eb" }}>
            <thead style={{ background: "#f9fafb" }}>
              <tr>
                <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>ID</th>
                <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>User</th>
                <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Action</th>
                <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Details</th>
                <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb" }}>{log.id}</td>
                  <td style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb" }}>{log.userEmail}</td>
                  <td style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb" }}>
                    <span style={{ padding: "0.25rem 0.75rem", background: "#dbeafe", color: "#1e40af", borderRadius: "12px", fontSize: "0.875rem" }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb", color: "#6b7280" }}>{log.details || "-"}</td>
                  <td style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb" }}>{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
