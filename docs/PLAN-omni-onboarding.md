# Project Plan: Omni-Onboarding & SuperAdmin Approval Flow

## 1. Overview
The user is shifting the entire platform to a **Mobile-First Entry Strategy**. Every user type (Resident, Operator, Teacher, Donor) must start by downloading the mobile app. Immediately after authentication, a unified "Personalize your HVG experience" questionnaire will dynamically route them to their specific onboarding tunnels.

For users requesting to manage a sober-living house (Operators), they will enter a "Tenant Application" flow. Once submitted, their tenant stays in a `pending` state. While awaiting approval, they can access the SaaS platform, but a persistent banner will indicate their pending status. A dedicated SuperAdmin dashboard in the SaaS app will allow the platform owner to approve or reject these tenants.

## 2. Project Type
**WEB & MOBILE** (Cross-platform feature spanning new mobile screens and new web dashboards).

## 3. Success Criteria
- [ ] Website (highvaluegrowth.com) funnels all new signups to the Mobile App download.
- [ ] Mobile App features a post-auth Personalization Checklist.
- [ ] Checking "manage my sober-living house(s)" generates a unique, resumable link to a web-based Tenant Application.
- [ ] The Tenant Application form supports uploading Government ID and official business documentation.
- [ ] Navigating to the SaaS platform as a pending Operator displays an "Awaiting Approval" banner without hard-blocking the UI.
- [ ] SuperAdmin can access `/admin` on the SaaS platform, view a sortable/filterable table of tenants, and approve/reject them.

## 4. Architecture & Schema Impact
**AppUser Schema:**
- Needs an `onboardingRoles: string[]` or `preferences: string[]` array to track the user's selections from the personalization screen.

**Tenant Schema:**
- Needs `status: 'pending' | 'approved' | 'rejected' | 'suspended'`.
- Needs location/metadata fields collected during the application (e.g., `state`, `contactEmail`, `facilityName`).

---

## 5. Task Breakdown

### Phase 1: Database Schema & Core Security
* **Agent**: `database-architect`, `security-auditor`
* **Skills**: `database-design`
* **Tasks**:
  1. Update `shared/types/tenant.ts` and related Zod schemas to include the `status` enum (`pending`, `approved`, `rejected`) and application metadata.
  2. Update `shared/types/appUser.ts` to include `preferences: string[]` to store the checkbox selections.
  3. Update Firebase Security Rules (if applicable) to allow users to patch their own preferences during onboarding.

### Phase 2: Mobile Omni-Onboarding UI
* **Agent**: `mobile-developer`
* **Skills**: `mobile-design`
* **Tasks**:
  1. Build the `PersonalizationScreen` containing the 9 checkboxes. Set "support through my recovery" to default mapped to `true`.
  2. Implement the API call to patch the user's `preferences` array upon submission.
  3. If they select "manage my sober-living house(s)", hit a new API endpoint to scaffold a `draft` tenant and generate a unique, secure link to a web-based Tenant Application form. Provide instructions/links to complete it on a computer.

### Phase 3: Web-Based Tenant/Staff Application Wizard
* **Agent**: `frontend-specialist`, `backend-specialist`
* **Skills**: `frontend-design`, `api-patterns`
* **Tasks**:
  1. Build a dedicated Next.js route (e.g., `/apply/[applicationId]`) for the application.
  2. Implement a multi-step form wizard that auto-saves progress.
  3. Integrate Firebase Storage for secure file uploads (Government ID, business docs, resumes).
  4. Dynamically append **Application Addendums** based on preferences:
     - **Hosting/Courses**: Collect additional credentials or proposals.
     - **Help Others in Recovery (Staff)**: Collect resume, shift availability, and preferred placement (SuperAdmin vs a specific **Tenant**—not a specific house, as Tenants often manage multiple locations).
  5. Implement a "Submit" action that secures the uploaded documents and changes the status from `draft` to `pending`.

### Phase 4: SaaS Awaiting Approval Banner
* **Agent**: `frontend-specialist`
* **Skills**: `frontend-design`, `react-best-practices`
* **Tasks**:
  1. Update the SaaS `/api/tenants/[tenantId]` fetcher or `useAuth` hook to expose the tenant's (or application's) `status`.
  2. Create a global `PendingTenantBanner.tsx` component (Amber/Warning styles) that renders globally in the SaaS layout if `status === 'pending'`.
  3. Ensure the banner is non-blocking to allow them to explore the SaaS UI capabilities in 'Demo' mode.

### Phase 5: SuperAdmin Dashboard (`/admin`)
* **Agent**: `frontend-specialist`, `backend-specialist`
* **Skills**: `frontend-design`, `api-patterns`
* **Tasks**:
  1. Build a new Next.js page `/admin/onboarding` strictly protected by the `verifyAppUserToken` requiring `role === 'super_admin'`.
  2. Build paginated, filterable Data Tables for different application types (Tenants, Teachers, Staff).
  3. Implement row actions for Approve/Reject.

### Phase 6: Donation Pipelines & Transparency Dashboard
* **Agent**: `backend-specialist`, `frontend-specialist`
* **Skills**: `api-patterns`, `frontend-design`
* **Tasks**:
  1. **Donation Gateway**: If a user selects "donate money", route them to a Stripe (or equivalent) Payment Link, followed by a consultation booking UI (e.g., Calendly/Custom).
  2. **Automated Tax Receipts**: Configure webhooks so that upon successful donation, an email is automatically dispatched with IRS-compliant tax deduction documents attached.
  3. **Live Transparency Board**: Build a public-facing `/transparency` or `/donors` page that displays real-time charts/metrics of HVG income and expenses, accessible only to logged-in users who have the `donor` claim or a history of donations.

### Phase 7: Landing Page CTA Conversion
* **Agent**: `frontend-specialist`
* **Skills**: `frontend-design`, `seo-fundamentals`
* **Tasks**:
  1. Update the Marketing / Landing page strictly replacing "Sign Up for SaaS" buttons with "Download App" links.
  2. Move Web Login to a secondary "Sign In" link in the navigation header, intended only for existing approved operators.

---

## Phase X: Verification Checklist
- [ ] **E2E Testing**: Register a new user on mobile -> select 'manage a house' -> fill application -> log in to SaaS -> see Pending Banner.
- [ ] **E2E Testing**: Log in as SuperAdmin -> go to `/admin` -> approve the pending tenant -> verify the banner disappears for the user.
- [ ] **Lint/Build**: Pass all Next.js builds and ESLint checks.
- [ ] **Security**: SuperAdmin routes cannot be accessed or mutated by standard operators or residents.

## ✅ PHASE X COMPLETE
- Lint: [ ] Pending
- Security: [ ] Pending
- Build: [ ] Pending
- Date: [ ] Pending
