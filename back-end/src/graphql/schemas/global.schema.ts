export const PAGINATION_TYPE = 'limit: Int, offset: Int';

export default `#graphql
  directive @auth(permissions: [String!]) on FIELD_DEFINITION
  directive @authLogin on FIELD_DEFINITION

  type Response {
    success: Boolean
    message: String
  }

  scalar Date
  type Mutation { connect: String }
  type Query { connect: String }
`;
