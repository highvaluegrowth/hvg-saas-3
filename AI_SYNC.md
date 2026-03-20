# AI Sync Log — HVG Sober-Living Platform

## Operational Directives & Constraints Update
* **Lead Engineer:** Claude
* **Current Phase:** Master Plan - Sweep 8, Phase 8.1 (Resident Routing & Security)
* **CRITICAL RULE:** Claude is strictly forbidden from running `git` commands. Pure code manipulation only.
* **DESIGN CONSTRAINT:** The primary color Amber (#F59E0B) is strictly forbidden across the entire platform. Rely on Cyan, Blue, and Slate to match the new global theming.

---

## Sweep 8, Phase 8.1: Resident Routing & Middleware (The "Wall")
**Target:** Next.js Routing (`app/(resident)`), Middleware/Auth Guards (`proxy.ts` or `middleware.ts`).

### Architectural Diagnosis:
We are beginning the Resident Portal. The platform must physically and logically wall off users with a `role: 'resident'` claim so they cannot access the operational Kanban board or SuperAdmin views. 

### Action Plan for Claude:

1. **Build the Route Group & Layout:**
   - Create the directory structure: `app/(resident)/[tenantId]/`.
   - Create `layout.tsx` inside `[tenantId]`. This layout should **not** include the main dashboard sidebar. It should be a clean, mobile-first container: `max-w-md mx-auto relative min-h-screen pb-20 bg-[#060E1A]` (or similar dark slate).
   - Create a basic placeholder `page.tsx` for the Resident Dashboard with a simple "Resident Home" header.

2. **Enforce the Middleware/Guard Wall:**
   - Open the routing guard (e.g., `middleware.ts`, `proxy.ts`, or the AuthProvider).
   - **The Resident Trap:** If the user's token has `role: 'resident'` AND they attempt to access `/(dashboard)/*` or `/(superadmin)/*` (or any path that isn't `/(resident)/*`), forcefully redirect them to `/[tenantId]`. *(Note: Ensure the resident root cleanly resolves to their specific view).*
   - **Staff Bypass:** Ensure users with `role: 'staff'`, `role: 'tenant_admin'`, or `role: 'super_admin'` CAN access the resident routes. Staff need to preview the UI or help residents on their own devices.
   - **Operator Redirect:** Ensure the routing correctly directs Staff/Admins to `/[tenantId]/operations` or their respective dashboard upon login, while Residents go strictly to their portal.

### Claude's Execution Report:
* **Route Group Created:** ✅ `app/(resident)/[tenantId]/portal/layout.tsx` — mobile-first container (`max-w-md mx-auto pb-20 bg-[#060E1A]`), auth guard allows residents + staff preview, redirects unauthenticated to `/login`. `app/(resident)/[tenantId]/portal/page.tsx` — resident home with welcome header and 4 placeholder nav cards (Outlet AI, Courses, Applications, Events). Color scheme: Cyan + Indigo only (no Amber).
* **Middleware Enforced:** ✅ Two-layer wall:
  1. `proxy.ts` — if `role === 'resident'`, redirects any non-`/{tenantId}/portal` path back to `/{tenantId}/portal`. Staff/admin bypass the resident trap entirely and fall through to the operator tenant-mismatch check.
  2. `app/(dashboard)/[tenantId]/layout.tsx` — client-side guard: if `user.role === 'resident'`, immediately redirects to `/{residentTenantId}/portal` before rendering any operator UI.
* **URL path:** `/{tenantId}/portal` (sub-path avoids route conflict with `(dashboard)/[tenantId]/*`)
* **Status:** "Phase 8.1 Complete. The Resident Wall is up. Ready for Phase 8.2 (Mobile Nav)."