import { Sequelize } from 'sequelize';

import { createOperatorModel } from './operator/operator.model';
import { UserModel, createUserModel } from './user/user.model';
import { PlanModel, createPlanModel } from './plan/plan.model';
import { PlanDayModel, createPlanDayModel } from './plan/plan-day.model';
import { ClaimModel, createClaimModel } from './plan/claim.model';
import { DepartureModel, createDepartureModel } from './plan/departure.model';
import { SavedPlanModel, createSavedPlanModel } from './plan/saved-plan.model';
import { BookingModel, createBookingModel } from './booking/booking.model';
import { ReviewModel, createReviewModel } from './booking/review.model';
import {
  ClaimRatingModel,
  createClaimRatingModel
} from './booking/claim-rating.model';

/**
 * Order matters: every createXModel() first, then every XModel.associate(). Creation order is also
 * sync order, so a table comes after the tables its foreign keys point at.
 */
export const setupModel = (sequelize: Sequelize) => {
  //Operator
  createOperatorModel(sequelize);

  //User
  createUserModel(sequelize);

  //Plan
  createPlanModel(sequelize);
  createPlanDayModel(sequelize);
  createClaimModel(sequelize);
  createDepartureModel(sequelize);
  createSavedPlanModel(sequelize);

  //Booking
  createBookingModel(sequelize);
  createReviewModel(sequelize);
  createClaimRatingModel(sequelize);

  //User
  UserModel.associate();

  //Plan
  PlanModel.associate();
  PlanDayModel.associate();
  ClaimModel.associate();
  DepartureModel.associate();
  SavedPlanModel.associate();

  //Booking
  BookingModel.associate();
  ReviewModel.associate();
  ClaimRatingModel.associate();
};
