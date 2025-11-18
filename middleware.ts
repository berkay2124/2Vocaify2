import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This is a client-side auth check middleware
// For more robust server-side auth, consider using Firebase Admin SDK
export function middleware(request: NextRequest) {
  // Define protected routes
  const protectedRoutes = ["/dashboard"];

  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // If it's a protected route, the client-side auth check will handle redirect
  // This middleware is mainly for additional server-side checks if needed
  if (isProtectedRoute) {
    // You can add additional checks here, like checking for auth cookies/tokens
    // For now, we rely on client-side auth state management
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
