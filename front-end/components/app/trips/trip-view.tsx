"use client";

import { Check, Clock, Copy, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Footer, SiteHeader } from "@/components/app/site-header";
import { Photo } from "@/components/app/ui";
import { useNow, useRefetchWhenPast } from "@/lib/hooks/use-now";
import { useLocale, useT } from "@/lib/i18n";
import type { Booking } from "@/lib/types";
import { addDays, dateTime, day, leftText, mnt, MNT_PER_USD, pick, usd } from "@/lib/utils";

const ymd = (date: Date) => date.toISOString().slice(0, 10).replaceAll("-", "");

/** "Add to calendar": a one-event iCalendar file, built in the browser from what the page already shows. */
const calendarHref = (booking: Booking) =>
  `data:text/calendar;charset=utf-8,${encodeURIComponent(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//itours.mn//Booking//EN",
      "BEGIN:VEVENT",
      `UID:${booking.code}@itours.mn`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
      `DTSTART;VALUE=DATE:${ymd(addDays(booking.departure.startDate, 0))}`,
      `DTEND;VALUE=DATE:${ymd(addDays(booking.departure.startDate, booking.plan.days))}`,
      `SUMMARY:${booking.plan.titleEn} (${booking.code})`,
      "LOCATION:Ulaanbaatar, Mongolia",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n"),
  )}`;

/** Copies one bank detail; the label reads "Copied" for 2 s. */
function CopyButton({ value, label }: { value: string; label: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);
  const text = t(copied ? "common.copied" : "common.copy");
  return (
    <button
      type="button"
      className="btn btn-ghost btn-xs"
      aria-label={`${text}: ${label}`}
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
      }}
    >
      {copied ? <Check size={12} aria-hidden /> : <Copy size={12} aria-hidden />}
      {text}
    </button>
  );
}

const PAID_STAGES = ["PAID", "CONFIRMED", "TRAVELLING", "COMPLETED"];

/** The confirmation and voucher (wireframe 1e), one message per stage; printing hides the chrome. */
export function TripView({ booking, refetch }: { booking: Booking; refetch?: () => unknown }) {
  const t = useT();
  const { locale } = useLocale();
  const now = useNow();
  const { stage } = booking;
  const held = stage === "PENDING_PAYMENT";
  const expired = stage === "EXPIRED";
  const cancelled = stage === "CANCELLED";
  const replyH = Math.ceil(booking.plan.operator.replyHours);
  const firstName = (booking.traveller?.name ?? "").split(" ")[0];
  const op = booking.plan.operator.name;
  const cancelUntil = day(booking.freeCancelUntil, locale);
  const payBy = booking.payBy ? dateTime(booking.payBy, locale) : "";
  const amount = `${usd(booking.totalUsd)} (${mnt(booking.totalUsd)})`;

  // the deadline passing on an open page: ask the server once, and the page turns into the expired state
  useRefetchWhenPast(held ? [booking.payBy] : [], now, refetch);

  const [Icon, tone] = held
    ? [Clock, "var(--color-cta-700)"]
    : expired || cancelled
      ? [X, "var(--color-neutral-500)"]
      : [Check, "var(--color-accent-2-600)"];
  const title = held
    ? t("trip.heldTitle", { name: firstName })
    : expired
      ? t("trip.expiredTitle")
      : cancelled
        ? t("trip.cancelledTitle")
        : stage === "PAID"
          ? t("trip.paidTitle", { name: firstName })
          : stage === "COMPLETED"
            ? t("trip.completedTitle", { name: firstName })
            : t("trip.confirmedTitle", { name: firstName });
  const paidLead = t("trip.paidLead", { op, h: replyH, code: booking.code });
  const lead = held
    ? t("trip.heldLead", { p: amount, time: payBy, code: booking.code })
    : expired
      ? t("trip.expiredLead", { p: amount, time: payBy, code: booking.code })
      : cancelled
        ? booking.cancelledBy === "USER"
          ? t("trip.cancelledByYou")
          : t("trip.cancelledByOp", { op })
        : stage === "PAID"
          ? paidLead
          : stage === "COMPLETED"
            ? ""
            : booking.guide
              ? t("trip.confirmedLead", { op, guide: booking.guide, code: booking.code })
              : paidLead;

  const steps = [
    held ? t("trip.nextPay", { time: payBy }) : t("trip.next1", { h: replyH }),
    t("trip.next2", { d: cancelUntil }),
    t("trip.next3", { d: day(addDays(booking.departure.startDate, -1), locale) }),
    t("trip.next4"),
  ];
  // value shown, value copied: the account number without spaces, the amount as digits only
  const bank: [string, React.ReactNode, string][] = [
    [t("trip.bank"), t("trip.bankName"), t("trip.bankName")],
    [t("trip.account"), t("trip.bankAccount"), t("trip.bankAccount").replace(/\s/g, "")],
    [t("trip.recipient"), t("trip.bankRecipient"), t("trip.bankRecipient")],
    [
      t("trip.amount"),
      <>
        {mnt(booking.totalUsd)} <span className="muted">{usd(booking.totalUsd)}</span>
      </>,
      String(Math.round(booking.totalUsd * MNT_PER_USD)),
    ],
    [t("trip.reference"), booking.code, booking.code],
  ];

  return (
    <>
      <SiteHeader />
      <main className="wrap" style={{ maxWidth: 860, paddingBottom: 34 }}>
        <div className="row gutter" style={{ paddingTop: 34, gap: 20, alignItems: "flex-start" }}>
          {/* announced once when the stage changes (held → expired); the minute countdown stays outside it */}
          <div role="status" className="row" style={{ gap: 20, alignItems: "flex-start", minWidth: 0 }}>
            <div className="score" style={{ width: 56, height: 56, background: tone, color: "#fff" }}>
              <Icon size={28} strokeWidth={3} aria-hidden />
            </div>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: "clamp(26px, 7vw, 36px)", lineHeight: 1.08, margin: "0 0 8px" }}>{title}</h1>
              {lead && <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ink-75)", margin: 0, maxWidth: "36em" }}>{lead}</p>}
            </div>
          </div>
        </div>

        {held && booking.payBy && (
          <div className="gutter" style={{ paddingTop: 18 }}>
            <div className="panel-clay">
              <div className="row-base" style={{ flexWrap: "wrap", gap: "2px 10px" }}>
                <span className="small bold">{t("trip.payBy")}</span>
                <span className="heading" style={{ fontSize: 20 }}>
                  {payBy}
                </span>
                <span className="small">
                  · {leftText(t, booking.payBy, now)} · {t("trip.ubTime")}
                </span>
              </div>
              <div className="sum-lines" style={{ marginTop: 10 }}>
                {bank.map(([label, value, copy]) => (
                  <div key={label} style={{ alignItems: "center" }}>
                    <span>{label}</span>
                    <span className="row" style={{ gap: 4 }}>
                      <span className="semi">{value}</span>
                      <CopyButton value={copy} label={label} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {(expired || cancelled || (stage === "COMPLETED" && booking.canReview)) && (
          <div className="row gutter no-print" style={{ paddingTop: 18, flexWrap: "wrap" }}>
            {expired && (
              <Link href={`/plans/${booking.plan.slug}`} className="btn btn-cta">
                {t("trip.bookAgain")}
              </Link>
            )}
            {expired && (
              <Link href="/search" className="btn btn-secondary">
                {t("nav.search")}
              </Link>
            )}
            {cancelled && (
              <Link href="/search" className="btn btn-secondary">
                {t("trip.findAnother")}
              </Link>
            )}
            {stage === "COMPLETED" && booking.canReview && (
              <Link href="/trips" className="btn btn-primary">
                {t("trips.rateTrip")}
              </Link>
            )}
          </div>
        )}

        <div className="gutter" style={{ paddingTop: 26 }}>
          <div className="panel two-col" style={{ borderRadius: 28, padding: 20, display: "grid", gridTemplateColumns: "180px 1fr", gap: 20 }}>
            <Photo src={booking.plan.photos[0]} alt={booking.plan.region} style={{ borderRadius: 20, height: 132 }} />
            <div>
              <div className="muted" style={{ fontSize: 11.5, marginBottom: 3 }}>
                {op} · {t("plan.expectationScore")} {booking.plan.score ?? "–"}
              </div>
              <div className="heading" style={{ fontSize: 21, marginBottom: 12 }}>
                {pick(locale, booking.plan.titleEn, booking.plan.titleMn)}
              </div>
              <div className="grid-4 keep-m" style={{ gap: 12, fontSize: 12.5 }}>
                <div>
                  <div className="muted">{t("plan.departure")}</div>
                  <div className="bold">{day(booking.departure.startDate, locale)}</div>
                </div>
                <div>
                  <div className="muted">{t("book.pickup")}</div>
                  <div className="bold">{t("book.pickupValue")}</div>
                </div>
                <div>
                  <div className="muted">{t("home.travellers")}</div>
                  <div className="bold">
                    {booking.pax} · {t(`plan.${booking.room}`)}
                  </div>
                </div>
                <div>
                  <div className="muted">{PAID_STAGES.includes(stage) ? t("trip.paid") : t("plan.total")}</div>
                  <div className="bold">{usd(booking.totalUsd)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!cancelled && !expired && (
          <div className="two-col gutter" style={{ paddingTop: 26, display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, alignItems: "start" }}>
            <div>
              <h4 style={{ margin: "0 0 12px" }}>{t("trip.whatNext")}</h4>
              <div className="col" style={{ gap: 12 }}>
                {steps.map((step, i) => {
                  const [head, ...rest] = step.split(" — ");
                  return (
                    <div key={i} className="row" style={{ gap: 12, alignItems: "flex-start" }}>
                      <div className="num" style={i === 3 ? { background: "var(--color-accent-200)", color: "var(--color-accent)" } : undefined}>
                        {i + 1}
                      </div>
                      <div style={{ fontSize: 13.5, lineHeight: 1.55 }}>
                        <b>{head}</b>
                        {rest.length ? ` — ${rest.join(" — ")}` : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="row no-print" style={{ marginTop: 20, flexWrap: "wrap" }}>
                {/* nothing to print until it is paid */}
                {!held && (
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => window.print()}>
                    {t("trip.printVoucher")}
                  </button>
                )}
                <a href={calendarHref(booking)} download={`${booking.code}.ics`} className="btn btn-secondary btn-sm">
                  {t("trip.addCalendar")}
                </a>
              </div>
            </div>
            <div className="panel-clay" style={{ borderRadius: 26 }}>
              <div className="heading" style={{ fontSize: 16, marginBottom: 8 }}>
                {t("trip.insuranceTitle")}
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.6, margin: "0 0 12px", opacity: 0.85 }}>{t("trip.insuranceText")}</p>
              <div className="divider" style={{ background: "rgba(34, 40, 49,.14)" }} />
              <div style={{ fontSize: 12.5, lineHeight: 1.6, opacity: 0.85 }}>{t("trip.changeDates", { d: cancelUntil })}</div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
