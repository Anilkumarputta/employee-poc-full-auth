import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../auth/authContext";
import { graphqlRequest } from "../lib/graphqlClient";

const NOTIFICATIONS_QUERY = `
  query Notifications($type: String, $isRead: Boolean) {
    notifications(type: $type, isRead: $isRead) {
      id
      title
      message
      type
      isRead
      createdAt
      linkTo
    }
  }
`;

const MARK_READ_MUTATION = `
  mutation MarkNotificationAsRead($id: Int!) {
    markNotificationAsRead(id: $id) {
      id
      isRead
    }
  }
`;

const types = ["ALL", "INFO", "WARNING", "CRITICAL", "MESSAGE", "APPROVAL"];

export const NotificationInbox: React.FC = () => {
  const { accessToken } = useContext(AuthContext);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("ALL");
  const [filterRead, setFilterRead] = useState("");

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line
  }, [filterType, filterRead]);

  const fetchNotifications = async () => {
    setLoading(true);
    const type = filterType === "ALL" ? undefined : filterType;
    const isRead = filterRead === "" ? undefined : filterRead === "read";
    const result = await graphqlRequest(NOTIFICATIONS_QUERY, { type, isRead }, accessToken);
    setNotifications(result.data.notifications || []);
    setLoading(false);
  };

  const markAsRead = async (id: number) => {
    await graphqlRequest(MARK_READ_MUTATION, { id }, accessToken);
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  return (
    <div style={{ padding: "2rem", background: "#f5f7fa", minHeight: "100vh" }}>
      <h1 style={{ margin: 0, color: "#111827", fontSize: "2rem" }}>Notification Inbox</h1>
      <div style={{ display: "flex", gap: "2rem", margin: "2rem 0" }}>
        <div>
          <label>Type:</label>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ marginLeft: "1rem", padding: "0.5rem" }}>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label>Status:</label>
          <select value={filterRead} onChange={e => setFilterRead(e.target.value)} style={{ marginLeft: "1rem", padding: "0.5rem" }}>
            <option value="">All</option>
            <option value="read">Read</option>
            <option value="unread">Unread</option>
          </select>
        </div>
      </div>
      {loading ? (
        <p>Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <div style={{ padding: "3rem", textAlign: "center", background: "white", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
          <p style={{ color: "#6b7280", margin: 0 }}>No notifications found</p>
        </div>
      ) : (
        <div style={{ marginTop: "2rem" }}>
          {notifications.map(note => (
            <div
              key={note.id}
              style={{
                padding: "1.5rem",
                background: note.isRead ? "white" : "#eff6ff",
                borderRadius: "8px",
                border: `1px solid ${note.isRead ? "#e5e7eb" : "#93c5fd"}`,
                marginBottom: "1rem",
                position: "relative"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    {!note.isRead && (
                      <span style={{ width: "8px", height: "8px", background: "#3b82f6", borderRadius: "50%" }} />
                    )}
                    <span style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                      {note.type === "CRITICAL" && "🔴 Critical"}
                      {note.type === "WARNING" && "⚠️ Warning"}
                      {note.type === "APPROVAL" && "✅ Approval"}
                      {note.type === "MESSAGE" && "💬 Message"}
                      {note.type === "INFO" && "ℹ️ Info"}
                      {note.type === undefined && "Notification"}
                    </span>
                    <span style={{ color: "#9ca3af", fontSize: "0.875rem" }}>•</span>
                    <span style={{ color: "#9ca3af", fontSize: "0.875rem" }}>
                      {new Date(note.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontWeight: "bold", color: "#374151" }}>{note.title}</div>
                  <p style={{ margin: "0.5rem 0 0 0", color: "#374151", lineHeight: "1.6" }}>
                    {note.message}
                  </p>
                  {note.linkTo && (
                    <a href={note.linkTo} style={{ color: "#2563eb", textDecoration: "underline" }}>Go to page</a>
                  )}
                </div>
                {!note.isRead && (
                  <button
                    onClick={() => markAsRead(note.id)}
                    style={{
                      padding: "0.25rem 0.75rem",
                      background: "#3b82f6",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      marginLeft: "1rem"
                    }}
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
