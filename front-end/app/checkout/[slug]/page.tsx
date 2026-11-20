"use client";

import { useQuery } from "@apollo/client";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { CheckoutView } from "@/components/app/checkout/checkout-view";
import { Footer, SiteHeader } from "@/components/app/site-header";
import { useT } from "@/lib/i18n";
import { PLAN_QUERY } from "@/lib/plan/queries";
import type { Room } from "@/lib/types";

function Checkout() {
  const t = useT();
  const { slug } = useParams<{ slug: string }>();
  const sp = useSearchParams();
  const { data, loading } = useQuery(PLAN_QUERY, { variables: { slug } });
  const plan = data?.plan?.plan;
  if (!plan)
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
                {data?.plan?.message || t("common.error")}
              </p>
              <Link href={`/plans/${slug}`} className="btn btn-secondary btn-sm">
                ← {t("common.back")}
              </Link>
            </>
          )}
        </main>
        <Footer />
      </>
    );
  return <CheckoutView plan={plan} depId={sp.get("dep") ?? ""} pax={Number(sp.get("pax")) || 1} room={(sp.get("room") as Room) ?? "TWIN"} />;
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <Checkout />
    </Suspense>
  );
}
