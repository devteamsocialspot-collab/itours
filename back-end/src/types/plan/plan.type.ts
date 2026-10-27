import { TPagination } from '../common.type';

/** The part of the country a plan runs in; the operator profile filters by it. */
export enum AREA {
  GOBI = 'GOBI',
  NORTH = 'NORTH',
  WEST = 'WEST',
  CENTRAL = 'CENTRAL',
  EAST = 'EAST'
}

export enum DIFFICULTY {
  EASY = 'EASY',
  EASY_MODERATE = 'EASY_MODERATE',
  MODERATE = 'MODERATE',
  HARD = 'HARD'
}

/** DRAFT → PENDING (submitted) → PUBLISHED, or NEEDS_FIXES back to the operator. */
export enum PLAN_STATUS {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  NEEDS_FIXES = 'NEEDS_FIXES',
  PUBLISHED = 'PUBLISHED'
}

export enum CLAIM_KIND {
  PRO = 'PRO',
  CON = 'CON'
}

/** Which part of the trip a promise is about; drives the score breakdown. */
export enum CLAIM_AREA {
  ITINERARY = 'ITINERARY',
  LODGING = 'LODGING',
  GUIDE = 'GUIDE',
  COMFORT = 'COMFORT'
}

export type TPlan = {
  id: string;
  operatorId: string;
  slug: string;
  titleEn: string;
  /** '' until the operator writes one; the Mongolian site then shows the English title. */
  titleMn: string;
  region: string;
  area: AREA;
  season: string;
  /** Kept equal to the number of PlanDays by savePlan. */
  days: number;
  minGroup: number;
  maxGroup: number;
  difficulty: DIFFICULTY;
  vehicle: string;
  /** One line ("Ger camps + 1 herder ger"); the per-night detail is on the days. */
  sleeping: string;
  /** Sleeping types for the search filter ("Tourist ger camp", "Tent"…). */
  lodging: string[];
  summary: string;
  summaryMn: string;
  priceUsd: number;
  /** Per-person price once a booking has groupPriceFrom travellers or more. */
  groupPriceUsd: number | null;
  groupPriceFrom: number | null;
  /** Per traveller, when they take a single room. */
  singleSupplement: number | null;
  included: string[];
  excluded: string[];
  /** The first one is the cover. */
  photos: string[];
  /** Free cancellation until this many days before departure. */
  freeCancelDays: number;
  totalKm: number | null;
  unpavedPct: number | null;
  status: PLAN_STATUS;
  /** What staff asked to fix; cleared on the next submit. */
  reviewNote: string;
  submittedAt: Date | null;
  views: number;

  createdAt: Date;
  updatedAt: Date;
};

export type TPlanDay = {
  id: string;
  planId: string;
  dayNo: number;
  /** The route stop; consecutive days at one place become one stop on the route strip. */
  place: string;
  title: string;
  description: string;
  /** Null = not filled in yet, which blocks submitting. */
  driveHours: number | null;
  sleeping: string;
  meals: string;
  hotShower: boolean;
  signal: boolean;
  flushToilet: boolean;
};

/** A pro or a con the operator states. Travellers rate each one after the trip. */
export type TClaim = {
  id: string;
  planId: string;
  kind: CLAIM_KIND;
  area: CLAIM_AREA;
  text: string;
  detail: string;
  sort: number;
};

export type TDeparture = {
  id: string;
  planId: string;
  /** YYYY-MM-DD, a date without a time. */
  startDate: string;
  seats: number;
};

export type TSavedPlan = {
  id: string;
  userId: string;
  planId: string;
};

/** One line of the publish checklist; `key` + `vars` are localized by the resolver. */
export type TPlanCheck = {
  key: string;
  vars?: Record<string, string | number>;
  ok: boolean;
  required: boolean;
};

/** The whole plan as the editor sends it: days are replaced, claims and departures matched by id. */
export type TPlanInput = { id: string } & Partial<
  Omit<
    TPlan,
    | 'id'
    | 'operatorId'
    | 'slug'
    | 'days'
    | 'status'
    | 'reviewNote'
    | 'submittedAt'
    | 'views'
    | 'createdAt'
    | 'updatedAt'
  >
> & {
    dayItems?: Omit<TPlanDay, 'id' | 'planId' | 'dayNo'>[];
    claims?: (Omit<TClaim, 'id' | 'planId' | 'sort'> & { id?: string })[];
    departures?: { id?: string; startDate: string; seats: number }[];
  };

/** The public search. Everything is optional; an empty search lists every published plan. */
export type TSearchPlans = TPagination &
  Partial<{
    search: string;
    /** One region: the landing's map and the search rail. */
    area: AREA;
    /** YYYY-MM: only plans with a departure that month (and seats for `pax`). */
    month: string;
    minDays: number;
    maxDays: number;
    pax: number;
    minScore: number;
    maxPrice: number;
    difficulty: DIFFICULTY[];
    lodging: string[];
    /** 'shower' | 'flush' | 'drive' | 'english' */
    dealBreakers: string[];
    /** Operator slugs. */
    operators: string[];
    /** 'best' (default) | 'score' | 'price' */
    sort: string;
  }>;
