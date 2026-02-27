# Test Plan for Auth Unification & Multi-Tenancy

## Web Native Validation (hvg-saas-3)
1. **Operator Login Flow**
   - Given: An operator with single or multiple tenant IDs.
   - Action: Operator logs in via Google/Email.
   - Expectation: JIT Provisioning creates `users/{uid}` in Firestore if it did not exist. Operator successfully enters dashboard without "Profile Not Found".
2. **Organization Switcher Visibility & Functionality**
   - Given: Operator with multiple organizations in their token.
   - Action: Verify the sidebar renders the Organization Switcher.
   - Action: Select a different organization from the dropdown.
   - Expectation: URL gracefully routes to `/newTenantId` and the dashboard loads context without losing state.
3. **AI Sidebar Communication**
   - Given: Authenticated operator in a specific tenant dashboard.
   - Action: Send a message to the AI Sidebar.
   - Expectation: The chat succeeds without throwing `Error: Missing authorization token` or `Error: Access restricted to residents`.

## Mobile Application Validation (hvg_companion / mobile app)
*(Mobile environment requires manual validation or native emulation)*
1. **Resident/Staff Login Flow**
   - Given: Resident or mobile app Staff member.
   - Action: Logs into the companion app.
   - Expectation: Login succeeds, token passes auth middleware accurately.
2. **API Interaction (Mobile -> NextJS Routes)**
   - Given: App performing actions like creating events, registering chores.
   - Action: Submit a request requiring auth.
   - Expectation: The universally upgraded `verifyAppUserToken` correctly routes and authenticates the native Firebase Auth JWT coming from the mobile device without role-based collision.
