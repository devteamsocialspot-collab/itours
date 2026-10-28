/** Hand-written mirrors of the GraphQL shapes. Keep in sync with back-end/src/graphql/schemas. */
export type Role = "SUPER_ADMIN" | "MANAGER" | "OPERATOR" | "USER";
/** Roles allowed into the admin portal; the Staff screen gives only these. */
export const STAFF_ROLES: Role[] = ["SUPER_ADMIN", "MANAGER"];

/** Where an account lands after signing in: staff in admin, agencies in the partner area, travellers home. */
export const homeFor = (role?: Role | null) =>
  role && STAFF_ROLES.includes(role) ? "/admin/review" : role === "OPERATOR" ? "/partner" : null;

export type Envelope = { success: boolean; message: string };

export type User = {
  id: string;
  phone: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  country: string;
  operator?: Pick<Operator, "id" | "slug" | "name" | "isVerified" | "color"> | null;
  createdAt?: string | null;
};

export type Area = "GOBI" | "NORTH" | "WEST" | "CENTRAL" | "EAST";
export type Difficulty = "EASY" | "EASY_MODERATE" | "MODERATE" | "HARD";
export type PlanStatus = "DRAFT" | "PENDING" | "NEEDS_FIXES" | "PUBLISHED";
export type ClaimKind = "PRO" | "CON";
export type ClaimArea = "ITINERARY" | "LODGING" | "GUIDE" | "COMFORT";
export type AreaScore = { area: ClaimArea; score: number | null };

export type OperatorStats = {
  score: number | null;
  areas: AreaScore[];
  stars: number | null;
  reviewCount: number;
  plansLive: number;
  tripsSold: number;
  cancelRate: number;
};

export type Operator = {
  id: string;
  slug: string;
  name: string;
  licenceNo: string;
  city: string;
  foundedYear: number | null;
  about: string;
  languages: string[];
  fleet: string;
  isVerified: boolean;
  replyHours: number;
  color: string;
  coverUrl: string;
  stats?: OperatorStats | null;
  /** Staff list only: HEALTHY, SLOW_REPLIES, REVIEW_NEEDED or UNVERIFIED. */
  health?: string | null;
};

export type PlanDay = {
  dayNo: number;
  place: string;
  title: string;
  description: string;
  driveHours: number | null;
  sleeping: string;
  meals: string;
  hotShower: boolean;
  signal: boolean;
  flushToilet: boolean;
};

export type Claim = {
  id: string;
  kind: ClaimKind;
  area: ClaimArea;
  text: string;
  detail: string;
  sort: number;
  score: number | null;
  ratingCount: number;
};

export type Departure = { id: string; startDate: string; seats: number; left: number | null };
export type PlanCheck = { key: string; label: string; ok: boolean; required: boolean };

export type Plan = {
  id: string;
  slug: string;
  titleEn: string;
  titleMn: string;
  region: string;
  area: Area;
  season: string;
  days: number;
  minGroup: number;
  maxGroup: number;
  difficulty: Difficulty;
  vehicle: string;
  sleeping: string;
  lodging: string[];
  summary: string;
  summaryMn: string;
  priceUsd: number;
  groupPriceUsd: number | null;
  groupPriceFrom: number | null;
  singleSupplement: number | null;
  included: string[];
  excluded: string[];
  photos: string[];
  freeCancelDays: number;
  totalKm: number | null;
  unpavedPct: number | null;
  status: PlanStatus;
  reviewNote: string;
  submittedAt: string | null;
  views: number;
  updatedAt?: string | null;
  operator: Operator;
  dayItems: PlanDay[];
  claims: Claim[];
  departures: Departure[];
  score: number | null;
  areas: AreaScore[];
  ratingCount: number;
  reviewCount: number;
  stars: number | null;
  maxDrive: number;
  driveTotal: number;
  showerNights: number;
  flushNights: number;
  nightCount: number;
  checks?: PlanCheck[];
  canSubmit?: boolean;
};

export type PlanFacet = { slug: string; name: string; count: number };

export type PayMethod = "CARD" | "QPAY" | "BANK";
export type Room = "TWIN" | "SINGLE";
export type BookingStatus = "PENDING_PAYMENT" | "PAID" | "CONFIRMED" | "CANCELLED";
export type BookingStage = BookingStatus | "TRAVELLING" | "COMPLETED";
export type OrderTab = "ACTION" | "CONFIRMED" | "TRAVELLING" | "COMPLETED" | "CANCELLED";

export type Booking = {
  id: string;
  code: string;
  pax: number;
  room: Room;
  totalUsd: number;
  method: PayMethod;
  status: BookingStatus;
  notes: string;
  guide: string;
  driver: string;
  cancelledBy: Role | null;
  createdAt: string;
  stage: BookingStage;
  lastDay: string;
  freeCancelUntil: string;
  payoutUsd: number;
  payoutDate: string;
  canCancel: boolean;
  canReview: boolean;
  hasReview: boolean;
  plan: Pick<Plan, "id" | "slug" | "titleEn" | "titleMn" | "region" | "days" | "photos" | "score" | "freeCancelDays"> & {
    claims?: Pick<Claim, "id" | "kind" | "text">[];
    operator: Pick<Operator, "id" | "name" | "slug" | "replyHours">;
  };
  departure: Pick<Departure, "id" | "startDate">;
  traveller?: Pick<User, "id" | "name" | "email" | "phone" | "country"> | null;
};

export type Review = {
  id: string;
  stars: number;
  text: string;
  travellerName: string | null;
  country: string | null;
  travelledAt: string | null;
  gaps: number;
};

/** A review on a dashboard: which plan, and which agency for staff. */
export type DashboardReview = Review & {
  plan: Pick<Plan, "id" | "slug" | "titleEn" | "titleMn"> & { operator: Pick<Operator, "id" | "name"> };
};

export type ExpectationGap = {
  planId: string;
  planTitle: string;
  claimId: string;
  claimText: string;
  score: number;
  misses: number;
  total: number;
  current: number;
  ifFixed: number;
};

export type PartnerDashboard = {
  bookings: number;
  bookingsDelta: number;
  seatsSold: number;
  fillRate: number;
  revenueUsd: number;
  revenueDelta: number | null;
  payoutPercent: number;
  score: number | null;
  scoreDelta: number;
  topPercent: number;
  replyHours: number;
  fastReplies: boolean;
  weeks: { start: string; seats: number }[];
  gap: ExpectationGap | null;
  nextDepartures: { id: string; startDate: string; planTitle: string; seats: number; sold: number; missing: number; state: string }[];
  planPerformance: { id: string; title: string; views: number; conversion: number; score: number | null }[];
};
