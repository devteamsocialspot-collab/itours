"use client";

import Link from "next/link";
import { Con, Photo, Pro } from "@/components/app/ui";
import { useLocale, useT } from "@/lib/i18n";
import { consOf, nextDeparture, prosOf, seatsLeftKey, type CardPlan } from "@/lib/plan/helpers";
import { mnt, pick, usd } from "@/lib/utils";

/** The card on the landing's grid (wireframe 1a). */
export function PlanCard({ plan }: { plan: CardPlan }) {
  const t = useT();
  const { locale } = useLocale();
  const next = nextDeparture(plan);
  const years = plan.operator.foundedYear ? new Date().getFullYear() - plan.operator.foundedYear : null;
  const [pro] = prosOf(plan);
  const [con] = consOf(plan);
  return (
    <article className="plan-card">
      <Photo src={plan.photos[0]} alt={plan.region}>
        <div className="photo-tags">
          {plan.score != null && (
            <span className="tag tag-score">
              {plan.score} {t("plan.scoreShort")}
            </span>
          )}
          {next && (next.left ?? 0) <= 4 && <span className="tag tag-dark">{t(seatsLeftKey(next.left ?? 0), { n: next.left ?? 0 })}</span>}
        </div>
      </Photo>
      <div className="plan-card-body">
        <div className="muted" style={{ fontSize: 11.5 }}>
          {plan.operator.name}
          {years !== null && ` · ${t("plan.yrs", { n: years })}`}
        </div>
        <Link href={`/plans/${plan.slug}`} className="plain plan-card-title">
          {pick(locale, plan.titleEn, plan.titleMn)}
        </Link>
        <div className="wrap-row" style={{ marginBottom: 6 }}>
          <span className="tag tag-neutral">{t("plan.nDays", { n: plan.days })}</span>
          <span className="tag tag-neutral">{t("plan.maxPax", { n: plan.maxGroup })}</span>
          <span className="tag tag-accent-2">{t(`plan.difficulty.${plan.difficulty}`)}</span>
        </div>
        {pro && <Pro>{pro.text}</Pro>}
        {con && <Con>{con.text}</Con>}
        <div className="row mt-auto" style={{ alignItems: "flex-end", justifyContent: "space-between", paddingTop: 16 }}>
          <div>
            <div className="price">{usd(plan.priceUsd)}</div>
            <div className="price-sub">
              {t("plan.perPerson")} · {mnt(plan.priceUsd)}
            </div>
          </div>
          <Link href={`/plans/${plan.slug}`} className="btn btn-primary btn-sm">
            {t("plan.viewPlan")}
          </Link>
        </div>
      </div>
    </article>
  );
}
