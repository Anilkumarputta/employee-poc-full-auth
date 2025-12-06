import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../auth/authContext";
import { graphqlRequest } from "../lib/graphqlClient";

type User = {
  id: number;
  email: string;
  role: string;
  createdAt: string;
};

const ALL_USERS_QUERY = `
  query AllUsers {
    allUsers {
      id
      email
      role
      createdAt
    }
  }
`;

const DELETE_USER_MUTATION = `
  mutation DeleteUser($id: Int!) {
    deleteUser(id: $id)
  }
`;

export const UsersManagementPage: React.FC = () => {
  const { accessToken, user } = useContext(AuthContext);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data: any = await graphqlRequest(ALL_USERS_QUERY, {}, accessToken);
      setUsers(data.allUsers);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: number, email: string) => {
    if (!window.confirm(`Are you sure you want to delete user: ${email}?\n\nThis action cannot be undone.`)) {
      return;
    }
    
    try {
      await graphqlRequest(DELETE_USER_MUTATION, { id }, accessToken);
      alert("User deleted successfully");
      fetchUsers();
    } catch (err: any) {
      alert("Failed to delete user: " + err.message);
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    if (role === "director") {
      return {
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        padding: "0.4rem 1rem",
        borderRadius: "20px",
        fontSize: "0.875rem",
        fontWeight: "700",
        boxShadow: "0 4px 6px rgba(102, 126, 234, 0.3)"
      };
    } else if (role === "manager") {
      return {
        background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        color: "white",
        padding: "0.4rem 1rem",
        borderRadius: "20px",
        fontSize: "0.875rem",
        fontWeight: "700",
        boxShadow: "0 4px 6px rgba(245, 87, 108, 0.3)"
      };
    } else {
      return {
        background: "#e5e7eb",
        color: "#374151",
        padding: "0.4rem 1rem",
        borderRadius: "20px",
        fontSize: "0.875rem",
        fontWeight: "600"
      };
    }
  };

  if (user?.role !== "director") {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>👑 System Administration</h1>
        <div style={{ marginTop: "2rem", padding: "2rem", background: "#fee2e2", border: "1px solid #fecaca", borderRadius: "8px" }}>
          <h2 style={{ margin: "0 0 1rem 0", color: "#991b1b" }}>🔒 Director Access Only</h2>
          <p style={{ color: "#7f1d1d", margin: 0 }}>
            Only Directors have access to manage all system users. This includes creating, editing, and deleting Director, Manager, and Employee accounts.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>👑 System Administration</h1>
        <p>Loading users...</p>
      </div>
    );
  }

  const directors = users.filter(u => u.role === "director");
  const managers = users.filter(u => u.role === "manager");
  const employees = users.filter(u => u.role === "employee");

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            👑 System Administration
          </h1>
          <p style={{ margin: "0.5rem 0 0 0", color: "#6b7280" }}>
            Manage all system users • Total: {users.length} users ({directors.length} Directors, {managers.length} Managers, {employees.length} Employees)
          </p>
        </div>
        <button onClick={fetchUsers} style={{ padding: "0.5rem 1rem", background: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>
          🔄 Refresh
        </button>
      </div>

      {/* Directors Section */}
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ 
          fontSize: "1.25rem", 
          fontWeight: "700", 
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          👑 Directors ({directors.length})
        </h2>
        <div style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: "1px", borderRadius: "12px" }}>
          <div style={{ background: "white", borderRadius: "11px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#f9fafb" }}>
                <tr>
                  <th style={{ padding: "1rem", textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>ID</th>
                  <th style={{ padding: "1rem", textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>Email</th>
                  <th style={{ padding: "1rem", textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>Role</th>
                  <th style={{ padding: "1rem", textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>Created At</th>
                  <th style={{ padding: "1rem", textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {directors.map(usr => (
                  <tr key={usr.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "1rem" }}>{usr.id}</td>
                    <td style={{ padding: "1rem", fontWeight: "600" }}>{usr.email}</td>
                    <td style={{ padding: "1rem" }}>
                      <span style={getRoleBadgeStyle(usr.role)}>
                        {usr.role.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "1rem" }}>{new Date(usr.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: "1rem" }}>
                      <button
                        onClick={() => handleDeleteUser(usr.id, usr.email)}
                        style={{
                          padding: "0.4rem 0.8rem",
                          background: "#ef4444",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "0.875rem",
                          fontWeight: "600"
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {directors.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                      No directors found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Managers Section */}
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ 
          fontSize: "1.25rem", 
          fontWeight: "700", 
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          👔 Managers ({managers.length})
        </h2>
        <div style={{ background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", padding: "1px", borderRadius: "12px" }}>
          <div style={{ background: "white", borderRadius: "11px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#f9fafb" }}>
                <tr>
                  <th style={{ padding: "1rem", textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>ID</th>
                  <th style={{ padding: "1rem", textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>Email</th>
                  <th style={{ padding: "1rem", textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>Role</th>
                  <th style={{ padding: "1rem", textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>Created At</th>
                  <th style={{ padding: "1rem", textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {managers.map(usr => (
                  <tr key={usr.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "1rem" }}>{usr.id}</td>
                    <td style={{ padding: "1rem", fontWeight: "600" }}>{usr.email}</td>
                    <td style={{ padding: "1rem" }}>
                      <span style={getRoleBadgeStyle(usr.role)}>
                        {usr.role.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "1rem" }}>{new Date(usr.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: "1rem" }}>
                      <button
                        onClick={() => handleDeleteUser(usr.id, usr.email)}
                        style={{
                          padding: "0.4rem 0.8rem",
                          background: "#ef4444",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "0.875rem",
                          fontWeight: "600"
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {managers.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                      No managers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Employees Section */}
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ 
          fontSize: "1.25rem", 
          fontWeight: "700", 
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          👤 Employees ({employees.length})
        </h2>
        <div style={{ background: "#e5e7eb", padding: "1px", borderRadius: "12px" }}>
          <div style={{ background: "white", borderRadius: "11px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#f9fafb" }}>
                <tr>
                  <th style={{ padding: "1rem", textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>ID</th>
                  <th style={{ padding: "1rem", textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>Email</th>
                  <th style={{ padding: "1rem", textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>Role</th>
                  <th style={{ padding: "1rem", textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>Created At</th>
                  <th style={{ padding: "1rem", textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(usr => (
                  <tr key={usr.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "1rem" }}>{usr.id}</td>
                    <td style={{ padding: "1rem", fontWeight: "600" }}>{usr.email}</td>
                    <td style={{ padding: "1rem" }}>
                      <span style={getRoleBadgeStyle(usr.role)}>
                        {usr.role.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "1rem" }}>{new Date(usr.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: "1rem" }}>
                      <button
                        onClick={() => handleDeleteUser(usr.id, usr.email)}
                        style={{
                          padding: "0.4rem 0.8rem",
                          background: "#ef4444",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "0.875rem",
                          fontWeight: "600"
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                      No employees found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
