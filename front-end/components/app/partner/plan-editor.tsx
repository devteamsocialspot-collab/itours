"use client";

import { useMutation } from "@apollo/client";
import { CircleAlert, Check } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { RouteMap } from "@/components/app/plan/route-map";
import { Con, Photo, Pro } from "@/components/app/ui";
import { uploadUrl } from "@/lib/api";
import { readSessionToken } from "@/lib/auth";
import { useLocale, useT, getActiveLocale } from "@/lib/i18n";
import { LODGING } from "@/lib/plan/helpers";
import { locate, PLACE_NAMES } from "@/lib/plan/places";
import { SAVE_PLAN_MUTATION, SUBMIT_PLAN_MUTATION } from "@/lib/plan/queries";
import type { Area, ClaimArea, ClaimKind, Difficulty, Plan, PlanCheck, PlanDay } from "@/lib/types";
import { pick, scoreTag, usd } from "@/lib/utils";

const TABS = ["basics", "days", "claims", "pricing", "photos", "policies"] as const;
const AREAS: Area[] = ["GOBI", "NORTH", "WEST", "CENTRAL", "EAST"];
const CLAIM_AREAS: ClaimArea[] = ["ITINERARY", "LODGING", "GUIDE", "COMFORT"];
const DIFFICULTIES: Difficulty[] = ["EASY", "EASY_MODERATE", "MODERATE", "HARD"];
/** The tab that fixes each publish check (the keys of the API's PlanController.getChecks). */
const CHECK_TAB: Record<string, (typeof TABS)[number]> = {
  "check.basics": "basics",
  "check.titleMn": "basics",
  "check.days": "days",
  "check.driveMissing": "days",
  "check.driveAll": "days",
  "check.pros": "claims",
  "check.cons": "claims",
  "check.noCons": "claims",
  "check.price": "pricing",
  "check.departure": "pricing",
  "check.photos": "photos",
  "check.noPhotos": "photos",
  "check.morePhotos": "photos",
};

type EditorDay = Omit<PlanDay, "dayNo">;
type EditorClaim = { id?: string; kind: ClaimKind; area: ClaimArea; text: string; detail: string };
type EditorDeparture = { id?: string; startDate: string; seats: number };
type EditorPlan = Pick<
  Plan,
  | "titleEn"
  | "titleMn"
  | "region"
  | "area"
  | "season"
  | "minGroup"
  | "maxGroup"
  | "difficulty"
  | "vehicle"
  | "sleeping"
  | "lodging"
  | "summary"
  | "summaryMn"
  | "priceUsd"
  | "groupPriceUsd"
  | "groupPriceFrom"
  | "singleSupplement"
  | "included"
  | "excluded"
  | "photos"
  | "freeCancelDays"
  | "totalKm"
  | "unpavedPct"
> & { dayItems: EditorDay[]; claims: EditorClaim[]; departures: EditorDeparture[] };

/** Only the fields the API takes back: the editor sends the whole plan on every save. */
const toEditor = (plan: Plan): EditorPlan => ({
  titleEn: plan.titleEn,
  titleMn: plan.titleMn,
  region: plan.region,
  area: plan.area,
  season: plan.season,
  minGroup: plan.minGroup,
  maxGroup: plan.maxGroup,
  difficulty: plan.difficulty,
  vehicle: plan.vehicle,
  sleeping: plan.sleeping,
  lodging: plan.lodging,
  summary: plan.summary,
  summaryMn: plan.summaryMn,
  priceUsd: plan.priceUsd,
  groupPriceUsd: plan.groupPriceUsd,
  groupPriceFrom: plan.groupPriceFrom,
  singleSupplement: plan.singleSupplement,
  included: plan.included,
  excluded: plan.excluded,
  photos: plan.photos,
  freeCancelDays: plan.freeCancelDays,
  totalKm: plan.totalKm,
  unpavedPct: plan.unpavedPct,
  dayItems: plan.dayItems.map(({ place, title, description, driveHours, sleeping, meals, hotShower, signal, flushToilet }) => ({
    place,
    title,
    description,
    driveHours,
    sleeping,
    meals,
    hotShower,
    signal,
    flushToilet,
  })),
  claims: [...plan.claims].sort((a, b) => a.sort - b.sort).map(({ id, kind, area, text, detail }) => ({ id, kind, area, text, detail })),
  departures: plan.departures.map(({ id, startDate, seats }) => ({ id, startDate, seats })),
});

// module-level on purpose: a component declared inside PlanEditor would remount its inputs on every keystroke.
// `span` is 1 / -1, not span 2: the grid drops to one column on a phone, and span 2 would add a second.
// `id` ties the label to its one control; `group` names a set of controls with a fieldset's legend instead
const Field = ({ id, label, children, span, group }: { id?: string; label: string; children: ReactNode; span?: boolean; group?: boolean }) => {
  const style = span ? { gridColumn: "1 / -1" } : undefined;
  return group ? (
    <fieldset className="field" style={style}>
      <legend>{label}</legend>
      {children}
    </fieldset>
  ) : (
    <div className="field" style={style}>
      <label htmlFor={id}>{label}</label>
      {children}
    </div>
  );
};
const blankDay = (place = ""): EditorDay => ({
  place,
  title: "",
  description: "",
  driveHours: null,
  sleeping: "",
  meals: "B · L · D",
  hotShower: false,
  signal: true,
  flushToilet: false,
});
const move = <T,>(items: T[], i: number, by: number) => {
  const next = [...items];
  const [item] = next.splice(i, 1);
  next.splice(Math.max(0, Math.min(next.length, i + by)), 0, item);
  return next;
};
const numOrNull = (value: string) => (value === "" ? null : +value);

/** The plan editor (wireframe 2c): six tabs, a live card preview and the publish checklist from the API. */
export function PlanEditor({ plan: loaded, startTab }: { plan: Plan; startTab: string }) {
  const t = useT();
  const { locale } = useLocale();
  const panel = useRef<HTMLDivElement>(null);
  const [saved, setSaved] = useState(loaded);
  const [p, setP] = useState(() => toEditor(loaded));
  const [tab, setTab] = useState(TABS.find((x) => x === startTab) ?? "basics");
  const [openDay, setOpenDay] = useState<number | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [savePlan, { loading: saving }] = useMutation(SAVE_PLAN_MUTATION);
  const [submitPlan, { loading: submitting }] = useMutation(SUBMIT_PLAN_MUTATION);
  const busy = saving || submitting;

  const set = <K extends keyof EditorPlan>(key: K, value: EditorPlan[K]) => {
    setP((x) => ({ ...x, [key]: value }));
    setDirty(true);
  };
  const setDay = (i: number, patch: Partial<EditorDay>) => set("dayItems", p.dayItems.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  const setClaim = (i: number, patch: Partial<EditorClaim>) => set("claims", p.claims.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const setDeparture = (i: number, patch: Partial<EditorDeparture>) => set("departures", p.departures.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  /** Takes item i out of a list, with an Undo toast that puts it back in the same place. */
  const removeAt = (key: "dayItems" | "claims" | "photos", i: number, message = t("editor.removed")) => {
    const list = p[key] as unknown[];
    const item = list[i];
    set(key, list.filter((_, j) => j !== i) as never);
    toast(message, {
      action: {
        label: t("common.undo"),
        onClick: () => setP((x) => ({ ...x, [key]: [...(x[key] as unknown[]).slice(0, i), item, ...(x[key] as unknown[]).slice(i)] })),
      },
    });
  };

  // unsaved edits: the browser's own prompt on closing or reloading the tab. ponytail: the sidebar's links
  // aren't guarded, the App Router has no API to block a navigation; only the back link below asks
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const checks: PlanCheck[] = saved.checks ?? [];
  const required = checks.filter((c) => c.required);
  const progress = required.length ? Math.round((required.filter((c) => c.ok).length / required.length) * 100) : 0;
  const published = saved.status === "PUBLISHED";
  const ratedById = new Map(saved.claims.map((c) => [c.id, c]));
  const soldById = new Map(saved.departures.map((d) => [d.id, d.seats - (d.left ?? d.seats)]));
  const failing = required.filter((c) => !c.ok);
  const issueTabs = new Set(failing.map((c) => CHECK_TAB[c.key]));
  /** Tabs pattern: ←/→ move along the tabs (roving tabIndex). */
  const onTabKey = (event: React.KeyboardEvent) => {
    const by = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!by) return;
    event.preventDefault();
    const next = TABS[(TABS.indexOf(tab) + by + TABS.length) % TABS.length];
    setTab(next);
    document.getElementById(`tab-${next}`)?.focus();
  };

  /** Save, then — when asked — submit: the API checks the saved plan, never the screen's copy. */
  const run = async (submit: boolean) => {
    const { data } = await savePlan({ variables: { id: saved.id, ...p } });
    const res = data?.savePlan;
    if (!res?.success) return toast.error(res?.message ?? t("common.error"));
    setSaved(res.plan);
    setP(toEditor(res.plan));
    setDirty(false);
    if (!submit) return toast.success(res.message);
    const { data: sent } = await submitPlan({ variables: { id: saved.id } });
    const out = sent?.submitPlan;
    if (!out?.success) return toast.error(out?.message ?? t("common.error"));
    setSaved((x) => ({ ...x, status: out.plan.status, reviewNote: out.plan.reviewNote }));
    toast.success(out.message);
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const body = new FormData();
      body.set("file", file);
      const token = readSessionToken();
      try {
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: { "x-locale": getActiveLocale(), ...(token ? { authorization: `Bearer ${token}` } : {}) },
          body,
        });
        const json = await res.json();
        if (json.success && json.url) urls.push(json.url);
        else toast.error(json.message ?? t("common.error"));
      } catch {
        toast.error(t("common.error"));
      }
    }
    if (urls.length) set("photos", [...p.photos, ...urls]);
    setUploading(false);
  };

  const unmapped = [...new Set(p.dayItems.map((d) => d.place.trim()).filter((place) => place && !locate(place)))];
  const pros = p.claims.map((c, i) => ({ c, i })).filter(({ c }) => c.kind === "PRO");
  const cons = p.claims.map((c, i) => ({ c, i })).filter(({ c }) => c.kind === "CON");

  return (
    <>
      <div className="bleed">
        <div className="topbar-dark" style={{ flexWrap: "wrap" }}>
          <Link
            href="/partner/plans"
            onClick={(event) => {
              if (dirty && !window.confirm(t("editor.leaveUnsaved"))) event.preventDefault();
            }}
          >
            ← {t("nav.plans")}
          </Link>
          <div className="heading" style={{ fontSize: 16, color: "var(--color-bg)" }}>
            {pick(locale, p.titleEn, p.titleMn) || t("partner.untitled")}
          </div>
          <span className="tag" style={{ background: "rgba(247, 244, 239,.18)", color: "var(--color-bg)" }}>
            {t(`partner.planStatus.${saved.status}`)}
          </span>
          <div className="row ml-auto" style={{ gap: 14, flexWrap: "wrap" }}>
            <div className="row" style={{ gap: 9 }}>
              <div style={{ width: 96, height: 6, borderRadius: 999, background: "rgba(247, 244, 239,.2)" }}>
                <div style={{ width: `${progress}%`, height: "100%", borderRadius: 999, background: "var(--color-accent-400)" }} />
              </div>
              <span className="small" style={{ color: "rgba(247, 244, 239,.7)" }}>
                {t("editor.complete", { n: progress })}
              </span>
            </div>
            {dirty && (
              <span className="small" style={{ color: "var(--color-cta-300)" }}>
                {t("editor.unsaved")}
              </span>
            )}
            <a href={`/plans/${saved.slug}`} target="_blank" className="btn btn-secondary btn-sm">
              {t("editor.preview")}
            </a>
            <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => run(false)}>
              {t("editor.saveDraft")}
            </button>
            <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => run(true)}>
              {published ? t("editor.publishChanges") : t("editor.submit")}
            </button>
          </div>
        </div>

        <div className="tabs" role="tablist">
          {TABS.map((key) => (
            <button
              key={key}
              id={`tab-${key}`}
              type="button"
              role="tab"
              aria-selected={tab === key}
              aria-controls="panel"
              tabIndex={tab === key ? 0 : -1}
              className={tab === key ? "on" : ""}
              onClick={() => setTab(key)}
              onKeyDown={onTabKey}
            >
              {t(`editor.tab.${key}`)}
              {issueTabs.has(key) && (
                <>
                  <CircleAlert size={12} strokeWidth={2.75} aria-hidden style={{ color: "var(--color-cta-700)", marginLeft: 5, verticalAlign: -1 }} />
                  <span className="sr-only">{t("editor.tabIssues")}</span>
                </>
              )}
            </button>
          ))}
        </div>
        {failing.length > 0 && (
          <a href="#checks" className="small show-m" style={{ display: "block", padding: "8px 16px", color: "var(--color-cta-800)" }}>
            <CircleAlert size={13} strokeWidth={2.75} aria-hidden style={{ verticalAlign: -2, marginRight: 5 }} />
            {t("editor.issuesN", { n: failing.length })}
          </a>
        )}
      </div>

      <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 372px", gap: 28, padding: "24px 0 34px", alignItems: "start" }}>
        <div ref={panel} role="tabpanel" id="panel" aria-labelledby={`tab-${tab}`} tabIndex={0} style={{ minWidth: 0 }}>
          {saved.status === "NEEDS_FIXES" && saved.reviewNote && (
            <p className="error" style={{ marginTop: 0 }}>
              <b>{t("editor.reviewer")}</b> {saved.reviewNote}
            </p>
          )}

          {tab === "basics" && (
            <div className="grid-2" style={{ gap: 14 }}>
              <Field id="ed-titleEn" label={t("editor.titleEn")} span>
                <input id="ed-titleEn" className="input" value={p.titleEn} onChange={(e) => set("titleEn", e.target.value)} />
              </Field>
              <Field id="ed-titleMn" label={t("editor.titleMn")} span>
                <input id="ed-titleMn" className="input" value={p.titleMn} onChange={(e) => set("titleMn", e.target.value)} />
              </Field>
              <Field id="ed-region" label={t("editor.region")}>
                <input id="ed-region" className="input" value={p.region} onChange={(e) => set("region", e.target.value)} placeholder="Ömnögovi" />
              </Field>
              <Field id="ed-area" label={t("editor.area")}>
                <select id="ed-area" className="input" value={p.area} onChange={(e) => set("area", e.target.value as Area)}>
                  {AREAS.map((area) => (
                    <option key={area} value={area}>
                      {t(`operatorPage.area.${area}`)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="ed-season" label={t("editor.season")}>
                <input id="ed-season" className="input" value={p.season} onChange={(e) => set("season", e.target.value)} placeholder="May – September" />
              </Field>
              <Field label={t("editor.groupSize")} group>
                <div className="row">
                  <input className="input" type="number" min={1} aria-label={t("editor.groupMin")} value={p.minGroup} onChange={(e) => set("minGroup", +e.target.value)} />
                  <input className="input" type="number" min={1} aria-label={t("editor.groupMax")} value={p.maxGroup} onChange={(e) => set("maxGroup", +e.target.value)} />
                </div>
              </Field>
              <Field label={t("editor.difficulty")} group>
                <div className="seg" style={{ width: "100%" }}>
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={p.difficulty === d}
                      className={`seg-opt ${p.difficulty === d ? "on" : ""}`}
                      style={{ flex: 1, justifyContent: "center", padding: "7px 4px" }}
                      onClick={() => set("difficulty", d)}
                    >
                      {t(`plan.difficulty.${d}`)}
                    </button>
                  ))}
                </div>
              </Field>
              <Field id="ed-vehicle" label={t("editor.vehicle")}>
                <input id="ed-vehicle" className="input" value={p.vehicle} onChange={(e) => set("vehicle", e.target.value)} placeholder="Russian UAZ 452 (4×4)" />
              </Field>
              <Field id="ed-sleeping" label={t("editor.sleepingLine")} span>
                <input id="ed-sleeping" className="input" value={p.sleeping} onChange={(e) => set("sleeping", e.target.value)} placeholder="Ger camps + 1 herder ger" />
              </Field>
              <Field label={t("editor.lodgingTypes")} span group>
                <div className="wrap-row">
                  {LODGING.map(({ value, key }) => (
                    <label key={value} className="chip">
                      <input
                        type="checkbox"
                        checked={p.lodging.includes(value)}
                        onChange={(e) => set("lodging", e.target.checked ? [...p.lodging, value] : p.lodging.filter((x) => x !== value))}
                      />
                      <span>{t(key)}</span>
                    </label>
                  ))}
                </div>
              </Field>
              <Field id="ed-summary" label={t("editor.summaryEn")} span>
                <textarea id="ed-summary" className="input" style={{ borderRadius: 18 }} value={p.summary} onChange={(e) => set("summary", e.target.value)} />
              </Field>
              <Field id="ed-summaryMn" label={t("editor.summaryMn")} span>
                <textarea id="ed-summaryMn" className="input" style={{ borderRadius: 18 }} value={p.summaryMn} onChange={(e) => set("summaryMn", e.target.value)} />
              </Field>
            </div>
          )}

          {tab === "days" && (
            <>
              <div className="row-base" style={{ marginBottom: 12 }}>
                <h4 style={{ margin: 0 }}>{t("editor.dayByDay")}</h4>
                <span className="small muted">{t("editor.dayRule")}</span>
              </div>
              <RouteMap days={p.dayItems.map((d, i) => ({ dayNo: i + 1, place: d.place }))} compact />
              {unmapped.length > 0 && (
                <p className="small" style={{ color: "var(--color-cta-800)", marginTop: 0 }}>
                  <CircleAlert size={13} strokeWidth={2.75} aria-hidden style={{ verticalAlign: -2, marginRight: 5 }} />
                  {t("editor.notOnMap", { list: unmapped.join(", ") })}
                </p>
              )}
              <datalist id="places">
                {PLACE_NAMES.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
              <div className="col" style={{ gap: 9 }}>
                {p.dayItems.map((d, i) =>
                  openDay === i ? (
                    <div key={i} className="ed-day open">
                      <div className="row" style={{ marginBottom: 12 }}>
                        <span className="day-n" style={{ fontSize: 13, width: 48 }}>
                          {t("editor.day")} {i + 1}
                        </span>
                        <input className="input" value={d.title} onChange={(e) => setDay(i, { title: e.target.value })} placeholder={t("editor.dayTitlePh")} aria-label={t("editor.dayTitlePh")} />
                      </div>
                      <div className="grid-4" style={{ gap: 10, marginBottom: 10 }}>
                        <Field id={`ed-day-${i}-place`} label={t("editor.place")}>
                          <input id={`ed-day-${i}-place`} className="input" list="places" value={d.place} onChange={(e) => setDay(i, { place: e.target.value })} />
                        </Field>
                        <Field id={`ed-day-${i}-drive`} label={t("editor.driveH")}>
                          <input id={`ed-day-${i}-drive`} className="input" type="number" step={0.5} min={0} value={d.driveHours ?? ""} onChange={(e) => setDay(i, { driveHours: numOrNull(e.target.value) })} />
                        </Field>
                        <Field id={`ed-day-${i}-sleeping`} label={t("editor.sleeping")}>
                          <input id={`ed-day-${i}-sleeping`} className="input" value={d.sleeping} onChange={(e) => setDay(i, { sleeping: e.target.value })} />
                        </Field>
                        <Field id={`ed-day-${i}-meals`} label={t("editor.meals")}>
                          <input id={`ed-day-${i}-meals`} className="input" value={d.meals} onChange={(e) => setDay(i, { meals: e.target.value })} />
                        </Field>
                      </div>
                      <Field id={`ed-day-${i}-desc`} label={t("editor.dayDescription")}>
                        <textarea id={`ed-day-${i}-desc`} className="input" style={{ minHeight: 62, borderRadius: 18 }} value={d.description} onChange={(e) => setDay(i, { description: e.target.value })} />
                      </Field>
                      <div className="row" style={{ marginTop: 10, flexWrap: "wrap" }}>
                        <label className="check">
                          <input type="checkbox" checked={d.hotShower} onChange={(e) => setDay(i, { hotShower: e.target.checked })} />
                          {t("editor.hotShower")}
                        </label>
                        <label className="check">
                          <input type="checkbox" checked={d.signal} onChange={(e) => setDay(i, { signal: e.target.checked })} />
                          {t("editor.signal")}
                        </label>
                        <label className="check">
                          <input type="checkbox" checked={d.flushToilet} onChange={(e) => setDay(i, { flushToilet: e.target.checked })} />
                          {t("editor.flush")}
                        </label>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs ml-auto"
                          onClick={() => {
                            removeAt("dayItems", i);
                            setOpenDay(null);
                          }}
                        >
                          {t("editor.removeDay")}
                        </button>
                        <button type="button" className="btn btn-primary btn-xs" onClick={() => setOpenDay(null)}>
                          {t("common.done")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div key={i} className="ed-day row">
                      <span className="col" style={{ gap: 2 }}>
                        <button type="button" className="x-btn" style={{ fontSize: 13 }} aria-label={t("editor.moveUp", { n: i + 1 })} onClick={() => set("dayItems", move(p.dayItems, i, -1))}>
                          ▲
                        </button>
                        <button type="button" className="x-btn" style={{ fontSize: 13 }} aria-label={t("editor.moveDown", { n: i + 1 })} onClick={() => set("dayItems", move(p.dayItems, i, 1))}>
                          ▼
                        </button>
                      </span>
                      <span className="day-n" style={{ fontSize: 13, width: 48 }}>
                        {t("editor.day")} {i + 1}
                      </span>
                      <span className="grow semi" style={{ fontSize: 13.5 }}>
                        {d.title || <span className="muted">—</span>}
                      </span>
                      {d.sleeping && <span className="tag tag-neutral hide-m">{d.sleeping}</span>}
                      <span className={`tag ${d.driveHours === null ? "tag-outline" : d.driveHours >= 6 ? "tag-accent" : "tag-neutral"}`}>
                        {d.driveHours === null ? t("editor.driveQ") : t("common.hours", { n: d.driveHours })}
                      </span>
                      <button type="button" className="btn btn-ghost btn-xs" onClick={() => setOpenDay(i)}>
                        {t("common.edit")}
                      </button>
                    </div>
                  ),
                )}
                <button
                  type="button"
                  className="btn btn-secondary btn-block btn-sm"
                  onClick={() => {
                    set("dayItems", [...p.dayItems, blankDay(p.dayItems.at(-1)?.place)]);
                    setOpenDay(p.dayItems.length);
                  }}
                >
                  + {t("editor.addDay", { n: p.dayItems.length + 1 })}
                </button>
              </div>
            </>
          )}

          {tab === "claims" && (
            <div className="panel-sage">
              <div className="row-base" style={{ marginBottom: 6 }}>
                <h4 style={{ margin: 0 }}>{t("editor.claimsTitle")}</h4>
                <span className="small ml-auto">{t("editor.claimsCount", { p: pros.length, c: cons.length })}</span>
              </div>
              <p style={{ fontSize: 12.5, lineHeight: 1.55, opacity: 0.85, margin: "0 0 14px" }}>{t("editor.claimsLead")}</p>
              <div className="grid-2" style={{ gap: 14 }}>
                {(
                  [
                    ["PRO", pros, t("editor.pros")],
                    ["CON", cons, t("editor.cons")],
                  ] as const
                ).map(([kind, items, title]) => (
                  <div key={kind}>
                    <div className="kicker" style={{ color: "var(--color-accent-2-800)" }}>
                      {title}
                    </div>
                    <div className="col" style={{ gap: 7 }}>
                      {items.map(({ c, i }, n) => {
                        const rated = c.id ? ratedById.get(c.id) : undefined;
                        const changed = rated && rated.text !== c.text;
                        // the dashboard's gap rule: under 85, and on 3+ ratings so one bad trip doesn't flag a line
                        const warn = rated?.score != null && rated.score < 85 && rated.ratingCount >= 3;
                        return (
                          <div key={c.id ?? `new${i}`} className={`ed-item ${warn ? "warn" : ""}`} style={{ flexDirection: "column", alignItems: "stretch", gap: 2 }}>
                            <div className="row" style={{ gap: 4 }}>
                              <input
                                className="input grow"
                                value={c.text}
                                onChange={(e) => setClaim(i, { text: e.target.value })}
                                placeholder={kind === "PRO" ? "Two nights at the dunes" : "Two 6–7 h driving days"}
                                aria-label={`${title} ${n + 1}`}
                              />
                              {rated && rated.ratingCount > 0 && !changed && (
                                <span className="xs nowrap" style={{ color: warn ? "var(--color-cta-800)" : "var(--color-accent-2-700)" }}>
                                  {rated.score}% {warn ? "⚠" : "✓"}
                                </span>
                              )}
                              {changed && rated.ratingCount > 0 && (
                                <span className="xs nowrap" style={{ color: "var(--color-cta-800)" }}>
                                  {t("editor.resets")}
                                </span>
                              )}
                              <button
                                type="button"
                                className="x-btn"
                                aria-label={t("common.remove")}
                                onClick={() =>
                                  removeAt("claims", i, rated?.ratingCount ? t("editor.removedRated", { text: rated.text, n: rated.ratingCount }) : undefined)
                                }
                              >
                                ×
                              </button>
                            </div>
                            <div className="row" style={{ gap: 4 }}>
                              <input className="input grow" style={{ fontSize: 12 }} value={c.detail} onChange={(e) => setClaim(i, { detail: e.target.value })} placeholder={t("editor.detailPh")} aria-label={t("editor.detailPh")} />
                              <select className="input" style={{ width: 118, fontSize: 12 }} aria-label={t("editor.claimAreaLabel")} value={c.area} onChange={(e) => setClaim(i, { area: e.target.value as ClaimArea })}>
                                {CLAIM_AREAS.map((area) => (
                                  <option key={area} value={area}>
                                    {t(`editor.claimArea.${area}`)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        style={{ alignSelf: "flex-start" }}
                        onClick={() => set("claims", [...p.claims, { kind, area: "ITINERARY", text: "", detail: "" }])}
                      >
                        + {kind === "PRO" ? t("editor.addPro") : t("editor.addCon")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "pricing" && (
            <>
              <div className="grid-4" style={{ gap: 12, marginBottom: 24 }}>
                <Field id="ed-price" label={t("editor.price")}>
                  <input id="ed-price" className="input" type="number" min={0} value={p.priceUsd} onChange={(e) => set("priceUsd", +e.target.value)} />
                </Field>
                <Field id="ed-groupPrice" label={t("editor.groupPrice")}>
                  <input id="ed-groupPrice" className="input" type="number" min={0} value={p.groupPriceUsd ?? ""} onChange={(e) => set("groupPriceUsd", numOrNull(e.target.value))} />
                </Field>
                <Field id="ed-groupFrom" label={t("editor.groupFrom")}>
                  <input id="ed-groupFrom" className="input" type="number" min={2} value={p.groupPriceFrom ?? ""} onChange={(e) => set("groupPriceFrom", numOrNull(e.target.value))} />
                </Field>
                <Field id="ed-single" label={t("editor.singleSupplement")}>
                  <input id="ed-single" className="input" type="number" min={0} value={p.singleSupplement ?? ""} onChange={(e) => set("singleSupplement", numOrNull(e.target.value))} />
                </Field>
              </div>
              <h4 style={{ margin: "0 0 10px" }}>{t("editor.departures")}</h4>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t("editor.startDate")}</th>
                      <th>{t("editor.seats")}</th>
                      <th>{t("editor.sold")}</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {p.departures.map((d, i) => {
                      const sold = d.id ? (soldById.get(d.id) ?? 0) : 0;
                      return (
                        <tr key={d.id ?? `n${i}`}>
                          <td>
                            <input className="input" type="date" aria-label={t("editor.startDate")} value={d.startDate} onChange={(e) => setDeparture(i, { startDate: e.target.value })} />
                          </td>
                          <td>
                            <input className="input" type="number" min={Math.max(1, sold)} style={{ width: 90 }} aria-label={t("editor.seats")} value={d.seats} onChange={(e) => setDeparture(i, { seats: +e.target.value })} />
                          </td>
                          <td>{sold}</td>
                          <td>
                            {sold === 0 && (
                              <button type="button" className="x-btn" aria-label={t("common.remove")} onClick={() => set("departures", p.departures.filter((_, j) => j !== i))}>
                                ×
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="row" style={{ marginTop: 10, flexWrap: "wrap" }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => set("departures", [...p.departures, { startDate: "", seats: p.maxGroup }])}>
                  + {t("editor.addDeparture")}
                </button>
                {p.departures.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      const existing = new Set(p.departures.map((d) => d.startDate));
                      const next = p.departures
                        .map((d) => ({ startDate: `${+d.startDate.slice(0, 4) + 1}${d.startDate.slice(4)}`, seats: d.seats }))
                        .filter((d) => !existing.has(d.startDate));
                      set("departures", [...p.departures, ...next]);
                    }}
                  >
                    {t("editor.copyNextYear")}
                  </button>
                )}
              </div>
            </>
          )}

          {tab === "photos" && (
            <>
              <p className="small muted" style={{ marginTop: 0 }}>
                {t("editor.photosLead")}
              </p>
              <div className="thumbs" style={{ marginBottom: 14 }}>
                {p.photos.map((url, i) => (
                  <Photo key={url} src={url} alt="">
                    {i === 0 && (
                      <span className="tag tag-dark" style={{ position: "absolute", top: 6, left: 6 }}>
                        {t("editor.cover")}
                      </span>
                    )}
                    <div className="thumb-actions">
                      {i > 0 && (
                        <button type="button" onClick={() => set("photos", move(p.photos, i, -i))}>
                          {t("editor.makeCover")}
                        </button>
                      )}
                      <button type="button" aria-label={t("common.remove")} onClick={() => removeAt("photos", i)}>
                        ×
                      </button>
                    </div>
                  </Photo>
                ))}
              </div>
              <div className="row" style={{ flexWrap: "wrap" }}>
                <label className="btn btn-secondary btn-sm">
                  {uploading ? t("editor.uploading") : `+ ${t("editor.upload")}`}
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => upload(e.target.files)} />
                </label>
                <input className="input grow" style={{ maxWidth: 360 }} value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder={t("editor.photoUrl")} aria-label={t("editor.photoUrl")} />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={!/^https?:\/\//.test(photoUrl.trim())}
                  onClick={() => {
                    set("photos", [...p.photos, photoUrl.trim()]);
                    setPhotoUrl("");
                  }}
                >
                  {t("editor.addUrl")}
                </button>
              </div>
            </>
          )}

          {tab === "policies" && (
            <div className="grid-2" style={{ gap: 14 }}>
              <Field id="ed-included" label={t("editor.included")}>
                <textarea id="ed-included" className="input" style={{ borderRadius: 18, minHeight: 130 }} value={p.included.join("\n")} onChange={(e) => set("included", e.target.value.split("\n"))} />
              </Field>
              <Field id="ed-excluded" label={t("editor.excluded")}>
                <textarea id="ed-excluded" className="input" style={{ borderRadius: 18, minHeight: 130 }} value={p.excluded.join("\n")} onChange={(e) => set("excluded", e.target.value.split("\n"))} />
              </Field>
              <Field id="ed-freeCancel" label={t("editor.freeCancel")}>
                <input id="ed-freeCancel" className="input" type="number" min={0} value={p.freeCancelDays} onChange={(e) => set("freeCancelDays", +e.target.value)} />
              </Field>
              <Field label={t("editor.routeLength")} group>
                <div className="row">
                  <input className="input" type="number" min={0} aria-label={t("editor.km")} value={p.totalKm ?? ""} onChange={(e) => set("totalKm", numOrNull(e.target.value))} />
                  <input className="input" type="number" min={0} max={100} aria-label={t("editor.unpavedPct")} value={p.unpavedPct ?? ""} onChange={(e) => set("unpavedPct", numOrNull(e.target.value))} />
                </div>
              </Field>
            </div>
          )}
        </div>

        <aside className="col" style={{ gap: 14 }}>
          <div className="panel-sand" style={{ borderRadius: 28, padding: 16 }}>
            <div className="kicker">{t("editor.livePreview")}</div>
            <div className="plan-card" style={{ boxShadow: "var(--shadow-md)" }}>
              <Photo src={p.photos[0]} alt={p.region || "cover"} style={{ height: 128 }} />
              <div className="plan-card-body" style={{ padding: "14px 16px 16px" }}>
                <div className="xs muted">{saved.operator.name}</div>
                <div className="heading" style={{ fontSize: 16 }}>
                  {pick(locale, p.titleEn, p.titleMn) || "—"}
                </div>
                <div className="wrap-row">
                  <span className={`tag ${scoreTag(saved.score)}`} style={{ fontSize: 10 }}>
                    {saved.score ?? "–"}
                  </span>
                  <span className="tag tag-neutral" style={{ fontSize: 10 }}>
                    {t("plan.nDays", { n: p.dayItems.length })}
                  </span>
                  <span className="tag tag-neutral" style={{ fontSize: 10 }}>
                    {t("plan.maxPax", { n: p.maxGroup })}
                  </span>
                </div>
                {pros[0] && <Pro>{pros[0].c.text}</Pro>}
                {cons[0] && <Con>{cons[0].c.text}</Con>}
                <div className="row" style={{ justifyContent: "space-between", marginTop: 6 }}>
                  <div className="heading" style={{ fontSize: 18 }}>
                    {usd(p.priceUsd)}
                  </div>
                  <span className="btn btn-primary" style={{ fontSize: 12 }}>
                    {t("plan.viewPlan")}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="panel" id="checks">
            <div className="heading" style={{ fontSize: 15, marginBottom: 12 }}>
              {t("editor.beforePublish")}
            </div>
            <div className="col" style={{ gap: 9, fontSize: 13 }}>
              {/* each line opens the tab that fixes it */}
              {checks.map((check) => (
                <button
                  key={check.key}
                  type="button"
                  className="row"
                  style={{
                    gap: 9,
                    color: check.ok ? "var(--color-accent-2-800)" : check.required ? "var(--color-cta-800)" : "var(--ink-55)",
                    background: "none",
                    border: 0,
                    padding: 0,
                    font: "inherit",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setTab(CHECK_TAB[check.key] ?? tab);
                    panel.current?.focus();
                  }}
                >
                  {check.ok ? <Check size={15} strokeWidth={3} aria-hidden /> : <CircleAlert size={15} strokeWidth={2.75} aria-hidden />}
                  {check.label}
                  {!check.required && !check.ok && <span className="xs">({t("common.optional")})</span>}
                </button>
              ))}
            </div>
            <p className="xs muted" style={{ margin: "12px 0 0" }}>
              {t("editor.checksNote")}
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
