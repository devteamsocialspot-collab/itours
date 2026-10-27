"use client";

import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/navigation";
import { PlansListView } from "@/components/app/partner/plans-list-view";
import { useReport } from "@/lib/hooks/use-report";
import { CREATE_PLAN_MUTATION, PARTNER_PLANS_QUERY } from "@/lib/plan/queries";

export default function PartnerPlansPage() {
  const router = useRouter();
  const { data, loading } = useQuery(PARTNER_PLANS_QUERY, { fetchPolicy: "cache-and-network" });
  const [createPlan, { loading: creating }] = useMutation(CREATE_PLAN_MUTATION);
  const report = useReport();
  const create = async () => {
    const { data: created } = await createPlan();
    const res = created?.createPlan;
    if (res?.success) router.push(`/partner/plans/${res.plan.id}`);
    else await report(res);
  };
  return <PlansListView plans={data?.partnerPlans?.plans ?? []} loading={loading} creating={creating} onCreate={create} />;
}
