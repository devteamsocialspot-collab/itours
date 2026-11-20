"use client";

import { useMutation } from "@apollo/client";
import { Check, CircleAlert, Star } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { Footer, SiteHeader } from "@/components/app/site-header";
import { Photo } from "@/components/app/ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CANCEL_BOOKING_MUTATION, SUBMIT_REVIEW_MUTATION } from "@/lib/booking/queries";
import { useNow, useRefetchWhenPast } from "@/lib/hooks/use-now";
import { useReport } from "@/lib/hooks/use-report";
import { useLocale, useT } from "@/lib/i18n";
import type { Booking } from "@/lib/types";
import { dateTime, day, dayRange, leftText, pick, todayUb, usd } from "@/lib/utils";

const OPTIONS = [
  [2, "trips.asDescribed"],
  [1, "trips.partly"],
  [0, "trips.notAsDescribed"],
] as const;

/**
 * After the trip: every promise and every stated downside rated 2 / 1 / 0, stars, a few words
 * (wireframe 1g). Missing lines are listed inline instead of the browser's bubble.
 */
function ReviewForm({ booking, onDone }: { booking: Booking; onDone: () => void }) {
  const t = useT();
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [stars, setStars] = useState(0);
  const [text, setText] = useState("");
  const [tried, setTried] = useState(false);
  const [submit, { loading }] = useMutation(SUBMIT_REVIEW_MUTATION);
  const report = useReport(onDone);
  const claims = booking.plan.claims ?? [];
  const unrated = claims.filter((claim) => ratings[claim.id] == null);
  const missing = [...unrated.map((claim) => claim.text), ...(stars ? [] : [t("trips.overall")])];
  const id = (part: string) => `rate-${booking.id}-${part}`;
  const groups = [
    { kind: "PRO", Icon: Check, color: "var(--color-accent-2-600)", title: "trips.promisesTitle" },
    { kind: "CON", Icon: CircleAlert, color: "var(--color-cta-700)", title: "trips.downsidesTitle" },
  ] as const;

  return (
    <form
      className="panel-sage form"
      style={{ marginTop: 12 }}
      noValidate
      onSubmit={async (event) => {
        event.preventDefault();
        if (missing.length) {
          setTried(true);
          document.getElementById(id(unrated[0]?.id ?? "stars"))?.focus();
          return;
        }
        const { data } = await submit({
          variables: { bookingId: booking.id, stars, text, ratings: Object.entries(ratings).map(([claimId, score]) => ({ claimId, score })) },
        });
        await report(data?.submitReview);
      }}
    >
      <div style={{ fontSize: 13 }}>{t("trips.rateLead")}</div>
      {groups.map(({ kind, Icon, color, title }) => (
        <section key={kind} className="col" style={{ gap: 12 }}>
          <div>
            <h4 className="row" style={{ gap: 7, fontSize: 16, margin: 0 }}>
              <Icon size={16} strokeWidth={2.75} aria-hidden style={{ color, flex: "none" }} />
              {t(title)}
            </h4>
            {kind === "CON" && <div className="small" style={{ marginTop: 4 }}>{t("trips.downsidesHint")}</div>}
          </div>
          {claims
            .filter((claim) => claim.kind === kind)
            .map((claim) => (
              <fieldset key={claim.id} id={id(claim.id)} tabIndex={-1} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
                <legend style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 6, padding: 0 }}>{claim.text}</legend>
                <div className="seg seg-mini" style={{ background: "var(--color-bg)" }}>
                  {OPTIONS.map(([value, key]) => (
                    <label key={value} className="seg-opt">
                      <input type="radio" name={id(claim.id)} checked={ratings[claim.id] === value} onChange={() => setRatings((r) => ({ ...r, [claim.id]: value }))} />
                      {t(key)}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
        </section>
      ))}
      <fieldset className="field" id={id("stars")} tabIndex={-1}>
        <legend>{t("trips.overall")}</legend>
        <div className="seg seg-mini" style={{ background: "var(--color-bg)" }}>
          {[5, 4, 3, 2, 1].map((value) => (
            <label key={value} className="seg-opt">
              <input type="radio" name={id("stars")} checked={stars === value} onChange={() => setStars(value)} />
              <span aria-hidden>{value}</span>
              <Star size={12} fill="currentColor" aria-hidden style={{ color: "var(--color-cta)" }} />
              <span className="sr-only">{t("trips.starsN", { n: value })}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="field">
        <label htmlFor={`text${booking.id}`}>{t("trips.yourReview")}</label>
        <textarea id={`text${booking.id}`} className="input" style={{ borderRadius: 18, background: "var(--color-bg)" }} value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      {tried && missing.length > 0 && (
        <div className="error" role="alert">
          {t("trips.rateMissing")}
          <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
            {missing.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="row" style={{ flexWrap: "wrap" }}>
        <button className="btn btn-primary" disabled={loading}>
          {t("trips.submitReview")}
        </button>
        <span className="small">{t("trips.ratedN", { n: claims.length - unrated.length, total: claims.length })}</span>
      </div>
    </form>
  );
}

/** Cancelling says what comes back before anything happens: nothing paid yet, all of it, or half. */
function CancelDialog({ booking, onDone }: { booking: Booking; onDone: () => void }) {
  const t = useT();
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [cancel, { loading }] = useMutation(CANCEL_BOOKING_MUTATION);
  const report = useReport(onDone);
  const keep = useRef<HTMLButtonElement>(null);
  const refund =
    booking.status === "PENDING_PAYMENT"
      ? t("trips.refundNone")
      : todayUb() <= booking.freeCancelUntil
        ? t("trips.refundFull", { p: usd(booking.totalUsd) })
        : t("trips.refundHalf", { d: day(booking.freeCancelUntil, locale), p: usd(booking.totalUsd / 2) });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="btn btn-ghost btn-xs">{t("trips.cancelBooking")}</DialogTrigger>
      <DialogContent
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          keep.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>{t("trips.cancelTitle")}</DialogTitle>
          <DialogDescription className="small" style={{ fontSize: 13.5 }}>
            {refund}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button ref={keep} type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
            {t("trips.keepBooking")}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={loading}
            onClick={async () => {
              const { data } = await cancel({ variables: { id: booking.id } });
              setOpen(false);
              await report(data?.cancelBooking);
            }}
          >
            {t("trips.cancelBooking")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const STAGE_TAG: Record<string, string> = { CANCELLED: "tag-neutral", EXPIRED: "tag-neutral", COMPLETED: "tag-accent-2", CONFIRMED: "tag-accent-2", TRAVELLING: "tag-accent-2" };

/** My trips (wireframe 1f): bookings newest departure first, with cancel and the review form. */
export function TripsView({ bookings, loading, error, refetch }: { bookings: Booking[]; loading: boolean; error?: string; refetch: () => void }) {
  const t = useT();
  const { locale } = useLocale();
  const now = useNow();
  const unrated = bookings.filter((b) => b.canReview);

  // a hold running out while the list is open: refresh once, so it shows as expired
  useRefetchWhenPast(bookings.filter((b) => b.stage === "PENDING_PAYMENT").map((b) => b.payBy), now, refetch);

  return (
    <>
      <SiteHeader />
      <main className="wrap gutter" style={{ maxWidth: 900, paddingBlock: "28px 40px" }}>
        <h2>{t("trips.title")}</h2>
        {error && <p className="error">{error}</p>}
        {!loading && bookings.length === 0 && (
          <p className="muted">
            {t("trips.noTrips")} <Link href="/search">{t("nav.search")} →</Link>
          </p>
        )}
        <div className="col" style={{ gap: 16 }}>
          {bookings.map((booking) => (
            <article key={booking.id} className="panel two-col" style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 18 }}>
              <Photo src={booking.plan.photos[0]} alt={booking.plan.region} style={{ borderRadius: 18, height: 100 }} />
              <div style={{ minWidth: 0 }}>
                <div className="row" style={{ flexWrap: "wrap" }}>
                  <span className="xs muted">
                    {booking.code} · {booking.plan.operator.name}
                  </span>
                  <span className={`tag ml-auto ${STAGE_TAG[booking.stage] ?? "tag-accent"}`}>{t(`trips.stage.${booking.stage}`)}</span>
                </div>
                <Link href={`/plans/${booking.plan.slug}`} className="plain heading" style={{ fontSize: 18, display: "block", margin: "4px 0 6px" }}>
                  {pick(locale, booking.plan.titleEn, booking.plan.titleMn)}
                </Link>
                <div className="small muted">
                  {dayRange(booking.departure.startDate, booking.plan.days, locale)} · {booking.pax} {t("home.travellers").toLowerCase()} · {usd(booking.totalUsd)}
                </div>
                {booking.stage === "PENDING_PAYMENT" && booking.payBy && (
                  <div className="small" style={{ color: "var(--color-cta-800)", marginTop: 2 }}>
                    {t("trips.payBy", { time: dateTime(booking.payBy, locale), left: leftText(t, booking.payBy, now) })}
                  </div>
                )}
                <div className="row" style={{ marginTop: 10, flexWrap: "wrap" }}>
                  {booking.stage !== "CANCELLED" && booking.stage !== "COMPLETED" && (
                    <Link href={`/trips/${booking.code}`} className="btn btn-secondary btn-xs">
                      {t("trips.viewBooking")}
                    </Link>
                  )}
                  {booking.stage === "EXPIRED" && (
                    <Link href={`/plans/${booking.plan.slug}`} className="btn btn-secondary btn-xs">
                      {t("trip.bookAgain")}
                    </Link>
                  )}
                  {booking.canCancel && <CancelDialog booking={booking} onDone={refetch} />}
                  {booking.hasReview && (
                    <span className="small" style={{ color: "var(--color-accent-2-800)" }}>
                      ✓ {t("trips.reviewed")}
                    </span>
                  )}
                </div>
                {booking.canReview && (
                  <details open={unrated.length === 1} style={{ marginTop: 14 }}>
                    <summary className="btn btn-primary btn-sm">{t("trips.rateTrip")}</summary>
                    <ReviewForm booking={booking} onDone={refetch} />
                  </details>
                )}
              </div>
            </article>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
