"use client";

import { CircleAlert, Check, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { useState, type KeyboardEvent } from "react";
import { BookingWidget } from "@/components/app/plan/booking-widget";
import { Lightbox } from "@/components/app/plan/lightbox";
import { RouteMap } from "@/components/app/plan/route-map";
import { ReviewCard } from "@/components/app/review-card";
import { SaveButton } from "@/components/app/save-button";
import { Footer, SiteHeader } from "@/components/app/site-header";
import { Bar, Photo, Score } from "@/components/app/ui";
import { useLocale, useT } from "@/lib/i18n";
import { consOf, nextDeparture, prosOf, seatsLeftKey } from "@/lib/plan/helpers";
import type { Plan, PlanDay, Review } from "@/lib/types";
import { day, initials, pick } from "@/lib/utils";

type T = ReturnType<typeof useT>;

function DayRow({ d, t }: { d: PlanDay; t: T }) {
  return (
    <div className="day">
      <div className="day-n">{t("plan.dayN", { n: d.dayNo })}</div>
      <div>
        <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 4 }}>{d.title}</div>
        <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--ink-70)" }}>{d.description}</div>
      </div>
      <div className="day-facts">
        <div>🛏 {d.sleeping}</div>
        <div>🍽 {d.meals}</div>
        <div>🚐 {d.driveHours ? t("plan.hDrive", { h: d.driveHours }) : t("plan.noTransfer")}</div>
        <div>
          {[d.hotShower ? t("plan.hotShower") : t("plan.noShower"), d.flushToilet ? t("plan.flushToilet") : t("plan.longDrop"), !d.signal && t("plan.noSignal")]
            .filter(Boolean)
            .join(" · ")}
        </div>
      </div>
    </div>
  );
}

/** The plan page (wireframe 1c): the honest summary, promises with how often they held, route, days, reviews. */
export function PlanPageView({ plan, reviews, initialDep, initialPax }: { plan: Plan; reviews: Review[]; initialDep?: string; initialPax?: number }) {
  const t = useT();
  const { locale } = useLocale();
  const stats = plan.operator.stats;
  const next = nextDeparture(plan);
  const pctOf = (n: number | null) => (n === null ? t("plan.notRatedYet") : t("plan.confirmedBy", { n }));
  // a gallery tile opens the photo viewer on itself, by click or Enter / Space
  const [viewing, setViewing] = useState<number | null>(null);
  const opens = (i: number) =>
    plan.photos[i]
      ? {
          role: "button",
          tabIndex: 0,
          "aria-label": t("plan.viewPhoto", { n: i + 1 }),
          onClick: () => setViewing(i),
          onKeyDown: (e: KeyboardEvent) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            setViewing(i);
          },
        }
      : {};

  // route strip: consecutive days in one place become one stop
  const stops: { place: string; from: number; to: number; drive: number | null }[] = [];
  for (const d of plan.dayItems) {
    const last = stops.at(-1);
    if (last && last.place === d.place && d.dayNo !== plan.days) last.to = d.dayNo;
    else stops.push({ place: d.place, from: d.dayNo, to: d.dayNo, drive: d.driveHours });
  }

  return (
    <>
      <SiteHeader
        actions={
          <div className="hide-m">
            <SaveButton planId={plan.id} />
          </div>
        }
      >
        <Link href={`/search?q=${encodeURIComponent(plan.region)}`} className="plain hide-m" style={{ fontSize: 13, marginLeft: 14 }}>
          ← {plan.region}
        </Link>
      </SiteHeader>
      {plan.status !== "PUBLISHED" && (
        <div className="error" style={{ borderRadius: 0, textAlign: "center" }}>
          {t("plan.previewBanner", { s: t(`partner.planStatus.${plan.status}`) })}
        </div>
      )}
      <main className="wrap">
        <div className="gallery">
          {[0, 1, 2, 3, 4].map((i) =>
            i === 4 && plan.photos.length > 5 ? (
              <Photo key={i} src={plan.photos[i]} alt="" {...opens(i)}>
                <div className="heading" style={{ position: "absolute", inset: 0, background: "rgba(34, 40, 49,.5)", display: "grid", placeItems: "center", color: "#f7f4ef", fontSize: 15 }}>
                  {t("plan.morePhotos", { n: plan.photos.length - 5 })}
                </div>
              </Photo>
            ) : (
              <Photo key={i} src={plan.photos[i]} alt={i ? "" : plan.region} {...opens(i)} />
            ),
          )}
        </div>
        <Lightbox photos={plan.photos} index={viewing} onIndex={setViewing} title={pick(locale, plan.titleEn, plan.titleMn)} />

        <div className="detail">
          <div style={{ minWidth: 0 }}>
            <div className="wrap-row" style={{ gap: 8, marginBottom: 12 }}>
              <span className="tag tag-accent">{plan.region}</span>
              <span className="tag tag-neutral">{plan.season}</span>
              <span className="tag tag-accent-2">{t(`plan.difficulty.${plan.difficulty}`)}</span>
            </div>
            <h1 style={{ fontSize: 40, lineHeight: 1.06, margin: "0 0 14px", maxWidth: "22em" }}>{pick(locale, plan.titleEn, plan.titleMn)}</h1>

            <div className="op-strip">
              <div className="avatar" style={{ width: 44, height: 44, background: plan.operator.color, fontSize: 15 }}>
                {initials(plan.operator.name)}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{plan.operator.name}</div>
                <div className="small" style={{ color: "var(--ink-60)" }}>
                  {[
                    plan.operator.foundedYear && t("plan.licensedSince", { y: plan.operator.foundedYear }),
                    t("plan.tripsSold", { n: stats?.tripsSold ?? 0 }),
                    t("plan.repliesIn", { h: plan.operator.replyHours }),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </div>
              <div className="row ml-auto" style={{ gap: 22, flexWrap: "wrap" }}>
                {stats?.stars != null && (
                  <div className="right">
                    <div className="heading" style={{ fontSize: 18, lineHeight: 1 }}>
                      {stats.stars.toFixed(1)}
                    </div>
                    <div className="xs muted">{t("plan.reviews", { n: stats.reviewCount })}</div>
                  </div>
                )}
                <div className="row">
                  <Score value={plan.score} size={46} />
                  <div className="score-label" style={{ maxWidth: 70 }}>
                    {t("plan.expectationScore")}
                  </div>
                </div>
                <Link href={`/operators/${plan.operator.slug}`} className="btn btn-secondary btn-sm">
                  {t("plan.operatorLink")}
                </Link>
              </div>
            </div>

            <div className="grid-4 keep-m" style={{ gap: 10, marginBottom: 30 }}>
              <div className="tile">
                <div className="tile-label">{t("plan.duration")}</div>
                <div className="tile-value">{t("plan.daysNights", { d: plan.days, n: plan.days - 1 })}</div>
              </div>
              <div className="tile">
                <div className="tile-label">{t("plan.group")}</div>
                <div className="tile-value">{t("plan.groupRange", { a: plan.minGroup, b: plan.maxGroup })}</div>
              </div>
              <div className="tile">
                <div className="tile-label">{t("plan.vehicle")}</div>
                <div className="tile-value">{plan.vehicle}</div>
              </div>
              <div className="tile">
                <div className="tile-label">{t("plan.sleeping")}</div>
                <div className="tile-value">{plan.sleeping}</div>
              </div>
            </div>

            <h3 style={{ marginBottom: 6 }}>{t("plan.honestSummary")}</h3>
            <p style={{ fontSize: 15, lineHeight: 1.65, color: "var(--ink-80)", maxWidth: "44em", margin: "0 0 26px" }}>{pick(locale, plan.summary, plan.summaryMn)}</p>

            <h3>{t("plan.lovedAndBrace")}</h3>
            <div className="grid-2" style={{ marginBottom: 12 }}>
              <div className="panel-sage">
                <div className="row" style={{ gap: 8, marginBottom: 12 }}>
                  <span className="score" style={{ width: 26, height: 26, background: "var(--color-accent-2-600)", color: "#eaeee9" }}>
                    <Check size={14} strokeWidth={3} />
                  </span>
                  <span className="heading" style={{ fontSize: 16 }}>
                    {t("plan.pros")}
                  </span>
                </div>
                <div className="claims">
                  {prosOf(plan).map((c) => (
                    <div key={c.id}>
                      <div className="bold">{c.text}</div>
                      <div className="sub">
                        {c.detail ? `${c.detail} — ` : ""}
                        {pctOf(c.score)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="panel-clay">
                <div className="row" style={{ gap: 8, marginBottom: 12 }}>
                  <span className="score" style={{ width: 26, height: 26, background: "var(--color-cta-700)", color: "#ffffff" }}>
                    <CircleAlert size={14} strokeWidth={2.75} />
                  </span>
                  <span className="heading" style={{ fontSize: 16 }}>
                    {t("plan.consStated")}
                  </span>
                </div>
                <div className="claims">
                  {consOf(plan).map((c) => (
                    <div key={c.id}>
                      <div className="bold">{c.text}</div>
                      <div className="sub">{c.detail || pctOf(c.score)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="row small muted" style={{ marginBottom: 30 }}>
              <ShieldCheck size={14} strokeWidth={2.75} />
              {t("plan.scoreExplain")}
            </div>

            <h3>{t("plan.route")}</h3>
            <div className="panel" style={{ padding: "22px 24px", marginBottom: 30 }}>
              <RouteMap days={plan.dayItems} />
              <div className="route">
                {stops.map((s, i) => (
                  <div key={i} className="stop">
                    <i />
                    <b>{s.place}</b>
                    <small>
                      {t("plan.dayN", { n: s.from === s.to ? s.from : `${s.from}–${s.to}` })}
                      {" · "}
                      {i === 0 ? t("plan.start") : s.drive ? t("plan.hDrive", { h: s.drive }) : t("plan.noTransfer")}
                    </small>
                  </div>
                ))}
              </div>
              <div
                className="row"
                style={{ gap: 16, marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--color-divider)", fontSize: 12.5, color: "var(--ink-70)", flexWrap: "wrap" }}
              >
                {plan.totalKm != null && <strong>{t("plan.kmTotal", { n: plan.totalKm.toLocaleString("en-US") })}</strong>}
                <strong>{t("plan.hVehicle", { n: plan.driveTotal })}</strong>
                {plan.unpavedPct != null && <strong>{t("plan.unpaved", { n: plan.unpavedPct })}</strong>}
              </div>
            </div>

            <h3>{t("plan.dayByDay")}</h3>
            <div className="col" style={{ gap: 10, marginBottom: 30 }}>
              {plan.dayItems.slice(0, 3).map((d) => (
                <DayRow key={d.dayNo} d={d} t={t} />
              ))}
              {plan.dayItems.length > 3 && (
                <details className="more col" style={{ gap: 10 }}>
                  <summary className="btn btn-secondary btn-block" style={{ fontSize: 13.5 }}>
                    {t("plan.showAllDays", { n: plan.days })}
                  </summary>
                  <div className="col" style={{ gap: 10 }}>
                    {plan.dayItems.slice(3).map((d) => (
                      <DayRow key={d.dayNo} d={d} t={t} />
                    ))}
                  </div>
                </details>
              )}
            </div>

            <div className="grid-2" style={{ marginBottom: 30 }}>
              <div>
                <h4 style={{ margin: "0 0 10px" }}>{t("plan.included")}</h4>
                <div className="col" style={{ gap: 7, fontSize: 13.5, lineHeight: 1.45 }}>
                  {plan.included.map((item) => (
                    <div key={item} className="row" style={{ alignItems: "flex-start", gap: 8, color: "var(--color-accent-2-700)" }}>
                      <Check size={14} strokeWidth={3} style={{ marginTop: 2, flex: "none" }} />
                      <span style={{ color: "var(--color-text)" }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 style={{ margin: "0 0 10px" }}>{t("plan.notIncluded")}</h4>
                <div className="col" style={{ gap: 7, fontSize: 13.5, lineHeight: 1.45 }}>
                  {plan.excluded.map((item) => (
                    <div key={item} className="row" style={{ alignItems: "flex-start", gap: 8, color: "var(--color-cta-800)" }}>
                      <X size={14} strokeWidth={2.75} style={{ marginTop: 2, flex: "none" }} />
                      <span style={{ color: "var(--ink-75)" }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <h3>{t("plan.reviewsTitle")}</h3>
            {reviews.length === 0 && <p className="muted">{t("plan.noReviews")}</p>}
            <div className="grid-2" style={{ gap: 14 }}>
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          </div>

          <aside className="sticky">
            <BookingWidget plan={plan} initialDep={initialDep} initialPax={initialPax} />
            <div className="panel-sage" style={{ borderRadius: 26 }}>
              <div className="heading" style={{ fontSize: 15, marginBottom: 10 }}>
                {t("plan.expectationScore")} {plan.score ?? "–"}
              </div>
              <div className="col" style={{ gap: 9, fontSize: 12 }}>
                {plan.areas
                  .filter((a) => a.score !== null)
                  .map((a) => (
                    <div key={a.area}>
                      <div className="row" style={{ justifyContent: "space-between", marginBottom: 3 }}>
                        <span>{t(`plan.area.${a.area}`)}</span>
                        <span>{a.score}</span>
                      </div>
                      <Bar value={a.score!} warn={a.score! < 90} />
                    </div>
                  ))}
                {plan.score === null && <div>{t("plan.noScore")}</div>}
              </div>
            </div>
          </aside>
        </div>
      </main>
      {next && (
        <div className="mobile-bookbar">
          <div>
            <div className="heading" style={{ fontSize: 19, lineHeight: 1 }}>
              ${plan.priceUsd.toLocaleString("en-US")}
            </div>
            <div className="xs muted">
              {t(seatsLeftKey(next.left ?? 0), { n: next.left ?? 0 })}, {day(next.startDate, locale, false)}
            </div>
          </div>
          <a href="#book" className="btn btn-cta ml-auto" style={{ fontSize: 14, padding: "10px 20px" }}>
            {t("plan.bookSeatsShort")}
          </a>
        </div>
      )}
      <Footer />
    </>
  );
}
