# Phase 4: Resident Mobile App — Design

**Date:** 2026-02-24
**Status:** Approved
**Scope:** Expo/React Native resident app with AI recovery guide (Gemini 2.5 Flash), cross-tenant access, platform data sync, and mobile API layer

---

## Vision

A standalone mobile app (iOS + Android) for people in recovery — independent of any sober-living house. Users sign up, use an AI recovery guide, discover and join tenant programs, attend events, complete chores, request rides, and track their recovery journey across multiple houses and organizations over time.

---

## Core Principles

- **Identity is global, enrollment is contextual.** A user exists independent of any house. Joining a house creates an Enrollment record; leaving doesn't delete the user.
- **Multi-tenant, not single-tenant.** A resident can be enrolled in multiple organizations simultaneously, or in none at all.
- **AI knows the resident, not just the session.** The Gemini guide accumulates context about the resident's recovery journey across every conversation.
- **Clinical data stays with staff.** Medical records, diagnoses, medications — staff-only. The AI prompt sees only recovery-relevant context.
- **Web dashboard is unaffected.** All changes to auth/claims are isolated to the `resident` role path. Staff/admin flows unchanged.

---

## Architecture Decisions

### ADR-1: User Identity Model

Two linked documents:

**`/users/{uid}`** (new global collection — mobile user profile)
```typescript
interface AppUser {
  uid: string;                    // = Firebase Auth uid = document ID
  email: string;
  displayName: string;
  photoUrl?: string;
  phoneNumber?: string;
  residentId?: string | null;     // set when linked to a Resident record by staff
  onboardingComplete: boolean;
  sobrietyDate?: Date | null;     // self-reported
  recoveryGoals?: string[];       // self-reported, fed into AI context
  notificationPreferences: {
    events: boolean;
    chores: boolean;
    messages: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

**`/residents/{residentId}`** gets one new field:
```typescript
firebaseUid?: string | null;      // set by staff when linking app user to Resident record
```

**Linking flow:**
1. Resident downloads app → registers → `/users/{uid}` created automatically
2. Staff links via web dashboard: `PATCH /api/tenants/{id}/residents/{id}` sets `firebaseUid`
3. Optionally: server auto-links by email match (staff confirms in dashboard)

### ADR-2: Multi-Tenant Authorization

**Decision: Enrollment-based authorization. No `tenant_id` in resident claims.**

Mobile users get claims: `{ role: 'resident' }` — no `tenant_id`.

Access to any tenant resource is authorized server-side by checking the `Enrollment` collection:
```typescript
// lib/middleware/residentAuthMiddleware.ts
async function verifyResidentTenantAccess(uid, tenantId) {
  // 1. Load /users/{uid} → get residentId
  // 2. Load /tenants/{tenantId}/enrollments/{residentId}
  // 3. Throw 403 if missing or status === 'discharged'
  // Returns: { residentId, enrollment }
}
```

Web dashboard routes (staff/admin with `tenant_id` claims) are completely unaffected.

**Why not token switching (Option B) or tenantIds array (Option C):**
- Token switching requires 1–2s round-trip + token refresh on every house switch — unacceptable mobile UX
- `tenantIds[]` in claims duplicates Enrollment (already the authoritative source), requires re-issuance on every join/leave, and Firebase has a 1000-byte claim limit

### ADR-3: Gemini AI Model

**Model: `gemini-2.5-flash`**

- Fast enough for conversational UX (sub-2s responses)
- 1M+ token context window (long recovery journey histories)
- Supports function calling (tool use for live platform data)
- Not subject to retirement in the near term
- SDK: `@google/genai` (`npm install @google/genai`)

Upgrade path: feature-flag specific flows (e.g. personalized program planning) to `gemini-2.5-pro` if deeper reasoning is needed.

### ADR-4: App Structure — Monorepo-lite

`/mobile` directory inside the existing repo. Shared TypeScript types in `/shared/types/`.

```
hvg-saas2/
  app/                    ← existing Next.js web dashboard
  features/               ← existing web features
  shared/
    types/                ← NEW: shared interfaces (Resident, Enrollment, Event, etc.)
  mobile/                 ← NEW: Expo app
    app/                  ← Expo Router (file-based)
      (auth)/
        login.tsx
        register.tsx
      (tabs)/
        index.tsx          ← Home feed
        chat.tsx           ← AI recovery guide
        schedule.tsx       ← Calendar
        profile.tsx        ← Profile + sobriety tracker
      tenants/
        index.tsx          ← Discover & join programs
        [tenantId]/
          events/index.tsx
          chores/index.tsx
          rides/index.tsx
    features/              ← mobile-specific modules
      auth/
      feed/
      ai-chat/
      tenants/
    lib/
      api/                 ← typed fetch client for /api/mobile/ routes
    package.json           ← separate from root (Expo managed workflow)
    app.json
    tsconfig.json
```

**Shared (copy to `/shared/types/`):** `Resident`, `Enrollment`, `ProgramEvent`, `Chore`, `Ride`, `Vehicle`, `AppUser`, `UserRole`, Zod request/response schemas for mobile API.

**Not shared:** Services (use firebase-admin, Node.js only), React hooks (Next.js-specific), UI components (Tailwind/web DOM), BaseRepository (firebase-admin incompatible with Expo).

**Key Expo packages:**
```json
{
  "expo": "~52.0.0",
  "expo-router": "~4.0.0",
  "expo-secure-store": "~14.0.0",
  "expo-notifications": "~0.29.0",
  "@react-native-firebase/app": "^21.0.0",
  "@react-native-firebase/auth": "^21.0.0",
  "@react-native-firebase/firestore": "^21.0.0",
  "@tanstack/react-query": "^5.0.0",
  "zod": "^4.3.6",
  "date-fns": "^4.1.0",
  "react-native-gifted-chat": "^2.6.0"
}
```

Note: `@react-native-firebase` (Invertase) not `firebase` web SDK — production-grade, native performance.

### ADR-5: Offline Strategy

**Partial offline via TanStack Query + AsyncStorage persistence.** Not full offline-first.

- `staleTime: 5 minutes` for schedule/events
- `gcTime: 24 hours` for profile data
- `@tanstack/react-query-async-storage-persister` for disk persistence between sessions
- Optimistic updates for chore status and event attendance
- AI chat, ride requests, and tenant join require connectivity

---

## Mobile API Layer

All new routes under `app/api/mobile/` — isolated from web routes (`/api/tenants/[tenantId]/`).

### Auth & Profile
| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/mobile/auth/register` | Create Firebase user + `/users/{uid}` doc + set `{ role: 'resident' }` claims |
| `GET`  | `/api/mobile/users/me` | Load `AppUser` document |
| `PATCH`| `/api/mobile/users/me` | Update profile (displayName, photoUrl, sobrietyDate, recoveryGoals, notificationPreferences) |

### Tenant Discovery & Enrollment
| Method | Route | Description |
|--------|-------|-------------|
| `GET`  | `/api/mobile/tenants` | Public list of active tenants (id, name, logoUrl) |
| `POST` | `/api/mobile/tenants/{tenantId}/request-join` | Create join request; staff approves in web dashboard |
| `GET`  | `/api/mobile/users/me/enrollments` | All Enrollments across all tenants via collection group query |

### Cross-Tenant Feed
| Method | Route | Description |
|--------|-------|-------------|
| `GET`  | `/api/mobile/users/me/feed` | Merged upcoming events + assigned chores across active enrollments |

### Tenant-Scoped (enrollment-gated)
| Method | Route | Description |
|--------|-------|-------------|
| `GET`  | `/api/mobile/tenants/{id}/events` | Upcoming events for resident's house |
| `POST` | `/api/mobile/tenants/{id}/events/{id}/attend` | Add residentId to attendeeIds |
| `GET`  | `/api/mobile/tenants/{id}/chores` | Chores assigned to this resident |
| `PATCH`| `/api/mobile/tenants/{id}/chores/{id}/status` | Update own chore status (done/in_progress) |
| `GET`  | `/api/mobile/tenants/{id}/rides` | Rides where resident is a passenger |
| `POST` | `/api/mobile/tenants/{id}/rides` | Request a ride |

### AI Chat
| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/ai/chat` | Send message; returns Gemini reply + conversationId |
| `GET`  | `/api/ai/chat/history` | Load conversation messages |

---

## AI Chat Architecture

### System Prompt (assembled server-side per request)
```
[PERSONA]
You are a recovery support guide for High Value Growth...

[USER CONTEXT]
Name: {displayName}
Sobriety: {sobrietyDate} ({X} days)
Goals: {recoveryGoals[]}
Program: {tenantName} — Phase {enrollment.phase}

[UPCOMING SCHEDULE — next 7 days]
{ProgramEvent list}

[ASSIGNED CHORES]
{Chore list with due dates}

[CONVERSATION HISTORY — last 20 turns]
{messages from /conversations/{conversationId}/messages}
```

Clinical data (medications, diagnoses, insurance) is **never** included.

### Gemini Function Calling Tools
- `get_upcoming_events(days: int)` — live schedule from Firestore
- `get_chore_status()` — assigned chores + completion
- `get_sobriety_stats()` — days sober, phase, enrollment status
- `log_mood(mood: 1-10, note?: string)` — writes mood check-in to Firestore

### Conversation Persistence
```
/conversations/{conversationId}
  userId: string
  residentId?: string
  tenantId?: string
  lastMessageAt: Date
  createdAt: Date

/conversations/{conversationId}/messages/{messageId}
  role: 'user' | 'model'
  content: string
  timestamp: Date
  toolCalls?: object[]
  toolResults?: object[]
```

---

## Firestore Changes

### New collection: `/users/{uid}`
```
match /users/{uid} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
  allow read: if isSuperAdmin();
}
```

### New collection: `/tenants/{tenantId}/joinRequests/{uid}`
```
match /tenants/{tenantId}/joinRequests/{uid} {
  allow create: if request.auth != null && request.auth.uid == uid
                && request.auth.token.role == 'resident';
  allow read, update, delete: if isSuperAdmin() || isTenantAdmin(tenantId);
}
```

### Fix `/conversations` CREATE bug
Current rule uses `resource.data.userId` (null on create). Fix:
```
match /conversations/{conversationId} {
  allow create: if request.auth != null
                && request.resource.data.userId == request.auth.uid;
  allow read, update: if request.auth != null
                      && resource.data.userId == request.auth.uid;
  match /messages/{messageId} {
    allow read, create: if request.auth != null
      && get(/databases/$(database)/documents/conversations/$(conversationId)).data.userId
         == request.auth.uid;
  }
}
```

### Resident self-read
```
// Inside existing match /residents/{residentId}
allow read: if isAuthenticated() && (
  isTenantMember(tenantId) ||
  (request.auth.token.role == 'resident'
   && resource.data.firebaseUid == request.auth.uid)
);
```

### New Firestore index
Collection group query on `enrollments` where `residentId == X`:
```json
// firestore.indexes.json
{
  "collectionGroup": "enrollments",
  "queryScope": "COLLECTION_GROUP",
  "fields": [
    { "fieldPath": "residentId", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" }
  ]
}
```

---

## Web Dashboard Additions (Phase 4 web side)

Two small additions to the existing web dashboard:

1. **Link resident to app user** — button on Resident detail page (`/residents/{id}`) that sets `firebaseUid` field. Staff enters the user's email; server looks up Firebase Auth user by email and sets the link.

2. **Join requests inbox** — new section in staff/admin dashboard showing pending `joinRequests` with Approve / Deny actions. Approving creates an `Enrollment` record.

---

## What's Deferred to Phase 5

- **LMS / Courses** — `/tenants/{tenantId}/courses/{courseId}/modules/{moduleId}` data model and both web builder UI and mobile consumption
- **Push notifications** — `expo-notifications` + FCM setup
- **Mood tracking dashboard** — charts for staff showing resident mood trends over time

---

## Implementation Phases

Phase 4 breaks into two sequential sub-phases:

**Phase 4A — Backend foundation (no mobile yet):**
1. `/shared/types/` — extract shared interfaces
2. `Resident` model: add `firebaseUid` field
3. `/users/{uid}` — Firestore collection + service + API routes
4. `residentAuthMiddleware` — enrollment-based auth helper
5. All `/api/mobile/` routes
6. `/api/ai/chat` — Gemini 2.5 Flash integration
7. Firestore rules + indexes update
8. Web dashboard: link resident to user + join requests inbox

**Phase 4B — Mobile app:**
1. Expo project scaffold in `/mobile`
2. Auth screens (login, register)
3. Tab layout: Home feed, AI Chat, Schedule, Profile
4. Tenant discovery + join request flow
5. Tenant-scoped screens: events, chores, rides
6. AI chat UI (react-native-gifted-chat)
7. Sobriety tracker on profile screen

---

## Critical Files

**To modify:**
- `features/residents/types/resident.types.ts` — add `firebaseUid?: string | null`
- `firestore.rules` — 4 additions above
- `firestore.indexes.json` — add collection group enrollment index
- `app/api/auth/custom-claims/route.ts` — handle resident role (no tenant_id)
- `lib/middleware/authMiddleware.ts` — pattern to extend for `residentAuthMiddleware`

**To create:**
- `shared/types/` — shared TypeScript interfaces
- `features/appUser/` — `/users/{uid}` types, service, hooks
- `lib/middleware/residentAuthMiddleware.ts` — enrollment-based tenant access
- `app/api/mobile/` — all mobile API routes
- `app/api/ai/` — Gemini chat routes
- `mobile/` — entire Expo app directory
