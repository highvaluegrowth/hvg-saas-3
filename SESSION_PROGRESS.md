# HVG Session Progress — 2026-03-03 (Session 3)

## Git Status
Branch: `main`
Latest commit: `1e512fa` — feat: complete Phase 2
Remote: ✅ Synced with `highvaluegrowth/hvg-saas-3`
Vercel: ✅ Deployed — https://hvg-saas-3-1ulz8z0bf-peterolearys-projects.vercel.app
Mobile OTA: ✅ Published — update group `a55c613d-a048-4c6f-a88c-05f49864c941`

## GitHub Push — SOLVED
- Remote: `https://github.com/highvaluegrowth/hvg-saas-3.git` (HTTPS)
- Use `peteroleary` account with a **classic PAT** (ghp_... prefix, NOT fine-grained)
- Credential stored in macOS keychain — `git push origin main` should now work
- Fine-grained PATs (github_pat_11...) do NOT work for org repos
- DO NOT use `high-valuegrowth` account

## All Completed Work

### Phase 1A — AI Chat Bug Fixes ✅ (commit `a4372d3`)
- `mobile/lib/auth/tokenStore.ts` — rewrote to call Firebase Auth first (auto-refreshes)
- `lib/ai/chatService.ts` — added `tenant_admin` + `staff_admin` to operator roles
- `components/ai-sidebar/AISidebar.tsx` — same operator role fix
- `app/api/ai/saas/chat/route.ts` — same server-side fix
- `lib/ai/chatHistoryClient.ts` — fixed dead endpoint
- `app/apply/[applicationId]/page.tsx` — auth headers, save all fields, bad redirect fixed

### Phase 1B — Application Process Bugs ✅ (commit `c0e3179`)
- `mobile/app/(profile-builder)/morals.tsx` — `await refreshAppUser()` to prevent re-entry loop
- `app/apply/[applicationId]/page.tsx` — inline success screen, full field hydration, save errors

### Phase 2 Core ✅ (commit `3cf568c`)
- `features/applications/types.ts` — shared types for all 5 application types
- `features/applications/services/matchingService.ts` — auto-match algorithm
- `app/api/applications/[type]/route.ts` — public POST for all types
- `app/api/admin/applications/` — list, detail, assign, matches endpoints
- `firestore.rules` — /applications collection rules
- `app/apply/page.tsx` — application type hub
- `app/apply/bed/page.tsx` — 5-step bed wizard
- `app/apply/staff/page.tsx` — 4-step staff wizard
- `app/admin/applications/page.tsx` — SuperAdmin unified inbox
- `app/admin/applications/[applicationId]/page.tsx` — detail + assign + score bar

### Phase 2 Completion ✅ (commit `1e512fa`)
- `app/admin/layout.tsx` — Applications link in admin sidebar
- `lib/ai/tools/saas-tools.ts` — 4 new SuperAdmin AI tools
- `lib/ai/prompts/hvg-partner.ts` — view-context system
- `app/apply/course/[courseId]/page.tsx` — 2-step course enrollment wizard
- `app/apply/event/[eventId]/page.tsx` — 1-step event registration form
- `app/apply/page.tsx` — all 5 application types now enabled
- `mobile/app/(tabs)/index.tsx` — "Find a Bed" + "Staff Positions" home screen cards
- `mobile/app/apply/bed.tsx` — 3-step native bed application
- `mobile/app/apply/staff.tsx` — 3-step native staff application
- `mobile/lib/api/routes.ts` — applicationApi.submitBed + submitStaff

## What Still Needs To Be Done

### Phase 3 — Social Media Marketing Suite
- Meta (Facebook + Instagram) OAuth + token storage
- Tenant marketing hub: `app/(dashboard)/[tenantId]/marketing/`
- Content composer with AI (HVG Partner draft tools)
- Post scheduler (calendar view)
- Analytics per platform
- SuperAdmin oversight + template library
- TikTok, X/Twitter, LinkedIn integrations
- AI tools: `draft_social_post`, `schedule_post`, `get_campaign_analytics`

### Other Deferred
- LMS course builder not saving to Firestore
- Stripe (placeholder only)
- iOS app (new bundle, App Store Connect)
- Course/event apply pages linked from LMS/calendar (currently only via /apply hub)

## Architecture Notes
- `verifyAuthToken()` — throws on failure, returns decoded token directly (not {success, token})
- `params` in Next.js 14+ routes are `Promise<{...}>` — must `await params`
- Firestore Admin SDK: `adminDb` not `db` (from `lib/firebase/admin.ts`)
- Global Firestore `/applications/{id}` (not tenant-scoped)
- Auto-match: proximity 40pts + specialization 40pts + capacity 20pts
- Status flow: pending → assigned → accepted/rejected → archived

## Deployment Commands
```bash
# Web (auto via Vercel on push, but to push manually):
git push origin main

# Mobile OTA (JS changes only, instant, no app store):
cd mobile && eas update --branch production --message "description"

# Mobile new build (native changes):
eas build --platform android
eas build --platform ios
```
