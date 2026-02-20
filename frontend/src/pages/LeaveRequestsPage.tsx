import React, { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../auth/authContext";
import { graphqlRequest } from "../lib/graphqlClient";
import { formatRelativeTime } from "../lib/dateUtils";
import type { AppPage } from "../types/navigation";

type LeaveRequest = {
  id: number;
  employeeId: number;
  employeeName?: string;
  reason: string;
  startDate: string;
  endDate: string;
  type?: string;
  status: string;
  adminNote?: string;
  createdAt: string;
};

const MY_LEAVE_REQUESTS_QUERY = `
  query MyLeaveRequests {
    myLeaveRequests {
      id
      employeeId
      reason
      startDate
      endDate
      type
      status
      adminNote
      createdAt
    }
  }
`;

const ALL_LEAVE_REQUESTS_QUERY = `
  query LeaveRequests($status: String) {
    leaveRequests(status: $status) {
      id
      employeeId
      employeeName
      reason
      startDate
      endDate
      type
      status
      adminNote
      createdAt
    }
  }
`;

const CREATE_LEAVE_REQUEST_MUTATION = `
  mutation CreateLeaveRequest($input: LeaveRequestInput!) {
    createLeaveRequest(input: $input) {
      id
      reason
      startDate
      endDate
      type
      status
    }
  }
`;

const UPDATE_LEAVE_STATUS_MUTATION = `
  mutation UpdateLeaveRequestStatus($id: Int!, $status: String!, $adminNote: String) {
    updateLeaveRequestStatus(id: $id, status: $status, adminNote: $adminNote) {
      id
      status
      adminNote
    }
  }
`;

type LeaveRequestsPageProps = {
  onNavigate?: (page: AppPage) => void;
};

const isManagerOrDirector = (role: string) => role === "director" || role === "manager";

const getStatusColor = (status: string) => {
  switch (status) {
    case "approved":
      return { bg: "#dcfce7", color: "#166534" };
    case "rejected":
      return { bg: "#fee2e2", color: "#991b1b" };
    case "pending_director":
      return { bg: "#e0e7ff", color: "#3730a3" };
    default:
      return { bg: "#fef3c7", color: "#92400e" };
  }
};

const normalizeLabel = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

export const LeaveRequestsPage: React.FC<LeaveRequestsPageProps> = ({ onNavigate }) => {
  const { accessToken, user } = useContext(AuthContext);
  const role = user?.role || "employee";

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [leaveType, setLeaveType] = useState("annual");

  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [adminNote, setAdminNote] = useState("");

  const isAdmin = isManagerOrDirector(role);

  const canReviewRequest = (request: LeaveRequest) => {
    if (role === "director") {
      return request.status === "pending" || request.status === "pending_director";
    }
    if (role === "manager") {
      return request.status === "pending";
    }
    return false;
  };

  const pendingCount = useMemo(
    () => requests.filter((request) => request.status === "pending" || request.status === "pending_director").length,
    [requests],
  );

  useEffect(() => {
    void fetchRequests();
  }, [accessToken, role, statusFilter]);

  const fetchRequests = async () => {
    if (!accessToken) {
      setRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      if (isAdmin) {
        const data = await graphqlRequest<{ leaveRequests: LeaveRequest[] }>(
          ALL_LEAVE_REQUESTS_QUERY,
          { status: statusFilter || null },
          accessToken,
        );
        setRequests(data.leaveRequests || []);
      } else {
        const data = await graphqlRequest<{ myLeaveRequests: LeaveRequest[] }>(MY_LEAVE_REQUESTS_QUERY, {}, accessToken);
        setRequests(data.myLeaveRequests || []);
      }
    } catch (error) {
      console.error("Failed to load leave requests:", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!accessToken) {
      alert("Please sign in again.");
      return;
    }

    try {
      await graphqlRequest(
        CREATE_LEAVE_REQUEST_MUTATION,
        { input: { reason, startDate, endDate, type: leaveType } },
        accessToken,
      );
      setReason("");
      setStartDate("");
      setEndDate("");
      setLeaveType("annual");
      setShowForm(false);
      alert("Leave request submitted.");
      await fetchRequests();
    } catch (error: any) {
      alert(error?.message || "Failed to submit leave request.");
    }
  };

  const handleUpdateStatus = async (id: number, status: "approved" | "rejected") => {
    if (!accessToken) {
      alert("Please sign in again.");
      return;
    }

    try {
      await graphqlRequest(UPDATE_LEAVE_STATUS_MUTATION, { id, status, adminNote: adminNote || null }, accessToken);
      setSelectedRequest(null);
      setAdminNote("");
      await fetchRequests();
    } catch (error: any) {
      alert(error?.message || "Failed to update leave request.");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0 }}>Leave Requests</h1>
          <p style={{ margin: "0.45rem 0 0 0", color: "#6b7280" }}>
            {isAdmin ? `Manage leave requests (${pendingCount} pending)` : "Submit and track your leave requests"}
          </p>
        </div>

        {!isAdmin && (
          <button
            type="button"
            onClick={() => setShowForm((value) => !value)}
            style={{
              padding: "0.75rem 1.1rem",
              background: "#1d4ed8",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "700",
            }}
          >
            {showForm ? "Cancel" : "New Leave Request"}
          </button>
        )}
      </div>

      <div style={{ marginBottom: "1.2rem" }}>
        <button
          type="button"
          onClick={() => onNavigate?.("notificationInbox")}
          style={{
            color: "#1d4ed8",
            textDecoration: "underline",
            fontWeight: 600,
            border: "none",
            background: "transparent",
            padding: 0,
            cursor: "pointer",
          }}
        >
          View related notifications
        </button>
      </div>

      {!isAdmin && showForm && (
        <div style={{ padding: "1.4rem", background: "white", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "1.2rem" }}>
          <h3 style={{ marginTop: 0 }}>Submit Leave Request</h3>
          <form onSubmit={handleCreateRequest}>
            <div style={{ marginBottom: "0.8rem" }}>
              <label style={{ display: "block", fontWeight: 700, marginBottom: "0.35rem" }}>Reason</label>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                required
                rows={3}
                style={{ width: "100%", padding: "0.7rem", border: "1px solid #d1d5db", borderRadius: "8px" }}
                placeholder="Explain your leave request"
              />
            </div>

            <div style={{ marginBottom: "0.8rem" }}>
              <label style={{ display: "block", fontWeight: 700, marginBottom: "0.35rem" }}>Leave Type</label>
              <select
                value={leaveType}
                onChange={(event) => setLeaveType(event.target.value)}
                style={{ width: "100%", padding: "0.7rem", border: "1px solid #d1d5db", borderRadius: "8px" }}
              >
                <option value="annual">Annual</option>
                <option value="sick">Sick</option>
                <option value="special">Special</option>
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", fontWeight: 700, marginBottom: "0.35rem" }}>Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  required
                  style={{ width: "100%", padding: "0.7rem", border: "1px solid #d1d5db", borderRadius: "8px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontWeight: 700, marginBottom: "0.35rem" }}>End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  required
                  style={{ width: "100%", padding: "0.7rem", border: "1px solid #d1d5db", borderRadius: "8px" }}
                />
              </div>
            </div>

            <p style={{ margin: "0 0 0.8rem", fontSize: "0.85rem", color: "#6b7280" }}>
              Long or special leave may be escalated to Director approval automatically.
            </p>

            <button
              type="submit"
              style={{
                padding: "0.7rem 1.1rem",
                background: "#059669",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "700",
              }}
            >
              Submit Request
            </button>
          </form>
        </div>
      )}

      {isAdmin && (
        <div style={{ marginBottom: "1rem" }}>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            style={{ padding: "0.7rem", border: "1px solid #d1d5db", borderRadius: "8px", minWidth: "230px" }}
          >
            <option value="">All Requests</option>
            <option value="pending">Pending</option>
            <option value="pending_director">Pending Director</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      )}

      {loading ? (
        <p style={{ color: "#64748b" }}>Loading leave requests...</p>
      ) : requests.length === 0 ? (
        <div style={{ padding: "2rem", textAlign: "center", background: "white", borderRadius: "10px", border: "1px solid #e5e7eb" }}>
          <p style={{ color: "#6b7280", margin: 0 }}>No leave requests found</p>
        </div>
      ) : (
        requests.map((request) => {
          const statusStyle = getStatusColor(request.status);
          return (
            <div key={request.id} style={{ padding: "1rem", background: "white", borderRadius: "10px", border: "1px solid #e5e7eb", marginBottom: "0.8rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "0.8rem" }}>
                <div style={{ flex: 1 }}>
                  {isAdmin && (
                    <p style={{ margin: "0 0 0.4rem 0", fontWeight: 700, color: "#374151" }}>
                      Employee: {request.employeeName || `ID ${request.employeeId}`}
                    </p>
                  )}
                  <p style={{ margin: "0 0 0.35rem 0", color: "#374151" }}>
                    <strong>Dates:</strong> {request.startDate} to {request.endDate}
                  </p>
                  <p style={{ margin: "0 0 0.35rem 0", color: "#374151" }}>
                    <strong>Type:</strong> {normalizeLabel(request.type || "annual")}
                  </p>
                  <p style={{ margin: "0 0 0.35rem 0", color: "#6b7280" }}>
                    <strong>Reason:</strong> {request.reason}
                  </p>
                  {request.adminNote && (
                    <p style={{ margin: "0.35rem 0 0 0", padding: "0.6rem", background: "#f8fafc", borderRadius: "8px", color: "#374151" }}>
                      <strong>Admin Note:</strong> {request.adminNote}
                    </p>
                  )}
                  <p style={{ margin: "0.6rem 0 0 0", fontSize: "0.82rem", color: "#94a3b8" }}>
                    Submitted {formatRelativeTime(request.createdAt)}
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.45rem" }}>
                  <span style={{ padding: "0.45rem 0.7rem", background: statusStyle.bg, color: statusStyle.color, borderRadius: "8px", fontSize: "0.78rem", fontWeight: 800 }}>
                    {normalizeLabel(request.status)}
                  </span>

                  {isAdmin && canReviewRequest(request) && (
                    <button
                      type="button"
                      onClick={() => setSelectedRequest(request)}
                      style={{
                        border: "none",
                        background: "#1d4ed8",
                        color: "#ffffff",
                        borderRadius: "8px",
                        padding: "0.45rem 0.65rem",
                        fontSize: "0.78rem",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      Review
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}

      {selectedRequest && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "grid", placeItems: "center", zIndex: 1300 }}>
          <div style={{ background: "white", borderRadius: "10px", padding: "1.2rem", width: "min(520px, 92vw)" }}>
            <h3 style={{ marginTop: 0 }}>Review Leave Request</h3>
            <p style={{ margin: "0 0 0.5rem", color: "#6b7280" }}>
              Employee: <strong>{selectedRequest.employeeName || `ID ${selectedRequest.employeeId}`}</strong>
            </p>
            <p style={{ margin: "0 0 0.8rem", color: "#6b7280" }}>
              Type: <strong>{normalizeLabel(selectedRequest.type || "annual")}</strong>
            </p>

            <label style={{ display: "block", fontWeight: 700, marginBottom: "0.35rem" }}>Admin Note (optional)</label>
            <textarea
              value={adminNote}
              onChange={(event) => setAdminNote(event.target.value)}
              rows={3}
              style={{ width: "100%", padding: "0.7rem", border: "1px solid #d1d5db", borderRadius: "8px", marginBottom: "1rem" }}
              placeholder="Add context for the employee"
            />

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => {
                  void handleUpdateStatus(selectedRequest.id, "approved");
                }}
                style={{ border: "none", background: "#059669", color: "#fff", borderRadius: "8px", padding: "0.65rem 1rem", fontWeight: 700, cursor: "pointer" }}
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleUpdateStatus(selectedRequest.id, "rejected");
                }}
                style={{ border: "none", background: "#dc2626", color: "#fff", borderRadius: "8px", padding: "0.65rem 1rem", fontWeight: 700, cursor: "pointer" }}
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRequest(null);
                  setAdminNote("");
                }}
                style={{ border: "1px solid #cbd5e1", background: "#fff", color: "#334155", borderRadius: "8px", padding: "0.65rem 1rem", fontWeight: 700, cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
