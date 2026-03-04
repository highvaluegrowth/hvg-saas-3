// features/marketing/hooks/useAccounts.ts
'use client';
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { SocialAccount } from '../types';

export function useAccounts(tenantId: string) {
    const [accounts, setAccounts] = useState<SocialAccount[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!tenantId) return;
        const q = query(collection(db, 'tenants', tenantId, 'socialAccounts'), orderBy('connectedAt', 'desc'));
        const unsub = onSnapshot(q, snap => {
            setAccounts(snap.docs.map(d => d.data() as SocialAccount));
            setLoading(false);
        });
        return unsub;
    }, [tenantId]);

    return { accounts, loading };
}
