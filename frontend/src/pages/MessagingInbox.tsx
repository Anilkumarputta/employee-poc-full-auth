import React, { useEffect, useState, useContext, useRef } from "react";
import { AuthContext } from "../auth/authContext";
import { fetchMessages, sendMessage, markAsRead } from "../auth/api";
import { formatDistanceToNow } from "date-fns";
import "./messages.css";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

interface Message {
  id: number;
  conversationId: string;
  senderEmail: string;
  senderRole: string;
  recipientEmail?: string;
  recipientRole?: string;
  subject?: string;
  message: string;
  messageType: string;
  isRead: boolean;
  createdAt: string;
  replyToId?: number;
  attachments?: string[];
}

const MessagingInbox: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [thread, setThread] = useState<Message[]>([]);
  const [reply, setReply] = useState<string>("");
  const [richMode, setRichMode] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const pollingRef = useRef<number | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchMessages()
      .then((msgs) => setMessages(msgs))
      .finally(() => setLoading(false));
    // Poll for new messages every 10 seconds
    pollingRef.current = window.setInterval(() => {
      fetchMessages().then((msgs) => setMessages(msgs));
      if (selectedConversation) {
        fetchMessages(selectedConversation).then((msgs) => setThread(msgs));
      }
    }, 10000);
    return () => {
      if (pollingRef.current) window.clearInterval(pollingRef.current);
    };
  }, [selectedConversation]);

  const openConversation = (conversationId: string) => {
    setSelectedConversation(conversationId);
    setLoading(true);
    fetchMessages(conversationId)
      .then((msgs) => setThread(msgs))
      .finally(() => setLoading(false));
    markAsRead(conversationId);
  };

  const handleReply = async () => {
    if (!reply.trim() || !selectedConversation) return;
    setLoading(true);
    await sendMessage({
      conversationId: selectedConversation,
      message: reply,
      replyToId: thread[thread.length - 1]?.id,
    });
    fetchMessages(selectedConversation)
      .then((msgs) => setThread(msgs))
      .finally(() => setLoading(false));
    setReply("");
  };

  return (
    <div className="messaging-inbox">
      <div className="sidebar">
        <h2>Inbox</h2>
        {loading && <div>Loading...</div>}
        <ul>
          {messages.map((msg) => (
            <li
              key={msg.conversationId}
              className={msg.isRead ? "read" : "unread"}
              onClick={() => openConversation(msg.conversationId)}
            >
              <div className="subject">{msg.subject || msg.message.substring(0, 40)}</div>
              <div className="meta">
                From: {msg.senderEmail} | {formatDistanceToNow(new Date(msg.createdAt))} ago
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="thread-view">
        {selectedConversation ? (
          <>
            <h3>Conversation</h3>
            {/* Show notification link in thread view */}
            {selectedConversation && (
              <div style={{ marginBottom: 16 }}>
                <a
                  href={`/notificationInbox?conversation=${selectedConversation}`}
                  style={{ color: "#667eea", textDecoration: "underline", fontWeight: 500 }}
                >
                  View related notifications
                </a>
              </div>
            )}
            <div className="thread-messages">
              {thread.map((msg) => (
                <div key={msg.id} className="message">
                  <div className="meta">
                    <span>{msg.senderEmail}</span> <span>({msg.senderRole})</span> <span>{formatDistanceToNow(new Date(msg.createdAt))} ago</span>
                  </div>
                  <div className="body">{msg.message}</div>
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="attachments">
                      Attachments: {msg.attachments.map((a, i) => (
                        <a key={i} href={a} target="_blank" rel="noopener noreferrer">File {i + 1}</a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="reply-box">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <label>
                  <input type="checkbox" checked={richMode} onChange={() => setRichMode(!richMode)} />
                  Rich formatting
                </label>
              </div>
              {richMode ? (
                <ReactQuill value={reply} onChange={setReply} placeholder="Type your reply..." />
              ) : (
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type your reply..."
                />
              )}
              <button onClick={handleReply} disabled={loading || !reply.trim()}>
                Send Reply
              </button>
            </div>
          </>
        ) : (
          <div className="empty-thread">Select a conversation to view messages.</div>
        )}
      </div>
    </div>
  );
};

export default MessagingInbox;
