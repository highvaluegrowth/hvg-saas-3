import { adminDb } from '@/lib/firebase/admin';

export interface AIAction {
    id?: string;
    tier: 'resident' | 'operator' | 'superadmin';
    uid: string;
    tenantId?: string;
    toolName: string;
    toolArgs: Record<string, any>;
    reasoning?: string;
    status: 'success' | 'failed' | 'pending_confirmation';
    authorizedBy?: string; // UID of the human who confirmed if HITL
    timestamp: string;
    executionData?: any;
}

/**
 * The Action Ledger provides an immutable audit trail of every autonomous 
 * action taken by HVG Outlet.
 */
export const actionLedger = {
    /**
     * Logs a completed or attempted AI action.
     */
    async logAction(action: Omit<AIAction, 'timestamp'>): Promise<string> {
        const logRef = adminDb.collection('aiActionLedger').doc();
        const timestamp = new Date().toISOString();
        
        const fullAction: AIAction = {
            ...action,
            id: logRef.id,
            timestamp,
        };

        await logRef.set(fullAction);
        
        // Also secondary index for tenant-specific audit logs
        if (action.tenantId) {
            await adminDb
                .collection(`tenants/${action.tenantId}/aiAudit`)
                .doc(logRef.id)
                .set(fullAction);
        }

        return logRef.id;
    },

    /**
     * Queries the ledger for a specific tenant or user.
     */
    async getAuditLog(filters: { tenantId?: string; uid?: string; limit?: number }) {
        let query: FirebaseFirestore.Query = adminDb.collection('aiActionLedger');
        
        if (filters.tenantId) query = query.where('tenantId', '==', filters.tenantId);
        if (filters.uid) query = query.where('uid', '==', filters.uid);
        
        const snap = await query.orderBy('timestamp', 'desc').limit(filters.limit || 50).get();
        return snap.docs.map(doc => doc.data() as AIAction);
    }
};
