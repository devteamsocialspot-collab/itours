import { print } from "graphql";
import { HomeView, type HomeReview } from "@/components/app/home/home-view";
import { serverQuery } from "@/lib/api";
import { PLAN_REVIEWS_QUERY, PLANS_QUERY, SITE_INFO_QUERY } from "@/lib/plan/queries";
import { requestContext } from "@/lib/server";
import type { Plan, Review } from "@/lib/types";

type Data = {
  siteInfo: { info: { verifiedOperators: number; publishedPlans: number } | null } | null;
  plans: { count: number; plans: Plan[] } | null;
};

/** Server-rendered: the landing is what search engines and shared links see. */
export default async function HomePage() {
  const { locale } = await requestContext();
  const [info, all] = await Promise.all([
    serverQuery<Pick<Data, "siteInfo">>(print(SITE_INFO_QUERY), {}, { locale }),
    // every published plan: the region map, the comfort picker and the season strip count them in the browser
    serverQuery<Pick<Data, "plans">>(print(PLANS_QUERY), { sort: "best", limit: 200 }, { locale }),
  ]);
  const plans = all?.plans?.plans ?? [];
  const top = plans.slice(0, 3);
  // the reviews row takes turns between the three best plans; the hero card quotes the best one's latest five-star review
  const sets = await Promise.all(
    top.map(async ({ slug, titleEn, titleMn, id }) => {
      const data = await serverQuery<{ planReviews: { reviews: Review[] } | null }>(print(PLAN_REVIEWS_QUERY), { planId: id, limit: 6 }, { locale });
      return (data?.planReviews?.reviews ?? []).map((review): HomeReview => ({ ...review, plan: { slug, titleEn, titleMn } }));
    }),
  );
  const reviews = [0, 1, 2, 3, 4, 5].flatMap((i) => sets.map((set) => set[i])).filter((review): review is HomeReview => !!review?.text);
  const quote = sets[0]?.find((review) => review.stars === 5 && review.text)?.text ?? null;

  return (
    <HomeView
      verifiedOperators={info?.siteInfo?.info?.verifiedOperators ?? 0}
      planCount={all?.plans?.count ?? 0}
      plans={plans}
      top={top}
      quote={quote}
      reviews={reviews}
    />
  );
}
