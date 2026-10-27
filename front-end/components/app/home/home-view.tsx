"use client";

/* eslint-disable @next/next/no-img-element -- remote photos at their own size, no loader configured */
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, MapPin, Scale, Search, ShieldCheck, Star, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useReducer, useRef, type ReactNode } from "react";
import { ComfortPicker, SeasonStrip } from "@/components/app/home/planners";
import { RegionExplorer } from "@/components/app/home/region-explorer";
import { PlanCard } from "@/components/app/plan-card";
import { Footer, SiteHeader } from "@/components/app/site-header";
import { Score } from "@/components/app/ui";
import { useLocale, useT } from "@/lib/i18n";
import type { Area, Plan, Review } from "@/lib/types";
import { initials, pick } from "@/lib/utils";

const POPULAR = ["Khövsgöl", "Gobi", "Terelj", "Orkhon", "Altai"];
const C = "https://upload.wikimedia.org/wikipedia/commons/thumb";
/** The hero's slideshow — Wikimedia Commons photos the demo plans use too — and the region each one is in. */
const SLIDES: { id: string; area: Area; src: string }[] = [
  { id: "dunes", area: "GOBI", src: `${C}/0/04/Khongoryn_Els_04.jpg/1280px-Khongoryn_Els_04.jpg` },
  { id: "lake", area: "NORTH", src: `${C}/d/de/Lake_Kh%C3%B6vsg%C3%B6l_01.jpg/1280px-Lake_Kh%C3%B6vsg%C3%B6l_01.jpg` },
  { id: "camels", area: "GOBI", src: `${C}/3/3f/Camels_at_Khongoryn_Els_01.jpg/1280px-Camels_at_Khongoryn_Els_01.jpg` },
  { id: "erdene", area: "CENTRAL", src: `${C}/d/d7/Erdene_Zuu_Monastery_06.jpg/1280px-Erdene_Zuu_Monastery_06.jpg` },
  { id: "falls", area: "CENTRAL", src: `${C}/3/38/Ulaan_Tsutgalan_Waterfall.jpg/1280px-Ulaan_Tsutgalan_Waterfall.jpg` },
];
const CTA_PHOTO = `${C}/e/e0/Khongoryn_Els_10.jpg/1280px-Khongoryn_Els_10.jpg`;
const STEPS = [
  { key: "step1", Icon: Scale },
  { key: "step2", Icon: CalendarDays },
  { key: "step3", Icon: MapPin },
] as const;

export type HomeReview = Review & { plan: Pick<Plan, "slug" | "titleEn" | "titleMn"> };
type Props = { verifiedOperators: number; planCount: number; plans: Plan[]; top: Plan[]; quote: string | null; reviews: HomeReview[] };

function SectionHead({ kicker, title, lead, children }: { kicker?: string; title: string; lead?: string; children?: ReactNode }) {
  return (
    <div className="sec-head reveal">
      <div className="grow">
        {kicker && <div className="eyebrow">{kicker}</div>}
        <h2>{title}</h2>
        {lead && <p>{lead}</p>}
      </div>
      {children}
    </div>
  );
}

/** Full-bleed slideshow under the promise and the search; a slide's photo loads just before it is shown. */
function Hero({ verifiedOperators, planCount, top, quote }: Pick<Props, "verifiedOperators" | "planCount" | "top" | "quote">) {
  const t = useT();
  const { locale } = useLocale();
  const [{ shown, loaded }, show] = useReducer((s: { shown: number; loaded: number }, i: number) => ({ shown: i, loaded: Math.max(s.loaded, i + 1) }), {
    shown: 0,
    loaded: 1,
  });
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setTimeout(() => show((shown + 1) % SLIDES.length), 7000);
    return () => clearTimeout(timer);
  }, [shown]);
  const slide = SLIDES[shown];
  const best = top[0];

  return (
    <section className="hx">
      <div className="hx-slides" aria-hidden>
        {SLIDES.map((s, i) => i <= loaded && <img key={s.id} src={s.src} alt="" className={i === shown ? "on" : undefined} fetchPriority={i ? "low" : "high"} />)}
      </div>
      <div className="wrap hx-in">
        <div className="hx-badge">
          <i />
          {t("home.heroBadge", { ops: verifiedOperators, plans: planCount })}
        </div>
        <h1>{t("home.heroTitle")}</h1>
        <p className="hx-lead">{t("home.heroLead")}</p>
        <form action="/search" className="hx-search">
          <div className="field" style={{ flex: 1.5 }}>
            <label htmlFor="q">{t("home.where")}</label>
            <input id="q" name="q" className="input" placeholder={t("home.wherePh")} list="regions" />
            <datalist id="regions">
              {POPULAR.map((region) => (
                <option key={region} value={region} />
              ))}
            </datalist>
          </div>
          <div className="field">
            <label htmlFor="month">{t("home.when")}</label>
            <input id="month" name="month" type="month" className="input" />
          </div>
          <div className="field" style={{ flex: 0.7 }}>
            <label htmlFor="days">{t("home.days")}</label>
            <select id="days" name="days" className="input">
              <option value="">{t("search.any")}</option>
              <option value="1-3">1–3</option>
              <option value="4-6">4–6</option>
              <option value="6-9">6–9</option>
              <option value="10-30">10+</option>
            </select>
          </div>
          <div className="field" style={{ flex: 0.6 }}>
            <label htmlFor="pax">{t("home.travellers")}</label>
            <input id="pax" name="pax" type="number" min={1} max={12} defaultValue={2} className="input" />
          </div>
          <button className="btn btn-cta">
            <Search size={16} strokeWidth={2.75} />
            {t("nav.search")}
          </button>
        </form>
        <div className="hx-chips">
          <span>{t("home.popular")}</span>
          {POPULAR.map((region) => (
            <Link key={region} href={`/search?q=${encodeURIComponent(region)}`}>
              {region}
            </Link>
          ))}
        </div>
      </div>

      <div className="wrap hx-foot">
        <div className="hx-trust">
          <span>
            <ShieldCheck size={16} /> {t("home.trustVerified")}
          </span>
          <span>
            <Star size={16} /> {t("home.trustScore")}
          </span>
          <span>
            <Wallet size={16} /> {t("home.trustEscrow")}
          </span>
        </div>
        <div className="hx-caption">
          <MapPin size={14} />
          {t(`home.slides.${slide.id}`)} · <Link href={`/search?area=${slide.area}`}>{t("home.slideTrips")}</Link>
        </div>
        <div className="hx-dots">
          {SLIDES.map((s, i) => (
            <button key={s.id} type="button" aria-label={t(`home.slides.${s.id}`)} aria-current={i === shown} onClick={() => show(i)} />
          ))}
        </div>
      </div>

      {best && (
        <aside className="hx-card">
          <div className="row" style={{ marginBottom: quote ? 10 : 8 }}>
            <Score value={best.score} size={46} />
            <div>
              <div className="heading" style={{ fontSize: 14.5 }}>
                {t("plan.expectationScore")}
              </div>
              <div className="muted xs">{t("home.scoreFrom", { n: best.ratingCount })}</div>
            </div>
          </div>
          {quote && <p>“{quote.length > 120 ? `${quote.slice(0, 117)}…` : quote}”</p>}
          <Link href={`/plans/${best.slug}`}>{pick(locale, best.titleEn, best.titleMn)} →</Link>
        </aside>
      )}
    </section>
  );
}

/** Latest reviews of the best plans, a swipe row with arrows. */
function Reviews({ reviews }: { reviews: HomeReview[] }) {
  const t = useT();
  const { locale } = useLocale();
  const row = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => row.current?.scrollBy({ left: dir * row.current.clientWidth * 0.9, behavior: "smooth" });
  return (
    <section className="wrap sec">
      <SectionHead kicker={t("home.reviewsKicker")} title={t("home.reviewsTitle")} lead={t("home.reviewsLead")}>
        <div className="row">
          <button type="button" className="btn btn-secondary btn-icon" aria-label={t("common.prev")} onClick={() => scroll(-1)}>
            <ChevronLeft size={18} />
          </button>
          <button type="button" className="btn btn-secondary btn-icon" aria-label={t("common.next")} onClick={() => scroll(1)}>
            <ChevronRight size={18} />
          </button>
        </div>
      </SectionHead>
      <div className="reviews reveal" ref={row} tabIndex={0} aria-label={t("home.reviewsTitle")}>
        {reviews.map((review) => {
          const [first = "", last = ""] = (review.travellerName ?? "").split(" ");
          return (
            <article key={review.id} className="review">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="stars" aria-label={`${review.stars}/5`}>
                  {"★".repeat(review.stars)}
                </span>
                <span className={`tag ${review.gaps ? "tag-accent" : "tag-accent-2"}`}>{review.gaps ? t("plan.nGaps", { n: review.gaps }) : t("plan.matchedPlan")}</span>
              </div>
              <p>{review.text}</p>
              <div className="row mt-auto">
                <div className="avatar" style={{ background: "var(--color-accent)" }}>
                  {initials(review.travellerName ?? "")}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="small bold">
                    {first} {last ? `${last[0]}.` : ""} {review.country && `· ${review.country}`}
                  </div>
                  <Link href={`/plans/${review.plan.slug}`} className="xs muted plain">
                    {pick(locale, review.plan.titleEn, review.plan.titleMn)}
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/** The landing: a full-bleed promise and search, then the regions, best trips, comfort and season planners, reviews. */
export function HomeView({ verifiedOperators, planCount, plans, top, quote, reviews }: Props) {
  const t = useT();
  return (
    <>
      <SiteHeader variant="home" />
      <main>
        <Hero verifiedOperators={verifiedOperators} planCount={planCount} top={top} quote={quote} />

        <section className="wrap sec">
          <SectionHead kicker={t("home.exploreKicker")} title={t("home.exploreTitle")} lead={t("home.exploreLead")} />
          <RegionExplorer plans={plans} />
        </section>

        <section className="band">
          <div className="wrap sec">
            <SectionHead title={t("home.bestMatched")} lead={t("home.rankedNote")}>
              <Link href="/search" className="btn btn-secondary btn-sm">
                {t("home.seeAll", { n: planCount })}
              </Link>
            </SectionHead>
            <div className="grid-3 reveal">
              {top.map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          </div>
        </section>

        <section className="wrap sec">
          <SectionHead kicker={t("home.comfortKicker")} title={t("home.comfortTitle")} lead={t("home.comfortLead")} />
          <ComfortPicker plans={plans} />
        </section>

        <section className="band">
          <div className="wrap sec">
            <SectionHead kicker={t("home.monthsKicker")} title={t("home.monthsTitle")} lead={t("home.monthsLead")} />
            <SeasonStrip plans={plans} />
          </div>
        </section>

        {reviews.length > 0 && <Reviews reviews={reviews} />}

        <section id="how" className="band">
          <div className="wrap sec">
            <SectionHead kicker={t("home.howKicker")} title={t("home.howTitle")} />
            <div className="grid-3 reveal" style={{ gap: 30 }}>
              {STEPS.map(({ key, Icon }) => (
                <div key={key} className="step">
                  <div className="step-ico">
                    <Icon size={24} />
                  </div>
                  <h4>{t(`home.${key}`)}</h4>
                  <p>{t(`home.${key}Text`)}</p>
                </div>
              ))}
            </div>
            <div className="escrow reveal">
              <div className="step-ico">
                <Wallet size={24} />
              </div>
              <div>
                <div className="heading" style={{ fontSize: 18, marginBottom: 2 }}>
                  {t("home.escrowTitle")}
                </div>
                <div style={{ fontSize: 14 }}>{t("home.escrowText")}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="wrap pad" style={{ paddingBlock: 76 }}>
          <div className="cta-band reveal">
            <img src={CTA_PHOTO} alt="" loading="lazy" />
            <div>
              <h2>{t("home.ctaTitle")}</h2>
              <p>{t("home.ctaText")}</p>
              <div className="row" style={{ justifyContent: "center", flexWrap: "wrap" }}>
                <Link href="/search" className="btn btn-cta">
                  {t("home.ctaSearch")} <ArrowRight size={16} />
                </Link>
                <Link href="/register?type=agency" className="btn btn-secondary">
                  {t("home.ctaAgency")}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
