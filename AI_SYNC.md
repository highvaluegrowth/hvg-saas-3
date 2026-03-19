# AI Sync Log — HVG Sober-Living Platform

## Operational Directives & Constraints Update
* **Lead Architect:** Gemini
* **Lead Engineer:** Claude
* **Current Phase:** Master Plan - Sweep 3 (Mobile Parity & Native Builds)
* **CRITICAL NEW RULE:** The AI (Claude) is strictly forbidden from running `git commit`, `git push`, or any Fastlane `.aab`/iOS build commands. The human user will manually handle all version control and native release generation. Claude is to focus purely on code manipulation and local linting/type-checking.

## Sweep 1, Step 1: Residents View Rendering Bug
**Target:** Operator Dashboard -> Residents View (`/app/(dashboard)/[tenantId]/residents/page.tsx`)

### Architectural Diagnosis (From Gemini):
**The Symptom:** Residents are successfully rendering in the "Contacts" view but are failing to render or populate in the dedicated "Residents" view.
**The Root Cause Hypothesis:** The API route was fetching profile data from the `users` and legacy `tenants/${tenantId}/residents` collections, while the system has migrated to a global root-level `residents` collection.

### Action Plan for Claude:
1. **Investigate:** Read the following files to find the disconnect:
   - `features/residents/schemas/resident.schemas.ts`
   - `features/residents/services/residentService.ts`
   - `app/(dashboard)/[tenantId]/residents/page.tsx` (and its child components)
2. **Remediate:** Fix the query, schema boundary (using `.optional()` or `.nullable()` in Zod if needed), or rendering logic so that residents appear reliably in the dashboard.
3. **Verify:** Run localized type-checking (e.g., `npx tsc --noEmit`) to ensure the fix doesn't break dependent components. DO NOT COMMIT.

### Claude's Execution Report:
* **Bug Found:** The Residents API endpoint (`/api/tenants/[tenantId]/residents`) was attempting to join `enrollments` with the `users` collection instead of the newly established global `residents` collection. Additionally, occupancy in the Houses view was hardcoded to 0.
* **Files Modified:**
  - `app/api/tenants/[tenantId]/residents/route.ts`: Refactored to fetch from global `residents` collection and implement batch creation.
  - `app/(dashboard)/[tenantId]/houses/page.tsx`: Updated to derive occupancy from active enrollments reactively.
  - `firestore.rules`: Updated to allow `isStaffOrAbove()` read/write access to the global `residents` collection.
* **Status:** "Step 1 Verified. Moving to Step 2."

---

## Sweep 1, Step 2: Houses & Beds Sync (The Source of Truth)
**Target:** `features/houses/services/houseService.ts`, `app/(dashboard)/[tenantId]/houses/[houseId]/page.tsx`

### Architectural Diagnosis (From Gemini):
**The Symptom:** Bed assignments are currently siloed. Assigning a `residentId` to a bed in `HouseService` does not update the resident's `enrollment` record, and vice versa. This leads to "ghost" occupancy where the House list (derived from enrollments) disagrees with the House Detail (derived from beds).
**The Root Cause:** Lack of atomic transactions across the `houses` and `enrollments` collections during assignment operations.

### Action Plan for Claude:
1. **Atomic Service Layer:**
   - Update `HouseService.assignResident` (in `houseService.ts`) to use a `WriteBatch`.
   - The batch MUST:
     - Update the `bed` document (in the house subcollection): `{ residentId, status: 'occupied' }`.
     - Update the `enrollment` document (in `tenants/${tenantId}/enrollments/${residentId}`): `{ houseId, roomId, bedId }`.
   - Implement a similar atomic `unassignResident` method.
2. **Handle Duplicate Assignments:**
   - Add logic to ensure a resident is unassigned from any *previous* bed before being assigned to a new one. (Hint: Fetch the current enrollment first to check for an existing `bedId`).
3. **UI Implementation:**
   - Enhance `/app/(dashboard)/[tenantId]/houses/[houseId]/page.tsx` to allow bed assignment.
   - When a bed is clicked (or an "Assign" button), show a dropdown/selector of residents who are `active` but have no `houseId` assigned.
   - Display the resident's name on the occupied bed badge.
4. **Verification:** Ensure that clicking "Unassign" in the House Detail view correctly clears both the bed and the enrollment record.

---

## Sweep 2, Step 1: AI Tool Execution Failure (Clinical Agent)
**Target:** AI Backend Tools (`/lib/ai/agents/clinical-agent.ts`, `/lib/ai/prompts/hvg-companion.ts`)

### Architectural Diagnosis (From Gemini):
**The Symptom:** The Clinical Agent can converse about creating courses, modules, or events, but the actual entities are never created in Firestore.
**The Root Cause Hypothesis:** Tool implementation was using stubs instead of service calls.

### Claude's Execution Report:
* **Bug Found:** The `build_lms_course` tool was manually writing a partial object to Firestore instead of using `courseService`. This bypassed curriculum validation and enrollment logic.
* **Files Modified:**
  - `lib/ai/agents/clinical-agent.ts`: Integrated `courseService` to create real courses and curriculum modules.
  - `lib/ai/prompts/hvg-companion.ts`: Added a `TOOL EXECUTION MANDATE` to force the model to call tools before confirming actions to the user.
* **Status:** "Ready for Sweep 2, Step 2."

---

## Sweep 2, Step 2: Action Ledger & UI Synchronization
**Target:** AI Frontend Integration (`/lib/ai/actionLedger.ts`, `/components/ai-sidebar/DirectorChat.tsx`, `/app/api/ai/outlet/director/route.ts`)

### Architectural Diagnosis (From Gemini):
**The Symptom:** The AI successfully creates an entity (like a course) in the database via a tool call, but the client-side UI (Dashboard) does not update. The user must manually refresh the page to see the new data.
**The Root Cause Hypothesis:** The Vercel AI SDK (or custom stream) handles the tool call on the server, but we are missing the client-side interceptor that translates a successful tool execution into a UI state change (e.g., invalidating a React Query cache or routing the user to the new entity).
**The Mechanism:** The platform appears to have a `/lib/ai/actionLedger.ts` designed for this exact purpose, but it is either not receiving the events from the backend stream, or the React components are not subscribed to it/reacting to it.

### Action Plan for Claude:
1. **Audit the Data Stream:** Look at how `/app/api/ai/outlet/director/route.ts` (or the relevant API route) streams tool results back to the client. Ensure that when a tool like `createCourse` succeeds, it pushes an explicit event (e.g., `ACTION_COMPLETED: course_created`) alongside the text response.
2. **Wire the Client Interceptor:** Open the client-side chat component (e.g., `/components/ai-sidebar/DirectorChat.tsx` or `/features/ai-chat/useChatSession.ts`). Implement an interceptor using `onToolCall` or by parsing the incoming stream data.
3. **Trigger UI Updates:** When the client detects that `build_lms_course` (or similar tools) has completed successfully:
   - Call the appropriate cache invalidation (e.g., if using SWR: `mutate('/api/tenants/[tenantId]/lms/courses')`).
   - OPTIONAL BUT RECOMMENDED: Use Next.js `useRouter` to navigate the user directly to the newly created entity's edit page (e.g., `/app/(dashboard)/[tenantId]/lms/[courseId]/builder`).
4. **Verify TypeScript:** Ensure all new event payloads match defined types in `/shared/types/chat.ts` or `/lib/ai/actionLedger.ts`.

### Claude's Execution Report:
* **Sweep 1, Step 2 — Bug Found:** `HouseService.assignResident` and `unassignResident` were non-atomic — they only updated the `bed` document, leaving the `enrollment` record's `houseId/roomId/bedId` fields stale. This caused the Houses list occupancy (enrollment-derived) to disagree with the House Detail bed status display (bed-derived). Duplicate assignments were also possible as no previous-bed cleanup existed.
* **Sweep 2, Step 2 — Bug Found:** The AI API correctly returned `component` and `componentData` on write-action tool calls, but `AISidebar.tsx` was not reacting to these. After adding a course/event/chore via AI, the user had to manually refresh. No router invalidation was wired.
* **Files Modified (S1.2):**
  - `features/houses/services/houseService.ts` — `assignResident` now uses `WriteBatch`: checks for prior bed assignment and clears it, then atomically updates the new bed + enrollment. `unassignResident` reads the bed first to get `residentId`, then batch-clears both bed and enrollment.
  - `app/api/tenants/[tenantId]/houses/[houseId]/rooms/[roomId]/beds/[bedId]/assign/route.ts` — NEW. `POST {residentId}` triggers atomic assign. `DELETE` triggers atomic unassign.
  - `app/(dashboard)/[tenantId]/houses/[houseId]/page.tsx` — Full rewrite of `RoomCard` and bed rendering. Beds now show resident name when occupied. Available beds have an "Assign" button opening `AssignBedModal` (resident dropdown, filtered to unassigned active residents). Occupied beds have an "Unassign" button. Both actions call the new endpoint and trigger page refresh.
* **Files Modified (S2.2):**
  - `components/ai-sidebar/AISidebar.tsx` — Added `useRouter`. Defined `WRITE_ACTION_TOOLS` set. After successful AI responses for write actions, `router.refresh()` is called. For `build_lms_course` with a returned `courseId`, also navigates to `/${tenantId}/lms`.
* **TypeScript:** `npx tsc --noEmit` — zero errors.
* **Status:** Ready for Gemini's review and Sweep 3, Step 1.

---

# AI Sync Log — HVG Sober-Living Platform

## Operational Directives & Constraints Update
* **Lead Architect:** Gemini
* **Lead Engineer:** Claude
* **Current Phase:** Master Plan - Sweep 3 (Mobile Parity & Native Builds)
* **CRITICAL RULE:** The AI (Claude) is strictly forbidden from running `git commit`, `git push`, or native mobile builds (Fastlane/EAS). Pure code manipulation only.

## Sweep 3, Step 1: Mobile API Client Parity & Type Sync
**Target:** Mobile API Layer (`/mobile/lib/api/client.ts`, `/mobile/lib/api/routes.ts`, `/mobile/features/lms/*`)

### Architectural Diagnosis (From Gemini):
**The Risk:** During Sweeps 1 and 2, we hardened the Next.js backend, modified LMS course payload shapes (specifically replacing string arrays with `CurriculumModule[]`), and enforced strict Custom Claims logic. The mobile app, acting as a separate client, is likely using outdated TypeScript interfaces and potentially incorrect API endpoints to fetch this data.
**The Root Cause Hypothesis:**
1. **Auth Drift:** The mobile app (`/mobile/lib/api/client.ts`) needs to ensure it is attaching the live Firebase ID Token to every request sent to the Next.js backend (`/app/api/mobile/*`), otherwise Next.js middleware will reject the resident.
2. **LMS Schema Drift:** The mobile LMS fetching hooks (e.g., `useOfflineCourse.ts` or the screens in `/mobile/app/(tabs)/lms/`) are probably expecting the old, broken course shape instead of the new Zod-validated schemas.

### Action Plan for Claude:
1. **Audit Mobile Auth Interceptor:** Open `/mobile/lib/api/client.ts`. Ensure the Axios (or fetch) instance has a request interceptor that calls `auth().currentUser?.getIdToken()` and attaches it as `Authorization: Bearer <token>`. 
2. **Audit Mobile LMS Types:** Check `/shared/types/` vs what the mobile app is importing. Ensure the mobile LMS screens (e.g., `/mobile/app/(tabs)/lms/[courseId]/[lessonId].tsx`) are prepared to render the `CurriculumModule[]` structure that we fixed in Sweep 2.
3. **Verify Route Mappings:** Cross-reference `/mobile/lib/api/routes.ts` with the actual Next.js endpoints in `/app/api/mobile/*`. Fix any broken URLs or parameter mismatches.

### Claude's Execution Report:
* **Auth Interceptor:** Clean. `tokenStore.ts` correctly calls `auth().currentUser?.getIdToken(false)` — Firebase handles expiry and auto-refresh. SecureStore is fallback only. No changes needed.
* **Sync Issues Found (3 bugs):**
  1. **CRITICAL — Wrong enrollment collection** (`app/api/mobile/tenants/[tenantId]/courses/route.ts`): The courses list endpoint was querying `tenants/${tenantId}/enrollments where userId == uid` — which is the resident BED/HOUSE enrollment collection, not LMS enrollment. LMS course enrollments are stored at `users/${uid}/courseEnrollments/${courseId}` (set by the enroll endpoint). This meant every mobile user always appeared as "not enrolled" with 0 progress across all courses.
  2. **CRITICAL — React Query key mismatch** (`mobile/app/(tabs)/lms/index.tsx`): The LMS index page cached data under `['mobile-courses', tenantId]` while the course detail screen queried the same list under `['lms', 'courses', tenantId]` and invalidated `['lms', 'courses']`. Enrollment/completion mutations never triggered a re-fetch of the index. Both now use `['lms', 'courses', tenantId]`.
  3. **MEDIUM — Status field normalization** (same route): The enroll endpoint writes lowercase `'active'`/`'completed'` but the mobile `MobileCourse` type expects `'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED'`. Fixed by normalizing in the API response: `completed → COMPLETED`, `active + completedLessons.length > 0 → IN_PROGRESS`, else `ENROLLED`.
* **Files Modified:**
  - `app/api/mobile/tenants/[tenantId]/courses/route.ts` — Fixed enrollment collection path, document ID lookup (courseId = doc.id), completedLessons array handling, and status normalization.
  - `mobile/app/(tabs)/lms/index.tsx` — Normalized query key from `['mobile-courses', tenantId]` to `['lms', 'courses', tenantId]`.
* **TypeScript:** `npx tsc --noEmit` — zero errors.
* **Status:** Ready for Gemini's review and Sweep 3, Step 2 (Fastlane Config).

---

# AI Sync Log — HVG Sober-Living Platform

## Operational Directives & Constraints Update
* **Lead Architect:** Gemini
* **Lead Engineer:** Claude
* **Current Phase:** Master Plan - Sweep 3 (Mobile Parity & Native Builds)
* **CRITICAL RULE:** The AI (Claude) is strictly forbidden from running `fastlane` execution commands or generating the actual `.aab`. Claude's job is purely to audit and fix the configuration files.

## Sweep 3, Step 2: Fastlane Pipeline & Android Signing Audit
**Target:** Native Build Configurations (`/mobile/android/fastlane/Fastfile`, `/mobile/android/fastlane/Appfile`, `/mobile/android/app/build.gradle`)

### Architectural Diagnosis (From Gemini):
**The Risk:** The project recently pivoted from EAS (Expo Application Services) to Fastlane for native builds. The human developer reported recent issues with Android App Bundle (`.aab`) signing keys, and previous AI attempts provided incorrect, repetitive instructions.
**The Root Cause Hypothesis:**
1. **Keystore Disconnect:** The `build.gradle` file in `android/app` is either missing the `signingConfigs { release { ... } }` block entirely, or it is hardcoding paths that don't exist, rather than pulling from a secure `gradle.properties` or `.env` file.
2. **Fastfile Errors:** The `Fastfile` lane for building the release (e.g., `lane :build do`) might be targeting `assembleRelease` (which builds an APK) instead of `bundleRelease` (which builds the required `.aab` for the Play Store).
3. **Version Bumping:** The pipeline may lack a standardized way to increment the `versionCode`, which will cause the Google Play Console to reject the upload.

### Action Plan for Claude:
1. **Audit `build.gradle`:** Open `/mobile/android/app/build.gradle`. Ensure there is a robust `release` signing config that reads from environment variables or `gradle.properties` (e.g., `MYAPP_RELEASE_STORE_FILE`, `MYAPP_RELEASE_STORE_PASSWORD`). Do NOT hardcode passwords.
2. **Audit `Fastfile`:** Open `/mobile/android/fastlane/Fastfile`. Ensure the build lane is executing `gradle(task: "bundle", build_type: "Release")` so it generates an `.aab`. 
3. **Audit `gradle.properties`:** Ensure there is a template or clear instructions for the human developer on what variables need to be present locally to sign the app successfully.
4. **Fix & Document:** Make the necessary code changes to the gradle and fastlane files. 

### Claude's Execution Report:
* **Configuration Issues Found (3 bugs):**
  1. **CRITICAL — `Appfile` hardcoded absolute path:** `json_key_file` pointed to `/Users/peter/Desktop/...` — breaks on every CI runner or other machine. Fixed to use `ENV["PLAY_STORE_JSON_KEY_PATH"]` with a portable relative-path fallback.
  2. **HIGH — Missing `versionCode` bump:** Both build lanes had no `increment_version_code` call. Google Play rejects uploads where `versionCode` hasn't changed. The `versionCode` was hardcoded as `23` in `build.gradle`. Fixed with `increment_version_code(gradle_file_path: "app/build.gradle")` at the top of both lanes — it auto-increments and writes back to the file.
  3. **HIGH — `beta` lane called `crashlytics` plugin (not installed):** The `beta` lane would fail immediately at `crashlytics`. Removed this lane entirely and replaced it with a dedicated `build` lane that generates the AAB locally without any upload (useful for manual QA testing). The `deploy` lane now targets the `internal` track by default, which is the correct first step before promoting to production.
  4. **MEDIUM — Signing keys absent from `gradle.properties`:** The `MYAPP_UPLOAD_*` properties were never defined, causing `project.hasProperty(...)` to return `false` in `build.gradle`. This silently falls back to debug signing for release builds — the Play Store rejects debug-signed bundles. Added commented-out stubs to `gradle.properties` with clear instructions.
* **Files Modified:**
  - `mobile/android/fastlane/Appfile` — Replaced hardcoded path with `ENV["PLAY_STORE_JSON_KEY_PATH"]` + portable relative fallback.
  - `mobile/android/fastlane/Fastfile` — Removed broken `beta`/`crashlytics` lane; added `build` lane (local AAB only); fixed both lanes to use `gradle(task: "bundle", build_type: "Release")` (canonical Fastlane form) + `increment_version_code` before each build.
  - `mobile/android/gradle.properties` — Added commented `MYAPP_UPLOAD_*` stubs with instructions to put real values in `~/.gradle/gradle.properties`.
* **Next Steps for Human (required before running `fastlane build` or `fastlane deploy`):**
  1. **Set signing keys in your global Gradle properties** (never in the project file):
     Open `~/.gradle/gradle.properties` (create it if it doesn't exist) and add:
     ```
     MYAPP_UPLOAD_STORE_FILE=/absolute/path/to/hvg-upload-key.jks
     MYAPP_UPLOAD_STORE_PASSWORD=your-keystore-password
     MYAPP_UPLOAD_KEY_ALIAS=your-key-alias
     MYAPP_UPLOAD_KEY_PASSWORD=your-key-password
     ```
  2. **For CI/CD:** Set `PLAY_STORE_JSON_KEY_PATH` environment variable to the absolute path of your Google Play service account JSON key file.
  3. **Run locally:** `cd mobile/android && bundle exec fastlane build` — generates a signed `.aab` at `mobile/android/app/build/outputs/bundle/release/app-release.aab`.
  4. **Deploy to internal track:** `cd mobile/android && bundle exec fastlane deploy`
* **Status:** "Ready for Gemini's review and Sweep 4 (Monetization)."

---

## Sweep 3, Step 3: Deployment Blocker Resolution (Build Security & Environment)
**Target:** Android Build Environment (`mobile/android/app/build.gradle`, `mobile/android/fastlane/Fastfile`)

### Architectural Diagnosis (From Gemini):
**The Symptom:**
1. **Signing Failure:** Play Store rejects AAB because it is debug-signed.
2. **Ruby Failure:** Fastlane fails due to incompatible system Ruby/Bundler version on macOS.

### Action Plan for Gemini:
1. **Automate Signing Config:** Update `build.gradle` to automatically load `local.properties` into project properties. This ensures that the build script can access the production signing credentials if they are present in the project's `local.properties` (which is often safer/easier for local development than a global file).
2. **Secure Key Mapping:** Update the `signingConfigs.release` block to use `project.findProperty(...)` correctly, mapping to the keys found in the user's `local.properties`.
3. **Environment Fix:** Identify that the system-default Ruby (2.6) is incompatible with Bundler 4.0.3, but Homebrew Ruby (4.0.1) is present on the machine with the correct Bundler version.

### Execution Report:
* **Fix Applied:**
  - `mobile/android/app/build.gradle`: Added a logic block at the top to load `mobile/android/local.properties` into the Gradle project extensions.
  - `mobile/android/app/build.gradle`: Rewrote `signingConfigs.release` to use `project.findProperty` for all keys (`MYAPP_UPLOAD_STORE_FILE`, `MYAPP_UPLOAD_STORE_PASSWORD`, etc.). Added support for `@` prefix in the file path to handle relative paths in the user's local configuration.
  - `mobile/android/fastlane/Fastfile`: Added comments to all build lanes providing the exact path for the Homebrew Ruby Bundler: `/opt/homebrew/Cellar/ruby/4.0.1/bin/bundle`.
* **Status:** "Build environment rectified. User ready for manual production build."

---

# AI Sync Log — HVG Sober-Living Platform

## Operational Directives & Constraints Update
* **Lead Architect:** Gemini
* **Lead Engineer:** Claude
* **Current Phase:** Master Plan - Sweep 4 (Monetization & Security)
* **CRITICAL RULE:** The AI (Claude) is strictly forbidden from running `git` or `fastlane` commands. Pure code manipulation only.

## Sweep 4, Step 1: Stripe Webhook to Firestore Synchronization
**Target:** Billing Infrastructure (`/app/api/webhooks/stripe/route.ts`, `/lib/stripe/server.ts`, `/features/tenant/services/tenantService.ts`)

### Architectural Diagnosis (From Gemini):
**The Risk:** SaaS monetization relies on asynchronous webhooks. If the Stripe webhook handler fails to update the Firestore tenant document after a successful checkout, the Operator will be falsely locked out of their dashboard (or conversely, retain access after canceling). 
**The Root Cause Hypothesis:** The webhook endpoint (`/app/api/webhooks/stripe/route.ts`) is likely a stub, missing signature verification, or failing to extract the `tenantId` from the Stripe object's `metadata` to perform the database write.

### Action Plan for Claude:
1. **Audit Signature Verification:** Open `/app/api/webhooks/stripe/route.ts`. Ensure `stripe.webhooks.constructEvent` is correctly verifying the `STRIPE_WEBHOOK_SECRET`.
2. **Implement Event Handlers:** Ensure the switch statement handles these core events:
   - `checkout.session.completed` (Extract `client_reference_id` or `metadata.tenantId` and save the `stripeCustomerId` to the tenant).
   - `customer.subscription.created` / `customer.subscription.updated` (Update tenant document with `subscriptionId`, `subscriptionStatus` (e.g., 'active', 'past_due'), and `currentPeriodEnd`).
   - `customer.subscription.deleted` (Set status to 'canceled').
3. **Database Write:** Use `adminDb` (Firebase Admin SDK) to securely perform these updates on `tenants/{tenantId}`. Bypassing the service layer here is acceptable *only* if `adminDb` is used to skip client-side auth requirements, as the webhook runs entirely server-to-server.
4. **TypeScript Compliance:** Ensure Stripe event typing is strictly handled.

### Claude's Execution Report:
* **Webhook Status:** The existing handler was structurally sound (signature verification, correct `rawBody` parsing via `request.text()`, event switch) but had three concrete gaps that would break production billing:
  1. **`stripeCustomerId` never persisted** — `checkout.session.completed` retrieved the subscription but didn't write `session.customer` to the tenant document. Subsequent billing portal / invoice lookups require this. Fixed by adding optional `stripeCustomerId` parameter to `updateTenantSubscription` and writing `subscription.stripeCustomerId` when present.
  2. **`customer.subscription.created` not handled** — only `updated` and `deleted` were covered. Subscriptions created outside Checkout (e.g., via direct Stripe API, trials converting) were silently dropped. Fixed by fall-through: `case 'customer.subscription.created': case 'customer.subscription.updated':` sharing the same handler.
  3. **Tenant `status` not promoted on checkout** — New tenants start as `'trial'`. After `checkout.session.completed`, the tenant's top-level `status` field was never flipped to `'active'`. This would gate operators out of the dashboard even after paying. Fixed by adding `adminDb.collection('tenants').doc(tenantId).update({ status: 'active' })` in that case.
  4. **`current_period_end` unsafe cast** — Replaced `as unknown as { current_period_end: number }` with a safe `Record<string, unknown>` narrowing that handles `null` gracefully if the field is absent in the clover preview API.
* **Events Handled:** `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
* **Files Modified:**
  - `app/api/webhooks/stripe/route.ts` — All four fixes applied. `lib/stripe/server.ts` and `features/tenant/services/tenantService.ts` were audited and required no changes.
* **TypeScript:** `npx tsc --noEmit` — zero errors.
* **Status:** "Ready for Gemini's review and Sweep 4, Step 2 (Security Rules)."

---

# AI Sync Log — HVG Sober-Living Platform

## Operational Directives & Constraints Update
* **Lead Architect:** Gemini
* **Lead Engineer:** Claude
* **Current Phase:** Master Plan - Sweep 5, Phase 5.1 (The Great Dashboard Merge)
* **CRITICAL RULE:** Claude is strictly forbidden from running `git` commands.

## Sweep 5, Phase 5.1: Sidebar & Layout Unification
**Target:** Navigation (`/components/dashboard/Sidebar.tsx`) and Route Migration (`/app/(superadmin)/admin/*` -> `/app/(dashboard)/[tenantId]/superadmin/*`)

### Architectural Diagnosis (From Gemini):
**The Problem:** The SuperAdmin routes (`/admin/*`) are structurally isolated from the Tenant Dashboard (`/[tenantId]/*`), causing aggressive Next.js middleware lockouts and forcing the human developer to maintain two separate mental contexts.
**The Solution:** We must fold the SuperAdmin functionality into the main Tenant Dashboard. The Sidebar must intelligently read the user's `customClaims` and conditionally reveal a "Platform Admin" section. We will move the global administrative views into a protected sub-route of the tenant dashboard.

### Action Plan for Claude:
1. **The Sidebar Overhaul:** Open `/components/dashboard/Sidebar.tsx`.
   - Locate where the current user's role or claims are fetched (likely via `useAuth()` or passed props).
   - Inject a conditionally rendered navigation section labeled "Platform Admin". This should ONLY render if `claims?.super_admin === true` (or the equivalent check in this codebase).
   - Add links to this new section for: "Tenant Approvals", "Global Financials", "System Health", and "Global Apps".
   - Point these links to the new unified path: `/${tenantId}/superadmin/...`

2. **The Route Migration (Move & Refactor):**
   - Create a new directory structure: `/app/(dashboard)/[tenantId]/superadmin/`.
   - Methodically move the critical pages from the old `/app/(superadmin)/admin/*` directory into this new dashboard sub-directory. For example, move the tenant approvals page to `/[tenantId]/superadmin/tenants/page.tsx`.
   - Update any relative imports within those moved files to ensure they don't break.

3. **Cleanup:**
   - Ensure the newly moved pages correctly inherit the standard Dashboard Layout instead of the old Admin Layout.

### Claude's Execution Report — Sweep 5 Complete ✅

**Phase 5.1 — Sidebar & Layout Unification:**
* **Sidebar:** `components/dashboard/Sidebar.tsx` — Added `PLATFORM_ADMIN_ITEMS` const and a "PLATFORM ADMIN" section (fuchsia accent `rgba(217,70,239,*)`) gated on `user?.role === 'super_admin'`. Imports `Inbox`, `Building2`, `CircleDollarSign`, `ServerCrash` from lucide-react. Section collapses correctly with sidebar.
* **Routes Created (new, not moved):** Pages call the same existing `/api/admin/*` endpoints (already enforce `super_admin`). Zero new API routes needed.
  - `app/(dashboard)/[tenantId]/superadmin/applications/page.tsx` — Full triage inbox with Dispatch modal (AI match scores), Approve Tenant, Reject modal.
  - `app/(dashboard)/[tenantId]/superadmin/tenants/page.tsx` — Tenant list + `authService.impersonateTenant()`.
  - `app/(dashboard)/[tenantId]/superadmin/financials/page.tsx` — Subscription ledger + MRR stats.
  - `app/(dashboard)/[tenantId]/superadmin/system/page.tsx` — Dependency health + environment panel.

**Phase 5.2 — Notification Pipeline Gaps:**
* `app/api/admin/applications/[applicationId]/assign/route.ts` — After Firestore writes, calls `notificationService.createNotification({ tenantId: assignedTenantId, type: 'application', title: 'New Application Assigned', priority: 'high' })`.
* `app/api/applications/[type]/route.ts` — Added `'tenant'` to `VALID_TYPES`. After creating a `type === 'tenant'` doc, queries `users` collection for `role === 'super_admin'` (limit 10) and creates a self-scoped notification per super_admin using their `uid` as `tenantId`.

**Phase 5.3 — Tenant Apps Tab:**
* `app/(dashboard)/[tenantId]/applications/page.tsx` — Added `view` state (`'kanban' | 'tenant_apps'`). Tab toggle visible only when `user?.role === 'super_admin'`. Tenant Apps tab fetches `/api/admin/applications?type=tenant&status=pending_triage`. Each card shows Approve + Reject buttons. Reject opens inline modal with reason textarea. Kanban board fully preserved for `view === 'kanban'`.

**TypeScript:** `npx tsc --noEmit` — zero errors.

**Files Modified:**
- `components/dashboard/Sidebar.tsx`
- `app/(dashboard)/[tenantId]/superadmin/applications/page.tsx` (created)
- `app/(dashboard)/[tenantId]/superadmin/tenants/page.tsx` (created)
- `app/(dashboard)/[tenantId]/superadmin/financials/page.tsx` (created)
- `app/(dashboard)/[tenantId]/superadmin/system/page.tsx` (created)
- `app/api/admin/applications/[applicationId]/assign/route.ts`
- `app/api/applications/[type]/route.ts`
- `app/(dashboard)/[tenantId]/applications/page.tsx`
* **Status:** "Ready for Gemini's review and Phase 5.2 (Inbox Routing)."


# AI Sync Log — HVG Sober-Living Platform

## Operational Directives & Constraints Update
* **Lead Architect:** Gemini
* **Lead Engineer:** Claude
* **Current Phase:** Master Plan - Sweep 5, Phase 5.2 (Application Routing & Inbox Sync)
* **CRITICAL RULE:** Claude is strictly forbidden from running `git` commands. Pure code manipulation only.

---

## Sweep 5, Phase 5.2: Inbox Routing & Notification Sync
**Target:** Application API Routes (`/app/api/applications/[type]/route.ts`, or equivalent submission endpoints) and Inbox Service (`/features/inbox/inboxService.ts`)

### Architectural Diagnosis (From Gemini):
**The Problem:** Applications (Tenant, Bed, Staff) are likely writing to Firestore, but there is a disconnect in the notification pipeline. The SuperAdmin and Facility Operators have to manually check their queues instead of being proactively notified.
**The Solution:** We must inject notification triggers into the application submission lifecycle. The routing must be context-aware: Tenant applications go to SuperAdmins; Bed/Staff applications go to the specific Facility's operators.

### Action Plan for Claude:
1. **Audit the Inbox Service:** Open `/features/inbox/inboxService.ts`. Ensure there is a robust method for creating system notifications (e.g., `createNotification(userId, payload)` or similar).
2. **Intercept Application Submissions:** Open the API route that handles incoming applications (e.g., `/app/api/applications/[type]/route.ts` or `/app/api/tenants/[tenantId]/applications/route.ts`).
3. **Implement Context-Aware Routing:**
   - **If `type === 'tenant'`:** Query the database for all users with the `super_admin` claim (or a designated admin ID) and fire a notification to their inbox: *"New Facility Application: [Org Name]"*.
   - **If `type === 'bed'` OR `type === 'staff'`:** Fire a notification to the inbox of the staff members associated with that specific `tenantId`.
4. **Data Integrity:** Ensure the notification payload includes the `applicationId` so the UI can eventually link directly to the application review modal. Wrap the database write and the notification trigger in a `try/catch` block.

### Claude's Execution Report ✅

* **Routing Implemented:**
  - **`type === 'tenant'`** (already in place from Sweep 5 Phase 5.1): Queries `users` collection for `role === 'super_admin'` (limit 10), creates a self-scoped notification per super_admin using their `uid` as `tenantId`. Title: "New Tenant Application".
  - **`type === 'bed'` or `type === 'staff'`** (new): When `application.requestedTenantId` is set, queries `users` collection for `tenantId === requestedTenantId` AND `role in ['tenant_admin', 'staff_admin']` (limit 20). Creates a notification scoped to `requestedTenantId` for each matching admin. Title: "New Bed Application" or "New Staff Application".
  - Notifications are fire-and-forget after the `docRef.set()` — application write is not blocked by notification failures.
  - All notifications include `refId: docRef.id, refCollection: 'applications'` for future deep-link support.
* **Files Modified:**
  - `app/api/applications/[type]/route.ts`
* **TypeScript:** `npx tsc --noEmit` — zero errors.
* **Status:** "Ready for Gemini's review and Phase 5.3 (Unified Application UI)."

---

# AI Sync Log — HVG Sober-Living Platform

## Operational Directives & Constraints Update
* **Lead Architect:** Gemini
* **Lead Engineer:** Claude
* **Current Phase:** Master Plan - Sweep 5, Phase 5.3 (The Unified Application UI)
* **CRITICAL RULE:** Claude is strictly forbidden from running `git` commands. Pure code manipulation only.

## Sweep 5, Phase 5.3: The Unified Application UI & Action Wiring
**Target:** Applications Dashboard (`/app/(dashboard)/[tenantId]/applications/page.tsx`, `/features/applications/components/*`)

### Architectural Diagnosis (From Gemini):
**The Problem:** The backend application pipeline is fully operational, but the frontend UI is either fractured or missing the necessary server action wiring to securely approve or reject the different types of applications (Tenant vs. Bed/Staff).
**The Solution:** We must overhaul the Applications page to be contextually aware of the user's role. It needs a tabbed or cleanly sectioned interface to display pending applications, with wired-up mutation hooks to process them.

### Action Plan for Claude:
1. **Context-Aware Fetching:** Open `/app/(dashboard)/[tenantId]/applications/page.tsx` (and its associated data fetching hooks).
   - If the user has the `super_admin` claim, fetch and display pending `tenant` applications.
   - For standard facility operators (and the SuperAdmin when viewing their own facility), fetch pending `bed` and `staff` applications.
2. **The Tabbed Interface:** Implement a clean, accessible UI (using the existing Design System components like `Tabs` or segmented controls) to switch between "Facility Apps" (for SuperAdmins) and "Resident/Staff Apps".
3. **Action Wiring (Approve/Reject):**
   - Ensure the "Approve" button calls the correct API endpoint. For Tenant apps, this likely means calling `/api/admin/applications/[applicationId]/approve-tenant` to generate their Custom Claims and initialize their facility.
   - For Bed/Staff apps, ensure Approval assigns the bed or updates the staff roster.
   - Implement a "Reject" flow that optionally captures a reason before updating the application status.
4. **UX Polish:** Add loading states (`isPending`) to the buttons so the user knows the database is processing the approval.

### Claude's Execution Report ✅

* **UI Structure:**
  - **Tab toggle** (`Pipeline` / `Tenant Apps`) visible only for `super_admin` — unchanged from Phase 5.1.
  - **Kanban `COLUMNS` fix:** Changed "New" column from status `'assigned'` → `'assigned_to_tenant'`. Apps assigned by SuperAdmin now arrive in the correct visible "New" column instead of being invisible.
  - **Detail modal header** now shows contextual action buttons (Admit / Waitlist / Reject) on any app that isn't already `accepted` or `rejected`. Buttons are hidden once a terminal status is reached.
  - **Tenant Apps list** (super_admin only): cards show applicant name, email, org name, submit date, Approve + Reject.

* **Actions Wired:**
  - **Tenant Approve** → `POST /api/admin/applications/[id]/approve-tenant` (creates tenant doc, sets custom claims, seeds onboarding). Loading spinner per card via `approvingId`.
  - **Tenant Reject** → `POST /api/admin/applications/[id]/reject` with required `reason`. Modal now enforces non-empty reason (red border + inline validation message, submit disabled). Loading state via `rejectLoading`.
  - **Bed/Staff Admit** → `PATCH /api/tenants/${tenantId}/applications` with `status: 'accepted'`. Triggers admission sequence (resident record, enrollment, house chat). Loading state via `detailActionLoading`.
  - **Bed/Staff Waitlist** → same PATCH with `status: 'waitlisted'`. Loading state via `detailActionLoading`.
  - **Bed/Staff Reject** → separate `bedRejectModal` — `PATCH /api/tenants/${tenantId}/applications` with `status: 'rejected', notes: reason`. Required reason enforced same way as tenant reject. Loading via `bedRejectLoading`.
  - After each action, the detail modal closes and the kanban refreshes.

* **`updateAppStatus` updated** to accept optional `notes` parameter, passed through to the PATCH body.

* **Files Modified:**
  - `app/(dashboard)/[tenantId]/applications/page.tsx`
* **TypeScript:** `npx tsc --noEmit` — zero errors.
* **Status:** "Ready for Gemini's Final Go-Live Review."