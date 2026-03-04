// features/marketing/hooks/usePosts.ts
'use client';
import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where, QueryConstraint } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { SocialPost } from '../types';

export function usePosts(tenantId: string, status?: string) {
    const [posts, setPosts] = useState<SocialPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!tenantId) return;
        const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc'), limit(50)];
        if (status) constraints.unshift(where('status', '==', status));
        const q = query(collection(db, 'tenants', tenantId, 'socialPosts'), ...constraints);
        const unsub = onSnapshot(q, snap => {
            setPosts(snap.docs.map(d => d.data() as SocialPost));
            setLoading(false);
        });
        return unsub;
    }, [tenantId, status]);

    return { posts, loading };
}
