"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { SaveButton } from "@/components/app/save-button";
import { Footer, SiteHeader } from "@/components/app/site-header";
import { useLocale, useT } from "@/lib/i18n";
import { nextDeparture, seatsLeftKey, type CardPlan } from "@/lib/plan/helpers";
import { day, usd } from "@/lib/utils";

type Row = [label: string, render: (plan: CardPlan) => ReactNode, value?: (plan: CardPlan) => number, lowIsGood?: boolean];

/** The shortlist as a trade-off table (wireframe 1q): per row, the best value in sage and the worst in clay. */
export function CompareView({ plans, loading }: { plans: CardPlan[]; loading: boolean }) {
  const t = useT();
  const { locale } = useLocale();

  const tone = (value: (plan: CardPlan) => number, lowIsGood: boolean) => {
    const values = plans.map(value);
    const best = lowIsGood ? Math.min(...values) : Math.max(...values);
    const worst = lowIsGood ? Math.max(...values) : Math.min(...values);
    return (plan: CardPlan): CSSProperties | undefined =>
      plans.length < 2 || best === worst
        ? undefined
        : value(plan) === best
          ? { color: "var(--color-accent-2-800)", fontWeight: 700 }
          : value(plan) === worst
            ? { color: "var(--color-accent-800)" }
            : undefined;
  };
  const nights = (n: number, plan: CardPlan) => n / Math.max(plan.nightCount, 1);
  const rows: Row[] = [
    [t("plan.perPerson"), (plan) => <b>{usd(plan.priceUsd)}</b>, (plan) => plan.priceUsd, true],
    [t("plan.expectationScore"), (plan) => <span className="tag tag-accent-2">{plan.score ?? "–"}</span>],
    [t("plan.duration"), (plan) => t("plan.nDays", { n: plan.days })],
    [t("compare.longestDrive"), (plan) => `${plan.maxDrive} h`, (plan) => plan.maxDrive, true],
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
            <table className="table">
              <thead>
                <tr>
                  <th />
                  {plans.map((plan) => (
                    <th key={plan.id}>
                      <Link href={`/plans/${plan.slug}`} className="plain">
                        {plan.operator.name} · {t("plan.nDays", { n: plan.days })}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, render, value, lowIsGood]) => {
                  const style = value ? tone(value, Boolean(lowIsGood)) : undefined;
                  return (
                    <tr key={label}>
                      <td className="muted">{label}</td>
                      {plans.map((plan) => (
                        <td key={plan.id} style={style?.(plan)}>
                          {render(plan)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                <tr>
                  <td />
                  {plans.map((plan, i) => (
                    <td key={plan.id}>
                      <div className="row" style={{ flexWrap: "wrap" }}>
                        <Link href={`/plans/${plan.slug}#book`} className={`btn btn-xs ${i === 0 ? "btn-cta" : "btn-secondary"}`}>
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
