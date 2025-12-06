import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../auth/authContext";
import { graphqlRequest } from "../lib/graphqlClient";

type Employee = {
  id: number;
  name: string;
  age: number;
  className: string;
  subjects: string[];
  attendance: number;
  role: string;
  status: string;
  location: string;
  lastLogin: string;
};

const EMPLOYEES_QUERY = `
  query Employees {
    employees(page: 1, pageSize: 1000) {
      items {
        id
        name
        age
        className
        subjects
        attendance
        role
        status
        location
        lastLogin
      }
    }
  }
`;

export const ReportsPage: React.FC = () => {
  const { accessToken, user } = useContext(AuthContext);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  
  const isManagerOrAbove = user?.role === "director" || user?.role === "manager";

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    if (!accessToken) return;
    try {
      const data: any = await graphqlRequest(EMPLOYEES_QUERY, {}, accessToken);
      setEmployees(data.employees.items);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
    }
  };

  const generateAttendanceReport = () => {
    setLoading(true);
    setTimeout(() => {
      const report = `ATTENDANCE REPORT - ${new Date().toLocaleDateString()}\n\n` +
        `Total Employees: ${employees.length}\n` +
        `Average Attendance: ${(employees.reduce((sum, e) => sum + e.attendance, 0) / employees.length).toFixed(1)}%\n\n` +
        `Employee Details:\n` +
        employees.map(e => 
          `${e.name} (${e.className}): ${e.attendance}% - ${e.status}`
        ).join('\n');
      
      downloadTextFile(report, `attendance-report-${Date.now()}.txt`);
      setLoading(false);
      alert("Attendance report generated successfully!");
    }, 500);
  };

  const generatePerformanceReport = () => {
    setLoading(true);
    setTimeout(() => {
      const report = `PERFORMANCE REPORT - ${new Date().toLocaleDateString()}\n\n` +
        `Total Employees: ${employees.length}\n` +
        `High Performers (>95% attendance): ${employees.filter(e => e.attendance > 95).length}\n` +
        `Average Performers (90-95%): ${employees.filter(e => e.attendance >= 90 && e.attendance <= 95).length}\n` +
        `Low Performers (<90%): ${employees.filter(e => e.attendance < 90).length}\n\n` +
        `Employee Performance:\n` +
        employees
          .sort((a, b) => b.attendance - a.attendance)
          .map(e => 
            `${e.name} (${e.role}): ${e.attendance}% - Status: ${e.status}`
          ).join('\n');
      
      downloadTextFile(report, `performance-report-${Date.now()}.txt`);
      setLoading(false);
      alert("Performance report generated successfully!");
    }, 500);
  };

  const generateLeaveReport = () => {
    setLoading(true);
    setTimeout(() => {
      const report = `LEAVE REPORT - ${new Date().toLocaleDateString()}\n\n` +
        `Employees on Leave: ${employees.filter(e => e.status === 'on-leave').length}\n` +
        `Active Employees: ${employees.filter(e => e.status === 'active').length}\n` +
        `Terminated: ${employees.filter(e => e.status === 'terminated').length}\n\n` +
        `Status Details:\n` +
        employees.map(e => 
          `${e.name} - ${e.status} (Last Login: ${new Date(e.lastLogin).toLocaleDateString()})`
        ).join('\n');
      
      downloadTextFile(report, `leave-report-${Date.now()}.txt`);
      setLoading(false);
      alert("Leave report generated successfully!");
    }, 500);
  };

  const downloadCSV = () => {
    setLoading(true);
    setTimeout(() => {
      const headers = ['ID', 'Name', 'Age', 'Class', 'Subjects', 'Attendance', 'Role', 'Status', 'Location', 'Last Login'];
      const csvContent = [
        headers.join(','),
        ...employees.map(e => 
          [
            e.id,
            `"${e.name}"`,
            e.age,
            `"${e.className}"`,
            `"${e.subjects.join('; ')}"`,
            e.attendance,
            e.role,
            e.status,
            `"${e.location}"`,
            new Date(e.lastLogin).toLocaleString()
          ].join(',')
        )
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `employee-directory-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setLoading(false);
      alert("Employee directory exported successfully!");
    }, 500);
  };

  const downloadTextFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isManagerOrAbove) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>Reports</h1>
        <div style={{ marginTop: "2rem", padding: "2rem", background: "#fee2e2", border: "1px solid #fecaca", borderRadius: "8px" }}>
          <h2 style={{ margin: "0 0 1rem 0", color: "#991b1b" }}>Access Denied</h2>
          <p style={{ color: "#7f1d1d", margin: 0 }}>
            Only Managers and Directors have permission to generate and download reports. 
            Please contact your manager or system administrator if you need access to report data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Reports</h1>
      <p>Generate and download various reports about employees.</p>
      <div style={{ marginTop: "1rem", padding: "0.75rem", background: "#dbeafe", border: "1px solid #93c5fd", borderRadius: "6px" }}>
        <p style={{ margin: 0, color: "#1e40af", fontSize: "0.875rem" }}>
          ⚠️ <strong>Admin Only:</strong> These reports contain sensitive employee data. Handle with care.
        </p>
      </div>

      <div style={{ marginTop: "2rem", display: "grid", gap: "1rem" }}>
        <div style={{ padding: "1.5rem", background: "white", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
          <h3 style={{ margin: "0 0 1rem 0" }}>Attendance Report</h3>
          <p style={{ color: "#6b7280", marginBottom: "1rem" }}>Generate monthly attendance report for all employees</p>
          <button 
            onClick={generateAttendanceReport} 
            disabled={loading}
            style={{ padding: "0.5rem 1rem", background: loading ? "#9ca3af" : "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Generating..." : "Generate Report"}
          </button>
        </div>

        <div style={{ padding: "1.5rem", background: "white", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
          <h3 style={{ margin: "0 0 1rem 0" }}>Performance Report</h3>
          <p style={{ color: "#6b7280", marginBottom: "1rem" }}>View performance metrics and evaluations</p>
          <button 
            onClick={generatePerformanceReport}
            disabled={loading}
            style={{ padding: "0.5rem 1rem", background: loading ? "#9ca3af" : "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Generating..." : "Generate Report"}
          </button>
        </div>

        <div style={{ padding: "1.5rem", background: "white", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
          <h3 style={{ margin: "0 0 1rem 0" }}>Leave Report</h3>
          <p style={{ color: "#6b7280", marginBottom: "1rem" }}>Track leave requests and balances</p>
          <button 
            onClick={generateLeaveReport}
            disabled={loading}
            style={{ padding: "0.5rem 1rem", background: loading ? "#9ca3af" : "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Generating..." : "Generate Report"}
          </button>
        </div>

        <div style={{ padding: "1.5rem", background: "white", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
          <h3 style={{ margin: "0 0 1rem 0" }}>Employee Directory</h3>
          <p style={{ color: "#6b7280", marginBottom: "1rem" }}>Export complete employee directory</p>
          <button 
            onClick={downloadCSV}
            disabled={loading}
            style={{ padding: "0.5rem 1rem", background: loading ? "#9ca3af" : "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Exporting..." : "Download CSV"}
          </button>
        </div>
      </div>
    </div>
  );
};
