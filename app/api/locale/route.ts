import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const locale = req.nextUrl.searchParams.get("set") === "en" ? "en" : "de";
  const back = req.nextUrl.searchParams.get("back") ?? "/dashboard";
  const res = NextResponse.redirect(new URL(back, req.url));
  res.cookies.set("locale", locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  return res;
}
