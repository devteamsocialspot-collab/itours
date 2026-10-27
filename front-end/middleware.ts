import { NextRequest, NextResponse } from "next/server";
import { decodeJwtPayload } from "@/lib/jwt";

const COOKIE = process.env.JWT_COOKIE_NAME ?? "itr_session";
/** Everything else is public: the marketplace is the product and has to open without a login. */
const PROTECTED_PREFIXES = ["/admin", "/partner", "/trips", "/compare", "/checkout"];

// Decode only — no signature check on the edge; the back-end verifies the token on every request.
const hasLiveToken = (token?: string) => {
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  const exp = payload.exp;
  return typeof exp !== "number" || exp * 1000 > Date.now();
};

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const signedIn = hasLiveToken(req.cookies.get(COOKIE)?.value);

  if (pathname === "/login" || pathname === "/register")
    return signedIn ? NextResponse.redirect(new URL("/", req.url)) : NextResponse.next();
  if (!PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return NextResponse.next();
  if (signedIn) return NextResponse.next();

  const login = new URL("/login", req.url);
  login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*[.].*).*)"],
};
