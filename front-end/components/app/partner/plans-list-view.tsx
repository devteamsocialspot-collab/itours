"use client";

import { CircleAlert } from "lucide-react";
import Link from "next/link";
import { Photo } from "@/components/app/ui";
import { useLocale, useT } from "@/lib/i18n";
import type { Plan, PlanStatus } from "@/lib/types";
import { pick, scoreTag, usd } from "@/lib/utils";

const STATUS_TAG: Record<PlanStatus, string> = { DRAFT: "tag-neutral", PENDING: "tag-accent", NEEDS_FIXES: "tag-accent", PUBLISHED: "tag-accent-2" };

/** The agency's plans, newest edit first (wireframe 2b). */
export function PlansListView({ plans, loading, creating, onCreate }: { plans: Plan[]; loading: boolean; creating: boolean; onCreate: () => void }) {
  const t = useT();
  const { locale } = useLocale();
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
              <div style={{ fontSize: 14, fontWeight: 700 }}>{pick(locale, plan.titleEn, plan.titleMn) || t("partner.untitled")}</div>
              <div className="small muted">
                {[plan.region, t("plan.nDays", { n: plan.days }), plan.priceUsd ? usd(plan.priceUsd) : null, t("partner.onSale", { n: plan.departures.length })]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
              {plan.status === "NEEDS_FIXES" && plan.reviewNote && (
                <div className="small" style={{ color: "var(--color-cta-800)" }}>
                  <CircleAlert size={13} strokeWidth={2.75} aria-hidden style={{ verticalAlign: -2, marginRight: 5 }} />
                  {plan.reviewNote}
                </div>
              )}
            </div>
            <span className={`tag ${STATUS_TAG[plan.status]}`}>{t(`partner.planStatus.${plan.status}`)}</span>
            <span className={`tag ${scoreTag(plan.score)}`}>{plan.score ?? "–"}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
