# PLAN-ai-sidebar.md
# HVG Intelligent AI Sidebar — Architecture & Design Spec

**Project Type:** WEB  
**Primary Agent:** `frontend-specialist` + `backend-specialist`  
**Design System:** `design-system/hvg-sidebar/MASTER.md` (+ user-specified amber/sage palette override)  
**Created:** 2026-02-26  

---

## 🧠 Brainstorm: Layout Persistence Strategy

### Context
The AI sidebar must persist its conversation state across Next.js navigation (e.g., `/events` → `/courses`). Three viable patterns exist.

---

### Option A: Zustand Store (Recommended)
A singleton Zustand store holds `messages[]`, `conversationId`, `currentContext`, and `isOpen` state. The sidebar component subscribes to the store. Because Zustand is module-level (not React tree-level), it survives route changes as long as the module stays loaded.

✅ **Pros:**
- Zero re-renders on navigation — store is not re-mounted
- Easy to hydrate from Firestore on first load
- Devtools support; easy to debug
- Works with React Server Components — only the sidebar itself is a Client Component

❌ **Cons:**
- State lost on hard refresh (acceptable — restore from Firestore)

📊 **Effort:** Low

---

### Option B: React Context in Root Layout
Wrap `app/(dashboard)/[tenantId]/layout.tsx` with an `<AIChatProvider>`.

✅ **Pros:** No extra library, familiar pattern

❌ **Cons:**
- `layout.tsx` is already a Client Component — adding another provider causes the entire layout subtree to re-render on `context` updates
- Messages updating every keystroke = expensive re-renders across all dashboard children

📊 **Effort:** Low (but performance risk)

---

### Option C: URL State (query params / search params)
Encode `conversationId` in the URL.

❌ **Cons:** Cannot encode full message history in URL. Triggers navigation events. Bad UX for a persistent sidebar.

📊 **Effort:** High

---

## 💡 Recommendation: Zustand Store + Firestore Sync

Use Zustand for runtime state + a one-time rehydration from `conversations/{convId}/messages` on mount.

```
lib/stores/aiSidebarStore.ts    ← Zustand store (singleton)
  messages[]                   ← Chat history (in memory)
  conversationId               ← Persisted to localStorage
  isOpen (sidebar toggle)
  currentRouteContext          ← Injected by usePathname() hook
  agentPersona                 ← 'recovery' | 'operator' | 'fitness'
```

---

## 🧠 Brainstorm: Route Context Injection

### How to feed the current page context to Gemini

The sidebar must "know" what page the user is on. Three approaches:

| Approach | How | Verdict |
|---|---|---|
| **A: Client-side pathname → system prompt** | `usePathname()` → map to context string → send with each message | ✅ Best — no extra API calls |
| B: URL param passed to API | Include `pathname` in POST body | ✅ Also good — same result |
| C: Server-side session cookie | Read route from server context | ❌ Over-engineered |

**Selected: Option A + B** — `usePathname()` on the client maps to a `routeContext` string. This is included in the POST body to `/api/ai/chat`. The API upgrades the system prompt with route-specific context.

**Route Context Mapping:**

```ts
// lib/ai/routeContextMap.ts
const ROUTE_CONTEXT: Record<string, string> = {
  '/events':        'The user is currently viewing the Events calendar. Pending events are relevant.',
  '/rides':         'The user is on the Transportation page. Active ride requests may be pending.',
  '/lms':           'The user is browsing the LMS course library.',
  '/lms/[courseId]/builder': 'The user is in the Course Builder — help with content creation.',
  '/chores':        'The user is viewing the Chores board. Pending assignments may need attention.',
  '/incidents':     'The user is on the Incident Log page.',
  '/houses':        'The user is managing house properties.',
  '/dashboard':     'The user is on the main dashboard overview.',
};
```

---

## 🧠 Brainstorm: Slash Command Parser

Slash commands allow users to trigger structured actions in the chat.

### Parser Design

```
Input: "/events show next 3 days"
        ↓
CommandParser.parse(input) → { command: 'events', args: 'show next 3 days' }
        ↓
CommandHandler.execute('events', args, context) → ComponentResult | TextResult
        ↓
Chat renders a "Command Component" card in the message thread
```

### Slash Command Registry

| Command | What it does | Component Pushed |
|---|---|---|
| `/events [days?]` | Show upcoming events | `<EventsMiniCard />` |
| `/chores` | Show resident's pending chores | `<ChoresMiniCard />` |
| `/rides` | Show pending transport requests | `<RidesMiniCard />` |
| `/mood [great\|good\|okay\|struggling\|crisis]` | Log mood entry | `<MoodConfirmCard />` |
| `/sobriety` | Show sobriety streak | `<SobrietyStreakCard />` |
| `/assign @resident [task]` | Assign a chore (operator only) | `<AssignChoreCard />` |
| `/schedule [event title] [date]` | Create an event (operator only) | `<CreateEventCard />` |
| `/help` | Show available commands | `<CommandHelpCard />` |

### Parser Implementation

```ts
// lib/ai/commandParser.ts
export function parseSlashCommand(input: string): SlashCommand | null {
  if (!input.startsWith('/')) return null;
  const [rawCmd, ...rest] = input.slice(1).split(' ');
  return { command: rawCmd.toLowerCase(), args: rest.join(' ') };
}
```

---

## 🎨 Design System: Sidebar Spec

### Palette Override (User-Specified: Amber + Sage)

> **Note:** The `search.py` script returned a healthcare blue palette. Per the user's specification, we override with the "Warm & Hopeful" amber/sage palette for the sidebar specifically.

| Role | Hex | Usage |
|---|---|---|
| **Primary (Amber)** | `#F59E0B` | User message bubbles, active CTA |
| **Secondary (Sage)** | `#718355` | AI response accent, agent persona indicator |
| **Background** | `#FDFBF7` | Sidebar canvas — warm off-white |
| **Panel Border** | `#E8E0D5` | Divider between dashboard content and sidebar |
| **Text** | `#1C1917` | stone-900 — readable on warm background |
| **Muted** | `#78716C` | stone-500 — timestamps, secondary labels |
| **User Bubble** | `#FEF3C7` | amber-100 background for user messages |
| **AI Bubble** | `#ECEDE8` | sage-toned background for AI responses |

### Typography
- **Font:** Inherit from dashboard (Inter) — no new font load
- **Message text:** 14px / leading-relaxed
- **Timestamps:** 11px / muted

### Sidebar Dimensions
- **Width:** `w-80` (320px) on desktop
- **Position:** Fixed right panel — sits **inside** the `lg:pl-64` content area
- **Collapsed state:** `w-12` (icon-only toggle strip)
- **Mobile:** Drawer from bottom (full-width sheet)

### Layout Change Strategy

**Current dashboard layout:**
```
┌──────────┬─────────────────────────────┐
│ Left Nav │ Header                       │
│ (64px)   ├─────────────────────────────┤
│          │ Main Content (flex-1)        │
└──────────┴─────────────────────────────┘
```

**New dashboard layout (with AI Sidebar):**
```
┌──────────┬──────────────────────┬──────┐
│ Left Nav │ Header               │      │
│ (64px)   ├──────────────────────┤  AI  │
│          │ Main Content         │ Side │
│          │ (shrinks when open)  │  bar │
└──────────┴──────────────────────┴──────┘
```

**Implementation:** The AI sidebar panel is rendered inside `layout.tsx` as a sibling to `<main>`. The `<main>` gets `pr-80` when sidebar is open. The sidebar is a `fixed right-0 top-0 h-screen w-80` panel.

---

## 🤖 Agent Personas

The system prompt switches based on `agentPersona` in the Zustand store:

| Persona | System Prompt Focus | Trigger |
|---|---|---|
| **Recovery Coach** | Sobriety support, CBT, 12-step; default for residents | User role = `resident` |
| **Operator Assistant** | House management, staffing, reports, task creation | User role = `house_manager` or `admin` |
| **Fitness Guide** | Exercise, sleep hygiene, physical recovery | User selects "Fitness" in persona picker |
| **Nutrition Guide** | Meal planning, hydration, recovery nutrition | User selects "Nutrition" in persona picker |

Persona lives in the sidebar header as a dropdown picker. The selected persona is sent as part of the system instruction to `/api/ai/chat`.

---

## 🃏 Command Component Library

Small interactive UI cards that the AI "pushes" into the chat thread when a `/command` resolves or Gemini returns structured data.

| Component | Props | What it shows |
|---|---|---|
| `EventsMiniCard` | `events: Event[]` | Scrollable list of upcoming event titles + dates |
| `ChoresMiniCard` | `chores: Chore[]` | Checkmark list with priority badges |
| `RidesMiniCard` | `rides: Ride[]` | Status badges for ride requests |
| `SobrietyStreakCard` | `days: number` | Animated counter + milestone badge |
| `MoodConfirmCard` | `mood: string`, `note: string` | Confirmation after mood log |
| `AssignChoreCard` | `resident: string`, `task: string` | Preview → confirm to write to Firestore |
| `CreateEventCard` | `title: string`, `date: string` | Preview → confirm to write to Firestore |
| `CommandHelpCard` | — | Grid of all available slash commands |

All Command Components live in `components/ai-sidebar/commands/`.

---

## 📁 File Structure

```
lib/
  stores/
    aiSidebarStore.ts         ← Zustand store (messages, convId, persona, isOpen)
  ai/
    routeContextMap.ts        ← pathname → context string mapping
    commandParser.ts          ← Slash command parser
    commandHandlers.ts        ← Execute commands → ComponentResult

components/
  ai-sidebar/
    AISidebar.tsx             ← Root sidebar container (toggle, header, messages, input)
    SidebarHeader.tsx         ← Persona picker + collapse button
    MessageList.tsx           ← Scrollable messages thread
    MessageBubble.tsx         ← User vs AI bubble styling
    ChatInput.tsx             ← Text input + send button + slash suggestions
    SlashCommandMenu.tsx      ← Autocomplete dropdown when "/" is typed
    commands/
      EventsMiniCard.tsx
      ChoresMiniCard.tsx
      RidesMiniCard.tsx
      SobrietyStreakCard.tsx
      MoodConfirmCard.tsx
      AssignChoreCard.tsx
      CreateEventCard.tsx
      CommandHelpCard.tsx

app/
  (dashboard)/
    [tenantId]/
      layout.tsx              ← [MODIFY] Add <AISidebar> + pr-80 shift logic
  api/
    ai/
      chat/
        route.ts              ← [MODIFY] Accept routeContext + persona in body; upgrade system prompt
```

---

## 📋 Task Breakdown

### Phase 0: Store + Parser (P0 — no UI yet)

#### Task 0.1 — Zustand Store
- **Agent:** `frontend-specialist`
- **INPUT:** Zustand (`npm i zustand`)
- **OUTPUT:** `lib/stores/aiSidebarStore.ts` — holds messages, convId (persisted to localStorage), isOpen, persona
- **VERIFY:** Import store in any component, confirm state persists across route navigations

#### Task 0.2 — Route Context Map
- **Agent:** `frontend-specialist`
- **OUTPUT:** `lib/ai/routeContextMap.ts`
- **VERIFY:** Unit: `getRouteContext('/events')` returns expected string

#### Task 0.3 — Slash Command Parser
- **Agent:** `frontend-specialist`
- **OUTPUT:** `lib/ai/commandParser.ts` + `commandHandlers.ts`
- **VERIFY:** `parseSlashCommand('/events 3')` → `{ command: 'events', args: '3' }`

### Phase 1: API Upgrade (P0)

#### Task 1.1 — Upgrade `/api/ai/chat/route.ts`
- **Agent:** `backend-specialist`
- **INPUT:** Add `routeContext?: string` and `persona?: string` to `ChatSchema`
- **OUTPUT:** Modified `route.ts` — inserts route context and persona persona into system instruction
- **VERIFY:** POST with `{ message: "hi", routeContext: "on events page", persona: "operator" }` → response mentions event context

#### Task 1.2 — Operator Tools (Function Calling)
- **Agent:** `backend-specialist`
- **OUTPUT:** New tools in `route.ts` for operators: `create_event`, `assign_chore`, `get_ride_requests`
- **VERIFY:** POST with `/schedule` command → Firestore event created

### Phase 2: Core Sidebar UI (P1)

#### Task 2.1 — AISidebar Container
- **Agent:** `frontend-specialist`
- **INPUT:** `aiSidebarStore`, amber/sage palette
- **OUTPUT:** `components/ai-sidebar/AISidebar.tsx` — fixed right panel, 320px, warm off-white background
- **VERIFY:** Renders without crashing; toggle opens/closes

#### Task 2.2 — SidebarHeader + Persona Picker
- **Agent:** `frontend-specialist`
- **OUTPUT:** `components/ai-sidebar/SidebarHeader.tsx`
- **VERIFY:** Dropdown changes persona in Zustand store

#### Task 2.3 — MessageBubble + MessageList
- **Agent:** `frontend-specialist`
- **OUTPUT:** `components/ai-sidebar/MessageList.tsx`, `MessageBubble.tsx`
- **VERIFY:** User messages amber-tinted, AI messages sage-tinted; auto-scroll to bottom

#### Task 2.4 — ChatInput + SlashCommandMenu
- **Agent:** `frontend-specialist`
- **OUTPUT:** `components/ai-sidebar/ChatInput.tsx`, `SlashCommandMenu.tsx`
- **VERIFY:** Typing `/` shows autocomplete menu; Enter sends message; Shift+Enter = newline

### Phase 3: Command Components (P2)

#### Task 3.1 — Core Command Cards
- **Agent:** `frontend-specialist`
- **OUTPUT:** `EventsMiniCard`, `ChoresMiniCard`, `SobrietyStreakCard`, `MoodConfirmCard`, `CommandHelpCard`
- **VERIFY:** Rendered in Storybook or directly in chat thread with mock data

#### Task 3.2 — Operator Command Cards
- **Agent:** `frontend-specialist`
- **OUTPUT:** `AssignChoreCard`, `CreateEventCard` — with confirm-to-write flow
- **VERIFY:** Clicking "Confirm" sends POST to Firestore service

### Phase 4: Layout Integration (P2)

#### Task 4.1 — Dashboard Layout: Add AI Sidebar
- **Agent:** `frontend-specialist`
- **INPUT:** `app/(dashboard)/[tenantId]/layout.tsx`
- **OUTPUT:** `<AISidebar>` rendered as sibling to `<main>`; main area adds `transition-all duration-300 pr-0 lg:pr-80`
- **VERIFY:** Navigate from `/events` to `/courses` — sidebar state and messages persist; no flash

#### Task 4.2 — Mobile Drawer
- **Agent:** `frontend-specialist`
- **OUTPUT:** Bottom sheet variant for `< lg` breakpoints
- **VERIFY:** On 375px viewport, sidebar appears as bottom drawer

### Phase 5: Chat Persistence (P2)

#### Task 5.1 — Firestore Sync
- **Agent:** `backend-specialist`
- **OUTPUT:** On sidebar mount, load last 20 messages from `conversations/{convId}/messages`
- **VERIFY:** Hard refresh → messages reload from Firestore

#### Task 5.2 — Cross-app Sync (Mobile)
- **Agent:** `mobile-developer`
- **OUTPUT:** Mobile chat reads same `conversations/{convId}` collection
- **VERIFY:** Send message on web → appears in mobile app

---

## 🎯 Success Criteria

- [ ] Sidebar state (messages) survives navigation between all dashboard routes
- [ ] `usePathname()` route context injected into every Gemini request
- [ ] Slash commands parse and resolve to Command Component cards
- [ ] Operator role sees operator tools; resident role sees recovery tools
- [ ] Amber user bubbles / sage AI bubbles render at correct contrast ratio (4.5:1+)
- [ ] Dashboard main content area shrinks by 320px when sidebar is open
- [ ] Mobile: sidebar renders as bottom drawer on < lg breakpoints
- [ ] Chat history loaded from Firestore on mount (last 20 messages)
- [ ] `npm run build` passes with no TypeScript errors

---

## ⛔ Constraints / Rules

1. **Do NOT modify** `components/dashboard/Sidebar.tsx` or `app/(dashboard)/[tenantId]/layout.tsx` until this plan is approved
2. **No purple/violet** hex codes — amber and sage only; never the AI purple anti-pattern
3. **Crisis intercept** — existing system prompt already handles `crisis` mood and 988 lifeline — keep it in operator persona too
4. **The existing `/api/ai/chat/route.ts`** is the foundation — extend it, don't rewrite it
5. **Operator-only commands** (`/assign`, `/schedule`) must check `userRole` server-side before writing to Firestore

---

## Phase X: Verification Checklist

```bash
# Lint
npm run lint

# TypeScript
npx tsc --noEmit

# Security scan
python .agent/skills/vulnerability-scanner/scripts/security_scan.py .

# UX audit (after build)
python .agent/skills/frontend-design/scripts/ux_audit.py .

# Build
npm run build

# Manual E2E:
# 1. Open /[tenantId]/events
# 2. Send "What events do I have?" → Gemini calls get_upcoming_events tool
# 3. Navigate to /[tenantId]/chores
# 4. Confirm messages still visible (persistence test)
# 5. Type "/chores" → ChoresMiniCard renders in thread
# 6. Type "/mood great I feel good today" → MoodConfirmCard appears
# 7. Resize to 375px → sidebar becomes bottom drawer
```
