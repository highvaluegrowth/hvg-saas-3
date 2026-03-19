// proxy.ts — Unified routing and protection.
// Combines hostname-based routing and tenant-route protection.
//
// IMPORTANT: Firebase Admin SDK is not available in the Edge Runtime, so this
// middleware does NOT cryptographically verify Firebase ID tokens. It reads a
// lightweight routing-hint cookie (`hvg-session`) set by `useAuth.ts` after
// successful Firebase sign-in.
//
// Real security enforcement is at:
//   1. Firestore security rules (tenant_id claim checks)
//   2. API routes — `verifyAuthToken()` in `lib/middleware/authMiddleware.ts`

import { NextRequest, NextResponse } from 'next/server';

// Hostnames
const MARKETING_HOST = 'highvaluegrowth.com';
const SAAS_HOST = 'app.hvg.app';
const DOWNLOAD_HOST = 'hvg.app';

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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = (request.headers.get('host') ?? '').split(':')[0];
  const firstSegment = pathname.split('/')[1] ?? '';

  // 1. Hostname-based routing
  // app.hvg.app → SaaS Dashboard
  if (hostname === SAAS_HOST) {
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Block pure marketing routes from the SaaS hostname
    if (pathname === '/donate' || pathname === '/transparency') {
      return NextResponse.redirect(
        new URL(`https://${MARKETING_HOST}${pathname}`, request.url)
      );
    }
  }

  // hvg.app — App Download
  else if (hostname === DOWNLOAD_HOST || hostname === `www.${DOWNLOAD_HOST}`) {
    if (pathname !== '/download') {
      return NextResponse.redirect(
        new URL(`https://${DOWNLOAD_HOST}/download`, request.url)
      );
    }
    return NextResponse.next();
  }

  // highvaluegrowth.com — Marketing
  else if (hostname === MARKETING_HOST || hostname === `www.${MARKETING_HOST}`) {
    // Operators accessing dashboard from the marketing domain → send to SaaS
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/login')) {
      return NextResponse.redirect(
        new URL(`https://${SAAS_HOST}${pathname}`, request.url)
      );
    }
  }

  // 2. Tenant-route protection (from middleware.ts)
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

  // Cookie format: "{tenantId}|{role}"
  const pipeIdx = sessionCookie.lastIndexOf('|');
  if (pipeIdx === -1) {
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
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
