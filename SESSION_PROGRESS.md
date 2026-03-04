# HVG Session Progress — 2026-03-04

## Git Status
Branch: `main`
Latest commit: `3cf568c` — feat: Phase 2 application flows — 5 types, SuperAdmin inbox, auto-match
Commits ahead of remote: 3 (need `git push origin main` once GitHub auth is configured)

## What Was Completed This Session

### Phase 1A — AI Chat Bug Fixes ✅ (commit `a4372d3`)
- `mobile/lib/auth/tokenStore.ts` — rewrote `getAuthToken()` to always call Firebase Auth first (auto-refreshes expired tokens), SecureStore is fallback only. Fixes stale-token 401s after 1hr.
- `lib/ai/chatService.ts` — added `tenant_admin` + `staff_admin` to operator roles; throw on null token
- `components/ai-sidebar/AISidebar.tsx` — added `tenant_admin` + `staff_admin` to operator role check
- `app/api/ai/saas/chat/route.ts` — added `tenant_admin` + `staff_admin` to server-side operator check
- `lib/ai/chatHistoryClient.ts` — fixed dead endpoint `/api/ai/chat/history` → `/api/ai/saas/chat/history`
- `app/apply/[applicationId]/page.tsx` — added auth headers to all fetch calls, fixed handleSave to save all fields, fixed bad redirect

### Phase 1B — Application Process Bugs ✅ (commit `c0e3179`)
- `mobile/app/(profile-builder)/morals.tsx` — added `await refreshAppUser()` after profile completion to prevent re-entry loop
- `app/apply/[applicationId]/page.tsx` — inline success screen after submit (no more bad redirect), hydrate all draft fields on load, surface save errors

### Phase 2 — Application Flows ✅ (commit `3cf568c`)

**Backend:**
- `features/applications/types.ts` — shared types for all 5 application types (bed, staff, course, event, tenant)
- `features/applications/services/matchingService.ts` — auto-match algorithm (proximity 40pts + specialization 40pts + capacity 20pts)
- `app/api/applications/[type]/route.ts` — public POST endpoint for all application types
- `app/api/admin/applications/route.ts` — SuperAdmin list with type/status filters
- `app/api/admin/applications/[id]/route.ts` — single application GET
- `app/api/admin/applications/[id]/assign/route.ts` — assign to tenant, mirrors to tenant sub-collection
- `app/api/admin/applications/[id]/matches/route.ts` — ranked tenant match scores
- `firestore.rules` — added `/applications` collection rules

**Frontend:**
- `app/apply/page.tsx` — application type hub page
- `app/apply/bed/page.tsx` — 5-step resident bed application wizard (auth pre-fill, inline success)
- `app/apply/staff/page.tsx` — 4-step staff/job application wizard
- `app/admin/applications/page.tsx` — SuperAdmin unified inbox (type+status filters, skeleton, empty states)
- `app/admin/applications/[applicationId]/page.tsx` — detail + assign page (parallel fetches, match score bar, inline confirm dialog, toast)

## What Still Needs To Be Done

### Phase 2 (remaining)
- [ ] Course enrollment application page: `app/apply/course/[courseId]/page.tsx` — 2-step, initiated from LMS course listing
- [ ] Event registration page: `app/apply/event/[eventId]/page.tsx` — 1-step inline, initiated from events calendar
- [ ] Mobile entry points for bed + staff applications (add to mobile nav)
- [ ] Expand SuperAdmin AI Partner tools:
  - `list_applications(type?, status?, zip?)`
  - `assign_application(applicationId, tenantId)`
  - `get_match_suggestions(applicationId)`
  - `get_platform_analytics(period)`
- [ ] View-context system — pass current `view` to AI so it knows which tools to surface
- [ ] Add `/admin/applications` link to the admin sidebar/nav

### Phase 3 (not started)
- Social media marketing suite (Meta, TikTok, X, LinkedIn)
- Tenant marketing hub + campaign builder
- SuperAdmin marketing oversight

## Architecture Notes
- All new applications use global Firestore collection `/applications/{id}` (not tenant-scoped)
- Auto-match returns top 10 tenants scored 0-100 — SuperAdmin clicks one to assign
- After assign: application status → 'assigned', mirrored to `/tenants/{id}/assignedApplications/{appId}`
- Application types: 'bed' | 'staff' | 'course' | 'event' | 'tenant'
- Status flow: pending → assigned → accepted/rejected → archived
- Public applications (bed, staff) don't require login — token is optional, used for pre-fill only

## GitHub Auth Issue
SSH key (`~/.ssh/id_ed25519`) is linked to `peteroleary` account which lacks write access to `highvaluegrowth/hvg-saas-3`.

Fix options:
1. Generate new SSH key for the highvaluegrowth GitHub account and add it there
2. Set HTTPS remote with a PAT:
   ```bash
   read -s -p "GitHub PAT: " T && git remote set-url origin https://$T@github.com/highvaluegrowth/hvg-saas-3.git
   ```
   Get PAT from: github.com/settings/tokens (needs `repo` scope)

## Dev Server
Running via preview_start. Next.js on port 3000. Managed via `.claude/launch.json`.

## Vercel MCP
Shows "connected" in Claude Settings → Extensions → Vercel, but tools not loaded in current session. Restart Claude Code to load Vercel MCP tools. Auto-deploy via GitHub integration will work once push is set up.
