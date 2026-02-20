import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/authContext";
import { graphqlRequest } from "../lib/graphqlClient";
import { resolveAppPageFromLink } from "../lib/navigationLinks";
import type { AppPage } from "../types/navigation";

const NOTIFICATIONS_QUERY = `
  query GetNotifications {
    unreadNotifications {
      id
      title
      message
      type
      linkTo
      createdAt
    }
    notificationCount
  }
`;

const MARK_READ_MUTATION = `
  mutation MarkNotificationAsRead($id: Int!) {
    markNotificationAsRead(id: $id) {
      id
    }
  }
`;

type Notification = {
  id: number;
  title: string;
  message: string;
  type: string;
  linkTo?: string;
  createdAt: string;
};

type Props = {
  onNavigate: (page: AppPage) => void;
};

const toNotificationType = (type: string) => type.toUpperCase();

const BellIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path
      d="M12 3a4 4 0 0 0-4 4v1.4c0 1.2-.46 2.36-1.28 3.24L5 13.36V15h14v-1.64l-1.72-1.72A4.59 4.59 0 0 1 16 8.4V7a4 4 0 0 0-4-4Z"
      fill="currentColor"
    />
    <path d="M9.8 17a2.2 2.2 0 0 0 4.4 0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const NotificationBell: React.FC<Props> = ({ onNavigate }) => {
  const { accessToken } = useAuth();
  const [showPanel, setShowPanel] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const fetchNotifications = async () => {
      try {
        const data = await graphqlRequest<{ unreadNotifications: Notification[]; notificationCount: number }>(
          NOTIFICATIONS_QUERY,
          {},
          accessToken,
          { bypassCache: true },
        );

        setNotifications(data.unreadNotifications || []);
        setUnreadCount(data.notificationCount || 0);
      } catch (error) {
        console.error("Error loading notifications:", error);
      }
    };

    void fetchNotifications();
    const interval = window.setInterval(fetchNotifications, 30000);

    return () => window.clearInterval(interval);
  }, [accessToken]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!accessToken) {
      return;
    }

    try {
      await graphqlRequest(MARK_READ_MUTATION, { id: notification.id }, accessToken);

      setNotifications((previous) => previous.filter((item) => item.id !== notification.id));
      setUnreadCount((previous) => Math.max(0, previous - 1));

      const page = resolveAppPageFromLink(notification.linkTo);
      if (page) {
        onNavigate(page);
      }

      setShowPanel(false);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const getNotificationLabel = (type: string) => {
    switch (toNotificationType(type)) {
      case "CRITICAL":
        return "Critical";
      case "WARNING":
        return "Warning";
      case "APPROVAL":
        return "Approval";
      case "MESSAGE":
        return "Message";
      default:
        return "Info";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (toNotificationType(type)) {
      case "CRITICAL":
        return "#dc2626";
      case "WARNING":
        return "#f59e0b";
      case "APPROVAL":
        return "#059669";
      case "MESSAGE":
        return "#2563eb";
      default:
        return "#6b7280";
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setShowPanel((value) => !value)}
        aria-label="Open notifications"
        style={{
          background: "rgba(255,255,255,0.2)",
          border: "none",
          borderRadius: "50%",
          width: "45px",
          height: "45px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          fontSize: "13px",
          fontWeight: 800,
          color: "#ffffff",
          position: "relative",
          transition: "all 0.3s",
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.background = "rgba(255,255,255,0.3)";
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.background = "rgba(255,255,255,0.2)";
        }}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-5px",
              right: "-5px",
              background: "#ef4444",
              color: "white",
              borderRadius: "50%",
              width: "22px",
              height: "22px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              fontWeight: "bold",
              border: "2px solid white",
              boxShadow: "0 2px 6px rgba(239, 68, 68, 0.5)",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showPanel && (
        <>
          <div
            onClick={() => setShowPanel(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
          />

          <div
            style={{
              position: "absolute",
              top: "55px",
              right: "0",
              width: "400px",
              maxWidth: "92vw",
              maxHeight: "600px",
              background: "white",
              borderRadius: "12px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
              zIndex: 1000,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "20px",
                borderBottom: "1px solid #e5e7eb",
                background: "linear-gradient(135deg, #0f4c81 0%, #1e3a8a 70%)",
                color: "white",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>Notifications</h3>
              <p style={{ margin: "5px 0 0 0", fontSize: "13px", opacity: 0.9 }}>{unreadCount} unread</p>
            </div>

            <div style={{ overflowY: "auto", maxHeight: "500px" }}>
              {notifications.length === 0 ? (
                <div
                  style={{
                    padding: "34px 20px",
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "8px" }}>All caught up</div>
                  <p style={{ margin: 0, fontSize: "13px" }}>No new notifications.</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => {
                      void handleNotificationClick(notification);
                    }}
                    style={{
                      width: "100%",
                      padding: "14px 18px",
                      border: "none",
                      borderBottom: "1px solid #f1f5f9",
                      background: "#ffffff",
                      cursor: "pointer",
                      display: "flex",
                      gap: "10px",
                      textAlign: "left",
                    }}
                  >
                    <span
                      style={{
                        minWidth: "56px",
                        fontSize: "10px",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        color: getNotificationColor(notification.type),
                        alignSelf: "flex-start",
                        background: `${getNotificationColor(notification.type)}20`,
                        borderRadius: "999px",
                        padding: "3px 8px",
                        textAlign: "center",
                      }}
                    >
                      {getNotificationLabel(notification.type)}
                    </span>

                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
                        {notification.title}
                      </span>
                      <span
                        style={{
                          fontSize: "13px",
                          color: "#475569",
                          lineHeight: 1.4,
                          marginBottom: "6px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {notification.message}
                      </span>
                      <span style={{ fontSize: "12px", color: "#94a3b8" }}>{formatTime(notification.createdAt)}</span>
                    </span>
                  </button>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div
                style={{
                  padding: "12px 20px",
                  borderTop: "1px solid #e5e7eb",
                  textAlign: "center",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    onNavigate("notifications");
                    setShowPanel(false);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#1d4ed8",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
