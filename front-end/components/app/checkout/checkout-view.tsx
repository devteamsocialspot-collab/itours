"use client";

import { useMutation } from "@apollo/client";
import { Check, Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Brand } from "@/components/app/brand";
import { unitPrice } from "@/components/app/plan/booking-widget";
import { Photo } from "@/components/app/ui";
import { CREATE_BOOKING_MUTATION } from "@/lib/booking/queries";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useLocale, useT } from "@/lib/i18n";
import { consOf, nextDeparture } from "@/lib/plan/helpers";
import type { PayMethod, Plan, Room } from "@/lib/types";
import { addDays, day, dayRange, mnt, pick, usd } from "@/lib/utils";

const METHODS: PayMethod[] = ["CARD", "QPAY", "BANK"];

/** Checkout (wireframe 1d). Payment is simulated; the API prices the order again and holds the seats. */
export function CheckoutView({ plan, depId, pax: wanted, room }: { plan: Plan; depId: string; pax: number; room: Room }) {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const { user } = useCurrentUser();
  const [method, setMethod] = useState<PayMethod>("CARD");
  const [notes, setNotes] = useState("");
  const [accept, setAccept] = useState(false);
  const [error, setError] = useState("");
  const [book, { loading }] = useMutation(CREATE_BOOKING_MUTATION);

  const dep = plan.departures.find((d) => d.id === depId && (d.left ?? 0) > 0) ?? nextDeparture(plan);
  if (!dep) return <p className="auth muted">{t("plan.noDepartures")}</p>;
  const pax = Math.min(Math.max(wanted, 1), plan.maxGroup);
  const unit = unitPrice(plan, pax);
  const supplement = room === "SINGLE" ? (plan.singleSupplement ?? 0) * pax : 0;
  const total = unit * pax + supplement;
  const cancelUntil = day(addDays(dep.startDate, -plan.freeCancelDays), locale);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const { data } = await book({ variables: { planId: plan.id, departureId: dep.id, pax, room, method, notes, accept } });
    const res = data?.createBooking;
    if (!res?.success) return setError(res?.message ?? t("common.error"));
    router.push(`/trips/${res.booking.code}`);
  };

  return (
    <>
      <header className="topbar">
        <Brand />
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
        className="wrap two-col"
        style={{ maxWidth: 1060, display: "grid", gridTemplateColumns: "1fr 336px", gap: 30, padding: "26px 30px 36px", alignItems: "start" }}
      >
        <form onSubmit={submit}>
          <h2 style={{ margin: "0 0 4px" }}>{t("book.howPay")}</h2>
          <p style={{ fontSize: 13.5, color: "var(--ink-70)", margin: "0 0 22px" }}>{t("book.payLead", { d: cancelUntil })}</p>
          {user && user.role !== "USER" && <p className="error">{t("book.travellersOnly")}</p>}
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}

          <div className="col" style={{ gap: 10, marginBottom: 24 }}>
            {METHODS.map((value) => (
              <label key={value} className="pay-opt">
                <input type="radio" name="method" value={value} checked={method === value} onChange={() => setMethod(value)} />
                <span>
                  <span className="bold" style={{ fontSize: 14, display: "block" }}>
                    {t(`book.${value}`)}
                  </span>
                  <span className="small muted">{t(`book.${value}Sub`)}</span>
                </span>
                {value === "QPAY" && <span className="tag tag-accent-2 ml-auto">{t("book.domestic")}</span>}
              </label>
            ))}
          </div>

          {/* demo checkout: these fields are never read, so card data never leaves the browser */}
          {method === "CARD" && (
            <div className="grid-2" style={{ gap: 12, marginBottom: 10 }}>
              <div className="field" style={{ gridColumn: "span 2" }}>
                <label>{t("book.nameOnCard")}</label>
                <input className="input" defaultValue={user?.name} autoComplete="off" />
              </div>
              <div className="field" style={{ gridColumn: "span 2" }}>
                <label>{t("book.cardNumber")}</label>
                <input className="input" placeholder="4242 4242 4242 4242" inputMode="numeric" autoComplete="off" />
              </div>
              <div className="field">
                <label>{t("book.expiry")}</label>
                <input className="input" placeholder="MM / YY" autoComplete="off" />
              </div>
              <div className="field">
                <label>CVC</label>
                <input className="input" placeholder="•••" autoComplete="off" />
              </div>
            </div>
          )}
          <p className="xs muted" style={{ margin: "0 0 18px" }}>
            {t("book.demoPayment")}
          </p>

          <div className="field" style={{ marginBottom: 18 }}>
            <label htmlFor="notes">{t("book.notesLabel")}</label>
            <textarea id="notes" className="input" style={{ minHeight: 70, borderRadius: 18 }} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="panel-clay" style={{ borderRadius: 22, fontSize: 13, lineHeight: 1.6 }}>
            <strong>{t("book.confirmRead")}</strong>{" "}
            {consOf(plan)
              .map((c) => c.text.toLowerCase())
              .join("; ")}
            .
            <label className="check" style={{ marginTop: 10 }}>
              <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} required />
              <span>{t("book.acceptTradeoffs")}</span>
            </label>
          </div>

          <div className="row" style={{ gap: 14, marginTop: 22, flexWrap: "wrap" }}>
            <Link href={`/plans/${plan.slug}?dep=${dep.id}&pax=${pax}`} className="btn btn-secondary" style={{ fontSize: 14 }}>
              ← {t("common.back")}
            </Link>
            <button className="btn btn-cta" disabled={loading} style={{ fontSize: 15, paddingInline: 26, paddingBlock: 11 }}>
              {t("book.payAndConfirm", { p: usd(total) })}
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
              <span className="semi">{dayRange(dep.startDate, plan.days, locale)}</span>
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
