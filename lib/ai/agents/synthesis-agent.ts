import { Type, Tool } from '@google/genai';
import { adminDb } from '@/lib/firebase/admin';
import { getMatchedTenants } from '@/features/applications/services/matchingService';

export const synthesisTools: Tool[] = [
    {
        functionDeclarations: [
            {
                name: 'list_applications',
                description: 'List applications submitted to the platform. SuperAdmin only. Can filter by type and/or status.',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING, enum: ['bed', 'staff', 'course', 'event', 'tenant'], description: 'Filter by application type (optional)' },
                        status: { type: Type.STRING, enum: ['pending', 'assigned', 'accepted', 'rejected', 'archived'], description: 'Filter by application status (optional)' },
                        limit: { type: Type.NUMBER, description: 'Max results to return (default 20, max 50)' },
                    },
                },
            },
            {
                name: 'assign_application',
                description: 'Assign an application to a specific tenant. SuperAdmin only.',
                parameters: {
                    type: Type.OBJECT,
                    required: ['applicationId', 'tenantId'],
                    properties: {
                        applicationId: { type: Type.STRING, description: 'The application document ID' },
                        tenantId: { type: Type.STRING, description: 'The tenant to assign the application to' },
                    },
                },
            },
            {
                name: 'get_match_suggestions',
                description: 'Get ranked list of best-matching tenants for a given application. SuperAdmin only.',
                parameters: {
                    type: Type.OBJECT,
                    required: ['applicationId'],
                    properties: {
                        applicationId: { type: Type.STRING, description: 'The application document ID to find matches for' },
                    },
                },
            },
            {
                name: 'get_platform_analytics',
                description: 'Get platform-wide analytics: total tenants, residents, applications by type and status. SuperAdmin only.',
                parameters: {
                    type: Type.OBJECT,
                    properties: {},
                },
            },
        ]
    }
];

export async function executeSynthesisTool(
    toolName: string,
    args: Record<string, unknown>,
    context: { uid: string }
): Promise<Record<string, unknown>> {
    const now = new Date();

    if (toolName === 'list_applications') {
        const limit = typeof args.limit === 'number' ? Math.min(args.limit, 50) : 20;
        let query: FirebaseFirestore.Query = adminDb.collection('applications');
        if (typeof args.type === 'string') query = query.where('type', '==', args.type);
        if (typeof args.status === 'string') query = query.where('status', '==', args.status);
        query = query.orderBy('submittedAt', 'desc').limit(limit);
        const snap = await query.get();
        const applications = snap.docs.map(d => ({
            id: d.id,
            type: d.data().type,
            status: d.data().status,
            applicantName: d.data().applicantName ?? d.data().data?.name ?? null,
            applicantEmail: d.data().applicantEmail ?? d.data().data?.email ?? null,
            zipCode: d.data().zipCode ?? d.data().data?.zipCode ?? null,
            submittedAt: d.data().submittedAt?.toDate?.()?.toISOString() ?? null,
        }));
        return { applications };
    }

    if (toolName === 'assign_application') {
        const applicationId = args.applicationId as string;
        const assignedTenantId = args.tenantId as string;
        const assignedAt = now.toISOString();
        await adminDb.collection('applications').doc(applicationId).update({
            status: 'assigned',
            assignedTenantId,
            assignedAt,
        });
        await adminDb.collection(`tenants/${assignedTenantId}/assignedApplications`).doc(applicationId).set({
            applicationId,
            assignedAt,
        });
        return { success: true, applicationId, tenantId: assignedTenantId };
    }

    if (toolName === 'get_match_suggestions') {
        const applicationId = args.applicationId as string;
        const appDoc = await adminDb.collection('applications').doc(applicationId).get();
        if (!appDoc.exists) return { error: `Application ${applicationId} not found` };
        const appData = appDoc.data()!;
        const zipCode: string = appData.zipCode ?? appData.data?.zipCode ?? '';
        const specializations: string[] = appData.data?.specializations ?? [];
        const matches = await getMatchedTenants(zipCode, specializations, 5);
        return { applicationId, matches };
    }

    if (toolName === 'get_platform_analytics') {
        const [totalSnap, pendingSnap, assignedSnap, tenantsSnap] = await Promise.all([
            adminDb.collection('applications').count().get(),
            adminDb.collection('applications').where('status', '==', 'pending').count().get(),
            adminDb.collection('applications').where('status', '==', 'assigned').count().get(),
            adminDb.collection('tenants').count().get(),
        ]);
        return {
            totalApplications: totalSnap.data().count,
            pendingApplications: pendingSnap.data().count,
            assignedApplications: assignedSnap.data().count,
            totalTenants: tenantsSnap.data().count,
        };
    }

    return { error: `Unknown synthesis tool: ${toolName}` };
}
