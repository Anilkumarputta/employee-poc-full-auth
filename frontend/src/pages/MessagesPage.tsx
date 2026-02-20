import React, { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../auth/authContext";
import { graphqlRequest } from "../lib/graphqlClient";
import { formatConversationTime, formatMessageTime } from "../lib/dateUtils";

type Message = {
  id: number;
  conversationId: string;
  senderId: number;
  senderEmail: string;
  senderRole: string;
  recipientId: number | null;
  recipientEmail: string | null;
  recipientRole: string | null;
  subject: string | null;
  message: string;
  messageType: string;
  isRead: boolean;
  createdAt: string;
};

type Conversation = {
  conversationId: string;
  participant: string;
  participantRole: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
};

type User = {
  id: number;
  email: string;
  role: string;
};

const CONVERSATIONS_QUERY = `
  query MyConversations {
    myConversations {
      conversationId
      participant
      participantRole
      lastMessage
      lastMessageTime
      unreadCount
    }
  }
`;

const MESSAGES_QUERY = `
  query Messages($conversationId: String!) {
    messages(conversationId: $conversationId) {
      id
      conversationId
      senderId
      senderEmail
      senderRole
      recipientId
      recipientEmail
      recipientRole
      subject
      message
      messageType
      isRead
      createdAt
    }
  }
`;

const SEND_MESSAGE_MUTATION = `
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      id
      conversationId
      message
      createdAt
    }
  }
`;

const MARK_CONVERSATION_READ_MUTATION = `
  mutation MarkConversationAsRead($conversationId: String!) {
    markConversationAsRead(conversationId: $conversationId)
  }
`;

const ALL_USERS_QUERY = `
  query AllUsers {
    allUsers {
      id
      email
      role
    }
  }
`;

export const MessagesPage: React.FC = () => {
  const { accessToken, user } = useContext(AuthContext);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [messageSubject, setMessageSubject] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<number | null>(null);
  const [broadcastRole, setBroadcastRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [infoText, setInfoText] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isDirector = user?.role === "director";
  const isManager = user?.role === "manager";
  const canBroadcast = isDirector || isManager;

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    void fetchConversations();
    void fetchAllUsers();
  }, [accessToken, user?.id, user?.role]);

  useEffect(() => {
    if (!accessToken || !selectedConversation || showNewMessage) {
      return;
    }

    void fetchMessages(selectedConversation);
  }, [accessToken, selectedConversation, showNewMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const clearStatus = () => {
    setErrorText(null);
    setInfoText(null);
  };

  const fetchConversations = async () => {
    if (!accessToken) {
      return;
    }

    try {
      setLoading(true);
      const data = await graphqlRequest<{ myConversations: Conversation[] }>(
        CONVERSATIONS_QUERY,
        {},
        accessToken,
      );
      setConversations(data.myConversations || []);
    } catch (error) {
      console.error("Failed to load conversations:", error);
      setErrorText("Unable to load conversations.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    if (!accessToken) {
      return;
    }

    try {
      const data = await graphqlRequest<{ messages: Message[] }>(
        MESSAGES_QUERY,
        { conversationId },
        accessToken,
      );
      setMessages(data.messages || []);

      await graphqlRequest(MARK_CONVERSATION_READ_MUTATION, { conversationId }, accessToken);

      setConversations((previous) =>
        previous.map((conversation) =>
          conversation.conversationId === conversationId
            ? { ...conversation, unreadCount: 0 }
            : conversation,
        ),
      );
    } catch (error) {
      console.error("Failed to load messages:", error);
      setErrorText("Unable to load messages for this conversation.");
    }
  };

  const fetchAllUsers = async () => {
    if (!accessToken) {
      return;
    }

    try {
      const data = await graphqlRequest<{ allUsers: User[] }>(ALL_USERS_QUERY, {}, accessToken);
      const filtered = (data.allUsers || []).filter((account) => account.id !== user?.id);
      const recipients = user?.role === "employee" ? filtered.filter((account) => account.role === "manager") : filtered;
      setAllUsers(recipients);
    } catch (error) {
      console.error("Failed to load user directory:", error);
      setAllUsers([]);
    }
  };

  const openConversation = async (conversationId: string) => {
    clearStatus();
    setShowNewMessage(false);
    setSelectedConversation(conversationId);
  };

  const startNewMessage = () => {
    clearStatus();
    setShowNewMessage(true);
    setSelectedConversation(null);
    setMessages([]);
    setNewMessage("");
    setMessageSubject("");
    setSelectedRecipient(null);
    setBroadcastRole(null);
  };

  const getReplyRecipientId = (): number | null => {
    if (!user) {
      return null;
    }

    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const candidate = messages[index];
      if (candidate.senderId !== user.id) {
        return candidate.senderId;
      }
    }

    return null;
  };

  const handleSendMessage = async () => {
    clearStatus();

    if (!accessToken) {
      setErrorText("You are not authenticated.");
      return;
    }

    const trimmedMessage = newMessage.trim();
    if (!trimmedMessage) {
      setErrorText("Message cannot be empty.");
      return;
    }

    const input: Record<string, unknown> = {
      message: trimmedMessage,
    };

    if (showNewMessage) {
      if (selectedRecipient) {
        input.recipientId = selectedRecipient;
      } else if (broadcastRole) {
        input.recipientRole = broadcastRole;
      } else {
        setErrorText("Select a recipient before sending.");
        return;
      }

      if (messageSubject.trim()) {
        input.subject = messageSubject.trim();
      }
    } else {
      if (!selectedConversation) {
        setErrorText("Select a conversation first.");
        return;
      }

      const recipientId = getReplyRecipientId();
      if (!recipientId) {
        setErrorText("Cannot determine who should receive this reply.");
        return;
      }

      input.recipientId = recipientId;
      const latestMessage = messages[messages.length - 1];
      if (latestMessage) {
        input.replyToId = latestMessage.id;
      }
    }

    try {
      setSending(true);

      const result = await graphqlRequest<{ sendMessage: { conversationId: string } }>(
        SEND_MESSAGE_MUTATION,
        { input },
        accessToken,
      );

      setNewMessage("");
      setMessageSubject("");
      setInfoText("Message sent successfully.");

      if (showNewMessage) {
        setShowNewMessage(false);
        await fetchConversations();
        const newConversationId = result.sendMessage?.conversationId;
        if (newConversationId) {
          setSelectedConversation(newConversationId);
          await fetchMessages(newConversationId);
        }
      } else if (selectedConversation) {
        await fetchMessages(selectedConversation);
        await fetchConversations();
      }
    } catch (error: any) {
      setErrorText(error?.message || "Unable to send this message.");
    } finally {
      setSending(false);
    }
  };

  const currentConversation = selectedConversation
    ? conversations.find((conversation) => conversation.conversationId === selectedConversation)
    : null;

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 70px)", background: "#eef2f7" }}>
      <aside
        style={{
          width: "360px",
          maxWidth: "100%",
          background: "#ffffff",
          borderRight: "1px solid #e4e8ef",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "18px",
            borderBottom: "1px solid #e4e8ef",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: "22px", color: "#172b4d" }}>Messages</h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#6b7280" }}>
              {conversations.length} conversation{conversations.length === 1 ? "" : "s"}
            </p>
          </div>
          <button
            type="button"
            onClick={startNewMessage}
            style={{
              border: "none",
              borderRadius: "8px",
              background: "#1d4ed8",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "13px",
              padding: "10px 14px",
              cursor: "pointer",
            }}
          >
            New Message
          </button>
        </div>

        <div style={{ overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div style={{ padding: "24px", color: "#6b7280" }}>Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: "24px", color: "#6b7280" }}>No conversations yet.</div>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.conversationId}
                type="button"
                onClick={() => {
                  void openConversation(conversation.conversationId);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  background:
                    selectedConversation === conversation.conversationId && !showNewMessage ? "#e8f0ff" : "#ffffff",
                  borderBottom: "1px solid #f1f4f9",
                  padding: "14px 18px",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginBottom: "4px" }}>
                  <strong style={{ color: "#172b4d", fontSize: "14px" }}>{conversation.participant}</strong>
                  {conversation.unreadCount > 0 && (
                    <span
                      style={{
                        minWidth: "20px",
                        height: "20px",
                        borderRadius: "10px",
                        background: "#dc2626",
                        color: "#ffffff",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "0 6px",
                      }}
                    >
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    color: "#5b6472",
                    fontSize: "13px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {conversation.lastMessage}
                </div>
                <div style={{ fontSize: "12px", color: "#8a94a6", marginTop: "5px" }}>
                  {formatConversationTime(conversation.lastMessageTime)}
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      <section style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e4e8ef",
            background: "#ffffff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "18px", color: "#172b4d" }}>
              {showNewMessage ? "Compose Message" : currentConversation?.participant || "Select a conversation"}
            </h3>
            {currentConversation && !showNewMessage && (
              <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#6b7280" }}>
                Role: {currentConversation.participantRole}
              </p>
            )}
          </div>
        </div>

        {(errorText || infoText) && (
          <div
            style={{
              margin: "12px 20px 0",
              padding: "10px 12px",
              borderRadius: "8px",
              fontSize: "13px",
              border: `1px solid ${errorText ? "#fecaca" : "#bfdbfe"}`,
              background: errorText ? "#fef2f2" : "#eff6ff",
              color: errorText ? "#991b1b" : "#1e3a8a",
            }}
          >
            {errorText || infoText}
          </div>
        )}

        {showNewMessage ? (
          <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px", flex: 1 }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px", color: "#334155" }}>
                Recipient
              </label>

              {canBroadcast && (
                <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setBroadcastRole(null);
                    }}
                    style={{
                      border: "1px solid #cbd5e1",
                      background: broadcastRole ? "#ffffff" : "#1d4ed8",
                      color: broadcastRole ? "#334155" : "#ffffff",
                      borderRadius: "7px",
                      padding: "8px 10px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Direct
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRecipient(null);
                      setBroadcastRole("manager");
                    }}
                    style={{
                      border: "1px solid #cbd5e1",
                      background: broadcastRole === "manager" ? "#1d4ed8" : "#ffffff",
                      color: broadcastRole === "manager" ? "#ffffff" : "#334155",
                      borderRadius: "7px",
                      padding: "8px 10px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Broadcast to managers
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRecipient(null);
                      setBroadcastRole("employee");
                    }}
                    style={{
                      border: "1px solid #cbd5e1",
                      background: broadcastRole === "employee" ? "#1d4ed8" : "#ffffff",
                      color: broadcastRole === "employee" ? "#ffffff" : "#334155",
                      borderRadius: "7px",
                      padding: "8px 10px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Broadcast to employees
                  </button>
                </div>
              )}

              {!broadcastRole ? (
                <select
                  value={selectedRecipient ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelectedRecipient(value ? Number(value) : null);
                  }}
                  style={{
                    width: "100%",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    fontSize: "14px",
                  }}
                >
                  <option value="">Select recipient</option>
                  {allUsers.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.email} ({account.role})
                    </option>
                  ))}
                </select>
              ) : (
                <div
                  style={{
                    border: "1px solid #cbd5e1",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    fontSize: "14px",
                    color: "#334155",
                  }}
                >
                  This message will be delivered to all {broadcastRole}s.
                </div>
              )}
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px", color: "#334155" }}>
                Subject (optional)
              </label>
              <input
                type="text"
                value={messageSubject}
                onChange={(event) => setMessageSubject(event.target.value)}
                style={{
                  width: "100%",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px", color: "#334155" }}>
                Message
              </label>
              <textarea
                value={newMessage}
                onChange={(event) => setNewMessage(event.target.value)}
                style={{
                  width: "100%",
                  minHeight: "180px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  padding: "12px",
                  fontSize: "14px",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
                placeholder="Type your message"
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => {
                  setShowNewMessage(false);
                  clearStatus();
                }}
                style={{
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#334155",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleSendMessage();
                }}
                disabled={sending}
                style={{
                  border: "none",
                  background: sending ? "#94a3b8" : "#1d4ed8",
                  color: "#ffffff",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  fontWeight: 700,
                  cursor: sending ? "not-allowed" : "pointer",
                }}
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        ) : selectedConversation ? (
          <>
            <div style={{ flex: 1, overflowY: "auto", padding: "20px", background: "#f7f9fc" }}>
              {messages.map((message) => {
                const isMine = message.senderId === user?.id;
                return (
                  <div
                    key={message.id}
                    style={{
                      display: "flex",
                      justifyContent: isMine ? "flex-end" : "flex-start",
                      marginBottom: "12px",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "72%",
                        background: isMine ? "#1d4ed8" : "#ffffff",
                        color: isMine ? "#ffffff" : "#1e293b",
                        borderRadius: isMine ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                        padding: "10px 12px",
                        boxShadow: "0 2px 10px rgba(15,23,42,0.08)",
                      }}
                    >
                      {message.subject && (
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: "13px",
                            marginBottom: "6px",
                            paddingBottom: "6px",
                            borderBottom: `1px solid ${isMine ? "rgba(255,255,255,0.35)" : "#e2e8f0"}`,
                          }}
                        >
                          {message.subject}
                        </div>
                      )}
                      <div style={{ whiteSpace: "pre-wrap", fontSize: "14px", lineHeight: 1.45 }}>{message.message}</div>
                      <div style={{ fontSize: "11px", opacity: 0.85, textAlign: "right", marginTop: "6px" }}>
                        {formatMessageTime(message.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ borderTop: "1px solid #e4e8ef", background: "#ffffff", padding: "14px 18px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(event) => setNewMessage(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void handleSendMessage();
                    }
                  }}
                  placeholder="Type a reply"
                  style={{
                    flex: 1,
                    border: "1px solid #cbd5e1",
                    borderRadius: "999px",
                    padding: "11px 14px",
                    fontSize: "14px",
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    void handleSendMessage();
                  }}
                  disabled={sending || !newMessage.trim()}
                  style={{
                    border: "none",
                    background: sending || !newMessage.trim() ? "#94a3b8" : "#1d4ed8",
                    color: "#ffffff",
                    borderRadius: "999px",
                    padding: "11px 16px",
                    fontWeight: 700,
                    cursor: sending || !newMessage.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  {sending ? "Sending" : "Send"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: "grid",
              placeItems: "center",
              color: "#64748b",
              background: "#f7f9fc",
              padding: "20px",
              textAlign: "center",
            }}
          >
            <div>
              <h3 style={{ margin: "0 0 8px 0", color: "#1e293b" }}>No conversation selected</h3>
              <p style={{ margin: 0, fontSize: "14px" }}>Choose a conversation on the left or create a new message.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
