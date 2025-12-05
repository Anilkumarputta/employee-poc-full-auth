import React, { useState, useEffect } from "react";
import type { Employee } from "../pages/EmployeesPage";

type Props = {
  employee?: Employee | null;
  onSave: (data: Partial<Employee>) => void;
  onCancel: () => void;
};

export const EmployeeFormModal: React.FC<Props> = ({ employee, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: employee?.name || "",
    age: employee?.age || 18,
    className: employee?.className || "",
    subjects: employee?.subjects?.join(", ") || "",
    attendance: employee?.attendance || 0,
    role: employee?.role || "employee" as "admin" | "employee",
    status: employee?.status || "active" as "active" | "terminated" | "flagged",
    location: employee?.location || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      subjects: formData.subjects.split(",").map(s => s.trim()).filter(Boolean),
    });
  };

  return (
    <div className="employee-modal-backdrop" onClick={onCancel}>
      <div className="employee-modal" onClick={(e) => e.stopPropagation()}>
        <div className="employee-modal-header">
          <h2>{employee ? "Edit Employee" : "Add Employee"}</h2>
          <button onClick={onCancel}>Close</button>
        </div>
        <div className="employee-modal-body">
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>
                Name:
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{ display: "block", width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
                />
              </label>
            </div>
            
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>
                Age:
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                  required
                  min={18}
                  max={100}
                  style={{ display: "block", width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
                />
              </label>
            </div>
            
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>
                Class:
                <input
                  type="text"
                  value={formData.className}
                  onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                  required
                  style={{ display: "block", width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
                />
              </label>
            </div>
            
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>
                Subjects (comma-separated):
                <input
                  type="text"
                  value={formData.subjects}
                  onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                  required
                  placeholder="Math, Physics, Chemistry"
                  style={{ display: "block", width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
                />
              </label>
            </div>
            
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>
                Attendance (%):
                <input
                  type="number"
                  value={formData.attendance}
                  onChange={(e) => setFormData({ ...formData, attendance: parseInt(e.target.value) })}
                  required
                  min={0}
                  max={100}
                  style={{ display: "block", width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
                />
              </label>
            </div>
            
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>
                Role:
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as "admin" | "employee" })}
                  style={{ display: "block", width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
            </div>
            
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>
                Status:
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "terminated" | "flagged" })}
                  style={{ display: "block", width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
                >
                  <option value="active">Active</option>
                  <option value="terminated">Terminated</option>
                  <option value="flagged">Flagged</option>
                </select>
              </label>
            </div>
            
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>
                Location:
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  style={{ display: "block", width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
                />
              </label>
            </div>
            
            <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
              <button type="submit" className="primary-btn" style={{ flex: 1 }}>
                {employee ? "Update" : "Create"}
              </button>
              <button type="button" onClick={onCancel} style={{ flex: 1 }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
