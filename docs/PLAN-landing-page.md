# PLAN-landing-page.md
# Phase 6: High-Converting Landing Page

**Project Type:** WEB  
**Primary Agent:** `frontend-specialist` + `seo-specialist`  
**Design System:** `design-system/hvg-marketing/MASTER.md`  
**Created:** 2026-02-26  

---

## 🧠 Brainstorm: Funnel Strategy

### Context
HVG serves three distinct users from one URL:
1. **Operators** — sober-living house managers making B2B SaaS buying decisions
2. **Applicants** — individuals seeking a sober-living bed (HIPAA-sensitive)
3. **Solo Users** — individuals wanting AI recovery support (no operator required)

**Hard Constraint:** "Find a Bed" and "Solo Recovery" must funnel to the **mobile app** (App Store / Play Store), not collect data on the web. HIPAA compliance requires that sensitive intake happens inside the native app.

---

### Option A: Single Page with 3 Segmented CTAs (Recommended)

One unified landing page with a sticky hero that surfaces 3 distinct CTAs, then scrolls into persona-specific sections.

**Hero CTA row:**
```
[ Schedule a Demo ]   [ Find a Bed → App ]   [ Solo Recovery → App ]
   (Calendly form)      (App Store/Play)        (App Store/Play)
```

**Section flow:**
1. Hero — Headline + 3 CTAs
2. Problem/Solution — "The real problem with sober living today"
3. Platform Showcase — LMS Builder (Operator) / Resident App (Resident) split
4. Social Proof — Testimonials + metrics
5. AI Recovery Guide feature highlight
6. Demo CTA (Operator) + App download banner (Resident/Solo)
7. Footer

✅ **Pros:**
- Single SEO URL — all authority concentrates on one page (`highvaluegrowth.com`)
- Simpler to maintain — one codebase, one update cycle
- Unified social proof and brand storytelling
- E-E-A-T signals stay on one domain entity

❌ **Cons:**
- Longer page = higher bounce risk on mobile
- Slightly harder to A/B test CTAs independently

📊 **Effort:** Medium

---

### Option B: 3 Segmented Landing Pages

Separate pages: `/operators`, `/find-a-bed`, `/solo-recovery`

✅ **Pros:**
- Hyper-targeted messaging per persona
- Easier A/B testing per funnel

❌ **Cons:**
- SEO authority splits across 3 URLs
- 3x the maintenance
- B2B SaaS buyers often evaluate by scrolling, not by clicking nav links
- Identity-affirming language for recovery audiences risks HIPAA exposure on public URLs

📊 **Effort:** High

---

### Option C: Hybrid — One Page, Modular Scroll Anchors

Same as Option A but with `/operators`, `/residents`, `/solo` as anchor hash links (`/#operators`) for deep-linking from ads.

✅ **Pros:**
- Best of both: single SEO URL + campaign trackability via UTM + anchors
- No SEO authority split

❌ **Cons:**
- Slightly more complex routing logic

📊 **Effort:** Medium-Low

---

## 💡 Recommendation: Option C (Hybrid)

**Single page** at `app/(marketing)/page.tsx` with scroll anchors `#operators`, `#residents`, `#solo`. This maximizes SEO authority concentration, allows Google Ads / Meta Ads to deep-link to personas, and avoids duplicate content.

---

## 🎨 MagicUI Component Brainstorm

| Feature to Showcase | Best MagicUI Component | Rationale |
|---|---|---|
| Gemini AI Recovery Guide | **Bento Grid** | 2×2 or 3×3 tile layout showing AI conversation, progress, streak — communicates multi-feature richness at a glance. Excellent for healthcare SaaS credibility. |
| LMS Builder | **Bento Grid** | Split tiles: Course Creator / Quiz Engine / Leaderboard. Operators can visually parse the value instantly. |
| Platform Stats / Social Proof | **Marquee** | Scrolling testimonials or "Trusted by X sober-living operators" logos. Low-animation, high-trust. |
| Real-time Feature Demo | **Orbiting Circles** | Works well for the AI agent ecosystem view — showing Firebase, Gemini, Notifications orbiting a central "Recovery Hub" icon. Premium feel that impresses operators. |

**Final selection:**
- ✅ **Bento Grid** — LMS section + AI Recovery section
- ✅ **Marquee** — Testimonials / operator logos
- ✅ **Orbiting Circles** — AI ecosystem showcase (optional, Phase 6.2)

---

## 🏗 Architecture

### Route Group
```
app/
  (marketing)/         ← NEW — isolated from dashboard
    layout.tsx         ← Marketing layout (no auth, no sidebar)
    page.tsx           ← Main landing page (/)
    opengraph-image.tsx (optional)
  (dashboard)/         ← EXISTING — untouched
  (auth)/              ← EXISTING — untouched
```

The existing `app/page.tsx` (currently 106 bytes, likely a redirect) gets replaced by putting the full marketing page inside `(marketing)/`.

### Design System
- **File:** `design-system/hvg-marketing/MASTER.md`
- **Colors:** Primary `#0891B2`, CTA `#059669`, BG `#ECFEFF`, Text `#164E63`
- **Fonts:** Figtree (headings) + Noto Sans (body)
- **Style:** Neumorphism-inspired soft shadows, clean whitespace, rounded 12-16px
- **No:** Purple, neon, heavy animations, emoji icons

---

## 📐 Page Sections

| # | Section | Purpose | Persona(s) | CTA |
|---|---|---|---|---|
| 1 | **Floating Navbar** | Brand + "Schedule Demo" sticky | All | → Demo form |
| 2 | **Hero** | Headline, sub, 3 CTA buttons | All | Demo / Find Bed / AI Recovery |
| 3 | **Problem Statement** | Pain points pre/post HVG | Operators + Residents | — |
| 4 | **Platform Overview** | Bento Grid: LMS + Property Mgmt | Operators | → Demo |
| 5 | **Resident App Preview** | Mobile app screens (mocks) | Residents + Solo | → App Store / Play |
| 6 | **AI Recovery Guide** | Bento Grid: Gemini AI features | Solo + Residents | → App |
| 7 | **Social Proof** | Marquee testimonials + metrics | All | — |
| 8 | **Demo CTA** | Calendly embed or form | Operators | → Schedule |
| 9 | **Footer** | Links + App badges + Legal | All | — |

---

## 🎯 Conversion Goals

| Persona | Primary CTA | Destination | Compliance |
|---|---|---|---|
| Operators | "Schedule a Demo" | `/api/demo` form or Calendly embed | Standard |
| Applicants | "Find a Bed" | iOS App Store + Google Play | HIPAA ✅ |
| Solo Users | "Start Recovery Support" | iOS App Store + Google Play | HIPAA ✅ |

---

## 🔍 SEO Strategy (E-E-A-T)

**Target Keywords:**
- Primary: "sober living software", "recovery house management software"
- Secondary: "AI recovery support app", "addiction recovery app"
- Long-tail: "how to manage sober living house software"

**Schema Markup:** `Organization` + `SoftwareApplication` + `FAQPage`

**Meta Tags:**
- Title: `HVG — Sober Living Management & Recovery Platform | High Value Growth`
- Description: `All-in-one platform for sober living operators: property management, resident LMS, AI recovery guide, and scheduling. HIPAA-aware.`

**GEO (AI Search):**
- FAQ section answering "What is sober living software?"
- Comparison table: HVG vs. manual spreadsheets
- Original stat: "X% of residents who complete LMS courses stay sober 6+ months"

---

## 📁 File Structure

```
app/
  (marketing)/
    layout.tsx              ← Marketing layout (Figtree/Noto, no auth)
    page.tsx                ← Full landing page (all sections)
  
components/
  marketing/
    HeroSection.tsx         ← Hero + 3 CTAs
    ProblemSection.tsx      ← Problem/Solution split
    PlatformSection.tsx     ← Bento Grid: LMS + Property features
    ResidentAppSection.tsx  ← Mobile app mockup display
    AIRecoverySection.tsx   ← Bento Grid: Gemini AI features
    SocialProofSection.tsx  ← Marquee testimonials
    DemoCTASection.tsx      ← Calendly form / demo request
    MarketingNavbar.tsx     ← Floating nav with Demo CTA
    MarketingFooter.tsx     ← Links + App Store badges
    AppStoreBadges.tsx      ← iOS + Android download badges

design-system/
  hvg-marketing/
    MASTER.md               ← ✅ GENERATED (Global Source of Truth)
    pages/
      landing.md            ← Page-specific overrides (if needed)
```

---

## 📋 Task Breakdown

### Phase 1: Foundation (P0)

#### Task 1.1 — Marketing Layout
- **Agent:** `frontend-specialist`
- **Skill:** `frontend-design`
- **INPUT:** `design-system/hvg-marketing/MASTER.md`, Figtree + Noto Sans fonts
- **OUTPUT:** `app/(marketing)/layout.tsx` — isolated layout with fonts, no auth checks
- **VERIFY:** `npm run dev` → visit `/` → no dashboard sidebar appears

#### Task 1.2 — Marketing Navbar
- **Agent:** `frontend-specialist`
- **Skill:** `frontend-design`
- **INPUT:** MASTER.md colors, floating nav pattern (top-4 left-4 right-4 spacing)
- **OUTPUT:** `components/marketing/MarketingNavbar.tsx` — floating, sticky, "Schedule Demo" CTA
- **VERIFY:** Scroll tests on mobile 375px and desktop 1440px — no layout shift

### Phase 2: Hero + CTA (P0)

#### Task 2.1 — Hero Section
- **Agent:** `frontend-specialist`
- **Skill:** `frontend-design`
- **INPUT:** 3 CTAs (Demo form, App Store links), headline copy
- **OUTPUT:** `components/marketing/HeroSection.tsx`
- **VERIFY:** All 3 buttons render, App Store links open correct URLs

#### Task 2.2 — App Store Badges Component
- **Agent:** `frontend-specialist`
- **INPUT:** Official Apple/Google badge SVGs
- **OUTPUT:** `components/marketing/AppStoreBadges.tsx`
- **VERIFY:** Links use `href` with `target="_blank" rel="noopener"`

### Phase 3: Content Sections (P1)

#### Task 3.1 — Problem/Solution Section
- **Agent:** `frontend-specialist` + `seo-specialist`
- **OUTPUT:** `components/marketing/ProblemSection.tsx`
- **VERIFY:** Contains H2, semantic structure, no purple colors

#### Task 3.2 — Platform Bento Grid (LMS + Property)
- **Agent:** `frontend-specialist`
- **Skill:** `frontend-design`
- **INPUT:** MagicUI Bento Grid component
- **OUTPUT:** `components/marketing/PlatformSection.tsx`
- **VERIFY:** Bento tiles display at 375px without overflow

#### Task 3.3 — Resident App Section (Mobile Mocks)
- **Agent:** `frontend-specialist`
- **OUTPUT:** `components/marketing/ResidentAppSection.tsx`
- **VERIFY:** App Store badges link to correct stores

#### Task 3.4 — AI Recovery Bento Grid
- **Agent:** `frontend-specialist`
- **OUTPUT:** `components/marketing/AIRecoverySection.tsx`
- **VERIFY:** No AI purple/pink gradients (anti-pattern per MASTER.md)

#### Task 3.5 — Social Proof Marquee
- **Agent:** `frontend-specialist`
- **INPUT:** MagicUI Marquee component, `prefers-reduced-motion` rule
- **OUTPUT:** `components/marketing/SocialProofSection.tsx`
- **VERIFY:** Pauses on hover, respects `prefers-reduced-motion`

### Phase 4: Demo CTA + Footer (P1)

#### Task 4.1 — Demo CTA Section
- **Agent:** `frontend-specialist` + `backend-specialist`
- **OUTPUT:** `components/marketing/DemoCTASection.tsx` + `/api/demo/route.ts`
- **VERIFY:** Form submits → email sent or Calendly redirect

#### Task 4.2 — Marketing Footer
- **Agent:** `frontend-specialist`
- **OUTPUT:** `components/marketing/MarketingFooter.tsx`
- **VERIFY:** App Store badges, legal links, nav links present

### Phase 5: SEO (P2)

#### Task 5.1 — Metadata + Schema
- **Agent:** `seo-specialist`
- **Skill:** `seo-fundamentals`
- **OUTPUT:** Updated `page.tsx` metadata export, JSON-LD in layout
- **VERIFY:** `<title>` and `<meta name="description">` present in page source

#### Task 5.2 — FAQ Section (GEO)
- **Agent:** `seo-specialist`
- **OUTPUT:** `components/marketing/FAQSection.tsx` with `FAQPage` schema
- **VERIFY:** JSON-LD validates at schema.org validator

### Phase 6: Assembly (P2)

#### Task 6.1 — Assemble `page.tsx`
- **Agent:** `frontend-specialist`
- **OUTPUT:** `app/(marketing)/page.tsx` — imports all section components
- **VERIFY:** `npm run build` — no TypeScript errors

---

## ✅ Success Criteria

- [ ] `/` renders landing page (not a blank redirect)
- [ ] Marketing route group completely isolated from `(dashboard)` — no auth checks
- [ ] 3 CTAs in hero section: Demo form, App Store (iOS), Play Store (Android)
- [ ] App Store CTAs link to mobile app — no health data collected on web
- [ ] Bento Grid showcases LMS + AI Recovery (no purple, no neon)
- [ ] Marquee testimonials pass `prefers-reduced-motion` test
- [ ] `npm run build` passes — no errors
- [ ] Lighthouse Performance ≥ 90 on mobile
- [ ] LCP < 2.5s
- [ ] No purple/violet hex values in marketing CSS
- [ ] `<title>` tag ≤ 60 chars, `<meta description>` ≤ 160 chars
- [ ] Schema markup: Organization + SoftwareApplication

---

## Phase X: Verification Checklist

```bash
# Security scan
python .agent/skills/vulnerability-scanner/scripts/security_scan.py .

# UX Audit
python .agent/skills/frontend-design/scripts/ux_audit.py .

# SEO Audit
python .agent/skills/seo-fundamentals/scripts/seo_checker.py .

# Build
npm run build

# Lighthouse (requires running server)
python .agent/skills/performance-profiling/scripts/lighthouse_audit.py http://localhost:3000

# Playwright E2E (3 CTAs, form submission, App Store links)
python .agent/skills/webapp-testing/scripts/playwright_runner.py http://localhost:3000 --screenshot
```

---

## ⛔ Constraints / Rules (Do NOT Violate)

1. **No purple/violet** hex codes anywhere in marketing CSS
2. **No code** written until this plan is approved
3. **`globals.css` untouched** — marketing fonts scoped to `(marketing)/layout.tsx` only
4. **Existing dashboard components** (`Sidebar.tsx`, `Header.tsx`) not modified
5. **HIPAA:** "Find a Bed" and "Solo Recovery" CTAs link only to App Store / Play Store — no health intake forms on the web
6. **MagicUI components** installed as needed (`npx magicui-cli add bento-grid marquee`) — no manual reimplementation
