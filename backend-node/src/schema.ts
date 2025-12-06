import { gql } from "apollo-server-express";

export const typeDefs = gql`
  enum EmployeeSortBy {
    NAME
    AGE
    ATTENDANCE
    CREATED_AT
  }

  enum SortOrder {
    ASC
    DESC
  }

  type GenerateLoginsResult {
    success: Boolean!
    message: String!
    created: Int!
    skipped: Int!
    failed: Int!
  }

  type Employee {
    id: Int!
    name: String!
    email: String
    userId: Int
    age: Int!
    className: String!
    subjects: [String!]!
    attendance: Int!
    role: String!
    status: String!
    location: String!
    lastLogin: String!
    flagged: Boolean!
    avatar: String
    managerId: Int
    createdAt: String!
    updatedAt: String!
  }

  type EmployeesPage {
    items: [Employee!]!
    total: Int!
    page: Int!
    pageSize: Int!
  }

  input EmployeeFilter {
    nameContains: String
    className: String
    status: String
    roleNot: String
  }

  type Query {
    employees(
      filter: EmployeeFilter
      page: Int = 1
      pageSize: Int = 10
      sortBy: EmployeeSortBy = CREATED_AT
      sortOrder: SortOrder = DESC
    ): EmployeesPage!

    employee(id: Int!): Employee
    myProfile: Employee
  }

  input EmployeeInput {
    name: String!
    email: String
    userId: Int
    age: Int!
    className: String!
    subjects: [String!]!
    attendance: Int!
    role: String!
    status: String!
    location: String!
    lastLogin: String!
    flagged: Boolean
    avatar: String
    managerId: Int
  }

  type Note {
    id: Int!
    message: String!
    fromUserId: Int!
    toEmployeeId: Int
    toAll: Boolean!
    isRead: Boolean!
    createdAt: String!
  }

  type Message {
    id: Int!
    conversationId: String!
    senderId: Int!
    senderEmail: String!
    senderRole: String!
    recipientId: Int
    recipientEmail: String
    recipientRole: String
    subject: String
    message: String!
    messageType: String!
    isRead: Boolean!
    readAt: String
    priority: String!
    replyToId: Int
    attachments: [String!]!
    createdAt: String!
    updatedAt: String!
  }

  type Notification {
    id: Int!
    userId: Int!
    userEmail: String!
    title: String!
    message: String!
    type: String!
    isRead: Boolean!
    readAt: String
    actionUrl: String
    linkTo: String
    createdAt: String!
    updatedAt: String!
  }

  type Thread {
    id: Int!
    participants: [Int!]!
    linkedEmployeeId: Int
    linkedRequestId: Int
    title: String
    createdAt: String!
    updatedAt: String!
    messages: [ThreadMessage!]!
    lastMessage: ThreadMessage
  }

  type ThreadMessage {
    id: Int!
    threadId: Int!
    senderId: Int!
    senderEmail: String!
    senderRole: String!
    body: String!
    type: String!
    createdAt: String!
  }

  type ReviewRequest {
    id: Int!
    employeeId: Int!
    employee: Employee!
    requestedByManagerId: Int!
    requestedByEmail: String!
    type: String!
    status: String!
    managerReasonType: String!
    managerReasonText: String!
    visibleToEmployee: Boolean!
    adminComment: String
    reviewedByAdminId: Int
    reviewedAt: String
    threadId: Int
    createdAt: String!
    updatedAt: String!
  }

  type Conversation {
    conversationId: String!
    participant: String!
    participantRole: String!
    lastMessage: String!
    lastMessageTime: String!
    unreadCount: Int!
  }

  type MessageStats {
    total: Int!
    unread: Int!
    conversations: Int!
  }

  input SendMessageInput {
    recipientId: Int
    recipientRole: String
    subject: String
    message: String!
    priority: String
    replyToId: Int
  }

  type LeaveRequest {
    id: Int!
    employeeId: Int!
    employeeName: String
    reason: String!
    startDate: String!
    endDate: String!
    status: String!
    adminNote: String
    createdAt: String!
    updatedAt: String!
  }

  type AccessLog {
    id: Int!
    userId: Int!
    userEmail: String!
    action: String!
    details: String
    ipAddress: String
    createdAt: String!
  }

  type User {
    id: Int!
    email: String!
    role: String!
    createdAt: String!
  }

  type PasswordChangeResult {
    success: Boolean!
    message: String!
  }

  input NoteInput {
    message: String!
    toEmployeeId: Int
    toAll: Boolean
  }

  input LeaveRequestInput {
    reason: String!
    startDate: String!
    endDate: String!
  }

  input CreateNotificationInput {
    recipientUserId: Int
    recipientRole: String
    type: String!
    title: String!
    message: String!
    linkTo: String
  }

  input CreateReviewRequestInput {
    employeeId: Int!
    type: String!
    managerReasonType: String!
    managerReasonText: String!
    visibleToEmployee: Boolean!
  }

  input ReviewDecisionInput {
    requestId: Int!
    decision: String!
    adminComment: String!
  }

  input SendThreadMessageInput {
    threadId: Int
    recipientUserIds: [Int!]
    linkedEmployeeId: Int
    linkedRequestId: Int
    title: String
    body: String!
  }

  type Query {
    employees(
      filter: EmployeeFilter
      page: Int = 1
      pageSize: Int = 10
      sortBy: EmployeeSortBy = CREATED_AT
      sortOrder: SortOrder = DESC
    ): EmployeesPage!

    employee(id: Int!): Employee
    
    notes(employeeId: Int): [Note!]!
    myNotes: [Note!]!
    
    messages(conversationId: String): [Message!]!
    myMessages: [Message!]!
    myConversations: [Conversation!]!
    messageStats: MessageStats!
    
    notifications: [Notification!]!
    unreadNotifications: [Notification!]!
    notificationCount: Int!
    
    threads: [Thread!]!
    thread(id: Int!): Thread
    myThreads: [Thread!]!
    
    reviewRequests(status: String): [ReviewRequest!]!
    reviewRequest(id: Int!): ReviewRequest
    myReviewRequests: [ReviewRequest!]!
    
    leaveRequests(status: String): [LeaveRequest!]!
    myLeaveRequests: [LeaveRequest!]!
    
    accessLogs(page: Int = 1, pageSize: Int = 50): [AccessLog!]!
    
    adminUsers: [User!]!
    allUsers: [User!]!
    me: User
  }

  input ProfileUpdateInput {
    name: String
    email: String
    age: Int
    location: String
  }

  type Mutation {
    addEmployee(input: EmployeeInput!): Employee!
    updateEmployee(id: Int!, input: EmployeeInput!): Employee!
    updateMyProfile(input: ProfileUpdateInput!): Employee!
    deleteEmployee(id: Int!): Boolean!
    deleteUser(id: Int!): Boolean!
    terminateEmployee(id: Int!): Employee!
    flagEmployee(id: Int!, flagged: Boolean!): Employee!
    generateEmployeeLogins: GenerateLoginsResult!
    
    sendNote(input: NoteInput!): Note!
    markNoteAsRead(id: Int!): Note!
    
    sendMessage(input: SendMessageInput!): Message!
    markMessageAsRead(id: Int!): Message!
    markConversationAsRead(conversationId: String!): Boolean!
    deleteMessage(id: Int!): Boolean!
    
    markNotificationAsRead(id: Int!): Notification!
    markAllNotificationsAsRead: Boolean!
    deleteNotification(id: Int!): Boolean!
    createNotification(input: CreateNotificationInput!): Notification!
    
    sendThreadMessage(input: SendThreadMessageInput!): ThreadMessage!
    
    createReviewRequest(input: CreateReviewRequestInput!): ReviewRequest!
    reviewDecision(input: ReviewDecisionInput!): ReviewRequest!
    
    createLeaveRequest(input: LeaveRequestInput!): LeaveRequest!
    updateLeaveRequestStatus(id: Int!, status: String!, adminNote: String): LeaveRequest!
    
    changePassword(currentPassword: String!, newPassword: String!): PasswordChangeResult!
    
    logAccess(action: String!, details: String): AccessLog!
  }
`;
