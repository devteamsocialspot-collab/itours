"use client";

import { useQuery } from "@apollo/client";
import { useMemo, useState } from "react";
import { UsersPageView } from "@/components/app/users/users-page-view";
import { useDebounced } from "@/lib/hooks/use-debounced";
import type { Role } from "@/lib/types";
import { USERS_QUERY } from "@/lib/user/queries";

export default function UsersPage() {
  const [input, setInput] = useState("");
  const search = useDebounced(input.trim());
  const [role, setRole] = useState<Role | "">("");

  // ponytail: no pager — staff lists are small; add offset paging when count > 100
  const variables = useMemo(
    () => ({ limit: 100, offset: 0, search: search || null, role: role || null, orderBy: "createdAt", direction: "DESC" }),
    [search, role],
  );
  const { data, loading, error, refetch } = useQuery(USERS_QUERY, { variables, fetchPolicy: "cache-and-network" });
  const res = data?.users;

  return (
    <UsersPageView
      users={res?.users ?? []}
      count={res?.count ?? 0}
      loading={loading}
      error={error?.message ?? (res && !res.success ? res.message : undefined)}
      search={input}
      onSearch={setInput}
      role={role}
      onRole={setRole}
      refetch={() => void refetch()}
    />
  );
}
