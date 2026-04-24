import { NextResponse, type NextRequest } from "next/server";

const protectedPaths = ["/dashboard", "/favorites", "/categories", "/import-export"];

export function proxy(request: NextRequest) {
  const isProtected = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));
  const token = request.cookies.get("mail_favorites_session")?.value;
  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if ((request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register") && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/favorites/:path*", "/categories/:path*", "/import-export/:path*", "/login", "/register"],
};
