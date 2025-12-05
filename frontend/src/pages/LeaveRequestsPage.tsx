import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../auth/authContext";
import { graphqlRequest } from "../lib/graphqlClient";

type LeaveRequest = {
  id: number;
  employeeId: number;
  employeeName?: string;
  reason: string;
  startDate: string;
  endDate: string;
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

export const LeaveRequestsPage: React.FC = () => {
  const { accessToken, user } = useContext(AuthContext);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  
  // Form state
  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Admin action state
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [adminNote, setAdminNote] = useState("");

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      if (isAdmin) {
        const data: any = await graphqlRequest(
          ALL_LEAVE_REQUESTS_QUERY,
          { status: statusFilter || undefined },
          accessToken
        );
        setRequests(data.leaveRequests);
      } else {
        const data: any = await graphqlRequest(MY_LEAVE_REQUESTS_QUERY, {}, accessToken);
        setRequests(data.myLeaveRequests);
      }
    } catch (err) {
      console.error("Failed to fetch leave requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await graphqlRequest(
        CREATE_LEAVE_REQUEST_MUTATION,
        { input: { reason, startDate, endDate } },
        accessToken!
      );
      setReason("");
      setStartDate("");
      setEndDate("");
      setShowForm(false);
      alert("Leave request submitted successfully!");
      fetchRequests();
    } catch (err: any) {
      alert("Failed to create leave request: " + err.message);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await graphqlRequest(
        UPDATE_LEAVE_STATUS_MUTATION,
        { id, status, adminNote: adminNote || null },
        accessToken!
      );
      setSelectedRequest(null);
      setAdminNote("");
      alert(`Leave request ${status}!`);
      fetchRequests();
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return { bg: "#d1fae5", color: "#065f46" };
      case "rejected": return { bg: "#fee2e2", color: "#991b1b" };
      default: return { bg: "#fef3c7", color: "#92400e" };
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>Leave Requests</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ margin: 0 }}>Leave Requests</h1>
          <p style={{ margin: "0.5rem 0 0 0", color: "#6b7280" }}>
            {isAdmin ? "Manage employee leave requests" : "Submit and track your leave requests"}
          </p>
        </div>
        {!isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            style={{ padding: "0.75rem 1.5rem", background: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
          >
            {showForm ? "Cancel" : "+ New Leave Request"}
          </button>
        )}
      </div>

      {/* Employee: New Leave Request Form */}
      {!isAdmin && showForm && (
        <div style={{ padding: "2rem", background: "white", borderRadius: "8px", border: "1px solid #e5e7eb", marginBottom: "2rem" }}>
          <h3 style={{ margin: "0 0 1rem 0" }}>Submit Leave Request</h3>
          <form onSubmit={handleCreateRequest}>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem" }}>Reason</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                rows={3}
                style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "6px" }}
                placeholder="Explain your reason for leave..."
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem" }}>Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "6px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem" }}>End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "6px" }}
                />
              </div>
            </div>
            <button
              type="submit"
              style={{ padding: "0.75rem 1.5rem", background: "#10b981", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
            >
              Submit Request
            </button>
          </form>
        </div>
      )}

      {/* Admin: Filter */}
      {isAdmin && (
        <div style={{ marginBottom: "1.5rem" }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "6px", minWidth: "200px" }}
          >
            <option value="">All Requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      )}

      {/* Leave Requests List */}
      <div>
        {requests.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", background: "white", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
            <p style={{ color: "#6b7280", margin: 0 }}>No leave requests found</p>
          </div>
        ) : (
          requests.map(req => {
            const statusStyle = getStatusColor(req.status);
            return (
              <div
                key={req.id}
                style={{ padding: "1.5rem", background: "white", borderRadius: "8px", border: "1px solid #e5e7eb", marginBottom: "1rem" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div style={{ flex: 1 }}>
                    {isAdmin && (
                      <p style={{ margin: "0 0 0.5rem 0", fontWeight: "600", color: "#374151" }}>
                        Employee: {req.employeeName}
                      </p>
                    )}
                    <p style={{ margin: "0 0 0.5rem 0", color: "#374151" }}>
                      <strong>Dates:</strong> {req.startDate} to {req.endDate}
                    </p>
                    <p style={{ margin: "0 0 0.5rem 0", color: "#6b7280" }}>
                      <strong>Reason:</strong> {req.reason}
                    </p>
                    {req.adminNote && (
                      <p style={{ margin: "0.5rem 0 0 0", padding: "0.75rem", background: "#f9fafb", borderRadius: "6px", color: "#374151" }}>
                        <strong>Admin Note:</strong> {req.adminNote}
                      </p>
                    )}
                    <p style={{ margin: "0.75rem 0 0 0", fontSize: "0.875rem", color: "#9ca3af" }}>
                      Submitted: {new Date(req.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
                    <span style={{ padding: "0.5rem 1rem", background: statusStyle.bg, color: statusStyle.color, borderRadius: "6px", fontSize: "0.875rem", fontWeight: "600" }}>
                      {req.status.toUpperCase()}
                    </span>
                    {isAdmin && req.status === "pending" && (
                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                        <button
                          onClick={() => setSelectedRequest(req)}
                          style={{ padding: "0.5rem 1rem", background: "#10b981", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setSelectedRequest(req)}
                          style={{ padding: "0.5rem 1rem", background: "#ef4444", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Admin Action Modal */}
      {selectedRequest && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", borderRadius: "8px", padding: "2rem", maxWidth: "500px", width: "90%" }}>
            <h3 style={{ margin: "0 0 1rem 0" }}>Review Leave Request</h3>
            <p style={{ margin: "0 0 1rem 0", color: "#6b7280" }}>
              Employee: <strong>{selectedRequest.employeeName}</strong>
            </p>
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem" }}>Admin Note (Optional)</label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={3}
                style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "6px" }}
                placeholder="Add a note for the employee..."
              />
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => handleUpdateStatus(selectedRequest.id, "approved")}
                style={{ padding: "0.75rem 1.5rem", background: "#10b981", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
              >
                Approve
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedRequest.id, "rejected")}
                style={{ padding: "0.75rem 1.5rem", background: "#ef4444", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
              >
                Reject
              </button>
              <button
                onClick={() => { setSelectedRequest(null); setAdminNote(""); }}
                style={{ padding: "0.75rem 1.5rem", background: "#6b7280", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
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
