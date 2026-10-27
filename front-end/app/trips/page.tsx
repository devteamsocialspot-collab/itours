"use client";

import { useQuery } from "@apollo/client";
import { TripsView } from "@/components/app/trips/trips-view";
import { MY_BOOKINGS_QUERY } from "@/lib/booking/queries";

export default function TripsPage() {
  const { data, loading, refetch } = useQuery(MY_BOOKINGS_QUERY, { fetchPolicy: "cache-and-network" });
  const res = data?.myBookings;
  return <TripsView bookings={res?.bookings ?? []} loading={loading} error={res && !res.success ? res.message : undefined} refetch={() => void refetch()} />;
}
