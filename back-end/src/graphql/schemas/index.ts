import { mergeTypeDefs } from '@graphql-tools/merge';
import globalSchema from './global.schema';
import enumSchema from './enum.schema';

import userSchema from './user/user.schema';

import operatorSchema from './operator/operator.schema';

import planSchema from './plan/plan.schema';

import bookingSchema from './booking/booking.schema';

export const typeDefs = mergeTypeDefs([
  globalSchema,
  enumSchema,
  //User
  userSchema,
  //Operator
  operatorSchema,
  //Plan
  planSchema,
  //Booking
  bookingSchema
]);
