# Phase 3: Social Media Marketing Suite Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a tenant-facing AI Content Studio for drafting and scheduling social media posts, with SuperAdmin template oversight and Meta OAuth stubs ready for future activation.

**Architecture:** Feature-driven module `features/marketing/` with Firestore sub-collections under `/tenants/{tenantId}/socialPosts/` and `/tenants/{tenantId}/socialAccounts/`. Tenant marketing hub at `/(dashboard)/[tenantId]/marketing/` with a 4-step AI composer. Three new Gemini tools extend the HVG Partner AI. SuperAdmin gets a read-only cross-tenant view and global template library.

**Tech Stack:** Next.js 14 App Router, TypeScript, TailwindCSS 4, Firebase Admin SDK (`adminDb` from `lib/firebase/admin.ts`), Firestore real-time listeners (`onSnapshot`), Gemini 2.5 Flash function calling (`@google/genai` with `Type.OBJECT`).

**Critical patterns to follow:**
- `verifyAuthToken(request)` — throws on failure, returns decoded token directly (not `{ success, token }`)
- Dynamic route `params` are `Promise<{...}>` — always `await params` before destructuring
- Firestore Admin: use `adminDb` (not `db`). Firestore Client: use `db` from `lib/firebase/client.ts`
- All tenant data under `/tenants/{tenantId}/` in Firestore

---

## Task 1: Feature Module Types

**Files:**
- Create: `features/marketing/types.ts`

**Step 1: Create the types file**

```typescript
// features/marketing/types.ts

export type SocialPlatform = 'facebook' | 'instagram' | 'tiktok' | 'x' | 'linkedin';
export type PostType = 'bed_availability' | 'success_story' | 'event_promo' | 'job_listing' | 'general';
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';
export type AccountStatus = 'active' | 'expired' | 'revoked';

export interface SocialPost {
    id: string;
    tenantId: string;
    content: string;
    platforms: SocialPlatform[];
    hashtags: string[];
    status: PostStatus;
    postType: PostType;
    scheduledAt: string | null;   // ISO string
    publishedAt: string | null;   // ISO string
    createdBy: string;            // uid
    createdAt: string;
    updatedAt: string;
    aiGenerated: boolean;
    sourceContext: Record<string, unknown>;
}

export interface SocialAccount {
    id: string;
    platform: SocialPlatform;
    accessToken: string;
    tokenExpiresAt: string;       // ISO string
    accountName: string;
    accountId: string;
    connectedAt: string;
    connectedBy: string;
    status: AccountStatus;
}

export interface MarketingTemplate {
    id: string;
    name: string;
    category: PostType;
    promptHint: string;
    defaultHashtags: string[];
    createdBy: string;
    createdAt: string;
    active: boolean;
}

// Payload for creating a new post
export interface CreatePostPayload {
    content: string;
    platforms: SocialPlatform[];
    hashtags: string[];
    postType: PostType;
    scheduledAt?: string | null;
    aiGenerated: boolean;
    sourceContext?: Record<string, unknown>;
}

// AI tool return shape
export interface DraftPostResult {
    draft: string;
    hashtags: {
        general: string[];
        houseSpecific: string[];
        platformOptimized: string[];
    };
}
```

**Step 2: Verify TypeScript compiles**

```bash
cd /Users/peter/Desktop/hvg-saas-3 && npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors (or same errors as before this change)

**Step 3: Commit**

```bash
git add features/marketing/types.ts
git commit -m "feat: marketing feature types"
```

---

## Task 2: Posts Service (Admin SDK)

**Files:**
- Create: `features/marketing/services/postsService.ts`

**Step 1: Create the service**

```typescript
// features/marketing/services/postsService.ts
import { adminDb } from '@/lib/firebase/admin';
import type { SocialPost, CreatePostPayload } from '../types';
import { FieldValue } from 'firebase-admin/firestore';

function postsRef(tenantId: string) {
    return adminDb.collection('tenants').doc(tenantId).collection('socialPosts');
}

export const postsService = {
    async create(tenantId: string, uid: string, payload: CreatePostPayload): Promise<SocialPost> {
        const now = new Date().toISOString();
        const ref = postsRef(tenantId).doc();
        const post: SocialPost = {
            id: ref.id,
            tenantId,
            content: payload.content,
            platforms: payload.platforms,
            hashtags: payload.hashtags,
            status: payload.scheduledAt ? 'scheduled' : 'draft',
            postType: payload.postType,
            scheduledAt: payload.scheduledAt ?? null,
            publishedAt: null,
            createdBy: uid,
            createdAt: now,
            updatedAt: now,
            aiGenerated: payload.aiGenerated,
            sourceContext: payload.sourceContext ?? {},
        };
        await ref.set(post);
        return post;
    },

    async list(tenantId: string, status?: string, limit = 50): Promise<SocialPost[]> {
        let q = postsRef(tenantId).orderBy('createdAt', 'desc').limit(limit);
        if (status) q = postsRef(tenantId).where('status', '==', status).orderBy('createdAt', 'desc').limit(limit) as typeof q;
        const snap = await q.get();
        return snap.docs.map(d => d.data() as SocialPost);
    },

    async update(tenantId: string, postId: string, updates: Partial<SocialPost>): Promise<void> {
        await postsRef(tenantId).doc(postId).update({
            ...updates,
            updatedAt: new Date().toISOString(),
        });
    },

    async delete(tenantId: string, postId: string): Promise<void> {
        await postsRef(tenantId).doc(postId).delete();
    },

    async countByStatus(tenantId: string): Promise<Record<string, number>> {
        const statuses = ['draft', 'scheduled', 'published', 'failed'];
        const counts = await Promise.all(
            statuses.map(async (s) => {
                const snap = await postsRef(tenantId).where('status', '==', s).count().get();
                return [s, snap.data().count] as [string, number];
            })
        );
        return Object.fromEntries(counts);
    },
};
```

**Step 2: Compile check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 3: Commit**

```bash
git add features/marketing/services/postsService.ts
git commit -m "feat: marketing posts service (admin SDK)"
```

---

## Task 3: Accounts Service + Templates Service

**Files:**
- Create: `features/marketing/services/accountsService.ts`
- Create: `features/marketing/services/templatesService.ts`

**Step 1: Accounts service**

```typescript
// features/marketing/services/accountsService.ts
import { adminDb } from '@/lib/firebase/admin';
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
            accessToken: '',
        });
    },
};
```

**Step 2: Templates service**

```typescript
// features/marketing/services/templatesService.ts
import { adminDb } from '@/lib/firebase/admin';
import type { MarketingTemplate } from '../types';

export const templatesService = {
    async list(activeOnly = true): Promise<MarketingTemplate[]> {
        let q = adminDb.collection('marketingTemplates').orderBy('createdAt', 'desc');
        if (activeOnly) {
            q = adminDb.collection('marketingTemplates')
                .where('active', '==', true)
                .orderBy('createdAt', 'desc') as typeof q;
        }
        const snap = await q.get();
        return snap.docs.map(d => d.data() as MarketingTemplate);
    },

    async create(uid: string, data: Omit<MarketingTemplate, 'id' | 'createdBy' | 'createdAt'>): Promise<MarketingTemplate> {
        const ref = adminDb.collection('marketingTemplates').doc();
        const template: MarketingTemplate = {
            ...data,
            id: ref.id,
            createdBy: uid,
            createdAt: new Date().toISOString(),
        };
        await ref.set(template);
        return template;
    },

    async update(templateId: string, updates: Partial<MarketingTemplate>): Promise<void> {
        await adminDb.collection('marketingTemplates').doc(templateId).update(updates);
    },
};
```

**Step 3: Compile check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 4: Commit**

```bash
git add features/marketing/services/
git commit -m "feat: accounts and templates services"
```

---

## Task 4: Client-Side Hooks

**Files:**
- Create: `features/marketing/hooks/usePosts.ts`
- Create: `features/marketing/hooks/useAccounts.ts`

**Step 1: usePosts hook**

```typescript
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
```

**Step 2: useAccounts hook**

```typescript
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
```

**Step 3: Compile check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 4: Commit**

```bash
git add features/marketing/hooks/
git commit -m "feat: marketing client hooks (usePosts, useAccounts)"
```

---

## Task 5: Firestore Rules

**Files:**
- Modify: `firestore.rules`

**Step 1: Add marketing rules inside the `match /tenants/{tenantId}` block**

Find the closing brace of `match /tenants/{tenantId} { ... }` and add the sub-collections BEFORE it. Look for the existing tenant match block and add:

```
    match /tenants/{tenantId} {
      // ... existing rules ...

      // Social posts — tenant staff and above can read/write; SuperAdmin can read all
      match /socialPosts/{postId} {
        allow read, write: if isSuperAdmin() || isTenantStaff(tenantId);
      }

      // Social accounts — only tenant_admin+ can manage OAuth tokens
      match /socialAccounts/{accountId} {
        allow read: if isSuperAdmin() || isTenantStaff(tenantId);
        allow write: if isSuperAdmin() || isTenantAdmin(tenantId);
      }
    }
```

Also add the global templates collection OUTSIDE the tenants block:

```
    // Marketing templates (global, SuperAdmin-managed)
    match /marketingTemplates/{templateId} {
      allow read: if isAuthenticated();
      allow write: if isSuperAdmin();
    }
```

**Step 2: Validate rules syntax**

```bash
firebase firestore:rules --check 2>&1 || echo "check rules manually in Firebase console"
```

**Step 3: Commit**

```bash
git add firestore.rules
git commit -m "feat: firestore rules for marketing (socialPosts, socialAccounts, marketingTemplates)"
```

---

## Task 6: Marketing Posts API Routes

**Files:**
- Create: `app/api/tenants/[tenantId]/marketing/posts/route.ts`
- Create: `app/api/tenants/[tenantId]/marketing/posts/[postId]/route.ts`

**Step 1: Collection route (GET list, POST create)**

```typescript
// app/api/tenants/[tenantId]/marketing/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { postsService } from '@/features/marketing/services/postsService';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ tenantId: string }> }
) {
    try {
        const token = await verifyAuthToken(request);
        const { tenantId } = await params;
        if (token.role !== 'super_admin' && token.tenant_id !== tenantId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        const url = new URL(request.url);
        const status = url.searchParams.get('status') ?? undefined;
        const posts = await postsService.list(tenantId, status);
        return NextResponse.json({ posts });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ tenantId: string }> }
) {
    try {
        const token = await verifyAuthToken(request);
        const { tenantId } = await params;
        if (token.role !== 'super_admin' && token.tenant_id !== tenantId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        const body = await request.json();
        const post = await postsService.create(tenantId, token.uid, body);
        return NextResponse.json({ post }, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
```

**Step 2: Document route (PATCH update, DELETE)**

```typescript
// app/api/tenants/[tenantId]/marketing/posts/[postId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { postsService } from '@/features/marketing/services/postsService';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ tenantId: string; postId: string }> }
) {
    try {
        const token = await verifyAuthToken(request);
        const { tenantId, postId } = await params;
        if (token.role !== 'super_admin' && token.tenant_id !== tenantId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        const updates = await request.json();
        await postsService.update(tenantId, postId, updates);
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ tenantId: string; postId: string }> }
) {
    try {
        const token = await verifyAuthToken(request);
        const { tenantId, postId } = await params;
        if (token.role !== 'super_admin' && token.tenant_id !== tenantId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        await postsService.delete(tenantId, postId);
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
```

**Step 3: Compile check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 4: Commit**

```bash
git add app/api/tenants/
git commit -m "feat: marketing posts API routes (CRUD)"
```

---

## Task 7: Meta OAuth Stubs + .env.example

**Files:**
- Create: `app/api/oauth/meta/authorize/route.ts`
- Create: `app/api/oauth/meta/callback/route.ts`
- Modify: `.env.example` (or create if it doesn't exist)

**Step 1: Authorize stub**

```typescript
// app/api/oauth/meta/authorize/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';

export async function GET(request: NextRequest) {
    try {
        await verifyAuthToken(request);
        // Log the attempt so SuperAdmin knows tenants are trying to connect
        console.log('[Meta OAuth] Authorize attempt at', new Date().toISOString());
        return NextResponse.json({
            error: 'Meta integration coming soon',
            message: 'Facebook and Instagram connection will be available shortly. Contact HVG support to get early access.',
        }, { status: 501 });
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}
```

**Step 2: Callback stub**

```typescript
// app/api/oauth/meta/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
    // Redirect to accounts page with coming-soon flag
    return NextResponse.redirect(new URL('/login?meta=coming-soon', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'));
}
```

**Step 3: Add to .env.example**

Check if `.env.example` exists:

```bash
ls /Users/peter/Desktop/hvg-saas-3/.env.example 2>/dev/null && cat /Users/peter/Desktop/hvg-saas-3/.env.example | tail -10
```

Append these lines to `.env.example`:

```
# Meta (Facebook/Instagram) OAuth — Phase 3b
META_APP_ID=
META_APP_SECRET=
META_REDIRECT_URI=https://yourdomain.com/api/oauth/meta/callback
```

**Step 4: Compile check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 5: Commit**

```bash
git add app/api/oauth/ .env.example
git commit -m "feat: Meta OAuth stubs (501) + env vars documented"
```

---

## Task 8: Marketing Hub Page

**Files:**
- Create: `app/(dashboard)/[tenantId]/marketing/page.tsx`
- Create: `app/(dashboard)/[tenantId]/marketing/layout.tsx` (if marketing needs its own sub-nav; otherwise skip)

**Step 1: Create hub page**

```tsx
// app/(dashboard)/[tenantId]/marketing/page.tsx
'use client';
import { use } from 'react';
import Link from 'next/link';
import { usePosts } from '@/features/marketing/hooks/usePosts';
import { useAccounts } from '@/features/marketing/hooks/useAccounts';

const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    scheduled: 'bg-blue-100 text-blue-700',
    published: 'bg-emerald-100 text-emerald-700',
    failed: 'bg-red-100 text-red-700',
};

export default function MarketingHubPage({ params }: { params: Promise<{ tenantId: string }> }) {
    const { tenantId } = use(params);
    const { posts, loading } = usePosts(tenantId);
    const { accounts } = useAccounts(tenantId);

    const draft = posts.filter(p => p.status === 'draft').length;
    const scheduled = posts.filter(p => p.status === 'scheduled').length;
    const published = posts.filter(p => p.status === 'published').length;
    const connected = accounts.filter(a => a.status === 'active').length;

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Marketing</h1>
                    <p className="text-gray-500 mt-1">Create and schedule social media content with AI assistance</p>
                </div>
                <Link
                    href={`/${tenantId}/marketing/compose`}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                >
                    + New Post
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Drafts', value: draft, color: 'text-gray-700' },
                    { label: 'Scheduled', value: scheduled, color: 'text-blue-600' },
                    { label: 'Published', value: published, color: 'text-emerald-600' },
                    { label: 'Connected Platforms', value: connected, color: 'text-purple-600' },
                ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                        <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: 'All Posts', href: `/${tenantId}/marketing/posts`, icon: '📋', desc: 'View and manage all posts' },
                    { label: 'Compose', href: `/${tenantId}/marketing/compose`, icon: '✍️', desc: 'AI-powered content creator' },
                    { label: 'Connected Accounts', href: `/${tenantId}/marketing/accounts`, icon: '🔗', desc: 'Manage social platforms' },
                ].map(card => (
                    <Link key={card.href} href={card.href}
                        className="bg-white rounded-xl border border-gray-200 p-5 hover:border-emerald-300 hover:shadow-sm transition-all group">
                        <div className="text-2xl mb-2">{card.icon}</div>
                        <p className="font-semibold text-gray-900 group-hover:text-emerald-700">{card.label}</p>
                        <p className="text-sm text-gray-500 mt-1">{card.desc}</p>
                    </Link>
                ))}
            </div>

            {/* Recent posts */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Posts</h2>
                {loading ? (
                    <div className="text-gray-400 text-sm">Loading...</div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <p className="text-4xl mb-3">📭</p>
                        <p>No posts yet. Create your first post with AI!</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Content</th>
                                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Type</th>
                                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {posts.slice(0, 10).map(post => (
                                    <tr key={post.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-900 max-w-xs truncate">{post.content}</td>
                                        <td className="px-4 py-3 text-gray-500 capitalize">{post.postType.replace('_', ' ')}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[post.status]}`}>
                                                {post.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-400">
                                            {new Date(post.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
```

**Step 2: Compile check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 3: Commit**

```bash
git add app/\(dashboard\)/\[tenantId\]/marketing/page.tsx
git commit -m "feat: marketing hub page"
```

---

## Task 9: 4-Step Compose Page

**Files:**
- Create: `app/(dashboard)/[tenantId]/marketing/compose/page.tsx`

This is the core feature. It's a long file (~350 lines). Write it completely.

**Step 1: Create the compose page**

```tsx
// app/(dashboard)/[tenantId]/marketing/compose/page.tsx
'use client';
import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PostType, SocialPlatform, DraftPostResult } from '@/features/marketing/types';

const POST_TYPES: { value: PostType; label: string; icon: string; desc: string }[] = [
    { value: 'bed_availability', label: 'Bed Availability', icon: '🛏️', desc: 'Announce open beds at your house' },
    { value: 'success_story', label: 'Success Story', icon: '🌟', desc: 'Share an anonymized resident win' },
    { value: 'event_promo', label: 'Event Promotion', icon: '📅', desc: 'Promote an upcoming event' },
    { value: 'job_listing', label: 'Job Listing', icon: '💼', desc: 'Recruit staff or volunteers' },
    { value: 'general', label: 'General Update', icon: '✍️', desc: 'Anything else on your mind' },
];

const PLATFORMS: { value: SocialPlatform; label: string; color: string }[] = [
    { value: 'facebook', label: 'Facebook', color: 'bg-blue-600' },
    { value: 'instagram', label: 'Instagram', color: 'bg-pink-600' },
    { value: 'tiktok', label: 'TikTok', color: 'bg-gray-900' },
    { value: 'x', label: 'X / Twitter', color: 'bg-gray-800' },
    { value: 'linkedin', label: 'LinkedIn', color: 'bg-blue-700' },
];

type Step = 1 | 2 | 3 | 4;

export default function ComposePage({ params }: { params: Promise<{ tenantId: string }> }) {
    const { tenantId } = use(params);
    const router = useRouter();

    const [step, setStep] = useState<Step>(1);
    const [postType, setPostType] = useState<PostType | null>(null);
    const [contextText, setContextText] = useState('');
    const [tone, setTone] = useState<'professional' | 'warm' | 'urgent' | 'celebratory'>('warm');

    const [draft, setDraft] = useState('');
    const [aiHashtags, setAiHashtags] = useState<DraftPostResult['hashtags'] | null>(null);
    const [selectedGeneralTags, setSelectedGeneralTags] = useState<string[]>([]);
    const [selectedHouseTags, setSelectedHouseTags] = useState<string[]>([]);
    const [selectedPlatformTags, setSelectedPlatformTags] = useState<string[]>([]);
    const [customTagInput, setCustomTagInput] = useState('');
    const [customTags, setCustomTags] = useState<string[]>([]);

    const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([]);
    const [scheduleMode, setScheduleMode] = useState<'now' | 'schedule'>('now');
    const [scheduledAt, setScheduledAt] = useState('');

    const [generating, setGenerating] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    async function generateDraft() {
        if (!postType) return;
        setGenerating(true);
        setError('');
        try {
            const res = await fetch(`/api/tenants/${tenantId}/marketing/ai-draft`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postType, context: contextText, tone, platform: selectedPlatforms[0] ?? 'facebook' }),
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setDraft(data.draft);
            setAiHashtags(data.hashtags);
            setSelectedGeneralTags(data.hashtags.general.slice(0, 3));
            setSelectedHouseTags([]);
            setSelectedPlatformTags(data.hashtags.platformOptimized.slice(0, 2));
        } catch (e) {
            setError(String(e));
        } finally {
            setGenerating(false);
        }
    }

    async function submit(asDraft: boolean) {
        if (!postType) return;
        setSubmitting(true);
        setError('');
        try {
            const allHashtags = [...selectedGeneralTags, ...selectedHouseTags, ...selectedPlatformTags, ...customTags];
            const body = {
                content: draft,
                platforms: selectedPlatforms,
                hashtags: allHashtags,
                postType,
                scheduledAt: !asDraft && scheduleMode === 'schedule' ? scheduledAt : null,
                aiGenerated: !!aiHashtags,
                sourceContext: { contextText, tone },
            };
            const res = await fetch(`/api/tenants/${tenantId}/marketing/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error(await res.text());
            router.push(`/${tenantId}/marketing/posts`);
        } catch (e) {
            setError(String(e));
        } finally {
            setSubmitting(false);
        }
    }

    function addCustomTag() {
        const tag = customTagInput.trim().replace(/^#/, '');
        if (tag && !customTags.includes(tag)) {
            setCustomTags(prev => [...prev, tag]);
        }
        setCustomTagInput('');
    }

    function toggleTag(tag: string, selected: string[], setSelected: (t: string[]) => void) {
        setSelected(selected.includes(tag) ? selected.filter(t => t !== tag) : [...selected, tag]);
    }

    function togglePlatform(p: SocialPlatform) {
        setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
    }

    const stepLabels = ['Post Type', 'Context', 'Edit & Approve', 'Platforms & Timing'];

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            {/* Step indicator */}
            <div className="flex items-center gap-2">
                {stepLabels.map((label, i) => (
                    <div key={label} className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i + 1 === step ? 'bg-emerald-600 text-white' : i + 1 < step ? 'bg-emerald-200 text-emerald-800' : 'bg-gray-200 text-gray-500'}`}>
                            {i + 1 < step ? '✓' : i + 1}
                        </div>
                        <span className={`text-xs hidden sm:inline ${i + 1 === step ? 'text-emerald-700 font-semibold' : 'text-gray-400'}`}>{label}</span>
                        {i < stepLabels.length - 1 && <div className="w-4 h-px bg-gray-300 hidden sm:block" />}
                    </div>
                ))}
            </div>

            {/* Step 1: Post Type */}
            {step === 1 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900">What type of post?</h2>
                    <div className="grid grid-cols-1 gap-3">
                        {POST_TYPES.map(pt => (
                            <button key={pt.value} onClick={() => setPostType(pt.value)}
                                className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${postType === pt.value ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                <span className="text-2xl">{pt.icon}</span>
                                <div>
                                    <p className="font-semibold text-gray-900">{pt.label}</p>
                                    <p className="text-sm text-gray-500">{pt.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                    <button disabled={!postType} onClick={() => setStep(2)}
                        className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium disabled:opacity-40 hover:bg-emerald-700 transition-colors">
                        Continue →
                    </button>
                </div>
            )}

            {/* Step 2: Context */}
            {step === 2 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900">Give the AI some context</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Describe what you want to say</label>
                        <textarea value={contextText} onChange={e => setContextText(e.target.value)}
                            rows={5} placeholder={postType === 'bed_availability' ? 'e.g. We have 2 beds open for men in our downtown house, specializing in dual-diagnosis...' : 'Describe the post topic in your own words...'}
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-400 focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
                        <div className="flex flex-wrap gap-2">
                            {(['professional', 'warm', 'urgent', 'celebratory'] as const).map(t => (
                                <button key={t} onClick={() => setTone(t)}
                                    className={`px-3 py-1.5 rounded-full text-sm capitalize transition-colors ${tone === t ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setStep(1)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">← Back</button>
                        <button onClick={async () => { await generateDraft(); setStep(3); }} disabled={generating || !contextText.trim()}
                            className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-medium disabled:opacity-40 hover:bg-emerald-700 transition-colors">
                            {generating ? 'Generating...' : '✨ Generate with AI →'}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Edit & Approve */}
            {step === 3 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900">Review & edit your post</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
                        <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={7}
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-400 focus:outline-none" />
                        <p className="text-xs text-gray-400 mt-1">{draft.length} characters</p>
                    </div>

                    {aiHashtags && (
                        <div className="space-y-3">
                            <p className="text-sm font-medium text-gray-700">Hashtags (tap to toggle)</p>
                            {[
                                { label: 'General Recovery', tags: aiHashtags.general, selected: selectedGeneralTags, setSelected: setSelectedGeneralTags },
                                { label: 'House-Specific', tags: aiHashtags.houseSpecific, selected: selectedHouseTags, setSelected: setSelectedHouseTags },
                                { label: 'Platform-Optimized', tags: aiHashtags.platformOptimized, selected: selectedPlatformTags, setSelected: setSelectedPlatformTags },
                            ].map(group => (
                                <div key={group.label}>
                                    <p className="text-xs text-gray-500 mb-1">{group.label}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {group.tags.map(tag => (
                                            <button key={tag} onClick={() => toggleTag(tag, group.selected, group.setSelected)}
                                                className={`px-2 py-1 rounded-full text-xs transition-colors ${group.selected.includes(tag) ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                                #{tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Custom Hashtags</p>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {customTags.map(tag => (
                                        <span key={tag} className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700 flex items-center gap-1">
                                            #{tag}
                                            <button onClick={() => setCustomTags(prev => prev.filter(t => t !== tag))} className="hover:text-red-500">×</button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input value={customTagInput} onChange={e => setCustomTagInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addCustomTag()}
                                        placeholder="Add custom tag" className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-emerald-400 focus:outline-none" />
                                    <button onClick={addCustomTag} className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs hover:bg-gray-200">Add</button>
                                </div>
                            </div>
                        </div>
                    )}
                    {error && <p className="text-red-600 text-sm">{error}</p>}
                    <div className="flex gap-3">
                        <button onClick={() => setStep(2)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">← Back</button>
                        <button onClick={() => setStep(4)} disabled={!draft.trim()}
                            className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-medium disabled:opacity-40 hover:bg-emerald-700 transition-colors">
                            Choose Platforms →
                        </button>
                    </div>
                </div>
            )}

            {/* Step 4: Platforms & Timing */}
            {step === 4 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900">Where & when?</h2>
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Platforms</p>
                        <div className="flex flex-wrap gap-2">
                            {PLATFORMS.map(p => (
                                <button key={p.value} onClick={() => togglePlatform(p.value)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedPlatforms.includes(p.value) ? `${p.color} text-white` : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                    {p.label}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Note: Actual publishing requires a connected account (coming soon). Posts save to your library.</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Timing</p>
                        <div className="flex gap-3">
                            {(['now', 'schedule'] as const).map(mode => (
                                <button key={mode} onClick={() => setScheduleMode(mode)}
                                    className={`px-4 py-2 rounded-lg text-sm capitalize border-2 transition-colors ${scheduleMode === mode ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600'}`}>
                                    {mode === 'now' ? 'Save Now' : 'Schedule'}
                                </button>
                            ))}
                        </div>
                        {scheduleMode === 'schedule' && (
                            <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                                className="mt-2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-400 focus:outline-none" />
                        )}
                    </div>
                    {error && <p className="text-red-600 text-sm">{error}</p>}
                    <div className="flex gap-3">
                        <button onClick={() => setStep(3)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">← Back</button>
                        <button onClick={() => submit(true)} disabled={submitting}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40">
                            Save Draft
                        </button>
                        <button onClick={() => submit(false)} disabled={submitting || selectedPlatforms.length === 0}
                            className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-medium disabled:opacity-40 hover:bg-emerald-700 transition-colors">
                            {submitting ? 'Saving...' : scheduleMode === 'schedule' ? '📅 Schedule Post' : '💾 Save Post'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
```

**Step 2: Compile check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 3: Commit**

```bash
git add "app/(dashboard)/[tenantId]/marketing/compose/page.tsx"
git commit -m "feat: 4-step AI compose page"
```

---

## Task 10: Posts List Page + Accounts Page

**Files:**
- Create: `app/(dashboard)/[tenantId]/marketing/posts/page.tsx`
- Create: `app/(dashboard)/[tenantId]/marketing/accounts/page.tsx`

**Step 1: Posts list page**

```tsx
// app/(dashboard)/[tenantId]/marketing/posts/page.tsx
'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import { usePosts } from '@/features/marketing/hooks/usePosts';
import type { PostStatus } from '@/features/marketing/types';

const STATUS_TABS: { value: PostStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Drafts' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'published', label: 'Published' },
];

const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    scheduled: 'bg-blue-100 text-blue-700',
    published: 'bg-emerald-100 text-emerald-700',
    failed: 'bg-red-100 text-red-700',
};

export default function PostsPage({ params }: { params: Promise<{ tenantId: string }> }) {
    const { tenantId } = use(params);
    const [activeStatus, setActiveStatus] = useState<PostStatus | 'all'>('all');
    const { posts, loading } = usePosts(tenantId, activeStatus === 'all' ? undefined : activeStatus);

    async function deletePost(postId: string) {
        if (!confirm('Delete this post?')) return;
        await fetch(`/api/tenants/${tenantId}/marketing/posts/${postId}`, { method: 'DELETE' });
    }

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Posts</h1>
                <Link href={`/${tenantId}/marketing/compose`}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
                    + New Post
                </Link>
            </div>
            <div className="flex gap-2 border-b border-gray-200">
                {STATUS_TABS.map(tab => (
                    <button key={tab.value} onClick={() => setActiveStatus(tab.value)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeStatus === tab.value ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>
            {loading ? (
                <div className="text-gray-400 text-sm">Loading...</div>
            ) : posts.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <p className="text-4xl mb-3">📭</p>
                    <p>No posts in this category yet.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-4 py-3 text-gray-600 font-medium">Content</th>
                                <th className="text-left px-4 py-3 text-gray-600 font-medium">Platforms</th>
                                <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                                <th className="text-left px-4 py-3 text-gray-600 font-medium">Date</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {posts.map(post => (
                                <tr key={post.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 max-w-xs">
                                        <p className="truncate text-gray-900">{post.content}</p>
                                        {post.hashtags.length > 0 && (
                                            <p className="text-xs text-gray-400 truncate">#{post.hashtags.slice(0, 3).join(' #')}</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 capitalize">{post.platforms.join(', ') || '—'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[post.status]}`}>{post.status}</span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                                        {post.scheduledAt ? new Date(post.scheduledAt).toLocaleDateString() : new Date(post.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <button onClick={() => deletePost(post.id)} className="text-red-400 hover:text-red-600 text-xs">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
```

**Step 2: Accounts page**

```tsx
// app/(dashboard)/[tenantId]/marketing/accounts/page.tsx
'use client';
import { use } from 'react';
import { useAccounts } from '@/features/marketing/hooks/useAccounts';
import type { SocialPlatform } from '@/features/marketing/types';

const PLATFORM_CONFIG: Record<SocialPlatform, { label: string; color: string; icon: string }> = {
    facebook: { label: 'Facebook', color: 'bg-blue-600', icon: 'f' },
    instagram: { label: 'Instagram', color: 'bg-gradient-to-br from-pink-500 to-orange-400', icon: '📷' },
    tiktok: { label: 'TikTok', color: 'bg-gray-900', icon: '♪' },
    x: { label: 'X / Twitter', color: 'bg-gray-800', icon: '𝕏' },
    linkedin: { label: 'LinkedIn', color: 'bg-blue-700', icon: 'in' },
};

const AVAILABLE_PLATFORMS: SocialPlatform[] = ['facebook', 'instagram', 'tiktok', 'x', 'linkedin'];

async function handleConnect(tenantId: string) {
    const res = await fetch(`/api/oauth/meta/authorize?tenantId=${tenantId}`);
    const data = await res.json();
    alert(data.message ?? 'Coming soon!');
}

export default function AccountsPage({ params }: { params: Promise<{ tenantId: string }> }) {
    const { tenantId } = use(params);
    const { accounts, loading } = useAccounts(tenantId);

    const connectedPlatforms = new Set(accounts.filter(a => a.status === 'active').map(a => a.platform));

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Connected Accounts</h1>
                <p className="text-gray-500 mt-1">Link your social platforms to publish posts directly</p>
            </div>
            {loading ? (
                <div className="text-gray-400 text-sm">Loading...</div>
            ) : (
                <div className="space-y-3">
                    {AVAILABLE_PLATFORMS.map(platform => {
                        const config = PLATFORM_CONFIG[platform];
                        const account = accounts.find(a => a.platform === platform && a.status === 'active');
                        const isConnected = !!account;
                        return (
                            <div key={platform} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 ${config.color} rounded-lg flex items-center justify-center text-white font-bold text-sm`}>
                                        {config.icon}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">{config.label}</p>
                                        {isConnected ? (
                                            <p className="text-xs text-emerald-600">Connected as {account?.accountName}</p>
                                        ) : (
                                            <p className="text-xs text-gray-400">Not connected</p>
                                        )}
                                    </div>
                                </div>
                                {isConnected ? (
                                    <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium">Active</span>
                                ) : (
                                    <button onClick={() => handleConnect(tenantId)}
                                        className="text-sm px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                                        Connect
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <strong>Coming Soon:</strong> Direct publishing to Facebook and Instagram is in progress. For now, use the composer to create and save posts to your library, then copy them manually to your social accounts.
            </div>
        </div>
    );
}
```

**Step 3: Compile check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 4: Commit**

```bash
git add "app/(dashboard)/[tenantId]/marketing/"
git commit -m "feat: posts list + accounts pages"
```

---

## Task 11: AI Draft API Route + 3 New Gemini Tools

**Files:**
- Create: `app/api/tenants/[tenantId]/marketing/ai-draft/route.ts`
- Modify: `lib/ai/tools/saas-tools.ts`

**Step 1: AI draft API route**

This route calls the Gemini `draft_social_post` tool via the existing chat infrastructure, OR can call Gemini directly. For simplicity, call Gemini directly here since we need a synchronous response.

```typescript
// app/api/tenants/[tenantId]/marketing/ai-draft/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { GoogleGenAI } from '@google/genai';
import { adminDb } from '@/lib/firebase/admin';
import type { PostType, DraftPostResult } from '@/features/marketing/types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const POST_TYPE_PROMPTS: Record<PostType, string> = {
    bed_availability: 'Write a compassionate, hopeful social media post announcing available beds at a sober living house.',
    success_story: 'Write an inspiring, anonymized success story about a resident in recovery. Keep it uplifting and privacy-safe.',
    event_promo: 'Write an engaging event promotion post for a sober living community event.',
    job_listing: 'Write a compelling job listing post for a position at a sober living house.',
    general: 'Write a warm, community-focused social media update for a sober living organization.',
};

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ tenantId: string }> }
) {
    try {
        const token = await verifyAuthToken(request);
        const { tenantId } = await params;
        if (token.role !== 'super_admin' && token.tenant_id !== tenantId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { postType, context, tone, platform } = await request.json() as {
            postType: PostType; context: string; tone: string; platform: string;
        };

        // Fetch tenant info for house-specific hashtags
        const tenantSnap = await adminDb.collection('tenants').doc(tenantId).get();
        const tenant = tenantSnap.data() ?? {};
        const houseName: string = tenant.name ?? 'our sober living home';
        const specializations: string[] = tenant.specializations ?? [];

        const typePrompt = POST_TYPE_PROMPTS[postType] ?? POST_TYPE_PROMPTS.general;
        const prompt = `You are a social media manager for a sober living organization called "${houseName}".

${typePrompt}

Context provided: ${context || 'No specific context — use general recovery messaging.'}
Tone: ${tone}
Target platform: ${platform}
Specializations: ${specializations.join(', ') || 'general recovery'}

Respond ONLY with valid JSON in this exact shape:
{
  "draft": "<the caption text, 1-3 paragraphs, no hashtags in body>",
  "hashtags": {
    "general": ["RecoveryIsPossible", "SoberLiving", "CleanAndSober"],
    "houseSpecific": ["${houseName.replace(/\s+/g, '')}House", "SoberCommunity"],
    "platformOptimized": ["${platform === 'instagram' ? 'InstaRecovery' : 'RecoveryTwitter'}", "SoberLife"]
  }
}

Rules:
- draft must be compelling and empathetic, no hashtags inside
- each hashtag array must have 3-5 tags, no # prefix
- houseSpecific tags should reference the house name or specializations
- platformOptimized tags should match ${platform} best practices`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });

        const raw = response.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
        // Strip markdown code fences if present
        const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const result: DraftPostResult = JSON.parse(cleaned);

        return NextResponse.json(result);
    } catch (e) {
        console.error('[AI Draft]', e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
```

**Step 2: Add 3 new Gemini tool declarations to saas-tools.ts**

Open `lib/ai/tools/saas-tools.ts` and add these 3 declarations to the `functionDeclarations` array:

```typescript
// Add inside the functionDeclarations array:
{
    name: 'draft_social_post',
    description: 'Generate a social media post draft with hashtags using AI. Returns draft caption and categorized hashtag suggestions.',
    parameters: {
        type: Type.OBJECT,
        required: ['postType', 'context'],
        properties: {
            postType: { type: Type.STRING, enum: ['bed_availability', 'success_story', 'event_promo', 'job_listing', 'general'], description: 'Type of post to create' },
            context: { type: Type.STRING, description: 'Context or description of what the post should say' },
            tone: { type: Type.STRING, enum: ['professional', 'warm', 'urgent', 'celebratory'], description: 'Desired tone (default: warm)' },
            platform: { type: Type.STRING, enum: ['facebook', 'instagram', 'tiktok', 'x', 'linkedin'], description: 'Target platform (default: facebook)' },
        },
    },
},
{
    name: 'get_scheduled_posts',
    description: 'Get social media posts from the marketing library, optionally filtered by status',
    parameters: {
        type: Type.OBJECT,
        properties: {
            status: { type: Type.STRING, enum: ['draft', 'scheduled', 'published', 'failed'], description: 'Filter by post status (omit for all)' },
            limit: { type: Type.NUMBER, description: 'Max posts to return (default 20)' },
        },
    },
},
{
    name: 'approve_post',
    description: 'Update a social media post status to scheduled or mark for immediate publishing',
    parameters: {
        type: Type.OBJECT,
        required: ['postId'],
        properties: {
            postId: { type: Type.STRING, description: 'The ID of the post to approve' },
            scheduledAt: { type: Type.STRING, description: 'ISO 8601 datetime to schedule the post. Omit to mark as ready-to-publish.' },
        },
    },
},
```

**Step 3: Add executor branches for the 3 new tools**

In `lib/ai/tools/saas-tools.ts`, inside the `executeOperatorTool` function, add these cases. They need `tenantId` — check how existing marketing-adjacent tools are structured. The `draft_social_post` tool calls the AI draft route, while `get_scheduled_posts` and `approve_post` hit Firestore directly:

```typescript
// In executeOperatorTool switch/if-else, add:
if (functionName === 'draft_social_post') {
    const { postType, context, tone = 'warm', platform = 'facebook' } = args as {
        postType: string; context: string; tone?: string; platform?: string;
    };
    // Call the ai-draft route (we need tenantId from context)
    // For the AI tool executor, return a structured response the AI can relay to the user
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/tenants/${tenantId}/marketing/ai-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ postType, context, tone, platform }),
    });
    const data = await res.json();
    return JSON.stringify(data);
}

if (functionName === 'get_scheduled_posts') {
    const { status, limit = 20 } = args as { status?: string; limit?: number };
    const q = status
        ? adminDb.collection('tenants').doc(tenantId).collection('socialPosts').where('status', '==', status).orderBy('createdAt', 'desc').limit(limit)
        : adminDb.collection('tenants').doc(tenantId).collection('socialPosts').orderBy('createdAt', 'desc').limit(limit);
    const snap = await q.get();
    const posts = snap.docs.map(d => { const p = d.data(); return { id: p.id, content: p.content?.slice(0, 80), status: p.status, platforms: p.platforms, scheduledAt: p.scheduledAt, createdAt: p.createdAt }; });
    return JSON.stringify({ count: posts.length, posts });
}

if (functionName === 'approve_post') {
    const { postId, scheduledAt } = args as { postId: string; scheduledAt?: string };
    const updates: Record<string, unknown> = {
        status: 'scheduled',
        updatedAt: new Date().toISOString(),
    };
    if (scheduledAt) updates.scheduledAt = scheduledAt;
    await adminDb.collection('tenants').doc(tenantId).collection('socialPosts').doc(postId).update(updates);
    return JSON.stringify({ success: true, postId, status: 'scheduled', scheduledAt: scheduledAt ?? null });
}
```

**Note on tenantId in executeOperatorTool:** Check the function signature — if tenantId isn't currently passed, you'll need to thread it through from the chat route. Look at how `list_applications` and other tenant-aware tools access it. Use the same pattern.

**Step 4: Compile check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

**Step 5: Commit**

```bash
git add app/api/tenants/ lib/ai/tools/saas-tools.ts
git commit -m "feat: AI draft route + 3 Gemini marketing tools"
```

---

## Task 12: SuperAdmin Marketing Page + Templates CRUD

**Files:**
- Create: `app/admin/marketing/page.tsx`
- Modify: `app/admin/layout.tsx` (add Marketing nav item)

**Step 1: Admin marketing page**

```tsx
// app/admin/marketing/page.tsx
'use client';
import { useState, useEffect } from 'react';
import type { MarketingTemplate } from '@/features/marketing/types';

export default function AdminMarketingPage() {
    const [stats, setStats] = useState<{ tenantId: string; name: string; postsThisMonth: number; lastPublished: string | null }[]>([]);
    const [templates, setTemplates] = useState<MarketingTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewTemplate, setShowNewTemplate] = useState(false);
    const [newTemplate, setNewTemplate] = useState({ name: '', category: 'general' as const, promptHint: '', defaultHashtags: '' });

    useEffect(() => {
        fetch('/api/admin/marketing')
            .then(r => r.json())
            .then(d => { setStats(d.stats ?? []); setTemplates(d.templates ?? []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    async function createTemplate() {
        await fetch('/api/admin/marketing/templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...newTemplate,
                defaultHashtags: newTemplate.defaultHashtags.split(',').map(t => t.trim()).filter(Boolean),
                active: true,
            }),
        });
        setShowNewTemplate(false);
        window.location.reload();
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-gray-900">Marketing Overview</h1>

            {/* Tenant stats */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Tenant Activity</h2>
                {loading ? (
                    <div className="text-gray-400 text-sm">Loading...</div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Tenant</th>
                                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Posts This Month</th>
                                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Last Published</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {stats.length === 0 ? (
                                    <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">No tenant data yet</td></tr>
                                ) : stats.map(s => (
                                    <tr key={s.tenantId} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                                        <td className="px-4 py-3 text-gray-600">{s.postsThisMonth}</td>
                                        <td className="px-4 py-3 text-gray-400">{s.lastPublished ? new Date(s.lastPublished).toLocaleDateString() : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Template library */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-gray-900">Template Library</h2>
                    <button onClick={() => setShowNewTemplate(!showNewTemplate)}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">
                        + New Template
                    </button>
                </div>
                {showNewTemplate && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 space-y-3">
                        <input placeholder="Template name" value={newTemplate.name} onChange={e => setNewTemplate(p => ({ ...p, name: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                        <select value={newTemplate.category} onChange={e => setNewTemplate(p => ({ ...p, category: e.target.value as any }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            {['bed_availability', 'success_story', 'event_promo', 'job_listing', 'general'].map(c => (
                                <option key={c} value={c}>{c.replace('_', ' ')}</option>
                            ))}
                        </select>
                        <textarea placeholder="Prompt hint (injected into AI generation)" value={newTemplate.promptHint}
                            onChange={e => setNewTemplate(p => ({ ...p, promptHint: e.target.value }))} rows={3}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                        <input placeholder="Default hashtags (comma-separated, no #)" value={newTemplate.defaultHashtags}
                            onChange={e => setNewTemplate(p => ({ ...p, defaultHashtags: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                        <div className="flex gap-2">
                            <button onClick={() => setShowNewTemplate(false)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">Cancel</button>
                            <button onClick={createTemplate} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm">Save Template</button>
                        </div>
                    </div>
                )}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-4 py-3 text-gray-600 font-medium">Name</th>
                                <th className="text-left px-4 py-3 text-gray-600 font-medium">Category</th>
                                <th className="text-left px-4 py-3 text-gray-600 font-medium">Hashtags</th>
                                <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {templates.length === 0 ? (
                                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No templates yet</td></tr>
                            ) : templates.map(t => (
                                <tr key={t.id}>
                                    <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                                    <td className="px-4 py-3 text-gray-500 capitalize">{t.category.replace('_', ' ')}</td>
                                    <td className="px-4 py-3 text-gray-400 text-xs">{t.defaultHashtags.slice(0, 3).map(h => `#${h}`).join(' ')}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {t.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
```

**Step 2: Add Marketing nav to admin layout**

In `app/admin/layout.tsx`, add to the `navItems` array after Applications:

```typescript
{ label: 'Marketing', href: '/admin/marketing', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
```

**Step 3: Create admin marketing API routes**

```typescript
// app/api/admin/marketing/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb } from '@/lib/firebase/admin';
import { templatesService } from '@/features/marketing/services/templatesService';

export async function GET(request: NextRequest) {
    try {
        const token = await verifyAuthToken(request);
        if (token.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        // Fetch all tenants
        const tenantsSnap = await adminDb.collection('tenants').where('status', '==', 'active').get();
        const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);

        const stats = await Promise.all(tenantsSnap.docs.map(async doc => {
            const tenant = doc.data();
            const postsSnap = await adminDb.collection('tenants').doc(doc.id)
                .collection('socialPosts').where('createdAt', '>=', startOfMonth.toISOString()).count().get();
            const lastPublishedSnap = await adminDb.collection('tenants').doc(doc.id)
                .collection('socialPosts').where('status', '==', 'published').orderBy('publishedAt', 'desc').limit(1).get();
            return {
                tenantId: doc.id,
                name: tenant.name ?? doc.id,
                postsThisMonth: postsSnap.data().count,
                lastPublished: lastPublishedSnap.docs[0]?.data().publishedAt ?? null,
            };
        }));

        const templates = await templatesService.list(false);
        return NextResponse.json({ stats, templates });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
```

```typescript
// app/api/admin/marketing/templates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { templatesService } from '@/features/marketing/services/templatesService';

export async function POST(request: NextRequest) {
    try {
        const token = await verifyAuthToken(request);
        if (token.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        const body = await request.json();
        const template = await templatesService.create(token.uid, body);
        return NextResponse.json({ template }, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
```

**Step 4: Compile check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

**Step 5: Commit**

```bash
git add app/admin/marketing/ app/admin/layout.tsx app/api/admin/marketing/
git commit -m "feat: SuperAdmin marketing page + template library + API routes"
```

---

## Task 13: Navigation Entry in Tenant Dashboard

**Files:**
- Modify: Tenant dashboard layout — find the navigation array

**Step 1: Find the tenant layout nav**

```bash
grep -n "Marketing\|navItems\|href.*marketing" /Users/peter/Desktop/hvg-saas-3/app/\(dashboard\)/\[tenantId\]/layout.tsx | head -20
```

**Step 2: Add Marketing to tenant nav**

In the tenant dashboard layout, find the navigation items array and add:

```typescript
{ label: 'Marketing', href: `/${tenantId}/marketing`, icon: '📣' }
// or if the layout uses SVG paths:
{ label: 'Marketing', href: 'marketing', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' }
```

Match the exact pattern used by existing items (check how Chores, Events, LMS are listed).

**Step 3: Compile check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 4: Commit**

```bash
git add "app/(dashboard)/[tenantId]/layout.tsx"
git commit -m "feat: add Marketing to tenant dashboard nav"
```

---

## Task 14: Final Verification + Deploy

**Step 1: Full TypeScript check**

```bash
cd /Users/peter/Desktop/hvg-saas-3 && npx tsc --noEmit 2>&1
```
Expected: 0 errors.

**Step 2: Push to GitHub (auto-deploys Vercel)**

```bash
git push origin main
```

**Step 3: Mobile OTA update**

Marketing is web-only this phase — no mobile changes needed. Skip OTA unless other mobile changes were bundled.

**Step 4: Update SESSION_PROGRESS.md**

Update the file to reflect Phase 3 Content Studio is complete and what's deferred:

```markdown
## Git Status
Latest commit: <hash> — feat: Phase 3 marketing suite (Content Studio)
Vercel: ✅ Deployed
Mobile OTA: N/A (no mobile changes this phase)

### Phase 3 — Content Studio ✅
- features/marketing/ — types, services (postsService, accountsService, templatesService), hooks
- app/(dashboard)/[tenantId]/marketing/ — hub, compose (4-step), posts, accounts pages
- app/api/tenants/[tenantId]/marketing/ — posts CRUD + AI draft endpoint
- app/api/oauth/meta/ — authorize + callback stubs (501)
- lib/ai/tools/saas-tools.ts — draft_social_post, get_scheduled_posts, approve_post tools
- app/admin/marketing/ — SuperAdmin overview + template library
- firestore.rules — socialPosts, socialAccounts, marketingTemplates rules
- .env.example — META_APP_ID, META_APP_SECRET, META_REDIRECT_URI

### Phase 3b — Deferred (needs Meta Developer App credentials)
- Meta OAuth actual flow (authorize/callback implementation)
- Direct post publishing to Facebook/Instagram
- TikTok, X, LinkedIn integrations
- Analytics dashboard
```

**Step 5: Commit session progress**

```bash
git add SESSION_PROGRESS.md
git commit -m "docs: update session progress — Phase 3 Content Studio complete"
git push origin main
```

---

## Quick Reference

### New Collections
- `/tenants/{tenantId}/socialPosts/{postId}` — tenant posts
- `/tenants/{tenantId}/socialAccounts/{accountId}` — OAuth connections
- `/marketingTemplates/{templateId}` — global SuperAdmin templates

### New Routes
- `GET/POST /api/tenants/[tenantId]/marketing/posts` — list + create posts
- `PATCH/DELETE /api/tenants/[tenantId]/marketing/posts/[postId]` — update + delete
- `POST /api/tenants/[tenantId]/marketing/ai-draft` — generate AI draft
- `GET /api/oauth/meta/authorize` — Meta OAuth stub (501)
- `GET /api/oauth/meta/callback` — Meta OAuth stub (redirect)
- `GET /api/admin/marketing` — SuperAdmin stats + templates
- `POST /api/admin/marketing/templates` — create template

### New Pages
- `/(dashboard)/[tenantId]/marketing/page.tsx` — Hub
- `/(dashboard)/[tenantId]/marketing/compose/page.tsx` — 4-step composer
- `/(dashboard)/[tenantId]/marketing/posts/page.tsx` — Posts list
- `/(dashboard)/[tenantId]/marketing/accounts/page.tsx` — Accounts
- `/admin/marketing/page.tsx` — SuperAdmin overview

### New AI Tools (Gemini)
- `draft_social_post` — generates caption + 3 hashtag sets
- `get_scheduled_posts` — lists tenant posts by status
- `approve_post` — updates post status to scheduled
