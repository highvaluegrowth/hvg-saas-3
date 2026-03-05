import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb } from '@/lib/firebase/admin';
import type { UserRole } from '@/features/auth/types/auth.types';

export const dynamic = 'force-dynamic';

type Params = Promise<{ tenantId: string }>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId } = await params;

    if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allowedRoles: UserRole[] = ['tenant_admin', 'staff_admin', 'super_admin'];
    if (!allowedRoles.includes(token.role as UserRole)) {
      return NextResponse.json({ error: 'Insufficient role' }, { status: 403 });
    }

    const url = new URL(request.url);
    const statusFilter = url.searchParams.get('status');

    let query = adminDb
      .collection('contracts')
      .where('tenantId', '==', tenantId) as FirebaseFirestore.Query;

    if (statusFilter) {
      query = query.where('status', '==', statusFilter);
    }

    query = query.orderBy('createdAt', 'desc');

    const snap = await query.get();
    const contracts = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        ...d,
        createdAt: d.createdAt?.toDate?.()?.toISOString() ?? d.createdAt ?? null,
        sentAt: d.sentAt?.toDate?.()?.toISOString() ?? d.sentAt ?? null,
        signedAt: d.signedAt?.toDate?.()?.toISOString() ?? d.signedAt ?? null,
        updatedAt: d.updatedAt?.toDate?.()?.toISOString() ?? d.updatedAt ?? null,
      };
    });

    return NextResponse.json({ contracts });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId } = await params;

    if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allowedRoles: UserRole[] = ['tenant_admin', 'staff_admin', 'super_admin'];
    if (!allowedRoles.includes(token.role as UserRole)) {
      return NextResponse.json({ error: 'Insufficient role' }, { status: 403 });
    }

    const body = await request.json();
    const { residentName, residentEmail, templateId = 'default' } = body as {
      residentName: string;
      residentEmail: string;
      templateId?: string;
    };

    if (!residentName || !residentEmail) {
      return NextResponse.json(
        { error: 'residentName and residentEmail are required' },
        { status: 400 }
      );
    }

    // Get template title
    let templateTitle = 'Resident Intake Agreement';
    if (templateId !== 'default') {
      const tmplSnap = await adminDb
        .collection('tenants')
        .doc(tenantId)
        .collection('contractTemplates')
        .doc(templateId)
        .get();
      if (tmplSnap.exists) {
        templateTitle = tmplSnap.data()!.title ?? templateTitle;
      }
    }

    const now = new Date().toISOString();
    const docRef = adminDb.collection('contracts').doc();

    await docRef.set({
      tenantId,
      residentName,
      residentEmail,
      templateId,
      templateTitle,
      status: 'pending',
      createdAt: now,
      sentAt: now,
      updatedAt: now,
    });

    // Build the signing URL
    const signingUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/sign/${docRef.id}`;

    return NextResponse.json({ success: true, id: docRef.id, signingUrl }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId } = await params;

    if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, status } = body as { id: string; status: 'voided' };

    if (!id || !['voided'].includes(status)) {
      return NextResponse.json({ error: 'id and valid status required' }, { status: 400 });
    }

    const docRef = adminDb.collection('contracts').doc(id);
    const snap = await docRef.get();
    if (!snap.exists || snap.data()?.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    await docRef.update({ status, updatedAt: new Date().toISOString() });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
