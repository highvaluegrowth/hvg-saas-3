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

# AI Sync Log — HVG Sober-Living Platform

## Operational Directives & Constraints Update
* **Lead Engineer:** Claude
* **Current Phase:** Sweep 10.1 Hotfix — iOS Podfile Modular Headers
* **CRITICAL RULE:** Claude is strictly forbidden from running `git` commands. Pure code manipulation only.

## iOS Build Failure: CocoaPods Swift Static Library Error
The human ran `pod install` and received the following error regarding the newly added Firebase SDKs:
`The Swift pod 'FirebaseAuth' depends upon... which do not define modules. To opt into those targets generating module maps... you may set 'use_modular_headers!' globally in your Podfile`

### Action Plan for Claude:
1. Open `mobile/ios/Podfile`.
2. Locate the top of the file (usually right under `platform :ios, 'X.X'`).
3. Add the line `use_modular_headers!` globally. 
   *(Note: If the Podfile is already using `use_frameworks! :linkage => :static`, the official React Native Firebase workaround is to add `$RNFirebaseAsStaticFramework = true` at the absolute top of the file instead).*
4. Save the file.

### Claude's Execution Report:
* **Podfile Patched:** ✅ `use_modular_headers!` added globally (line after `platform :ios`) — `ios.useFrameworks` was NOT set in Podfile.properties.json, confirming static frameworks mode is inactive and `use_modular_headers!` is the correct fix.
* **Status:** "Podfile patched. Human must run `pod install` again."


# AI Sync Log — HVG Sober-Living Platform

## Operational Directives & Constraints Update
* **Lead Engineer:** Claude
* **Current Phase:** Master Plan - Sweep 10, Phase 10.2 (The "My House" & Chores Hub)
* **CRITICAL RULE:** Claude is strictly forbidden from running `git` commands. Pure code manipulation only.
* **DESIGN CONSTRAINT:** The primary color Amber (#F59E0B) is strictly forbidden. 
* **ENVIRONMENT CONSTRAINT:** Bare React Native CLI. Use `react-native-haptic-feedback` for haptics.

---

## Sweep 10, Phase 10.2: The "My House" & Chores Hub
**Target:** `app/(tabs)/hub.tsx` and associated components (e.g., `components/chores/ChoreCard.tsx`).

### Architectural Diagnosis:
The Hub tab must serve as the resident's operational center. It needs to fetch their specific housing data via the REST API and their assigned chores via real-time Firestore listeners, enforcing the "My Stuff" data isolation principle.

### Action Plan for Claude:

1. **"My House" Context (Top Section):**
   - Update `hub.tsx` to fetch the user's specific bed/room assignment using the existing React Query / REST API pattern (e.g., fetching from `/api/mobile/tenants/[tenantId]/residents/[uid]`).
   - Display this data in a clean, glassmorphic card at the top of the screen (Dark Slate background, subtle borders).

2. **Isolated Chores List (Bottom Section):**
   - Implement a Firestore listener using `@react-native-firebase/firestore` to query the chores collection: `query(collection(db, 'tenants', tenantId, 'chores'), where('assigneeId', '==', uid), where('status', 'in', ['pending', 'in_progress']))`.
   - Render these chores using a `FlatList` or `SectionList`.

3. **Tactile ChoreCard Component:**
   - Create or update a touch-friendly `ChoreCard` component. Hit areas must be at least 44x44px.
   - **Optimistic UI:** When the user taps to complete a chore, immediately update the local visual state (show an Emerald `#10b981` checkmark) and trigger native haptic feedback (`import ReactNativeHapticFeedback from 'react-native-haptic-feedback'; ReactNativeHapticFeedback.trigger('notificationSuccess');`).
   - **Background Mutation:** Fire the Firestore document update (`status: 'completed'`) in the background. If the write fails, revert the local visual state and show a native error toast or alert.

### Claude's Execution Report:
* **My House Context:** ✅ `hub.tsx` fetches enrollments via `userApi.getEnrollments()` (React Query), extracts `enrolledTenantId`, then fetches `tenantApi.getHouses(tenantId)` — renders a glassmorphic `HouseCard` with name, city/state, and active enrollment pill. Empty states for no enrollment, no house assignment.
* **Firestore Chores Wired:** ✅ Real-time `onSnapshot` listener on `tenants/{tenantId}/chores` with `where('assigneeIds', 'array-contains', uid)` + `where('status', 'in', ['pending', 'in_progress'])` — re-subscribes on uid/tenantId change, unsubs on cleanup. Error state shown on listener failure.
* **Tactile UI Built:** ✅ `components/chores/ChoreCard.tsx` — optimistic `setOptimisticDone(true)` on tap before Firestore write; `ReactNativeHapticFeedback.trigger('notificationSuccess')` fires immediately; reverts + `Alert.alert` on write failure. Check button is 44×44px. Priority dot (red=high, cyan=medium). Due date pill.
* **Status:** "Phase 10.2 code complete. Ready for Phase 10.3."

---

# AI Sync Log — HVG Sober-Living Platform

## Operational Directives & Constraints Update
* **Lead Engineer:** Claude
* **Current Phase:** Master Plan - Sweep 10, Phase 10.3 (Universal Comms Hub)
* **CRITICAL RULE:** Claude is strictly forbidden from running `git` commands. Pure code manipulation only.
* **DESIGN CONSTRAINT:** The primary color Amber (#F59E0B) is strictly forbidden. Use Dark Slate/Navy and Cyan.
* **ENVIRONMENT CONSTRAINT:** Bare React Native CLI.

## Sweep 10, Phase 10.3: Universal Comms Hub
**Target:** `app/(tabs)/outlet.tsx` (ThreadList), create `app/chat/[id].tsx` (Chat interface), and associated components.

### Architectural Diagnosis:
The mobile app must abandon legacy inbox structures and wire directly into the Sweep 6 polymorphic conversations architecture via real-time Firestore listeners. It must also support the `__new_outlet__` AI flow natively.

### Action Plan for Claude:

1. **ThreadList Screen (`app/(tabs)/outlet.tsx`):**
   - Implement a real-time `onSnapshot` listener using `@react-native-firebase/firestore` to query the `conversations` collection: `where('participants', 'array-contains', uid)`, ordered by `updatedAt` descending.
   - Build a clean list UI (Dark Slate background) displaying the threads.
   - **The "Outlet" Trigger:** Implement a prominent "Chat with Outlet" Floating Action Button (FAB) or fixed header button using the Cyan primary color.

2. **The "Outlet" AI Flow Logic:**
   - Wire the Outlet trigger to check the fetched threads for an active `ai_chat`. 
   - If one exists, navigate to it. 
   - If not, replicate the web's sentinel logic: Fire a mutation or create a document with the target `__new_outlet__` to instantiate the AI conversation on the backend, then navigate to the newly created thread.

3. **Native Chat Interface (`app/chat/[id].tsx`):**
   - Create the dynamic chat route.
   - Fetch messages for the specific conversation ID via a real-time Firestore listener, ordered by `createdAt` descending.
   - **UI Construction:** Use a `FlatList` with `inverted={true}` so new messages appear at the bottom naturally. 
   - **Keyboard Handling:** Wrap the view in a `KeyboardAvoidingView` with `behavior={Platform.OS === 'ios' ? 'padding' : undefined}` to ensure the text input is pushed up by the native keyboard.
   - **Bubble Styling:** User messages = Cyan background. AI/Other messages = Dark Slate/Glassmorphic background. 

### Claude's Execution Report:
* **ThreadList Built:** ✅ `app/(tabs)/outlet.tsx` — real-time `onSnapshot` on top-level `conversations` collection with `where('participants', 'array-contains', uid)` ordered by `updatedAt` desc. Shows ThreadRow per conversation (icon, title, last message preview, timestamp). Tab renamed from `chat` → `outlet` in `_layout.tsx`; old `chat.tsx` moved to hidden.
* **AI Flow Wired:** ✅ Outlet FAB checks for existing `ai_chat` conversation → navigates to it if found. If not, creates new `conversations` doc (`type: 'ai_chat'`, `participants: [uid, 'system_ai']`) via direct Firestore write, then navigates to `/chat/{newId}`. Matches web sentinel pattern from `DrawerRouter.tsx`.
* **Chat UI Built:** ✅ `app/chat/[id].tsx` — `FlatList inverted={true}` with `orderBy('createdAt', 'desc')`; `KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}`; user bubbles = Cyan (#0891b2); AI/other bubbles = Dark Slate glassmorphic. Optimistic user message shown immediately (cleared when Firestore confirms). For `ai_chat`: calls `chatApi.send({ message, conversationId })` — backend writes both user+AI msgs to Firestore, listener surfaces them. For human threads: direct Firestore batch write (message + conversation `lastMessage` update).
* **Status:** "Phase 10.3 code complete. Ready for Phase 10.4."