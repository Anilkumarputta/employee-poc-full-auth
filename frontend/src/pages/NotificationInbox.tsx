import React, { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../auth/authContext";
import { graphqlRequest } from "../lib/graphqlClient";
import { resolveAppPageFromLink } from "../lib/navigationLinks";
import type { AppPage } from "../types/navigation";

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
      actionUrl
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

const MARK_ALL_READ_MUTATION = `
  mutation MarkAllNotificationsAsRead {
    markAllNotificationsAsRead
  }
`;

type Notification = {
  id: number;
  title: string;
  message: string;
  type?: string;
  isRead: boolean;
  createdAt: string;
  linkTo?: string;
  actionUrl?: string;
};

type NotificationsQueryResult = {
  notifications: Notification[];
};

type NotificationInboxProps = {
  onNavigate?: (page: AppPage) => void;
};

const FILTER_TYPES = ["ALL", "INFO", "WARNING", "CRITICAL", "MESSAGE", "APPROVAL", "LEAVE"];

const typeLabel = (type?: string) => {
  const normalized = (type || "INFO").toUpperCase();
  switch (normalized) {
    case "CRITICAL":
      return "Critical";
    case "WARNING":
      return "Warning";
    case "APPROVAL":
      return "Approval";
    case "MESSAGE":
      return "Message";
    case "LEAVE":
      return "Leave";
    default:
      return "Info";
  }
};

const typeColor = (type?: string) => {
  const normalized = (type || "INFO").toUpperCase();
  switch (normalized) {
    case "CRITICAL":
      return "#dc2626";
    case "WARNING":
      return "#f59e0b";
    case "APPROVAL":
      return "#059669";
    case "MESSAGE":
      return "#2563eb";
    case "LEAVE":
      return "#7c3aed";
    default:
      return "#64748b";
  }
};

export const NotificationInbox: React.FC<NotificationInboxProps> = ({ onNavigate }) => {
  const { accessToken } = useContext(AuthContext);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("ALL");
  const [filterRead, setFilterRead] = useState<"all" | "read" | "unread">("all");
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    void fetchNotifications();
  }, [filterType, filterRead, accessToken]);

  const fetchNotifications = async () => {
    if (!accessToken) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorText(null);

    try {
      const type = filterType === "ALL" ? undefined : filterType;
      const isRead = filterRead === "all" ? undefined : filterRead === "read";
      const result = await graphqlRequest<NotificationsQueryResult>(NOTIFICATIONS_QUERY, { type, isRead }, accessToken);
      setNotifications(result.notifications || []);
    } catch (error: any) {
      setErrorText(error?.message || "Failed to load notifications.");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = useMemo(() => notifications.filter((note) => !note.isRead).length, [notifications]);

  const groupedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const note of notifications) {
      const normalized = (note.type || "INFO").toUpperCase();
      counts[normalized] = (counts[normalized] || 0) + 1;
    }
    return counts;
  }, [notifications]);

  const resolveNavigationLink = (note: Notification): AppPage | null => {
    return resolveAppPageFromLink(note.linkTo || note.actionUrl);
  };

  const markAsRead = async (id: number) => {
    if (!accessToken) {
      return;
    }

    try {
      await graphqlRequest(MARK_READ_MUTATION, { id }, accessToken);
      setNotifications((previous) => previous.map((item) => (item.id === id ? { ...item, isRead: true } : item)));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!accessToken || unreadCount === 0) {
      return;
    }

    try {
      await graphqlRequest(MARK_ALL_READ_MUTATION, {}, accessToken);
      setNotifications((previous) => previous.map((item) => ({ ...item, isRead: true })));
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  return (
    <div style={{ padding: "2rem", background: "#f5f7fa", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, color: "#111827", fontSize: "2rem" }}>Notification Inbox</h1>
          <p style={{ margin: "0.35rem 0 0 0", color: "#64748b" }}>
            {unreadCount > 0 ? `${unreadCount} unread notifications` : "All notifications are read"}
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => {
              void fetchNotifications();
            }}
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              background: "#ffffff",
              color: "#1f2937",
              padding: "0.55rem 0.9rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              void markAllAsRead();
            }}
            disabled={unreadCount === 0}
            style={{
              border: "none",
              borderRadius: "8px",
              background: unreadCount === 0 ? "#94a3b8" : "#1d4ed8",
              color: "#ffffff",
              padding: "0.55rem 0.9rem",
              fontWeight: 700,
              cursor: unreadCount === 0 ? "not-allowed" : "pointer",
            }}
          >
            Mark all as read
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <div>
          <label style={{ fontWeight: 700, marginRight: "0.4rem", color: "#334155" }}>Type</label>
          <select
            value={filterType}
            onChange={(event) => setFilterType(event.target.value)}
            style={{ border: "1px solid #cbd5e1", borderRadius: "8px", padding: "0.5rem 0.6rem" }}
          >
            {FILTER_TYPES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontWeight: 700, marginRight: "0.4rem", color: "#334155" }}>Status</label>
          <select
            value={filterRead}
            onChange={(event) => setFilterRead(event.target.value as "all" | "read" | "unread")}
            style={{ border: "1px solid #cbd5e1", borderRadius: "8px", padding: "0.5rem 0.6rem" }}
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {Object.entries(groupedCounts).map(([type, count]) => (
          <span
            key={type}
            style={{
              background: `${typeColor(type)}18`,
              border: `1px solid ${typeColor(type)}66`,
              color: typeColor(type),
              borderRadius: "999px",
              padding: "0.32rem 0.7rem",
              fontSize: "0.78rem",
              fontWeight: 800,
            }}
          >
            {typeLabel(type)}: {count}
          </span>
        ))}
      </div>

      {errorText && (
        <div style={{ marginBottom: "1rem", background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: "8px", padding: "0.75rem 0.9rem" }}>
          {errorText}
        </div>
      )}

      {loading ? (
        <p style={{ color: "#64748b" }}>Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <div style={{ padding: "2rem", textAlign: "center", background: "white", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
          <p style={{ color: "#6b7280", margin: 0 }}>No notifications found</p>
        </div>
      ) : (
        <div style={{ marginTop: "1rem" }}>
          {notifications.map((note) => {
            const targetPage = resolveNavigationLink(note);
            return (
              <div
                key={note.id}
                style={{
                  padding: "1rem",
                  background: note.isRead ? "#ffffff" : "#eff6ff",
                  borderRadius: "10px",
                  border: `1px solid ${note.isRead ? "#e5e7eb" : "#bfdbfe"}`,
                  marginBottom: "0.8rem",
                  boxShadow: note.isRead ? "none" : "0 2px 8px rgba(37,99,235,0.12)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "0.8rem" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.35rem", flexWrap: "wrap" }}>
                      <span
                        style={{
                          background: `${typeColor(note.type)}18`,
                          color: typeColor(note.type),
                          borderRadius: "999px",
                          padding: "0.24rem 0.55rem",
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          border: `1px solid ${typeColor(note.type)}66`,
                        }}
                      >
                        {typeLabel(note.type)}
                      </span>
                      <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>{new Date(note.createdAt).toLocaleString("en-US")}</span>
                      {!note.isRead && <span style={{ width: "8px", height: "8px", background: "#2563eb", borderRadius: "50%" }} />}
                    </div>

                    <div style={{ fontWeight: 800, color: "#1f2937", marginBottom: "0.3rem" }}>{note.title}</div>
                    <p style={{ margin: 0, color: "#475569", lineHeight: 1.55 }}>{note.message}</p>

                    {targetPage && onNavigate && (
                      <button
                        type="button"
                        onClick={() => onNavigate(targetPage)}
                        style={{
                          marginTop: "0.55rem",
                          border: "none",
                          background: "transparent",
                          color: "#2563eb",
                          textDecoration: "underline",
                          fontWeight: 700,
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        Open related page
                      </button>
                    )}
                  </div>

                  {!note.isRead && (
                    <button
                      type="button"
                      onClick={() => {
                        void markAsRead(note.id);
                      }}
                      style={{
                        border: "none",
                        background: "#1d4ed8",
                        color: "#ffffff",
                        borderRadius: "8px",
                        padding: "0.45rem 0.65rem",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
