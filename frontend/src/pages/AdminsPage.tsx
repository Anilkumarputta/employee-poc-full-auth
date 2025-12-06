import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../auth/authContext";
import { graphqlRequest } from "../lib/graphqlClient";
import { UsersManagementPage } from "./UsersManagementPage";

type AdminUser = {
  id: number;
  email: string;
  role: string;
  createdAt: string;
};

// Format date safely
const formatDate = (dateString: string): string => {
  try {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return "N/A";
  }
};

const ADMIN_USERS_QUERY = `
  query AdminUsers {
    adminUsers {
      id
      email
      role
      createdAt
    }
  }
`;

export const AdminsPage: React.FC = () => {
  const { user } = useContext(AuthContext);

  // Directors see the new enhanced UsersManagementPage with all features
  if (user?.role === "director") {
    return <UsersManagementPage />;
  }

  // Managers can also access
  if (user?.role === "manager") {
    return <UsersManagementPage />;
  }

  // Everyone else sees access denied
  return (
    <div style={{ padding: "2rem" }}>
      <h1>System Administration</h1>
      <div style={{ marginTop: "2rem", padding: "2rem", background: "#fee2e2", border: "1px solid #fecaca", borderRadius: "8px" }}>
        <h2 style={{ margin: "0 0 1rem 0", color: "#991b1b" }}>Access Denied</h2>
        <p style={{ color: "#7f1d1d", margin: 0 }}>
          Only Directors and Managers can access the System Administration panel.
        </p>
      </div>
    </div>
  );
};
