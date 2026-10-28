"use client";

import Link from "next/link";
import { Photo } from "@/components/app/ui";
import { useT } from "@/lib/i18n";
import type { Plan, PlanStatus } from "@/lib/types";
import { usd } from "@/lib/utils";

const STATUS_TAG: Record<PlanStatus, string> = { DRAFT: "tag-neutral", PENDING: "tag-accent", NEEDS_FIXES: "tag-accent", PUBLISHED: "tag-accent-2" };

/** The agency's plans, newest edit first (wireframe 2b). */
export function PlansListView({ plans, loading, creating, onCreate }: { plans: Plan[]; loading: boolean; creating: boolean; onCreate: () => void }) {
  const t = useT();
  const sorted = [...plans].sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
  return (
    <>
      <div className="row" style={{ marginBottom: 18, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0 }}>{t("partner.plansTitle")}</h2>
        <button type="button" className="btn btn-primary btn-sm ml-auto" disabled={creating} onClick={onCreate}>
          + {t("partner.newPlan")}
        </button>
      </div>
      {loading && plans.length === 0 && <p className="muted">{t("common.loading")}</p>}
      <div className="col" style={{ gap: 10 }}>
        {sorted.map((plan) => (
          <Link key={plan.id} href={`/partner/plans/${plan.id}`} className="plain queue">
            <Photo src={plan.photos[0]} alt={plan.region || "—"} />
            {/* the basis keeps the title beside the photo on a phone; the tags wrap under it instead */}
            <div className="grow" style={{ flexBasis: 140 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{plan.titleEn || t("partner.untitled")}</div>
              <div className="small muted">
                {[plan.region, t("plan.nDays", { n: plan.days }), plan.priceUsd ? usd(plan.priceUsd) : null, t("partner.onSale", { n: plan.departures.length })]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
              {plan.status === "NEEDS_FIXES" && plan.reviewNote && (
                <div className="small" style={{ color: "var(--color-accent-800)" }}>
                  {plan.reviewNote}
                </div>
              )}
            </div>
            <span className={`tag ${STATUS_TAG[plan.status]}`}>{t(`partner.planStatus.${plan.status}`)}</span>
            <span className="tag tag-accent-2">{plan.score ?? "–"}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
