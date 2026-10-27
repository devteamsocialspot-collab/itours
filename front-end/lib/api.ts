import { DEFAULT_LOCALE } from "@/lib/i18n/dictionaries";

/** Browser-facing API base, derived from the one URL we already configure. */
const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:8080/graphql";
export const API_BASE = GRAPHQL_URL.replace(/\/graphql\/?$/, "");

export const uploadUrl = `${API_BASE}/upload`;
export const ordersCsvUrl = `${API_BASE}/export/orders`;

/**
 * Server-side GraphQL for the public marketplace pages (home, search, a plan, an agency): they have to
 * render in the HTML for search engines and link previews, which client-side Apollo can't do.
 * Everything behind a login stays on Apollo.
 */
export async function serverQuery<T>(
  query: string,
  variables: Record<string, unknown> = {},
  { token, locale = DEFAULT_LOCALE }: { token?: string; locale?: string } = {},
): Promise<T | null> {
  const url = process.env.GRAPHQL_URL ?? GRAPHQL_URL;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-locale": locale,
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const json = (await response.json()) as { data?: T };
    return json.data ?? null;
  } catch {
    return null; // the page renders its not-found state rather than a stack trace
  }
}
