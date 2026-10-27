import { gql } from "@apollo/client";

/** What a card or a search result shows: the plan's facts, its first promises and what is on sale. */
export const PLAN_CARD_FIELDS = gql`
  fragment PlanCardFields on Plan {
    id
    slug
    titleEn
    titleMn
    region
    area
    season
    days
    minGroup
    maxGroup
    difficulty
    vehicle
    lodging
    photos
    priceUsd
    status
    views
    score
    stars
    reviewCount
    ratingCount
    maxDrive
    showerNights
    flushNights
    nightCount
    operator {
      id
      slug
      name
      isVerified
      color
      foundedYear
      languages
    }
    claims {
      id
      kind
      text
    }
    departures {
      id
      startDate
      seats
      left
    }
  }
`;

/** Everything the plan page and the editor read. */
export const PLAN_FIELDS = gql`
  fragment PlanFields on Plan {
    ...PlanCardFields
    summary
    summaryMn
    sleeping
    groupPriceUsd
    groupPriceFrom
    singleSupplement
    included
    excluded
    freeCancelDays
    totalKm
    unpavedPct
    reviewNote
    submittedAt
    updatedAt
    driveTotal
    areas {
      area
      score
    }
    claims {
      id
      kind
      area
      text
      detail
      sort
      score
      ratingCount
    }
    dayItems {
      dayNo
      place
      title
      description
      driveHours
      sleeping
      meals
      hotShower
      signal
      flushToilet
    }
    operator {
      id
      slug
      name
      isVerified
      color
      foundedYear
      replyHours
      stats {
        stars
        reviewCount
        tripsSold
      }
    }
  }
  ${PLAN_CARD_FIELDS}
`;

const CHECK_FIELDS = gql`
  fragment PlanCheckFields on Plan {
    canSubmit
    checks {
      key
      label
      ok
      required
    }
  }
`;

export const PLANS_QUERY = gql`
  query Plans(
    $search: String
    $area: AREA
    $month: String
    $minDays: Int
    $maxDays: Int
    $pax: Int
    $minScore: Int
    $maxPrice: Int
    $difficulty: [DIFFICULTY]
    $lodging: [String]
    $dealBreakers: [String]
    $operators: [String]
    $sort: String
    $limit: Int
  ) {
    plans(
      search: $search
      area: $area
      month: $month
      minDays: $minDays
      maxDays: $maxDays
      pax: $pax
      minScore: $minScore
      maxPrice: $maxPrice
      difficulty: $difficulty
      lodging: $lodging
      dealBreakers: $dealBreakers
      operators: $operators
      sort: $sort
      limit: $limit
    ) {
      success
      message
      count
      plans {
        ...PlanCardFields
      }
      facets {
        slug
        name
        count
      }
    }
  }
  ${PLAN_CARD_FIELDS}
`;

export const PLAN_QUERY = gql`
  query Plan($slug: String!) {
    plan(slug: $slug) {
      success
      message
      plan {
        ...PlanFields
      }
    }
  }
  ${PLAN_FIELDS}
`;

export const PLAN_REVIEWS_QUERY = gql`
  query PlanReviews($planId: ID!, $limit: Int) {
    planReviews(planId: $planId, limit: $limit) {
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
      }
    }
  }
`;

export const SITE_INFO_QUERY = gql`
  query SiteInfo {
    siteInfo {
      success
      message
      info {
        verifiedOperators
        publishedPlans
        mntPerUsd
        commissionPercent
      }
    }
  }
`;

export const SAVED_PLANS_QUERY = gql`
  query SavedPlans {
    savedPlans {
      success
      message
      plans {
        ...PlanCardFields
      }
    }
  }
  ${PLAN_CARD_FIELDS}
`;

export const TOGGLE_SAVE_MUTATION = gql`
  mutation ToggleSavePlan($planId: ID!) {
    toggleSavePlan(planId: $planId) {
      success
      message
      saved
    }
  }
`;

// —— partner ——

export const PARTNER_PLANS_QUERY = gql`
  query PartnerPlans {
    partnerPlans {
      success
      message
      plans {
        ...PlanCardFields
        reviewNote
        updatedAt
      }
    }
  }
  ${PLAN_CARD_FIELDS}
`;

export const PARTNER_PLAN_QUERY = gql`
  query PartnerPlan($id: ID!) {
    partnerPlan(id: $id) {
      success
      message
      plan {
        ...PlanFields
        ...PlanCheckFields
      }
    }
  }
  ${PLAN_FIELDS}
  ${CHECK_FIELDS}
`;

export const CREATE_PLAN_MUTATION = gql`
  mutation CreatePlan {
    createPlan {
      success
      message
      plan {
        id
      }
    }
  }
`;

export const SAVE_PLAN_MUTATION = gql`
  mutation SavePlan(
    $id: ID!
    $titleEn: String
    $titleMn: String
    $region: String
    $area: AREA
    $season: String
    $minGroup: Int
    $maxGroup: Int
    $difficulty: DIFFICULTY
    $vehicle: String
    $sleeping: String
    $lodging: [String]
    $summary: String
    $summaryMn: String
    $priceUsd: Int
    $groupPriceUsd: Int
    $groupPriceFrom: Int
    $singleSupplement: Int
    $included: [String]
    $excluded: [String]
    $photos: [String]
    $freeCancelDays: Int
    $totalKm: Int
    $unpavedPct: Int
    $dayItems: [PlanDayInput]
    $claims: [ClaimInput]
    $departures: [DepartureInput]
  ) {
    savePlan(
      id: $id
      titleEn: $titleEn
      titleMn: $titleMn
      region: $region
      area: $area
      season: $season
      minGroup: $minGroup
      maxGroup: $maxGroup
      difficulty: $difficulty
      vehicle: $vehicle
      sleeping: $sleeping
      lodging: $lodging
      summary: $summary
      summaryMn: $summaryMn
      priceUsd: $priceUsd
      groupPriceUsd: $groupPriceUsd
      groupPriceFrom: $groupPriceFrom
      singleSupplement: $singleSupplement
      included: $included
      excluded: $excluded
      photos: $photos
      freeCancelDays: $freeCancelDays
      totalKm: $totalKm
      unpavedPct: $unpavedPct
      dayItems: $dayItems
      claims: $claims
      departures: $departures
    ) {
      success
      message
      plan {
        ...PlanFields
        ...PlanCheckFields
      }
    }
  }
  ${PLAN_FIELDS}
  ${CHECK_FIELDS}
`;

export const SUBMIT_PLAN_MUTATION = gql`
  mutation SubmitPlan($id: ID!) {
    submitPlan(id: $id) {
      success
      message
      plan {
        id
        status
        reviewNote
      }
    }
  }
`;

// —— staff ——

export const REVIEW_QUEUE_QUERY = gql`
  query ReviewQueue {
    reviewQueue {
      success
      message
      plans {
        ...PlanCardFields
        reviewNote
        submittedAt
        ...PlanCheckFields
      }
    }
  }
  ${PLAN_CARD_FIELDS}
  ${CHECK_FIELDS}
`;

export const APPROVE_PLAN_MUTATION = gql`
  mutation ApprovePlan($id: ID!) {
    approvePlan(id: $id) {
      success
      message
    }
  }
`;

export const REQUEST_FIXES_MUTATION = gql`
  mutation RequestPlanFixes($id: ID!, $note: String) {
    requestPlanFixes(id: $id, note: $note) {
      success
      message
    }
  }
`;
