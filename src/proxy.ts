import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, sessionTokenValue } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAdminPage = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isAdminApi = pathname.startsWith("/api/admin") && pathname !== "/api/admin/login";

  if (!isAdminPage && !isAdminApi) return NextResponse.next();

  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  const valid = cookie && cookie === (await sessionTokenValue());

  if (valid) return NextResponse.next();

  if (isAdminApi) {
    return NextResponse.json({ loi: "Chua dang nhap" }, { status: 401 });
  }
  const loginUrl = new URL("/admin/login", req.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
