import { gql } from "@apollo/client";

const USER_FIELDS = gql`
  fragment UserFields on User {
    id
    phone
    email
    name
    role
    isActive
    country
    createdAt
  }
`;

export const CURRENT_USER_QUERY = gql`
  query CurrentUser {
    currentUser {
      success
      message
      user {
        ...UserFields
        operator {
          id
          slug
          name
          isVerified
          color
        }
      }
    }
  }
  ${USER_FIELDS}
`;

export const USERS_QUERY = gql`
  query Users($limit: Int, $offset: Int, $search: String, $orderBy: String, $direction: String, $role: ROLE, $isActive: Boolean) {
    users(limit: $limit, offset: $offset, search: $search, orderBy: $orderBy, direction: $direction, role: $role, isActive: $isActive) {
      success
      message
      count
      users {
        ...UserFields
      }
    }
  }
  ${USER_FIELDS}
`;

export const CREATE_USER_MUTATION = gql`
  mutation CreateUser($phone: String!, $email: String, $password: String!, $name: String!, $role: ROLE) {
    createUser(phone: $phone, email: $email, password: $password, name: $name, role: $role) {
      success
      message
      user {
        ...UserFields
      }
    }
  }
  ${USER_FIELDS}
`;

export const UPDATE_USER_MUTATION = gql`
  mutation UpdateUser($id: ID!, $name: String, $phone: String, $email: String, $password: String, $role: ROLE, $isActive: Boolean) {
    updateUser(id: $id, name: $name, phone: $phone, email: $email, password: $password, role: $role, isActive: $isActive) {
      success
      message
      user {
        ...UserFields
      }
    }
  }
  ${USER_FIELDS}
`;

export const DELETE_USER_MUTATION = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id) {
      success
      message
    }
  }
`;
