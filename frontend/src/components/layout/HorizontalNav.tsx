import React, { useEffect, useState } from "react";
import { useAuth } from "../../auth/authContext";
import { graphqlRequest } from "../../lib/graphqlClient";
import { NotificationBell } from "../NotificationBell";
import type { AppPage } from "../../types/navigation";

type Props = {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  onLogout: () => void;
};

type DrawerItem = {
  page: AppPage;
  label: string;
  visible: boolean;
  badge?: number;
};

const UNREAD_MESSAGE_COUNT_QUERY = `
  query GetUnreadMessageCount {
    messageStats {
      unread
    }
  }
`;

export const HorizontalNav: React.FC<Props> = ({ currentPage, onNavigate, onLogout }) => {
  const { user, accessToken } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  const isDirector = user?.role === "director";
  const isManager = user?.role === "manager";
  const isManagerOrAbove = isDirector || isManager;

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!accessToken) {
        return;
      }

      try {
        const data = await graphqlRequest<{ messageStats: { unread: number } }>(
          UNREAD_MESSAGE_COUNT_QUERY,
          {},
          accessToken,
          { bypassCache: true },
        );
        setUnreadMessageCount(data.messageStats.unread || 0);
      } catch (error) {
        console.error("Failed to load unread message count:", error);
      }
    };

    void fetchUnreadCount();
    const interval = window.setInterval(fetchUnreadCount, 30000);

    return () => window.clearInterval(interval);
  }, [accessToken]);

  const getPortalTitle = () => {
    if (isDirector) return "Director Portal";
    if (isManager) return "Manager Portal";
    return "Employee Portal";
  };

  const navigateAndClose = (page: AppPage) => {
    onNavigate(page);
    setDrawerOpen(false);
  };

  const topNavItems: DrawerItem[] = [
    { page: "dashboard", label: "Dashboard", visible: true },
    { page: "employees", label: isManagerOrAbove ? "Employees" : "Team", visible: true },
    { page: "messages", label: "Messages", visible: true, badge: unreadMessageCount },
    { page: "reports", label: "Reports", visible: isManagerOrAbove },
    { page: "settings", label: "Settings", visible: true },
  ];

  const drawerMainItems: DrawerItem[] = [
    { page: "dashboard", label: "Dashboard", visible: true },
    { page: "employees", label: isManagerOrAbove ? "Manage Employees" : "Team", visible: true },
    { page: "messages", label: "Messages", visible: true, badge: unreadMessageCount },
    { page: "notifications", label: "Notifications", visible: true },
    { page: "leaveRequests", label: isManagerOrAbove ? "Leave Requests" : "My Leave", visible: true },
    { page: "reports", label: "Reports", visible: isManagerOrAbove },
    { page: "sendNote", label: "Send Note", visible: isManagerOrAbove },
  ];

  const drawerAccountItems: DrawerItem[] = [
    { page: "profile", label: "Profile", visible: true },
    { page: "profileEdit", label: "Edit Profile", visible: true },
    { page: "preferences", label: "Preferences", visible: true },
    { page: "settings", label: "Account Settings", visible: true },
  ];

  const drawerAdminItems: DrawerItem[] = [
    { page: "review-requests", label: "Review Requests", visible: isDirector },
    { page: "admins", label: "User Management", visible: isDirector },
    { page: "accessLogs", label: "Access Logs", visible: isDirector },
    { page: "employeeLogins", label: "Employee Logins", visible: isDirector },
    { page: "analyticsDashboard", label: "Analytics", visible: isDirector },
    { page: "bulkActions", label: "Bulk Actions", visible: isDirector },
    { page: "auditLogs", label: "Audit Logs", visible: isDirector },
    { page: "slackIntegration", label: "Slack Integration", visible: isDirector },
  ];

  return (
    <>
      <div
        className="horizontal-nav-container"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          background: "linear-gradient(135deg, #0f4c81 0%, #1e3a8a 55%, #1f2a44 100%)",
          color: "#ffffff",
          borderBottom: "1px solid rgba(255,255,255,0.15)",
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.2)",
        }}
      >
        <div
          className="horizontal-nav-inner"
          style={{
            minHeight: "72px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "14px",
            padding: "0 24px",
          }}
        >
          <div className="horizontal-nav-left" style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
            <button
              type="button"
              onClick={() => setDrawerOpen((state) => !state)}
              aria-label="Open menu"
              className="hamburger-btn"
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.35)",
                background: "rgba(255,255,255,0.14)",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                padding: 0,
                flexShrink: 0,
              }}
            >
              <span style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ width: "18px", height: "2px", background: "#fff", borderRadius: "999px" }} />
                <span style={{ width: "18px", height: "2px", background: "#fff", borderRadius: "999px" }} />
                <span style={{ width: "18px", height: "2px", background: "#fff", borderRadius: "999px" }} />
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate("dashboard")}
              className="horizontal-nav-logo"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                border: "none",
                background: "transparent",
                color: "inherit",
                cursor: "pointer",
                padding: 0,
                minWidth: 0,
              }}
            >
              <img
                src="/logo.svg"
                alt="PulseDesk logo"
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.14)",
                  border: "1px solid rgba(255,255,255,0.28)",
                  padding: "6px",
                  flexShrink: 0,
                }}
              />
              <span className="logo-text" style={{ textAlign: "left", minWidth: 0 }}>
                <strong style={{ display: "block", fontSize: "18px", lineHeight: 1.1 }}>PulseDesk</strong>
                <span style={{ display: "block", fontSize: "12px", opacity: 0.9 }}>{getPortalTitle()}</span>
              </span>
            </button>
          </div>

          <nav className="horizontal-nav-center" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {topNavItems
              .filter((item) => item.visible)
              .map((item) => {
                const active = currentPage === item.page;
                return (
                  <button
                    key={item.page}
                    type="button"
                    onClick={() => onNavigate(item.page)}
                    style={{
                      border: "none",
                      borderRadius: "999px",
                      background: active ? "rgba(255,255,255,0.22)" : "transparent",
                      color: "#ffffff",
                      padding: "9px 14px",
                      fontWeight: 700,
                      fontSize: "13px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {item.label}
                    {item.badge && item.badge > 0 ? (
                      <span
                        style={{
                          minWidth: "18px",
                          height: "18px",
                          borderRadius: "9px",
                          background: "#dc2626",
                          color: "#ffffff",
                          fontSize: "10px",
                          fontWeight: 800,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "0 5px",
                        }}
                      >
                        {item.badge > 9 ? "9+" : item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
          </nav>

          <div className="horizontal-nav-right" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              className="user-email-badge"
              style={{
                background: "rgba(255,255,255,0.14)",
                border: "1px solid rgba(255,255,255,0.2)",
                padding: "8px 12px",
                borderRadius: "999px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "12px",
              }}
            >
              <span style={{ textTransform: "capitalize", fontWeight: 700 }}>{user?.role}</span>
              <span style={{ opacity: 0.8 }}>|</span>
              <span className="email-text" style={{ maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.email}
              </span>
            </div>

            <NotificationBell onNavigate={onNavigate} />

            <button
              type="button"
              onClick={onLogout}
              style={{
                border: "1px solid rgba(255,255,255,0.32)",
                background: "rgba(255,255,255,0.14)",
                color: "#ffffff",
                borderRadius: "9px",
                padding: "9px 12px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            zIndex: 1099,
          }}
        />
      )}

      <aside
        className="drawer-mobile"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "330px",
          maxWidth: "92vw",
          background: "#ffffff",
          transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s ease",
          zIndex: 1100,
          boxShadow: "8px 0 30px rgba(15, 23, 42, 0.25)",
          overflowY: "auto",
        }}
      >
        <div style={{ padding: "20px 18px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <img
                src="/logo.svg"
                alt="PulseDesk logo"
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "8px",
                  background: "#e2e8f0",
                  padding: "5px",
                }}
              />
              <div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>PulseDesk</div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>{getPortalTitle()}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              style={{
                border: "none",
                background: "#f1f5f9",
                color: "#0f172a",
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              X
            </button>
          </div>

          <DrawerSection title="Main" items={drawerMainItems} currentPage={currentPage} onSelect={navigateAndClose} />
          <DrawerSection title="Account" items={drawerAccountItems} currentPage={currentPage} onSelect={navigateAndClose} />
          {drawerAdminItems.some((item) => item.visible) && (
            <DrawerSection title="Administration" items={drawerAdminItems} currentPage={currentPage} onSelect={navigateAndClose} />
          )}

          <button
            type="button"
            onClick={onLogout}
            style={{
              width: "100%",
              marginTop: "18px",
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              color: "#0f172a",
              borderRadius: "10px",
              padding: "11px 14px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

type DrawerSectionProps = {
  title: string;
  items: DrawerItem[];
  currentPage: AppPage;
  onSelect: (page: AppPage) => void;
};

const DrawerSection: React.FC<DrawerSectionProps> = ({ title, items, currentPage, onSelect }) => {
  const visibleItems = items.filter((item) => item.visible);

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <section style={{ marginBottom: "18px" }}>
      <h3
        style={{
          margin: "0 0 8px",
          fontSize: "11px",
          color: "#64748b",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {title}
      </h3>
      <div style={{ display: "grid", gap: "6px" }}>
        {visibleItems.map((item) => {
          const active = currentPage === item.page;
          return (
            <button
              key={item.page}
              type="button"
              onClick={() => onSelect(item.page)}
              style={{
                width: "100%",
                border: "none",
                borderRadius: "9px",
                background: active ? "#dbeafe" : "#f8fafc",
                color: active ? "#1e40af" : "#0f172a",
                fontSize: "14px",
                fontWeight: 700,
                textAlign: "left",
                padding: "10px 12px",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span
                  style={{
                    minWidth: "18px",
                    height: "18px",
                    borderRadius: "9px",
                    background: "#dc2626",
                    color: "#ffffff",
                    fontSize: "10px",
                    fontWeight: 800,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 5px",
                  }}
                >
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
};
