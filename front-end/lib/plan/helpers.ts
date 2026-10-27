import type { Area, Claim, Departure, Plan } from "@/lib/types";

/** The regions, west to east the way the landing's map reads; labels in operatorPage.area / regions.*. */
export const AREAS: Area[] = ["WEST", "NORTH", "CENTRAL", "GOBI", "EAST"];

/** Sleeping types stored on a plan (English, as the search filter matches them) and their dictionary keys. */
export const LODGING = [
  { value: "Tourist ger camp", key: "lodging.camp" },
  { value: "Herder family ger", key: "lodging.herder" },
  { value: "Tent", key: "lodging.tent" },
  { value: "Hotel in town", key: "lodging.hotel" },
] as const;
export const lodgingKey = (value: string) => LODGING.find((item) => item.value === value)?.key;

export const prosOf = <T extends Pick<Claim, "kind">>(plan: { claims: T[] }) => plan.claims.filter((claim) => claim.kind === "PRO");
export const consOf = <T extends Pick<Claim, "kind">>(plan: { claims: T[] }) => plan.claims.filter((claim) => claim.kind === "CON");

/** The first departure still ahead with a seat (`departures` are upcoming only, oldest first). */
export const nextDeparture = (plan: Pick<Plan, "departures">) => plan.departures.find((d) => (d.left ?? 0) > 0) ?? null;

/** The departure a search was about: the month asked for, with room for the group. */
export const departureFor = (plan: Pick<Plan, "departures">, pax: number, month?: string) =>
  plan.departures.find((d) => (d.left ?? 0) >= pax && (!month || d.startDate.startsWith(month))) ?? null;

export const seatsLeftKey = (left: number) => (left === 1 ? "plan.seatLeft" : "plan.seatsLeft");

export type CardPlan = Pick<
  Plan,
  | "id"
  | "slug"
  | "titleEn"
  | "titleMn"
  | "region"
  | "days"
  | "maxGroup"
  | "difficulty"
  | "vehicle"
  | "photos"
  | "priceUsd"
  | "score"
  | "stars"
  | "reviewCount"
  | "ratingCount"
  | "maxDrive"
  | "showerNights"
  | "flushNights"
  | "nightCount"
  | "operator"
> & { claims: Pick<Claim, "id" | "kind" | "text">[]; departures: Departure[] };
