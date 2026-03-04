# HVG Session Progress — 2026-03-04 (Session 5)

## Git Status
Branch: `main`
Latest commit: `4f42cd1` — feat: marketing analytics dashboard
Remote: ✅ Pushed (`e22c1cf..4f42cd1`)
Vercel: ✅ Auto-deployed
Mobile OTA: ✅ Update group `4d8e1489-9929-4e66-a09f-1f84c700ffdf` (production branch, both platforms)

## GitHub Push
- Remote: `https://github.com/highvaluegrowth/hvg-saas-3.git` (HTTPS)
- Use `peteroleary` account with a classic PAT (ghp_...)
- Fine-grained PATs do NOT work for org repos

## Firebase Auth Fix
- `auth/unauthorized-domain` fixed: added Vercel URL + hvg.app + app.hvg.app + highvaluegrowth.com to Firebase Auth → Settings → Authorized domains

---

## All Completed Work

### Phase 1A — AI Chat Bug Fixes ✅
### Phase 1B — Application Process Bugs ✅
### Phase 2 Core + Completion ✅
### Phase 3 — Social Media Marketing Suite ✅ (commits c9eb554–e22c1cf)
### Phase 3b — Meta OAuth ✅ (commit 0823515)
### LMS Course Builder — Firestore Persistence ✅ (commit 43b36ad)
### Privacy Policy + Terms of Service ✅ (commit 5544af2)
### Stripe Billing Scaffold ✅ (commit 3ebeae9)
### iOS App Store Config ✅ (commit 315caf5)

---

## Key File Paths Added This Session

- `features/marketing/` — types, services (posts/accounts/templates), hooks
- `features/lms/services/courseService.ts`
- `lib/stripe/server.ts`, `lib/stripe/client.ts`, `lib/stripe/plans.ts`
- `app/api/oauth/meta/authorize/route.ts` — real OAuth redirect
- `app/api/oauth/meta/callback/route.ts` — full token exchange + Firestore save
- `app/api/tenants/[tenantId]/marketing/` — posts CRUD, ai-draft, accounts
- `app/api/tenants/[tenantId]/lms/courses/` — CRUD + curriculum
- `app/api/tenants/[tenantId]/billing/checkout/route.ts`
- `app/api/tenants/[tenantId]/billing/portal/route.ts`
- `app/api/webhooks/stripe/route.ts`
- `app/(dashboard)/[tenantId]/marketing/` — hub, compose, posts, accounts
- `app/(dashboard)/[tenantId]/billing/page.tsx`
- `app/(dashboard)/[tenantId]/lms/` — create, list, builder (all wired to Firestore)
- `app/admin/marketing/page.tsx`
- `app/(marketing)/privacy/page.tsx` — https://hvg.app/privacy
- `app/(marketing)/terms/page.tsx` — https://hvg.app/terms
- `app/(marketing)/pricing/page.tsx` — https://hvg.app/pricing
- `mobile/app.json` — iOS infoPlist, privacyManifests, minimumOsVersion
- `mobile/eas.json` — iOS submit config (placeholder values)

---

## Architecture Notes
- `verifyAuthToken()` — throws on failure, returns decoded token directly
- `params` in Next.js routes: `Promise<{...}>` — must `await params`
- Admin SDK: `adminDb` from `lib/firebase/admin.ts`
- Marketing timestamps: ISO 8601 strings (new Date().toISOString())
- `accountsService.upsert` uses doc ID = `${platform}_${accountId}`
- `accountsService.disconnect` uses `FieldValue.delete()` for accessToken
- Courses at `/tenants/{tenantId}/courses/{courseId}` with embedded `curriculum` array
- Stripe customer ID stored on tenant doc as `stripeCustomerId`
- LMS: `/tenants/{tenantId}/courses/{courseId}` with `curriculum: CurriculumModule[]` embedded

---

## Pending Setup (user action required)

### Meta Developer App
- Create at developers.facebook.com (type: Business → Facebook Login for Business)
- Valid OAuth Redirect URI: `https://app.hvg.app/api/oauth/meta/callback`
- Privacy Policy URL: `https://hvg.app/privacy` | ToS: `https://hvg.app/terms`
- Fill env vars: `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI`

### Stripe
- Create products + prices in Stripe Dashboard → fill 6 `STRIPE_PRICE_*` env vars
- Fill: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- Add webhook endpoint: `https://app.hvg.app/api/webhooks/stripe`
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

### iOS App Store
- Enroll Apple Developer ($99/yr) at developer.apple.com
- Create app in App Store Connect: bundle ID `com.hvgsaas3.mobile`
- Fill `eas.json` submit.production.ios: `appleId`, `ascAppId`, `appleTeamId`
- Build: `cd mobile && eas build --platform ios --profile production`
- Submit: `eas submit --platform ios --profile production`

---

## Still To Do (next session picks up here)

1. **TikTok / X / LinkedIn real OAuth** — stubs are live (501 when env vars unset); need developer app credentials for each platform to implement full token exchange
   - TikTok: tiktok.com/tiktok-for-developers
   - X/Twitter: developer.twitter.com
   - LinkedIn: developer.linkedin.com

2. **Stripe webhook testing** — `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

3. **iOS App Store build** — waiting on Apple Developer account ($99/yr at developer.apple.com)

4. **Quiz question types** — 2 of 12 implemented

5. **Engagement data sync** — `PostEngagement` type added; wire up Meta Graph API `/{post-id}/insights` polling once App Review approved

---

## Deployment Commands
```bash
# Web (auto via Vercel on push):
git push origin main

# Mobile OTA (JS changes only):
cd mobile && eas update --branch production --message "description"

# Mobile native build:
eas build --platform android
eas build --platform ios

# Mobile submit:
eas submit --platform android --profile production
eas submit --platform ios --profile production
```
