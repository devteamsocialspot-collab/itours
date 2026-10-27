import { ROLES } from '../user/role.type';

/** Payments are simulated: card and QPay settle at once, a bank transfer waits for the operator. */
export enum PAY_METHOD {
  CARD = 'CARD',
  QPAY = 'QPAY',
  BANK = 'BANK'
}

/** Stored states. Travelling / completed are not stored: they follow from the departure dates. */
export enum BOOKING_STATUS {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED'
}

/** What a traveller and the orders inbox see: the stored state plus where the trip is in time. */
export enum BOOKING_STAGE {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  CONFIRMED = 'CONFIRMED',
  TRAVELLING = 'TRAVELLING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

/** The orders inbox tabs. ACTION = paid or awaiting a transfer, i.e. the operator must do something. */
export enum ORDER_TAB {
  ACTION = 'ACTION',
  CONFIRMED = 'CONFIRMED',
  TRAVELLING = 'TRAVELLING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum ROOM {
  TWIN = 'TWIN',
  SINGLE = 'SINGLE'
}

export type TBooking = {
  id: string;
  /** ITR-7F2K41: what the traveller quotes and the bank-transfer reference. */
  code: string;
  userId: string;
  planId: string;
  departureId: string;
  pax: number;
  room: ROOM;
  /** Computed on the server from the plan's prices, never taken from the form. */
  totalUsd: number;
  method: PAY_METHOD;
  status: BOOKING_STATUS;
  notes: string;
  guide: string;
  driver: string;
  acceptedTradeoffs: boolean;
  /** Who cancelled; the operator's share feeds its cancel rate. */
  cancelledBy: ROLES | null;

  createdAt: Date;
  updatedAt: Date;
};

export type TBookingCreate = Pick<
  TBooking,
  'planId' | 'departureId' | 'pax' | 'room' | 'method' | 'notes'
> & { accept: boolean };

/** One per completed booking. */
export type TReview = {
  id: string;
  bookingId: string;
  userId: string;
  planId: string;
  stars: number;
  text: string;

  createdAt: Date;
  updatedAt: Date;
};

/** 2 = as described, 1 = partly, 0 = not as described. */
export type TClaimRating = {
  id: string;
  reviewId: string;
  claimId: string;
  score: number;
};

export type TReviewCreate = {
  bookingId: string;
  stars: number;
  text: string;
  ratings: { claimId: string; score: number }[];
};
