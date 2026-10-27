const OperatorInput = `
    name: String
    licenceNo: String
    city: String
    foundedYear: Int
    about: String
    languages: [String]
    fleet: String
    coverUrl: String
`;

export default `#graphql
  type AreaScore {
    area: CLAIM_AREA
    "0–100; null when no promise in this area has been rated."
    score: Int
  }

  type OperatorStats {
    "The Expectation Score over every promise of every plan."
    score: Int
    areas: [AreaScore]
    stars: Float
    reviewCount: Int
    plansLive: Int
    tripsSold: Int
    "Bookings the agency itself cancelled, % of all its bookings."
    cancelRate: Float
  }

  "A travel agency. It signs up unverified; staff check the licence before its plans go live."
  type Operator {
    id: ID
    slug: String
    name: String
    licenceNo: String
    city: String
    foundedYear: Int
    about: String
    languages: [String]
    fleet: String
    isVerified: Boolean
    replyHours: Float
    color: String
    coverUrl: String
    createdAt: Date
    "Company-level numbers. Looked up only when asked for."
    stats: OperatorStats
    "Staff list only: HEALTHY, SLOW_REPLIES, REVIEW_NEEDED or UNVERIFIED."
    health: String
  }

  type OperatorResponse {
    success: Boolean
    message: String
    operator: Operator
  }

  type OperatorsResponse {
    success: Boolean
    message: String
    operators: [Operator]
  }

  type WeekSeats {
    start: Date
    seats: Int
  }

  "The promise costing the most score: what travellers said, and the score if it were reworded."
  type ExpectationGap {
    planId: ID
    planTitle: String
    claimId: ID
    claimText: String
    score: Int
    misses: Int
    total: Int
    current: Int
    ifFixed: Int
  }

  type NextDeparture {
    id: ID
    startDate: String
    planTitle: String
    seats: Int
    sold: Int
    "Travellers still needed to reach the plan's minimum group."
    missing: Int
    "FULL, NEEDS_MORE, GUIDE_ASSIGNED or NO_GUIDE."
    state: String
  }

  type PlanPerformance {
    id: ID
    title: String
    views: Int
    "Bookings per hundred views."
    conversion: Float
    score: Int
  }

  type PartnerDashboard {
    operator: Operator
    bookings: Int
    bookingsDelta: Int
    seatsSold: Int
    fillRate: Int
    revenueUsd: Int
    "% against the period before; null when there was nothing to compare with."
    revenueDelta: Int
    payoutPercent: Float
    score: Int
    scoreDelta: Int
    topPercent: Int
    replyHours: Float
    fastReplies: Boolean
    weeks: [WeekSeats]
    gap: ExpectationGap
    nextDepartures: [NextDeparture]
    planPerformance: [PlanPerformance]
  }

  type PartnerDashboardResponse {
    success: Boolean
    message: String
    dashboard: PartnerDashboard
  }

  type MarketplaceStats {
    verifiedOperators: Int
    pendingPlans: Int
    gmvUsd: Float
    bookings30d: Int
  }

  type MarketplaceStatsResponse {
    success: Boolean
    message: String
    stats: MarketplaceStats
  }

  extend type Query {
    "Verified agencies, for the public list."
    operators: OperatorsResponse
    operator(slug: String!): OperatorResponse
    "Every agency, verified or not, with its health."
    adminOperators: OperatorsResponse @auth(permissions: ["MANAGER"])
    "The signed-in agency's own record."
    myOperator: OperatorResponse @auth(permissions: ["OPERATOR"])
    partnerDashboard(days: Int): PartnerDashboardResponse @auth(permissions: ["OPERATOR"])
    marketplaceStats: MarketplaceStatsResponse @auth(permissions: ["MANAGER"])
  }

  extend type Mutation {
    updateMyOperator(${OperatorInput}): OperatorResponse @auth(permissions: ["OPERATOR"])
    "Unverifying sends the agency's live plans back to the review queue."
    setOperatorVerified(id: ID!, isVerified: Boolean!): OperatorResponse @auth(permissions: ["MANAGER"])
    "Staff add an agency by hand with its first OPERATOR login (login: an 8-digit phone or an email); isVerified when the licence is already checked."
    createOperator(${OperatorInput}, contactName: String!, login: String!, password: String!, isVerified: Boolean): OperatorResponse @auth(permissions: ["MANAGER"])
  }
`;
