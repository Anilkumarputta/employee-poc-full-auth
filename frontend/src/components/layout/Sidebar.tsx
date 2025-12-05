import React, { useContext } from "react";
import { AuthContext } from "../../auth/authContext";

type AppPage = "employees" | "dashboard" | "notifications" | "reports" | "profile" | "preferences" | "settings" | "admins" | "accessLogs" | "sendNote" | "leaveRequests";

type SidebarProps = {
  open: boolean;
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
};

export const Sidebar: React.FC<SidebarProps> = ({ open, currentPage, onNavigate }) => {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === "admin";

  return (
    <aside className={open ? "sidebar sidebar-open" : "sidebar"}>
      <div className="sidebar-section">
        <div className="sidebar-title">Main</div>
        <button 
          className={currentPage === "employees" ? "sidebar-item sidebar-item-active" : "sidebar-item"}
          onClick={() => onNavigate("employees")}
        >
          Employees
        </button>
        <button 
          className={currentPage === "dashboard" ? "sidebar-item sidebar-item-active" : "sidebar-item"}
          onClick={() => onNavigate("dashboard")}
        >
          Dashboard
        </button>
        <button 
          className={currentPage === "notifications" ? "sidebar-item sidebar-item-active" : "sidebar-item"}
          onClick={() => onNavigate("notifications")}
        >
          Notifications
        </button>
        <button 
          className={currentPage === "reports" ? "sidebar-item sidebar-item-active" : "sidebar-item"}
          onClick={() => onNavigate("reports")}
        >
          Reports
        </button>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-title">Actions</div>
        {isAdmin && (
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

      {isAdmin && (
        <div className="sidebar-section">
          <div className="sidebar-title">Administration</div>
          <button 
            className={currentPage === "admins" ? "sidebar-item sidebar-subitem sidebar-item-active" : "sidebar-item sidebar-subitem"}
            onClick={() => onNavigate("admins")}
          >
            Admins list
          </button>
          <button 
            className={currentPage === "accessLogs" ? "sidebar-item sidebar-subitem sidebar-item-active" : "sidebar-item sidebar-subitem"}
            onClick={() => onNavigate("accessLogs")}
          >
            Access logs
          </button>
        </div>
      )}

      <div className="sidebar-section">
        <div className="sidebar-title">Settings</div>
        <button 
          className={currentPage === "profile" ? "sidebar-item sidebar-item-active" : "sidebar-item"}
          onClick={() => onNavigate("profile")}
        >
          Profile
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
