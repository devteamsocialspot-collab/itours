"use client";

import { useQuery } from "@apollo/client";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CheckoutView } from "@/components/app/checkout/checkout-view";
import { PLAN_QUERY } from "@/lib/plan/queries";
import type { Room } from "@/lib/types";

function Checkout() {
  const { slug } = useParams<{ slug: string }>();
  const sp = useSearchParams();
  const { data, loading } = useQuery(PLAN_QUERY, { variables: { slug } });
  const plan = data?.plan?.plan;
  if (!plan) return <p className="auth muted">{loading ? "…" : data?.plan?.message}</p>;
  return <CheckoutView plan={plan} depId={sp.get("dep") ?? ""} pax={Number(sp.get("pax")) || 1} room={(sp.get("room") as Room) ?? "TWIN"} />;
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <Checkout />
    </Suspense>
  );
}
