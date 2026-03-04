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

    /**
     * Upsert a social account using platform+accountId as a composite key.
     * Doc id: `${platform}_${accountId}`
     */
    async upsert(tenantId: string, account: Omit<SocialAccount, 'id'>): Promise<SocialAccount> {
        const docId = `${account.platform}_${account.accountId}`;
        const ref = accountsRef(tenantId).doc(docId);
        const data: SocialAccount = { ...account, id: docId };
        await ref.set(data, { merge: true });
        return data;
    },
};
