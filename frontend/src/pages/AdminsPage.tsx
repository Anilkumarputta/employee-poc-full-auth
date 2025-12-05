import React from "react";

export const AdminsPage: React.FC = () => {
  const admins = [
    { id: 1, email: "admin@example.com", name: "System Admin", lastLogin: "2024-12-05 10:30 AM", status: "active" },
    { id: 2, email: "manager@example.com", name: "Manager", lastLogin: "2024-12-04 3:15 PM", status: "active" },
  ];

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Admin Users</h1>
      <p>Manage administrator accounts and permissions.</p>

      <div style={{ marginTop: "2rem" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "white", borderRadius: "8px", overflow: "hidden", border: "1px solid #e5e7eb" }}>
          <thead style={{ background: "#f9fafb" }}>
            <tr>
              <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>ID</th>
              <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Email</th>
              <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Name</th>
              <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Last Login</th>
              <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Status</th>
              <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map(admin => (
              <tr key={admin.id}>
                <td style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb" }}>{admin.id}</td>
                <td style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb" }}>{admin.email}</td>
                <td style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb" }}>{admin.name}</td>
                <td style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb" }}>{admin.lastLogin}</td>
                <td style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb" }}>
                  <span style={{ 
                    padding: "0.25rem 0.75rem", 
                    background: "#d1fae5", 
                    color: "#065f46", 
                    borderRadius: "12px",
                    fontSize: "0.875rem"
                  }}>
                    {admin.status}
                  </span>
                </td>
                <td style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb" }}>
                  <button style={{ padding: "0.5rem 1rem", background: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", marginRight: "0.5rem" }}>
                    Edit
                  </button>
                  <button style={{ padding: "0.5rem 1rem", background: "#ef4444", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
