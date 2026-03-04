// app/api/oauth/meta/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
    // Redirect to accounts page with coming-soon flag
    return NextResponse.redirect(new URL('/login?meta=coming-soon', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'));
}
