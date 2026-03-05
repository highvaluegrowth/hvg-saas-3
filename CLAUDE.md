# High Value Growth - Claude Context

## Project Overview

High Value Growth (HVG) is a multi-tenant SaaS platform for managing sober-living houses and supporting residents in recovery through AI-powered tools.

## Current Status: Sessions A–E Complete ✅

**Web (Next.js 14, App Router, TypeScript, Tailwind 4, Firebase):**
- Auth + RBAC (custom claims), multi-tenant routing + Firestore isolation
- Dashboard: Houses, Residents, Staff, Incidents, Chores, Vehicles, Events
- LMS: course builder, 10 quiz types, analytics
- AI: HVG Partner (16 saas-tools), HVG Guide (13 mobile-tools), Gemini 2.5 Flash
- News Feed, Contracts + e-signature (pdf-lib + signature_pad), Blog
- Tenant Directory + promos, Kanban board, Contacts page
- Application system (bed/staff/course/event/tenant), SuperAdmin queue
- Image uploads wired: profile, events, courses, houses, vehicles, LMS slides

**Mobile (Expo 52, React Native, Expo Router 4):**
- Firebase Auth + SecureStore token management (Firebase-first flow)
- HVG Guide AI chat with optimistic updates + error handling
- Bundle: iOS `com.hvgsaas3.mobile`, Android `com.hvg_saas_3.mobile`

## Next Steps

- Stripe payments (placeholder only — `STRIPE_SECRET_KEY` env var exists)
- Course/event application pages (not yet built)
- Mobile bed/staff application entry points
- SuperAdmin AI tools for applications
- LMS quiz types: 10 of 12 built (2 remaining)

## Architecture Decisions

### Feature-Driven Structure
Code is organized by feature/domain rather than technical layer:
- `features/auth/` - Authentication (components, hooks, services, types)
- `features/tenant/` - Multi-tenancy (middleware, validation)
- `features/user/` - User management
- `features/feed/` - News Feed
- `features/contracts/` - Contracts + e-sign
- `features/blog/` - Blog
- `features/applications/` - Application system
- `components/ui/` - Shared UI primitives
- `lib/` - Core utilities (Firebase, errors, utils, AI tools, contracts)

**Why:** Each feature is self-contained, making it easy to update one component without affecting others.

### Multi-Tenancy Pattern
All tenant data scoped under `/tenants/{tenantId}/` in Firestore. Custom claims (`tenant_id`, `role`) stored in Firebase Auth tokens for server-side validation.

**Roles:**
- `super_admin` - Platform owner, access all tenants
- `tenant_admin` - Organization owner, full tenant access
- `staff_admin` - Staff manager
- `staff` - House staff
- `resident` - Resident (mobile app primary user)

### Authentication Flow
1. User registers → Firebase Auth creates user
2. Server API sets custom claims (`tenant_id`, `role`)
3. User logs in → ID token includes claims
4. Next.js middleware validates tenant access
5. Firestore rules enforce tenant isolation

## Key Files

**Firebase Config:**
- `lib/firebase/client.ts` - Web SDK (client-side)
- `lib/firebase/admin.ts` - Admin SDK (server-side); exports `adminDb`, `adminAuth`, `adminStorage` (lazy Proxy pattern)
- `firestore.rules` - Security rules

**Authentication:**
- `features/auth/hooks/useAuth.ts` - Auth state management
- `features/auth/services/authService.ts` - Auth operations
- `app/api/auth/custom-claims/route.ts` - Custom claims API
- `lib/middleware/authMiddleware.ts` - `verifyAuthToken()` — throws on failure, returns decoded token directly (NOT `{ success, token }`)

**Multi-Tenancy:**
- `middleware.ts` - Route protection
- `features/tenant/middleware/tenantValidation.ts` - Tenant validation

**AI:**
- `app/api/ai/saas/chat/route.ts` - HVG Partner (SaaS)
- `app/api/ai/mobile/chat/route.ts` - HVG Guide (mobile)
- `lib/ai/tools/saas-tools.ts` - 16 operator tools
- `lib/ai/tools/mobile-tools.ts` - 13 resident tools

**Contracts + E-Sign:**
- `lib/contracts/pdfGenerator.ts` - pdf-lib PDF generation
- `app/sign/[contractId]/page.tsx` - public signing page (no auth required)
- `app/api/contracts/[contractId]/route.ts` - GET (public) + POST (sign + upload PDF to Storage)

**Mobile:**
- `mobile/lib/config.ts` - API_BASE_URL: production = `https://app.hvg.app`
- `mobile/features/ai-chat/useChatSession.ts` - optimistic updates + onError rollback
- `mobile/lib/auth/tokenStore.ts` - SecureStore token management (Firebase-first)

## Critical Gotchas

- **`await params`** — Next.js 14+ App Router `params` are `Promise<{...}>` — always `await params` before destructuring
- **`adminDb` not `db`** — Admin SDK export from `lib/firebase/admin.ts` is `adminDb`
- **`verifyAuthToken()`** — throws on failure; returns decoded token directly, not `{ success, token }`
- **zsh glob brackets** — `git add` paths with `[tenantId]` must be quoted: `git add "app/(dashboard)/[tenantId]/..."`
- **`export const dynamic = 'force-dynamic'`** — required on any route using `request.headers` or cookies
- **Firestore reaction toggle** — read array, add/remove uid, delete key entirely when array empties (not set to `[]`)
- **AI persona names** — mobile = **HVG Guide**, web/SaaS = **HVG Partner** (never "Companion")

## Development Guidelines

**Principles:**
- DRY (Don't Repeat Yourself)
- YAGNI (You Aren't Gonna Need It)
- TDD (Test-Driven Development)
- Frequent commits with descriptive messages

**Commit Message Format:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `chore:` - Dependencies, config

## Firebase Setup

**Environment Variables Required:**
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_PRIVATE_KEY=
FIREBASE_ADMIN_CLIENT_EMAIL=

GEMINI_API_KEY=
STRIPE_SECRET_KEY=
```

**Emulators for Local Development:**
```bash
firebase emulators:start
```

## Testing Strategy

**Unit Tests:** Vitest for services and utilities
**Integration Tests:** Test auth flow, tenant isolation
**E2E Tests:** Playwright for user flows (planned)

## Deployment

**Web — Vercel:**
- Auto-deploys on push to `main` via GitHub integration (preferred)
- CLI token expires frequently — prefer GitHub push over `vercel --prod`
- Production URL: `https://app.hvg.app`

**Mobile — Expo EAS:**
- OTA update: `cd mobile && npx eas-cli update --branch production --message "..." --non-interactive`
- Native build: `cd mobile && npx eas-cli build --platform all --profile production`
- EAS project: `petergaiennie/hvg-mobile` (projectId: `ac8fee05-2155-4f28-854c-2abf9ec334f0`)

**Production Checklist:**
- [x] Firebase production project created
- [x] Environment variables configured
- [x] Firestore rules deployed
- [x] Custom domain configured (`app.hvg.app`)
- [x] SSL certificate active
