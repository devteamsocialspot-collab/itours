"use client";

import { useMutation, useQuery } from "@apollo/client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useReport } from "@/lib/hooks/use-report";
import { useT } from "@/lib/i18n";
import { SAVED_PLANS_QUERY, TOGGLE_SAVE_MUTATION } from "@/lib/plan/queries";
import { cn } from "@/lib/utils";

/** Plan ids the signed-in traveller saved; one query in the cache, shared by every button on the page. */
export function useSavedIds() {
  const { user } = useCurrentUser();
  const { data } = useQuery(SAVED_PLANS_QUERY, { skip: user?.role !== "USER" });
  const plans: { id: string }[] = data?.savedPlans?.plans ?? [];
  return { traveller: user?.role === "USER", ids: new Set(plans.map((plan) => plan.id)) };
}

/** Save / unsave for travellers; a guest gets a Save that signs in and comes back; agencies and staff, nothing. */
export function SaveButton({ planId, block }: { planId: string; block?: boolean }) {
  const t = useT();
  const { user, loading: userLoading } = useCurrentUser();
  const { traveller, ids } = useSavedIds();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [toggle, { loading }] = useMutation(TOGGLE_SAVE_MUTATION, { refetchQueries: [SAVED_PLANS_QUERY], awaitRefetchQueries: true });
  const report = useReport();
  if (!user && !userLoading)
    return (
      <Link className={cn("btn btn-secondary btn-sm", block && "btn-block")} href={`/login?next=${encodeURIComponent(pathname + (search ? `?${search}` : ""))}`}>
        {t("plan.save")}
      </Link>
    );
  if (!traveller) return null;
  const saved = ids.has(planId);
  return (
    <button
      type="button"
      disabled={loading}
      className={cn("btn btn-secondary btn-sm", block && "btn-block")}
      onClick={async () => {
        const { data } = await toggle({ variables: { planId } });
        if (!data?.toggleSavePlan?.success) await report(data?.toggleSavePlan);
      }}
    >
      {t(saved ? "plan.unsave" : "plan.save")}
    </button>
  );
}
