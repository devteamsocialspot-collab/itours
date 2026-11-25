"use client";

import { useMutation } from "@apollo/client";
import { Check, Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Brand } from "@/components/app/brand";
import { unitPrice } from "@/components/app/plan/booking-widget";
import { Con, Photo } from "@/components/app/ui";
import { CREATE_BOOKING_MUTATION } from "@/lib/booking/queries";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useLocale, useT } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/dictionaries";
import { consOf, nextDeparture } from "@/lib/plan/helpers";
import type { PayMethod, Plan, Room } from "@/lib/types";
import { addDays, day, dayRange, mnt, pick, usd } from "@/lib/utils";

/** Tögrög from a Mongolian bank, or a card from anywhere else (Stripe). */
const GROUPS: [label: string, methods: PayMethod[]][] = [
  ["book.fromMongolia", ["QPAY", "BANK"]],
  ["book.fromAbroad", ["CARD"]],
];

/** QPay for a traveller from Mongolia, or with no country on file who reads the site in Mongolian; a card otherwise. */
const defaultMethod = (country: string | undefined, locale: Locale): PayMethod => {
  const c = country?.trim() ?? "";
  return /^(mongol|монгол|mn$)/i.test(c) || (!c && locale === "mn") ? "QPAY" : "CARD";
};

/** Checkout (wireframe 1d). The API prices the order again, holds the seats, then opens QPay or Stripe. */
export function CheckoutView({ plan, depId, pax: wanted, room, cancelled }: { plan: Plan; depId: string; pax: number; room: Room; cancelled?: boolean }) {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const { user } = useCurrentUser();
  // the default follows the traveller's profile once it loads, until they pick one themselves
  const [picked, setPicked] = useState<PayMethod | null>(null);
  const method = picked ?? defaultMethod(user?.country, locale);
  const [notes, setNotes] = useState("");
  const [accept, setAccept] = useState(false);
  const [error, setError] = useState("");
  const [book, { loading }] = useMutation(CREATE_BOOKING_MUTATION);

  const pax = Math.min(Math.max(wanted, 1), plan.maxGroup);
  // the next departure only when none was picked: a picked one that sold out is never swapped silently (WCAG 3.3.4)
  const dep = depId ? (plan.departures.find((d) => d.id === depId) ?? null) : nextDeparture(plan);
  const gone = Boolean(depId) && (!dep || (dep.left ?? 0) < pax);
  if (!dep && !gone) return <p className="auth muted">{t("plan.noDepartures")}</p>;
  const unit = unitPrice(plan, pax);
  const supplement = room === "SINGLE" ? (plan.singleSupplement ?? 0) * pax : 0;
  const total = unit * pax + supplement;
  const cancelUntil = dep ? day(addDays(dep.startDate, -plan.freeCancelDays), locale) : "–";
  const blocked = gone || Boolean(user && user.role !== "USER");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!dep || blocked) return;
    setError("");
    const { data } = await book({ variables: { planId: plan.id, departureId: dep.id, pax, room, method, notes, accept } });
    const res = data?.createBooking;
    if (!res?.success) return setError(res?.message ?? t("common.error"));
    // a card goes to Stripe's page and comes back to the booking; QPay and transfers go there now
    if (res.booking.payLink?.url) window.location.assign(res.booking.payLink.url);
    else router.push(`/trips/${res.booking.code}`);
  };

  return (
    <>
      <header className="topbar">
        <Brand />
        <span className="small show-m">{t("book.stepOf", { n: 2, step: t("book.stepPayment") })}</span>
        <div className="steps hide-m">
          <span className="row" style={{ gap: 6, color: "var(--color-accent-2-800)" }}>
            <span className="n" style={{ background: "var(--color-accent-2-600)", color: "#eaeee9" }}>
              <Check size={11} strokeWidth={3} />
            </span>
            {t("book.stepTravellers")}
          </span>
          <span className="ln" />
          <span className="row bold" style={{ gap: 6 }}>
            <span className="n" style={{ background: "var(--color-accent)", color: "var(--color-bg)" }}>
              2
            </span>
            {t("book.stepPayment")}
          </span>
          <span className="ln" />
          <span className="row" style={{ gap: 6, color: "var(--ink-45)" }}>
            <span className="n" style={{ border: "1px solid var(--color-divider)" }}>
              3
            </span>
            {t("book.stepConfirm")}
          </span>
        </div>
        <div className="row small" style={{ gap: 7, color: "var(--ink-60)" }}>
          <Lock size={14} strokeWidth={2.75} />
          {t("book.secureCheckout")}
        </div>
      </header>

      <main
        className="wrap gutter two-col"
        style={{ maxWidth: 1060, display: "grid", gridTemplateColumns: "1fr 336px", gap: 30, paddingBlock: "26px 36px", alignItems: "start" }}
      >
        <form onSubmit={submit}>
          <h2 style={{ margin: "0 0 4px" }}>{t("book.howPay")}</h2>
          <p style={{ fontSize: 13.5, color: "var(--ink-70)", margin: "0 0 22px" }}>{t("book.payLead", { op: plan.operator.name, d: cancelUntil })}</p>
          {gone && (
            <div role="alert" className="error col" style={{ gap: 10, alignItems: "flex-start", marginBottom: 14 }}>
              {t("book.depGone", { n: pax })}
              <Link href={`/plans/${plan.slug}?pax=${pax}#book`} className="btn btn-secondary btn-sm">
                {t("book.chooseDate")}
              </Link>
            </div>
          )}
          {user && user.role !== "USER" && <p className="error">{t("book.travellersOnly")}</p>}
          {cancelled && (
            <p role="status" className="small" style={{ margin: "0 0 14px" }}>
              {t("book.cardCancelled")}
            </p>
          )}
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}

          {GROUPS.map(([label, methods]) => (
            <fieldset key={label} className="col" style={{ gap: 10, margin: "0 0 20px", padding: 0, border: 0, minWidth: 0 }}>
              <legend className="kicker" style={{ padding: 0, marginBottom: 8 }}>
                {t(label)}
              </legend>
              {methods.map((value) => (
                <label key={value} className="pay-opt">
                  <input type="radio" name="method" value={value} checked={method === value} onChange={() => setPicked(value)} />
                  <span>
                    <span className="bold" style={{ fontSize: 14, display: "block" }}>
                      {t(`book.${value}`)}
                    </span>
                    <span className="small muted">{t(`book.${value}Sub`)}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          ))}

          <div className="field" style={{ marginBottom: 18 }}>
            <label htmlFor="notes">{t("book.notesLabel")}</label>
            <textarea id="notes" className="input" style={{ minHeight: 70, borderRadius: 18 }} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="panel-clay" style={{ borderRadius: 22, fontSize: 13, lineHeight: 1.6 }}>
            <strong style={{ display: "block", marginBottom: 6 }}>{t("book.confirmRead")}</strong>
            <div className="col" style={{ gap: 4 }}>
              {consOf(plan).map((c) => (
                <Con key={c.id}>{c.text}</Con>
              ))}
            </div>
            <label className="check" style={{ marginTop: 10 }}>
              <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} required />
              <span>{t("book.acceptTradeoffs")}</span>
            </label>
          </div>

          <div className="row" style={{ gap: 14, marginTop: 22, flexWrap: "wrap" }}>
            <Link href={`/plans/${plan.slug}?${dep ? `dep=${dep.id}&` : ""}pax=${pax}`} className="btn btn-secondary" style={{ fontSize: 14 }}>
              ← {t("common.back")}
            </Link>
            {/* the label runs long ("$1,240 төлж суудлаа баталгаажуулах"): it wraps on a narrow phone */}
            <button className="btn btn-cta" disabled={loading || blocked} style={{ fontSize: 15, paddingInline: 26, paddingBlock: 11, whiteSpace: "normal" }}>
              {method === "BANK" ? t("book.holdSeats") : t("book.payAndConfirm", { p: usd(total) })}
            </button>
          </div>
        </form>

        <aside className="panel" style={{ borderRadius: 28, padding: 20, boxShadow: "var(--shadow-md)" }}>
          <Photo src={plan.photos[0]} alt={plan.region} style={{ borderRadius: 18, height: 118, marginBottom: 14 }} />
          <div className="muted" style={{ fontSize: 11.5, marginBottom: 4 }}>
            {plan.operator.name}
          </div>
          <div className="heading" style={{ fontSize: 17, marginBottom: 12 }}>
            {pick(locale, plan.titleEn, plan.titleMn)}
          </div>
          <div className="sum-lines">
            <div>
              <span className="muted">{t("plan.departure")}</span>
              <span className="semi">{dep ? dayRange(dep.startDate, plan.days, locale) : "–"}</span>
            </div>
            <div>
              <span className="muted">{t("home.travellers")}</span>
              <span className="semi">
                {pax} · {room === "SINGLE" ? t("plan.single", { p: usd(plan.singleSupplement ?? 0) }) : t("plan.TWIN")}
              </span>
            </div>
            <div>
              <span className="muted">{t("book.pickup")}</span>
              <span className="semi">{t("book.pickupValue")}</span>
            </div>
          </div>
          <div className="sum-lines" style={{ marginTop: 10 }}>
            <div>
              <span className="muted">
                {usd(unit)} × {pax}
              </span>
              <span>{usd(unit * pax)}</span>
            </div>
            {supplement > 0 && (
              <div>
                <span className="muted">{t("plan.room")}</span>
                <span>{usd(supplement)}</span>
              </div>
            )}
            <div>
              <span className="muted">{t("book.serviceFee")}</span>
              <span>$0</span>
            </div>
            <div className="heading" style={{ fontSize: 19, paddingTop: 10, marginTop: 8, borderTop: "1px solid var(--color-divider)" }}>
              <span>{t("plan.total")}</span>
              <span>{usd(total)}</span>
            </div>
            <div className="right xs muted" style={{ display: "block" }}>
              {mnt(total)}
            </div>
          </div>
          <div className="row" style={{ gap: 8, alignItems: "flex-start", marginTop: 14, fontSize: 11.5, lineHeight: 1.5, color: "var(--ink-60)" }}>
            <ShieldCheck size={14} strokeWidth={2.75} style={{ marginTop: 2, flex: "none" }} />
            {t("book.escrowNote", { op: plan.operator.name })}
          </div>
        </aside>
      </main>
    </>
  );
}
