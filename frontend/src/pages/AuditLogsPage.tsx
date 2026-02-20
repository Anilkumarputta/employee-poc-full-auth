import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../auth/authContext";
import { graphqlRequest } from "../lib/graphqlClient";

type AccessLog = {
  id: number;
  userEmail: string;
  action: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
};

type AuditLogsQueryResult = {
  accessLogs: AccessLog[];
};

const AUDIT_LOGS_QUERY = `
  query AuditLogs($page: Int, $pageSize: Int) {
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

const formatDetails = (details: string | null): string => {
  if (!details) return "-";
  try {
    const parsed = JSON.parse(details);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return details;
  }
};

export const AuditLogsPage: React.FC = () => {
  const { user, accessToken } = useContext(AuthContext);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);

  useEffect(() => {
    void fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    if (!accessToken) {
      setLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const result = await graphqlRequest<AuditLogsQueryResult>(
        AUDIT_LOGS_QUERY,
        { page, pageSize },
        accessToken,
      );
      setLogs(result.accessLogs || []);
    } finally {
      setLoading(false);
    }
  };

  const normalizedSearch = search.toLowerCase();
  const filteredLogs = logs.filter(
    (log) =>
      log.userEmail.toLowerCase().includes(normalizedSearch) ||
      log.action.toLowerCase().includes(normalizedSearch) ||
      (log.details && log.details.toLowerCase().includes(normalizedSearch)),
  );

  if (!user || (user.role !== "director" && user.role !== "manager")) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2>Access Denied</h2>
        <p>Only Directors and Managers can view audit logs.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", background: "#f5f7fa", minHeight: "100vh" }}>
      <h1 style={{ margin: 0, color: "#111827", fontSize: "2rem" }}>Audit Logs</h1>
      <p style={{ margin: "0.5rem 0 2rem 0", color: "#6b7280" }}>
        Track all key actions by users for security and compliance.
      </p>
      <input
        type="text"
        placeholder="Search by user, action, or details..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ padding: "0.5rem", width: "300px", marginBottom: "1rem" }}
      />
      {loading ? (
        <p>Loading logs...</p>
      ) : (
        <table style={{ width: "100%", background: "white", borderRadius: "8px", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#e5e7eb" }}>
              <th style={{ padding: "0.75rem" }}>Time</th>
              <th style={{ padding: "0.75rem" }}>User</th>
              <th style={{ padding: "0.75rem" }}>Action</th>
              <th style={{ padding: "0.75rem" }}>Details</th>
              <th style={{ padding: "0.75rem" }}>IP</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "2rem" }}>
                  No logs found.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "0.75rem", color: "#6b7280" }}>{new Date(log.createdAt).toLocaleString()}</td>
                  <td style={{ padding: "0.75rem" }}>{log.userEmail}</td>
                  <td style={{ padding: "0.75rem", fontWeight: "bold" }}>{log.action}</td>
                  <td style={{ padding: "0.75rem", maxWidth: "420px" }}>
                    <details>
                      <summary style={{ cursor: "pointer", color: "#2563eb", fontWeight: 600 }}>View</summary>
                      <pre
                        style={{
                          marginTop: "0.5rem",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: "6px",
                          padding: "0.6rem",
                          fontSize: "0.75rem",
                        }}
                      >
                        {formatDetails(log.details)}
                      </pre>
                    </details>
                  </td>
                  <td style={{ padding: "0.75rem" }}>{log.ipAddress || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
      <div style={{ marginTop: "2rem", display: "flex", justifyContent: "center", gap: "1rem" }}>
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          style={{
            padding: "0.5rem 1rem",
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: page === 1 ? "not-allowed" : "pointer",
          }}
        >
          Previous
        </button>
        <span>Page {page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          style={{
            padding: "0.5rem 1rem",
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
};
