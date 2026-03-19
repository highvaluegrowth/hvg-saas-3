// middleware.ts — Next.js Edge Middleware for tenant-route protection.
//
// IMPORTANT: Firebase Admin SDK is not available in the Edge Runtime, so this
// middleware does NOT cryptographically verify Firebase ID tokens. It reads a
// lightweight routing-hint cookie (`hvg-session`) set by `useAuth.ts` after
// successful Firebase sign-in.
//
// Real security enforcement is at:
//   1. Firestore security rules (tenant_id claim checks)
//   2. API routes — `verifyAuthToken()` in `lib/middleware/authMiddleware.ts`
//
// This middleware is defense-in-depth: it prevents unauthenticated users from
// even loading dashboard JS, and catches obvious cross-tenant URL manipulation.

import { NextRequest, NextResponse } from 'next/server';

// Top-level URL segments that are publicly accessible without a session.
const PUBLIC_SEGMENTS = new Set([
  '',             // root "/"
  'login',
  'signup',
  'unauthorized',
  'apply',        // public application forms
  'blog',
  'sign',         // public contract signing
  'directory',    // public tenant directory
  'admin',        // SuperAdmin section (has its own auth guard inside)
  'create-tenant',
  'api',          // API routes handle auth internally via verifyAuthToken()
  '_next',
  'onboarding',
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const firstSegment = pathname.split('/')[1] ?? '';

  // Pass through public routes, static files, and anything with a file extension
  if (PUBLIC_SEGMENTS.has(firstSegment) || firstSegment.includes('.')) {
    return NextResponse.next();
  }

  // At this point the URL is /{tenantId}/... — a protected dashboard route.
  const urlTenantId = firstSegment;
  const sessionCookie = request.cookies.get('hvg-session')?.value;

  // No session cookie at all → redirect to login with return URL
  if (!sessionCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Cookie format: "{tenantId}|{role}"  (set by useAuth.ts, not a security token)
  const pipeIdx = sessionCookie.lastIndexOf('|');
  if (pipeIdx === -1) {
    // Malformed cookie — redirect to login to re-establish session
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const cookieTenantId = sessionCookie.slice(0, pipeIdx);
  const role = sessionCookie.slice(pipeIdx + 1);

  // Super admins can navigate to any tenant's dashboard
  if (role === 'super_admin') return NextResponse.next();

  // Tenant mismatch — user is trying to access a different tenant's dashboard
  if (cookieTenantId !== urlTenantId) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on all paths except Next.js internals and static assets
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
