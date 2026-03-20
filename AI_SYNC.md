# AI Sync Log — HVG Sober-Living Platform

## Operational Directives & Constraints Update
* **Lead Engineer:** Claude
* **Current Phase:** Sweep 7.9 — Synchronization & Repair
* **CRITICAL RULE:** Claude is strictly forbidden from running `git` commands. Pure code manipulation only.
* **DESIGN CONSTRAINT:** The primary color Amber (#F59E0B) is strictly forbidden. 

---

## Sweep 7.9: Synchronization & Repair

The codebase has suffered a UI and routing regression. You must execute the following 3 phases to synchronize the codebase with the intended architecture.

### Phase 1: Routing Guard Audit (The Dashboard Flash)
**Target:** `proxy.ts`, `app/(dashboard)/[tenantId]/layout.tsx`, or `app/(dashboard)/[tenantId]/page.tsx`
* **Diagnosis:** An aggressive redirect is catching SuperAdmins attempting to navigate to the root dashboard and forcing them into the `/operations` view.
* **Action:** 1. Audit the routing files and client-side `useEffect` hooks for hardcoded `router.push('/operations')` or redirect logic.
  2. Refactor the logic so that if the user possesses the `role: 'super_admin'` or `super_admin: true` claim, they are strictly permitted to render the root `/[tenantId]` or `/[tenantId]/dashboard` views. 

### Phase 2: Eradicate the Legacy Inbox
**Target:** `components/layout/GlobalNavbar.tsx` (or equivalent top-level Header component).
* **Diagnosis:** The legacy `UnifiedInbox` popover component survived the Sweep 6 purge and is conflicting with the new Universal Comms Hub.
* **Action:**
  1. Open the `GlobalNavbar` and completely delete the `UnifiedInbox` component, its imports, and any local state tied to it.
  2. Replace the legacy inbox icon with a clean Message/Bell icon button. Attach an `onClick` handler that explicitly calls: `useChatStore.getState().openDrawer()`.
  3. Delete the actual legacy `UnifiedInbox.tsx` file from the codebase to prevent future zombie imports.

### Phase 3: Restore AI Triggers in the Drawer
**Target:** The Universal Comms Drawer UI (e.g., `components/chat/ThreadList.tsx` or the drawer header).
* **Diagnosis:** The primary triggers to instantiate a net-new conversation with the "Outlet" AI persona were lost.
* **Action:**
  1. Open the `ThreadList` component (or the drawer's main navigation header). 
  2. **Implement "New Text Chat":** Add a prominent button for "Chat with Outlet". Wire the `onClick` event to call `setActiveConversation('__new_outlet__')` and ensure `setVoiceMode(false)` is set.
  3. **Implement "Voice":** Add a "Voice" or microphone icon button next to it. Wire it to call `setActiveConversation('__new_outlet__')` AND `setVoiceMode(true)` to immediately launch the Outlet Voice interface.

### Claude's Execution Report (Fill this out when done):
* **Routing Fixed:** ✅ Removed the VIP bypass block that was redirecting super_admins to `/operations`. Replaced `!user.tenantId` guard with `!user.tenantId && user.role !== 'super_admin'` — super_admins now fall through to `fetchTenantName()` and can render any dashboard route freely.
* **Legacy Inbox Destroyed:** ✅ `UnifiedInbox.tsx` was already purged from the codebase. `GlobalNavbar.tsx` is clean — inbox icon opens `setFilterType('dms') + openDrawer()`, AI icon opens `setFilterType('outlet') + openDrawer()`. No zombie imports found.
* **AI Triggers Restored:** ✅ `ThreadList.tsx` already had both buttons in the `filterType === 'outlet'` panel: "New Text Chat" (`setVoiceMode(false) + setActiveConversation('__new_outlet__')`) and "Voice" (`setVoiceMode(true) + setActiveConversation('__new_outlet__')`). No changes needed.
* **Status:** "Sweep 7.9 Complete. Codebase is synchronized."