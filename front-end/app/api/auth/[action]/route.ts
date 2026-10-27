import { jwtExpiry } from "@/lib/jwt";
import { NextResponse } from "next/server";
import { translate } from "@/lib/i18n/dictionaries";

const COOKIE = process.env.JWT_COOKIE_NAME ?? "itr_session";
const GRAPHQL_URL = process.env.GRAPHQL_URL ?? "http://localhost:8080/graphql";
// /api/auth/login and /api/auth/register: both answer with a token, aliased to `result`
const ACTIONS: Record<string, { fields: string[]; optional?: string[]; query: string }> = {
  login: {
    fields: ["login", "password"],
    query: `mutation LoginUser($login: String!, $password: String!) {
  result: loginUser(login: $login, password: $password) { success message token user { id name role } }
}`,
  },
  register: {
    fields: ["name", "login", "password"],
    optional: ["country", "companyName"],
    query: `mutation RegisterUser($name: String!, $login: String!, $password: String!, $country: String, $companyName: String) {
  result: registerUser(name: $name, login: $login, password: $password, country: $country, companyName: $companyName) { success message token user { id name role } }
}`,
  },
};

type AuthResult = { success?: boolean; message?: string; token?: string; user?: unknown };

// Proxies loginUser / registerUser server-side and turns the JWT into the session cookie.
export async function POST(req: Request, { params }: { params: Promise<{ action: string }> }) {
  const action = ACTIONS[(await params).action];
  if (!action) return NextResponse.json({ success: false }, { status: 404 });
  const lang = req.headers.get("x-locale") ?? "mn";
  const body = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  if (action.fields.some((field) => typeof body[field] !== "string" || !body[field])) {
    return NextResponse.json({ success: false, message: translate(lang, "auth.missing") }, { status: 400 });
  }
  const variables = Object.fromEntries(
    [...action.fields, ...(action.optional ?? [])].map((field) => [field, typeof body[field] === "string" ? body[field] : null]),
  );

  let result: AuthResult | undefined;
  try {
    const upstream = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: { "content-type": "application/json", "x-locale": lang },
      body: JSON.stringify({ query: action.query, variables }),
      cache: "no-store",
    });
    result = (await upstream.json())?.data?.result;
  } catch {
    return NextResponse.json({ success: false, message: translate(lang, "auth.networkError") }, { status: 502 });
  }
  if (!result?.success || !result.token) {
    return NextResponse.json({ success: false, message: result?.message ?? translate(lang, "auth.failed") }, { status: 401 });
  }

  const exp = jwtExpiry(result.token);
  const res = NextResponse.json({ success: true, message: result.message, user: result.user });
  res.cookies.set(COOKIE, result.token, {
    httpOnly: false, // the Apollo link reads it from document.cookie
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(exp ? { maxAge: Math.max(exp - Math.floor(Date.now() / 1000), 0) } : {}),
  });
  return res;
}
