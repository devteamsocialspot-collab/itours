"use client";

import { useQuery } from "@apollo/client";
import { useSyncExternalStore } from "react";
import { readSessionToken } from "@/lib/auth";
import type { User } from "@/lib/types";
import { CURRENT_USER_QUERY } from "@/lib/user/queries";

const noop = () => () => {};

/** Signed-in user for client-side gating only — real enforcement is the back-end directive. */
export function useCurrentUser() {
  // a visitor with no session doesn't ask; the server snapshot keeps hydration on the "asking" path
  const anonymous = useSyncExternalStore(noop, () => !readSessionToken(), () => false);
  const { data, loading, error, refetch } = useQuery(CURRENT_USER_QUERY, { skip: anonymous });
  const res = data?.currentUser;
  return {
    user: (res?.success ? res.user : null) as User | null,
    loading: loading && !anonymous,
    error: error?.message ?? (res && !res.success ? (res.message as string) : undefined),
    refetch,
  };
}
