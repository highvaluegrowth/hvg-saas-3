// app/api/tenants/[tenantId]/lms/courses/[courseId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { courseService } from '@/features/lms/services/courseService';

export const dynamic = 'force-dynamic';


export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ tenantId: string; courseId: string }> }
) {
    try {
        const token = await verifyAuthToken(request);
        const { tenantId, courseId } = await params;
        if (token.role !== 'super_admin' && token.tenant_id !== tenantId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        const course = await courseService.get(tenantId, courseId);
        if (!course) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }
        return NextResponse.json({ course });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ tenantId: string; courseId: string }> }
) {
    try {
        const token = await verifyAuthToken(request);
        const { tenantId, courseId } = await params;
        if (token.role !== 'super_admin' && token.tenant_id !== tenantId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        const body = await request.json();
        const allowed = ['title', 'description', 'visibility', 'published'] as const;
        const updates: Record<string, unknown> = {};
        for (const key of allowed) {
            if (key in body) updates[key] = body[key];
        }
        await courseService.update(tenantId, courseId, updates);
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ tenantId: string; courseId: string }> }
) {
    try {
        const token = await verifyAuthToken(request);
        const { tenantId, courseId } = await params;
        if (token.role !== 'super_admin' && token.tenant_id !== tenantId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        await courseService.delete(tenantId, courseId);
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
