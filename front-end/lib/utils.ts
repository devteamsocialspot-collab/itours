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

/** Today as YYYY-MM-DD in Ulaanbaatar, to compare with the API's day strings (the API's todayUb). */
export const todayUb = () => new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);

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

const UB = "Asia/Ulaanbaatar";
const UB_PARTS = new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: UB });
const UB_EN = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: UB });

/** An instant in Ulaanbaatar time, whatever the viewer's clock says: Thu 21 Nov, 14:30 · 2026.11.21 14:30 */
export const dateTime = (iso: string, locale: Locale) => {
  const d = new Date(iso);
  if (locale !== "mn") return UB_EN.format(d);
  const p = Object.fromEntries(UB_PARTS.formatToParts(d).map((part) => [part.type, part.value]));
  return `${p.year}.${p.month}.${p.day} ${p.hour}:${p.minute}`;
};

/** Hours and minutes until `iso`, minutes rounded up so "0 min" never shows while time remains. */
export const timeLeft = (iso: string, now: number) => {
  const ms = Date.parse(iso) - now;
  const minutes = Math.max(0, Math.ceil(ms / 60000));
  return { h: Math.floor(minutes / 60), m: minutes % 60, over: ms <= 0 };
};

/** "4 h 10 min left" / "10 min left", with `t` from useT(). */
export const leftText = (t: (key: string, vars?: Record<string, string | number>) => string, iso: string, now: number) => {
  const { h, m } = timeLeft(iso, now);
  return t(h ? "common.hmLeft" : "common.mLeft", { h, m });
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

/** The same rule as a tag: green from 80, gold (warning) below, grey while unrated. */
export const scoreTag = (score: number | null | undefined) => (score == null ? "tag-neutral" : score >= 80 ? "tag-accent-2" : "tag-accent");
