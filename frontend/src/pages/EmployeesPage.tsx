import React, { useState } from "react";
import type { UserRole } from "../App";
import "./employees.css";

export type Employee = {
  id: number;
  name: string;
  age: number;
  className: string;
  subjects: string[];
  attendance: number;
  role: "admin" | "employee";
  status: "active" | "terminated" | "flagged";
  location: string;
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
};

const MOCK_EMPLOYEES: Employee[] = [
  {
    id: 1,
    name: "John Doe",
    age: 29,
    className: "Class A",
    subjects: ["Math", "Physics"],
    attendance: 95,
    role: "employee",
    status: "active",
    location: "New York",
    lastLogin: "2024-11-30 09:12",
    createdAt: "2024-01-10",
    updatedAt: "2024-02-03",
  },
  {
    id: 2,
    name: "Mary Johnson",
    age: 31,
    className: "Class B",
    subjects: ["Chemistry", "Biology"],
    attendance: 88,
    role: "employee",
    status: "active",
    location: "Austin",
    lastLogin: "2024-11-29 17:45",
    createdAt: "2024-01-11",
    updatedAt: "2024-02-01",
  },
];

type Props = {
  currentRole: UserRole;
};

export const EmployeesPage: React.FC<Props> = ({ currentRole }) => {
  const [view, setView] = useState<"grid" | "tiles">("grid");
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const handleTerminate = (id: number) => {
    if (currentRole !== "admin") return;
    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: "terminated" } : e))
    );
    setOpenMenuId(null);
  };

  const handleFlag = (id: number) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: "flagged" } : e))
    );
    setOpenMenuId(null);
  };

  const handleDelete = (id: number) => {
    if (currentRole !== "admin") return;
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    setOpenMenuId(null);
  };

  const handleEdit = (emp: Employee) => {
    setSelected(emp);
    setOpenMenuId(null);
  };

  return (
    <div className="employees-page">
      <div className="employees-header-row">
        <div>
          <h1>Employees</h1>
          <p className="employees-subtitle">
            Grid view, tile view, admin-only actions, and details popup.
          </p>
        </div>

        <div className="employees-actions-row">
          <div className="view-toggle">
            <button
              className={view === "grid" ? "active" : ""}
              onClick={() => setView("grid")}
            >
              Grid view
            </button>
            <button
              className={view === "tiles" ? "active" : ""}
              onClick={() => setView("tiles")}
            >
              Tile view
            </button>
          </div>

          {currentRole === "admin" && (
            <button className="primary-btn">+ Add Employee</button>
          )}
        </div>
      </div>

      {view === "grid" ? (
        <div className="employees-table-wrapper">
          <table className="employees-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Age</th>
                <th>Class</th>
                <th>Subjects</th>
                <th>Attendance</th>
                <th>Role</th>
                <th>Status</th>
                <th>Location</th>
                <th>Last login</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id} onClick={() => setSelected(e)}>
                  <td>{e.id}</td>
                  <td>{e.name}</td>
                  <td>{e.age}</td>
                  <td>{e.className}</td>
                  <td>{e.subjects.join(", ")}</td>
                  <td>{e.attendance}%</td>
                  <td>{e.role}</td>
                  <td>{e.status}</td>
                  <td>{e.location}</td>
                  <td>{e.lastLogin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="employees-tiles">
          {employees.map((e) => (
            <div
              key={e.id}
              className={
                e.status !== "active"
                  ? "employee-tile employee-tile--inactive"
                  : "employee-tile"
              }
              onClick={() => setSelected(e)}
            >
              <div className="employee-tile-top">
                <div>
                  <div className="employee-name">{e.name}</div>
                  <div className="employee-meta">
                    {e.className} • Age {e.age}
                  </div>
                </div>

                <div
                  className="employee-menu-wrapper"
                  onClick={(ev) => ev.stopPropagation()}
                >
                  <button
                    className="employee-menu-trigger"
                    onClick={() =>
                      setOpenMenuId((id) => (id === e.id ? null : e.id))
                    }
                  >
                    ⋯
                  </button>
                  {openMenuId === e.id && (
                    <div className="employee-menu">
                      <button onClick={() => setSelected(e)}>
                        View details
                      </button>
                      <button onClick={() => handleFlag(e.id)}>Flag</button>
                      {currentRole === "admin" && (
                        <>
                          <button onClick={() => handleEdit(e)}>Edit</button>
                          <button onClick={() => handleTerminate(e.id)}>
                            Terminate
                          </button>
                          <button
                            className="danger"
                            onClick={() => handleDelete(e.id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="employee-tile-bottom">
                <div>Attendance: {e.attendance}%</div>
                <div>Subjects: {e.subjects.join(", ")}</div>
                <div className="employee-status-pill">{e.status}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div
          className="employee-modal-backdrop"
          onClick={() => setSelected(null)}
        >
          <div
            className="employee-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="employee-modal-header">
              <h2>{selected.name}</h2>
              <button onClick={() => setSelected(null)}>Close</button>
            </div>
            <div className="employee-modal-body">
              <p>
                <strong>ID:</strong> {selected.id}
              </p>
              <p>
                <strong>Age:</strong> {selected.age}
              </p>
              <p>
                <strong>Class:</strong> {selected.className}</p>
              <p>
                <strong>Subjects:</strong> {selected.subjects.join(", ")}</p>
              <p>
                <strong>Attendance:</strong> {selected.attendance}%</p>
              <p>
                <strong>Role:</strong> {selected.role}</p>
              <p>
                <strong>Status:</strong> {selected.status}</p>
              <p>
                <strong>Location:</strong> {selected.location}</p>
              <p>
                <strong>Last login:</strong> {selected.lastLogin}</p>
              <p>
                <strong>Created:</strong> {selected.createdAt}</p>
              <p>
                <strong>Updated:</strong> {selected.updatedAt}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
