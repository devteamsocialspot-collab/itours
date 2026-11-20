"use client";

import { useQuery } from "@apollo/client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Footer, SiteHeader } from "@/components/app/site-header";
import { TripView } from "@/components/app/trips/trip-view";
import { BOOKING_QUERY } from "@/lib/booking/queries";
import { useT } from "@/lib/i18n";

export default function TripPage() {
  const t = useT();
  const { code } = useParams<{ code: string }>();
  const { data, loading, refetch } = useQuery(BOOKING_QUERY, { variables: { code }, fetchPolicy: "cache-and-network" });
  const booking = data?.booking?.booking;
  if (booking) return <TripView booking={booking} refetch={refetch} />;
  return (
    <>
      <SiteHeader />
      <main className="auth">
        {loading ? (
          <p className="muted" role="status">
            {t("common.loading")}
          </p>
        ) : (
          <>
            <p className="error" role="alert">
              {data?.booking?.message || t("common.error")}
            </p>
            <Link href="/trips" className="btn btn-secondary btn-sm">
              {t("nav.myTrips")}
            </Link>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
