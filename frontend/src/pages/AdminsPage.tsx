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
  const role = user?.role || "employee";

  // RBAC: Only directors see full admin management
  if (role === "director") {
    return <UsersManagementPage />;
  }
  // Managers see a limited view (e.g., list of managers/employees)
  if (role === "manager") {
    return <div>Manager view: You can see and manage your team.</div>;
  }
  // Employees see nothing
  return <div>Access denied. Admin features are for managers and directors only.</div>;
};
