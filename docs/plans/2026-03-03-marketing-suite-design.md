# Phase 3: Social Media Marketing Suite — Design Doc

**Date:** 2026-03-03
**Status:** Approved
**Approach:** Phased — AI Content Studio ships this session; Meta Graph API OAuth deferred until credentials are ready

---

## 1. Architecture & Data Model

### Firestore Collections

#### `/tenants/{tenantId}/socialPosts/{postId}`
```
{
  id: string
  tenantId: string
  content: string                        // final edited caption
  platforms: ('facebook' | 'instagram' | 'tiktok' | 'x' | 'linkedin')[]
  hashtags: string[]                     // combined AI + custom
  status: 'draft' | 'scheduled' | 'published' | 'failed'
  postType: 'bed_availability' | 'success_story' | 'event_promo' | 'job_listing' | 'general'
  scheduledAt: Timestamp | null
  publishedAt: Timestamp | null
  createdBy: string                      // uid
  createdAt: Timestamp
  updatedAt: Timestamp
  aiGenerated: boolean
  sourceContext: Record<string, unknown> // snapshot of the Firestore doc that inspired the post
}
```

#### `/tenants/{tenantId}/socialAccounts/{accountId}`
```
{
  id: string
  platform: 'facebook' | 'instagram' | 'tiktok' | 'x' | 'linkedin'
  accessToken: string                    // encrypted at rest
  tokenExpiresAt: Timestamp
  accountName: string
  accountId: string                      // platform-specific page/profile ID
  connectedAt: Timestamp
  connectedBy: string                    // uid
  status: 'active' | 'expired' | 'revoked'
}
```

#### `/marketingTemplates/{templateId}` (global, SuperAdmin-managed)
```
{
  id: string
  name: string
  category: 'bed_availability' | 'success_story' | 'event_promo' | 'job_listing' | 'general'
  promptHint: string                     // injected into AI generation prompt
  defaultHashtags: string[]
  createdBy: string                      // super_admin uid
  createdAt: Timestamp
  active: boolean
}
```

### Feature Module Structure
```
features/marketing/
  types.ts         — SocialPost, SocialAccount, MarketingTemplate interfaces
  services/
    postsService.ts      — CRUD for socialPosts
    accountsService.ts   — CRUD for socialAccounts
  hooks/
    usePosts.ts          — real-time listener for tenant posts
    useAccounts.ts       — tenant connected accounts
```

---

## 2. UI & Composer Flow

### Tenant Marketing Hub: `/(dashboard)/[tenantId]/marketing/`

**Pages:**
- `page.tsx` — Hub: stats cards (posts this month, scheduled, published) + recent drafts table + "New Post" CTA
- `compose/page.tsx` — 4-step AI composer
- `posts/page.tsx` — All posts (filterable by status, platform, type)
- `accounts/page.tsx` — Connected accounts (OAuth connect buttons, token status)

### 4-Step Composer (`/marketing/compose`)

**Step 1 — Post Type**
Select one of 5 types:
- 🛏️ Bed Availability
- 🌟 Success Story (anonymized)
- 📅 Event Promotion
- 💼 Job Listing
- ✍️ General Update

**Step 2 — Context**
Based on type, show relevant Firestore data the AI can reference:
- *Bed Availability* → # open beds, house name, specializations
- *Event Promotion* → pick event from tenant's events collection
- *Job Listing* → pick open staff role from tenant's positions
- *Success Story / General* → free-text prompt ("describe what happened")

**Step 3 — Edit & Approve**
AI-generated draft with:
- Editable textarea (full manual override)
- Three hashtag sets (General Recovery, House-Specific, Platform-Optimized) as toggleable chips
- Custom hashtag input (type and add, displayed as removable chips)
- Character count per platform

**Step 4 — Platforms & Timing**
- Platform checkboxes (only show connected platforms + a "Connect" shortcut for unconnected ones)
- Schedule picker: "Post Now" vs date/time picker
- "Save as Draft" fallback always available
- Submit → saves to Firestore with status `scheduled` or `draft`

---

## 3. AI Content Generation

### Three New Gemini Tools (added to `lib/ai/tools/saas-tools.ts`)

#### `draft_social_post`
```
params: {
  postType: 'bed_availability' | 'success_story' | 'event_promo' | 'job_listing' | 'general'
  context: string    // free-text description or fetched Firestore data summary
  tone: 'professional' | 'warm' | 'urgent' | 'celebratory'
  platform: 'facebook' | 'instagram' | 'tiktok' | 'x' | 'linkedin'
}
returns: {
  draft: string
  hashtags: { general: string[], houseSpecific: string[], platformOptimized: string[] }
}
```

**Implementation:** Fetches relevant Firestore docs based on postType + tenantId, builds a rich prompt including house name, specializations, and any template `promptHint` from `/marketingTemplates/`. Returns caption + 3 categorized hashtag sets. The UI merges these with any custom tags the user adds.

#### `get_scheduled_posts`
```
params: { status?: 'draft' | 'scheduled' | 'published', limit?: number }
returns: SocialPost[]
```

#### `approve_post`
```
params: { postId: string, scheduledAt?: string }
returns: { success: boolean }
```
Updates post status from `draft` → `scheduled` (or `published` if scheduledAt is now/past).

### Custom Hashtags
The UI always shows a custom hashtag input field alongside the AI-suggested chip sets. Custom tags persist in `socialPost.hashtags` alongside the selected AI tags — they are never removed or overwritten by AI regeneration.

---

## 4. SuperAdmin Oversight + Meta OAuth Handoff

### SuperAdmin Marketing Page: `/admin/marketing/`

**Read-only cross-tenant table:**
- Columns: Tenant Name | Posts This Month | Last Published | Connected Platforms
- Clicking a tenant row → deep-link to their marketing hub (already exists via tenant admin routes)

**Template Library:**
- Table of all `marketingTemplates` docs
- SuperAdmin can create/edit/deactivate templates
- Templates surface to tenants in the composer Step 3 as optional "Use Template" prompt hints

No moderation or post-blocking in scope for this phase.

### Meta OAuth — Deferred Stub

`app/api/oauth/meta/authorize/route.ts` and `app/api/oauth/meta/callback/route.ts` will be created as **501 Not Implemented** stubs. They will:
- Return a clear message: "Meta integration coming soon — contact HVG to get connected"
- Log the attempt so SuperAdmin can see which tenants are trying to connect
- Accept `META_APP_ID` and `META_APP_SECRET` env vars (documented in `.env.example`) so the implementation slot-in is trivial next session

The Accounts page UI will show a "Connect Facebook / Instagram" button that hits the authorize stub and shows a "Coming Soon" toast.

---

## 5. Firestore Rules

```
// /tenants/{tenantId}/socialPosts
match /tenants/{tenantId}/socialPosts/{postId} {
  allow read, write: if isAuthenticated()
    && (isSuperAdmin() || (hasTenantAccess(tenantId) && isStaffOrAbove()));
}

// /tenants/{tenantId}/socialAccounts
match /tenants/{tenantId}/socialAccounts/{accountId} {
  allow read, write: if isAuthenticated()
    && (isSuperAdmin() || (hasTenantAccess(tenantId) && isTenantAdmin()));
}

// /marketingTemplates (global)
match /marketingTemplates/{templateId} {
  allow read: if isAuthenticated();
  allow write: if isSuperAdmin();
}
```

---

## 6. Navigation

Add "Marketing" to tenant dashboard nav (`lib/constants/navigation.ts` or equivalent):
```
{ label: 'Marketing', href: '/(dashboard)/[tenantId]/marketing', icon: 'megaphone' }
```

Add "Marketing" to SuperAdmin admin sidebar (`app/admin/layout.tsx`).

---

## 7. Environment Variables

Add to `.env.example`:
```
# Meta (Facebook/Instagram) — Phase 3b
META_APP_ID=
META_APP_SECRET=
META_REDIRECT_URI=https://yourdomain.com/api/oauth/meta/callback
```

---

## 8. Out of Scope (This Phase)

- Actual Meta API post publishing (deferred until OAuth credentials ready)
- TikTok, X/Twitter, LinkedIn integrations
- Analytics dashboard (engagement, reach, follower growth)
- Post image/video upload
- Campaign builder (multi-post sequences)
- A/B variant testing

---

## 9. Implementation Order

1. `features/marketing/types.ts` — interfaces
2. `features/marketing/services/postsService.ts` + `accountsService.ts`
3. `features/marketing/hooks/usePosts.ts` + `useAccounts.ts`
4. Firestore rules additions
5. API routes: `app/api/tenants/[tenantId]/marketing/posts/route.ts` (CRUD)
6. OAuth stubs: `app/api/oauth/meta/authorize/route.ts` + `callback/route.ts`
7. UI pages: hub → compose → posts → accounts
8. 3 new Gemini tools in `lib/ai/tools/saas-tools.ts`
9. SuperAdmin `/admin/marketing/page.tsx` + global template CRUD
10. Navigation entries + `.env.example` additions
11. TypeScript check + commit + deploy
