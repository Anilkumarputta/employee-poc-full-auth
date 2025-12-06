import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../auth/authContext";
import { graphqlRequest } from "../lib/graphqlClient";

type User = {
  id: number;
  email: string;
  role: string;
  createdAt: string;
  isActive?: boolean;
};

// Utility to format date safely
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

const ALL_USERS_QUERY = `
  query AllUsers($searchTerm: String, $roleFilter: String, $statusFilter: String) {
    allUsers(searchTerm: $searchTerm, roleFilter: $roleFilter, statusFilter: $statusFilter) {
      id
      email
      role
      createdAt
      isActive
    }
  }
`;

const DELETE_USER_MUTATION = `
  mutation DeleteUser($id: Int!) {
    deleteUser(id: $id)
  }
`;

const TOGGLE_USER_ACCESS_MUTATION = `
  mutation ToggleUserAccess($id: Int!, $isActive: Boolean!, $reason: String, $blockedUntil: String) {
    toggleUserAccess(id: $id, isActive: $isActive, reason: $reason, blockedUntil: $blockedUntil)
  }
`;

const BULK_TOGGLE_ACCESS_MUTATION = `
  mutation BulkToggleAccess($userIds: [Int!]!, $isActive: Boolean!, $reason: String) {
    bulkToggleAccess(userIds: $userIds, isActive: $isActive, reason: $reason)
  }
`;

export const UsersManagementPage: React.FC = () => {
  const { accessToken, user } = useContext(AuthContext);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [actionUser, setActionUser] = useState<{id: number, email: string, currentStatus: boolean} | null>(null);
  const [accessReason, setAccessReason] = useState("");
  const [blockDuration, setBlockDuration] = useState("");

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data: any = await graphqlRequest(ALL_USERS_QUERY, { 
        searchTerm: searchTerm || null,
        roleFilter: roleFilter === 'all' ? null : roleFilter,
        statusFilter: statusFilter === 'all' ? null : statusFilter
      }, accessToken);
      setUsers(data.allUsers);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAccess = async (id: number, email: string, currentStatus: boolean) => {
    setActionUser({ id, email, currentStatus });
    setShowReasonModal(true);
  };

  const confirmToggleAccess = async () => {
    if (!actionUser) return;
    
    const { id, email, currentStatus } = actionUser;
    const isActive = !currentStatus;
    
    let blockedUntil = null;
    if (!isActive && blockDuration) {
      const now = new Date();
      const days = parseInt(blockDuration);
      now.setDate(now.getDate() + days);
      blockedUntil = now.toISOString();
    }
    
    try {
      await graphqlRequest(TOGGLE_USER_ACCESS_MUTATION, { 
        id, 
        isActive, 
        reason: accessReason || null,
        blockedUntil 
      }, accessToken);
      alert(`Access ${isActive ? "granted" : "denied"} successfully`);
      setShowReasonModal(false);
      setActionUser(null);
      setAccessReason("");
      setBlockDuration("");
      fetchUsers();
    } catch (err: any) {
      alert("Failed to update access: " + err.message);
    }
  };

  const handleBulkAction = async (action: 'grant' | 'deny') => {
    if (selectedUsers.size === 0) {
      alert("Please select at least one user");
      return;
    }

    const isActive = action === 'grant';
    const reason = prompt(`Reason for ${action === 'grant' ? 'granting' : 'denying'} access to ${selectedUsers.size} user(s):`);
    
    if (reason === null) return; // User cancelled
    
    try {
      await graphqlRequest(BULK_TOGGLE_ACCESS_MUTATION, {
        userIds: Array.from(selectedUsers),
        isActive,
        reason: reason || null
      }, accessToken);
      alert(`Bulk ${action} completed for ${selectedUsers.size} user(s)`);
      setSelectedUsers(new Set());
      fetchUsers();
    } catch (err: any) {
      alert("Failed to perform bulk action: " + err.message);
    }
  };

  const toggleUserSelection = (userId: number) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const selectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
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
      {/* Reason Modal */}
      {showReasonModal && actionUser && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "white",
            padding: "2rem",
            borderRadius: "12px",
            maxWidth: "500px",
            width: "90%"
          }}>
            <h2 style={{ marginTop: 0 }}>
              {actionUser.currentStatus ? "🔒 Deny Access" : "✅ Grant Access"}
            </h2>
            <p style={{ color: "#6b7280" }}>
              User: <strong>{actionUser.email}</strong>
            </p>
            
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
                Reason {actionUser.currentStatus ? "(Required)" : "(Optional)"}:
              </label>
              <textarea
                value={accessReason}
                onChange={(e) => setAccessReason(e.target.value)}
                placeholder={actionUser.currentStatus ? "e.g., Policy violation, Security concern" : "e.g., Resolved issue"}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  minHeight: "80px",
                  fontFamily: "inherit"
                }}
              />
            </div>

            {!actionUser.currentStatus && (
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
                  ⏰ Temporary Block Duration (Optional):
                </label>
                <select
                  value={blockDuration}
                  onChange={(e) => setBlockDuration(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px"
                  }}
                >
                  <option value="">Permanent (until manually restored)</option>
                  <option value="1">1 day</option>
                  <option value="7">7 days (1 week)</option>
                  <option value="14">14 days (2 weeks)</option>
                  <option value="30">30 days (1 month)</option>
                  <option value="90">90 days (3 months)</option>
                </select>
              </div>
            )}

            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setShowReasonModal(false);
                  setActionUser(null);
                  setAccessReason("");
                  setBlockDuration("");
                }}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "#e5e7eb",
                  color: "#374151",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600"
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmToggleAccess}
                disabled={!actionUser.currentStatus && !accessReason}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: actionUser.currentStatus ? "#ef4444" : "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  opacity: (!actionUser.currentStatus && !accessReason) ? 0.5 : 1
                }}
              >
                {actionUser.currentStatus ? "Deny Access" : "Grant Access"}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Search and Filters */}
      <div style={{ 
        background: "white", 
        padding: "1.5rem", 
        borderRadius: "12px", 
        marginBottom: "2rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", fontSize: "0.875rem" }}>
              🔍 Search by email:
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users..."
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "0.875rem"
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", fontSize: "0.875rem" }}>
              👔 Role:
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "0.875rem"
              }}
            >
              <option value="all">All Roles</option>
              <option value="director">Directors</option>
              <option value="manager">Managers</option>
              <option value="employee">Employees</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", fontSize: "0.875rem" }}>
              🔒 Status:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "0.875rem"
              }}
            >
              <option value="all">All Users</option>
              <option value="active">Active Only</option>
              <option value="blocked">Blocked Only</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.size > 0 && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            padding: "1rem",
            background: "#eff6ff",
            borderRadius: "8px",
            border: "1px solid #3b82f6"
          }}>
            <span style={{ fontWeight: "600", color: "#1e40af" }}>
              {selectedUsers.size} user(s) selected
            </span>
            <button
              onClick={() => handleBulkAction('grant')}
              style={{
                padding: "0.5rem 1rem",
                background: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "0.875rem"
              }}
            >
              ✅ Grant Access
            </button>
            <button
              onClick={() => handleBulkAction('deny')}
              style={{
                padding: "0.5rem 1rem",
                background: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "0.875rem"
              }}
            >
              🚫 Deny Access
            </button>
            <button
              onClick={() => setSelectedUsers(new Set())}
              style={{
                padding: "0.5rem 1rem",
                background: "#6b7280",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "0.875rem"
              }}
            >
              Clear Selection
            </button>
          </div>
        )}
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
                  <th style={{ padding: "1rem", textAlign: "left", borderBottom: "2px solid #e5e7eb", width: "50px" }}>
                    <input
                      type="checkbox"
                      checked={directors.length > 0 && directors.every(u => selectedUsers.has(u.id))}
                      onChange={() => {
                        if (directors.every(u => selectedUsers.has(u.id))) {
                          const newSelection = new Set(selectedUsers);
                          directors.forEach(u => newSelection.delete(u.id));
                          setSelectedUsers(newSelection);
                        } else {
                          const newSelection = new Set(selectedUsers);
                          directors.forEach(u => newSelection.add(u.id));
                          setSelectedUsers(newSelection);
                        }
                      }}
                      style={{ cursor: "pointer" }}
                    />
                  </th>
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
                    <td style={{ padding: "1rem" }}>
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(usr.id)}
                        onChange={() => toggleUserSelection(usr.id)}
                        style={{ cursor: "pointer" }}
                      />
                    </td>
                    <td style={{ padding: "1rem" }}>{usr.id}</td>
                    <td style={{ padding: "1rem", fontWeight: "600" }}>{usr.email}</td>
                    <td style={{ padding: "1rem" }}>
                      <span style={getRoleBadgeStyle(usr.role)}>
                        {usr.role.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "1rem" }}>{formatDate(usr.createdAt)}</td>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        {usr.isActive !== false ? (
                          <button
                            onClick={() => handleToggleAccess(usr.id, usr.email, true)}
                            style={{
                              padding: "0.4rem 0.8rem",
                              background: "#f59e0b",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "0.875rem",
                              fontWeight: "600"
                            }}
                          >
                            🔒 Deny Access
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleAccess(usr.id, usr.email, false)}
                            style={{
                              padding: "0.4rem 0.8rem",
                              background: "#10b981",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "0.875rem",
                              fontWeight: "600"
                            }}
                          >
                            ✅ Grant Access
                          </button>
                        )}
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
                        {usr.isActive === false && (
                          <span style={{ 
                            fontSize: "0.75rem", 
                            color: "#ef4444", 
                            fontWeight: "600",
                            background: "#fee2e2",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "4px"
                          }}>
                            ⛔ BLOCKED
                          </span>
                        )}
                      </div>
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
                    <td style={{ padding: "1rem" }}>{formatDate(usr.createdAt)}</td>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        {usr.isActive !== false ? (
                          <button
                            onClick={() => handleToggleAccess(usr.id, usr.email, true)}
                            style={{
                              padding: "0.4rem 0.8rem",
                              background: "#f59e0b",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "0.875rem",
                              fontWeight: "600"
                            }}
                          >
                            🔒 Deny Access
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleAccess(usr.id, usr.email, false)}
                            style={{
                              padding: "0.4rem 0.8rem",
                              background: "#10b981",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "0.875rem",
                              fontWeight: "600"
                            }}
                          >
                            ✅ Grant Access
                          </button>
                        )}
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
                        {usr.isActive === false && (
                          <span style={{ 
                            fontSize: "0.75rem", 
                            color: "#ef4444", 
                            fontWeight: "600",
                            background: "#fee2e2",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "4px"
                          }}>
                            ⛔ BLOCKED
                          </span>
                        )}
                      </div>
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
                    <td style={{ padding: "1rem" }}>{formatDate(usr.createdAt)}</td>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        {usr.isActive !== false ? (
                          <button
                            onClick={() => handleToggleAccess(usr.id, usr.email, true)}
                            style={{
                              padding: "0.4rem 0.8rem",
                              background: "#f59e0b",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "0.875rem",
                              fontWeight: "600"
                            }}
                          >
                            🔒 Deny Access
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleAccess(usr.id, usr.email, false)}
                            style={{
                              padding: "0.4rem 0.8rem",
                              background: "#10b981",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "0.875rem",
                              fontWeight: "600"
                            }}
                          >
                            ✅ Grant Access
                          </button>
                        )}
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
                        {usr.isActive === false && (
                          <span style={{ 
                            fontSize: "0.75rem", 
                            color: "#ef4444", 
                            fontWeight: "600",
                            background: "#fee2e2",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "4px"
                          }}>
                            ⛔ BLOCKED
                          </span>
                        )}
                      </div>
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
