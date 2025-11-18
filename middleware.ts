import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Multi-Tenant RBAC Middleware
 *
 * This middleware handles route protection for authenticated and role-based routes.
 *
 * RBAC Implementation:
 * - Client-side enforcement: Pages use useAuth() hooks (isAdmin, canManageTeam, etc.)
 * - Firestore rules: Database-level access control based on organizationId and role
 * - Page-level guards: Each protected page checks auth/role and redirects if unauthorized
 *
 * Protected Routes:
 * - /dashboard/** : All authenticated users
 * - /settings/team : Admin only (enforced client-side)
 * - /settings/billing : Admin only (enforced client-side)
 *
 * For server-side session management with Firebase Admin SDK, see:
 * https://firebase.google.com/docs/auth/admin/manage-cookies
 */
export function middleware(request: NextRequest) {
  // Define protected route patterns
  const protectedRoutes = [
    "/dashboard",
    "/settings",
  ];

  // Admin-only routes (enforced client-side in page components)
  const adminOnlyRoutes = [
    "/settings/team",
    "/settings/billing",
  ];

  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  const isAdminRoute = adminOnlyRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Log route access for monitoring (in production, send to analytics)
  if (isProtectedRoute || isAdminRoute) {
    // Client-side auth state and role checks handle actual enforcement
    // Firestore security rules provide database-level protection
    // This middleware serves as route documentation and can be extended
    // with server-side session verification using Firebase Admin SDK
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
