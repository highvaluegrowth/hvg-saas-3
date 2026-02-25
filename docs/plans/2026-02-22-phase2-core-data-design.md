# Phase 2: Core Data Models & Management UI — Design

**Date:** 2026-02-22
**Status:** Draft
**Scope:** Full data schema, repositories, API routes, and CRUD UI for Houses, Residents, Staff, and real-time Dashboard

---

## Context

Phase 1 established auth, multi-tenancy, RBAC, the dashboard shell, and a generic Firestore BaseRepository. The dashboard currently shows placeholder zeros. Phase 2 builds the actual business logic: the data models for a recovery house management platform and the UI to manage them.

Users (tenant admins, staff) need to:
- Manage sober-living houses with rooms and beds
- Track residents through their full recovery journey (clinical-grade detail)
- Manage staff schedules and house assignments
- View a live dashboard with real counts and recent activity

---

## Architecture

**Approach: Thin vertical slices** — build each entity end-to-end (types → repository → API → UI) before moving to the next. Order: Houses → Residents → Staff → Dashboard wiring.

**Data layer:** Server-side only via Admin SDK through Next.js API routes (same pattern as `tenantService.ts`). Client uses `fetch` to API routes, not direct Firestore SDK calls (keeps security rules simple, avoids client bundle bloat).

**Real-time:** Use Firestore client SDK `onSnapshot` listeners in React hooks for dashboard counts and list pages (not the Admin SDK — client SDK only for real-time).

**Validation:** Zod schemas shared between API route validation and client-side form validation. Define in `features/{feature}/schemas/`.

**State:** No global state library. React hooks + local state + Firestore listeners. `useHouses`, `useResidents`, `useStaff` hooks per feature.

---

## Firestore Schema

### Houses — `/tenants/{tenantId}/houses/{houseId}`

```typescript
interface House {
  id: string
  name: string
  address: {
    street: string
    city: string
    state: string
    zip: string
  }
  phone?: string
  capacity: number        // total beds across all rooms
  managerId: string | null // staff uid who manages this house
  status: 'active' | 'inactive'
  createdAt: Date
  updatedAt: Date
}
```

### Rooms — `/tenants/{tenantId}/houses/{houseId}/rooms/{roomId}`

```typescript
interface Room {
  id: string
  name: string            // e.g. "Room 1A"
  capacity: number        // number of beds in this room
  createdAt: Date
  updatedAt: Date
}
```

### Beds — `/tenants/{tenantId}/houses/{houseId}/rooms/{roomId}/beds/{bedId}`

```typescript
interface Bed {
  id: string
  label: string           // e.g. "Bed A", "Top Bunk"
  status: 'available' | 'occupied' | 'reserved' | 'unavailable'
  residentId: string | null
  createdAt: Date
  updatedAt: Date
}
```

### Residents — `/tenants/{tenantId}/residents/{residentId}`

```typescript
interface Resident {
  id: string
  // Identity
  firstName: string
  lastName: string
  dateOfBirth: Date
  gender: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say'
  email: string
  phone: string
  photoUrl?: string

  // Status & placement
  status: 'waitlist' | 'active' | 'graduated' | 'discharged'
  phase: 1 | 2 | 3 | 4
  houseId: string | null
  roomId: string | null
  bedId: string | null
  moveInDate: Date | null
  moveOutDate: Date | null
  dischargeReason?: 'graduated' | 'voluntary' | 'rule_violation' | 'relapse' | 'other'

  // Recovery
  sobrietyStartDate: Date | null
  primarySubstance: string
  secondarySubstances: string[]
  treatmentHistory: string    // free text for now

  // Vitals
  height?: string             // e.g. "5'10\""
  weight?: string             // e.g. "175 lbs"
  bloodType?: string
  allergies: string[]
  medications: Medication[]

  // Clinical
  diagnosisCodes: string[]    // ICD-10 codes
  physician?: {
    name: string
    phone: string
    clinic: string
  }
  insurance?: {
    provider: string
    memberId: string
    groupNumber?: string
  }

  // Employment
  employer?: string
  jobTitle?: string
  workSchedule?: string       // free text description
  workPhone?: string

  // Emergency contact
  emergencyContact: {
    name: string
    phone: string
    relationship: string
  }

  notes: string
  createdAt: Date
  updatedAt: Date
}

interface Medication {
  name: string
  dosage: string
  frequency: string
  prescribedBy?: string
}
```

### Resident Events (subcollection) — `/tenants/{tenantId}/residents/{residentId}/events/{eventId}`

```typescript
interface ResidentEvent {
  id: string
  type: 'appointment' | 'meeting' | 'class' | 'drug_test' | 'check_in' | 'note'
  title: string
  description?: string
  scheduledAt: Date
  completedAt?: Date
  status: 'scheduled' | 'completed' | 'missed' | 'cancelled'
  createdBy: string     // staff uid
  createdAt: Date
  updatedAt: Date
}
```

### Shared Program Events — `/tenants/{tenantId}/events/{eventId}`

```typescript
interface ProgramEvent {
  id: string
  title: string
  description?: string
  type: 'group_meeting' | 'class' | 'course' | 'house_meeting' | 'outing' | 'other'
  houseIds: string[]    // which houses this event applies to (empty = all)
  scheduledAt: Date
  duration: number      // minutes
  location?: string
  facilitator?: string  // staff uid or name
  recurrence?: {
    pattern: 'daily' | 'weekly' | 'monthly'
    daysOfWeek?: number[]
    endsAt?: Date
  }
  attendeeIds: string[] // resident uids who attended/are enrolled
  createdBy: string
  createdAt: Date
  updatedAt: Date
}
```

### Staff — `/tenants/{tenantId}/staff/{staffId}`

```typescript
interface Staff {
  id: string
  userId: string        // Firebase Auth uid
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: 'house_manager' | 'staff' | 'staff_admin'
  houseIds: string[]    // assigned houses
  status: 'active' | 'inactive'

  // Schedule
  schedule?: {
    monday?: ShiftTime
    tuesday?: ShiftTime
    wednesday?: ShiftTime
    thursday?: ShiftTime
    friday?: ShiftTime
    saturday?: ShiftTime
    sunday?: ShiftTime
  }
  createdAt: Date
  updatedAt: Date
}

interface ShiftTime {
  start: string   // "08:00"
  end: string     // "16:00"
}
```

---

## Feature Structure

Following existing feature-driven pattern from `features/auth/` and `features/tenant/`:

```
features/
  houses/
    types/house.types.ts
    schemas/house.schemas.ts      (Zod)
    services/houseService.ts      (extends BaseRepository, server-side)
    hooks/useHouses.ts            (client-side Firestore listeners)
  residents/
    types/resident.types.ts
    schemas/resident.schemas.ts
    services/residentService.ts
    hooks/useResidents.ts
  staff/
    types/staff.types.ts
    schemas/staff.schemas.ts
    services/staffService.ts
    hooks/useStaff.ts
  events/
    types/event.types.ts
    schemas/event.schemas.ts
    services/eventService.ts
    hooks/useEvents.ts
```

---

## API Routes

All routes under `/app/api/tenants/[tenantId]/`:

```
/houses
  GET    → list houses (with occupancy)
  POST   → create house

/houses/[houseId]
  GET    → get house detail
  PATCH  → update house
  DELETE → delete house

/houses/[houseId]/rooms
  GET    → list rooms
  POST   → create room

/houses/[houseId]/rooms/[roomId]
  PATCH  → update room
  DELETE → delete room

/houses/[houseId]/rooms/[roomId]/beds
  GET    → list beds
  POST   → create bed

/houses/[houseId]/rooms/[roomId]/beds/[bedId]
  PATCH  → update bed (assign/unassign resident)

/residents
  GET    → list residents (filter by house, status, phase)
  POST   → create resident

/residents/[residentId]
  GET    → get resident detail
  PATCH  → update resident
  DELETE → soft-delete (set status=discharged)

/residents/[residentId]/events
  GET    → list events
  POST   → create event

/staff
  GET    → list staff
  POST   → create staff member

/staff/[staffId]
  GET    → get staff detail
  PATCH  → update staff
  DELETE → deactivate staff

/events
  GET    → list program events
  POST   → create program event

/events/[eventId]
  PATCH  → update event
  DELETE → delete event
```

---

## Pages (App Router)

All under `app/(dashboard)/[tenantId]/`:

```
houses/
  page.tsx          → House list + create button
  [houseId]/
    page.tsx        → House detail (rooms, beds, residents)
    edit/page.tsx   → Edit house form

residents/
  page.tsx          → Resident list (filters: house, status, phase, search)
  new/page.tsx      → Create resident (multi-step form)
  [residentId]/
    page.tsx        → Resident profile
    edit/page.tsx   → Edit resident

staff/
  page.tsx          → Staff list
  new/page.tsx      → Add staff member
  [staffId]/
    page.tsx        → Staff profile
    edit/page.tsx   → Edit staff member

events/
  page.tsx          → Program events calendar/list
  new/page.tsx      → Create event
  [eventId]/
    page.tsx        → Event detail (attendees)
    edit/page.tsx   → Edit event
```

---

## Client-Side Hooks (Real-Time)

Each hook uses Firestore client SDK `onSnapshot`:

```typescript
// useHouses — real-time house list
// useResidents — real-time resident list (with filter params)
// useStaff — real-time staff list
// useDashboardStats — real-time counts (houses, active residents, staff, events today)
```

Hooks live in `features/{feature}/hooks/`. Pattern: subscribe on mount, unsubscribe on unmount, expose `{ data, loading, error }`.

---

## Dashboard Wiring

Replace placeholder stats in `app/(dashboard)/[tenantId]/page.tsx` with:
- `useDashboardStats` hook for real-time counts
- Recent activity feed (last 5 resident status changes + last 5 events)
- Quick-action buttons: "Add House", "Add Resident", "Add Staff"
- Fetch tenant name from Firestore and pass to layout (fix the `// TODO` in `layout.tsx`)

---

## Firestore Rules Update

Extend `firestore.rules` to add role-based write controls for subcollections:
- `staff` role: can update resident events, read residents/houses
- `staff_admin`: can update residents, create events
- `tenant_admin`: full write access within tenant
- Residents should not be able to write to most collections

---

## Verification

1. Run `firebase emulators:start` and `npm run dev`
2. Create tenant → log in as `tenant_admin`
3. Create a house with rooms and beds via UI
4. Create a resident, assign to house/room/bed
5. Verify bed status updates to `occupied`
6. Create a staff member, assign to house
7. Verify dashboard shows correct real-time counts
8. Verify Firestore security rules block cross-tenant reads in emulator
9. Run Zod validation errors on invalid form inputs

---

## Implementation Order

1. **Types + Schemas** — all TypeScript interfaces and Zod schemas for all entities
2. **Services** — HouseService, ResidentService, StaffService, EventService (extend BaseRepository)
3. **API Routes** — houses, residents, staff, events
4. **Client Hooks** — useHouses, useResidents, useStaff, useDashboardStats (real-time)
5. **Houses UI** — list page, detail page (rooms/beds), create/edit forms
6. **Residents UI** — list page (with filters), profile page, multi-step create form
7. **Staff UI** — list page, profile page, create/edit forms
8. **Events UI** — list/calendar page, create form
9. **Dashboard** — wire real-time stats, activity feed, quick actions, tenant name
10. **Firestore Rules** — update for fine-grained role access
11. **Firestore Indexes** — add composite indexes for filtered queries
