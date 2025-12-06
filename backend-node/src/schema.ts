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

  type Employee {
    id: Int!
    name: String!
    age: Int!
    className: String!
    subjects: [String!]!
    attendance: Int!
    role: String!
    status: String!
    location: String!
    lastLogin: String!
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
  }

  input EmployeeInput {
    name: String!
    age: Int!
    className: String!
    subjects: [String!]!
    attendance: Int!
    role: String!
    status: String!
    location: String!
    lastLogin: String!
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
    
    leaveRequests(status: String): [LeaveRequest!]!
    myLeaveRequests: [LeaveRequest!]!
    
    accessLogs(page: Int = 1, pageSize: Int = 50): [AccessLog!]!
    
    adminUsers: [User!]!
    allUsers: [User!]!
    me: User
  }

  type Mutation {
    addEmployee(input: EmployeeInput!): Employee!
    updateEmployee(id: Int!, input: EmployeeInput!): Employee!
    deleteEmployee(id: Int!): Boolean!
    deleteUser(id: Int!): Boolean!
    terminateEmployee(id: Int!): Employee!
    
    sendNote(input: NoteInput!): Note!
    markNoteAsRead(id: Int!): Note!
    
    createLeaveRequest(input: LeaveRequestInput!): LeaveRequest!
    updateLeaveRequestStatus(id: Int!, status: String!, adminNote: String): LeaveRequest!
    
    changePassword(currentPassword: String!, newPassword: String!): PasswordChangeResult!
    
    logAccess(action: String!, details: String): AccessLog!
  }
`;
