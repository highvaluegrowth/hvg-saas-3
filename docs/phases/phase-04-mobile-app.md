# Phase 4: Resident Mobile App

## Overview
A standalone mobile app (Expo / React Native) for residents in recovery. Features cross-tenant enrollment, life management features, and a specialized Gemini-powered recovery guide.

## Completed ✅
- [x] Architecture design (Monorepo-lite in `/mobile`)
- [x] Backend Identity Model updates (`users/{uid}` collection)
- [x] Mobile API Layer foundations (`/api/mobile/`)
- [x] Chat endpoints for Mobile (`/api/ai/mobile/chat/route.ts`)
- [x] Web dashboard manual unifier for Resident -> AppUser linking

## Remaining 📋
- [ ] Initialize actual Expo application in `/mobile`
- [ ] Build Mobile Auth screens (Login/Register)
- [ ] Implement Tab Layout (Home Feed, Chat, Schedule, Profile)
- [ ] Implement Tenant Discovery and Join Request flows
- [ ] Build tenant-scoped screens (Events, Chores, Rides)
- [ ] Build AI Chat UI in Expo (`react-native-gifted-chat`)
- [ ] Integrate Push Notifications (FCM / Expo Notifications)

## Notes
- Identity is global, authorization is via `Enrollment` context.
