import React, { useEffect, useState, useRef } from "react";
import { fetchMessages, sendMessage, markAsRead } from "../auth/api";
import { formatDistanceToNow } from "date-fns";
import "./messages.css";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import type { AppPage } from "../types/navigation";

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

type MessagingInboxProps = {
  onNavigate?: (page: AppPage) => void;
};

const MessagingInbox: React.FC<MessagingInboxProps> = ({ onNavigate }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [thread, setThread] = useState<Message[]>([]);
  const [reply, setReply] = useState<string>("");
  const [richMode, setRichMode] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);

  const pollingRef = useRef<number | null>(null);
  const selectedConversationRef = useRef<string | null>(null);
  const threadCacheRef = useRef<Map<string, Message[]>>(new Map());

  const refreshInboxMessages = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const msgs = await fetchMessages();
      setMessages(msgs);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  const refreshThread = async (conversationId: string, showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const msgs = await fetchMessages(conversationId);
      setThread(msgs);
      threadCacheRef.current.set(conversationId, msgs);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  useEffect(() => {
    void refreshInboxMessages(true);

    // Poll for updates in background without blocking UI.
    pollingRef.current = window.setInterval(() => {
      void refreshInboxMessages(false);
      if (selectedConversationRef.current) {
        void refreshThread(selectedConversationRef.current, false);
      }
    }, 15000);

    return () => {
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
      }
    };
  }, []);

  const openConversation = async (conversationId: string) => {
    setSelectedConversation(conversationId);

    const cached = threadCacheRef.current.get(conversationId);
    if (cached) {
      setThread(cached);
    }

    void markAsRead(conversationId);
    await refreshThread(conversationId, !cached);
  };

  const handleReply = async () => {
    if (!reply.trim() || !selectedConversation) return;

    setLoading(true);
    try {
      await sendMessage({
        conversationId: selectedConversation,
        message: reply,
        replyToId: thread[thread.length - 1]?.id,
      });

      await Promise.all([
        refreshThread(selectedConversation, false),
        refreshInboxMessages(false),
      ]);

      setReply("");
    } finally {
      setLoading(false);
    }
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
            <div style={{ marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => onNavigate?.("notificationInbox")}
                style={{
                  color: "#667eea",
                  textDecoration: "underline",
                  fontWeight: 500,
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                View related notifications
              </button>
            </div>
            <div className="thread-messages">
              {thread.map((msg) => (
                <div key={msg.id} className="message">
                  <div className="meta">
                    <span>{msg.senderEmail}</span> <span>({msg.senderRole})</span>{" "}
                    <span>{formatDistanceToNow(new Date(msg.createdAt))} ago</span>
                  </div>
                  <div className="body">{msg.message}</div>
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="attachments">
                      Attachments:{" "}
                      {msg.attachments.map((a, i) => (
                        <a key={i} href={a} target="_blank" rel="noopener noreferrer">
                          File {i + 1}
                        </a>
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
                <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type your reply..." />
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
