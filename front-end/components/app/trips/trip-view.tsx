"use client";

import { Check } from "lucide-react";
import { Footer, SiteHeader } from "@/components/app/site-header";
import { Photo } from "@/components/app/ui";
import { useLocale, useT } from "@/lib/i18n";
import type { Booking } from "@/lib/types";
import { addDays, day, mnt, pick, usd } from "@/lib/utils";

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

/** The confirmation and voucher (wireframe 1e); printing hides the chrome. */
export function TripView({ booking }: { booking: Booking }) {
  const t = useT();
  const { locale } = useLocale();
  const held = booking.status === "PENDING_PAYMENT";
  const cancelled = booking.status === "CANCELLED";
  const replyH = Math.ceil(booking.plan.operator.replyHours);
  const firstName = (booking.traveller?.name ?? "").split(" ")[0];
  const cancelUntil = day(booking.freeCancelUntil, locale);
  const steps = [
    t("trip.next1", { h: replyH }),
    t("trip.next2", { d: cancelUntil }),
    t("trip.next3", { d: day(addDays(booking.departure.startDate, -1), locale) }),
    t("trip.next4"),
  ];

  return (
    <>
      <SiteHeader />
      <main className="wrap" style={{ maxWidth: 860, paddingBottom: 34 }}>
        <div className="row" style={{ padding: "34px 30px 0", gap: 20, alignItems: "flex-start" }}>
          <div
            className="score"
            style={{ width: 56, height: 56, background: cancelled ? "var(--color-neutral-500)" : held ? "var(--color-accent)" : "var(--color-accent-2-600)", color: "#eaeee9" }}
          >
            <Check size={28} strokeWidth={3} />
          </div>
          <div>
            <h1 style={{ fontSize: 36, lineHeight: 1.08, margin: "0 0 8px" }}>
              {cancelled ? t("trip.cancelledTitle") : t(held ? "trip.heldTitle" : "trip.confirmedTitle", { name: firstName })}
            </h1>
            {!cancelled && (
              <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ink-75)", margin: 0, maxWidth: "36em" }}>
                {held
                  ? t("trip.heldLead", { p: `${usd(booking.totalUsd)} (${mnt(booking.totalUsd)})`, code: booking.code })
                  : t("trip.confirmedLead", { op: booking.plan.operator.name, h: replyH, code: booking.code })}
              </p>
            )}
            {held && (
              <p className="ok-msg" style={{ marginTop: 10 }}>
                {t("trip.bankDetails")}
              </p>
            )}
          </div>
        </div>

        <div style={{ padding: "26px 30px 0" }}>
          <div className="panel two-col" style={{ borderRadius: 28, padding: 20, display: "grid", gridTemplateColumns: "180px 1fr", gap: 20 }}>
            <Photo src={booking.plan.photos[0]} alt={booking.plan.region} style={{ borderRadius: 20, height: 132 }} />
            <div>
              <div className="muted" style={{ fontSize: 11.5, marginBottom: 3 }}>
                {booking.plan.operator.name} · {t("plan.expectationScore")} {booking.plan.score ?? "–"}
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
                  <div className="muted">{held ? t("plan.total") : t("trip.paid")}</div>
                  <div className="bold">{usd(booking.totalUsd)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!cancelled && (
          <div className="two-col" style={{ padding: "26px 30px 0", display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, alignItems: "start" }}>
            <div>
              <h4 style={{ margin: "0 0 12px" }}>{t("trip.whatNext")}</h4>
              <div className="col" style={{ gap: 12 }}>
                {steps.map((step, i) => {
                  const [head, ...rest] = step.split(" — ");
                  return (
                    <div key={i} className="row" style={{ gap: 12, alignItems: "flex-start" }}>
                      <div className="num" style={i === 3 ? { background: "var(--color-accent-200)", color: "var(--color-accent-800)" } : undefined}>
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
                <button type="button" className="btn btn-primary btn-sm" onClick={() => window.print()}>
                  {t("trip.printVoucher")}
                </button>
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
