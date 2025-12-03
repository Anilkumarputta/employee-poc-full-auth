import React from "react";

type SidebarProps = {
  open: boolean;
};

export const Sidebar: React.FC<SidebarProps> = ({ open }) => {
  return (
    <aside className={open ? "sidebar sidebar-open" : "sidebar"}>
      <div className="sidebar-section">
        <div className="sidebar-title">Main</div>
        <button className="sidebar-item sidebar-item-active">Employees</button>
        <button className="sidebar-item">Dashboard</button>
        <button className="sidebar-item">Notifications</button>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-title">Admins</div>
        <button className="sidebar-item sidebar-subitem">Admins list</button>
        <button className="sidebar-item sidebar-subitem">Access logs</button>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-title">Settings</div>
        <button className="sidebar-item">Profile</button>
        <button className="sidebar-item">Preferences</button>
      </div>
    </aside>
  );
};
