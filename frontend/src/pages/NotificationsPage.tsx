import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../auth/authContext";
import { graphqlRequest } from "../lib/graphqlClient";

type Note = {
  id: number;
  message: string;
  fromUserId: number;
  toEmployeeId?: number;
  toAll: boolean;
  isRead: boolean;
  createdAt: string;
};

const MY_NOTES_QUERY = `
  query MyNotes {
    myNotes {
      id
      message
      fromUserId
      toEmployeeId
      toAll
      isRead
      createdAt
    }
  }
`;

const MARK_READ_MUTATION = `
  mutation MarkNoteAsRead($id: Int!) {
    markNoteAsRead(id: $id) {
      id
      isRead
    }
  }
`;

export const NotificationsPage: React.FC = () => {
  const { accessToken, user } = useContext(AuthContext);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data: any = await graphqlRequest(MY_NOTES_QUERY, {}, accessToken);
      setNotes(data.myNotes);
    } catch (err) {
      console.error("Failed to fetch notes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await graphqlRequest(MARK_READ_MUTATION, { id }, accessToken!);
      setNotes(notes.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const unreadCount = notes.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>Notifications</h1>
        <p>Loading notifications...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ margin: 0 }}>Notifications</h1>
          <p style={{ margin: "0.5rem 0 0 0", color: "#6b7280" }}>
            {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <button
          onClick={fetchNotes}
          style={{ padding: "0.5rem 1rem", background: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
        >
          Refresh
        </button>
      </div>

      <div style={{ marginTop: "2rem" }}>
        {notes.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", background: "white", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
            <p style={{ color: "#6b7280", margin: 0 }}>No notifications yet</p>
          </div>
        ) : (
          notes.map(note => (
            <div
              key={note.id}
              style={{
                padding: "1.5rem",
                background: note.isRead ? "white" : "#eff6ff",
                borderRadius: "8px",
                border: `1px solid ${note.isRead ? "#e5e7eb" : "#93c5fd"}`,
                marginBottom: "1rem",
                position: "relative"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    {!note.isRead && (
                      <span style={{
                        width: "8px",
                        height: "8px",
                        background: "#3b82f6",
                        borderRadius: "50%"
                      }} />
                    )}
                    <span style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                      {note.toAll ? "📢 Announcement to all employees" : "📝 Personal message"}
                    </span>
                    <span style={{ color: "#9ca3af", fontSize: "0.875rem" }}>•</span>
                    <span style={{ color: "#9ca3af", fontSize: "0.875rem" }}>
                      {new Date(note.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p style={{ margin: "0.5rem 0 0 0", color: "#374151", lineHeight: "1.6" }}>
                    {note.message}
                  </p>
                </div>
                {!note.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(note.id)}
                    style={{
                      padding: "0.25rem 0.75rem",
                      background: "#3b82f6",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      marginLeft: "1rem"
                    }}
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
