import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../auth/authContext";
import { graphqlRequest } from "../lib/graphqlClient";

type AdminUser = {
  id: number;
  email: string;
  role: string;
  createdAt: string;
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
  const { accessToken, user } = useContext(AuthContext);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data: any = await graphqlRequest(ADMIN_USERS_QUERY, {}, accessToken);
      setAdmins(data.adminUsers);
    } catch (err) {
      console.error("Failed to fetch admin users:", err);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== "admin") {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>Admin Users</h1>
        <div style={{ marginTop: "2rem", padding: "2rem", background: "#fee2e2", border: "1px solid #fecaca", borderRadius: "8px" }}>
          <h2 style={{ margin: "0 0 1rem 0", color: "#991b1b" }}>Access Denied</h2>
          <p style={{ color: "#7f1d1d", margin: 0 }}>
            Only administrators can view admin user list.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>Admin Users</h1>
        <p>Loading admin users...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ margin: 0 }}>Admin Users</h1>
          <p style={{ margin: "0.5rem 0 0 0", color: "#6b7280" }}>Manage administrator accounts and permissions</p>
        </div>
        <button onClick={fetchAdmins} style={{ padding: "0.5rem 1rem", background: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
          Refresh
        </button>
      </div>

      <div style={{ marginTop: "2rem" }}>
        {admins.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", background: "white", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
            <p style={{ color: "#6b7280", margin: 0 }}>No admin users found</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", background: "white", borderRadius: "8px", overflow: "hidden", border: "1px solid #e5e7eb" }}>
            <thead style={{ background: "#f9fafb" }}>
              <tr>
                <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>ID</th>
                <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Email</th>
                <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Role</th>
                <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Created At</th>
              </tr>
            </thead>
            <tbody>
              {admins.map(admin => (
                <tr key={admin.id}>
                  <td style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb" }}>{admin.id}</td>
                  <td style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb" }}>{admin.email}</td>
                  <td style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb" }}>
                    <span style={{ 
                      padding: "0.25rem 0.75rem", 
                      background: "#dbeafe", 
                      color: "#1e40af", 
                      borderRadius: "12px",
                      fontSize: "0.875rem",
                      fontWeight: "600"
                    }}>
                      {admin.role.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb" }}>{new Date(admin.createdAt).toLocaleDateString()}</td>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
