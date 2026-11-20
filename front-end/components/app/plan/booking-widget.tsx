"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale, useT } from "@/lib/i18n";
import { seatsLeftKey } from "@/lib/plan/helpers";
import type { Plan, Room } from "@/lib/types";
import { addDays, day, dayRange, mnt, usd } from "@/lib/utils";

/** Per-person price for this many travellers: the group price once the group is big enough (as the API computes it). */
export const unitPrice = (plan: Pick<Plan, "priceUsd" | "groupPriceUsd" | "groupPriceFrom">, pax: number) =>
  plan.groupPriceUsd && plan.groupPriceFrom && pax >= plan.groupPriceFrom ? plan.groupPriceUsd : plan.priceUsd;

/** The sticky booking card (wireframe 1c): departure, travellers, room, a live total. The API prices it again on payment. */
export function BookingWidget({ plan, initialDep, initialPax }: { plan: Plan; initialDep?: string; initialPax?: number }) {
  const t = useT();
  const { locale } = useLocale();
  const open = plan.departures.filter((d) => (d.left ?? 0) > 0);
  const [dep, setDep] = useState(open.find((d) => d.id === initialDep)?.id ?? open[0]?.id);
  const [showAll, setShowAll] = useState(false);
  const left = open.find((d) => d.id === dep)?.left ?? 0;
  const [pax, setPax] = useState(Math.min(initialPax ?? 2, Math.max(left, 1), plan.maxGroup));
  const [room, setRoom] = useState<Room>("TWIN");

  const unit = unitPrice(plan, pax);
  const supplement = room === "SINGLE" ? (plan.singleSupplement ?? 0) * pax : 0;
  const total = unit * pax + supplement;
  const shown = showAll ? open : open.slice(0, 3);
  const departure = open.find((d) => d.id === dep);
  // "+" stops at the date's free seats or the group's size, and says so
  const most = Math.max(1, Math.min(left, plan.maxGroup));

  return (
    <div className="book-card" id="book">
      <div className="row" style={{ alignItems: "flex-end", gap: 8, marginBottom: 4 }}>
        <div className="heading" style={{ fontSize: 32, lineHeight: 1 }}>
          {usd(plan.priceUsd)}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--ink-60)", paddingBottom: 4 }}>{t("plan.perPerson")}</div>
      </div>
      <div className="small muted" style={{ marginBottom: 16 }}>
        {mnt(plan.priceUsd)}
        {plan.groupPriceUsd && plan.groupPriceFrom && ` · ${t("plan.groupDiscount", { p: usd(plan.groupPriceUsd), n: plan.groupPriceFrom })}`}
      </div>

      {open.length === 0 ? (
        <div className="panel-sand small">{t("plan.noDepartures")}</div>
      ) : (
        <>
          <fieldset className="field" style={{ marginBottom: 10 }}>
            <legend>{t("plan.departure")}</legend>
            <div className="col" style={{ gap: 7 }}>
              {shown.map((d) => (
                <label key={d.id} className="dep-opt">
                  <input
                    type="radio"
                    name="dep"
                    checked={dep === d.id}
                    onChange={() => {
                      setDep(d.id);
                      setPax((x) => Math.min(x, d.left ?? 1));
                    }}
                  />
                  <span>{dayRange(d.startDate, plan.days, locale)}</span>
                  <span className="ml-auto" style={{ fontSize: 11.5, fontWeight: 400, color: (d.left ?? 0) <= 4 ? "var(--color-cta-800)" : "var(--ink-55)" }}>
                    {t(seatsLeftKey(d.left ?? 0), { n: d.left ?? 0 })}
                  </span>
                </label>
              ))}
              {open.length > 3 && !showAll && (
                <button type="button" className="btn btn-ghost" style={{ fontSize: 12.5, alignSelf: "flex-start" }} onClick={() => setShowAll(true)}>
                  {t("plan.moreDates", { n: open.length - 3 })}
                </button>
              )}
            </div>
          </fieldset>

          <div className="row" style={{ marginBottom: 14, alignItems: "flex-start" }}>
            <div className="field grow">
              <label id="pax-label">{t("home.travellers")}</label>
              <div className="stepper" role="group" aria-labelledby="pax-label">
                <button type="button" className="btn btn-secondary btn-icon" disabled={pax <= 1} onClick={() => setPax((x) => Math.max(1, x - 1))} aria-label={t("book.fewer")}>
                  −
                </button>
                <output aria-live="polite" style={{ fontSize: 14, fontWeight: 600 }}>
                  {pax}
                </output>
                <button type="button" className="btn btn-secondary btn-icon" disabled={pax >= most} onClick={() => setPax((x) => Math.min(most, x + 1))} aria-label={t("book.more")}>
                  +
                </button>
              </div>
              {pax >= most && (
                <div className="xs muted" style={{ marginTop: 4 }}>
                  {t("plan.maxOnDate", { n: most })}
                </div>
              )}
            </div>
            <div className="field grow">
              <label htmlFor="room">{t("plan.room")}</label>
              <select id="room" className="input" value={room} onChange={(e) => setRoom(e.target.value as Room)}>
                <option value="TWIN">{t("plan.TWIN")}</option>
                {plan.singleSupplement !== null && <option value="SINGLE">{t("plan.single", { p: usd(plan.singleSupplement) })}</option>}
              </select>
            </div>
          </div>

          <div className="sum-lines">
            <div>
              <span style={{ color: "var(--ink-70)" }}>
                {usd(unit)} × {pax}
              </span>
              <span>{usd(unit * pax)}</span>
            </div>
            {supplement > 0 && (
              <div>
                <span style={{ color: "var(--ink-70)" }}>{t("plan.room")}</span>
                <span>{usd(supplement)}</span>
              </div>
            )}
            <div className="sum-total">
              <span>{t("plan.totalToday")}</span>
              <span>{usd(total)}</span>
            </div>
          </div>

          <Link
            href={`/checkout/${plan.slug}?dep=${dep}&pax=${pax}&room=${room}`}
            className="btn btn-cta btn-block"
            style={{ fontSize: 15, paddingBlock: 11, marginTop: 14 }}
          >
            {t("plan.bookSeats")}
          </Link>
          {departure && (
            <div style={{ fontSize: 11.5, lineHeight: 1.5, color: "var(--ink-60)", marginTop: 12, textAlign: "center" }}>
              {t("plan.cancelPolicy", { d: day(addDays(departure.startDate, -plan.freeCancelDays), locale) })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
