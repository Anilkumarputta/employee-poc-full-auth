import React from "react";
import type { UserRole } from "../../App";

type Props = {
  onHamburgerClick: () => void;
  currentRole: UserRole;
  onLogout: () => void;
};

export const Topbar: React.FC<Props> = ({
  onHamburgerClick,
  currentRole,
  onLogout,
}) => {
  return (
    <header className="topbar">
      <button
        className="topbar-hamburger"
        onClick={onHamburgerClick}
        aria-label="Toggle navigation"
      >
        <span />
        <span />
        <span />
      </button>

      <div className="topbar-left">
        <span className="topbar-logo">Employee POC</span>
        <nav className="topbar-nav">
          <a href="#" className="nav-link active">
            Home
          </a>
          <a href="#" className="nav-link">
            Dashboard
          </a>
          <a href="#" className="nav-link">
            Reports
          </a>
          <a href="#" className="nav-link">
            Settings
          </a>
        </nav>
      </div>

      <div className="topbar-right">
        <span className="user-role-badge">
          {currentRole === "director" ? "Director" : currentRole === "manager" ? "Manager" : "Employee"}
        </span>
        <button className="secondary-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};
