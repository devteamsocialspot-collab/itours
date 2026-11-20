"use client";

import { useMutation } from "@apollo/client";
import Link from "next/link";
import { useState } from "react";
import { ReviewCard } from "@/components/app/review-card";
import { Con, Photo } from "@/components/app/ui";
import { useReport } from "@/lib/hooks/use-report";
import { useLocale, useT } from "@/lib/i18n";
import { ADMIN_COUNTS_QUERY } from "@/lib/operator/queries";
import { APPROVE_PLAN_MUTATION, REQUEST_FIXES_MUTATION } from "@/lib/plan/queries";
import type { DashboardReview, Plan } from "@/lib/types";
import { consOf, prosOf } from "@/lib/plan/helpers";
import { day, mntShort, pick } from "@/lib/utils";

type Stats = { verifiedOperators: number; pendingPlans: number; gmvUsd: number; bookings30d: number };

/** One submitted plan: what the automatic checks found, a note for the agency, approve when it's complete. */
function QueueItem({ plan, onDone }: { plan: Plan; onDone: () => void }) {
  const t = useT();
  const { locale } = useLocale();
  const issues = (plan.checks ?? []).filter((c) => c.required && !c.ok);
  const [note, setNote] = useState(issues.map((c) => c.label).join("; "));
  const title = pick(locale, plan.titleEn, plan.titleMn);
  // Approve is always there; when it can't be used, the line under it says why
  const blockers = [...issues.map((c) => c.label), ...(plan.operator.isVerified ? [] : [t("admin.notVerified")])];
  const why = `why-${plan.id}`;
  const options = { refetchQueries: [ADMIN_COUNTS_QUERY] };
  const [approve, { loading: approving }] = useMutation(APPROVE_PLAN_MUTATION, options);
  const [requestFixes, { loading: sending }] = useMutation(REQUEST_FIXES_MUTATION, options);
  const report = useReport(onDone);

  return (
    <div className="queue">
      <Photo src={plan.photos[0]} alt={title} />
      <div style={{ minWidth: 0, flex: "1 1 260px" }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{title}</div>
        <div className="small" style={{ color: "var(--ink-60)" }}>
          {plan.operator.name}
          {plan.submittedAt && ` · ${day(plan.submittedAt, locale)}`}
          {!plan.operator.isVerified && (
            <>
              {" · "}
              <b style={{ color: "var(--color-cta-800)" }}>{t("admin.notVerified")}</b>
            </>
          )}
          {plan.reviewNote && ` · ${plan.reviewNote}`}
        </div>
      </div>
      <div className="wrap-row">
        {issues.length === 0 ? (
          <span className="tag tag-accent-2">{t("admin.complete")}</span>
        ) : (
          issues.map((c) => (
            <span key={c.key} className="tag tag-accent">
              {c.label}
            </span>
          ))
        )}
        {plan.photos.some((url) => url.includes("wikimedia")) && <span className="tag tag-neutral">{t("admin.stockPhotos")}</span>}
      </div>
      <div className="row ml-auto" style={{ flexWrap: "wrap", minWidth: 0 }}>
        <Link href={`/plans/${plan.slug}`} target="_blank" className="btn btn-secondary btn-xs">
          {t("common.open")}
        </Link>
        <form
          className="row queue-note"
          style={{ gap: 6, minWidth: 0, alignItems: "flex-end" }}
          onSubmit={async (event) => {
            event.preventDefault();
            const { data } = await requestFixes({ variables: { id: plan.id, note } });
            await report(data?.requestPlanFixes);
          }}
        >
          <div className="field grow" style={{ minWidth: 0 }}>
            <label htmlFor={`note-${plan.id}`}>{t("admin.noteLabel")}</label>
            <input
              id={`note-${plan.id}`}
              className="input"
              style={{ width: "100%", minWidth: 170, minHeight: 30, fontSize: 12 }}
              placeholder={t("admin.fixPh")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              required
            />
          </div>
          <button className={`btn btn-xs ${issues.length ? "btn-primary" : "btn-secondary"}`} disabled={sending || !note.trim()}>
            {t("admin.requestFixes")}
          </button>
        </form>
        <div className="col" style={{ gap: 3, alignItems: "flex-start" }}>
          <button
            type="button"
            className="btn btn-primary btn-xs"
            disabled={approving || blockers.length > 0}
            aria-describedby={blockers.length ? why : undefined}
            onClick={async () => {
              const { data } = await approve({ variables: { id: plan.id } });
              await report(data?.approvePlan);
            }}
          >
            {t("admin.approve")}
          </button>
          {blockers.length > 0 && (
            <span id={why} className="xs" style={{ color: "var(--color-cta-800)", maxWidth: 220 }}>
              {t("admin.approveNeeds", { list: blockers.join(", ") })}
            </span>
          )}
        </div>
      </div>
      {/* what the reviewer checks, without leaving the queue */}
      <details style={{ flex: "1 1 100%" }}>
        <summary className="small bold" style={{ cursor: "pointer", color: "var(--color-accent)" }}>
          {t("admin.checkPlan")}
        </summary>
        <div className="grid-2" style={{ gap: 16, marginTop: 10 }}>
          <div className="col" style={{ gap: 4 }}>
            <div className="kicker" style={{ marginBottom: 4 }}>
              {t("plan.consStated")}
            </div>
            {consOf(plan).map((c) => (
              <Con key={c.id}>{c.text}</Con>
            ))}
          </div>
          <div className="sum-lines" style={{ borderTop: 0, paddingTop: 0 }}>
            <div>
              <span className="muted">{t("plan.pros")}</span>
              <span className="semi">{prosOf(plan).length}</span>
            </div>
            <div>
              <span className="muted">{t("compare.longestDrive")}</span>
              <span className="semi">{t("common.hours", { n: plan.maxDrive })}</span>
            </div>
            <div>
              <span className="muted">{t("compare.hotShowers")}</span>
              <span className="semi">{t("compare.ofNights", { a: plan.showerNights, b: plan.nightCount })}</span>
            </div>
          </div>
        </div>
        <div className="thumbs" style={{ marginTop: 12 }}>
          {plan.photos.slice(0, 4).map((url) => (
            <Photo key={url} src={url} alt={title} />
          ))}
        </div>
      </details>
    </div>
  );
}

/** Marketplace numbers, the plan review queue (oldest submission first, wireframe 3a), then the newest traveller reviews. */
export function ReviewQueueView({
  plans,
  stats,
  loading,
  refetch,
  reviews,
}: {
  plans: Plan[];
  stats: Stats | null;
  loading: boolean;
  refetch: () => void;
  reviews: DashboardReview[];
}) {
  const t = useT();
  return (
    <>
      <div className="grid-4 keep-m" style={{ gap: 12, marginBottom: 22 }}>
        <div className="stat">
          <div className="stat-value" style={{ fontSize: 26 }}>
            {stats?.verifiedOperators ?? "–"}
          </div>
          <div className="stat-sub">{t("admin.verifiedOperators")}</div>
        </div>
        <div className="stat" style={{ background: "var(--color-accent-100)" }}>
          <div className="stat-value" style={{ fontSize: 26, color: "var(--color-accent-900)" }}>
            {stats?.pendingPlans ?? "–"}
          </div>
          <div className="stat-sub" style={{ color: "var(--color-accent)" }}>
            {t("admin.awaitingReview")}
          </div>
        </div>
        <div className="stat">
          <div className="stat-value" style={{ fontSize: 26 }}>
            {stats ? mntShort(stats.gmvUsd) : "–"}
          </div>
          <div className="stat-sub">{t("admin.gmv")}</div>
        </div>
        <div className="stat">
          <div className="stat-value" style={{ fontSize: 26 }}>
            {stats?.bookings30d ?? "–"}
          </div>
          <div className="stat-sub">{t("admin.bookings30")}</div>
        </div>
      </div>

      <div className="row-base" style={{ marginBottom: 12, flexWrap: "wrap" }}>
        <h4 style={{ margin: 0 }}>{t("admin.queueTitle")}</h4>
        <span className="small muted">{t("admin.queueLead")}</span>
      </div>
      <div className="col" style={{ gap: 10 }}>
        {plans.length === 0 && <div className="panel muted">{loading ? t("common.loading") : t("admin.queueEmpty")}</div>}
        {plans.map((plan) => (
          <QueueItem key={plan.id} plan={plan} onDone={refetch} />
        ))}
      </div>

      <h4 style={{ margin: "26px 0 12px" }}>{t("plan.latestReviews")}</h4>
      {reviews.length === 0 && <div className="panel muted">{t("plan.noReviewsYet")}</div>}
      <div className="grid-2" style={{ gap: 12 }}>
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} showOperator />
        ))}
      </div>
    </>
  );
}
