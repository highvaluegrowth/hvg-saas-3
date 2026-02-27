# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** HVG Unified
**Generated:** 2026-02-26
**Category:** Healthcare SaaS & Landing Page

---

## Global Rules

### Color Palette (Amber & Sage)

| Role | Hex | Tailwind Utility |
|------|-----|------------------|
| Primary (Action/User) | `#D97706` (Amber-600) | `bg-amber-600`, `text-amber-600` |
| Secondary (AI/Guide/Brand) | `#718355` (Sage) | `bg-[#718355]`, `text-[#718355]` |
| Background (Warm) | `#FDFBF7` | `bg-[#FDFBF7]` |
| Surface (Glass) | `rgba(255, 255, 255, 0.8)` | `bg-white/80 backdrop-blur-md` |
| Text (Primary) | `#1E293B` | `text-slate-800` |

### Typography

- **Heading Font:** Varela Round
- **Body Font:** Nunito Sans
- **Mood:** Humanist, warm, clean, accessible, professional
- **CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;500;600;700&family=Varela+Round&display=swap');
```

### Style Guidelines

**Style:** Glassmorphism + Clean/Warm Soft UI
- **Effects:** Soft glass surfaces (`bg-white/80 backdrop-blur-md`) over warm base backgrounds, subtle borders (`border-white/40` or `border-amber-100/50`), and gentle shadows (`shadow-sm` or `shadow-md`).
- **Interaction:** Smooth 200ms transitions on hover state (`hover:-translate-y-0.5`, `hover:shadow-md`).
- **Best For:** Healthcare SaaS, recovery tracking, calming interfaces, humanist tech.

---

## Component Specs

### Unified Sidebar (SaaS Dashboard & AI Sidebar)
- Occupies ~25% (1/4th) of screen width by default.
- AI Sidebar implements a flex-resize or grid-layout strategy (draggable edge) so the main content *shrinks* rather than being overlaid.
- Container base: `bg-[#FDFBF7]` or glassmorphism depending on visual hierarchy.
- AI chat bubbles use Sage (`bg-[#718355]`). User bubbles use Amber (`bg-amber-500`).

### Cards & Surfaces
- Background: `bg-white/80 backdrop-blur-md`
- Border: `border border-white/40` or `border-slate-100`
- Shadow: `shadow-sm hover:shadow-md transition-shadow duration-200`
- Radius: `rounded-xl` or `rounded-2xl` for softer, friendlier feel.

### Buttons & Inputs
- Primary Button: `bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors`
- AI Action Button: `bg-[#718355] text-white rounded-lg hover:brightness-110 transition-colors`
- Outline Button: `border border-amber-600 text-amber-600 hover:bg-amber-50 rounded-lg`
- Input fields: Warm borders `border-slate-200 focus:border-amber-500 focus:ring-amber-500 rounded-lg bg-white/60`

---
## Anti-Patterns (Do NOT Use)
- ❌ **Dark/Neon Themes** — No bright neons, sticking to calm earth tones.
- ❌ **Sharp Corners** — No `rounded-none` on main structural elements; interfaces must feel human and soft.
- ❌ **Overlaid Sidebars** — Sidebar must squeeze main content, not hide it behind absolute positioning (unless on mobile).
- ❌ **Standard AI Gradients** — No "standard AI purple/pink/blue" gradients for the Gemini elements. Respect the Sage & Amber brand colors.
- ❌ **Low Contrast** — Maintain strict 4.5:1 text contrast minimums for accessibility.
