import React, { useState, useEffect } from "react";
import { graphqlRequest } from "../lib/graphqlClient";

const EMPLOYEES_QUERY = `
  query Employees($filter: EmployeeFilter, $page: Int, $pageSize: Int, $sortBy: String, $sortOrder: String) {
    employees(filter: $filter, page: $page, pageSize: $pageSize, sortBy: $sortBy, sortOrder: $sortOrder) {
      items {
        id
        name
        email
        role
        status
        location
        attendance
        age
      }
      total
      page
      pageSize
    }
  }
`;

const roles = ["director", "manager", "employee"];
const statuses = ["ACTIVE", "UNDER_REVIEW", "FLAGGED", "TERMINATION_REQUESTED", "TERMINATED"];

export const AdvancedEmployeeSearch: React.FC = () => {
  const [filters, setFilters] = useState({
    nameContains: "",
    emailContains: "",
    role: "",
    status: "",
    location: "",
    attendanceMin: "",
    attendanceMax: "",
  });
  const [sortBy, setSortBy] = useState("NAME");
  const [sortOrder, setSortOrder] = useState("ASC");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [results, setResults] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line
  }, [filters, sortBy, sortOrder, page, pageSize]);

  const fetchEmployees = async () => {
    setLoading(true);
    const filterObj: any = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "" && value !== null) {
        filterObj[key] = key.includes("attendance") ? Number(value) : value;
      }
    });
    const result = await graphqlRequest(EMPLOYEES_QUERY, {
      filter: filterObj,
      page,
      pageSize,
      sortBy,
      sortOrder,
    });
    setResults(result.data.employees.items);
    setTotal(result.data.employees.total);
    setLoading(false);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);
  };

  return (
    <div style={{ padding: "2rem", background: "#f5f7fa", minHeight: "100vh" }}>
      <h1 style={{ margin: 0, color: "#111827", fontSize: "2rem" }}>Advanced Employee Search</h1>
      <div style={{ display: "flex", gap: "2rem", margin: "2rem 0" }}>
        <div style={{ flex: 1 }}>
          <h2>Filters</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <input name="nameContains" value={filters.nameContains} onChange={handleFilterChange} placeholder="Name contains" style={{ padding: "0.5rem" }} />
            <input name="emailContains" value={filters.emailContains} onChange={handleFilterChange} placeholder="Email contains" style={{ padding: "0.5rem" }} />
            <select name="role" value={filters.role} onChange={handleFilterChange} style={{ padding: "0.5rem" }}>
              <option value="">Any Role</option>
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select name="status" value={filters.status} onChange={handleFilterChange} style={{ padding: "0.5rem" }}>
              <option value="">Any Status</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input name="location" value={filters.location} onChange={handleFilterChange} placeholder="Location contains" style={{ padding: "0.5rem" }} />
            <input name="attendanceMin" value={filters.attendanceMin} onChange={handleFilterChange} placeholder="Attendance min" type="number" style={{ padding: "0.5rem" }} />
            <input name="attendanceMax" value={filters.attendanceMax} onChange={handleFilterChange} placeholder="Attendance max" type="number" style={{ padding: "0.5rem" }} />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <h2>Sort & Page</h2>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: "0.5rem" }}>
              <option value="NAME">Name</option>
              <option value="AGE">Age</option>
              <option value="ATTENDANCE">Attendance</option>
              <option value="CREATED_AT">Created At</option>
            </select>
            <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} style={{ padding: "0.5rem" }}>
              <option value="ASC">Ascending</option>
              <option value="DESC">Descending</option>
            </select>
            <input type="number" value={pageSize} min={1} max={100} onChange={e => setPageSize(Number(e.target.value))} style={{ width: "80px", padding: "0.5rem" }} />
          </div>
        </div>
      </div>
      <div style={{ margin: "2rem 0" }}>
        <h2>Results ({total})</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table style={{ width: "100%", background: "white", borderRadius: "8px", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#e5e7eb" }}>
                <th style={{ padding: "0.75rem" }}>Name</th>
                <th style={{ padding: "0.75rem" }}>Email</th>
                <th style={{ padding: "0.75rem" }}>Role</th>
                <th style={{ padding: "0.75rem" }}>Status</th>
                <th style={{ padding: "0.75rem" }}>Location</th>
                <th style={{ padding: "0.75rem" }}>Attendance</th>
                <th style={{ padding: "0.75rem" }}>Age</th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "2rem" }}>
                    No employees found.
                  </td>
                </tr>
              ) : (
                results.map(emp => (
                  <tr key={emp.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "0.75rem" }}>{emp.name}</td>
                    <td style={{ padding: "0.75rem" }}>{emp.email}</td>
                    <td style={{ padding: "0.75rem" }}>{emp.role}</td>
                    <td style={{ padding: "0.75rem" }}>{emp.status}</td>
                    <td style={{ padding: "0.75rem" }}>{emp.location}</td>
                    <td style={{ padding: "0.75rem" }}>{emp.attendance}</td>
                    <td style={{ padding: "0.75rem" }}>{emp.age}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
        <div style={{ marginTop: "2rem", display: "flex", justifyContent: "center", gap: "1rem" }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ padding: "0.5rem 1rem", background: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: page === 1 ? "not-allowed" : "pointer" }}
          >
            Previous
          </button>
          <span>Page {page}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={results.length < pageSize}
            style={{ padding: "0.5rem 1rem", background: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: results.length < pageSize ? "not-allowed" : "pointer" }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
