/** Session cookie helpers shared by the Apollo link and the UI. The back-end verifies the JWT on every request. */
const SESSION_COOKIE = process.env.NEXT_PUBLIC_JWT_COOKIE_NAME ?? "itr_session";

const readCookie = (name: string): string | undefined => {
  if (typeof document === "undefined") return undefined;
  const hit = document.cookie.split("; ").find((c) => c.startsWith(`${name}=`));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : undefined;
};

export const readSessionToken = () => readCookie(SESSION_COOKIE);
