"use client";

import { ChevronDown, Search } from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import { SaveButton, useSavedIds } from "@/components/app/save-button";
import { Footer, SiteHeader } from "@/components/app/site-header";
import { Con, Photo, Pro, Score, Stars } from "@/components/app/ui";
import { useLocale, useT } from "@/lib/i18n";
import { AREAS, consOf, departureFor, LODGING, nextDeparture, prosOf } from "@/lib/plan/helpers";
import type { Plan, PlanFacet } from "@/lib/types";
import { day, mnt, monthYear, pick, usd } from "@/lib/utils";

export type SearchParams = {
  q: string;
  area: string;
  month: string;
  days: string;
  pax: number;
  score: string;
  max: number;
  diff: string;
  sleep: string[];
  db: string[];
  op: string[];
  sort: string;
};

/** A GET form (next/form = client-side navigation) that resubmits when any filter changes. */
function AutoForm(props: React.ComponentProps<typeof Form>) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const form = ref.current!;
    // the native "change" fires once a slider is released, not on every pixel like React's onChange
    const submit = () => form.requestSubmit();
    form.addEventListener("change", submit);
    return () => form.removeEventListener("change", submit);
  }, []);
  return <Form ref={ref} {...props} />;
}

/** Search results with the filter rail (wireframe 1b). The filtering itself happens in the API. */
export function SearchView({ params, plans, facets }: { params: SearchParams; plans: Plan[]; facets: PlanFacet[] }) {
  const t = useT();
  const { locale } = useLocale();
  const saved = useSavedIds();
  // on a phone the rail folds up above the results; the count tells what it's hiding
  const [filtersOpen, setFiltersOpen] = useState(false);
  const active = [params.area, params.score, params.diff].filter(Boolean).length + params.sleep.length + params.db.length + params.op.length + (params.max < 3000 ? 1 : 0);
  const { q, month, pax, sort } = params;
  const title = `${q ? t("search.resultsFor", { n: plans.length, q }) : t("search.resultsTitle", { n: plans.length })}${params.area ? ` · ${t(`regions.${params.area}.name`)}` : ""}${month ? `, ${monthYear(month, locale)}` : ""}`;
  const keep = { q, month, days: params.days, pax: String(pax) };
  const sortHref = (value: string) => {
    const query = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) for (const item of Array.isArray(val) ? val : [String(val)]) if (item) query.append(key, item);
    query.set("sort", value);
    return `/search?${query}`;
  };

  return (
    <>
      <SiteHeader />
      <main className="wrap search-layout">
        <AutoForm action="/search" className={filtersOpen ? "filter-rail open" : "filter-rail"}>
          {Object.entries(keep).map(([key, value]) => value && <input key={key} type="hidden" name={key} value={value} />)}
          <input type="hidden" name="sort" value={sort} />
          <div className="row-base" style={{ justifyContent: "space-between", marginBottom: 16 }}>
            <div className="heading hide-m" style={{ fontSize: 16 }}>
              {t("search.filters")}
            </div>
            <button type="button" className="rail-toggle show-m" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((open) => !open)}>
              {t("search.filters")}
              {active > 0 && ` · ${active}`}
              <ChevronDown size={16} />
            </button>
            <Link href={`/search?q=${encodeURIComponent(q)}`} className="btn btn-ghost" style={{ fontSize: 12 }}>
              {t("search.clear")}
            </Link>
          </div>

          <section>
            <div className="kicker">{t("search.region")}</div>
            <div className="wrap-row">
              {["", ...AREAS].map((value) => (
                <label key={value} className="chip">
                  <input type="radio" name="area" value={value} defaultChecked={params.area === value} />
                  <span>{value ? t(`operatorPage.area.${value}`) : t("search.any")}</span>
                </label>
              ))}
            </div>
          </section>

          <section>
            <div className="kicker">{t("plan.expectationScore")}</div>
            <div className="col" style={{ gap: 7, fontSize: 13 }}>
              {[
                ["90", t("search.score90")],
                ["80", t("search.score80")],
                ["", t("search.anyScore")],
              ].map(([value, label]) => (
                <label key={value} className="radio">
                  <input type="radio" name="score" value={value} defaultChecked={params.score === value} />
                  <span className="dot" />
                  {label}
                </label>
              ))}
            </div>
          </section>

          <section>
            <div className="kicker">
              {t("search.maxPrice")}: {usd(params.max)}
            </div>
            <input type="range" name="max" min={200} max={3000} step={50} defaultValue={params.max} aria-label={t("search.maxPrice")} />
            <div className="row small muted" style={{ justifyContent: "space-between" }}>
              <span>$200</span>
              <span>$3,000</span>
            </div>
          </section>

          <section>
            <div className="kicker">{t("search.difficulty")}</div>
            <div className="seg" style={{ width: "100%" }}>
              {[
                ["", t("search.any")],
                ["easy", t("plan.difficulty.EASY")],
                ["moderate", t("plan.difficulty.MODERATE")],
                ["hard", t("plan.difficulty.HARD")],
              ].map(([value, label]) => (
                <label key={value} className="seg-opt" style={{ flex: 1, justifyContent: "center", padding: "7px 4px" }}>
                  <input type="radio" name="diff" value={value} defaultChecked={params.diff === value} />
                  {label}
                </label>
              ))}
            </div>
          </section>

          <section>
            <div className="kicker">{t("search.sleepingArrangement")}</div>
            <div className="wrap-row">
              {LODGING.map(({ value, key }) => (
                <label key={value} className="chip">
                  <input type="checkbox" name="sleep" value={value} defaultChecked={params.sleep.includes(value)} />
                  <span>{t(key)}</span>
                </label>
              ))}
            </div>
          </section>

          <section>
            <div className="kicker">{t("search.dealBreakers")}</div>
            <div className="wrap-row">
              {(["shower", "flush", "drive", "english"] as const).map((value) => (
                <label key={value} className="chip sage">
                  <input type="checkbox" name="db" value={value} defaultChecked={params.db.includes(value)} />
                  <span>{t(`search.db.${value}`)}</span>
                </label>
              ))}
            </div>
          </section>

          <section>
            <div className="kicker">{t("search.operator")}</div>
            <div className="col" style={{ gap: 7 }}>
              {facets.map((facet) => (
                <label key={facet.slug} className="check" style={{ justifyContent: "space-between" }}>
                  <span className="row" style={{ gap: 8 }}>
                    <input type="checkbox" name="op" value={facet.slug} defaultChecked={params.op.includes(facet.slug)} />
                    {facet.name}
                  </span>
                  <span className="muted">{facet.count}</span>
                </label>
              ))}
            </div>
          </section>
          <noscript>
            <button className="btn btn-primary btn-block">{t("search.apply")}</button>
          </noscript>
        </AutoForm>

        <div className="search-results">
          {/* a new search: where, when, how many; the rail's filters start over */}
          <form action="/search" className="search-pill" style={{ maxWidth: "none", marginBottom: 20, boxShadow: "var(--shadow-sm)" }}>
            <input name="q" defaultValue={q} placeholder={t("home.wherePh")} style={{ fontWeight: 600, flex: 1 }} aria-label={t("home.where")} />
            <span className="sep" />
            <input name="month" type="month" defaultValue={month} aria-label={t("home.when")} />
            <span className="sep" />
            <input name="pax" type="number" min={1} max={12} defaultValue={pax} style={{ width: 44 }} aria-label={t("home.travellers")} />
            <span className="small muted">{t("home.travellers").toLowerCase()}</span>
            <button className="btn btn-primary btn-icon" style={{ marginLeft: 12 }} aria-label={t("nav.search")}>
              <Search size={15} strokeWidth={2.75} />
            </button>
          </form>
          <h3 style={{ margin: "0 0 4px" }}>{title}</h3>
          <div className="row" style={{ marginBottom: 18, flexWrap: "wrap" }}>
            <span className="muted" style={{ fontSize: 12.5, marginRight: "auto" }}>
              {t("search.rankingNote")}
            </span>
            <div className="seg seg-mini">
              {(["best", "score", "price"] as const).map((value) => (
                <Link key={value} href={sortHref(value)} className={`seg-opt ${sort === value ? "on" : ""}`}>
                  {t(`search.sort.${value}`)}
                </Link>
              ))}
            </div>
          </div>

          <div className="col" style={{ gap: 16 }}>
            {plans.length === 0 && <div className="panel muted">{t("search.noResults")}</div>}
            {plans.map((plan, i) => {
              const dep = departureFor(plan, pax, month) ?? nextDeparture(plan);
              const pros = prosOf(plan);
              const cons = consOf(plan);
              return (
                <Fragment key={plan.id}>
                  <article className="result">
                    <Link href={`/plans/${plan.slug}`} className="plain">
                      <Photo src={plan.photos[0]} alt={plan.region}>
                        <span className="tag tag-dark" style={{ position: "absolute", bottom: 10, left: 10 }}>
                          {t("plan.photos", { n: plan.photos.length })}
                        </span>
                      </Photo>
                    </Link>
                    <div style={{ minWidth: 0 }}>
                      <div className="row" style={{ gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                        <span className="dot" style={{ background: plan.operator.color }} />
                        <Link href={`/operators/${plan.operator.slug}`} className="plain small" style={{ color: "var(--ink-70)" }}>
                          {plan.operator.name}
                        </Link>
                        {plan.operator.isVerified && (
                          <span className="tag tag-accent-2" style={{ fontSize: 10 }}>
                            {t("plan.verified")}
                          </span>
                        )}
                        <Stars stars={plan.stars} count={plan.reviewCount} />
                      </div>
                      <Link href={`/plans/${plan.slug}`} className="plain result-title" style={{ display: "block" }}>
                        {pick(locale, plan.titleEn, plan.titleMn)}
                      </Link>
                      <div className="wrap-row" style={{ marginBottom: 11 }}>
                        <span className="tag tag-neutral">{t("plan.daysNights", { d: plan.days, n: plan.days - 1 })}</span>
                        <span className="tag tag-neutral">{t("plan.maxPax", { n: plan.maxGroup })}</span>
                        <span className="tag tag-neutral">{t(`plan.difficulty.${plan.difficulty}`)}</span>
                        <span className="tag tag-neutral">{plan.vehicle}</span>
                      </div>
                      <div className="grid-2" style={{ gap: "10px 18px" }}>
                        {[0, 1].flatMap((k) => [
                          pros[k] && <Pro key={`p${k}`}>{pros[k].text}</Pro>,
                          cons[k] && <Con key={`c${k}`}>{cons[k].text}</Con>,
                        ])}
                      </div>
                    </div>
                    <div className="result-side">
                      <div className="row" style={{ gap: 9, marginBottom: 12 }}>
                        <Score value={plan.score} />
                        <div className="score-label">{plan.score == null ? t("plan.noScore") : t("plan.expectationScore")}</div>
                      </div>
                      <div className="price price-lg">{usd(plan.priceUsd)}</div>
                      <div className="price-sub" style={{ marginBottom: 2 }}>
                        {t("plan.perPerson")} · {mnt(plan.priceUsd)}
                      </div>
                      <div className="small" style={{ color: dep && (dep.left ?? 0) <= 4 ? "var(--color-cta-800)" : "var(--ink-60)", marginBottom: 12 }}>
                        {dep ? `${t("plan.seatsOf", { n: dep.left ?? 0, total: dep.seats })} · ${day(dep.startDate, locale, false)}` : t("plan.noDepartures")}
                      </div>
                      <Link href={`/plans/${plan.slug}${dep ? `?dep=${dep.id}&pax=${pax}` : ""}`} className="btn btn-primary btn-block mt-auto">
                        {t("plan.viewPlan")}
                      </Link>
                      <SaveButton planId={plan.id} block />
                    </div>
                  </article>
                  {i === 1 && saved.ids.size >= 2 && (
                    <div className="banner">
                      <div style={{ lineHeight: 1.5 }}>{t("search.compareBanner", { n: saved.ids.size })}</div>
                      <Link href="/compare" className="btn btn-primary btn-sm ml-auto">
                        {t("search.compareN", { n: saved.ids.size })}
                      </Link>
                    </div>
                  )}
                </Fragment>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
