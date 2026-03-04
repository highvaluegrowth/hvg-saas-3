// app/api/oauth/tiktok/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function GET(_request: NextRequest) {
    return NextResponse.redirect(`${BASE_URL}/login?tiktok=coming-soon`);
}
