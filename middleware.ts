import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  // Public routes that don't require authentication
  const publicRoutes = ["/doctor/register"];
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + "/"));

  // Patient form routes (dynamic, starts with /patient/form)
  const isPatientForm = pathname.startsWith("/patient/form");

  // Allow public routes and patient forms
  if (isPublicRoute || isPatientForm || pathname === "/") {
    return NextResponse.next();
  }

  // Auth routes (login pages)
  const isAdminLogin = pathname === "/admin/login";
  const isDoctorLogin = pathname === "/doctor/login";

  // Redirect logged-in users away from login pages
  if (isLoggedIn) {
    if (isAdminLogin || isDoctorLogin) {
      if (userRole === "DOCTOR") {
        return NextResponse.redirect(new URL("/doctor/dashboard", req.url));
      }
      if (userRole === "SUPER_ADMIN" || userRole === "SUB_ADMIN") {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
    }
  }

  // Protect admin routes (except login)
  if (pathname.startsWith("/admin") && !isAdminLogin) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    if (userRole !== "SUPER_ADMIN" && userRole !== "SUB_ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Protect doctor routes (except login and register)
  if (pathname.startsWith("/doctor") && !isDoctorLogin && !pathname.startsWith("/doctor/register")) {
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
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
