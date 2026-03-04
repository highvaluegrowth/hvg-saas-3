import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { lessonService } from '@/features/lms/services/lessonService';

export const dynamic = 'force-dynamic';


type Params = Promise<{ tenantId: string; courseId: string; lessonId: string }>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const { tenantId, courseId, lessonId } = await params;
    const token = await verifyAuthToken(request);
    if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const lesson = await lessonService.get(tenantId, courseId, lessonId);
    if (!lesson) {
      // Return empty scaffold so editor knows the type from curriculum
      return NextResponse.json({ lesson: null }, { status: 200 });
    }
    return NextResponse.json({ lesson });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    const status = message.includes('Missing') || message.includes('invalid') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const { tenantId, courseId, lessonId } = await params;
    const token = await verifyAuthToken(request);
    if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const lesson = await lessonService.upsert(tenantId, courseId, lessonId, body);
    return NextResponse.json({ lesson });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    const status = message.includes('Missing') || message.includes('invalid') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
