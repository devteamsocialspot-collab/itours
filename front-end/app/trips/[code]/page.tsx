"use client";

import { useQuery } from "@apollo/client";
import { useParams } from "next/navigation";
import { TripView } from "@/components/app/trips/trip-view";
import { BOOKING_QUERY } from "@/lib/booking/queries";

export default function TripPage() {
  const { code } = useParams<{ code: string }>();
  const { data, loading } = useQuery(BOOKING_QUERY, { variables: { code }, fetchPolicy: "cache-and-network" });
  const booking = data?.booking?.booking;
  if (!booking) return <p className="auth muted">{loading ? "…" : data?.booking?.message}</p>;
  return <TripView booking={booking} />;
}
