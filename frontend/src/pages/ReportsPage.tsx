import React from "react";

export const ReportsPage: React.FC = () => {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Reports</h1>
      <p>Generate and download various reports about employees.</p>

      <div style={{ marginTop: "2rem", display: "grid", gap: "1rem" }}>
        <div style={{ padding: "1.5rem", background: "white", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
          <h3 style={{ margin: "0 0 1rem 0" }}>Attendance Report</h3>
          <p style={{ color: "#6b7280", marginBottom: "1rem" }}>Generate monthly attendance report for all employees</p>
          <button style={{ padding: "0.5rem 1rem", background: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
            Generate Report
          </button>
        </div>

        <div style={{ padding: "1.5rem", background: "white", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
          <h3 style={{ margin: "0 0 1rem 0" }}>Performance Report</h3>
          <p style={{ color: "#6b7280", marginBottom: "1rem" }}>View performance metrics and evaluations</p>
          <button style={{ padding: "0.5rem 1rem", background: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
            Generate Report
          </button>
        </div>

        <div style={{ padding: "1.5rem", background: "white", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
          <h3 style={{ margin: "0 0 1rem 0" }}>Leave Report</h3>
          <p style={{ color: "#6b7280", marginBottom: "1rem" }}>Track leave requests and balances</p>
          <button style={{ padding: "0.5rem 1rem", background: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
            Generate Report
          </button>
        </div>

        <div style={{ padding: "1.5rem", background: "white", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
          <h3 style={{ margin: "0 0 1rem 0" }}>Employee Directory</h3>
          <p style={{ color: "#6b7280", marginBottom: "1rem" }}>Export complete employee directory</p>
          <button style={{ padding: "0.5rem 1rem", background: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
            Download CSV
          </button>
        </div>
      </div>
    </div>
  );
};
