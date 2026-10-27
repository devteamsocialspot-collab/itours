"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

type Result = { success?: boolean; message?: string } | null | undefined;

/**
 * Toasts a mutation's `{ success, message }` envelope, refreshes, and says whether it worked. The
 * back-end already returns a localized message, so the front-end never invents its own wording for a
 * server result; only a failed request with no envelope falls back to the generic error.
 */
export function useReport(refetch?: () => unknown) {
  const t = useT();
  return useCallback(
    async (result: Result) => {
      if (result?.success) toast.success(result.message ?? "");
      else toast.error(result?.message ?? t("common.error"));
      await refetch?.();
      return Boolean(result?.success);
    },
    [refetch, t],
  );
}
