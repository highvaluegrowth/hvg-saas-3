# Phase 7: Omni-Channel Onboarding

## Overview
A comprehensive multi-track funnel designed to onboard diverse user roles properly: Housing Providers (SaaS), SuperAdmins (Approval Gateway), and Residents (Mobile App).

## Completed ✅
- [x] Provider Landing Page signup form (Marketing component).
- [x] SuperAdmin backend workflow foundation (Tenant status tracking).
- [x] Initial database schemas configured to support `status: 'pending'`.

## Remaining 📋
- [ ] Build **Funnel A: Housing Provider**. Step-by-step wizard (House setup, Subscription Tier selection via Stripe SDK).
- [ ] Build **Funnel B: SuperAdmin Approval**. Admin action center to review identity, verify documents, and activate "Provider" status.
- [ ] Build **Funnel C: Resident Onboarding**. Deep-linked app invitations to join an active House via unique codes/QR.
- [ ] Integration of transactional emails (SendGrid / Postmark).

## Notes
- Critical bottleneck is validating House Provider legitimacy before enabling their SaaS capabilities.
