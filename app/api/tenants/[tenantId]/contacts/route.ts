import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

type Params = Promise<{ tenantId: string }>;

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId } = await params;

    if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const snapshot = await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('contacts')
      .orderBy('createdAt', 'desc')
      .get();

    const contacts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() ?? null,
    }));

    return NextResponse.json({ contacts });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = (error as { statusCode?: number }).statusCode ?? 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId } = await params;

    if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, role, phone, email, tags } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const docRef = await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('contacts')
      .add({
        name: name.trim(),
        role: role?.trim() ?? '',
        phone: phone?.trim() ?? '',
        email: email?.trim() ?? '',
        tags: tags ?? [],
        createdBy: token.uid,
        createdAt: FieldValue.serverTimestamp(),
      });

    return NextResponse.json({ success: true, id: docRef.id }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = (error as { statusCode?: number }).statusCode ?? 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId } = await params;

    if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id query param required' }, { status: 400 });
    }

    await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('contacts')
      .doc(id)
      .delete();

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = (error as { statusCode?: number }).statusCode ?? 500;
    return NextResponse.json({ error: message }, { status });
  }
}
