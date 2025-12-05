import React from "react";

export const DashboardPage: React.FC = () => {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Dashboard</h1>
      <p>Welcome to the Employee Management System dashboard.</p>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem", marginTop: "2rem" }}>
        <div style={{ padding: "1.5rem", background: "#f0f9ff", borderRadius: "8px", border: "1px solid #bae6fd" }}>
          <h3 style={{ margin: "0 0 0.5rem 0", color: "#0369a1" }}>Total Employees</h3>
          <p style={{ fontSize: "2rem", fontWeight: "bold", margin: 0, color: "#0c4a6e" }}>5</p>
        </div>
        
        <div style={{ padding: "1.5rem", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
          <h3 style={{ margin: "0 0 0.5rem 0", color: "#15803d" }}>Active</h3>
          <p style={{ fontSize: "2rem", fontWeight: "bold", margin: 0, color: "#14532d" }}>4</p>
        </div>
        
        <div style={{ padding: "1.5rem", background: "#fef3c7", borderRadius: "8px", border: "1px solid #fde68a" }}>
          <h3 style={{ margin: "0 0 0.5rem 0", color: "#a16207" }}>On Leave</h3>
          <p style={{ fontSize: "2rem", fontWeight: "bold", margin: 0, color: "#713f12" }}>1</p>
        </div>
        
        <div style={{ padding: "1.5rem", background: "#fce7f3", borderRadius: "8px", border: "1px solid #fbcfe8" }}>
          <h3 style={{ margin: "0 0 0.5rem 0", color: "#be185d" }}>Average Attendance</h3>
          <p style={{ fontSize: "2rem", fontWeight: "bold", margin: 0, color: "#831843" }}>94.6%</p>
        </div>
      </div>

      <div style={{ marginTop: "3rem" }}>
        <h2>Quick Actions</h2>
        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", flexWrap: "wrap" }}>
          <button style={{ padding: "0.75rem 1.5rem", background: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
            View All Employees
          </button>
          <button style={{ padding: "0.75rem 1.5rem", background: "#10b981", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
            Generate Report
          </button>
          <button style={{ padding: "0.75rem 1.5rem", background: "#8b5cf6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
            View Analytics
          </button>
        </div>
      </div>
    </div>
  );
};
