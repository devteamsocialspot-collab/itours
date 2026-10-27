"use client";

import { Loader2 } from "lucide-react";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useT } from "@/lib/i18n";
import type { Role } from "@/lib/types";

/** Client-side gate for a back-office section. The back-end directive is what actually enforces it. */
export function RoleGuard({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const t = useT();
  const { user, loading, error } = useCurrentUser();

  if (loading && !user) {
    return (
      <div className="row muted" style={{ padding: "40px 0" }}>
        <Loader2 className="animate-spin" size={16} />
        {t("common.loading")}
      </div>
    );
  }
  // SUPER_ADMIN passes every gate, as it does in the API
  if (!user || (user.role !== "SUPER_ADMIN" && !roles.includes(user.role))) {
    return (
      <p className="muted center" style={{ padding: "40px 0" }}>
        {error ?? t("common.noAccess")}
      </p>
    );
  }
  return <>{children}</>;
}
