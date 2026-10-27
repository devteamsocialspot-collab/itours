import BookingController from '../../../controllers/booking/booking.controller';
import ReviewController from '../../../controllers/booking/review.controller';
import UserController from '../../../controllers/user/user.controller';

import { BookingModel } from '../../../models/booking/booking.model';
import { ReviewModel } from '../../../models/booking/review.model';

import { PAY_METHOD } from '../../../types/booking/booking.type';
import { TContextUser, TTokenValue } from '../../../types/common.type';

import { fail, ok } from '../../../utils';

// every booking a resolver hands back was loaded with BookingController.include()
type Trip = Parameters<typeof BookingController.stage>[0];

export default {
  Query: {
    myBookings: async (_, __, context: TContextUser) => {
      try {
        return {
          ...ok(context.lang),
          bookings: await BookingController.getMyBookings(context.userId)
        };
      } catch (error) {
        return { ...fail(error, context.lang), bookings: [] };
      }
    },
    booking: async (_, doc: { code: string }, context: TContextUser) => {
      try {
        return {
          ...ok(context.lang),
          booking: await BookingController.getBooking(doc.code, context)
        };
      } catch (error) {
        return { ...fail(error, context.lang), booking: null };
      }
    },
    orders: async (_, doc, context: TContextUser) => {
      try {
        const operatorId = await UserController.operatorIdOf(context.userId);
        const { rows, count, tabs } = await BookingController.getOrders(operatorId, doc);
        return { ...ok(context.lang), orders: rows, count, tabs };
      } catch (error) {
        return { ...fail(error, context.lang), orders: [], count: 0, tabs: null };
      }
    },
    planReviews: async (_, doc: { planId: string; limit?: number }, context: TTokenValue) => {
      try {
        return {
          ...ok(context.lang),
          reviews: await ReviewController.getPlanReviews(doc.planId, doc.limit)
        };
      } catch (error) {
        return { ...fail(error, context.lang), reviews: [] };
      }
    }
  },
  Mutation: {
    createBooking: async (_, doc, context: TContextUser) => {
      try {
        const booking = await BookingController.createBooking(doc, context.userId);
        return {
          ...ok(
            context.lang,
            booking.method === PAY_METHOD.BANK ? 'response.seatsHeld' : 'response.booked'
          ),
          booking
        };
      } catch (error) {
        return { ...fail(error, context.lang), booking: null };
      }
    },
    cancelBooking: async (_, doc: { id: string }, context: TContextUser) => {
      try {
        return {
          ...ok(context.lang, 'response.bookingCancelled'),
          booking: await BookingController.cancelBooking(doc.id, context.userId)
        };
      } catch (error) {
        return { ...fail(error, context.lang), booking: null };
      }
    },
    submitReview: async (_, doc, context: TContextUser) => {
      try {
        return {
          ...ok(context.lang, 'response.reviewed'),
          review: await ReviewController.submitReview(doc, context.userId)
        };
      } catch (error) {
        return { ...fail(error, context.lang), review: null };
      }
    },
    confirmOrder: async (_, doc, context: TContextUser) => {
      try {
        const operatorId = await UserController.operatorIdOf(context.userId);
        return {
          ...ok(context.lang, 'response.orderConfirmed'),
          booking: await BookingController.confirmOrder(doc, operatorId)
        };
      } catch (error) {
        return { ...fail(error, context.lang), booking: null };
      }
    },
    markOrderPaid: async (_, doc: { id: string }, context: TContextUser) => {
      try {
        const operatorId = await UserController.operatorIdOf(context.userId);
        return {
          ...ok(context.lang, 'response.transferReceived'),
          booking: await BookingController.markPaid(doc.id, operatorId)
        };
      } catch (error) {
        return { ...fail(error, context.lang), booking: null };
      }
    },
    cancelOrder: async (_, doc: { id: string }, context: TContextUser) => {
      try {
        const operatorId = await UserController.operatorIdOf(context.userId);
        return {
          ...ok(context.lang, 'response.orderCancelled'),
          booking: await BookingController.cancelOrder(doc.id, operatorId)
        };
      } catch (error) {
        return { ...fail(error, context.lang), booking: null };
      }
    }
  },
  Booking: {
    stage: (booking: Trip) => BookingController.stage(booking),
    lastDay: (booking: Trip) => BookingController.lastDay(booking),
    freeCancelUntil: (booking: Trip) => BookingController.freeCancelUntil(booking),
    payoutUsd: (booking: Trip) => BookingController.payout(booking).usd,
    payoutDate: (booking: Trip) => BookingController.payout(booking).date,
    canCancel: (booking: Trip) => BookingController.canCancel(booking),
    canReview: (booking: Trip) => BookingController.canReview(booking),
    hasReview: (booking: BookingModel) => Boolean(booking.review)
  },
  Review: {
    travellerName: (review: ReviewModel) => review.traveller?.name ?? null,
    country: (review: ReviewModel) => review.traveller?.country ?? null,
    travelledAt: (review: ReviewModel) => review.booking?.departure?.startDate ?? null,
    gaps: (review: ReviewModel) => ReviewController.gaps(review)
  }
};
