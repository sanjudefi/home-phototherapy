import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow all API routes, static files, and public assets
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/images')
  ) {
    return NextResponse.next();
  }

  // Public routes - always allow
  if (
    pathname === '/' ||
    pathname === '/doctor/register' ||
    pathname === '/admin/login' ||
    pathname === '/doctor/login' ||
    pathname.startsWith('/patient/form')
  ) {
    return NextResponse.next();
  }

  // For protected routes, let NextAuth handle authentication in the page component
  // The middleware just allows the request through
  // Pages will handle redirects via auth() in server components
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
