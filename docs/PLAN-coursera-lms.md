# PLAN-coursera-lms

## Overview
A "Coursera/Udemy-style" Learning Management System (LMS) integrated natively into the HVG Platform. Tenants construct modular courses with robust question engines (excluding file uploads). Residents view these via the mobile app. Non-residents can access universal or globally-published tenant courses. It includes gamification and AI-guided assistance to drive retention.

**Project Type:** WEB + BACKEND + MOBILE (Full Stack Cross-Platform integration)

## Success Criteria
- [ ] Tenant Admins can construct courses, modules, lessons, and 12 types of questions/quizzes.
- [ ] Mobile app supports Mux video playback for gated resources.
- [ ] Global/Universal publishing switch works (is accessible by non-residents).
- [ ] Gamification engine rewards points for completions and updates tenant leaderboards.
- [ ] The AI Agent can summarize courses and remind users of due dates (acting as a Guide).
- [ ] All required Verification Scripts pass successfully.

## Tech Stack
- **Web Course Builder:** React/TipTap for rich text editing, `@dnd-kit` for drag-and-drop module/lesson reordering.
- **Mobile Content Viewer:** Flutter with `video_player` / Mux plugins.
- **Database:** Firebase Firestore (nested subcollections for massive scale, referencing global `courses` to support non-resident access without reading tenant graphs).
- **Gamification:** Standalone Firestore root collection `/gamification` or nested profiles to handle global and tenant-specific score aggregation.
- **AI Agent Integration:** Claude 3.5 Sonnet / Gemini via Firebase Extensions, extracting course descriptions.

## File Structure (Web)
```
app/(tenant)/[tenantId]/lms/
├── page.tsx // Course Grid Dashboard
├── create/
│   └── page.tsx // Global course settings
├── [courseId]/
│   ├── page.tsx // Course details & Module List
│   ├── builder/
│   │   ├── page.tsx // Drag/Drop Module & Lesson orchestration
│   │   ├── [lessonId]/page.tsx // TipTap / Q&A Builder
│   └── analytics/
│       └── page.tsx // Resident progress & Leaderboards
```

## Task Breakdown

### 1. Database & Schema Design (P0)
- **Agent:** `database-architect`
- **Skill:** `database-design`
- **Task:** Finalize the Firestore schema for the globalized LMS model. Courses must either be under `tenants/{id}/courses` (if strict) OR a root `/courses` collection with `ownerTenantId` and `isPublic: boolean`.
- **INPUT:** This plan.
- **OUTPUT:** Updated `docs/plans/phase5-lms-technical-spec.md` and Firestore Rules.
- **VERIFY:** Rules allow non-auth reads if `isPublic == true`.

### 2. Gamification Engine (P1)
- **Agent:** `backend-specialist`
- **Skill:** `api-patterns`
- **Task:** Create Cloud Functions (or Next.js API actions) to award points. Handle `/gamification/tenant_{id}_leaderboard` updates atomically using `FieldValue.increment()`.
- **INPUT:** LMS Completion trigger.
- **OUTPUT:** Cloud Function / Server Action for awarding points & Badges.
- **VERIFY:** Emulated function tests increment score perfectly.

### 3. Course Builder UI - Foundation (P2)
- **Agent:** `frontend-specialist`
- **Skill:** `frontend-design`
- **Task:** Build the `app/(tenant)/[tenantId]/lms/create` screens. Implement the `TipTap` editor for descriptions and `@dnd-kit` for sorting modules.
- **INPUT:** DB Schema.
- **OUTPUT:** Functional React Course Builder.
- **VERIFY:** Modules can be drag-and-dropped and saved to Firestore.

### 4. Course Builder UI - Question Engine (P2)
- **Agent:** `frontend-specialist`
- **Skill:** `frontend-design`
- **Task:** Build react forms for the 12 question types (Multiple Choice, Hot Spot, Ordering, etc.). Exclude File Upload.
- **INPUT:** DB Schema & TipTap.
- **OUTPUT:** `QuizBuilder` component.
- **VERIFY:** A landlord can create a 5-question mixed quiz and save it.

### 5. Mobile Content Viewer & Playback (P2)
- **Agent:** `mobile-developer`
- **Skill:** `mobile-design`
- **Task:** Create the Flutter views for consuming courses. Integrate video playback, pagination for modules, and quiz answering screens.
- **INPUT:** Firestore Schema.
- **OUTPUT:** `CourseDetailsPage`, `LessonViewerPage`, `QuizTakerPage` in Flutter.
- **VERIFY:** Resident can complete a course and see their points increase.

### 6. AI Agent Course Awareness (P3)
- **Agent:** `backend-specialist`
- **Skill:** `api-patterns`
- **Task:** Inject course context into the AI's system prompt. When a user asks "What is my next lesson?", the agent queries the user's `/enrollments` and summarizes the upcoming lesson.
- **INPUT:** Course and Gamification schema.
- **OUTPUT:** Updated AI Chat configuration.
- **VERIFY:** Chatbot can correctly announce the next due date.

## ✅ PHASE X Verification (Mandatory)
- [ ] `npm run lint` & `npx tsc --noEmit`
- [ ] `python .agent/skills/vulnerability-scanner/scripts/security_scan.py .`
- [ ] `python .agent/skills/frontend-design/scripts/ux_audit.py .`
- [ ] `python .agent/scripts/verify_all.py . --url http://localhost:3000` (Optional/if applicable)
- [ ] Socratic Gate was respected (Confirmed via Q&A).
- [ ] No purple/violet hex codes used in UI.
- [ ] No standard template layouts.
