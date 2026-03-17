import { adminDb as db } from '@/lib/firebase/admin';
import type { TenantMatchScore } from '../types';

export interface BedHints {
    matStatus?: boolean;          // true = applicant on MAT
    genderPreference?: string;    // "Men's" | "Women's" | "Co-ed" | "No preference"
    isOpioidUse?: boolean;        // true = SOR grant eligible
    incomeBracket?: string;       // For financial matching
    maxDistance?: number;         // Max travel radius in miles
}

function calculateDistance(zip1: string, zip2: string): number {
    if (!zip1 || !zip2) return 999;
    const a = parseInt(zip1.slice(0, 3), 10);
    const t = parseInt(zip2.slice(0, 3), 10);
    if (isNaN(a) || isNaN(t)) return 999;
    // VERY rough approximation: 1 zip unit difference ~20 miles
    return Math.abs(a - t) * 20;
}

function zipProximityScore(distance: number, maxDistance: number): number {
    if (distance > maxDistance) return -500; // Force out of top results
    return Math.max(0, 40 - (distance / 5)); // 40 points for 0 miles, 0 points for 200 miles
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
        const dist = calculateDistance(applicantZip, (t.zipCode as string) ?? '');
        const maxDist = bedHints?.maxDistance || 50;

        const prox = zipProximityScore(dist, maxDist);
        const spec = specializationScore(applicantPrefs, (t.specializations as string[]) ?? []);
        const cap = capacityScore((t.availableBeds as number) ?? 0);
        const mat = matScore(bedHints, t);
        const gender = genderScore(bedHints, t);

        // SOR Grant Matching
        const isSorProvider = t.isSorProvider === true;
        const applicantIsSorEligible = bedHints?.isOpioidUse === true;
        const isSorMatch = isSorProvider && applicantIsSorEligible;

        return {
            tenantId: doc.id,
            tenantName: (t.name as string) ?? 'Unknown',
            city: (t.city as string) ?? '',
            state: (t.state as string) ?? '',
            zipCode: (t.zipCode as string) ?? '',
            score: Math.max(0, Math.round(prox + spec + cap + mat + gender + (isSorMatch ? 20 : 0))),
            specializationOverlap: spec,
            hasCapacity: ((t.availableBeds as number) ?? 0) > 0,
            availableBeds: t.availableBeds as number | undefined,
            specializations: (t.specializations as string[]) ?? [],
            isSorEligible: isSorMatch,
            distanceMiles: dist,
            financialMatch: isSorMatch ? 'SOR Grant Eligible' : 'Self-Pay / Insurance',
        };
    });

    return scores
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}
