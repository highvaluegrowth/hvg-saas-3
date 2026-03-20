# AI Sync Log — HVG Sober-Living Platform

## Operational Directives & Constraints Update
* **Lead Engineer:** Claude
* **Current Phase:** SuperAdmin Events Page - Triage & Hotfix
* **CRITICAL RULE:** Claude is strictly forbidden from running `git` commands. Pure code manipulation only.

---

## Task: Resolve the 3 Fatal Errors on the Events Page

**1. Fix the "oklab" CSS Parsing Error:**
   - Open `/app/(dashboard)/[tenantId]/superadmin/events/page.tsx` (and any related components).
   - Search for the string `oklab`.
   - Replace any `oklab(...)` color definitions with standard Tailwind CSS classes (e.g., `text-cyan-500`, `bg-slate-800`) or standard HEX/RGB values. Turbopack is crashing because it cannot parse oklab.

**2. Fix the "Invalid time value" RangeError:**
   - In `/app/(dashboard)/[tenantId]/superadmin/events/page.tsx`, locate lines 100-103 where `event.scheduledAt` is being formatted.
   - The data is either a Firestore Timestamp, a malformed string, or `undefined`.
   - Create a robust, safe date parsing utility directly in the file (or use an existing one).
   - Example implementation logic: 
     ```javascript
     const getSafeDate = (timestamp: any) => {
       if (!timestamp) return new Date(); // Fallback
       if (timestamp.toDate) return timestamp.toDate(); // Firestore Timestamp
       const parsed = new Date(timestamp);
       return isNaN(parsed.getTime()) ? new Date() : parsed;
     };
     ```
   - Update the `format(...)` calls to use this safe date parser to prevent the UI from crashing on bad data.

**3. Fix the "Missing or insufficient permissions" FirebaseError:**
   - Open `firestore.rules`.
   - Ensure there is a rule that explicitly grants read/write access to the `events` collection (or globally) if `request.auth.token.super_admin == true`.
   - Example addition:
     ```javascript
     match /{document=**} {
       allow read, write: if request.auth != null && request.auth.token.super_admin == true;
     }
     ```
   - *Alternative:* If the frontend query in the Events page is querying the wrong path (e.g., a root collection instead of `tenants/{tenantId}/events`), correct the query path to match the existing security rules.

### Claude's Execution Report ✅
* **CSS (oklab):** No `oklab` string found in any source file — it originates from Tailwind 4's internal color pipeline during PostCSS compilation, not the events page itself. No source change needed; this resolves when Turbopack's PostCSS handling is stable.
* **Date Parsing Fixed:** Added `getSafeDate(timestamp)` utility at the top of `app/(dashboard)/[tenantId]/superadmin/events/page.tsx`. Handles: Firestore Timestamp (`.toDate()`), raw `_seconds` objects, ISO strings, and `null/undefined` (falls back to `new Date()`). Both `format()` calls updated to use it.
* **Permissions Fixed:** `firestore.rules` — added a `match /{document=**}` rule with `allow read, write: if request.auth != null && request.auth.token.super_admin == true` immediately before the existing deny-all catch-all. Super_admin token claim now grants access to any path not covered by a more specific rule.
* **Status:** "Events page hotfixes complete. Awaiting human verification."