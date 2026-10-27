import { gql } from "@apollo/client";

const OPERATOR_FIELDS = gql`
  fragment OperatorFields on Operator {
    id
    slug
    name
    licenceNo
    city
    foundedYear
    about
    languages
    fleet
    isVerified
    replyHours
    color
    coverUrl
  }
`;

const STATS_FIELDS = gql`
  fragment OperatorStatsFields on Operator {
    stats {
      score
      stars
      reviewCount
      plansLive
      tripsSold
      cancelRate
      areas {
        area
        score
      }
    }
  }
`;

export const OPERATORS_QUERY = gql`
  query Operators {
    operators {
      success
      message
      operators {
        ...OperatorFields
        ...OperatorStatsFields
      }
    }
  }
  ${OPERATOR_FIELDS}
  ${STATS_FIELDS}
`;

export const OPERATOR_QUERY = gql`
  query Operator($slug: String!) {
    operator(slug: $slug) {
      success
      message
      operator {
        ...OperatorFields
        ...OperatorStatsFields
      }
    }
  }
  ${OPERATOR_FIELDS}
  ${STATS_FIELDS}
`;

export const ADMIN_OPERATORS_QUERY = gql`
  query AdminOperators {
    adminOperators {
      success
      message
      operators {
        ...OperatorFields
        ...OperatorStatsFields
        health
      }
    }
  }
  ${OPERATOR_FIELDS}
  ${STATS_FIELDS}
`;

export const MY_OPERATOR_QUERY = gql`
  query MyOperator {
    myOperator {
      success
      message
      operator {
        ...OperatorFields
        ...OperatorStatsFields
      }
    }
  }
  ${OPERATOR_FIELDS}
  ${STATS_FIELDS}
`;

export const UPDATE_MY_OPERATOR_MUTATION = gql`
  mutation UpdateMyOperator(
    $name: String
    $licenceNo: String
    $city: String
    $foundedYear: Int
    $about: String
    $languages: [String]
    $fleet: String
    $coverUrl: String
  ) {
    updateMyOperator(
      name: $name
      licenceNo: $licenceNo
      city: $city
      foundedYear: $foundedYear
      about: $about
      languages: $languages
      fleet: $fleet
      coverUrl: $coverUrl
    ) {
      success
      message
      operator {
        ...OperatorFields
      }
    }
  }
  ${OPERATOR_FIELDS}
`;

export const CREATE_OPERATOR_MUTATION = gql`
  mutation CreateOperator(
    $name: String!
    $licenceNo: String
    $city: String
    $foundedYear: Int
    $languages: [String]
    $contactName: String!
    $login: String!
    $password: String!
    $isVerified: Boolean
  ) {
    createOperator(
      name: $name
      licenceNo: $licenceNo
      city: $city
      foundedYear: $foundedYear
      languages: $languages
      contactName: $contactName
      login: $login
      password: $password
      isVerified: $isVerified
    ) {
      success
      message
      operator {
        id
        name
        isVerified
      }
    }
  }
`;

export const SET_VERIFIED_MUTATION = gql`
  mutation SetOperatorVerified($id: ID!, $isVerified: Boolean!) {
    setOperatorVerified(id: $id, isVerified: $isVerified) {
      success
      message
    }
  }
`;

export const PARTNER_DASHBOARD_QUERY = gql`
  query PartnerDashboard($days: Int) {
    partnerDashboard(days: $days) {
      success
      message
      dashboard {
        bookings
        bookingsDelta
        seatsSold
        fillRate
        revenueUsd
        revenueDelta
        payoutPercent
        score
        scoreDelta
        topPercent
        replyHours
        fastReplies
        weeks {
          start
          seats
        }
        gap {
          planId
          planTitle
          claimId
          claimText
          score
          misses
          total
          current
          ifFixed
        }
        nextDepartures {
          id
          startDate
          planTitle
          seats
          sold
          missing
          state
        }
        planPerformance {
          id
          title
          views
          conversion
          score
        }
      }
    }
  }
`;

export const MARKETPLACE_STATS_QUERY = gql`
  query MarketplaceStats {
    marketplaceStats {
      success
      message
      stats {
        verifiedOperators
        pendingPlans
        gmvUsd
        bookings30d
      }
    }
  }
`;

// just the numbers beside the nav items; the screens load their own data
export const PARTNER_COUNTS_QUERY = gql`
  query PartnerCounts {
    partnerPlans {
      count
    }
    orders(limit: 1) {
      tabs {
        ACTION
      }
    }
    myOperator {
      operator {
        id
        stats {
          score
        }
      }
    }
  }
`;
export const ADMIN_COUNTS_QUERY = gql`
  query AdminCounts {
    marketplaceStats {
      stats {
        pendingPlans
      }
    }
  }
`;
