# Technical Implementation Plan: HVG Agent & Resizable Sidebar

## 1. CSS & Design Synchronization
**Goal:** Consolidate `globals.css` and Tailwind configurations so both `(marketing)` and `(dashboard)` route groups share the HVG Unified "Amber & Sage" glassmorphism tokens.
**Actions:**
- Replace the standard Shadcn monochrome `hsl` variables in `app/globals.css` with the Amber, Sage, and warm background colors (`#FDFBF7`) defined in our visual mandate.
- Introduce base utility classes (e.g., `.glass-panel`) for `bg-white/80 backdrop-blur-md border border-white/40 shadow-sm`.
- Ensure Humanist Typography (Varela Round / Nunito Sans) is enforced correctly across all root layouts.

## 2. Resizable Sidebar Layout Integration
**Goal:** Create a persistent, resizable AI Sidebar that "squeezes" the main operational content instead of overlaying it.
**Actions:**
- **Layout Strategy:** Modify `app/(dashboard)/[tenantId]/layout.tsx` to use a dynamic flex layout. 
  - Main content wrapper receives `flex-1`.
  - Sidebar container receives a default width of `25%` but uses an inline style for dynamic adjustment.
- **Draggable Handle:** Add a thin drag handle component (`cursor-col-resize`) between the main content and the AI Sidebar.
- **State Persistence:** Continue using `useAISidebarStore` (Zustand) but add a `sidebarWidth` property, persisting it to `localStorage` so the user's layout preference is saved across sessions.
- **Visual Alignment:** Style the Sidebar using the `MASTER.md` rules (warm backgrounds, sage chat bubbles, humanist typography).

## 3. HVG Agent System Prompt (Role Architect)
**Goal:** Elevate the agent from a basic "Guide" to a proactive "House Operations & Program Architect".
**Actions:**
- Update `app/api/ai/chat/route.ts` to refine the `systemInstruction` specifically for the Operator persona. 
- The Operator agent will be instructed to act as an operations director—structured, insightful, and anticipating workflow bottlenecks.
- The Resident agent will remain a warm, humanist "Recovery Program Guide", avoiding clinical or cold language.

## 4. Route Context Awareness
**Goal:** The agent must automatically understand what the operator is viewing.
**Actions:**
- Enhance the existing `routeContextMap.ts` logic. When the user navigates to a specific entity page (e.g., `/incidents` or `/events`), dynamically fetch a short summary of the *actual data* on that page (e.g., "Top 3 pending incidents") and inject it into the hidden `routeContext` system prompt.
- This ensures the agent can answer "Draft a report for the latest slip" without the user needing to copy-paste data in the chat.

## 5. Advanced Tool Access / Function Calling Definitions
**Goal:** Empower the HVG Agent to execute full SaaS operational workflows.
**Actions:**
Register new Gemini Tools in the backend and construct corresponding CommandCard UI components on the frontend:
1. `buildLMSCourse`: Allows the agent to draft, structure, and save new course modules directly into the `courses` Firestore collection.
2. `optimizeTransportRoutes`: Fetches all pending ride requests and mathematically groups them by geographic proximity and time, presenting a structured daily itinerary to the operator.
3. `draftIncidentReport`: Takes shorthand conversational inputs ("John slipped yesterday, alcohol, found in room") and generates a formal, structured, deeply comprehensive Incident Report matching state/compliance standards, saving it directly to Firestore.
