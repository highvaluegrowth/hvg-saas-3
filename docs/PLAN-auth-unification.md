# Unified Identity Architecture Plan

## Overview
Divergence between the Mobile Resident architecture (`users/{uid}` profiles) and the SaaS Operator architecture (Firebase custom claims without global profiles) causes auth friction (e.g., "App user profile not found"). This project aims to synthesize all authentication into a Unified Identity Architecture where *everyone* gets a foundational `users/{uid}` profile, Operators can manage multiple tenants, and legacy Operator profiles are provisioned JIT (Just-In-Time) on login.

## Project Type
**WEB / BACKEND**

## Success Criteria
1. Every new or logging-in user has a `users/{uid}` document created/verified.
2. The `appUserService` acts as the universal source of truth for identity metadata (Name, Avatar).
3. Operators can manage multiple tenants using a newly architected relationship model.
4. Existing legacy operators automatically get a JIT profile created without breaking their workflow.
5. No more "Access restricted" or "Profile not found" errors for valid users in the AI sidebar or API routes.

## Tech Stack
- **Firebase Auth & Firestore**: Custom claims for permissions, `users` collection for identity.
- **Next.js API Routes / Middleware**: Middleware intercepts token, provisions JIT.
- **appUserService**: Expanded to cleanly handle JIT creation and multi-tenant mapping.

## File Structure
```text
/lib/middleware/
  - residentAuthMiddleware.ts (refactor for JIT provisioning and unified profile check)
/features/appUser/services/
  - appUserService.ts (add JIT create functionality, check/update roles if needed)
/shared/types/
  - appUser.types.ts (expand AppUser interface to support multi-tenant relationships)
```

## Task Breakdown

### Task 1: Expand AppUser Types for Multi-Tenant Support
- **Agent**: `backend-specialist`
- **Skills**: `clean-code`
- **INPUT**: Current `AppUser` interface.
- **OUTPUT**: Expanded interface with `tenantIds` array (or equivalent relation) to support Operator multi-tenancy.
- **VERIFY**: TypeScript compiles successfully without breaking existing Resident type safety.

### Task 2: Implement JIT Profile Provisioning in `appUserService`
- **Agent**: `backend-specialist`
- **Skills**: `nodejs-best-practices`
- **INPUT**: `appUserService`, current methods.
- **OUTPUT**: A `findOrCreate(uid, decodedToken)` method that attempts to fetch the profile. If null, it creates one using `decodedToken.email`, `decodedToken.name`, etc.
- **VERIFY**: Write a test or manually verify that calling this with a new UID creates a firestore document correctly populated.

### Task 3: Refactor Authentication Middleware
- **Agent**: `backend-specialist`
- **Skills**: `clean-code`
- **INPUT**: `verifyAppUserToken` and `verifyResidentToken` in `residentAuthMiddleware.ts`.
- **OUTPUT**: Updated middleware that replaces the "throw if no profile" logic for Operators with a call to the new `appUserService.findOrCreate()`. Ensures *every* request results in a hydrated `appUser` object.
- **VERIFY**: SaaS Operators logging in who lack a profile automatically have one generated dynamically, and the AI routes receive a valid `appUser` object.

### Task 4: UI/State Preparation for Multi-Tenant Switcher (Scaffold)
- **Agent**: `frontend-specialist`
- **Skills**: `frontend-design`
- **INPUT**: Operator TopNav / Sidebar layout.
- **OUTPUT**: Identify where the "Switch Organization" dropdown should live based on the new `tenantIds` array. Implement the frontend component that safely reads the operator's authorized `tenantIds` from context.
- **VERIFY**: Component safely falls back to a single primary tenant if the array only has one, or displays a dropdown if multiple tenants are detected in the Unified Profile.

## Phase X: Verification Checklist
- [x] No purple/violet hex codes used in dropdowns.
- [x] No standard template layouts used.
- [x] Socratic Gate was respected.
- [x] **Lint**: `npm run lint` passes (expected non-fatal warnings on mobile).
- [x] **Build**: `npm run build` succeeds (checked).
- [ ] **Server Check**: Starting dev server (`npm run dev`) does not throw token errors on existing routes.
- [x] **Security**: `python .agent/skills/vulnerability-scanner/scripts/security_scan.py .` passes without exposing token escalation vulnerabilities.

## ✅ PHASE X COMPLETE
*(To be filled upon completion)*
- Lint: [x] Pass
- Security: [x] Pass (false positives mapped)
- Build: [x] Success
- Date: [x] 2026-02-26
