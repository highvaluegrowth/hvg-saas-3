# HVG Omnipresent AI Architecture Plan (Unified HVG Outlet)

## Vision: "The Holy Grail"
The ultimate goal of the AI in the High Value Growth (HVG) platform is to eliminate any task that requires an operator to do anything besides speak in natural language to their mobile app or a wearable. The AI—branded globally as **HVG Outlet**—is a proactive, omnipresent executive assistant and operations manager capable of navigating views, parsing unstructured data, and orchestrating complex cross-feature workflows.

---

## 1. Unified Brand: HVG Outlet
To maintain a cohesive brand identity, all AI instances across the platform are named **HVG Outlet**. The difference between instances is defined by the **unlocked tools, agents, and skills** available based on the user's role and environment.

### Tiers of Outlet
*   **Resident Tier (Mobile):** Focused on personal recovery, "Study Buddy" LMS support, and personal logistics (rides/chores).
*   **Operator Tier (Web/Mobile):** Unlocked for Tenant Admins and Staff. Includes the Logistics, Finance, Marketing, and Clinical expert agents.
*   **SuperAdmin Tier (Web):** Unlocked for Platform Directors. Includes the **Global Synthesis Agent** for cross-tenant analytics and system-wide orchestration.

---

## 2. Multi-Agent Ecosystem
A centralized routing layer delegates complex inquiries to specialized expert agents.

### Core Expert Agents
*   **Logistics Agent:** Manages rides, chores, and transportation routing.
*   **Finance Agent:** Handles Stripe integrations, billing, and rent tracking (HITL required for payments).
*   **Marketing Agent:** Crafts social posts, schedules Meta Graph API updates, and analyzes engagement.
*   **Clinical / Recovery Agent:** Performs deep research, sources high-level recovery resources, and tracks resident progress. **Constraint:** Must never replace licensed professionals; focus on net-positive resource provision.
*   **Global Synthesis Agent (SuperAdmin Only):** Performs cross-tenant analysis, pattern recognition across the entire platform, and global reporting.

---

## 3. Omnipresent Context & Semantic UI Map
*   **Semantic UI Mapping:** Every view in the web and mobile apps will provide a JSON "Capability Map" (e.g., actions, filters, and data fields present). This allows Outlet to "see" and "drive" the specific UI the user is currently looking at.
*   **Deep Context Injection:** Real-time access to "view state" (selected filters, unsaved forms, specific entity IDs).
*   **Dual-Mode Execution:** 
    *   *Foreground (HITL):* Outlet interacts with the UI (filling forms) for human review.
    *   *Background:* Outlet performs tasks invisibly and requests confirmation via chat.

---

## 4. Live Voice & Multimodal Interaction
*   **Organic Conversations:** Low-latency, full-duplex voice streaming using WebRTC/WebSockets (Gemini Live API). 
*   **Interruption Handling:** The AI naturally stops speaking when the user starts, creating a human-like assistant experience.
*   **Unstructured Data Ingestion:** Parsing of messy PDFs, handwritten forms, and long email threads into structured system data.

---

## 5. Multi-Tiered Tenant Memory (RAG)
Outlet's "Brain" is divided into three functional layers:
1.  **Episodic:** Short-term conversational context and history.
2.  **Semantic (RAG):** Long-term knowledge base (SOPs, house rules, PDF manuals) isolated per tenant.
3.  **Procedural:** Recurring background instructions (e.g., "Always alert me if a resident's rent is 3 days late").

---

## 6. Security, Governance & Human-in-the-Loop (HITL)
*   **Accountability Ledger:** An immutable, searchable log of every AI action, the reasoning behind it, and the human who authorized it.
*   **HITL Checkpoints:** Mandatory confirmation for sensitive actions (deletions, payments, external communications).
*   **Access Control:** Outlet strictly respects the user's RBAC permissions when accessing data or tools.

---

## Next Implementation Phases
1.  **Architecture Scaffold:** Setup the isolated `HVG Outlet` routing endpoints for Resident, Operator, and SuperAdmin tiers.
2.  **Semantic Map Provider:** Implement the first "Capability Maps" for core views (Tenants, Houses, Residents).
3.  **Knowledge Base (RAG):** Establish the vector database infrastructure for tenant-specific memory.
4.  **Voice Stream Integration:** Prototype the WebRTC connection for live, interruptible voice chat.
5.  **Agent Migration:** Refactor the existing monolithic tool registry into the specialized Multi-Agent structure.
6.  **Action Ledger:** Build the tracking database for AI execution accountability.
