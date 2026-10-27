/**
 * Every user-facing string the API returns is localized here so the front-end can show `message`
 * verbatim. Locale travels in the `x-locale` header (set by the FE Apollo link), falling back to
 * Accept-Language, then mn. Controllers throw dictionary *keys* ("error.userNotFound"); resolvers
 * run them through t(), which returns unknown keys unchanged, so raw Sequelize/JS error messages
 * still surface. t() never throws.
 */
import type { IncomingHttpHeaders } from 'node:http';
import en from './locales/en';
import mn from './locales/mn';

const LOCALES = ['mn', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
const DEFAULT_LOCALE: Locale = 'mn';
const dictionaries: Record<Locale, typeof en> = { en, mn };

const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (LOCALES as readonly string[]).includes(value);

export const pickLocale = (headers: IncomingHttpHeaders): Locale => {
  const explicit = headers['x-locale'];
  if (isLocale(explicit)) return explicit;
  const accept = String(headers['accept-language'] || '')
    .split(',')[0]
    ?.trim()
    .slice(0, 2)
    .toLowerCase();
  return isLocale(accept) ? accept : DEFAULT_LOCALE;
};

const lookup = (dict: object, key: string): unknown =>
  key
    .split('.')
    .reduce<any>((node, part) => (node != null ? node[part] : undefined), dict);

export const t = (
  key: string,
  locale: Locale = DEFAULT_LOCALE,
  vars: Record<string, string | number> = {}
): string => {
  const raw =
    lookup(dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE], key) ??
    lookup(dictionaries.en, key) ??
    key;
  return String(raw).replace(/\{(\w+)\}/g, (_, name) =>
    vars[name] != null ? String(vars[name]) : `{${name}}`
  );
};
