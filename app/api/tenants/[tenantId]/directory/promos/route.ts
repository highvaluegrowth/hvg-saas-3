import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

type Params = Promise<{ tenantId: string }>;

export async function GET(
  _request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { tenantId } = await params;

    const snapshot = await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('promos')
      .where('active', '==', true)
      .get();

    const promos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ promos });
  } catch (error) {
    console.error('GET /api/tenants/[tenantId]/directory/promos:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const token = await verifyAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId } = await params;

    if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json() as {
      title: string;
      description: string;
      partnerName: string;
      discountText: string;
      expiresAt?: string;
      active?: boolean;
    };

    if (!body.title || !body.description || !body.partnerName || !body.discountText) {
      return NextResponse.json({ error: 'title, description, partnerName, and discountText are required' }, { status: 400 });
    }

    const promoData = {
      title: body.title,
      description: body.description,
      partnerName: body.partnerName,
      discountText: body.discountText,
      expiresAt: body.expiresAt ?? null,
      active: body.active ?? true,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: token.uid,
    };

    const docRef = await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('promos')
      .add(promoData);

    return NextResponse.json({ success: true, id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error('POST /api/tenants/[tenantId]/directory/promos:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const token = await verifyAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId } = await params;

    if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json() as {
      id: string;
      title?: string;
      description?: string;
      partnerName?: string;
      discountText?: string;
      expiresAt?: string | null;
      active?: boolean;
    };

    if (!body.id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { id, ...rest } = body;
    const updates: Record<string, unknown> = {};
    const allowed = ['title', 'description', 'partnerName', 'discountText', 'expiresAt', 'active'] as const;
    for (const key of allowed) {
      if (rest[key] !== undefined) {
        updates[key] = rest[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 });
    }

    updates.updatedAt = FieldValue.serverTimestamp();

    await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('promos')
      .doc(id)
      .update(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/tenants/[tenantId]/directory/promos:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const token = await verifyAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId } = await params;

    if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const promoId = searchParams.get('id');

    if (!promoId) {
      return NextResponse.json({ error: 'Query param ?id= is required' }, { status: 400 });
    }

    await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('promos')
      .doc(promoId)
      .delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/tenants/[tenantId]/directory/promos:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
