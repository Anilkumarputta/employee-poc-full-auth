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

  type Mutation {
    addEmployee(input: EmployeeInput!): Employee!
    updateEmployee(id: Int!, input: EmployeeInput!): Employee!
    deleteEmployee(id: Int!): Boolean!
    terminateEmployee(id: Int!): Employee!
  }
`;
