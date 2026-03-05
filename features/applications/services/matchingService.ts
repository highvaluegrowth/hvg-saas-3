import { adminDb as db } from '@/lib/firebase/admin';
import type { TenantMatchScore } from '../types';

export interface BedHints {
    matStatus?: boolean;          // true = applicant on MAT
    genderPreference?: string;    // "Men's" | "Women's" | "Co-ed" | "No preference"
}

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

function matScore(hints: BedHints | undefined, tenantData: Record<string, unknown>): number {
    if (hints?.matStatus === undefined) return 0;
    const tenantMatFriendly = tenantData.matFriendly;
    if (tenantMatFriendly === undefined) return 0; // field not set — neutral
    if (hints.matStatus && tenantMatFriendly === true) return 10;
    if (hints.matStatus && tenantMatFriendly === false) return -20;
    return 0;
}

function genderScore(hints: BedHints | undefined, tenantData: Record<string, unknown>): number {
    const pref = hints?.genderPreference;
    if (!pref || pref === 'No preference' || pref === '') return 0;
    const tenantGender = tenantData.genderType as string | undefined;
    if (!tenantGender) return 0; // field not set — neutral
    if (tenantGender === pref) return 10;
    if (tenantGender !== 'Co-ed') return -30; // applicant wants Men's but house is Women's (or vice versa)
    return 0;
}

export async function getMatchedTenants(
    applicantZip: string,
    applicantPrefs: string[] = [],
    limit = 10,
    bedHints?: BedHints
): Promise<TenantMatchScore[]> {
    const snapshot = await db
        .collection('tenants')
        .where('status', '==', 'active')
        .get();

    const scores: TenantMatchScore[] = snapshot.docs.map(doc => {
        const t = doc.data() as Record<string, unknown>;
        const prox = zipProximityScore(applicantZip, (t.zipCode as string) ?? '');
        const spec = specializationScore(applicantPrefs, (t.specializations as string[]) ?? []);
        const cap = capacityScore((t.availableBeds as number) ?? 0);
        const mat = matScore(bedHints, t);
        const gender = genderScore(bedHints, t);
        return {
            tenantId: doc.id,
            tenantName: (t.name as string) ?? 'Unknown',
            city: (t.city as string) ?? '',
            state: (t.state as string) ?? '',
            zipCode: (t.zipCode as string) ?? '',
            score: Math.max(0, Math.round(prox + spec + cap + mat + gender)),
            specializationOverlap: spec,
            hasCapacity: ((t.availableBeds as number) ?? 0) > 0,
            availableBeds: t.availableBeds as number | undefined,
            specializations: (t.specializations as string[]) ?? [],
        };
    });

    return scores.sort((a, b) => b.score - a.score).slice(0, limit);
}
