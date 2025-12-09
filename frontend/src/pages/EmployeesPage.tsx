import React, { useContext, useEffect, useState } from "react";
import type { UserRole } from "../App";
import "./employees.css";
import { AuthContext } from "../auth/authContext";
import { graphqlRequest } from "../lib/graphqlClient";
import { EmployeeFormModal } from "../components/EmployeeFormModal";
import { formatFullDateTime, formatRelativeTime } from "../lib/dateUtils";

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

type EmployeesPageProps = {
  currentRole: UserRole;
};

type EmployeesResponse = {
  employees: {
    items: Employee[];
    total: number;
    page: number;
    pageSize: number;
  };
};

const EMPLOYEES_QUERY = `
  query Employees(
    $filter: EmployeeFilter
    $page: Int
    $pageSize: Int
    $sortBy: EmployeeSortBy
    $sortOrder: SortOrder
  ) {
    employees(
      filter: $filter
      page: $page
      pageSize: $pageSize
      sortBy: $sortBy
      sortOrder: $sortOrder
    ) {
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
        createdAt
        updatedAt
      }
      total
      page
      pageSize
    }
  }
`;

const TERMINATE_MUTATION = `
  mutation TerminateEmployee($id: Int!) {
    terminateEmployee(id: $id) {
      id
      status
      updatedAt
    }
  }
`;

const DELETE_MUTATION = `
  mutation DeleteEmployee($id: Int!) {
    deleteEmployee(id: $id)
  }
`;

const CREATE_MUTATION = `
  mutation AddEmployee($input: EmployeeInput!) {
    addEmployee(input: $input) {
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
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_MUTATION = `
  mutation UpdateEmployee($id: Int!, $input: EmployeeInput!) {
    updateEmployee(id: $id, input: $input) {
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
      createdAt
      updatedAt
    }
  }
`;

const PAGE_SIZE = 6;

export const EmployeesPage: React.FC<EmployeesPageProps> = ({ currentRole }) => {
  let { accessToken } = useContext(AuthContext);
  
  // Fallback: if token is not in context, try to get it from localStorage
  if (!accessToken) {
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    console.log('[EmployeesPage] accessToken from context:', accessToken ? 'present' : 'null');
    console.log('[EmployeesPage] localStorage token:', storedToken ? 'present' : 'null');
    if (storedToken) {
      accessToken = storedToken;
      console.log('[EmployeesPage] ✅ Using token from localStorage as fallback');
    } else {
      console.log('[EmployeesPage] ❌ No token in context or localStorage!');
    }
  }

  const [view, setView] = useState<"grid" | "tiles">("grid");

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [modalEmployee, setModalEmployee] = useState<Employee | null>(null);

  const [sortBy, setSortBy] = useState<
    "NAME" | "AGE" | "ATTENDANCE" | "CREATED_AT"
  >("CREATED_AT");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "flagged" | "terminated">("");

  const [selected, setSelected] = useState<Employee | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchEmployees = async () => {
    if (!accessToken) {
      setError("Not authenticated. Please log in again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const filter: any = {};
      if (search.trim()) {
        filter.nameContains = search.trim();
      }
      if (statusFilter) {
        filter.status = statusFilter;
      }
      // Exclude admin users from the list
      filter.roleNot = "admin";

      const data = await graphqlRequest<EmployeesResponse>(
        EMPLOYEES_QUERY,
        {
          filter: Object.keys(filter).length ? filter : undefined,
          page,
          pageSize: PAGE_SIZE,
          sortBy,
          sortOrder,
        },
        accessToken
      );

      setEmployees(data.employees.items);
      setTotal(data.employees.total);
    } catch (err: any) {
      setError(err.message || "Failed to load employees.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('[EmployeesPage] useEffect triggered, accessToken:', accessToken ? 'present' : 'null');
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortBy, sortOrder, search, statusFilter, accessToken]);

  const handleTerminate = async (id: number) => {
    if (currentRole !== "director" || !accessToken) return;
    try {
      await graphqlRequest(
        TERMINATE_MUTATION,
        { id },
        accessToken
      );
      fetchEmployees();
      setOpenMenuId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (currentRole !== "director" || !accessToken) return;
    if (!window.confirm("Delete this employee permanently?")) return;
    try {
      await graphqlRequest(
        DELETE_MUTATION,
        { id },
        accessToken
      );
      // If last item on page deleted, move to previous page if needed
      if (employees.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchEmployees();
      }
      setOpenMenuId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFlag = async (emp: Employee) => {
    if ((currentRole !== "director" && currentRole !== "manager") || !accessToken) return;
    const newStatus = emp.status === "flagged" ? "active" : "flagged";
    try {
      await graphqlRequest(
        UPDATE_MUTATION,
        {
          id: emp.id,
          input: {
            name: emp.name,
            age: emp.age,
            className: emp.className,
            subjects: emp.subjects,
            attendance: emp.attendance,
            role: emp.role,
            status: newStatus,
            location: emp.location,
            lastLogin: emp.lastLogin,
          },
        },
        accessToken
      );
      fetchEmployees();
      setOpenMenuId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnterminate = async (emp: Employee) => {
    if (currentRole !== "director" || !accessToken) return;
    try {
      await graphqlRequest(
        UPDATE_MUTATION,
        {
          id: emp.id,
          input: {
            name: emp.name,
            age: emp.age,
            className: emp.className,
            subjects: emp.subjects,
            attendance: emp.attendance,
            role: emp.role,
            status: "active",
            location: emp.location,
            lastLogin: emp.lastLogin,
          },
        },
        accessToken
      );
      fetchEmployees();
      setOpenMenuId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewDetails = (emp: Employee) => {
    setSelected(emp);
    setOpenMenuId(null);
  };

  const handleEdit = (emp: Employee) => {
    setModalEmployee(emp);
    setShowModal(true);
    setOpenMenuId(null);
  };

  const handleAddNew = () => {
    setModalEmployee(null);
    setShowModal(true);
  };

  const handleSaveEmployee = async (data: Partial<Employee>) => {
    try {
      if (modalEmployee) {
        // Update existing
        await graphqlRequest(
          UPDATE_MUTATION,
          {
            id: modalEmployee.id,
            input: {
              name: data.name,
              age: data.age,
              className: data.className,
              subjects: data.subjects,
              attendance: data.attendance,
              role: data.role,
              status: data.status,
              location: data.location,
              lastLogin: modalEmployee.lastLogin, // Preserve existing lastLogin
            },
          },
          accessToken
        );
      } else {
        // Create new
        await graphqlRequest(
          CREATE_MUTATION,
          {
            input: {
              name: data.name,
              age: data.age,
              className: data.className,
              subjects: data.subjects,
              attendance: data.attendance,
              role: data.role || "employee",
              status: data.status || "active",
              location: data.location,
              lastLogin: new Date().toISOString(),
            },
          },
          accessToken
        );
      }
      setShowModal(false);
      setModalEmployee(null);
      fetchEmployees();
    } catch (err: any) {
      alert(err.message || "Failed to save employee");
    }
  };

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="employees-page">
      <div className="employees-header-row">
        <div>
          <h1>Employees</h1>
          <p className="employees-subtitle">
            Welcome to the Employee Management Page
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

          {(currentRole === "director" || currentRole === "manager") && (
            <button
              className="primary-btn"
              onClick={handleAddNew}
            >
              + Add Employee
            </button>
          )}
        </div>
      </div>

      {/* Filters row */}
      <div className="employees-filters-row">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />

        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value as any);
          }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="flagged">Flagged</option>
          <option value="terminated">Terminated</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) =>
            setSortBy(e.target.value as "NAME" | "AGE" | "ATTENDANCE" | "CREATED_AT")
          }
        >
          <option value="CREATED_AT">Sort by created</option>
          <option value="NAME">Sort by name</option>
          <option value="AGE">Sort by age</option>
          <option value="ATTENDANCE">Sort by attendance</option>
        </select>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as "ASC" | "DESC")}
        >
          <option value="DESC">Desc</option>
          <option value="ASC">Asc</option>
        </select>
      </div>

      {loading && <div>Loading employees...</div>}
      {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}

      {!loading && employees.length === 0 && (
        <div>No employees found. Try changing filters or add some seed data.</div>
      )}

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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id}>
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
                  <td>
                    <div style={{ position: "relative", display: "inline-block" }}>
                      <button
                        className="employee-menu-btn"
                        onClick={(evt) => {
                          evt.stopPropagation();
                          setOpenMenuId(openMenuId === e.id ? null : e.id);
                        }}
                      >
                        ⋯
                      </button>
                      {openMenuId === e.id && (
                        <div className="employee-menu">
                          <button onClick={() => handleViewDetails(e)}>
                            View details
                          </button>
                          {(currentRole === "director" || currentRole === "manager") && (
                            <>
                              <button onClick={() => handleEdit(e)}>Edit</button>
                              <button onClick={() => handleFlag(e)}>
                                {e.status === "flagged" ? "Unflag" : "Flag"}
                              </button>
                              {e.status === "terminated" ? (
                                <button onClick={() => handleUnterminate(e)}>
                                  Unterminate
                                </button>
                              ) : (
                                <button
                                  className="danger-btn"
                                  onClick={() => handleTerminate(e.id)}
                                >
                                  Terminate
                                </button>
                              )}
                              <button
                                className="danger-btn"
                                onClick={() => handleDelete(e.id)}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
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
                      {(currentRole === "director" || currentRole === "manager") && (
                        <>
                          <button onClick={() => handleEdit(e)}>Edit</button>
                          <button onClick={() => handleFlag(e)}>
                            {e.status === "flagged" ? "Unflag" : "Flag"}
                          </button>
                          {e.status === "terminated" ? (
                            <button onClick={() => handleUnterminate(e)}>
                              Unterminate
                            </button>
                          ) : (
                            <button onClick={() => handleTerminate(e.id)}>
                              Terminate
                            </button>
                          )}
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

      {/* Pagination footer */}
      <div className="employees-pagination">
        <span>
          Page {page} of {totalPages} · Total {total}
        </span>
        <div className="employees-pagination-buttons">
          <button
            disabled={!canPrev}
            onClick={() => canPrev && setPage((p) => p - 1)}
          >
            Prev
          </button>
          <button
            disabled={!canNext}
            onClick={() => canNext && setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>

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
                <strong>Class:</strong> {selected.className}
              </p>
              <p>
                <strong>Subjects:</strong> {selected.subjects.join(", ")}
              </p>
              <p>
                <strong>Attendance:</strong> {selected.attendance}%
              </p>
              <p>
                <strong>Role:</strong> {selected.role}</p>
              <p>
                <strong>Status:</strong> {selected.status}</p>
              <p>
                <strong>Location:</strong> {selected.location}</p>
              <p>
                <strong>Last login:</strong> {selected.lastLogin}</p>
              <p>
                <strong>Joined:</strong> {formatFullDateTime(selected.createdAt)}</p>
              <p>
                <strong>Last Updated:</strong> {formatRelativeTime(selected.updatedAt)}</p>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <EmployeeFormModal
          employee={modalEmployee}
          onSave={handleSaveEmployee}
          onCancel={() => {
            setShowModal(false);
            setModalEmployee(null);
          }}
        />
      )}
    </div>
  );
};
