import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Locale } from "@/lib/i18n/dictionaries";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

// ponytail: one fixed USD→MNT rate, the same default as the API's MNT_PER_USD; read siteInfo.mntPerUsd the day it moves
export const MNT_PER_USD = 3500;

export const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
export const mnt = (usdAmount: number) => `₮${Math.round(usdAmount * MNT_PER_USD).toLocaleString("en-US")}`;

/** ₮148m / ₮2.1bn, for dashboard tiles where the exact number is noise. */
export const mntShort = (usdAmount: number) => {
  const value = usdAmount * MNT_PER_USD;
  if (value >= 1e9) return `₮${(value / 1e9).toFixed(1)}bn`;
  if (value >= 1e6) return `₮${Math.round(value / 1e6)}m`;
  return `₮${Math.round(value).toLocaleString("en-US")}`;
};

/** A YYYY-MM-DD (or ISO) date as midnight UTC, so a departure day never shifts with the viewer's zone. */
const asDate = (value: string | Date) => (value instanceof Date ? value : new Date(value.length === 10 ? `${value}T00:00:00Z` : value));

export const addDays = (value: string | Date, n: number) => new Date(asDate(value).getTime() + n * 86400000);

/** 12 Jul 2027 · 2027.07.12 */
export const day = (value: string | Date, locale: Locale, withYear = true) => {
  const d = asDate(value);
  if (locale === "mn") {
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return withYear ? `${d.getUTCFullYear()}.${mm}.${dd}` : `${mm}.${dd}`;
  }
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(withYear && { year: "numeric" }), timeZone: "UTC" });
};

/** 12 – 19 Jul 2027 */
export const dayRange = (start: string, days: number, locale: Locale) => `${day(start, locale, false)} – ${day(addDays(start, days - 1), locale)}`;

export const monthYear = (month: string, locale: Locale) => {
  const d = asDate(`${month}-01`);
  return locale === "mn"
    ? `${d.getUTCFullYear()} оны ${d.getUTCMonth() + 1}-р сар`
    : d.toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
};

/** Bilingual content: the Mongolian text when it is chosen and written, the English otherwise. */
export const pick = (locale: Locale, en: string, mn?: string | null) => (locale === "mn" && mn ? mn : en);

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

/** The score badge's colour: sage when trips match their promises, clay when they don't, grey when unrated. */
export const scoreTone = (score: number | null | undefined) => {
  if (score == null) return "var(--color-neutral-500)";
  if (score >= 90) return "var(--color-accent-2-600)";
  if (score >= 80) return "var(--color-accent-2-500)";
  return "var(--color-cta-700)";
};
