# Global Visual Alignment Plan

## Goal
The SaaS dashboard (admin, tenant, staff views) must flawlessly match the actual source of truth for the HVG brand identity: the Landing Page. The previous output of `MASTER.md` provided generic tokens which do not match the real landing page created in `app/(marketing)/page.tsx` and `HeroSection.tsx`. We will align the SaaS app directly to the encoded React/Tailwind tokens.

## True Landing Page Tokens
Extracted directly from `HeroSection.tsx`:

### Color Palette
- **Primary Text / Headings:** Cyan-900 (`#164E63`)
- **Primary Brand / Accents:** Cyan-600 (`#0891B2`)
- **Action / Success / Primary Buttons:** Emerald-600 (`#059669`)
- **Background Base:** Cyan-50 (`#ECFEFF` to `#f0fdfa`)
- **Soft Border/Glass:** `rgba(8,145,178,0.2)`
- **Glass Panel Surface:** `rgba(8,145,178,0.08)`

### Typography (Google Fonts)
- **Primary / Headings / Interface:** `Figtree`
- **Secondary / Body Document Text:** `Noto Sans`

### Key Effects
- **Primary Elevate Shadow:** `box-shadow: 0 8px 24px rgba(5,150,105,0.35)`
- **Glass Borders:** `2px solid rgba(8,145,178,0.3)`

---

## Proposed Changes

### 1. Global Tailwind Theme Variables (`app/globals.css`)
- **[MODIFY]** `app/globals.css`
  - Remove "Amber & Sage" hex variables.
  - Insert Tailwind v4 `@theme` mappings for the primary/brand/accent colors mapped to the Cyan/Emerald stack.
  - Update `--background` to `#ECFEFF` / `#F8FAFC`.
  - Update `.glass-panel` to use Cyan-tinted backgrounds (e.g., `bg-cyan-900/5` with a cyan-tinted border).

### 2. Root Layout Typography (`app/layout.tsx`)
- **[MODIFY]** `app/layout.tsx`
  - Strip out `Varela_Round` and `Nunito_Sans`.
  - Import and apply `Figtree` and `Noto_Sans` from `next/font/google`.
  - Map variables: `--font-figtree` and `--font-noto`.

### 3. AI Sidebar Styling (`components/ai-sidebar/AISidebar.tsx`)
- **[MODIFY]** `components/ai-sidebar/AISidebar.tsx`
  - Change inline background from `#FDFBF7` to `#F8FAFC` (or `rgba(255,255,255,0.8)` with backdrop blur over the layout gradient).
  - Modify border colors from `#E8E0D5` to match the Cyan-border tokens (`#CFFAFE` / `rgba(8,145,178,0.15)`).
  - Update hover states on the drag handle from `hover:bg-amber-500/20` to `hover:bg-cyan-500/20`.

### 4. Component Refactoring Strategy
Once the root CSS variables and fonts are established, standard container components across the dashboard will naturally inherit the new background and font.
We will conduct targeted replacements on core SaaS UI primitives (e.g. Buttons, Badges, Table Headers) changing any hardcoded color strings (e.g., `bg-amber-600`) to the new primary CSS variable or semantic Tailwind classes (e.g., `bg-primary` mapped to Emerald-600).

## Verification Plan

### Manual Verification
1. Run `npm run dev` and navigate to `localhost:3000/dashboard`.
2. Observe the root font has changed to Figtree.
3. Observe the dominant text colors are Cyan-900, with Emerald accents.
4. Test resizing the AI Sidebar and verify the middle content panel flexes appropriately without overlap, and the sidebar background has the clean, cool-cyan minimalist aesthetic.

### Automated Tests
1. Run `npm run build` to ensure no font loading or class name errors.
