import sequelize from '../../config/database';
import { ClaimRatingModel } from '../../models/booking/claim-rating.model';
import { ReviewModel } from '../../models/booking/review.model';
import { DepartureModel } from '../../models/plan/departure.model';
import { BookingModel } from '../../models/booking/booking.model';
import { ClaimModel } from '../../models/plan/claim.model';
import { UserModel } from '../../models/user/user.model';

import { BOOKING_STAGE, TReviewCreate } from '../../types/booking/booking.type';

import BookingController from './booking.controller';

export default class ReviewController {
  /** Who wrote it, when they travelled, and the ratings `gaps` counts. */
  static include = () => [
    { model: UserModel, as: 'traveller', attributes: ['name', 'country'] },
    {
      model: BookingModel,
      as: 'booking',
      attributes: ['id'],
      include: [{ model: DepartureModel, as: 'departure', attributes: ['startDate'] }]
    },
    { model: ClaimRatingModel, as: 'ratings', attributes: ['reviewId', 'score'], separate: true }
  ];

  /**
   * A traveller rates the trip once it is over: stars, a few words, and every promise of the plan as
   * as-described / partly / not (2/1/0). Only for their own completed booking, once (BR-08), and only
   * with every promise rated — a half-rated review would skew the score towards the easy promises.
   */
  static async submitReview(doc: TReviewCreate, userId: string) {
    const booking = await BookingController.findIdCheck(doc.bookingId);
    if (booking.userId !== userId) throw new Error('error.bookingNotFound');
    if (booking.review) throw new Error('error.alreadyReviewed');
    if (BookingController.stage(booking) !== BOOKING_STAGE.COMPLETED)
      throw new Error('error.reviewNotYet');
    const stars = Math.round(Number(doc.stars));
    if (!(stars >= 1 && stars <= 5)) throw new Error('error.starsInvalid');

    const claims = await ClaimModel.findAll({
      where: { planId: booking.planId },
      attributes: ['id']
    });
    const given = new Map((doc.ratings ?? []).map((r) => [r.claimId, Number(r.score)]));
    const ratings = claims.map((claim) => ({
      claimId: claim.id,
      score: given.get(claim.id)
    }));
    if (ratings.some((r) => r.score !== 0 && r.score !== 1 && r.score !== 2))
      throw new Error('error.reviewIncomplete');

    const review = await sequelize.transaction(async (transaction) => {
      const review = await ReviewModel.create(
        {
          bookingId: booking.id,
          userId,
          planId: booking.planId,
          stars,
          text: String(doc.text ?? '').trim().slice(0, 2000)
        },
        { transaction }
      );
      await ClaimRatingModel.bulkCreate(
        ratings.map((r) => ({ ...r, reviewId: review.id })),
        { transaction }
      );
      return review;
    });
    return ReviewModel.findByPk(review.id, { include: this.include() });
  }

  /** The latest reviews on a plan page, with who wrote them and when they travelled. */
  static async getPlanReviews(planId: string, limit = 4) {
    return ReviewModel.findAll({
      where: { planId },
      include: this.include(),
      order: [['createdAt', 'DESC']],
      limit: Math.min(Math.max(limit, 1), 50)
    });
  }

  /** "Matched the plan" when 0; otherwise how many promises fell short. */
  static gaps(review: ReviewModel) {
    return (review.ratings ?? []).filter((rating) => rating.score < 2).length;
  }
}
