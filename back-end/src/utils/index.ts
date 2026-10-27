import { Op } from 'sequelize';
import { TPagination } from '../types/common.type';
import { Locale, t } from './i18n';

export const DAY_MS = 24 * 60 * 60 * 1000;

/** limit 1–200 (default 50), offset ≥ 0 — client paging never reaches SQL unclamped. */
export const pagination = ({ limit, offset }: TPagination) => ({
  limit: Math.min(Math.max(limit ?? 50, 1), 200),
  offset: Math.max(offset ?? 0, 0)
});

/** The admin lists' one search box: `column ILIKE %search%` on any of the columns. */
export const ilikeAny = (search: string, columns: string[]) =>
  columns.map((column) => ({ [column]: { [Op.iLike]: `%${search}%` } }));

/** "9911 0011" and "9911-0011" are the same number. */
export const normalizePhone = (phone: string) =>
  (phone ?? '').replace(/[\s-]/g, '');

// ponytail: 8-digit Mongolian mobile numbers only; travellers from abroad sign in by email instead
export const isPhone = (phone: string) => /^\d{8}$/.test(phone);

export const normalizeEmail = (email: string) =>
  (email ?? '').trim().toLowerCase();

export const isEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/** The login box takes either: digits mean a phone, anything with an @ an email. */
export const parseLogin = (login: string) => {
  const phone = normalizePhone(login);
  if (isPhone(phone)) return { phone };
  const email = normalizeEmail(login);
  if (isEmail(email)) return { email };
  return null;
};

// Mongolian Cyrillic in Latin letters, the way names are spelled in slugs and emails (MNS 5217, ө/ү as o/u)
const LATIN: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'i',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', ө: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
  ү: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'y', ь: 'i',
  э: 'e', ю: 'yu', я: 'ya'
};

/** "Говь 8 хоног" / "Gobi: 8 days" → "govi-8-khonog" / "gobi-8-days". A tail keeps two plans of one name apart. */
export const slugify = (text: string, tail = '') =>
  [
    (text ?? '')
      .toLowerCase()
      .replace(/[а-яёөү]/g, (char) => LATIN[char] ?? '')
      .normalize('NFKD')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/[\s-]+/g, '-')
      .slice(0, 60) || 'item',
    tail
  ]
    .filter(Boolean)
    .join('-');

/** Today as YYYY-MM-DD in Ulaanbaatar, to compare with DATEONLY columns. */
export const todayUb = () =>
  new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);

/** YYYY-MM-DD plus n days. */
export const addDays = (date: string, days: number) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS)
    .toISOString()
    .slice(0, 10);

/** http(s) only; a bare host is assumed https. Anything else is rejected rather than stored. */
const cleanUrl = (value: unknown) => {
  const url = String(value ?? '').trim();
  if (!url) return '';
  const full = /^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `https://${url}`;
  if (!/^https?:\/\//i.test(full)) throw new Error('error.urlInvalid');
  return full;
};

/**
 * Keeps only the allow-listed fields of a client-supplied map, with every URL field normalised.
 * The allow-list is the security boundary: a column it doesn't name can never be written, whatever
 * the client sends. URLs are cleaned because anything in `url` / `*Url` is later rendered as a link
 * or an image — a stored `javascript:` would otherwise run on our origin.
 */
export const pickFields = (fields: string[], doc: object) =>
  Object.fromEntries(
    Object.entries(doc)
      .filter(([key, value]) => value !== undefined && fields.includes(key))
      .map(([key, value]) => [
        key,
        key === 'url' || key.endsWith('Url') ? cleanUrl(value) : value
      ])
  ) as Record<string, any>;

/** Same cleaning for a list of links (plan photos). */
export const cleanUrls = (values: unknown) =>
  (Array.isArray(values) ? values : []).map(cleanUrl).filter(Boolean);

/** The { success, message } envelope every resolver answers with. */
export const ok = (
  lang: Locale,
  key = 'response.ok',
  vars?: Record<string, string | number>
) => ({ success: true, message: t(key, lang, vars) });

export const fail = (error: Error, lang: Locale) => ({
  success: false,
  message: t(error.message, lang)
});
