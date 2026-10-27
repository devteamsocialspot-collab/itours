"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { DEFAULT_LOCALE, LOCALE_COOKIE, translate, type Locale } from "./dictionaries";

export { LOCALES } from "./dictionaries";

// module-level so non-React code (the Apollo link) can read the current locale
let activeLocale: Locale = DEFAULT_LOCALE;
export const getActiveLocale = () => activeLocale;

type LocaleContextValue = { locale: Locale; setLocale: (locale: Locale) => void };
const LocaleContext = createContext<LocaleContextValue>({ locale: DEFAULT_LOCALE, setLocale: () => {} });

/**
 * `initial` comes from the cookie on the server (app/layout.tsx), so server and client render the
 * same language from the first paint. A switch is kept in that cookie for a year.
 */
export function LocaleProvider({ initial, children }: { initial: Locale; children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initial);
  activeLocale = locale;
  const setLocale = useCallback((next: Locale) => {
    activeLocale = next;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = next;
    setLocaleState(next);
  }, []);
  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export const useLocale = () => useContext(LocaleContext);

/** t("section.key", { count: 3 }) — dot-path into the active dictionary with {var} interpolation. */
export function useT() {
  const { locale } = useLocale();
  return useCallback((key: string, vars?: Record<string, string | number>) => translate(locale, key, vars), [locale]);
}
