import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "@/lib/i18n/dictionaries";

const SESSION_COOKIE = process.env.JWT_COOKIE_NAME ?? "itr_session";

/** What a server page needs from the request: the visitor's language and, when signed in, their token. */
export async function requestContext(): Promise<{ locale: Locale; token?: string }> {
  const jar = await cookies();
  const stored = jar.get(LOCALE_COOKIE)?.value;
  return { locale: isLocale(stored) ? stored : DEFAULT_LOCALE, token: jar.get(SESSION_COOKIE)?.value };
}
