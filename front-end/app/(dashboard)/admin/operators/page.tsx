"use client";

import { useQuery } from "@apollo/client";
import { OperatorHealthView } from "@/components/app/admin/operator-health-view";
import { ADMIN_OPERATORS_QUERY } from "@/lib/operator/queries";

export default function AdminOperatorsPage() {
  const { data, loading, refetch } = useQuery(ADMIN_OPERATORS_QUERY, { fetchPolicy: "cache-and-network" });
  return <OperatorHealthView operators={data?.adminOperators?.operators ?? []} loading={loading} refetch={() => void refetch()} />;
}
