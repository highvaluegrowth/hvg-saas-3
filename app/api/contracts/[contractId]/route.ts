import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebase/admin';
import { generateSignedContractPdf } from '@/lib/contracts/pdfGenerator';
import { DEFAULT_TEMPLATE } from '@/features/contracts/types';

export const dynamic = 'force-dynamic';

type Params = Promise<{ contractId: string }>;

// Public GET — signing page needs to read the contract
export async function GET(_req: NextRequest, { params }: { params: Params }) {
  try {
    const { contractId } = await params;
    const snap = await adminDb.collection('contracts').doc(contractId).get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }
    const data = snap.data()!;

    // Fetch template body
    let templateBody = DEFAULT_TEMPLATE.body;
    let templateTitle = DEFAULT_TEMPLATE.title;
    if (data.templateId && data.templateId !== 'default') {
      const tmplSnap = await adminDb
        .collection('tenants')
        .doc(data.tenantId)
        .collection('contractTemplates')
        .doc(data.templateId)
        .get();
      if (tmplSnap.exists) {
        templateBody = tmplSnap.data()!.body ?? DEFAULT_TEMPLATE.body;
        templateTitle = tmplSnap.data()!.title ?? DEFAULT_TEMPLATE.title;
      }
    }

    return NextResponse.json({
      contract: {
        id: snap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt ?? null,
        sentAt: data.sentAt?.toDate?.()?.toISOString() ?? data.sentAt ?? null,
        signedAt: data.signedAt?.toDate?.()?.toISOString() ?? data.signedAt ?? null,
      },
      templateTitle,
      templateBody,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Public POST — resident signs
export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const { contractId } = await params;
    const body = await request.json();
    const { signatureDataUrl, residentName } = body as {
      signatureDataUrl: string;
      residentName?: string;
    };

    if (!signatureDataUrl?.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Valid signature image required' }, { status: 400 });
    }

    const docRef = adminDb.collection('contracts').doc(contractId);
    const snap = await docRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }
    const data = snap.data()!;

    if (data.status !== 'pending') {
      return NextResponse.json(
        { error: `Contract is already ${data.status}` },
        { status: 409 }
      );
    }

    // Get template body
    let templateBody = DEFAULT_TEMPLATE.body;
    let templateTitle = DEFAULT_TEMPLATE.title;
    if (data.templateId && data.templateId !== 'default') {
      const tmplSnap = await adminDb
        .collection('tenants')
        .doc(data.tenantId)
        .collection('contractTemplates')
        .doc(data.templateId)
        .get();
      if (tmplSnap.exists) {
        templateBody = tmplSnap.data()!.body ?? DEFAULT_TEMPLATE.body;
        templateTitle = tmplSnap.data()!.title ?? DEFAULT_TEMPLATE.title;
      }
    }

    // Generate PDF
    const signedAt = new Date().toISOString();
    const pdfBytes = await generateSignedContractPdf({
      templateTitle,
      templateBody,
      residentName: residentName ?? data.residentName ?? 'Unknown',
      signatureDataUrl,
      signedAt,
    });

    // Upload PDF to Firebase Storage
    const bucket = adminStorage.bucket();
    const pdfPath = `tenants/${data.tenantId}/contracts/${contractId}.pdf`;
    const file = bucket.file(pdfPath);

    await file.save(Buffer.from(pdfBytes), {
      metadata: { contentType: 'application/pdf' },
    });

    await file.makePublic();
    const pdfUrl = `https://storage.googleapis.com/${bucket.name}/${pdfPath}`;

    // Update Firestore
    await docRef.update({
      status: 'signed',
      signedAt,
      pdfUrl,
      updatedAt: signedAt,
    });

    return NextResponse.json({ success: true, pdfUrl });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
