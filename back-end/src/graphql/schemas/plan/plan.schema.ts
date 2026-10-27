import { PAGINATION_TYPE } from '../global.schema';

// the editor sends the whole plan; days are replaced, claims and departures matched by id
const PlanInput = `
    id: ID!
    titleEn: String
    titleMn: String
    region: String
    area: AREA
    season: String
    minGroup: Int
    maxGroup: Int
    difficulty: DIFFICULTY
    vehicle: String
    sleeping: String
    lodging: [String]
    summary: String
    summaryMn: String
    priceUsd: Int
    groupPriceUsd: Int
    groupPriceFrom: Int
    singleSupplement: Int
    included: [String]
    excluded: [String]
    photos: [String]
    freeCancelDays: Int
    totalKm: Int
    unpavedPct: Int
    dayItems: [PlanDayInput]
    claims: [ClaimInput]
    departures: [DepartureInput]
`;

const PlanSearch = `
    search: String
    "One region."
    area: AREA
    "YYYY-MM: only plans with a departure that month with seats for pax."
    month: String
    minDays: Int
    maxDays: Int
    pax: Int
    minScore: Int
    maxPrice: Int
    difficulty: [DIFFICULTY]
    lodging: [String]
    "shower, flush, drive (max 5 h a day), english"
    dealBreakers: [String]
    "Agency slugs."
    operators: [String]
    "best (default), score or price"
    sort: String
`;

export default `#graphql
  type PlanDay {
    dayNo: Int
    place: String
    title: String
    description: String
    "Null = not filled in, which blocks submitting."
    driveHours: Float
    sleeping: String
    meals: String
    hotShower: Boolean
    signal: Boolean
    flushToilet: Boolean
  }

  "A pro or a con the agency wrote; travellers rate it after the trip."
  type Claim {
    id: ID
    kind: CLAIM_KIND
    area: CLAIM_AREA
    text: String
    detail: String
    sort: Int
    "0–100 over its ratings; null until rated."
    score: Int
    ratingCount: Int
  }

  type Departure {
    id: ID
    "YYYY-MM-DD"
    startDate: String
    seats: Int
    "Seats nobody has booked; only on a plan's departures."
    left: Int
  }

  "One line of the publish checklist; label is already in the reader's language."
  type PlanCheck {
    key: String
    label: String
    ok: Boolean
    required: Boolean
  }

  type Plan {
    id: ID
    slug: String
    titleEn: String
    titleMn: String
    region: String
    area: AREA
    season: String
    days: Int
    minGroup: Int
    maxGroup: Int
    difficulty: DIFFICULTY
    vehicle: String
    sleeping: String
    lodging: [String]
    summary: String
    summaryMn: String
    priceUsd: Int
    groupPriceUsd: Int
    groupPriceFrom: Int
    singleSupplement: Int
    included: [String]
    excluded: [String]
    photos: [String]
    freeCancelDays: Int
    totalKm: Int
    unpavedPct: Int
    status: PLAN_STATUS
    reviewNote: String
    submittedAt: Date
    views: Int
    createdAt: Date
    updatedAt: Date
    operator: Operator
    dayItems: [PlanDay]
    claims: [Claim]
    "Departures still ahead, with seats left."
    departures: [Departure]
    "The Expectation Score: how closely travellers' trips matched these promises. Null until rated."
    score: Int
    areas: [AreaScore]
    ratingCount: Int
    reviewCount: Int
    stars: Float
    "Hours on the longest driving day, and in the vehicle overall."
    maxDrive: Float
    driveTotal: Float
    showerNights: Int
    flushNights: Int
    nightCount: Int
    checks: [PlanCheck]
    canSubmit: Boolean
  }

  type PlanFacet {
    slug: String
    name: String
    count: Int
  }

  type PlanResponse {
    success: Boolean
    message: String
    plan: Plan
  }

  type PlansResponse {
    success: Boolean
    message: String
    plans: [Plan]
    count: Int
    "Plans per agency for the search words alone, for the filter rail."
    facets: [PlanFacet]
  }

  type SavedResponse {
    success: Boolean
    message: String
    saved: Boolean
  }

  "Public numbers for the home page, and the money settings the screens format with."
  type SiteInfo {
    verifiedOperators: Int
    publishedPlans: Int
    mntPerUsd: Float
    commissionPercent: Float
  }

  type SiteInfoResponse {
    success: Boolean
    message: String
    info: SiteInfo
  }

  input PlanDayInput {
    place: String
    title: String
    description: String
    driveHours: Float
    sleeping: String
    meals: String
    hotShower: Boolean
    signal: Boolean
    flushToilet: Boolean
  }

  input ClaimInput {
    "Empty for a new promise."
    id: ID
    kind: CLAIM_KIND
    area: CLAIM_AREA
    text: String
    detail: String
  }

  input DepartureInput {
    id: ID
    startDate: String
    seats: Int
  }

  extend type Query {
    plans(${PlanSearch}, ${PAGINATION_TYPE}): PlansResponse
    "A draft opens for its own agency and for staff only."
    plan(slug: String!): PlanResponse
    siteInfo: SiteInfoResponse
    savedPlans: PlansResponse @auth(permissions: ["USER"])
    partnerPlans: PlansResponse @auth(permissions: ["OPERATOR"])
    partnerPlan(id: ID!): PlanResponse @auth(permissions: ["OPERATOR"])
    reviewQueue: PlansResponse @auth(permissions: ["MANAGER"])
  }

  extend type Mutation {
    toggleSavePlan(planId: ID!): SavedResponse @auth(permissions: ["USER"])
    createPlan: PlanResponse @auth(permissions: ["OPERATOR"])
    savePlan(${PlanInput}): PlanResponse @auth(permissions: ["OPERATOR"])
    "To the review queue — or, for a published plan, nothing more: its edits are live once saved."
    submitPlan(id: ID!): PlanResponse @auth(permissions: ["OPERATOR"])
    approvePlan(id: ID!): PlanResponse @auth(permissions: ["MANAGER"])
    requestPlanFixes(id: ID!, note: String): PlanResponse @auth(permissions: ["MANAGER"])
  }
`;
