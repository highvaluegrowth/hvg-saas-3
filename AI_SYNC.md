# AI Sync Log — HVG Sober-Living Platform

## Operational Directives & Constraints Update
* **Lead Engineer:** Claude
* **Current Phase:** Master Plan - Sweep 8, Phase 8.2 (Mobile Nav & UI Shell)
* **CRITICAL RULE:** Claude is strictly forbidden from running `git` commands. Pure code manipulation only.
* **DESIGN CONSTRAINT:** The primary color Amber (#F59E0B) is strictly forbidden. Rely exclusively on Cyan, Blue, and Dark Slate (#060E1A, #0f172a).

---

## Sweep 8, Phase 8.2: Mobile Layout & Nav (UI Shell)
**Target:** Resident Mobile Navigation and Comms Drawer Integration.

### Action Plan for Claude:

1. **Mount the Universal Comms Drawer:**
   - Open `app/(resident)/[tenantId]/portal/layout.tsx`.
   - Ensure `GlobalDrawerContainer` (or your Sweep 6 drawer component) is imported and mounted inside this layout so the resident can actually see the drawer when it opens. 

2. **Build `MobileBottomNav.tsx`:**
   - Create a new component for the resident navigation (e.g., `components/resident/MobileBottomNav.tsx`).
   - **Styling:** It must be fixed to the bottom, constrained to `max-w-md mx-auto` to match the layout, and use a heavy glassmorphic effect (e.g., `fixed bottom-0 w-full max-w-md backdrop-blur-md bg-slate-950/80 border-t border-white/10 z-40`).
   - **Nav Items:** Include 4 touch-friendly icons arranged via flexbox (`justify-around py-3`):
     - **Home** (links to `/[tenantId]/portal`)
     - **Chores** (links to `/[tenantId]/portal/chores`)
     - **Outlet (AI)** (Action button, NOT a link)
     - **Profile** (links to `/[tenantId]/portal/profile` or settings)

3. **Wire the "Outlet" AI Button:**
   - Import `useChatStore` into the `MobileBottomNav`.
   - Bind the Outlet icon's `onClick` handler to strictly execute:
     ```javascript
     useChatStore.getState().openDrawer();
     useChatStore.getState().setActiveConversation('__new_outlet__');
     ```
   - *UX Polish:* Give the Outlet button a distinct styling (e.g., a cyan gradient background or glowing icon) to make it the primary focal point of the nav bar.

### Claude's Execution Report:
* **Drawer Mounted:** ✅ `GlobalDrawerContainer` imported into `app/(resident)/[tenantId]/portal/layout.tsx` with `currentUserId={user.uid}`. Renders outside the max-w-md shell so the drawer slides in full-height as intended.
* **Bottom Nav Built:** ✅ `components/resident/MobileBottomNav.tsx` — glassmorphic (`bg-[#060E1A]/85 backdrop-blur-xl border-t border-white/8`), fixed bottom, `max-w-md mx-auto` centered via `left:50% + translateX(-50%)`. 4 items: Home, Chores, Outlet (action), Profile. Active state highlights in cyan. iOS safe-area inset handled.
* **Outlet Wired:** ✅ Outlet button calls `setVoiceMode(false) → setActiveConversation('__new_outlet__') → openDrawer()`. Styled as a raised cyan-gradient square button (-mt-5 lift) with glow shadow to make it the primary focal point.
* **Status:** "Phase 8.2 Complete. Mobile shell is live and AI is accessible. Ready for Phase 8.3."