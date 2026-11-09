import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const adminSession = request.cookies.get("admin_session")?.value;

  // Protect /admin routes (except login and api)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!adminSession) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If already logged in as admin, redirect from /admin/login to /admin/settings
  if (pathname === "/admin/login" && adminSession) {
    const settingsUrl = new URL("/admin/settings", request.url);
    return NextResponse.redirect(settingsUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
