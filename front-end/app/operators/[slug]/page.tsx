import type { Metadata } from "next";
import { print } from "graphql";
import { notFound } from "next/navigation";
import { cache } from "react";
import { OperatorPageView } from "@/components/app/operators/operator-page-view";
import { serverQuery } from "@/lib/api";
import { OPERATOR_QUERY } from "@/lib/operator/queries";
import { PLANS_QUERY } from "@/lib/plan/queries";
import { requestContext } from "@/lib/server";
import type { Operator, Plan } from "@/lib/types";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ area?: string }> };

const load = cache(async (slug: string) => {
  const { locale } = await requestContext();
  const data = await serverQuery<{ operator: { operator: Operator | null } | null }>(print(OPERATOR_QUERY), { slug }, { locale });
  return data?.operator?.operator ?? null;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const operator = await load((await params).slug);
  return { title: operator?.name ?? "itours.mn" };
}

/** An agency's public profile: only verified agencies have one. */
export default async function OperatorPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const operator = await load(slug);
  if (!operator) notFound();
  const { locale } = await requestContext();
  const data = await serverQuery<{ plans: { plans: Plan[] } | null }>(print(PLANS_QUERY), { operators: [slug], limit: 100 }, { locale });
  return <OperatorPageView operator={operator} plans={data?.plans?.plans ?? []} area={sp.area} />;
}
