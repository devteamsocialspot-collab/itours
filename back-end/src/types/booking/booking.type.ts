import { ROLES } from '../user/role.type';

/**
 * CARD = Stripe Checkout (travellers from abroad), QPAY = a QPay invoice, BANK = a transfer the operator
 * marks as received. Card and QPay are settled by their provider; without its keys, at once (simulated).
 */
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

/**
 * What a traveller and the orders inbox see: the stored state plus where the trip is in time.
 * EXPIRED = a PENDING_PAYMENT hold past its method's hold (BookingController.payBy); not stored either.
 */
export enum BOOKING_STAGE {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  CONFIRMED = 'CONFIRMED',
  TRAVELLING = 'TRAVELLING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
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
  qpayInvoiceId: string | null;
  stripeSessionId: string | null;
  /** The provider's payment: a Stripe payment intent, or QPay payment ids. Kept for refunds. */
  paymentRef: string | null;
  /** What the traveller pays with while PENDING_PAYMENT; cleared once paid. */
  payLink: TPayLink | null;

  createdAt: Date;
  updatedAt: Date;
};

/** A QPay bank-app button, exactly as QPay returns it (its docs forbid rebuilding the deeplinks). */
export type TQpayBank = { name: string; description: string; logo: string; link: string };

/** Stripe Checkout's page, or a QPay invoice's QR (base64 PNG), short link and bank-app links. */
export type TPayLink = {
  url?: string | null;
  qrImage?: string;
  shortUrl?: string;
  banks?: TQpayBank[];
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
