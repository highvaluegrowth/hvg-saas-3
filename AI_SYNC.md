# AI Sync Log — HVG Sober-Living Platform

## Operational Directives & Constraints Update
* **Lead Architect:** Gemini
* **Lead Engineer:** Claude
* **Current Phase:** Master Plan - Sweep 7, Phase 7.3 (Polymorphic Cards & DB Mutations)
* **CRITICAL RULE:** Claude is strictly forbidden from running `git` commands. Pure code manipulation only.

---

## Sweep 7, Phase 7.3: Polymorphic Cards & Mutations
**Target:** `/features/kanban/utils/mapping.ts`, `/features/kanban/components/PolymorphicCard.tsx`, specific card components (`ApplicationCard`, `ChoreCard`), and updating `OperationsBoard.tsx`.

### Architectural Diagnosis:
The drag-and-drop shell is fluid and optimistic. We must now render type-specific data on the cards and route the drop events to the correct Firestore mutation using reverse-mapping.

### Action Plan for Claude:

1. **Build the Reverse Mapping Utility (`/features/kanban/utils/mapping.ts`):**
   - Export a `mapColumnIdToNativeStatus(type: BoardItemType, columnId: BoardColumnId): string | null` function.
   - For `chore`: `action_required` -> `pending`, `in_progress` -> `in_progress`, `resolved` -> `completed`.
   - For `application`: `action_required` -> `pending_triage`, `in_progress` -> `waitlisted`. (If dropped in `resolved`, return `null` or a flag indicating it requires the Resolution Modal).

2. **Build the Polymorphic Cards (`/features/kanban/components/`):**
   - Create `ApplicationCard.tsx`: Display applicant name and basic info. Add an `onClick` handler that calls `useChatStore` to open the global drawer and set the active conversation to this application's thread (integrating Sweep 6).
   - Create `ChoreCard.tsx`: Display task name, assigned resident, and due date.
   - Create `PolymorphicCard.tsx`: A wrapper that takes a `BoardItem` and conditionally renders the correct specific card based on `item.type`. Update `BoardColumn.tsx` to use this instead of the Placeholder.

3. **Wire the Mutations (`OperationsBoard.tsx`):**
   - Import your Firestore update services (e.g., `updateChoreStatus`, `updateApplicationStatus`).
   - Inside `onDragEnd`, after the optimistic UI update, calculate the new native status using the reverse mapping utility.
   - Route the mutation: 
     - If `chore`, await `updateChoreStatus(item.id, newStatus)`.
     - If `application` and dropped in `resolved`, trigger a simple local modal state (`isResolveModalOpen`) asking the user to choose "Admit" or "Reject", then fire the mutation. Otherwise, fire `updateApplicationStatus(item.id, newStatus)`.
   - If the backend mutation fails, revert the optimistic UI update.

### Claude's Execution Report ✅

* **Reverse Mapping:** `features/kanban/utils/mapping.ts` — `mapColumnIdToNativeStatus(type, columnId): string | null` added:
  - **Chore**: `action_required` → `'pending'`; `in_progress` → `'in_progress'`; `resolved` → `'completed'`
  - **Application**: `action_required` → `null` (can't PATCH back to `pending_triage` via tenant API — UI reverts); `in_progress` → `'waitlisted'`; `resolved` → `null` (triggers Resolution Modal)
  - **Task**: `todo` / `doing` / `done` as expected; unrecognised → `null`

* **Polymorphic Cards:** Four new files created under `features/kanban/components/`:
  - **`ApplicationCard.tsx`**: Shows type badge (Bed/Staff/Tenant/…), applicant name, email, status + date footer. If `rawData.threadId` is present, renders a chat-bubble icon button — `onClick` calls `setActiveConversation(threadId); openDrawer()` from `useChatStore` (Sweep 6 integration). `stopPropagation` prevents the drag listener from firing on button click.
  - **`ChoreCard.tsx`**: Shows priority badge (rose/amber/slate), title, description (line-clamp-2), assignee count, status + due date footer.
  - **`PolymorphicCard.tsx`**: Owns `useSortable` (attributes + listeners + CSS.Translate). Conditionally renders `ApplicationCard`, `ChoreCard`, or a minimal task fallback. `BoardColumn.tsx` updated to import and use `PolymorphicCard` instead of the removed `PlaceholderCard`.

* **Mutations Wired:** `OperationsBoard.tsx` fully updated:
  - Two module-level async helpers: `patchChoreStatus(tenantId, choreId, status)` → `PATCH /api/tenants/${tenantId}/chores/${choreId}`; `patchApplicationStatus(tenantId, appId, status)` → `PATCH /api/tenants/${tenantId}/applications`.
  - `prevItemsRef` captures a pre-drop snapshot for rollback.
  - `onDragEnd` flow: (1) optimistic update → (2) `mapColumnIdToNativeStatus` → (3) if application + resolved → open Resolution Modal; if null → revert; else fire mutation in background IIFE → revert on catch.
  - **Resolution Modal**: `resolveModal` state holds the pending item + snapshot. "Admit" → `patchApplicationStatus(…, 'accepted')`; "Reject" → `patchApplicationStatus(…, 'rejected')`; Cancel → revert optimistic update. Per-button loading spinners via `resolveLoading` state.

* **Files Created/Modified:**
  - `features/kanban/utils/mapping.ts` (modified — reverse mapping added)
  - `features/kanban/components/ApplicationCard.tsx` (created)
  - `features/kanban/components/ChoreCard.tsx` (created)
  - `features/kanban/components/PolymorphicCard.tsx` (created)
  - `features/kanban/components/BoardColumn.tsx` (modified — PlaceholderCard removed, PolymorphicCard imported)
  - `features/kanban/components/OperationsBoard.tsx` (modified — mutations + modal)
* **TypeScript:** `npx tsc --noEmit` — zero errors.
* **Status:** "Sweep 7 Complete. Ready for Final Go-Live Review."