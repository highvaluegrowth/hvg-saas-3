// app/api/tenants/[tenantId]/lms/courses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { courseService } from '@/features/lms/services/courseService';

export const dynamic = 'force-dynamic';


export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ tenantId: string }> }
) {
    try {
        const token = await verifyAuthToken(request);
        const { tenantId } = await params;
        if (token.role !== 'super_admin' && token.tenant_id !== tenantId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        const courses = await courseService.list(tenantId);
        return NextResponse.json({ courses });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ tenantId: string }> }
) {
    try {
        const token = await verifyAuthToken(request);
        const { tenantId } = await params;
        if (token.role !== 'super_admin' && token.tenant_id !== tenantId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        const body = await request.json();
        const { title, description, visibility } = body;
        if (!title || typeof title !== 'string') {
            return NextResponse.json({ error: 'title is required' }, { status: 400 });
        }
        const resolvedVisibility: 'tenant' | 'universal' = visibility === 'universal' ? 'universal' : 'tenant';
        const course = await courseService.create(tenantId, token.uid, {
            title,
            description: description ?? '',
            visibility: resolvedVisibility,
        });
        return NextResponse.json({ course }, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
