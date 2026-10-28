import { gql } from "@apollo/client";

const BOOKING_FIELDS = gql`
  fragment BookingFields on Booking {
    id
    code
    pax
    room
    totalUsd
    method
    status
    notes
    guide
    driver
    cancelledBy
    createdAt
    stage
    lastDay
    freeCancelUntil
    payoutUsd
    payoutDate
    canCancel
    canReview
    hasReview
    departure {
      id
      startDate
    }
    plan {
      id
      slug
      titleEn
      titleMn
      region
      days
      photos
      score
      freeCancelDays
      operator {
        id
        name
        slug
        replyHours
      }
    }
  }
`;

export const MY_BOOKINGS_QUERY = gql`
  query MyBookings {
    myBookings {
      success
      message
      bookings {
        ...BookingFields
        plan {
          id
          claims {
            id
            kind
            text
          }
        }
      }
    }
  }
  ${BOOKING_FIELDS}
`;

export const BOOKING_QUERY = gql`
  query Booking($code: String!) {
    booking(code: $code) {
      success
      message
      booking {
        ...BookingFields
        traveller {
          id
          name
        }
      }
    }
  }
  ${BOOKING_FIELDS}
`;

export const CREATE_BOOKING_MUTATION = gql`
  mutation CreateBooking($planId: ID!, $departureId: ID!, $pax: Int!, $room: ROOM, $method: PAY_METHOD!, $notes: String, $accept: Boolean!) {
    createBooking(planId: $planId, departureId: $departureId, pax: $pax, room: $room, method: $method, notes: $notes, accept: $accept) {
      success
      message
      booking {
        id
        code
      }
    }
  }
`;

export const CANCEL_BOOKING_MUTATION = gql`
  mutation CancelBooking($id: ID!) {
    cancelBooking(id: $id) {
      success
      message
    }
  }
`;

export const SUBMIT_REVIEW_MUTATION = gql`
  mutation SubmitReview($bookingId: ID!, $stars: Int!, $text: String, $ratings: [RatingInput!]!) {
    submitReview(bookingId: $bookingId, stars: $stars, text: $text, ratings: $ratings) {
      success
      message
    }
  }
`;

export const LATEST_REVIEWS_QUERY = gql`
  query LatestReviews($limit: Int) {
    latestReviews(limit: $limit) {
      success
      message
      reviews {
        id
        stars
        text
        travellerName
        country
        travelledAt
        gaps
        plan {
          id
          slug
          titleEn
          titleMn
          operator {
            id
            name
          }
        }
      }
    }
  }
`;

// —— partner orders ——

export const ORDERS_QUERY = gql`
  query Orders($tab: ORDER_TAB, $search: String, $orderBy: String, $direction: String, $limit: Int, $offset: Int) {
    orders(tab: $tab, search: $search, orderBy: $orderBy, direction: $direction, limit: $limit, offset: $offset) {
      success
      message
      count
      tabs {
        ACTION
        CONFIRMED
        TRAVELLING
        COMPLETED
        CANCELLED
      }
      orders {
        ...BookingFields
        traveller {
          id
          name
          email
          phone
          country
        }
      }
    }
  }
  ${BOOKING_FIELDS}
`;

export const CONFIRM_ORDER_MUTATION = gql`
  mutation ConfirmOrder($id: ID!, $guide: String!, $driver: String) {
    confirmOrder(id: $id, guide: $guide, driver: $driver) {
      success
      message
    }
  }
`;

export const MARK_PAID_MUTATION = gql`
  mutation MarkOrderPaid($id: ID!) {
    markOrderPaid(id: $id) {
      success
      message
    }
  }
`;

export const CANCEL_ORDER_MUTATION = gql`
  mutation CancelOrder($id: ID!) {
    cancelOrder(id: $id) {
      success
      message
    }
  }
`;
