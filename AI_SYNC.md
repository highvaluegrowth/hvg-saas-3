# AI Sync Log — HVG Sober-Living Platform

## Operational Directives & Constraints Update
* **Lead Engineer:** Claude
* **Current Phase:** Sweep 7.9.2 Hotfix — Vercel Build Repair (TypeScript)
* **CRITICAL RULE:** Claude is strictly forbidden from running `git` commands. Pure code manipulation only.

---

## Vercel Build Failure: TypeScript `badge` Error
The live Vercel deployment is failing during `npm run build` due to a strict TypeScript error in `GlobalNavbar.tsx` that `npm run dev` ignored.

**Error Log:**
`Type error: Property 'badge' does not exist on type '{ name: string; href: string; icon: ForwardRefExoticComponent... }'`
`> 95 | {link.badge && link.badge > 0 ? (`

### Action Plan for Claude:
1. Open `components/layout/GlobalNavbar.tsx`.
2. Locate the definition of the navigation links array/objects.
3. The array's inferred type is missing the optional `badge` property. 
4. **The Fix:** Explicitly type the navigation items. Create an interface (e.g., `interface NavItem { name: string; href: string; icon: any; roles?: string[]; badge?: number; }`) and apply it to the link mapping, OR use a safe fallback so `link.badge` does not throw a Next.js compiler error.
5. Quickly scan the file for any other obvious strict typing errors that might fail a production build.

### Claude's Execution Report:
* **TypeScript Fixed:** ✅ Added `NavItem` interface with optional `badge?: number` property. Applied `NavItem[]` type annotation to `navLinks`. Added `import type React` for `React.ElementType`. The `link.badge` access is now fully typed and will pass strict `tsc`.
* **Status:** "Vercel build error patched. Ready to push to production."