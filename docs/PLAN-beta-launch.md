# Beta Launch & Firebase Setup Plan

## Overview
This plan outlines the steps required to configure Firebase for production, set up hosting for the landing page and SaaS web app, prepare the iOS and Android applications for beta testing, and ensure the entire platform is ready for external traffic.

## Project Type
WEB and MOBILE (Omnichannel SaaS)

## Analysis & Answers to Your Questions
**Q: Do we need four different apps in the hvg-saas-3 Firebase project: SaaS web app, landing page, Android, iOS?**
A: Since your Next.js project handles *both* the landing page (`/app/(marketing)`) and the SaaS dashboard (`/app/(dashboard)`), you actually only need **three** apps registered in your Firebase project:
1. **Web App:** Covers both the landing page and the SaaS platform (they share the same codebase and Firebase config).
2. **iOS App:** For the Apple App Store / TestFlight.
3. **Android App:** For the Google Play Store / Internal Testing.

**Q: The landing page is at highvaluegrowth.com, does that need to be its own Firebase app with hosting configured to that domain?**
A: No, it does not need to be a separate Firebase Web App. You will connect the `highvaluegrowth.com` custom domain to your single Firebase Hosting site that runs this Next.js project. Visitors to `highvaluegrowth.com` will see the marketing pages, and users who log in will be routed to the dashboard routes—all under one seamless domain.

## User Clarifications (Socratic Gate Completed)
1. **Domain Strategy:** The SaaS dashboard and landing page will share `highvaluegrowth.com`. We will support routing using URL-friendly company names (e.g., `highvaluegrowth.com/[company-slug]/[house-slug]`) within the Next.js App Router for personalized tenant dashboards.
2. **Beta Distribution:** Firebase App Distribution will be used for both iOS and Android beta testing.
3. **Live Testing:** We are currently executing the end-to-end onboarding walkthrough locally before setting up the production Firebase/Hosting environments.

---

## Task Breakdown

### Phase 1: Firebase Production Configuration
- [ ] **Task 1.1:** Register the iOS and Android apps in the `hvg-saas-3` Firebase Console (requires your internal app bundle IDs).
- [ ] **Task 1.2:** Configure Firebase Authentication authorized domains (add `highvaluegrowth.com`).
- [ ] **Task 1.3:** Setup production Firestore Security Rules and Storage Rules.

### Phase 2: Web Hosting & Domain Mapping
- [ ] **Task 2.1:** Deploy the Next.js app to Firebase Hosting.
- [ ] **Task 2.2:** Connect the custom domain (`highvaluegrowth.com`) in the Firebase Console and update your DNS records (A/TXT records).
- [ ] **Task 2.3:** Verify SSL certificate provisioning and production routing.

### Phase 3: Mobile Beta Preparation
- [ ] **Task 3.1:** Generate iOS and Android production builds (`eas build` or local flutter/react-native build depending on stack).
- [ ] **Task 3.2:** Upload builds to TestFlight (Apple) and internal testing (Google Play).
- [ ] **Task 3.3:** Ensure Deep Linking / Universal Links are configured so App Store badges on the landing page route correctly.

### Phase 4: Final Verification & Onboarding Walkthrough
- [ ] **Task 4.1:** Perform a complete end-to-end walkthrough of the SuperAdmin Onboarding flow.
- [ ] **Task 4.2:** Perform end-to-end Resident Onboarding flow.
- [ ] **Task 4.3:** Issue invitations to beta testers.

## Phase X: Verification Checklist
- Lint: ⚪ Pending
- Security: ⚪ Pending
- Build: ⚪ Pending
