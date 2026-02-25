import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { createChoreService } from '@/features/chores/services/choreService';
import { CreateChoreSchema } from '@/features/chores/schemas/chore.schemas';
import { canWrite } from '@/lib/utils/permissions';
import { UserRole } from '@/features/auth/types/auth.types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId } = await params;

    if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const choreService = createChoreService(tenantId);
    const chores = await choreService.getAllChores();

    return NextResponse.json({ chores });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = (error as { statusCode?: number }).statusCode ?? 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId } = await params;

    if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!canWrite(token.role as UserRole)) {
      return NextResponse.json({ error: 'Forbidden: insufficient role' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = CreateChoreSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const choreService = createChoreService(tenantId);
    const chore = await choreService.createChore(parsed.data, token.uid);

    return NextResponse.json({ chore }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = (error as { statusCode?: number }).statusCode ?? 500;
    return NextResponse.json({ error: message }, { status });
  }
}
