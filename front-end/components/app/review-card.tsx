"use client";

import Link from "next/link";
import { useLocale, useT } from "@/lib/i18n";
import type { DashboardReview, Review } from "@/lib/types";
import { day, initials, pick } from "@/lib/utils";

/** One traveller review; on a dashboard it also names the plan, and the agency when `showOperator`. */
export function ReviewCard({ review, showOperator }: { review: Review & Partial<Pick<DashboardReview, "plan">>; showOperator?: boolean }) {
  const t = useT();
  const { locale } = useLocale();
  const [first = "", last = ""] = (review.travellerName ?? "").split(" ");
  return (
    <div className="panel-sm">
      <div className="row" style={{ gap: 9, marginBottom: 8 }}>
        <div className="avatar" style={{ width: 30, height: 30, background: "var(--color-neutral-400)", fontSize: 11 }}>
          {initials(review.travellerName ?? "")}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>
            {first} {last ? `${last[0]}.` : ""} · {review.country}
          </div>
          {review.travelledAt && <div className="xs muted">{t("plan.travelled", { d: day(review.travelledAt, locale) })}</div>}
        </div>
        <span className={`tag ${review.gaps ? "tag-accent" : "tag-accent-2"} ml-auto`}>
          {review.gaps ? t("plan.nGaps", { n: review.gaps }) : t("plan.matchedPlan")}
        </span>
      </div>
      {review.plan && (
        <div className="xs muted" style={{ marginBottom: 6 }}>
          <Link href={`/plans/${review.plan.slug}`} className="plain">
            {pick(locale, review.plan.titleEn, review.plan.titleMn)}
          </Link>
          {showOperator && ` · ${review.plan.operator.name}`}
        </div>
      )}
      <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0, color: "var(--ink-80)" }}>
        <span style={{ color: "var(--color-cta)" }}>{"★".repeat(review.stars)}</span> {review.text}
      </p>
    </div>
  );
}
