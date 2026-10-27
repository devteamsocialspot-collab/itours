"use client";

import { useQuery } from "@apollo/client";
import { ReviewQueueView } from "@/components/app/admin/review-queue-view";
import { MARKETPLACE_STATS_QUERY } from "@/lib/operator/queries";
import { REVIEW_QUEUE_QUERY } from "@/lib/plan/queries";

export default function ReviewQueuePage() {
  const { data, loading, refetch } = useQuery(REVIEW_QUEUE_QUERY, { fetchPolicy: "cache-and-network" });
  const { data: stats, refetch: refetchStats } = useQuery(MARKETPLACE_STATS_QUERY, { fetchPolicy: "cache-and-network" });
  return (
    <ReviewQueueView
      plans={data?.reviewQueue?.plans ?? []}
      stats={stats?.marketplaceStats?.stats ?? null}
      loading={loading}
      refetch={() => {
        void refetch();
        void refetchStats();
      }}
    />
  );
}
