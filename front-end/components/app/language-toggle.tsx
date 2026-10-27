"use client";

import { useRouter } from "next/navigation";
import { LOCALES, useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Two letters per language — the control has to fit next to the account menu on a phone. */
const LABEL: Record<string, string> = { mn: "МН", en: "EN" };

/**
 * The only way to change language. The choice is kept in a year-long cookie that the server pages
 * read too, and the Apollo link sends it on as `x-locale`, so API messages come back in the same
 * language. A refresh re-renders the server pages in it.
 */
export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const router = useRouter();

  return (
    <div className={cn("seg seg-mini", className)} aria-label="Language">
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          aria-pressed={locale === code}
          className={cn("seg-opt", locale === code && "on")}
          onClick={() => {
            setLocale(code);
            router.refresh();
          }}
        >
          {LABEL[code] ?? code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
