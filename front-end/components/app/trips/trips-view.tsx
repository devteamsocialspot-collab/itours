"use client";

import { useMutation } from "@apollo/client";
import Link from "next/link";
import { useState } from "react";
import { Footer, SiteHeader } from "@/components/app/site-header";
import { Photo } from "@/components/app/ui";
import { CANCEL_BOOKING_MUTATION, SUBMIT_REVIEW_MUTATION } from "@/lib/booking/queries";
import { useReport } from "@/lib/hooks/use-report";
import { useLocale, useT } from "@/lib/i18n";
import type { Booking } from "@/lib/types";
import { dayRange, pick, usd } from "@/lib/utils";

/** After the trip: every promise of the plan rated 2 / 1 / 0, stars, a few words (wireframe 1g). */
function ReviewForm({ booking, onDone }: { booking: Booking; onDone: () => void }) {
  const t = useT();
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [stars, setStars] = useState(0);
  const [text, setText] = useState("");
  const [submit, { loading }] = useMutation(SUBMIT_REVIEW_MUTATION);
  const report = useReport(onDone);
  const claims = booking.plan.claims ?? [];

  return (
    <form
      className="panel-sage form"
      style={{ marginTop: 12 }}
      onSubmit={async (event) => {
        event.preventDefault();
        const { data } = await submit({
          variables: { bookingId: booking.id, stars, text, ratings: Object.entries(ratings).map(([claimId, score]) => ({ claimId, score })) },
        });
        await report(data?.submitReview);
      }}
    >
      <div style={{ fontSize: 13 }}>{t("trips.rateLead")}</div>
      {claims.map((claim) => (
        <fieldset key={claim.id} style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 6 }}>
            {claim.kind === "CON" ? "⚠ " : "✓ "}
            {claim.text}
          </legend>
          <div className="seg seg-mini" style={{ background: "var(--color-bg)" }}>
            {(
              [
                [2, "trips.asDescribed"],
                [1, "trips.partly"],
                [0, "trips.notAsDescribed"],
              ] as const
            ).map(([value, key]) => (
              <label key={value} className="seg-opt">
                <input type="radio" name={`c${claim.id}`} checked={ratings[claim.id] === value} onChange={() => setRatings((r) => ({ ...r, [claim.id]: value }))} required />
                {t(key)}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <div className="field">
        <label>{t("trips.overall")}</label>
        <div className="seg seg-mini" style={{ background: "var(--color-bg)" }}>
          {[5, 4, 3, 2, 1].map((value) => (
            <label key={value} className="seg-opt">
              <input type="radio" name="stars" checked={stars === value} onChange={() => setStars(value)} required />
              <span style={{ color: "var(--color-cta)" }}>{"★".repeat(value)}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="field">
        <label htmlFor={`text${booking.id}`}>{t("trips.yourReview")}</label>
        <textarea id={`text${booking.id}`} className="input" style={{ borderRadius: 18, background: "var(--color-bg)" }} value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      <button className="btn btn-primary" disabled={loading} style={{ alignSelf: "flex-start" }}>
        {t("trips.submitReview")}
      </button>
    </form>
  );
}

const STAGE_TAG: Record<string, string> = { CANCELLED: "tag-neutral", COMPLETED: "tag-accent-2", CONFIRMED: "tag-accent-2", TRAVELLING: "tag-accent-2" };

/** My trips (wireframe 1f): bookings newest departure first, with cancel and the review form. */
export function TripsView({ bookings, loading, error, refetch }: { bookings: Booking[]; loading: boolean; error?: string; refetch: () => void }) {
  const t = useT();
  const { locale } = useLocale();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [cancel] = useMutation(CANCEL_BOOKING_MUTATION);
  const report = useReport(refetch);
  const unrated = bookings.filter((b) => b.canReview);

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
                <div className="row" style={{ marginTop: 10 }}>
                  {booking.stage !== "CANCELLED" && booking.stage !== "COMPLETED" && (
                    <Link href={`/trips/${booking.code}`} className="btn btn-secondary btn-xs">
                      {t("trips.viewBooking")}
                    </Link>
                  )}
                  {booking.canCancel && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={async () => {
                        if (confirming !== booking.id) return setConfirming(booking.id);
                        const { data } = await cancel({ variables: { id: booking.id } });
                        setConfirming(null);
                        await report(data?.cancelBooking);
                      }}
                    >
                      {confirming === booking.id ? t("trips.confirmCancel") : t("trips.cancelBooking")}
                    </button>
                  )}
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
