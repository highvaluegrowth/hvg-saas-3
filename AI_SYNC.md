# AI Sync Log — HVG Sober-Living Platform

## Operational Directives & Constraints Update
* **Lead Engineer:** Claude
* **Current Phase:** SuperAdmin UI Consolidation & Theming
* **CRITICAL RULE:** Claude is strictly forbidden from running `git` commands. Pure code manipulation only.

---

## Task: Unify the SuperAdmin Experience
The user is experiencing a "Frankenstein" UI. Clicking SuperAdmin links in the new dashboard transports them to a legacy layout with a fuchsia/purple theme and a conflicting sidebar. We must unify everything under the new cyan/blue dashboard layout.

**Action Plan for Claude:**
1. **Consolidate Navigation (`/lib/constants/navigation.ts` or `Sidebar.tsx`):**
   - Update the `PLATFORM ADMIN` (SuperAdmin) navigation array in the new sidebar to include the complete definitive list: Platform Command Center, Tenants, QA Feedback, Courses, Events, Financials, Reporting, and System Health.
   - Ensure these links point to the correct routes (e.g., `/[tenantId]/admin/tenants`).
2. **Wire the Logo:**
   - Locate the main HVG logo component (likely at the top of `Sidebar.tsx` or `Navbar.tsx`).
   - Wrap it in a Next.js `<Link>` pointing to the Platform Command Center route (e.g., `/[tenantId]/admin` or `/[tenantId]/command-center`).
3. **Destroy the Legacy Layout:**
   - Search for the legacy SuperAdmin layout file (e.g., `app/(superadmin)/layout.tsx`, or a legacy sidebar component like `SuperAdminSidebar.tsx`).
   - If the `/admin` routes are isolated in a different route group, move them INTO `app/(dashboard)/[tenantId]/admin/` so they inherit the new global layout, the Zustand drawer, and the unified sidebar.
   - Delete the legacy fuchsia sidebar component.
4. **Update the Theme (Fuchsia -> Cyan):**
   - Scan the page files inside the `/admin` directories.
   - Run a targeted replacement of Tailwind color classes: change `fuchsia` and `purple` (and `magenta` if used) to `cyan` and `blue` to match the new global theme.

### Claude's Execution Report:
* **Navigation Consolidated:** [Confirm the definitive list of links is in the new sidebar]
* **Logo Wired:** [Confirm the logo links to the Command Center]
* **Layouts Merged:** [Confirm legacy layouts were deleted and admin pages use the new shell]
* **Theme Updated:** [Confirm fuchsia/purple was replaced with cyan/blue]
* **Status:** "SuperAdmin Frankenstein UI resolved. Unified cyan dashboard is live."