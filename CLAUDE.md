# High Value Growth - Claude Context

## Project Overview

High Value Growth (HVG) is a multi-tenant SaaS platform for managing sober-living houses and supporting residents in recovery through AI-powered tools.

## Current Status: Phase 1 Complete ✅

**Implemented:**
- Next.js 14 project with App Router, TypeScript, Tailwind CSS
- Feature-driven architecture (auth, tenant, user features)
- Firebase Web SDK and Admin SDK configuration
- Email/password authentication
- Custom claims for RBAC (role-based access control)
- Multi-tenant routing with middleware protection
- Firestore security rules with tenant isolation
- Login and registration UI
- useAuth hook for client-side auth state

## Architecture Decisions

### Feature-Driven Structure
Code is organized by feature/domain rather than technical layer:
- `features/auth/` - Authentication (components, hooks, services, types)
- `features/tenant/` - Multi-tenancy (middleware, validation)
- `features/user/` - User management
- `components/ui/` - Shared UI primitives
- `lib/` - Core utilities (Firebase, errors, utils)

**Why:** Each feature is self-contained, making it easy to update one component without affecting others. Minimal cross-feature dependencies.

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
- `lib/firebase/admin.ts` - Admin SDK (server-side)
- `firestore.rules` - Security rules

**Authentication:**
- `features/auth/hooks/useAuth.ts` - Auth state management
- `features/auth/services/authService.ts` - Auth operations
- `app/api/auth/custom-claims/route.ts` - Custom claims API

**Multi-Tenancy:**
- `middleware.ts` - Route protection
- `features/tenant/middleware/tenantValidation.ts` - Tenant validation

## Next Steps (Phase 2)

Build core data models and dashboard:
- Define Firestore schema (House, Resident, Staff, Incident)
- Create tenant-scoped dashboard layout
- Implement CRUD operations for houses, residents, staff
- Build incident reporting system
- Add real-time Firestore listeners

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

**Hosting Options:**
- Firebase Hosting (configured in `firebase.json`)
- Vercel (alternative)

**Production Checklist:**
- [ ] Firebase production project created
- [ ] Environment variables configured
- [ ] Firestore rules deployed
- [ ] Custom domain configured
- [ ] SSL certificate active
