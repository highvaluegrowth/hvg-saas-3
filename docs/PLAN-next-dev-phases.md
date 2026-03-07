# HVG Platform — Next Dev Phases Master Plan

> **Type:** PLANNING  
> **Created:** 2026-03-07  
> **Status:** 🟡 Ready for Implementation  
> **Stack:** Next.js 14+ · Tailwind CSS · Firebase Firestore · TypeScript

---

## Overview

Six coordinated development phases to advance the HVG SaaS platform. Each phase is designed as a **self-contained prompt** — copy-paste it verbatim to start that phase. Phases are ordered by dependency (2 and 3 share the Inbox concept; 1 is a prerequisite visual layer for all others).

---

## Dependency Map

```
Phase 1 (SaaS UI)
   └── Phase 3 (Global Navbar) — depends on Phase 1 dark tokens
         └── Phase 2 (Unified Inbox) — Inbox icon in Navbar points here

Phase 4 (Blog Engine)   — independent, can run in parallel with Phase 3
Phase 5 (Docs Cleanup)  — independent, can run any time
Phase 6 (Landing Page Generator) — depends on Phase 1 design system
```

**Recommended execution order:**  
`Phase 1 → Phase 3 → Phase 2` (in sequence) | `Phase 4, 5, 6` (can run in parallel after Phase 1)

---

## Phase 1 — SaaS UI Dark Theme Overhaul

**Status:** 🟡 Pending  
**Scope:** Dashboard shell + all interior page surfaces

### Context
The marketing landing page was fully migrated to a dark, glassmorphic Tailwind design (dark navy `#0C1A2E`, cyan `#0891B2`, emerald `#34D399`, `rgba(255,255,255,0.05)` glass cards). The dashboard `Header.tsx` and `Sidebar.tsx` are still the original light theme (`bg-white border-gray-200`, `text-gray-700`, `text-gray-900`). All interior page surfaces (dashboard home, residents, LMS, etc.) inherit this light shell.

### Design Token Reference (from landing page)
| Token | Value |
|---|---|
| Page background | `#0C1A2E` |
| Sidebar background | `#060E1A` (darkest navy) |
| Header/navbar | `rgba(8,26,46,0.92)` + `backdrop-blur-md` |
| Card surface | `rgba(255,255,255,0.05)` |
| Card border | `rgba(255,255,255,0.08)` |
| Primary accent | `#0891B2` (cyan) |
| Positive accent | `#34D399` (emerald) |
| Heading text | `white` |
| Body text | `rgba(255,255,255,0.65)` |
| Muted text | `rgba(255,255,255,0.4)` |
| Active nav item | `rgba(8,145,178,0.15)` bg + `#67E8F9` text |

### Files to Update
| File | Change |
|---|---|
| `components/dashboard/Header.tsx` | Dark glassmorphic header, dark icon tints |
| `components/dashboard/Sidebar.tsx` | Dark navy sidebar, dark active states |
| `app/(dashboard)/[tenantId]/layout.tsx` | Dark shell background |
| All interior page containers | Replace `bg-white`, `bg-gray-50`, card/table surfaces |

### Copy-Paste Prompt (Phase 1)
```
@[/Users/peter/Desktop/hvg-saas-3/.agent/workflows/ui-ux-pro-max.md]
@[/Users/peter/Desktop/hvg-saas-3/.agent/agents/frontend-specialist.md]
@[/Users/peter/Desktop/hvg-saas-3/.agent/skills/tailwind-patterns]
@[/Users/peter/Desktop/hvg-saas-3/.agent/skills/frontend-design]
@[/Users/peter/Desktop/hvg-saas-3/.agent/skills/nextjs-react-expert]

## Task: SaaS Dashboard Dark Theme Migration

Apply the same dark, glassmorphic Tailwind design used on the marketing
landing page to the entire SaaS dashboard shell and interior pages.

### Reference Design (already implemented on landing page)
- Background: #0C1A2E (page), #060E1A (sidebar)
- Header: rgba(8,26,46,0.92) + backdrop-blur-md
- Cards: rgba(255,255,255,0.05) bg, rgba(255,255,255,0.08) border
- Accents: #0891B2 cyan, #34D399 emerald
- Text: white headings, rgba(255,255,255,0.65) body, rgba(255,255,255,0.4) muted
- Active nav: rgba(8,145,178,0.15) bg + #67E8F9 text

### Files to Update (priority order)
1. components/dashboard/Header.tsx — dark glassmorphic header
2. components/dashboard/Sidebar.tsx — dark navy sidebar + dark active states
3. app/(dashboard)/[tenantId]/layout.tsx — dark shell background
4. All interior dashboard pages — replace bg-white/bg-gray-50 with dark surfaces

### Rules
- Do NOT change any content, data logic, or routing
- Preserve all existing functionality (auth, role checks, org switcher)
- Keep the sidebar collapse animation working
- Use inline styles for color tokens (not new Tailwind config changes)
- Do not use purple/violet in any color
- Run: npx eslint + npx tsc --noEmit before committing
```

---

## Phase 2 — Unified Inbox

**Status:** 🟡 Pending  
**Dependencies:** Phase 1 (styling), Phase 3 (Navbar entry point)  
**Route:** `/[tenantId]/inbox`

### What It Unifies
| Source | Object Type |
|---|---|
| Resident applications | `applications` collection |
| Join requests | `joinRequests` collection |
| Incident reports (incoming) | `incidents` collection |
| Message threads | TBD (new) |
| System notifications | New `notifications` collection |

### Data Model (Firestore)
```
notifications/{notifId}
  tenantId: string
  type: 'application' | 'join_request' | 'incident' | 'message' | 'system'
  refId: string          // ID of the source document
  refCollection: string  // source collection name
  title: string
  preview: string        // first 120 chars of content
  isRead: boolean
  createdAt: Timestamp
  priority: 'high' | 'normal' | 'low'
  actorName?: string     // who triggered it
  actorId?: string
```

### UI Design
- Left panel: filterable list (all / type tabs / unread only)
- Right panel: detail view with inline action buttons (Accept, Decline, Reply, Archive)
- Unread badge count visible on Inbox nav icon in global navbar
- Real-time updates via Firestore `onSnapshot`

### Copy-Paste Prompt (Phase 2)
```
@[/Users/peter/Desktop/hvg-saas-3/.agent/workflows/ui-ux-pro-max.md]
@[/Users/peter/Desktop/hvg-saas-3/.agent/agents/frontend-specialist.md]
@[/Users/peter/Desktop/hvg-saas-3/.agent/skills/tailwind-patterns]
@[/Users/peter/Desktop/hvg-saas-3/.agent/skills/frontend-design]
@[/Users/peter/Desktop/hvg-saas-3/.agent/skills/nextjs-react-expert]

## Task: Build Unified Inbox

Build a Unified Inbox at /[tenantId]/inbox that aggregates all incoming
objects from across the platform into a single, filterable view.

### Sources to aggregate
- Resident applications (applications collection)
- Join requests (joinRequests collection)
- Incoming incident reports (incidents collection)
- System notifications (new notifications collection)

### Firestore data model (create if not exists)
notifications/{notifId}: { tenantId, type, refId, refCollection,
  title, preview(120 chars), isRead, createdAt, priority, actorName, actorId }

### UI requirements
- Two-panel layout: list (left) + detail (right)
- List panel: type tabs (All / Applications / Requests / Incidents / System)
            + Unread toggle + time-sorted entries with unread dot indicators
- Detail panel: full content, inline action buttons (Accept/Decline/Reply/Archive)
              + marks as read automatically on open
- Real-time: use Firestore onSnapshot for live updates
- Unread badge count exposed via a Zustand store so the Navbar icon can show it

### Design tokens (match dashboard dark theme from Phase 1)
- Background: #0C1A2E, Cards: rgba(255,255,255,0.05), Borders: rgba(255,255,255,0.08)
- Unread indicator dot: #0891B2, High priority: #EF4444, Normal: #34D399

### Files to create/update
- app/(dashboard)/[tenantId]/inbox/page.tsx (new)
- components/inbox/InboxList.tsx (new)
- components/inbox/InboxDetail.tsx (new)
- lib/stores/inboxStore.ts (Zustand — unread count)
- features/inbox/inboxService.ts (Firestore queries)
- lib/constants/navigation.ts — add Inbox to nav items

### Rules
- No content or routing changes to existing pages
- Run: npx eslint + npx tsc --noEmit before committing
```

---

## Phase 3 — Global Navbar (Quick Actions Bar)

**Status:** 🟡 Pending  
**Dependencies:** Phase 1 (dark tokens)  
**File:** `components/dashboard/Header.tsx`

### Current State
The `Header.tsx` has: mobile hamburger | tenant name | AI toggle | notifications placeholder | user dropdown.

### Target State
```
[Mobile ☰]  [Tenant Name]  [Global Search ____________]  [📅][📋][📒][📥(n)][🤖]  [User]
             ← existing ←   ← NEW ──────────────────────→  ← icon group →      ← existing →
```

| Icon | Target Route | Badge |
|---|---|---|
| 📅 Calendar | `/${tenantId}/events` | none |
| 📋 Kanban | `/${tenantId}/kanban` | none |
| 📒 Directory | `/${tenantId}/directory` | none |
| 📥 Inbox | `/${tenantId}/inbox` | unread count from `inboxStore` |

### Global Search
- Fuzzy search across: Residents, Staff, Houses, Events, LMS Courses
- Built with: `cmdk` (open source, 0 dependencies) or a custom modal
- Keyboard shortcut: `⌘K` / `Ctrl+K`
- Results grouped by type, keyboard-navigable

### Copy-Paste Prompt (Phase 3)
```
@[/Users/peter/Desktop/hvg-saas-3/.agent/workflows/ui-ux-pro-max.md]
@[/Users/peter/Desktop/hvg-saas-3/.agent/agents/frontend-specialist.md]
@[/Users/peter/Desktop/hvg-saas-3/.agent/skills/tailwind-patterns]
@[/Users/peter/Desktop/hvg-saas-3/.agent/skills/frontend-design]
@[/Users/peter/Desktop/hvg-saas-3/.agent/skills/nextjs-react-expert]

## Task: Global Navbar — Quick Actions + Global Search

Upgrade components/dashboard/Header.tsx to add icon button quick links
and a global search bar. The header sits between the sidebar and AI chat.

### Icon buttons to add (left to right in icon group)
1. Calendar → /${tenantId}/events
2. Kanban   → /${tenantId}/kanban
3. Directory → /${tenantId}/directory
4. Inbox    → /${tenantId}/inbox (show unread badge from inboxStore Zustand)

### Global Search
- Add a search bar in the center of the header
- Keyboard shortcut ⌘K / Ctrl+K to open a search modal
- Search across: Residents, Staff, Houses, Events, LMS Courses via Firestore
- Results grouped by type, keyboard-navigable, click → navigate to detail page
- Consider using the 'cmdk' npm package for the command palette experience

### Design tokens (match Phase 1 dark dashboard)
- Header bg: rgba(8,26,46,0.92) backdrop-blur-md
- Icon default: rgba(255,255,255,0.45), hover: white
- Active icon: #67E8F9
- Search bar bg: rgba(255,255,255,0.06), border: rgba(255,255,255,0.1)
- Unread badge: #0891B2 bg, white text, absolute top-right of inbox icon

### Files to update
- components/dashboard/Header.tsx (main change)
- lib/stores/inboxStore.ts (read unreadCount — created in Phase 2)

### Rules
- Do NOT change the AI sidebar toggle — keep it in place
- Do NOT change the user info / logout section
- Icons should be 20×20px, with a 36×36px click target
- Search modal must be keyboard-accessible (Arrow keys, Enter, Escape)
- Run: npx eslint + npx tsc --noEmit before committing
```

---

## Phase 4 — Blog Engine (AI-Generated Posts)

**Status:** 🟡 Pending  
**Dependencies:** None (independent)

### Architecture Decision

**Recommendation: Build from scratch (not a third-party CMS)**

Rationale:
- The blog already has routes: `/blog`, `/[tenantId]/blog/`, `api/blog`, `api/tenants/[tenantId]/blog`
- You need **AI generation** (not just editing) — that's custom no matter what
- Third-party CMSes (Contentful, Sanity) add cost & complexity with no AI generation out of the box
- Building gives: full Firestore integration, tenant-aware multi-blog, role auth already wired in

**If you want a pre-built editor UI** → `Tiptap` (open source, MIT, rich text editor with extensions) is the go-to: `https://tiptap.dev`

### Feature Set
| Feature | Implementation |
|---|---|
| AI post generation | Gemini API — prompt from house activity feed |
| Rich text editor | Tiptap (MIT, no cost) |
| Multi-blog | Tenant-scoped: `/[tenantId]/blog` |
| Platform blog | Admin-only: `/blog` |
| Scheduling | `publishAt: Timestamp` field + cron/Cloud Function |
| SEO | Auto-generate `meta description` + `og:image` via AI |
| Categories + Tags | Firestore array fields |

### AI Generation Sources (what to feed the prompt)
1. Recent incidents resolved (anonymized)
2. Recent LMS completions & milestones
3. Upcoming events
4. Resident milestone streaks (anonymized)
5. Platform feature announcements

### Copy-Paste Prompt (Phase 4)
```
@[/Users/peter/Desktop/hvg-saas-3/.agent/workflows/ui-ux-pro-max.md]
@[/Users/peter/Desktop/hvg-saas-3/.agent/agents/frontend-specialist.md]
@[/Users/peter/Desktop/hvg-saas-3/.agent/agents/backend-specialist.md]
@[/Users/peter/Desktop/hvg-saas-3/.agent/skills/tailwind-patterns]

## Task: Build AI Blog Engine

Build a complete blog system with AI-generated post drafts using Gemini.
Blog routes already exist at /blog and /[tenantId]/blog.

### Firestore data model
posts/{postId}: { tenantId (null = platform blog), title, slug, content(html),
  excerpt, status: 'draft'|'scheduled'|'published', publishAt, authorId,
  category, tags[], seoTitle, seoDescription, imageUrl, aiGenerated: boolean,
  createdAt, updatedAt }

### Blog admin UI (dashboard)
- /[tenantId]/blog — list of posts with status pills + Create button
- /[tenantId]/blog/new — create with Tiptap editor + AI generate button
- /[tenantId]/blog/[postId]/edit — edit existing post

### AI Generation flow
- "Generate with AI" button opens a modal: select topic sources (activity/events/milestones)
- Call /api/ai/blog-generate with the selected data context
- Returns: title, content (html), excerpt, seoDescription
- User reviews in Tiptap editor before publishing

### Public blog UI
- /blog — platform blog (SEO: open graph, JSON-LD schema)
- /[tenantId-slug]/blog — tenant public blog page (future)

### Tech choices
- Rich text editor: Tiptap (install: npm install @tiptap/react @tiptap/starter-kit)
- AI: Google Gemini API (already in project via Firebase AI Logic or genkit)
- Images: Firebase Storage for cover images

### Rules
- Platform blog posts are admin-only (check user.role === 'super_admin')
- Tenant blog posts respect existing RBAC (house_manager and above)
- Do not use purple/violet anywhere
- Run: npx eslint + npx tsc --noEmit before committing
```

---

## Phase 5 — Standardized Documentation

**Status:** 🟡 Pending  
**Dependencies:** None (independent)  
**Location:** `/docs` directory

### Current State (`/docs`)
11 existing PLAN files of varying completeness:
- `PLAN-ai-sidebar.md` (17KB — largest, likely most complete)
- `PLAN-landing-page.md` (13KB)
- `PLAN-omni-onboarding.md` (6.7KB)
- `PLAN-coursera-lms.md` (5.2KB)
- `PLAN-hvg-agent-saas.md`, `PLAN-saas-agent-differentiation.md`
- `PLAN-auth-unification.md`, `PLAN-beta-launch.md`, `PLAN-global-visual-alignment.md`
- `PLAN-auth-testing.md` (1.7KB — smallest)
- `/docs/plans/` subdirectory with 6 more files

### Target Structure
```
docs/
  README.md                    ← Index + sticky nav (TOC)
  STATUS.md                    ← Master checklist: done / in-progress / planned
  phases/
    phase-1-saas-ui.md
    phase-2-unified-inbox.md
    phase-3-global-navbar.md
    phase-4-blog-engine.md
    phase-5-documentation.md
    phase-6-landing-generator.md
  archive/
    [original PLAN files moved here]
  ARCHITECTURE.md              ← High-level system diagram
  CODEBASE.md                  ← File dependency map (if not at root)
```

### Copy-Paste Prompt (Phase 5)
```
@[/Users/peter/Desktop/hvg-saas-3/.agent/agents/project-planner.md]
@[/Users/peter/Desktop/hvg-saas-3/.agent/skills/plan-writing]
@[/Users/peter/Desktop/hvg-saas-3/.agent/skills/documentation-templates]

## Task: Standardize /docs directory

Consolidate and standardize all planning documentation in the /docs directory.

### Current state
11 PLAN-*.md files in /docs, 6 more in /docs/plans — varying formats,
some complete, some stale. No index. No master status tracker.

### Target structure
docs/
  README.md       — project index with anchor-linked TOC (sticky nav via HTML anchor)
  STATUS.md       — master checklist: ✅ done, 🚧 in-progress, 📋 planned
  phases/         — one clean doc per feature phase (migrate from PLAN files)
  archive/        — move original PLAN files here (do not delete)
  ARCHITECTURE.md — high-level system diagram (Mermaid)

### For each existing PLAN file
1. Read the file
2. Identify what has been COMPLETED vs what remains
3. Write a clean phase doc in docs/phases/ with:
   - ## Overview
   - ## Completed ✅ (checklist)
   - ## Remaining 📋 (checklist)
   - ## Notes

### For STATUS.md
- Top-level master view: all features across all phases
- Format: | Feature | Status | Phase Doc | Notes |

### For README.md
- Project name, description, quick links
- Anchor-linked TOC to every section in every phase doc
- "Sticky nav" = HTML <details> ToC block at top of each doc

### Rules
- Do NOT delete any existing files — move to docs/archive/
- Do NOT modify any source code
- Every doc should be scannable in under 60 seconds
```

---

## Phase 6 — Tenant Landing Page Generator

**Status:** 🟡 Pending  
**Dependencies:** Phase 1 (dark design system)

### Architecture Decision

**Recommendation: Template-based self-hosted generator (no third-party CMS)**

| Option | Pros | Cons |
|---|---|---|
| **Self-built (recommended)** | Full control, no licensing, already have design system | Build time ~2–3 days |
| Ghost CMS (open source) | Great blog + pages, easy deploy | No tenant isolation, separate DB |
| Payload CMS (open source) | TypeScript-native, flexible | Heavy, separate setup |
| BuilderIO / Webflow | Visual editor out of box | Cost, vendor lock-in |

**Recommended approach:** Use the HVG landing page as a Firestore-stored template. Tenants customize headline, color accent, logo, and CTA text via a simple form. Publish = generate a static Next.js page at `/sites/[tenant-slug]` via `generateStaticParams` + revalidation.

### Feature Set
| Feature | Implementation |
|---|---|
| Template | HVG landing page sectioned & parameterized |
| Customization UI | Form: logo, headline, accent color, CTA text, contact info |
| Live preview | `<iframe>` preview with real-time prop passing |
| Publish | Writes to Firestore → triggers Next.js revalidation |
| Custom domain | CNAME instructions + Vercel domain API |
| Analytics | Vercel Analytics or `pageview` event to Firestore |

### Copy-Paste Prompt (Phase 6)
```
@[/Users/peter/Desktop/hvg-saas-3/.agent/workflows/ui-ux-pro-max.md]
@[/Users/peter/Desktop/hvg-saas-3/.agent/agents/frontend-specialist.md]
@[/Users/peter/Desktop/hvg-saas-3/.agent/agents/backend-specialist.md]
@[/Users/peter/Desktop/hvg-saas-3/.agent/skills/tailwind-patterns]
@[/Users/peter/Desktop/hvg-saas-3/.agent/skills/nextjs-react-expert]

## Task: Tenant Landing Page Generator

Build a one-click landing page generator for tenants. Use the HVG marketing
landing page as the base template. Tenants customize it and publish their
own sober living house landing page.

### Architecture
- Template: parameterize the HVG marketing landing page sections
- Customization: form-based (headline, logo, accent color, CTA text, phone, address)
- Preview: iframe showing /sites/preview?...params in real time
- Storage: Firestore landingPages/{tenantId} document
- Public URL: /sites/[tenant-slug] (Next.js dynamic route + ISR)
- Publish: button writes Firestore doc + triggers revalidatePath('/sites/[slug]')

### Firestore data model
landingPages/{tenantId}: { slug, isPublished, publishedAt, heroHeadline,
  heroSubheadline, ctaText, ctaLink, accentColor, logoUrl, phone, address,
  email, beds, certifications[], testimonials[], createdAt, updatedAt }

### Dashboard UI (tenant admin)
- /[tenantId]/marketing/landing — customize + preview split-pane view
- Left: form fields with live state
- Right: iframe preview that updates on field change
- "Publish" button at top right

### Public site
- /sites/[tenant-slug] — rendered from Firestore landingPages doc
- ISR revalidation on publish (revalidatePath)
- OG tags auto-generated from landingPages data
- SEO: title, description, canonical URL

### Design tokens
Match the HVG dark design system (Phase 1):
#0C1A2E bg, rgba(255,255,255,0.05) cards, tenant accentColor replaces
#0891B2 as primary throughout the template

### Rules
- Tenant cannot publish if isPublished fields are incomplete (validate on server)
- Custom domain support is future scope — leave a placeholder comment
- Do not use purple/violet
- Run: npx eslint + npx tsc --noEmit before committing
```

---

## Master Checklist

| # | Phase | Status | Estimated Effort |
|---|---|---|---|
| 1 | SaaS UI Dark Theme | 📋 Planned | 4–6 hours |
| 2 | Unified Inbox | 📋 Planned | 6–8 hours |
| 3 | Global Navbar | 📋 Planned | 3–4 hours |
| 4 | Blog Engine (AI) | 📋 Planned | 8–12 hours |
| 5 | Docs Consolidation | 📋 Planned | 2–3 hours |
| 6 | Landing Page Generator | 📋 Planned | 8–12 hours |

**Total estimated:** ~31–45 dev hours (AI-assisted, prompt-driven)

---

## Verification Checklist (after each phase)

```bash
# Run after every phase
npx eslint components/ app/ lib/ features/
npx tsc --noEmit
npm run build

# Optional: visual check
python .agent/scripts/checklist.py . --url http://localhost:3000
```

---

*Generated by project-planner via /orchestrate · 2026-03-07*
