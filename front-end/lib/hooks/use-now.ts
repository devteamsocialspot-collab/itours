"use client";

import { useEffect, useRef, useState } from "react";

/** Date.now(), refreshed every `ms` — a minute is enough for an "h min left" countdown. */
export function useNow(ms = 60_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

/**
 * Calls `refetch` once for each deadline that passes while the page is open, so a lapsed hold shows
 * as expired without a reload. Each deadline only once, even if the server's clock is a little behind.
 */
export function useRefetchWhenPast(deadlines: (string | null | undefined)[], now: number, refetch?: () => unknown) {
  const done = useRef(new Set<string>());
  const due = deadlines.filter((d): d is string => Boolean(d) && Date.parse(d!) <= now && !done.current.has(d!)).join(",");
  useEffect(() => {
    if (!due) return;
    for (const deadline of due.split(",")) done.current.add(deadline);
    refetch?.();
  }, [due, refetch]);
}
