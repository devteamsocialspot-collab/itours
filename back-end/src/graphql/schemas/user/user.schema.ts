import { PAGINATION_TYPE } from '../global.schema';

const UserCreate = `
    phone: String!
    password: String!
    name: String!
    email: String
    role: ROLE
`;

const UserUpdate = `
    id: ID!
    name: String
    phone: String
    email: String
    password: String
    role: ROLE
    isActive: Boolean
`;

export default `#graphql
  type User {
    id: ID
    phone: String
    email: String
    name: String
    role: ROLE
    isActive: Boolean
    country: String
    "The agency an OPERATOR works for; null for every other role."
    operator: Operator
    createdAt: Date
    updatedAt: Date
  }

  type UserResponse {
    success: Boolean
    message: String
    user: User
  }

  type UsersResponse {
    success: Boolean
    message: String
    users: [User]
    count: Int
  }

  type LoginUserResponse {
    success: Boolean
    message: String
    user: User
    token: String
  }

  extend type Query {
    currentUser: UserResponse @authLogin
    users(${PAGINATION_TYPE}, search: String, orderBy: String, direction: String, role: ROLE, isActive: Boolean): UsersResponse @auth(permissions: ["MANAGER"])
  }

  extend type Mutation {
    "login is an 8-digit phone or an email."
    loginUser(login: String!, password: String!): LoginUserResponse
    "Self sign-up: with a company name an agency account (unverified), otherwise a traveller."
    registerUser(name: String!, login: String!, password: String!, country: String, companyName: String): LoginUserResponse
    createUser(${UserCreate}): UserResponse @auth(permissions: ["MANAGER"])
    updateUser(${UserUpdate}): UserResponse @auth(permissions: ["MANAGER"])
    deleteUser(id: ID!): Response @auth(permissions: ["MANAGER"])
  }
`;
