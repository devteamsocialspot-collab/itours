"use client";

import { useQuery } from "@apollo/client";
import { CompareView } from "@/components/app/compare/compare-view";
import { SAVED_PLANS_QUERY } from "@/lib/plan/queries";

export default function ComparePage() {
  const { data, loading } = useQuery(SAVED_PLANS_QUERY, { fetchPolicy: "cache-and-network" });
  return <CompareView plans={data?.savedPlans?.plans ?? []} loading={loading} />;
}
