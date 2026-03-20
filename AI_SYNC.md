# AI Sync Log — HVG Sober-Living Platform

## Operational Directives & Constraints Update
* **Lead Engineer:** Claude
* **Current Phase:** Master Plan - Sweep 8, Phase 8.3 (Resident Dashboard & Chores)
* **CRITICAL RULE:** Claude is strictly forbidden from running `git` commands. Pure code manipulation only.
* **DESIGN CONSTRAINT:** The primary color Amber (#F59E0B) is strictly forbidden. Rely exclusively on Cyan (#06b6d4), Emerald (#10b981) for success, and Dark Slate.

---

## Sweep 8, Phase 8.3: Resident Dashboard & Chores (Data Wiring)
**Target:** Resident Home (`portal/page.tsx`), Chores View (`portal/chores/page.tsx`), and Data Hooks.

### Action Plan for Claude:

1. **Data Siloing (The "My Stuff" Principle):**
   - We must fetch chores strictly for the logged-in resident.
   - Implement or update a data fetching hook/service for the resident portal.
   - Query definition: `query(collection(db, 'tenants', tenantId, 'chores'), where('assigneeId', '==', currentUser.uid))`

2. **Build the Resident Dashboard (`portal/page.tsx`):**
   - Replace the placeholder cards.
   - Create a welcoming header: "Hello, [User's First Name]".
   - Display a "Today's Focus" summary: Show the next 2-3 pending chores assigned to the user.
   - Add a quick-access card to open the Outlet AI (acts as a secondary trigger alongside the bottom nav).

3. **Build the "My Chores" View (`portal/chores/page.tsx`):**
   - Create this new page component.
   - Render a list of all chores assigned to the resident, separated by status (Pending vs. Completed).
   - **Actionable Component:** Build an `ActionableChoreCard`. It needs to be touch-friendly. Provide a clear "Mark Complete" button. 
   - **Completion Mutation:** When clicked, update the Firestore document's status to `completed` (or equivalent).
   - **UX Polish:** When a chore is completed, show a brief Emerald-themed success state (e.g., a checkmark animation or a toast) before moving it to the completed list.

### Claude's Execution Report (Fill this out when done):
* **Data Siloed:** ✅ `useMyChores` queries with `where('assigneeIds', 'array-contains', uid)` — scoped to logged-in resident only
* **Dashboard Built:** ✅ `portal/page.tsx` — "Hello, [FirstName]" header, "Today's Focus" shows up to 3 pending chores, Outlet AI card, Quick Access grid
* **Chores View Built:** ✅ `portal/chores/page.tsx` — Pending/Completed sections, `ActionableChoreCard` with emerald "Mark Complete" button + spinner + bounce success state, `completeChore` updates Firestore `status: 'done'`
* **Status:** "Phase 8.3 Complete. The Resident Portal is fully functional."