# AI Agent Differentiation Plan: HVG Partner & HVG Companion

## 1. Overview
The current AI implementation relies on a single generic endpoint (`/api/ai/chat/route.ts`) which struggles to differentiate the operational context of a SaaS Operator (tenant manager) from the recovery context of a Resident (mobile app user). 

This plan separates the AI into two distinct agents with dedicated API routes, system prompts, and toolsets:
- **HVG Partner**: The SaaS Business Assistant. Focuses on analytics, reporting, broadcasting, and content creation (events, courses, chores).
- **HVG Companion**: The Mobile Recovery Assistant. Focuses on guiding residents through their recovery journey, answering questions about the house, and helping them complete courses.

*Note: The SuperAdmin tenant approval flow requested by the user is documented as Phase 4 of this plan, establishing the foundational architecture for tenant onboarding.*

## 2. Project Type
**WEB & MOBILE** (Cross-platform backend changes impacting both clients).

## 3. Success Criteria
- [ ] SaaS Dashboard accurately connects to the HVG Partner endpoint.
- [ ] Mobile App accurately connects to the HVG Companion endpoint.
- [ ] HVG Partner successfully refuses to answer recovery/clinical questions and focuses on business.
- [ ] HVG Companion successfully refuses to answer business/tenant/staff questions and focuses on resident recovery.
- [ ] Shared libraries (`routeContextMap`, `commandParser`) correctly support the bifurcated structure.

## 4. File Structure Impact
```
app/
  api/
    ai/
      saas/route.ts        -> HVG Partner Handler
      mobile/route.ts      -> HVG Companion Handler
lib/
  ai/
    prompts/
      hvg-partner.ts       -> SaaS Persona
      hvg-companion.ts     -> Mobile Persona
    tools/
      saas-tools.ts        -> Analytics, Broadcasting, Creation
      mobile-tools.ts      -> Status checks, Course progression
```

## 5. Task Breakdown

### Phase 1: Architecture Split & Backend Routing
* **Agent**: `backend-specialist`
* **Skills**: `api-patterns`
* **Tasks**:
  1. Create `/api/ai/saas/chat/route.ts` (HVG Partner) and `/api/ai/mobile/chat/route.ts` (HVG Companion).
  2. Deprecate the legacy `/api/ai/chat/route.ts`.
  3. Ensure both routes utilize `verifyAppUserToken` to guarantee secure JIT auth.

### Phase 2: Persona & Prompt Engineering
* **Agent**: `backend-specialist` / `orchestrator`
* **Skills**: `clean-code`
* **Tasks**:
  1. Create `lib/ai/prompts/hvg-partner.ts`: Design system instructions for a business-focused assistant (Analytics, Reporting, Scheduling).
  2. Create `lib/ai/prompts/hvg-companion.ts`: Design system instructions for a recovery-focused assistant (Empathy, Guidance, Accountability).

### Phase 3: Dedicated Toolsets
* **Agent**: `backend-specialist`
* **Skills**: `api-patterns`
* **Tasks**:
  1. Build `saas-tools.ts`: Implement specific Gemini functions (`generate_tenant_report`, `broadcast_message`, `create_universal_chore`).
  2. Refine `mobile-tools.ts`: Clean up existing tools (`get_sobriety_status`, `get_upcoming_events`) strictly for resident read-only access where appropriate.

### Phase 4: SuperAdmin Tenant Approval Foundation
* **Agent**: `backend-specialist`
* **Skills**: `database-design`
* **Tasks**:
  1. Scaffold the database schema and middleware check required for SuperAdmin tenant approval. (e.g., adding `status: 'pending' | 'approved'` to the `Tenant` schema).
  2. Ensure the HVG Partner route restricts certain reporting capabilities if the tenant is not approved.

### Phase 5: Client Re-wires
* **Agent**: `frontend-specialist`, `mobile-developer`
* **Skills**: `frontend-design`
* **Tasks**:
  1. **Web**: Update `chatService.ts` to point to `/api/ai/saas/chat`.
  2. **Mobile**: Update the mobile chat configuration to point to `/api/ai/mobile/chat`.

## Phase X: Verification Checklist
- [ ] **Build**: `npm run build` succeeds.
- [ ] **Lint**: `npm run lint` passes without new errors.
- [ ] **Security**: `security_scan.py` passes without exposed tokens or open API endpoints.
- [ ] **Client Check**: Both Web and Mobile clients can successfully send and receive messages from their respective new endpoints.

## ✅ PHASE X COMPLETE
- Lint: [ ] Pending
- Security: [ ] Pending
- Build: [ ] Pending
- Date: [ ] Pending
