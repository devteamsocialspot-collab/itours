import type { Metadata } from "next";
import { print } from "graphql";
import { notFound } from "next/navigation";
import { cache } from "react";
import { PlanPageView } from "@/components/app/plan/plan-page-view";
import { serverQuery } from "@/lib/api";
import { PLAN_QUERY, PLAN_REVIEWS_QUERY } from "@/lib/plan/queries";
import { requestContext } from "@/lib/server";
import type { Plan, Review } from "@/lib/types";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> };

/**
 * cache() makes generateMetadata and the page share one request: `plan` counts a view each time it
 * runs. The session rides along so an agency (or staff) can open a draft; to everyone else it's a 404.
 */
const load = cache(async (slug: string) => {
  const { locale, token } = await requestContext();
  const data = await serverQuery<{ plan: { plan: Plan | null } | null }>(print(PLAN_QUERY), { slug }, { locale, token });
  return data?.plan?.plan ?? null;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const plan = await load((await params).slug);
  return plan ? { title: plan.titleEn, description: plan.summary, openGraph: { images: plan.photos[0] } } : { title: "itours.mn" };
}

export default async function PlanPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const plan = await load(slug);
  if (!plan) notFound();
  const { locale } = await requestContext();
  const data = await serverQuery<{ planReviews: { reviews: Review[] } | null }>(print(PLAN_REVIEWS_QUERY), { planId: plan.id, limit: 4 }, { locale });
  return <PlanPageView plan={plan} reviews={data?.planReviews?.reviews ?? []} initialDep={sp.dep} initialPax={Number(sp.pax) || undefined} />;
}
