import { adminDb as db } from '@/lib/firebase/admin';
import type { TenantMatchScore } from '../types';

function zipProximityScore(applicantZip: string, tenantZip: string): number {
    if (!applicantZip || !tenantZip) return 20;
    const a = parseInt(applicantZip.slice(0, 3), 10);
    const t = parseInt(tenantZip.slice(0, 3), 10);
    if (isNaN(a) || isNaN(t)) return 20;
    const diff = Math.abs(a - t);
    return Math.max(0, 40 - diff * 0.4);
}

function specializationScore(applicantPrefs: string[], tenantSpecs: string[]): number {
    if (!applicantPrefs.length || !tenantSpecs.length) return 20;
    const overlap = applicantPrefs.filter(p => tenantSpecs.includes(p)).length;
    return Math.min(40, (overlap / applicantPrefs.length) * 40);
}

function capacityScore(availableBeds: number): number {
    if (availableBeds > 3) return 20;
    if (availableBeds > 0) return 10;
    return 0;
}

export async function getMatchedTenants(
    applicantZip: string,
    applicantPrefs: string[] = [],
    limit = 10
): Promise<TenantMatchScore[]> {
    const snapshot = await db
        .collection('tenants')
        .where('status', '==', 'active')
        .get();

    const scores: TenantMatchScore[] = snapshot.docs.map(doc => {
        const t = doc.data();
        const prox = zipProximityScore(applicantZip, t.zipCode ?? '');
        const spec = specializationScore(applicantPrefs, t.specializations ?? []);
        const cap = capacityScore(t.availableBeds ?? 0);
        return {
            tenantId: doc.id,
            tenantName: t.name ?? 'Unknown',
            city: t.city ?? '',
            state: t.state ?? '',
            zipCode: t.zipCode ?? '',
            score: Math.round(prox + spec + cap),
            specializationOverlap: spec,
            hasCapacity: (t.availableBeds ?? 0) > 0,
            availableBeds: t.availableBeds,
            specializations: t.specializations ?? [],
        };
    });

    return scores.sort((a, b) => b.score - a.score).slice(0, limit);
}
