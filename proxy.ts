import { NextRequest, NextResponse } from 'next/server';

/**
 * Hostname-based routing
 *
 *  highvaluegrowth.com      → (marketing) — public landing page
 *  app.hvg.app              → (dashboard) / (auth) — SaaS product
 *  hvg.app / www.hvg.app    → /download — app store links
 *
 *  Local dev & Vercel preview URLs pass through unmodified.
 *
 * Auth validation is intentionally NOT done here:
 *  - API layer: verifyAuthToken() Bearer token check
 *  - Dashboard layout: useAuth() hook redirects client-side
 *  - Firebase Web SDK stores auth in localStorage/IndexedDB, not cookies
 */

const MARKETING_HOST = 'highvaluegrowth.com';
const SAAS_HOST = 'app.hvg.app';
const DOWNLOAD_HOST = 'hvg.app';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = (request.headers.get('host') ?? '').split(':')[0];

  // Pass through Next.js internals and API routes always
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // ── app.hvg.app → SaaS Dashboard ────────────────────────────────────────
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
    return NextResponse.next();
  }

  // ── hvg.app — App Download ───────────────────────────────────────────────
  if (hostname === DOWNLOAD_HOST || hostname === `www.${DOWNLOAD_HOST}`) {
    if (pathname !== '/download') {
      return NextResponse.redirect(
        new URL(`https://${DOWNLOAD_HOST}/download`, request.url)
      );
    }
    return NextResponse.next();
  }

  // ── highvaluegrowth.com — Marketing ─────────────────────────────────────
  if (hostname === MARKETING_HOST || hostname === `www.${MARKETING_HOST}`) {
    // Operators accessing dashboard from the marketing domain → send to SaaS
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/login')) {
      return NextResponse.redirect(
        new URL(`https://${SAAS_HOST}${pathname}`, request.url)
      );
    }
    return NextResponse.next();
  }

  // ── Local dev / Vercel preview — pass everything through ─────────────────
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
