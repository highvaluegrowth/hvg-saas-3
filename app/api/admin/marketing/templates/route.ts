// app/api/admin/marketing/templates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { templatesService } from '@/features/marketing/services/templatesService';

export async function POST(request: NextRequest) {
    try {
        const token = await verifyAuthToken(request);
        if (token.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        const body = await request.json();
        const template = await templatesService.create(token.uid, body);
        return NextResponse.json({ template }, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
