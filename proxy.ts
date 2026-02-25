import { NextRequest, NextResponse } from 'next/server';

// All auth is handled at:
//   - API layer: verifyAuthToken() Bearer token check
//   - Dashboard layout: useAuth() hook redirects
// Firebase Web SDK stores auth in localStorage/IndexedDB — NOT cookies.
// The proxy has no role in auth validation — just pass through.
export async function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
