"use client";

import { useQuery } from "@apollo/client";
import { useState } from "react";
import { OverviewView, type Period } from "@/components/app/partner/overview-view";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { PARTNER_COUNTS_QUERY, PARTNER_DASHBOARD_QUERY } from "@/lib/operator/queries";

const DAYS: Record<Period, number> = { "7": 7, "30": 30, season: 365 };

export default function PartnerOverviewPage() {
  const [period, setPeriod] = useState<Period>("30");
  const { user } = useCurrentUser();
  const { data, loading } = useQuery(PARTNER_DASHBOARD_QUERY, { variables: { days: DAYS[period] }, fetchPolicy: "cache-and-network" });
  const { data: counts } = useQuery(PARTNER_COUNTS_QUERY, { fetchPolicy: "cache-first" });
  const res = data?.partnerDashboard;
  return (
    <OverviewView
      user={user}
      dashboard={res?.dashboard ?? null}
      loading={loading}
      error={res && !res.success ? res.message : undefined}
      needsAction={counts?.orders?.tabs?.ACTION ?? 0}
      planCount={counts?.partnerPlans?.count ?? 0}
      period={period}
      onPeriod={setPeriod}
    />
  );
}
