"use client";

import { ArrowRight, Car, Footprints, House, Languages, ShowerHead, Toilet } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Photo } from "@/components/app/ui";
import { useLocale, useT } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/dictionaries";
import type { Plan } from "@/lib/types";

/**
 * What a traveller can insist on: each is one of the search page's filters (`param`) with the test the API
 * runs for it in PlanController.getPlans, so the count here matches the results page it links to.
 */
const COMFORT = [
  { key: "shower", label: "search.db.shower", Icon: ShowerHead, param: ["db", "shower"], fits: (p: Plan) => p.showerNights === p.nightCount },
  { key: "flush", label: "search.db.flush", Icon: Toilet, param: ["db", "flush"], fits: (p: Plan) => p.flushNights === p.nightCount },
  { key: "drive", label: "search.db.drive", Icon: Car, param: ["db", "drive"], fits: (p: Plan) => p.maxDrive <= 5 },
  {
    key: "english",
    label: "search.db.english",
    Icon: Languages,
    param: ["db", "english"],
    fits: (p: Plan) => (p.operator.languages ?? []).some((l) => l.startsWith("English")),
  },
  { key: "herder", label: "home.comfortHerder", Icon: House, param: ["sleep", "Herder family ger"], fits: (p: Plan) => p.lodging.includes("Herder family ger") },
  { key: "easy", label: "home.comfortEasy", Icon: Footprints, param: ["diff", "easy"], fits: (p: Plan) => p.difficulty === "EASY" || p.difficulty === "EASY_MODERATE" },
] as const;

/** Toggle the comfort promises you need; the count of trips that keep all of them updates as you go. */
export function ComfortPicker({ plans }: { plans: Plan[] }) {
  const t = useT();
  const [picked, setPicked] = useState<string[]>([]);
  const chosen = COMFORT.filter((option) => picked.includes(option.key));
  const fit = plans.filter((plan) => chosen.every((option) => option.fits(plan)));
  const href = `/search?${new URLSearchParams(chosen.map((option) => [...option.param]))}`;
  const toggle = (key: string) => setPicked((list) => (list.includes(key) ? list.filter((item) => item !== key) : [...list, key]));

  return (
    <div className="comfort reveal">
      <div className="comfort-opts">
        {COMFORT.map(({ key, label, Icon }) => (
          <button key={key} type="button" className="opt" aria-pressed={picked.includes(key)} onClick={() => toggle(key)}>
            <span className="ico">
              <Icon size={20} />
            </span>
            {t(label)}
          </button>
        ))}
      </div>
      <div className="comfort-result" aria-live="polite">
        <div className="comfort-num">{fit.length}</div>
        <div>{t("home.comfortFit", { total: plans.length })}</div>
        <div className="stack">
          {fit
            .filter((plan) => plan.photos[0])
            .slice(0, 5)
            .map((plan) => (
              <Photo key={plan.id} src={plan.photos[0]} alt={plan.region} />
            ))}
        </div>
        {fit.length ? (
          <Link href={href} className="btn btn-cta mt-auto" style={{ alignSelf: "flex-start" }}>
            {t("home.comfortShow")} <ArrowRight size={16} />
          </Link>
        ) : (
          <p className="mt-auto">{t("home.comfortNone")}</p>
        )}
      </div>
    </div>
  );
}

const season = (month: number) => (month >= 6 && month <= 8 ? "peak" : month === 5 || month === 9 || month === 10 ? "shoulder" : "winter");
/** Each season's colour class, spelled out: Tailwind's class scan only keeps CSS for names it finds in the source. */
const SEASON_CLASS = { peak: "season-peak", shoulder: "season-shoulder", winter: "season-winter" };
const monthName = (month: number, locale: Locale) =>
  locale === "mn" ? `${month}-р сар` : new Date(Date.UTC(2000, month - 1, 1)).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });

/** The next twelve months: what each is like, and how many departures still have seats. Each opens that month's search. */
export function SeasonStrip({ plans }: { plans: Plan[] }) {
  const t = useT();
  const { locale } = useLocale();
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, i) => {
    const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1));
    const key = first.toISOString().slice(0, 7);
    const departures = plans.reduce((sum, plan) => sum + plan.departures.filter((d) => d.startDate.startsWith(key) && (d.left ?? 0) > 0).length, 0);
    return { key, month: first.getUTCMonth() + 1, year: first.getUTCFullYear(), departures };
  });
  const most = Math.max(1, ...months.map((m) => m.departures));

  return (
    <div className="months reveal">
      {months.map(({ key, month, year, departures }) => (
        <Link key={key} href={`/search?month=${key}`} className={`month ${SEASON_CLASS[season(month)]}`}>
          <div className="row-base" style={{ justifyContent: "space-between" }}>
            <span className="heading" style={{ fontSize: 19 }}>
              {monthName(month, locale)}
            </span>
            <span className="xs muted">{year}</span>
          </div>
          <div className="month-bar" aria-hidden>
            <i style={{ height: `${(departures / most) * 100}%` }} />
          </div>
          <div className="small bold">{departures === 0 ? t("home.dep0") : departures === 1 ? t("home.dep1") : t("home.depN", { n: departures })}</div>
          <div className="xs" style={{ color: "var(--ink-70)", lineHeight: 1.45 }}>
            {t(`home.monthNotes.m${month}`)}
          </div>
          <span className="season-tag">{t(`home.season.${season(month)}`)}</span>
        </Link>
      ))}
    </div>
  );
}
