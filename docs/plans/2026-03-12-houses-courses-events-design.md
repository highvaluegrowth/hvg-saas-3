# Design: Houses Visibility, Course Persistence & Mobile Access, Event Visibility & Recurrence

**Date:** 2026-03-12
**Status:** Approved

---

## Problems Being Solved

1. Houses not visible to mobile app users browsing tenants
2. LMS course builder: lesson content silently lost on save (lessons not persisted to Firestore until individually opened in editor)
3. Mobile app users (residents + solo users) cannot view, enroll in, or complete Courses
4. Events have no visibility control (public vs tenant-only vs house-only) and no recurrence

---

## Data Model Changes

### Events — add `visibility` and `recurrence`

```ts
// Additions to ProgramEvent
visibility: 'universal' | 'tenant' | 'house'  // default: 'tenant'
houseId?: string                                // required when visibility = 'house'
recurrence?: {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom'
  days?: ('mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun')[]  // custom only
  endType: 'never' | 'after' | 'on_date'
  endAfter?: number    // N occurrences
  endDate?: string     // ISO date string
}
```

- Existing events with no `visibility` field default to `'tenant'` behaviour (no migration needed)
- Recurring events stored as single document; occurrences expanded client-side for calendar/list display
- Editing a recurring event: "This occurrence only" or "All future occurrences"

### Courses — rename `isPublic` → `visibility`

```ts
visibility: 'tenant' | 'universal'  // default: 'tenant'
// replaces: isPublic: boolean
```

No new collections. Both changes are field additions to existing Firestore documents.

---

## Fix 1: LMS Lesson Persistence

**Root cause:** `PUT /api/tenants/{tenantId}/lms/courses/{courseId}/curriculum` saves the curriculum array (module names + lesson order) to the course document but never creates individual lesson documents in Firestore. Lessons only get a Firestore document when the user opens and saves each lesson individually in the lesson editor.

**Fix:** In the curriculum route, after calling `courseService.saveCurriculum()`, loop through every lesson in every module and call `lessonService.upsert()` with a stub:
```ts
{ id, courseId, tenantId, title, type, order }
```
The upsert must **not overwrite existing content** — use `{ merge: true }` / set only metadata fields if the document already exists.

**Scope:** One file change — `app/api/tenants/[tenantId]/lms/courses/[courseId]/curriculum/route.ts`

---

## Fix 2: Houses Visible to App Users

**Root cause:** No top-level house listing exists in the app. Users must navigate Tenant → Detail → Houses. The new `/api/mobile/tenants/[tenantId]/houses` route works but isn't surfaced prominently. The `pete.oleary@icloud.com` account has no `tenant_id` claim so tenant-scoped calls may fail silently.

**Fix — two parts:**

**Part A — Explore tab "Houses" category**
When "Houses" pill is selected → fetch `GET /api/mobile/houses` (new endpoint, no tenant scope) → returns all houses across all tenants with `tenantName` attached. Each card shows: house name, city/state, tenant name, "Apply for a Bed" CTA.

**Part B — Home tab "My Houses" section**
If logged-in user has an active enrollment → show their tenant's houses at top of Home tab via `tenantApi.getHouses(tenantId)`. Only shown when `enrollmentTenantId` is available on the user profile.

The existing tenant detail page houses list stays as-is.

---

## Feature 1: Courses — Full Mobile Access

**Visibility filtering:**
- `'tenant'` courses → only returned to users enrolled in that tenant
- `'universal'` courses → returned to any logged-in user

**New endpoint:** `GET /api/mobile/courses` — returns all `universal` courses across all tenants (no tenant scope). Used in Explore "Courses" category.

**Enrollment:**
- `POST /api/mobile/tenants/{tenantId}/courses/{courseId}/enroll`
- Writes to `/users/{userId}/courseEnrollments/{courseId}`
- Enrolled courses appear in LMS tab

**Lesson completion:**
- `POST /api/mobile/tenants/{tenantId}/courses/{courseId}/lessons/{lessonId}/complete`
- Progress stored per-user, shown as progress bar on course detail

**Course completion:**
- When all lessons marked complete → course marked done
- Shown with completion badge in LMS tab

**Web — add visibility selector to course create/edit form:**
- Toggle: "Tenant Only (default)" / "Universal Access (Public)"

---

## Feature 2: Events — Visibility + Recurrence

### Web Dashboard Changes

**Visibility selector** on event create/edit form:
- `Universal Access` — any logged-in app user
- `Tenant Only` *(default)* — residents of any of this tenant's houses
- `House Only` — residents of one specific house → shows house picker dropdown

**Recurrence control** on event create/edit form:
- "Repeats" toggle (off by default)
- When on: frequency dropdown (Daily / Weekly / Bi-weekly / Monthly)
- "Advanced" toggle reveals:
  - Day-of-week checkboxes (Mon–Sun)
  - End condition: Never / After N occurrences / On date

**Edit recurring event prompt:** "Edit this occurrence only" or "Edit all future occurrences"

### API Changes

**`GET /api/mobile/tenants/{tenantId}/events`** — filter by requesting user's access:
- Always return `universal` events
- Return `tenant` events if user enrolled in this tenant
- Return `house` events only if user's `houseId` matches event's `houseId`

**New endpoint:** `GET /api/mobile/events` — returns only `universal` events across all tenants. Used in Explore "Events" category.

### Explore Tab

When "Events" category pill selected → shows universal events from all tenants. Card shows: title, date, tenant name, "Attend" button.

---

## Implementation Order

1. **Fix: LMS curriculum route** — lesson stubs created on structure save
2. **Fix: Houses listing** — `GET /api/mobile/houses` endpoint + Explore "Houses" category + Home "My Houses" section
3. **Course visibility** — add `visibility` field, update course create/edit form, filter in mobile API
4. **Course mobile access** — enroll endpoint, completion endpoint, wire LMS tab screens
5. **Event visibility** — add `visibility` + `houseId` fields, update create/edit form, filter in mobile API
6. **Event recurrence** — add `recurrence` field, update create/edit form, expand occurrences client-side
7. **Explore tab** — wire "Events" and "Courses" category pills to new endpoints

---

## Files Affected (estimated)

| File | Change |
|------|--------|
| `app/api/tenants/[tenantId]/lms/courses/[courseId]/curriculum/route.ts` | Create lesson stubs on save |
| `app/api/mobile/houses/route.ts` | New — all houses across tenants |
| `app/api/mobile/events/route.ts` | New — universal events across tenants |
| `app/api/mobile/courses/route.ts` | New — universal courses across tenants |
| `app/api/mobile/tenants/[tenantId]/courses/[courseId]/enroll/route.ts` | New |
| `app/api/mobile/tenants/[tenantId]/courses/[courseId]/lessons/[lessonId]/complete/route.ts` | New |
| `features/events/types/event.types.ts` | Add visibility, houseId, recurrence |
| `features/events/schemas/event.schemas.ts` | Add new fields to schema |
| `features/lms/services/courseService.ts` | Rename isPublic → visibility |
| `app/(dashboard)/[tenantId]/events/new/page.tsx` | Add visibility + recurrence UI |
| `app/(dashboard)/[tenantId]/events/[eventId]/page.tsx` | Show visibility + recurrence |
| `app/(dashboard)/[tenantId]/lms/courses/new/page.tsx` | Add visibility selector |
| `mobile/app/(tabs)/explore.tsx` | Wire Events + Courses + Houses category pills |
| `mobile/app/(tabs)/index.tsx` | Add "My Houses" section |
| `mobile/app/(tabs)/lms/[courseId].tsx` | Enroll button + progress bar |
| `mobile/app/(tabs)/lms/[courseId]/[lessonId].tsx` | Mark Complete button |
| `mobile/lib/api/routes.ts` | Add new API methods |
