"use client";

import Link from "next/link";
import { Footer, SiteHeader } from "@/components/app/site-header";
import { Bar, Photo } from "@/components/app/ui";
import { useLocale, useT } from "@/lib/i18n";
import type { Area, Operator, Plan } from "@/lib/types";
import { pick, usd } from "@/lib/utils";

const AREAS: Area[] = ["GOBI", "NORTH", "WEST", "CENTRAL", "EAST"];

/** An agency's public profile (wireframe 1m): company numbers, the score breakdown, its live plans. */
export function OperatorPageView({ operator, plans, area }: { operator: Operator; plans: Plan[]; area?: string }) {
  const t = useT();
  const { locale } = useLocale();
  const stats = operator.stats;
  const chosen = AREAS.find((a) => a === area);
  const shown = plans.filter((plan) => !chosen || plan.area === chosen);
  const present = AREAS.filter((a) => plans.some((plan) => plan.area === a));
  const tile = { borderRadius: 20, padding: "14px 16px" };
  const big = { fontSize: 24, lineHeight: 1 };

  return (
    <>
      <SiteHeader>
        <Link href="/operators" className="plain hide-m" style={{ fontSize: 13, marginLeft: 14 }}>
          ← {t("nav.operators")}
        </Link>
      </SiteHeader>
      <main className="wrap" style={{ maxWidth: 1060, paddingBottom: 34 }}>
        <Photo src={operator.coverUrl} alt={operator.name} style={{ height: 190 }} />
        <div className="row gutter" style={{ marginTop: -44, position: "relative", alignItems: "flex-end", gap: 18, flexWrap: "wrap" }}>
          <div className="score" style={{ width: 96, height: 96, background: operator.color, border: "5px solid var(--color-bg)", color: "#ffffff", fontSize: 30 }}>
            {operator.name[0]}
          </div>
          <div style={{ paddingBottom: 8 }}>
            <h2 style={{ margin: "0 0 5px" }}>{operator.name}</h2>
            <div className="wrap-row" style={{ gap: 7 }}>
              {operator.isVerified && <span className="tag tag-accent-2">{t("plan.verified")}</span>}
              {operator.licenceNo && <span className="tag tag-neutral">{t("operatorPage.licence", { n: operator.licenceNo })}</span>}
              <span className="tag tag-neutral">{operator.city}</span>
              {operator.foundedYear && <span className="tag tag-neutral">{t("operatorPage.since", { y: operator.foundedYear })}</span>}
            </div>
          </div>
        </div>

        <div className="grid-5 keep-m gutter" style={{ paddingTop: 24 }}>
          <div className="panel-sage" style={tile}>
            <div className="heading" style={big}>
              {stats?.score ?? "–"}
            </div>
            <div style={{ fontSize: 11.5, marginTop: 3 }}>{t("plan.expectationScore")}</div>
          </div>
          <div className="tile" style={tile}>
            <div className="heading" style={big}>
              {stats?.stars?.toFixed(1) ?? "–"}
            </div>
            <div className="small muted" style={{ marginTop: 3 }}>
              {t("plan.reviews", { n: stats?.reviewCount ?? 0 })}
            </div>
          </div>
          <div className="tile" style={tile}>
            <div className="heading" style={big}>
              {stats?.plansLive ?? 0}
            </div>
            <div className="small muted" style={{ marginTop: 3 }}>
              {t("operatorPage.plansLive")}
            </div>
          </div>
          <div className="tile" style={tile}>
            <div className="heading" style={big}>
              ~{operator.replyHours} h
            </div>
            <div className="small muted" style={{ marginTop: 3 }}>
              {t("operatorPage.replyTime")}
            </div>
          </div>
          <div className="tile" style={tile}>
            <div className="heading" style={big}>
              {(stats?.cancelRate ?? 0).toFixed(1)}%
            </div>
            <div className="small muted" style={{ marginTop: 3 }}>
              {t("operatorPage.cancelRate")}
            </div>
          </div>
        </div>

        <div className="two-col gutter" style={{ paddingTop: 26, display: "grid", gridTemplateColumns: "1fr 320px", gap: 28, alignItems: "start" }}>
          <div>
            <h4 style={{ margin: "0 0 8px" }}>{t("operatorPage.whoWeAre")}</h4>
            <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--ink-80)", margin: "0 0 22px" }}>{operator.about}</p>
            <div className="row-base" style={{ marginBottom: 14, flexWrap: "wrap" }}>
              <h4 style={{ margin: 0 }}>{t("operatorPage.plansCount", { n: plans.length })}</h4>
              <div className="seg seg-mini ml-auto">
                <Link href={`/operators/${operator.slug}`} className={`seg-opt ${!chosen ? "on" : ""}`}>
                  {t("search.any")}
                </Link>
                {present.map((a) => (
                  <Link key={a} href={`/operators/${operator.slug}?area=${a}`} className={`seg-opt ${chosen === a ? "on" : ""}`}>
                    {t(`operatorPage.area.${a}`)}
                  </Link>
                ))}
              </div>
            </div>
            <div className="grid-2" style={{ gap: 14 }}>
              {shown.map((plan) => (
                <Link key={plan.id} href={`/plans/${plan.slug}`} className="plain panel" style={{ padding: 0, borderRadius: 24, overflow: "hidden", display: "flex" }}>
                  <Photo src={plan.photos[0]} alt={plan.region} style={{ width: 104, flex: "none", minHeight: 110 }} />
                  <div style={{ padding: "13px 15px" }}>
                    <div className="heading" style={{ fontSize: 15, marginBottom: 6 }}>
                      {pick(locale, plan.titleEn, plan.titleMn)}
                    </div>
                    <div className="row" style={{ gap: 5, marginBottom: 8 }}>
                      <span className="tag tag-accent-2" style={{ fontSize: 10 }}>
                        {plan.score ?? t("operatorPage.newPlan")}
                      </span>
                      <span className="tag tag-neutral" style={{ fontSize: 10 }}>
                        {t("plan.nDays", { n: plan.days })}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>
                      {usd(plan.priceUsd)}{" "}
                      <span className="xs muted" style={{ fontWeight: 400 }}>
                        {t("plan.perPerson")}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <div className="col" style={{ gap: 14 }}>
            <div className="panel">
              <div className="heading" style={{ fontSize: 15, marginBottom: 12 }}>
                {t("plan.expectationScore")}
              </div>
              <div className="col" style={{ gap: 10, fontSize: 12 }}>
                {(stats?.areas ?? [])
                  .filter((a) => a.score !== null)
                  .map((a) => (
                    <div key={a.area}>
                      <div className="row" style={{ justifyContent: "space-between", marginBottom: 3 }}>
                        <span>{t(`plan.area.${a.area}`)}</span>
                        <span>{a.score}</span>
                      </div>
                      <Bar value={a.score!} warn={a.score! < 90} neutral />
                    </div>
                  ))}
              </div>
            </div>
            <div className="panel-sand">
              <div className="heading" style={{ fontSize: 15, marginBottom: 10 }}>
                {t("operatorPage.languagesFleet")}
              </div>
              <div className="wrap-row">
                {operator.languages.map((language) => (
                  <span key={language} className="tag tag-neutral">
                    {language}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--ink-70)", marginTop: 12 }}>{operator.fleet}</div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
