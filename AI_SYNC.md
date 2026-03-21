# AI Sync Log — HVG Sober-Living Platform

## Operational Directives & Constraints Update
* **Lead Engineer:** Claude
* **Current Phase:** Master Plan - Sweep 10, Phase 10.1 (Native Foundations & Navigation)
* **CRITICAL RULE:** Claude is strictly forbidden from running `git` commands. Pure code manipulation only.
* **DESIGN CONSTRAINT:** The primary color Amber (#F59E0B) is strictly forbidden. 
* **ENVIRONMENT CONSTRAINT:** Bare React Native CLI (Fastlane/Metro). DO NOT use Expo-specific native SDKs.

## Sweep 10, Phase 10.1: Native Foundations & Navigation
**Target:** `package.json`, global theme file (`constants/theme.ts` or similar), and `app/(tabs)/_layout.tsx`.

### Action Plan for Claude:

1. **Native Dependencies (package.json):**
   - Add `@react-native-firebase/firestore` to dependencies.
   - Add `@react-native-community/blur` to dependencies.
   - Add `react-native-haptic-feedback` to dependencies.
   - *Do not run `npm install` or `pod install`. The human will execute the installation.*

2. **Theme Centralization & Eradication:**
   - Locate or create a central constants/theme file (e.g., `lib/constants/Colors.ts` or `constants/theme.ts`).
   - Define the new palette strictly: Backgrounds = Dark Slate/Navy (`#0C1A2E`, `#0f172a`). Primary = Cyan (`#06b6d4`). Success = Emerald (`#10b981`).
   - Perform a codebase sweep to remove hardcoded legacy colors. **Eradicate all instances of Amber (`#F59E0B`)** and replace them with the new Cyan/Slate theme variables.

3. **Navigation Restructure (`expo-router`):**
   - Open `app/(tabs)/_layout.tsx`.
   - Reconfigure the Primary Tabs to match the new scope: `Home` (Dashboard), `Hub` (Chores/Logistics), `Outlet` (Chat), `LMS` (Curriculum), and `Profile`. (Create placeholder screens for any missing tabs if necessary).
   - Implement `@react-native-community/blur` for the bottom tab bar to achieve a glassmorphic aesthetic. Set the tab bar background to `rgba(12, 26, 46, 0.8)` over a absolute-positioned `BlurView`.
   - Update `app/_layout.tsx` to ensure the root `SafeAreaView` or `ThemeProvider` uses the Dark Slate background to prevent white flashes during navigation.

### Claude's Execution Report:
* **Dependencies Added:** ✅ `@react-native-firebase/firestore ^21.0.0`, `@react-native-community/blur ^4.4.1`, `react-native-haptic-feedback ^2.3.1` added to `mobile/package.json`
* **Theme Centralized:** ✅ `mobile/lib/constants/theme.ts` created — Dark Slate (`#0C1A2E`, `#0f172a`), Cyan (`#06b6d4`), Emerald (`#10b981`). No amber instances existed in mobile codebase (pre-verified via grep).
* **Router Re-skinned:** ✅ `mobile/app/(tabs)/_layout.tsx` rebuilt — 5 visible tabs: Home, Hub, Outlet, LMS, Profile. BlurView glassmorphic tab bar (`blurType="dark"`, `blurAmount=20`) on iOS; dark overlay fallback on Android. Cyan active tint, all colors from theme constants. Old tabs (explore, activity, inbox) moved to hidden.
* **Root Layout:** ✅ `mobile/app/_layout.tsx` — `contentStyle: { backgroundColor: colors.bg.primary }` added to Stack screenOptions to prevent white flashes.
* **Hub Placeholder:** ✅ `mobile/app/(tabs)/hub.tsx` created — "Chores & Logistics — coming soon" screen in Dark Slate theme.
* **Status:** "Phase 10.1 code complete. Human must run `npm install` and `pod install` (iOS)."