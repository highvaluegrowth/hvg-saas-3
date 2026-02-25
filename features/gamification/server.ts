import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { Course, Enrollment } from '@/types/lms/course';

/**
 * Awards gamification points to a user based on Quiz completions or Course completions.
 * This should ONLY be run securely via server functions.
 */
export async function awardPoints(params: {
    tenantId: string | 'system';
    userId: string;
    points: number;
    reason: string;
    resourceId: string;
}) {
    const { tenantId, userId, points, reason, resourceId } = params;

    if (points <= 0) return; // Cannot award 0 points

    // 1. Update the Global Profile Gamification Record
    const globalProfileRef = adminDb.collection('gamification').doc('global').collection('profiles').doc(userId);

    // 2. Update the Tenant-Specific Gamification Record
    // System content awards points globally, but maybe not for a specific tenant unless indicated
    const tenantProfileRef = tenantId !== 'system'
        ? adminDb.collection('gamification').doc(`tenant_${tenantId}`).collection('profiles').doc(userId)
        : null;

    const batch = adminDb.batch();

    const HistoryPayload = {
        points,
        reason,
        resourceId,
        timestamp: FieldValue.serverTimestamp(),
        tenantId
    };

    // Add history to Global
    batch.set(globalProfileRef.collection('history').doc(), HistoryPayload);
    batch.set(globalProfileRef, {
        totalPoints: FieldValue.increment(points),
        lastActivity: FieldValue.serverTimestamp()
    }, { merge: true });

    if (tenantProfileRef) {
        // Add history to Tenant
        batch.set(tenantProfileRef.collection('history').doc(), HistoryPayload);
        batch.set(tenantProfileRef, {
            totalPoints: FieldValue.increment(points),
            lastActivity: FieldValue.serverTimestamp()
        }, { merge: true });
    }

    await batch.commit();

    return { success: true, pointsAwarded: points };
}

export async function processCourseCompletion(course: Course, enrollmentId: string) {
    const actions = course.postCompletionActions;

    for (const action of actions) {
        if (action.type === 'NOTIFY_STAFF') {
            // Implementation handled separately
        }
        else if (action.type === 'PHASE_PROMOTE') {
            // Read target phase from metadata and update resident profile
        }
        else if (action.type === 'AWARD_BADGE') {
            // Update gamification Badges collection
        }
    }
}
