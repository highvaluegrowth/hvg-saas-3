// features/marketing/services/accountsService.ts
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { SocialAccount } from '../types';

function accountsRef(tenantId: string) {
    return adminDb.collection('tenants').doc(tenantId).collection('socialAccounts');
}

export const accountsService = {
    async list(tenantId: string): Promise<SocialAccount[]> {
        const snap = await accountsRef(tenantId).orderBy('connectedAt', 'desc').get();
        return snap.docs.map(d => d.data() as SocialAccount);
    },

    async disconnect(tenantId: string, accountId: string): Promise<void> {
        await accountsRef(tenantId).doc(accountId).update({
            status: 'revoked',
            accessToken: FieldValue.delete(),
        });
    },
};
