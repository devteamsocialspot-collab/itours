import en from "./locales/en";
import mn from "./locales/mn";

export const LOCALES = ["mn", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
/** Read by the root layout too, so the first paint is already in the visitor's language. */
export const LOCALE_COOKIE = "itr_locale";

const dictionaries: Record<Locale, typeof mn> = { mn, en };

export const isLocale = (value: unknown): value is Locale => typeof value === "string" && (LOCALES as readonly string[]).includes(value);

const lookup = (dict: object, key: string): unknown =>
  key.split(".").reduce<unknown>((node, part) => (node != null && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined), dict);

/** Pure translate for non-React code (route handlers). Unknown keys come back unchanged; never throws. */
export const translate = (locale: string, key: string, vars: Record<string, string | number> = {}): string => {
  const dict = dictionaries[isLocale(locale) ? locale : DEFAULT_LOCALE];
  const raw = lookup(dict, key) ?? lookup(dictionaries[DEFAULT_LOCALE], key) ?? key;
  return String(raw).replace(/\{(\w+)\}/g, (_, name) => (vars[name] != null ? String(vars[name]) : `{${name}}`));
};
