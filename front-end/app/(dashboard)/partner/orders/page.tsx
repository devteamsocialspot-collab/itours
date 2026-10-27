"use client";

import { useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import { ORDER_SORTS, OrdersView, PAGE_SIZE, type OrderSort } from "@/components/app/partner/orders-view";
import { ORDERS_QUERY } from "@/lib/booking/queries";
import { useDebounced } from "@/lib/hooks/use-debounced";
import type { OrderTab } from "@/lib/types";

export default function OrdersPage() {
  const [tab, setTab] = useState<OrderTab>("ACTION");
  const [input, setInput] = useState("");
  const [sort, setSort] = useState<OrderSort>("newest");
  const [page, setPage] = useState(0);
  const search = useDebounced(input.trim());
  const { data, previousData, loading, refetch } = useQuery(ORDERS_QUERY, {
    variables: { tab, search: search || null, ...ORDER_SORTS[sort], limit: PAGE_SIZE, offset: page * PAGE_SIZE },
    fetchPolicy: "cache-and-network",
  });
  // the page on screen stays until the next one arrives
  const res = (data ?? previousData)?.orders;
  const count: number = res?.count ?? 0;

  // an order confirmed or cancelled can empty the last page: step back to the new last one
  useEffect(() => {
    if (data && page > 0 && count <= page * PAGE_SIZE) setPage(Math.max(0, Math.ceil(count / PAGE_SIZE) - 1));
  }, [data, count, page]);

  return (
    <OrdersView
      orders={res?.orders ?? []}
      tabs={res?.tabs ?? null}
      tab={tab}
      onTab={(next) => {
        setTab(next);
        setPage(0);
      }}
      search={input}
      onSearch={(value) => {
        setInput(value);
        setPage(0);
      }}
      sort={sort}
      onSort={(next) => {
        setSort(next);
        setPage(0);
      }}
      page={page}
      count={count}
      onPage={setPage}
      loading={loading}
      error={res && !res.success ? res.message : undefined}
      refetch={() => void refetch()}
    />
  );
}
