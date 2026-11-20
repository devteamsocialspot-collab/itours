"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { SaveButton } from "@/components/app/save-button";
import { Footer, SiteHeader } from "@/components/app/site-header";
import { Con } from "@/components/app/ui";
import { useLocale, useT } from "@/lib/i18n";
import { consOf, nextDeparture, seatsLeftKey, type CardPlan } from "@/lib/plan/helpers";
import { day, pick, scoreTag, usd } from "@/lib/utils";

type Row = [label: string, render: (plan: CardPlan) => ReactNode, value?: (plan: CardPlan) => number, lowIsGood?: boolean];

const MARK: Record<string, CSSProperties> = { best: { color: "var(--color-accent-2-800)", fontWeight: 700 }, worst: { color: "var(--color-cta-800)" } };

/** The shortlist as a trade-off table (wireframe 1q): per row the best value (green, ✓) and the worst (gold), named for screen readers too. */
export function CompareView({ plans, loading }: { plans: CardPlan[]; loading: boolean }) {
  const t = useT();
  const { locale } = useLocale();

  const tone = (value: (plan: CardPlan) => number, lowIsGood: boolean) => {
    const values = plans.map(value);
    const best = lowIsGood ? Math.min(...values) : Math.max(...values);
    const worst = lowIsGood ? Math.max(...values) : Math.min(...values);
    return (plan: CardPlan): "best" | "worst" | undefined =>
      plans.length < 2 || best === worst ? undefined : value(plan) === best ? "best" : value(plan) === worst ? "worst" : undefined;
  };
  const nights = (n: number, plan: CardPlan) => n / Math.max(plan.nightCount, 1);
  const rows: Row[] = [
    [t("plan.perPerson"), (plan) => <b>{usd(plan.priceUsd)}</b>, (plan) => plan.priceUsd, true],
    [t("plan.expectationScore"), (plan) => <span className={`tag ${scoreTag(plan.score)}`}>{plan.score ?? "–"}</span>],
    [
      t("plan.consStated"),
      (plan) => {
        const cons = consOf(plan);
        return (
          <div className="col" style={{ gap: 4, minWidth: 180 }}>
            {cons.slice(0, 3).map((c) => (
              <Con key={c.id}>{c.text}</Con>
            ))}
            {cons.length > 3 && <span className="xs muted">+{cons.length - 3}</span>}
          </div>
        );
      },
    ],
    [t("plan.duration"), (plan) => t("plan.nDays", { n: plan.days })],
    [t("compare.longestDrive"), (plan) => t("common.hours", { n: plan.maxDrive }), (plan) => plan.maxDrive, true],
    [t("plan.group"), (plan) => t("plan.maxPax", { n: plan.maxGroup }), (plan) => plan.maxGroup, true],
    [t("compare.hotShowers"), (plan) => t("compare.ofNights", { a: plan.showerNights, b: plan.nightCount }), (plan) => nights(plan.showerNights, plan), false],
    [t("compare.toilets"), (plan) => t("compare.ofNights", { a: plan.flushNights, b: plan.nightCount }), (plan) => nights(plan.flushNights, plan), false],
    [
      t("plan.departure"),
      (plan) => {
        const next = nextDeparture(plan);
        return next ? `${day(next.startDate, locale, false)} · ${t(seatsLeftKey(next.left ?? 0), { n: next.left ?? 0 })}` : t("plan.noDepartures");
      },
    ],
  ];

  return (
    <>
      <SiteHeader />
      <main className="wrap gutter" style={{ maxWidth: 1000, paddingBlock: "28px 40px" }}>
        <div className="row-base" style={{ marginBottom: 14, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0 }}>{t("compare.title")}</h3>
          <span className="small muted ml-auto">{t("compare.lead")}</span>
        </div>
        {!loading && plans.length === 0 ? (
          <p className="muted">
            {t("compare.nothingSaved")} <Link href="/search">{t("nav.search")} →</Link>
          </p>
        ) : (
          <div className="table-wrap">
            <table className="table compare">
              <thead>
                <tr>
                  <td />
                  {plans.map((plan) => (
                    <th key={plan.id} scope="col" style={{ textTransform: "none", letterSpacing: 0 }}>
                      <Link href={`/plans/${plan.slug}`} className="plain" style={{ display: "block" }}>
                        <span className="heading" style={{ fontSize: 15, color: "var(--color-text)" }}>
                          {pick(locale, plan.titleEn, plan.titleMn)}
                        </span>
                        <span className="xs muted" style={{ display: "block", fontWeight: 400 }}>
                          {plan.operator.name}
                        </span>
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, render, value, lowIsGood]) => {
                  const rank = value ? tone(value, Boolean(lowIsGood)) : undefined;
                  return (
                    <tr key={label}>
                      <th scope="row">{label}</th>
                      {plans.map((plan) => {
                        const mark = rank?.(plan);
                        return (
                          <td key={plan.id} style={mark && MARK[mark]}>
                            {mark === "best" && <Check size={13} strokeWidth={3} aria-hidden style={{ verticalAlign: -2, marginRight: 4 }} />}
                            {render(plan)}
                            {mark && <span className="sr-only"> ({t(`compare.${mark}`)})</span>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                <tr>
                  <td />
                  {plans.map((plan) => (
                    <td key={plan.id}>
                      <div className="row" style={{ flexWrap: "wrap" }}>
                        <Link href={`/plans/${plan.slug}#book`} className="btn btn-xs btn-cta">
                          {t("compare.book")}
                        </Link>
                        <SaveButton planId={plan.id} />
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
