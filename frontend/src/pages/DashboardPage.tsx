import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../auth/authContext";
import { graphqlRequest } from "../lib/graphqlClient";

type Employee = {
  id: number;
  name: string;
  attendance: number;
  status: string;
};

const EMPLOYEES_QUERY = `
  query Employees {
    employees(page: 1, pageSize: 1000) {
      items {
        id
        name
        attendance
        status
      }
      total
    }
  }
`;

export const DashboardPage: React.FC = () => {
  const { accessToken } = useContext(AuthContext);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    onLeave: 0,
    flagged: 0,
    terminated: 0,
    avgAttendance: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    if (!accessToken) return;
    
    setLoading(true);
    try {
      const data: any = await graphqlRequest(EMPLOYEES_QUERY, {}, accessToken);
      const employees: Employee[] = data.employees.items;
      const total = data.employees.total;

      const active = employees.filter(e => e.status === "active").length;
      const onLeave = employees.filter(e => e.status === "on-leave").length;
      const flagged = employees.filter(e => e.status === "flagged").length;
      const terminated = employees.filter(e => e.status === "terminated").length;
      
      const avgAttendance = employees.length > 0
        ? employees.reduce((sum, e) => sum + e.attendance, 0) / employees.length
        : 0;

      setStats({ total, active, onLeave, flagged, terminated, avgAttendance });
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>Dashboard</h1>
        <p>Loading statistics...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Dashboard</h1>
      <p>Welcome to the Employee Management System dashboard.</p>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem", marginTop: "2rem" }}>
        <div style={{ padding: "1.5rem", background: "#f0f9ff", borderRadius: "8px", border: "1px solid #bae6fd" }}>
          <h3 style={{ margin: "0 0 0.5rem 0", color: "#0369a1" }}>Total Employees</h3>
          <p style={{ fontSize: "2rem", fontWeight: "bold", margin: 0, color: "#0c4a6e" }}>{stats.total}</p>
        </div>
        
        <div style={{ padding: "1.5rem", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
          <h3 style={{ margin: "0 0 0.5rem 0", color: "#15803d" }}>Active</h3>
          <p style={{ fontSize: "2rem", fontWeight: "bold", margin: 0, color: "#14532d" }}>{stats.active}</p>
        </div>
        
        <div style={{ padding: "1.5rem", background: "#fef3c7", borderRadius: "8px", border: "1px solid #fde68a" }}>
          <h3 style={{ margin: "0 0 0.5rem 0", color: "#a16207" }}>On Leave</h3>
          <p style={{ fontSize: "2rem", fontWeight: "bold", margin: 0, color: "#713f12" }}>{stats.onLeave}</p>
        </div>
        
        <div style={{ padding: "1.5rem", background: "#fee2e2", borderRadius: "8px", border: "1px solid #fecaca" }}>
          <h3 style={{ margin: "0 0 0.5rem 0", color: "#b91c1c" }}>Flagged</h3>
          <p style={{ fontSize: "2rem", fontWeight: "bold", margin: 0, color: "#7f1d1d" }}>{stats.flagged}</p>
        </div>

        <div style={{ padding: "1.5rem", background: "#f3f4f6", borderRadius: "8px", border: "1px solid #d1d5db" }}>
          <h3 style={{ margin: "0 0 0.5rem 0", color: "#4b5563" }}>Terminated</h3>
          <p style={{ fontSize: "2rem", fontWeight: "bold", margin: 0, color: "#1f2937" }}>{stats.terminated}</p>
        </div>
        
        <div style={{ padding: "1.5rem", background: "#fce7f3", borderRadius: "8px", border: "1px solid #fbcfe8" }}>
          <h3 style={{ margin: "0 0 0.5rem 0", color: "#be185d" }}>Average Attendance</h3>
          <p style={{ fontSize: "2rem", fontWeight: "bold", margin: 0, color: "#831843" }}>{stats.avgAttendance.toFixed(1)}%</p>
        </div>
      </div>

      <div style={{ marginTop: "3rem" }}>
        <h2>Quick Actions</h2>
        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", flexWrap: "wrap" }}>
          <button 
            onClick={() => window.location.reload()}
            style={{ padding: "0.75rem 1.5rem", background: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
          >
            Refresh Dashboard
          </button>
          <button 
            style={{ padding: "0.75rem 1.5rem", background: "#10b981", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
            onClick={() => alert("Navigate to Reports page to generate reports")}
          >
            Generate Report
          </button>
          <button 
            style={{ padding: "0.75rem 1.5rem", background: "#8b5cf6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
            onClick={() => alert("Analytics feature coming soon!")}
          >
            View Analytics
          </button>
        </div>
      </div>
    </div>
  );
};
