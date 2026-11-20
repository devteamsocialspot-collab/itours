"use client";

import { useRouter } from "next/navigation";
import { LOCALES, useLocale, useT } from "@/lib/i18n";
import { translate } from "@/lib/i18n/dictionaries";
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
  const t = useT();
  const router = useRouter();

  return (
    <div className={cn("seg seg-mini", className)} role="group" aria-label={t("nav.language")}>
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          lang={code}
          // each language named in itself, matching its lang: "Монгол", "English"
          aria-label={translate(code, code === "mn" ? "nav.langMn" : "nav.langEn")}
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
