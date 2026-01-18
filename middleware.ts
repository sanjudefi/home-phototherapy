import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  // Public routes
  const publicRoutes = ["/", "/doctor/register", "/patient/form"];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Auth routes
  const authRoutes = ["/admin/login", "/doctor/login"];
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // Redirect logged-in users away from auth pages
  if (isAuthRoute && isLoggedIn) {
    if (userRole === "DOCTOR") {
      return NextResponse.redirect(new URL("/doctor/dashboard", req.url));
    }
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    if (userRole !== "SUPER_ADMIN" && userRole !== "SUB_ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Protect doctor routes
  if (pathname.startsWith("/doctor") && !pathname.startsWith("/doctor/login") && !pathname.startsWith("/doctor/register")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/doctor/login", req.url));
    }
    if (userRole !== "DOCTOR") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
