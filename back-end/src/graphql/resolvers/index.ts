import { GraphQLScalarType, Kind } from 'graphql';

//User
import userResolver from './user/user.resolver';
//Operator
import operatorResolver from './operator/operator.resolver';
//Plan
import planResolver from './plan/plan.resolver';
//Booking
import bookingResolver from './booking/booking.resolver';

const DateScalar = new GraphQLScalarType({
  name: 'Date',
  serialize: (value) =>
    value instanceof Date
      ? value.toISOString()
      : value == null
        ? null
        : String(value),
  parseValue: (value) => new Date(value as string),
  parseLiteral: (ast) => (ast.kind === Kind.STRING ? new Date(ast.value) : null)
});

export const resolvers = [
  //User
  userResolver,
  //Operator
  operatorResolver,
  //Plan
  planResolver,
  //Booking
  bookingResolver,
  {
    Date: DateScalar,
    Query: { connect: () => 'connected' },
    Mutation: { connect: () => 'connected' }
  }
];
