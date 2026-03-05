import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = await verifyAuthToken(request);
    if (!token || token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000);

    // Run all queries in parallel
    const [
      tenantsSnap,
      applicationsSnap,
      recentApplicationsSnap,
      conversationsSnap,
    ] = await Promise.all([
      // All tenants
      adminDb.collection('tenants').get(),
      // All applications (for funnel)
      adminDb.collection('applications').select('status', 'type', 'submittedAt').limit(500).get(),
      // Applications submitted in last 30 days
      adminDb.collection('applications').where('submittedAt', '>=', thirtyDaysAgo).get(),
      // AI conversations (platform-wide)
      adminDb.collection('conversations').select('messageCount', 'updatedAt', 'tenantId').limit(1000).get(),
    ]);

    // ── Tenant stats ──────────────────────────────────────────────────────────
    const tenants = tenantsSnap.docs.map(d => ({ id: d.id, ...d.data() } as {
      id: string;
      name: string;
      status: string;
      subscription?: { plan: string; status: string };
      createdAt: string;
      updatedAt: string;
    }));

    const totalTenants = tenants.length;
    const activeTenants = tenants.filter(t => t.status === 'active' || t.status === 'approved').length;
    const pendingTenants = tenants.filter(t => t.status === 'pending').length;

    // Fetch resident count for each tenant (collection group would be ideal but
    // we'll do per-tenant for accuracy with reasonable limits)
    const tenantHealthRows = await Promise.all(
      tenants.slice(0, 50).map(async (t) => {
        try {
          const [enrollSnap] = await Promise.all([
            adminDb.collection(`tenants/${t.id}/enrollments`).where('status', '==', 'active').get(),
          ]);
          return {
            id: t.id,
            name: t.name,
            status: t.status,
            residentCount: enrollSnap.size,
            plan: t.subscription?.plan ?? 'free',
            lastActive: t.updatedAt ?? null,
          };
        } catch {
          return {
            id: t.id,
            name: t.name,
            status: t.status,
            residentCount: 0,
            plan: t.subscription?.plan ?? 'free',
            lastActive: t.updatedAt ?? null,
          };
        }
      })
    );

    // Total residents across all tenants
    const totalResidents = tenantHealthRows.reduce((sum, t) => sum + t.residentCount, 0);

    // ── Application funnel ────────────────────────────────────────────────────
    interface AppData { status: string; type: string; submittedAt?: { toDate?: () => Date } | string }
    const allApps = applicationsSnap.docs.map(d => d.data() as AppData);

    const appFunnel = {
      pending: allApps.filter(a => a.status === 'pending').length,
      assigned: allApps.filter(a => a.status === 'assigned').length,
      accepted: allApps.filter(a => a.status === 'accepted').length,
      rejected: allApps.filter(a => a.status === 'rejected').length,
      total: allApps.length,
    };

    const appsByType = {
      bed: allApps.filter(a => a.type === 'bed').length,
      staff: allApps.filter(a => a.type === 'staff').length,
      other: allApps.filter(a => a.type !== 'bed' && a.type !== 'staff').length,
    };

    const recentApplications = recentApplicationsSnap.size;

    // ── AI Usage ─────────────────────────────────────────────────────────────
    interface ConvData { messageCount?: number; updatedAt?: string }
    const conversations = conversationsSnap.docs.map(d => d.data() as ConvData);
    const totalConversations = conversations.length;
    const avgMessages = totalConversations > 0
      ? Math.round(conversations.reduce((sum, c) => sum + (c.messageCount ?? 0), 0) / totalConversations)
      : 0;

    return NextResponse.json({
      platform: {
        totalTenants,
        activeTenants,
        pendingTenants,
        totalResidents,
        recentApplications, // last 30 days
        totalConversations,
        avgMessagesPerConversation: avgMessages,
      },
      tenantHealth: tenantHealthRows
        .sort((a, b) => b.residentCount - a.residentCount)
        .slice(0, 20),
      applicationFunnel: appFunnel,
      applicationsByType: appsByType,
      generatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error('GET /api/admin/analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
