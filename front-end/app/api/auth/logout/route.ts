import { NextResponse } from "next/server";

const COOKIE = process.env.JWT_COOKIE_NAME ?? "itr_session";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
