// app/api/tenants/[tenantId]/marketing/posts/[postId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { postsService } from '@/features/marketing/services/postsService';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ tenantId: string; postId: string }> }
) {
    try {
        const token = await verifyAuthToken(request);
        const { tenantId, postId } = await params;
        if (token.role !== 'super_admin' && token.tenant_id !== tenantId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        const updates = await request.json();
        await postsService.update(tenantId, postId, updates);
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ tenantId: string; postId: string }> }
) {
    try {
        const token = await verifyAuthToken(request);
        const { tenantId, postId } = await params;
        if (token.role !== 'super_admin' && token.tenant_id !== tenantId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        await postsService.delete(tenantId, postId);
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
