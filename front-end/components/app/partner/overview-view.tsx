"use client";

import { CircleAlert } from "lucide-react";
import Link from "next/link";
import { useLocale, useT } from "@/lib/i18n";
import type { PartnerDashboard, User } from "@/lib/types";
import { day, mntShort, usd } from "@/lib/utils";

export type Period = "7" | "30" | "season";

type Props = {
  user: User | null;
  dashboard: PartnerDashboard | null;
  loading: boolean;
  error?: string;
  needsAction: number;
  planCount: number;
  period: Period;
  onPeriod: (period: Period) => void;
};

/** The heavier the week, the deeper the copper. */
const tone = (n: number) => (n >= 0.95 ? "var(--color-accent)" : n >= 0.8 ? "var(--color-accent-500)" : n >= 0.6 ? "var(--color-accent-400)" : "var(--color-accent-300)");
const STATE_TAG: Record<string, string> = { FULL: "tag-accent-2", NEEDS_MORE: "tag-accent", GUIDE_ASSIGNED: "tag-accent-2", NO_GUIDE: "tag-neutral" };
const delta = (n: number) => `${n >= 0 ? "+" : ""}${n}`;

/** The agency's overview (wireframe 2a): bookings, revenue, score, the gap to fix, what departs next. */
export function OverviewView({ user, dashboard: d, loading, error, needsAction, planCount, period, onPeriod }: Props) {
  const t = useT();
  const { locale } = useLocale();
  const maxWeek = Math.max(1, ...(d?.weeks ?? []).map((w) => w.seats));

  return (
    <>
      <div className="row" style={{ alignItems: "flex-end", gap: 14, marginBottom: 22, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: "0 0 2px" }}>{t("partner.greeting", { name: (user?.name ?? "").split(" ")[0] })}</h2>
          <div style={{ fontSize: 13, color: "var(--ink-60)" }}>
            {day(new Date(), locale)} · {t("partner.needAttention", { n: needsAction })}
          </div>
        </div>
        <div className="row ml-auto">
          <div className="seg seg-mini">
            {(["7", "30", "season"] as const).map((p) => (
              <button key={p} type="button" className={`seg-opt ${period === p ? "on" : ""}`} onClick={() => onPeriod(p)}>
                {t(`partner.period.${p}`)}
              </button>
            ))}
          </div>
          <Link href="/partner/plans" className="btn btn-primary btn-sm">
            + {t("partner.newPlan")}
          </Link>
        </div>
      </div>
      {user?.operator && !user.operator.isVerified && (
        <p className="error" style={{ marginBottom: 16 }}>
          {t("partner.unverifiedNote")}
        </p>
      )}
      {error && <p className="error">{error}</p>}
      {!d ? (
        <p className="muted">{loading ? t("common.loading") : null}</p>
      ) : (
        <>
          <div className="grid-4 keep-m" style={{ marginBottom: 16 }}>
            <div className="stat">
              <div className="stat-label">{t("partner.confirmedBookings")}</div>
              <div className="row" style={{ alignItems: "flex-end", gap: 8 }}>
                <div className="stat-value">{d.bookings}</div>
                <span className={`tag ${d.bookingsDelta >= 0 ? "tag-accent-2" : "tag-accent"}`}>{delta(d.bookingsDelta)}</span>
              </div>
              <div className="stat-sub">{t("partner.seatsFill", { s: d.seatsSold, f: d.fillRate })}</div>
            </div>
            <div className="stat">
              <div className="stat-label">{t("partner.revenue")}</div>
              <div className="row" style={{ alignItems: "flex-end", gap: 8 }}>
                <div className="stat-value">{mntShort(d.revenueUsd)}</div>
                {d.revenueDelta != null && <span className={`tag ${d.revenueDelta >= 0 ? "tag-accent-2" : "tag-accent"}`}>{delta(d.revenueDelta)}%</span>}
              </div>
              <div className="stat-sub">
                {usd(d.revenueUsd)} · {t("partner.youReceive", { p: d.payoutPercent })}
              </div>
            </div>
            <div className="stat">
              <div className="stat-label">{t("plan.expectationScore")}</div>
              <div className="row" style={{ alignItems: "flex-end", gap: 8 }}>
                <div className="stat-value">{d.score ?? "–"}</div>
                {d.scoreDelta !== 0 && <span className={`tag ${d.scoreDelta > 0 ? "tag-accent-2" : "tag-accent"}`}>{delta(d.scoreDelta)}</span>}
              </div>
              <div className="stat-sub">{t("partner.topPct", { n: d.topPercent })}</div>
            </div>
            <div className="stat">
              <div className="stat-label">{t("partner.replyMedian")}</div>
              <div className="row" style={{ alignItems: "flex-end", gap: 8 }}>
                <div className="stat-value">{d.replyHours} h</div>
                <span className={`tag ${d.fastReplies ? "tag-accent-2" : "tag-accent"}`}>{d.fastReplies ? t("partner.good") : t("partner.slow")}</span>
              </div>
              <div className="stat-sub">{t("partner.badgeRule")}</div>
            </div>
          </div>

          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, marginBottom: 16 }}>
            <div className="panel">
              <div className="row-base" style={{ gap: 10, marginBottom: 22 }}>
                <div className="heading" style={{ fontSize: 16 }}>
                  {t("partner.seatsPerWeek")}
                </div>
                <span className="muted" style={{ fontSize: 11.5 }}>
                  {t("partner.last12")}
                </span>
              </div>
              <div className="chart">
                {d.weeks.map((week) => (
                  <div key={week.start} style={{ height: `${(week.seats / maxWeek) * 100}%`, background: tone(week.seats / maxWeek) }} title={`${day(week.start, locale)}: ${week.seats}`}>
                    <span>{week.seats || ""}</span>
                  </div>
                ))}
              </div>
              {d.weeks.length > 0 && (
                <div className="row xs muted" style={{ justifyContent: "space-between", marginTop: 8 }}>
                  <span>{day(d.weeks[0].start, locale, false)}</span>
                  <span>{day(d.weeks[d.weeks.length - 1].start, locale, false)}</span>
                </div>
              )}
            </div>

            {d.gap ? (
              <div className="panel-clay" style={{ borderRadius: 26 }}>
                <div className="row" style={{ gap: 8, marginBottom: 10 }}>
                  <CircleAlert size={16} strokeWidth={2.75} />
                  <div className="heading" style={{ fontSize: 16 }}>
                    {t("partner.gapTitle")}
                  </div>
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.6, opacity: 0.9, margin: "0 0 12px" }}>
                  {t("partner.gapText", { plan: d.gap.planTitle, m: d.gap.misses, total: d.gap.total, claim: d.gap.claimText })}
                </p>
                <div style={{ background: "rgba(255,255,255,.55)", borderRadius: 16, padding: "12px 14px", fontSize: 12.5, lineHeight: 1.55, marginBottom: 12 }}>
                  {t("partner.gapFix", { from: d.gap.current, to: d.gap.ifFixed })}
                </div>
                <Link href={`/partner/plans/${d.gap.planId}?tab=claims`} className="btn btn-primary btn-block btn-sm">
                  {t("partner.editPromise")}
                </Link>
              </div>
            ) : (
              <div className="panel-sage" style={{ borderRadius: 26 }}>
                <div className="heading" style={{ fontSize: 16, marginBottom: 8 }}>
                  {t("partner.noGaps")}
                </div>
                <p style={{ fontSize: 13, margin: 0 }}>{t("partner.noGapsText")}</p>
              </div>
            )}
          </div>

          <div className="grid-2">
            <div className="panel">
              <div className="row-base" style={{ marginBottom: 10 }}>
                <div className="heading" style={{ fontSize: 16 }}>
                  {t("partner.nextDepartures")}
                </div>
                <Link href="/partner/orders" className="btn btn-ghost btn-xs ml-auto">
                  {t("partner.manage")}
                </Link>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("partner.date")}</th>
                    <th>{t("partner.plan")}</th>
                    <th>{t("partner.seats")}</th>
                    <th>{t("partner.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {d.nextDepartures.map((dep) => (
                    <tr key={dep.id}>
                      <td className="nowrap">{day(dep.startDate, locale, false)}</td>
                      <td>{dep.planTitle.split(":")[0]}</td>
                      <td>
                        {dep.sold} / {dep.seats}
                      </td>
                      <td>
                        <span className={`tag ${STATE_TAG[dep.state] ?? "tag-neutral"}`}>{t(`partner.state.${dep.state}`, { n: dep.missing })}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="panel">
              <div className="row-base" style={{ marginBottom: 10 }}>
                <div className="heading" style={{ fontSize: 16 }}>
                  {t("partner.performance")}
                </div>
                <Link href="/partner/plans" className="btn btn-ghost btn-xs ml-auto">
                  {t("partner.allPlans", { n: planCount })}
                </Link>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("partner.plan")}</th>
                    <th>{t("partner.views")}</th>
                    <th>{t("partner.conversion")}</th>
                    <th>{t("partner.score")}</th>
                  </tr>
                </thead>
                <tbody>
                  {d.planPerformance.map((plan) => (
                    <tr key={plan.id}>
                      <td>
                        <Link href={`/partner/plans/${plan.id}`} className="plain">
                          {plan.title.split(":")[0]}
                        </Link>
                      </td>
                      <td>{plan.views.toLocaleString("en-US")}</td>
                      <td>{plan.conversion.toFixed(1)}%</td>
                      <td>
                        <span className={`tag ${(plan.score ?? 0) >= 90 ? "tag-accent-2" : "tag-accent"}`}>{plan.score ?? "–"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="xs muted" style={{ marginTop: 14 }}>
            {t("partner.escrowFoot", { p: 100 - d.payoutPercent })}
          </p>
        </>
      )}
    </>
  );
}
