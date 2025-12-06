import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../auth/authContext";
import { graphqlRequest } from "../lib/graphqlClient";

type Employee = {
  id: number;
  name: string;
  role: string;
};

const EMPLOYEES_QUERY = `
  query Employees {
    employees(page: 1, pageSize: 1000, filter: { roleNot: "admin" }) {
      items {
        id
        name
        role
      }
    }
  }
`;

const SEND_NOTE_MUTATION = `
  mutation SendNote($input: NoteInput!) {
    sendNote(input: $input) {
      id
      message
      toAll
    }
  }
`;

export const SendNotePage: React.FC = () => {
  const { accessToken, user } = useContext(AuthContext);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [message, setMessage] = useState("");
  const [sendToAll, setSendToAll] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error">("success");

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

  const handleSendNote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setStatusType("error");
      setStatusMessage("Please enter a message");
      return;
    }

    if (!sendToAll && !selectedEmployeeId) {
      setStatusType("error");
      setStatusMessage("Please select an employee or choose to send to all");
      return;
    }

    setLoading(true);
    setStatusMessage("");

    try {
      await graphqlRequest(
        SEND_NOTE_MUTATION,
        {
          input: {
            message,
            toAll: sendToAll,
            toEmployeeId: sendToAll ? null : selectedEmployeeId
          }
        },
        accessToken!
      );

      setStatusType("success");
      setStatusMessage(`Note sent successfully to ${sendToAll ? "all employees" : "selected employee"}!`);
      setMessage("");
      setSelectedEmployeeId(null);
      setSendToAll(false);
    } catch (err: any) {
      setStatusType("error");
      setStatusMessage("Failed to send note: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Check if user is director or manager
  if (user?.role !== "director" && user?.role !== "manager") {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>Send Note</h1>
        <div style={{ marginTop: "2rem", padding: "2rem", background: "#fee2e2", border: "1px solid #fecaca", borderRadius: "8px" }}>
          <h2 style={{ margin: "0 0 1rem 0", color: "#991b1b" }}>Access Denied</h2>
          <p style={{ color: "#7f1d1d", margin: 0 }}>
            Only directors and managers can send notes to employees.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Send Note to Employees</h1>
      <p>Send messages or announcements to employees</p>

      <div style={{ marginTop: "2rem", maxWidth: "800px" }}>
        {statusMessage && (
          <div style={{
            padding: "1rem",
            marginBottom: "1.5rem",
            background: statusType === "success" ? "#d1fae5" : "#fee2e2",
            border: `1px solid ${statusType === "success" ? "#10b981" : "#ef4444"}`,
            borderRadius: "6px",
            color: statusType === "success" ? "#065f46" : "#991b1b"
          }}>
            {statusMessage}
          </div>
        )}

        <div style={{ padding: "2rem", background: "white", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
          <form onSubmit={handleSendNote}>
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={sendToAll}
                  onChange={(e) => {
                    setSendToAll(e.target.checked);
                    if (e.target.checked) {
                      setSelectedEmployeeId(null);
                    }
                  }}
                  style={{ width: "18px", height: "18px", cursor: "pointer" }}
                />
                <span style={{ fontWeight: "600", color: "#374151" }}>
                  📢 Send to all employees (Broadcast announcement)
                </span>
              </label>
            </div>

            {!sendToAll && (
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", color: "#374151" }}>
                  Select Employee
                </label>
                <select
                  value={selectedEmployeeId || ""}
                  onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
                  required={!sendToAll}
                  disabled={sendToAll}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    background: sendToAll ? "#f3f4f6" : "white"
                  }}
                >
                  <option value="">-- Choose an employee --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} (ID: {emp.id})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", color: "#374151" }}>
                Message *
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={6}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontFamily: "inherit",
                  fontSize: "1rem"
                }}
                placeholder="Type your message here..."
              />
              <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.875rem", color: "#6b7280" }}>
                {message.length} characters
              </p>
            </div>

            <div style={{ padding: "1rem", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "6px", marginBottom: "1.5rem" }}>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "#1e40af" }}>
                <strong>Preview:</strong> This message will be sent to{" "}
                {sendToAll
                  ? <strong>all {employees.length} employees</strong>
                  : selectedEmployeeId
                    ? <strong>{employees.find(e => e.id === selectedEmployeeId)?.name}</strong>
                    : <strong>no one (please select a recipient)</strong>
                }
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "0.75rem 2rem",
                  background: loading ? "#9ca3af" : "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontWeight: "600",
                  fontSize: "1rem"
                }}
              >
                {loading ? "Sending..." : "Send Note"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMessage("");
                  setSelectedEmployeeId(null);
                  setSendToAll(false);
                  setStatusMessage("");
                }}
                disabled={loading}
                style={{
                  padding: "0.75rem 2rem",
                  background: "white",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontWeight: "600",
                  fontSize: "1rem"
                }}
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        <div style={{ marginTop: "2rem", padding: "1.5rem", background: "#fef3c7", border: "1px solid #fde68a", borderRadius: "8px" }}>
          <h3 style={{ margin: "0 0 0.5rem 0", color: "#92400e" }}>💡 Tips</h3>
          <ul style={{ margin: "0.5rem 0 0 0", paddingLeft: "1.5rem", color: "#78350f" }}>
            <li>Use broadcast for company-wide announcements</li>
            <li>Send personal messages for individual matters</li>
            <li>Employees will see notes in their Notifications page</li>
            <li>Unread notes are highlighted in blue</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
