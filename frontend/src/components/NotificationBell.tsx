import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/authContext";
import { graphqlRequest } from "../lib/graphqlClient";
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

export const NotificationBell: React.FC<Props> = ({ onNavigate }) => {
  const { accessToken } = useAuth();
  const [showPanel, setShowPanel] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!accessToken) return;

    const fetchNotifications = async () => {
      try {
        const data = await graphqlRequest<{
          unreadNotifications: Notification[];
          notificationCount: number;
        }>(NOTIFICATIONS_QUERY, {}, accessToken);

        setNotifications(data.unreadNotifications);
        setUnreadCount(data.notificationCount);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s

    return () => clearInterval(interval);
  }, [accessToken]);

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read
      await graphqlRequest(MARK_READ_MUTATION, { id: notification.id }, accessToken!);

      // Remove from list
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Navigate if there's a link
        if (notification.linkTo) {
          // Parse linkTo and navigate
        const path = notification.linkTo.replace("/", "") as AppPage;
        onNavigate(path);
      }

      setShowPanel(false);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "CRITICAL":
        return "🔴";
      case "WARNING":
        return "⚠️";
      case "APPROVAL":
        return "✅";
      case "MESSAGE":
        return "💬";
      default:
        return "ℹ️";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "CRITICAL":
        return "#dc2626";
      case "WARNING":
        return "#f59e0b";
      case "APPROVAL":
        return "#059669";
      case "MESSAGE":
        return "#3b82f6";
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
      {/* Bell Icon Button */}
      <button
        onClick={() => setShowPanel(!showPanel)}
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
          fontSize: "20px",
          position: "relative",
          transition: "all 0.3s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.3)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
      >
        🔔
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
              animation: "pulse 2s infinite",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {showPanel && (
        <>
          {/* Backdrop */}
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

          {/* Panel */}
          <div
            style={{
              position: "absolute",
              top: "55px",
              right: "0",
              width: "400px",
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
            {/* Header */}
            <div
              style={{
                padding: "20px",
                borderBottom: "1px solid #e5e7eb",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>
                Notifications
              </h3>
              <p style={{ margin: "5px 0 0 0", fontSize: "13px", opacity: 0.9 }}>
                {unreadCount} unread
              </p>
            </div>

            {/* Notifications List */}
            <div style={{ overflowY: "auto", maxHeight: "500px" }}>
              {notifications.length === 0 ? (
                <div
                  style={{
                    padding: "40px 20px",
                    textAlign: "center",
                    color: "#9ca3af",
                  }}
                >
                  <div style={{ fontSize: "48px", marginBottom: "10px" }}>✨</div>
                  <p style={{ margin: 0, fontSize: "14px" }}>All caught up!</p>
                  <p style={{ margin: "5px 0 0 0", fontSize: "13px" }}>No new notifications</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    style={{
                      padding: "16px 20px",
                      borderBottom: "1px solid #f3f4f6",
                      cursor: "pointer",
                      transition: "background 0.2s",
                      display: "flex",
                      gap: "12px",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f9fafb")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    {/* Icon */}
                    <div
                      style={{
                        fontSize: "24px",
                        flexShrink: 0,
                      }}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "4px",
                        }}
                      >
                        <h4
                          style={{
                            margin: 0,
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#111827",
                            flex: 1,
                          }}
                        >
                          {notification.title}
                        </h4>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontSize: "10px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            background: `${getNotificationColor(notification.type)}20`,
                            color: getNotificationColor(notification.type),
                          }}
                        >
                          {notification.type}
                        </span>
                      </div>
                      <p
                        style={{
                          margin: "0 0 6px 0",
                          fontSize: "13px",
                          color: "#6b7280",
                          lineHeight: "1.5",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {notification.message}
                      </p>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#9ca3af",
                        }}
                      >
                        {formatTime(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div
                style={{
                  padding: "12px 20px",
                  borderTop: "1px solid #e5e7eb",
                  textAlign: "center",
                }}
              >
                <button
                  onClick={() => {
                    onNavigate("notifications");
                    setShowPanel(false);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#667eea",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  View All Notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
