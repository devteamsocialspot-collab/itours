import { PAGINATION_TYPE } from '../global.schema';

export default `#graphql
  type Booking {
    id: ID
    code: String
    pax: Int
    room: ROOM
    totalUsd: Int
    method: PAY_METHOD
    status: BOOKING_STATUS
    notes: String
    guide: String
    driver: String
    acceptedTradeoffs: Boolean
    cancelledBy: ROLE
    createdAt: Date
    plan: Plan
    departure: Departure
    "Who booked; shown to the agency."
    traveller: User
    "The stored status, plus TRAVELLING / COMPLETED from the dates."
    stage: BOOKING_STAGE
    "YYYY-MM-DD"
    lastDay: String
    freeCancelUntil: String
    "What the agency receives, and when."
    payoutUsd: Float
    payoutDate: String
    canCancel: Boolean
    canReview: Boolean
    hasReview: Boolean
  }

  type BookingResponse {
    success: Boolean
    message: String
    booking: Booking
  }

  type BookingsResponse {
    success: Boolean
    message: String
    bookings: [Booking]
  }

  type OrderTabs {
    ACTION: Int
    CONFIRMED: Int
    TRAVELLING: Int
    COMPLETED: Int
    CANCELLED: Int
  }

  type OrdersResponse {
    success: Boolean
    message: String
    orders: [Booking]
    count: Int
    tabs: OrderTabs
  }

  type Review {
    id: ID
    stars: Int
    text: String
    createdAt: Date
    travellerName: String
    country: String
    "YYYY-MM-DD the trip started."
    travelledAt: String
    "Promises that fell short; 0 = matched the plan."
    gaps: Int
  }

  type ReviewResponse {
    success: Boolean
    message: String
    review: Review
  }

  type ReviewsResponse {
    success: Boolean
    message: String
    reviews: [Review]
  }

  input RatingInput {
    claimId: ID!
    "2 = as described, 1 = partly, 0 = not as described"
    score: Int!
  }

  extend type Query {
    myBookings: BookingsResponse @auth(permissions: ["USER"])
    "The confirmation page: its traveller, the agency, or staff."
    booking(code: String!): BookingResponse @authLogin
    "orderBy: createdAt (the booking, default) or startDate (the departure); direction: DESC (default) or ASC."
    orders(tab: ORDER_TAB, search: String, orderBy: String, direction: String, ${PAGINATION_TYPE}): OrdersResponse @auth(permissions: ["OPERATOR"])
    planReviews(planId: ID!, limit: Int): ReviewsResponse
  }

  extend type Mutation {
    "Price is computed on the server; accept = the traveller read the plan's cons."
    createBooking(planId: ID!, departureId: ID!, pax: Int!, room: ROOM, method: PAY_METHOD!, notes: String, accept: Boolean!): BookingResponse @auth(permissions: ["USER"])
    cancelBooking(id: ID!): BookingResponse @auth(permissions: ["USER"])
    "Every promise of the plan must be rated."
    submitReview(bookingId: ID!, stars: Int!, text: String, ratings: [RatingInput!]!): ReviewResponse @auth(permissions: ["USER"])
    confirmOrder(id: ID!, guide: String!, driver: String): BookingResponse @auth(permissions: ["OPERATOR"])
    markOrderPaid(id: ID!): BookingResponse @auth(permissions: ["OPERATOR"])
    cancelOrder(id: ID!): BookingResponse @auth(permissions: ["OPERATOR"])
  }
`;
