import React, { useContext, useEffect, useState, useRef } from "react";
import { AuthContext } from "../auth/authContext";
import { graphqlRequest } from "../lib/graphqlClient";

type Message = {
  id: number;
  conversationId: string;
  senderId: number;
  senderEmail: string;
  senderRole: string;
  recipientId: number | null;
  recipientEmail: string | null;
  subject: string | null;
  message: string;
  messageType: string;
  isRead: boolean;
  readAt: string | null;
  priority: string;
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
      subject
      message
      messageType
      isRead
      readAt
      priority
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
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<number | null>(null);
  const [broadcastRole, setBroadcastRole] = useState<string | null>(null);
  const [messageSubject, setMessageSubject] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isDirector = user?.role === 'director';
  const isManager = user?.role === 'manager';
  const isEmployee = user?.role === 'employee';

  useEffect(() => {
    fetchConversations();
    if (isDirector || isManager) {
      fetchAllUsers();
    }
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    if (!accessToken) return;
    
    try {
      setLoading(true);
      const data = await graphqlRequest(CONVERSATIONS_QUERY, {}, accessToken);
      setConversations(data.myConversations);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    if (!accessToken) return;
    
    try {
      const data = await graphqlRequest(MESSAGES_QUERY, { conversationId }, accessToken);
      setMessages(data.messages);
      
      // Mark conversation as read
      await graphqlRequest(MARK_CONVERSATION_READ_MUTATION, { conversationId }, accessToken);
      
      // Update unread count in conversations list
      setConversations(prev => 
        prev.map(conv => 
          conv.conversationId === conversationId 
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const fetchAllUsers = async () => {
    if (!accessToken) return;
    
    try {
      const data = await graphqlRequest(ALL_USERS_QUERY, {}, accessToken);
      // Filter out current user and apply role restrictions
      let filteredUsers = data.allUsers.filter((u: User) => u.id !== user?.id);
      
      if (isEmployee) {
        // Employees can only message managers
        filteredUsers = filteredUsers.filter((u: User) => u.role === 'manager');
      }
      
      setAllUsers(filteredUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!accessToken || !newMessage.trim()) return;
    
    try {
      setSending(true);
      
      let input: any = {
        message: newMessage,
      };

      if (showNewMessage) {
        // New conversation
        if (selectedRecipient) {
          input.recipientId = selectedRecipient;
        } else if (broadcastRole) {
          input.recipientRole = broadcastRole;
        }
        if (messageSubject) {
          input.subject = messageSubject;
        }
      } else if (selectedConversation) {
        // Reply to existing conversation
        const lastMsg = messages[messages.length - 1];
        if (lastMsg) {
          input.recipientId = lastMsg.senderId === user?.id ? lastMsg.recipientId : lastMsg.senderId;
          input.replyToId = lastMsg.id;
        }
      }

      await graphqlRequest(SEND_MESSAGE_MUTATION, { input }, accessToken);
      
      setNewMessage("");
      setMessageSubject("");
      
      if (showNewMessage) {
        setShowNewMessage(false);
        await fetchConversations();
      } else if (selectedConversation) {
        await fetchMessages(selectedConversation);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleNewMessageClick = () => {
    setShowNewMessage(true);
    setSelectedConversation(null);
    setMessages([]);
    setSelectedRecipient(null);
    setBroadcastRole(null);
    setMessageSubject("");
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    if (diffMins < 10080) return `${Math.floor(diffMins / 1440)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 70px)', background: '#f5f7fa' }}>
      {/* Conversations List */}
      <div style={{
        width: '350px',
        background: 'white',
        borderRight: '1px solid #e3e8ef',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e3e8ef',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#2c3e50' }}>
            💬 Messages
          </h2>
          <button
            onClick={handleNewMessageClick}
            style={{
              padding: '10px 16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ✏️ New
          </button>
        </div>

        {/* Conversations */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#95a5a6' }}>
              Loading conversations...
            </div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#95a5a6' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <p>No messages yet</p>
              <p style={{ fontSize: '14px' }}>Start a new conversation!</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.conversationId}
                onClick={() => {
                  setSelectedConversation(conv.conversationId);
                  setShowNewMessage(false);
                }}
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #f0f4f8',
                  cursor: 'pointer',
                  background: selectedConversation === conv.conversationId ? '#f0f4ff' : 'white',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (selectedConversation !== conv.conversationId) {
                    e.currentTarget.style.background = '#f8f9fa';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedConversation !== conv.conversationId) {
                    e.currentTarget.style.background = 'white';
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '18px',
                      fontWeight: 'bold'
                    }}>
                      {conv.participant.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#2c3e50', fontSize: '15px' }}>
                        {conv.participant}
                      </div>
                      <div style={{ fontSize: '12px', color: '#7f8c8d', textTransform: 'capitalize' }}>
                        {conv.participantRole}
                      </div>
                    </div>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div style={{
                      background: '#e74c3c',
                      color: 'white',
                      borderRadius: '12px',
                      padding: '2px 8px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      height: 'fit-content'
                    }}>
                      {conv.unreadCount}
                    </div>
                  )}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#7f8c8d',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {conv.lastMessage}
                </div>
                <div style={{ fontSize: '12px', color: '#95a5a6', marginTop: '4px' }}>
                  {formatTime(conv.lastMessageTime)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
        {showNewMessage ? (
          /* New Message Composer */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e3e8ef',
              background: 'white'
            }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#2c3e50' }}>
                ✏️ New Message
              </h3>

              {/* Recipient Selection */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
                  To:
                </label>
                {(isDirector || isManager) && (
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    <button
                      onClick={() => {
                        setSelectedRecipient(null);
                        setBroadcastRole(null);
                      }}
                      style={{
                        padding: '8px 16px',
                        background: !selectedRecipient && !broadcastRole ? '#667eea' : '#f0f4f8',
                        color: !selectedRecipient && !broadcastRole ? 'white' : '#2c3e50',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      Direct Message
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRecipient(null);
                        setBroadcastRole('manager');
                      }}
                      style={{
                        padding: '8px 16px',
                        background: broadcastRole === 'manager' ? '#667eea' : '#f0f4f8',
                        color: broadcastRole === 'manager' ? 'white' : '#2c3e50',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      📢 All Managers
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRecipient(null);
                        setBroadcastRole('employee');
                      }}
                      style={{
                        padding: '8px 16px',
                        background: broadcastRole === 'employee' ? '#667eea' : '#f0f4f8',
                        color: broadcastRole === 'employee' ? 'white' : '#2c3e50',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      📢 All Employees
                    </button>
                  </div>
                )}

                {!broadcastRole && (
                  <select
                    value={selectedRecipient || ''}
                    onChange={(e) => setSelectedRecipient(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e3e8ef',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Select a recipient...</option>
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.email} ({u.role})
                      </option>
                    ))}
                  </select>
                )}

                {broadcastRole && (
                  <div style={{
                    padding: '12px',
                    background: '#fff3cd',
                    border: '2px solid #ffc107',
                    borderRadius: '8px',
                    color: '#856404',
                    fontSize: '14px'
                  }}>
                    📢 Broadcasting to all {broadcastRole}s
                  </div>
                )}
              </div>

              {/* Subject */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
                  Subject (Optional):
                </label>
                <input
                  type="text"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  placeholder="Enter subject..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e3e8ef',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {/* Message Input */}
            <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                style={{
                  flex: 1,
                  padding: '16px',
                  border: '2px solid #e3e8ef',
                  borderRadius: '12px',
                  fontSize: '15px',
                  resize: 'none',
                  fontFamily: 'inherit'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', gap: '12px' }}>
                <button
                  onClick={() => setShowNewMessage(false)}
                  style={{
                    padding: '12px 24px',
                    background: '#e3e8ef',
                    color: '#2c3e50',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '600'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={sending || !newMessage.trim() || (!selectedRecipient && !broadcastRole)}
                  style={{
                    padding: '12px 24px',
                    background: (!newMessage.trim() || (!selectedRecipient && !broadcastRole)) 
                      ? '#95a5a6' 
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: (!newMessage.trim() || (!selectedRecipient && !broadcastRole)) ? 'not-allowed' : 'pointer',
                    fontSize: '15px',
                    fontWeight: '600'
                  }}
                >
                  {sending ? '✈️ Sending...' : '✈️ Send Message'}
                </button>
              </div>
            </div>
          </div>
        ) : selectedConversation ? (
          /* Message Thread */
          <>
            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              background: '#f5f7fa'
            }}>
              {messages.map((msg) => {
                const isMyMessage = msg.senderId === user?.id;
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      justifyContent: isMyMessage ? 'flex-end' : 'flex-start',
                      marginBottom: '16px'
                    }}
                  >
                    <div style={{
                      maxWidth: '70%',
                      padding: '12px 16px',
                      borderRadius: isMyMessage ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isMyMessage 
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : 'white',
                      color: isMyMessage ? 'white' : '#2c3e50',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                      {msg.subject && (
                        <div style={{
                          fontWeight: 'bold',
                          marginBottom: '8px',
                          paddingBottom: '8px',
                          borderBottom: `1px solid ${isMyMessage ? 'rgba(255,255,255,0.3)' : '#e3e8ef'}`
                        }}>
                          {msg.subject}
                        </div>
                      )}
                      <div style={{ marginBottom: '8px', whiteSpace: 'pre-wrap' }}>
                        {msg.message}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        opacity: 0.8,
                        textAlign: 'right'
                      }}>
                        {formatTime(msg.createdAt)}
                        {isMyMessage && msg.isRead && ' ✓✓'}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{
              padding: '20px',
              background: 'white',
              borderTop: '1px solid #e3e8ef'
            }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  style={{
                    flex: 1,
                    padding: '14px 18px',
                    border: '2px solid #e3e8ef',
                    borderRadius: '24px',
                    fontSize: '15px',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sending || !newMessage.trim()}
                  style={{
                    padding: '14px 24px',
                    background: !newMessage.trim() 
                      ? '#95a5a6' 
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '24px',
                    cursor: !newMessage.trim() ? 'not-allowed' : 'pointer',
                    fontSize: '18px'
                  }}
                >
                  ✈️
                </button>
              </div>
            </div>
          </>
        ) : (
          /* No conversation selected */
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#95a5a6',
            background: '#f5f7fa'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>💬</div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '24px' }}>Your Messages</h3>
            <p style={{ fontSize: '16px', margin: 0 }}>
              Select a conversation or start a new one
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
