import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../auth/authContext";
import { graphqlRequest } from "../lib/graphqlClient";

type User = {
  id: number;
  email: string;
  role: string;
};

const USERS_QUERY = `
  query AllUsers {
    allUsers {
      id
      email
      role
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
  const [usersList, setUsersList] = useState<User[]>([]);
  const [message, setMessage] = useState("");
  const [sendToAll, setSendToAll] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error">("success");

  useEffect(() => {
    void fetchUsers();
  }, [accessToken]);

  const fetchUsers = async () => {
    if (!accessToken) {
      return;
    }

    try {
      const data = await graphqlRequest<{ allUsers: User[] }>(USERS_QUERY, {}, accessToken);
      const filtered = (data.allUsers || []).filter((account) => account.id !== user?.id);
      setUsersList(filtered);
    } catch (error) {
      console.error("Failed to load users:", error);
      setUsersList([]);
    }
  };

  const handleSendNote = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!accessToken) {
      setStatusType("error");
      setStatusMessage("Session expired. Please sign in again.");
      return;
    }

    if (!message.trim()) {
      setStatusType("error");
      setStatusMessage("Please enter a message.");
      return;
    }

    if (!sendToAll && !selectedUserId) {
      setStatusType("error");
      setStatusMessage("Please select a recipient or use broadcast.");
      return;
    }

    setLoading(true);
    setStatusMessage("");

    try {
      await graphqlRequest(
        SEND_NOTE_MUTATION,
        {
          input: {
            message: message.trim(),
            toAll: sendToAll,
            toUserId: sendToAll ? null : selectedUserId,
            toEmployeeId: null,
          },
        },
        accessToken,
      );

      setStatusType("success");
      setStatusMessage(sendToAll ? "Broadcast note sent successfully." : "Note sent successfully.");
      setMessage("");
      setSelectedUserId(null);
      setSendToAll(false);
    } catch (error: any) {
      setStatusType("error");
      setStatusMessage(error?.message || "Failed to send note.");
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== "director" && user?.role !== "manager") {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>Send Note</h1>
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1rem",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            color: "#991b1b",
          }}
        >
          Only directors and managers can send notes.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "900px" }}>
      <h1 style={{ marginBottom: "0.4rem" }}>Send Note</h1>
      <p style={{ marginTop: 0, color: "#64748b" }}>Send a direct note or broadcast announcement.</p>

      {statusMessage && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.8rem 1rem",
            borderRadius: "8px",
            background: statusType === "success" ? "#ecfdf5" : "#fef2f2",
            border: `1px solid ${statusType === "success" ? "#a7f3d0" : "#fecaca"}`,
            color: statusType === "success" ? "#065f46" : "#991b1b",
          }}
        >
          {statusMessage}
        </div>
      )}

      <form
        onSubmit={handleSendNote}
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "1.4rem",
          boxShadow: "0 2px 6px rgba(15,23,42,0.06)",
        }}
      >
        <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem", fontWeight: 700 }}>
          <input
            type="checkbox"
            checked={sendToAll}
            onChange={(event) => {
              const value = event.target.checked;
              setSendToAll(value);
              if (value) {
                setSelectedUserId(null);
              }
            }}
          />
          Send as broadcast to everyone
        </label>

        {!sendToAll && (
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.45rem", fontWeight: 700 }}>Recipient</label>
            <select
              value={selectedUserId ?? ""}
              onChange={(event) => {
                const value = event.target.value;
                setSelectedUserId(value ? Number(value) : null);
              }}
              style={{
                width: "100%",
                padding: "0.7rem",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
              }}
            >
              <option value="">Select recipient</option>
              {usersList.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.email} ({account.role})
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.45rem", fontWeight: 700 }}>Message</label>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={6}
            style={{
              width: "100%",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              padding: "0.8rem",
              fontFamily: "inherit",
              fontSize: "0.95rem",
            }}
            placeholder="Type your note"
          />
          <div style={{ marginTop: "0.35rem", fontSize: "0.85rem", color: "#64748b" }}>{message.length} characters</div>
        </div>

        <div style={{ display: "flex", gap: "0.6rem" }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              border: "none",
              borderRadius: "8px",
              background: loading ? "#94a3b8" : "#1d4ed8",
              color: "#ffffff",
              fontWeight: 700,
              padding: "0.7rem 1.2rem",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Sending..." : "Send Note"}
          </button>

          <button
            type="button"
            onClick={() => {
              setMessage("");
              setSelectedUserId(null);
              setSendToAll(false);
              setStatusMessage("");
            }}
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              background: "#ffffff",
              color: "#334155",
              fontWeight: 700,
              padding: "0.7rem 1.2rem",
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
};
