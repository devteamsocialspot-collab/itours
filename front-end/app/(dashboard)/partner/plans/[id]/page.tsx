"use client";

import { useQuery } from "@apollo/client";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PlanEditor } from "@/components/app/partner/plan-editor";
import { useT } from "@/lib/i18n";
import { PARTNER_PLAN_QUERY } from "@/lib/plan/queries";

function Editor() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const tab = useSearchParams().get("tab") ?? "basics";
  // no-cache: the editor works on its own copy, and a stale one would overwrite newer edits on save
  const { data, loading } = useQuery(PARTNER_PLAN_QUERY, { variables: { id }, fetchPolicy: "no-cache" });
  const plan = data?.partnerPlan?.plan;
  if (!plan) return <p className="muted">{loading ? t("common.loading") : data?.partnerPlan?.message}</p>;
  return <PlanEditor key={plan.id} plan={plan} startTab={tab} />;
}

export default function PlanEditorPage() {
  return (
    <Suspense>
      <Editor />
    </Suspense>
  );
}
