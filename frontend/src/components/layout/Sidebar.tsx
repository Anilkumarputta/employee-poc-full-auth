import React, { useContext } from "react";
import { AuthContext } from "../../auth/authContext";

type AppPage = "employees" | "dashboard" | "notifications" | "reports" | "profile" | "preferences" | "settings" | "admins" | "accessLogs" | "sendNote" | "leaveRequests" | "profileEdit" | "employeeLogins";

type SidebarProps = {
  open: boolean;
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
};

export const Sidebar: React.FC<SidebarProps> = ({ open, currentPage, onNavigate }) => {
  const { user } = useContext(AuthContext);
  const isDirector = user?.role === "director";
  const isManager = user?.role === "manager";
  const isManagerOrAbove = isDirector || isManager;
  const isEmployee = user?.role === "employee";

  return (
    <aside className={open ? "sidebar sidebar-open" : "sidebar"}>
      <div className="sidebar-section">
        <div className="sidebar-title">
          {isDirector && "🏢 Director Portal"}
          {isManager && "👔 Manager Portal"}
          {isEmployee && "👤 Employee Portal"}
        </div>
        <button 
          className={currentPage === "employees" ? "sidebar-item sidebar-item-active" : "sidebar-item"}
          onClick={() => onNavigate("employees")}
        >
          {isManagerOrAbove ? "👥 Manage Employees" : "👥 Employees"}
        </button>
        <button 
          className={currentPage === "dashboard" ? "sidebar-item sidebar-item-active" : "sidebar-item"}
          onClick={() => onNavigate("dashboard")}
        >
          📊 Dashboard
        </button>
        <button 
          className={currentPage === "notifications" ? "sidebar-item sidebar-item-active" : "sidebar-item"}
          onClick={() => onNavigate("notifications")}
        >
          🔔 Notifications
        </button>
        {isManagerOrAbove && (
          <button 
            className={currentPage === "reports" ? "sidebar-item sidebar-item-active" : "sidebar-item"}
            onClick={() => onNavigate("reports")}
          >
            📄 Reports
          </button>
        )}
      </div>

      <div className="sidebar-section">
        <div className="sidebar-title">Actions</div>
        {isManagerOrAbove && (
          <button 
            className={currentPage === "sendNote" ? "sidebar-item sidebar-item-active" : "sidebar-item"}
            onClick={() => onNavigate("sendNote")}
          >
            📨 Send Note
          </button>
        )}
        <button 
          className={currentPage === "leaveRequests" ? "sidebar-item sidebar-item-active" : "sidebar-item"}
          onClick={() => onNavigate("leaveRequests")}
        >
          📅 Leave Requests
        </button>
      </div>

      {isManagerOrAbove && (
        <div className="sidebar-section">
          <div className="sidebar-title">
            {isDirector ? "🔐 System Administration" : "📋 Management"}
          </div>
          <button 
            className={currentPage === "admins" ? "sidebar-item sidebar-subitem sidebar-item-active" : "sidebar-item sidebar-subitem"}
            onClick={() => onNavigate("admins")}
          >
            {isDirector ? "👑 All Users & Admins" : "👤 Users List"}
          </button>
          {isDirector && (
            <button 
              className={currentPage === "accessLogs" ? "sidebar-item sidebar-subitem sidebar-item-active" : "sidebar-item sidebar-subitem"}
              onClick={() => onNavigate("accessLogs")}
            >
              📝 Access Logs
            </button>
          )}
          {isDirector && (
            <button 
              className={currentPage === "employeeLogins" ? "sidebar-item sidebar-subitem sidebar-item-active" : "sidebar-item sidebar-subitem"}
              onClick={() => onNavigate("employeeLogins")}
            >
              🔑 Employee Logins
            </button>
          )}
        </div>
      )}

      <div className="sidebar-section">
        <div className="sidebar-title">Settings</div>
        <button 
          className={currentPage === "profile" ? "sidebar-item sidebar-item-active" : "sidebar-item"}
          onClick={() => onNavigate("profile")}
        >
          👤 Profile
        </button>
        <button 
          className={currentPage === "profileEdit" ? "sidebar-item sidebar-item-active" : "sidebar-item"}
          onClick={() => onNavigate("profileEdit")}
        >
          ✏️ Edit My Profile
        </button>
        <button 
          className={currentPage === "settings" ? "sidebar-item sidebar-item-active" : "sidebar-item"}
          onClick={() => onNavigate("settings")}
        >
          ⚙️ Account Settings
        </button>
        <button 
          className={currentPage === "preferences" ? "sidebar-item sidebar-item-active" : "sidebar-item"}
          onClick={() => onNavigate("preferences")}
        >
          Preferences
        </button>
      </div>
    </aside>
  );
};
