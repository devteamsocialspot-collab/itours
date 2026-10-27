import type { Metadata } from "next";
import { print } from "graphql";
import { SearchView, type SearchParams } from "@/components/app/search/search-view";
import { serverQuery } from "@/lib/api";
import { AREAS } from "@/lib/plan/helpers";
import { PLANS_QUERY } from "@/lib/plan/queries";
import { requestContext } from "@/lib/server";
import type { Plan, PlanFacet } from "@/lib/types";

export const metadata: Metadata = { title: "Search" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const all = (value: string | string[] | undefined) => (value === undefined ? [] : Array.isArray(value) ? value : [value]);
const one = (value: string | string[] | undefined) => all(value)[0] ?? "";
/** The difficulty buttons each cover two neighbouring grades, as the wireframe's three-way switch does. */
const DIFFICULTY: Record<string, string[]> = { easy: ["EASY", "EASY_MODERATE"], moderate: ["EASY_MODERATE", "MODERATE"], hard: ["HARD"] };

/** Server-rendered from the URL: every filter is a query parameter, so a search can be shared. */
export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { locale } = await requestContext();
  const area = one(sp.area);
  const params: SearchParams = {
    q: one(sp.q).trim(),
    area: AREAS.some((value) => value === area) ? area : "",
    month: one(sp.month),
    days: one(sp.days),
    pax: Number(one(sp.pax)) || 1,
    score: one(sp.score),
    max: Number(one(sp.max)) || 3000,
    diff: one(sp.diff),
    sleep: all(sp.sleep),
    db: all(sp.db),
    op: all(sp.op),
    sort: one(sp.sort) || "best",
  };
  const [minDays, maxDays] = params.days.split("-").map(Number);
  const data = await serverQuery<{ plans: { plans: Plan[]; facets: PlanFacet[] } | null }>(
    print(PLANS_QUERY),
    {
      search: params.q || null,
      area: params.area || null,
      month: params.month || null,
      minDays: minDays || null,
      maxDays: maxDays || null,
      pax: params.pax,
      minScore: Number(params.score) || null,
      maxPrice: params.max,
      difficulty: DIFFICULTY[params.diff] ?? null,
      lodging: params.sleep,
      dealBreakers: params.db,
      operators: params.op,
      sort: params.sort,
      limit: 100,
    },
    { locale },
  );
  return <SearchView params={params} plans={data?.plans?.plans ?? []} facets={data?.plans?.facets ?? []} />;
}
