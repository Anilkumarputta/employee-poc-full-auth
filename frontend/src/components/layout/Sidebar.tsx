import React from "react";

type SidebarProps = {
  open: boolean;
};

export const Sidebar: React.FC<SidebarProps> = ({ open }) => {
  const handleClick = (section: string) => {
    // For POC: Alert for demo pages (not implemented yet)
    if (section !== "Employees") {
      alert(`${section} page is not implemented in this POC. Only Employees page is available.`);
    }
  };

  return (
    <aside className={open ? "sidebar sidebar-open" : "sidebar"}>
      <div className="sidebar-section">
        <div className="sidebar-title">Main</div>
        <button className="sidebar-item sidebar-item-active">Employees</button>
        <button className="sidebar-item" onClick={() => handleClick("Dashboard")}>
          Dashboard
        </button>
        <button className="sidebar-item" onClick={() => handleClick("Notifications")}>
          Notifications
        </button>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-title">Admins</div>
        <button className="sidebar-item sidebar-subitem" onClick={() => handleClick("Admins list")}>
          Admins list
        </button>
        <button className="sidebar-item sidebar-subitem" onClick={() => handleClick("Access logs")}>
          Access logs
        </button>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-title">Settings</div>
        <button className="sidebar-item" onClick={() => handleClick("Profile")}>
          Profile
        </button>
        <button className="sidebar-item" onClick={() => handleClick("Preferences")}>
          Preferences
        </button>
      </div>
    </aside>
  );
};
