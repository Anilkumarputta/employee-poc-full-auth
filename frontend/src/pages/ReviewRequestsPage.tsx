import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/authContext";
import { graphqlRequest } from "../lib/graphqlClient";

const REVIEW_REQUESTS_QUERY = `
  query GetReviewRequests($status: String) {
    reviewRequests(status: $status) {
      id
      type
      status
      requestedByEmail
      managerReasonType
      managerReasonText
      visibleToEmployee
      adminComment
      reviewedAt
      createdAt
      employee {
        id
        name
        email
        role
        status
        attendance
        avatar
      }
    }
  }
`;

const REVIEW_DECISION_MUTATION = `
  mutation ReviewDecision($input: ReviewDecisionInput!) {
    reviewDecision(input: $input) {
      id
      status
    }
  }
`;

type ReviewRequest = {
  id: number;
  type: string;
  status: string;
  requestedByEmail: string;
  managerReasonType: string;
  managerReasonText: string;
  visibleToEmployee: boolean;
  adminComment?: string;
  reviewedAt?: string;
  createdAt: string;
  employee: {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
    attendance: number;
    avatar?: string;
  };
};

export const ReviewRequestsPage: React.FC = () => {
  const { user, accessToken } = useAuth();
  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [filter, setFilter] = useState<string>("PENDING");
  const [selectedRequest, setSelectedRequest] = useState<ReviewRequest | null>(null);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decision, setDecision] = useState<string>("");
  const [adminComment, setAdminComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [filter, accessToken]);

  const fetchRequests = async () => {
    if (!accessToken) return;

    try {
      const data = await graphqlRequest<{ reviewRequests: ReviewRequest[] }>(
        REVIEW_REQUESTS_QUERY,
        { status: filter === "ALL" ? undefined : filter },
        accessToken
      );
      setRequests(data.reviewRequests);
    } catch (error) {
      console.error("Error fetching review requests:", error);
    }
  };

  const handleReview = (request: ReviewRequest) => {
    setSelectedRequest(request);
    setShowDecisionModal(true);
    setDecision("");
    setAdminComment("");
  };

  const submitDecision = async () => {
    if (!selectedRequest || !decision || !adminComment.trim()) {
      alert("Please select a decision and provide a comment");
      return;
    }

    if (adminComment.trim().length < 10) {
      alert("Admin comment must be at least 10 characters");
      return;
    }

    setLoading(true);

    try {
      await graphqlRequest(
        REVIEW_DECISION_MUTATION,
        {
          input: {
            requestId: selectedRequest.id,
            decision,
            adminComment: adminComment.trim(),
          },
        },
        accessToken!
      );

      alert(`Request ${decision.toLowerCase()} successfully!`);
      setShowDecisionModal(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (error: any) {
      console.error("Error submitting decision:", error);
      alert(`Error: ${error.message || "Failed to submit decision"}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "#f59e0b";
      case "APPROVED":
        return "#059669";
      case "REJECTED":
        return "#dc2626";
      default:
        return "#6b7280";
    }
  };

  const getTypeIcon = (type: string) => {
    return type === "FLAG" ? "🚩" : "🚫";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (user?.role !== "director") {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2>⛔ Access Denied</h2>
        <p>Only Directors can access review requests.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", background: "#f5f7fa", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: 0, color: "#111827", fontSize: "2rem" }}>
          ✅ Review Requests
        </h1>
        <p style={{ margin: "0.5rem 0 0 0", color: "#6b7280" }}>
          Approve or reject flag and termination requests from managers
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{ marginBottom: "2rem", display: "flex", gap: "1rem" }}>
        {["PENDING", "APPROVED", "REJECTED", "ALL"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              border: filter === status ? "2px solid #667eea" : "1px solid #e5e7eb",
              background: filter === status ? "#f0f4ff" : "white",
              color: filter === status ? "#667eea" : "#6b7280",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Requests Table */}
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
              <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151" }}>
                Employee
              </th>
              <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151" }}>
                Type
              </th>
              <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151" }}>
                Manager
              </th>
              <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151" }}>
                Reason Type
              </th>
              <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151" }}>
                Created
              </th>
              <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151" }}>
                Status
              </th>
              <th style={{ padding: "1rem", textAlign: "center", fontWeight: "600", color: "#374151" }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "3rem", textAlign: "center", color: "#9ca3af" }}>
                  <div style={{ fontSize: "48px", marginBottom: "1rem" }}>📋</div>
                  <p style={{ margin: 0 }}>No {filter.toLowerCase()} requests found</p>
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr
                  key={request.id}
                  style={{
                    borderBottom: "1px solid #f3f4f6",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontWeight: "600",
                          fontSize: "16px",
                        }}
                      >
                        {request.employee.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: "600", color: "#111827" }}>
                          {request.employee.name}
                        </div>
                        <div style={{ fontSize: "13px", color: "#6b7280" }}>
                          {request.employee.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: "12px",
                        fontSize: "13px",
                        fontWeight: "600",
                        background: request.type === "FLAG" ? "#fef3c7" : "#fee2e2",
                        color: request.type === "FLAG" ? "#92400e" : "#991b1b",
                      }}
                    >
                      {getTypeIcon(request.type)} {request.type}
                    </span>
                  </td>
                  <td style={{ padding: "1rem", color: "#6b7280", fontSize: "14px" }}>
                    {request.requestedByEmail}
                  </td>
                  <td style={{ padding: "1rem", color: "#6b7280", fontSize: "14px" }}>
                    {request.managerReasonType}
                  </td>
                  <td style={{ padding: "1rem", color: "#6b7280", fontSize: "14px" }}>
                    {formatDate(request.createdAt)}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "600",
                        background: `${getStatusColor(request.status)}20`,
                        color: getStatusColor(request.status),
                      }}
                    >
                      {request.status}
                    </span>
                  </td>
                  <td style={{ padding: "1rem", textAlign: "center" }}>
                    {request.status === "PENDING" ? (
                      <button
                        onClick={() => handleReview(request)}
                        style={{
                          padding: "0.5rem 1rem",
                          borderRadius: "6px",
                          border: "none",
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          color: "white",
                          fontWeight: "600",
                          cursor: "pointer",
                          fontSize: "14px",
                          transition: "transform 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      >
                        Review
                      </button>
                    ) : (
                      <span style={{ color: "#9ca3af", fontSize: "14px" }}>
                        {request.reviewedAt ? `Reviewed ${formatDate(request.reviewedAt)}` : "Completed"}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Decision Modal */}
      {showDecisionModal && selectedRequest && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => !loading && setShowDecisionModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: "16px",
              width: "600px",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "2rem",
                borderBottom: "1px solid #e5e7eb",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                borderRadius: "16px 16px 0 0",
              }}
            >
              <h2 style={{ margin: "0 0 0.5rem 0", fontSize: "1.5rem" }}>
                {getTypeIcon(selectedRequest.type)} Review {selectedRequest.type} Request
              </h2>
              <p style={{ margin: 0, opacity: 0.9, fontSize: "14px" }}>
                For: {selectedRequest.employee.name}
              </p>
            </div>

            {/* Modal Content */}
            <div style={{ padding: "2rem" }}>
              {/* Employee Info */}
              <div
                style={{
                  padding: "1.5rem",
                  background: "#f9fafb",
                  borderRadius: "8px",
                  marginBottom: "1.5rem",
                }}
              >
                <h3 style={{ margin: "0 0 1rem 0", fontSize: "16px", color: "#111827" }}>
                  Employee Information
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px" }}>
                      Name
                    </div>
                    <div style={{ fontWeight: "600", color: "#111827" }}>
                      {selectedRequest.employee.name}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px" }}>
                      Email
                    </div>
                    <div style={{ fontWeight: "600", color: "#111827" }}>
                      {selectedRequest.employee.email}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px" }}>
                      Current Status
                    </div>
                    <div style={{ fontWeight: "600", color: "#111827" }}>
                      {selectedRequest.employee.status}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px" }}>
                      Attendance
                    </div>
                    <div style={{ fontWeight: "600", color: "#111827" }}>
                      {selectedRequest.employee.attendance}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Manager's Reason */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "16px", color: "#111827" }}>
                  Manager's Reason
                </h3>
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px" }}>
                    Requested by
                  </div>
                  <div style={{ fontWeight: "600", color: "#111827" }}>
                    {selectedRequest.requestedByEmail}
                  </div>
                </div>
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px" }}>
                    Reason Type
                  </div>
                  <div style={{ fontWeight: "600", color: "#111827" }}>
                    {selectedRequest.managerReasonType}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px" }}>
                    Details
                  </div>
                  <div
                    style={{
                      padding: "1rem",
                      background: "#f9fafb",
                      borderRadius: "6px",
                      fontSize: "14px",
                      color: "#374151",
                      lineHeight: "1.6",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {selectedRequest.managerReasonText}
                  </div>
                </div>
                <div style={{ marginTop: "1rem", fontSize: "13px", color: "#6b7280" }}>
                  {selectedRequest.visibleToEmployee ? (
                    <span>✓ Visible to employee</span>
                  ) : (
                    <span>✗ Not visible to employee</span>
                  )}
                </div>
              </div>

              {/* Decision Section */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "16px", color: "#111827" }}>
                  Your Decision
                </h3>
                <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                  <button
                    onClick={() => setDecision("APPROVED")}
                    style={{
                      flex: 1,
                      padding: "1rem",
                      borderRadius: "8px",
                      border: decision === "APPROVED" ? "2px solid #059669" : "1px solid #e5e7eb",
                      background: decision === "APPROVED" ? "#d1fae5" : "white",
                      color: decision === "APPROVED" ? "#065f46" : "#6b7280",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => setDecision("REJECTED")}
                    style={{
                      flex: 1,
                      padding: "1rem",
                      borderRadius: "8px",
                      border: decision === "REJECTED" ? "2px solid #dc2626" : "1px solid #e5e7eb",
                      background: decision === "REJECTED" ? "#fee2e2" : "white",
                      color: decision === "REJECTED" ? "#991b1b" : "#6b7280",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>

              {/* Admin Comment */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  htmlFor="adminComment"
                  style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#111827",
                    marginBottom: "0.5rem",
                  }}
                >
                  Admin Comment <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <p style={{ margin: "0 0 0.75rem 0", fontSize: "13px", color: "#6b7280" }}>
                  Provide your reasoning (minimum 10 characters)
                </p>
                <textarea
                  id="adminComment"
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  rows={4}
                  placeholder="Enter your comment about this decision..."
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
              </div>

              {/* Info Box */}
              <div
                style={{
                  padding: "1rem",
                  background: "#dbeafe",
                  border: "1px solid #93c5fd",
                  borderRadius: "8px",
                  marginBottom: "1.5rem",
                }}
              >
                <p style={{ margin: 0, fontSize: "13px", color: "#1e40af", lineHeight: "1.6" }}>
                  <strong>Impact:</strong>{" "}
                  {decision === "APPROVED"
                    ? `Employee status will be changed to ${
                        selectedRequest.type === "FLAG" ? "FLAGGED" : "TERMINATED"
                      }.`
                    : decision === "REJECTED"
                    ? "Employee status will revert to ACTIVE."
                    : "Select a decision to see the impact."}
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "1rem" }}>
                <button
                  onClick={() => setShowDecisionModal(false)}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: "0.875rem",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    background: "white",
                    color: "#6b7280",
                    fontWeight: "600",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.5 : 1,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={submitDecision}
                  disabled={loading || !decision || adminComment.trim().length < 10}
                  style={{
                    flex: 1,
                    padding: "0.875rem",
                    borderRadius: "8px",
                    border: "none",
                    background:
                      !decision || adminComment.trim().length < 10
                        ? "#d1d5db"
                        : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    fontWeight: "600",
                    cursor:
                      loading || !decision || adminComment.trim().length < 10
                        ? "not-allowed"
                        : "pointer",
                    transition: "transform 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    decision &&
                    adminComment.trim().length >= 10 &&
                    !loading &&
                    (e.currentTarget.style.transform = "scale(1.02)")
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  {loading ? "Submitting..." : "Confirm Decision"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
