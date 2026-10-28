"use client";

import Link from "next/link";
import { Footer, SiteHeader } from "@/components/app/site-header";
import { Photo, Score } from "@/components/app/ui";
import { useT } from "@/lib/i18n";
import type { Operator } from "@/lib/types";

export function OperatorsView({ operators }: { operators: Operator[] }) {
  const t = useT();
  return (
    <>
      <SiteHeader />
      <main className="wrap pad" style={{ paddingBlock: "28px 40px" }}>
        <h2>{t("nav.operators")}</h2>
        <div className="grid-3">
          {operators.map((operator) => (
            <Link key={operator.id} href={`/operators/${operator.slug}`} className="plain plan-card">
              <Photo src={operator.coverUrl} alt={operator.name} style={{ height: 140 }} />
              <div className="plan-card-body">
                <div className="row">
                  <div className="grow">
                    <div className="plan-card-title">{operator.name}</div>
                    <div className="small muted">
                      {operator.city} · {t("plan.reviews", { n: operator.stats?.reviewCount ?? 0 })} ·{" "}
                      {t("operatorPage.plansCount", { n: operator.stats?.plansLive ?? 0 })}
                    </div>
                  </div>
                  <Score value={operator.stats?.score} />
                </div>
                <p className="small" style={{ color: "var(--ink-70)", margin: 0 }}>
                  {operator.about}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
