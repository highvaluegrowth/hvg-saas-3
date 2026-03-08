# Phase 9: AI Agent Differentiation

## Overview
Bifurcation of the generic single-endpoint AI into dedicated specialized Gemini Agents based on context: HVG Partner for business management and HVG Companion for mobile resident recovery guidance.

## Completed ✅
- [x] Deprecated legacy generic `/api/ai/chat/route.ts`.
- [x] Created split backend handlers: `/saas` (HVG Partner) and `/mobile` (HVG Companion).
- [x] Separated system prompts and defined strict specialization bounds.
- [x] Dedicated SAAS and MOBILE Gemini toolsets established (`lib/ai/tools/`).
- [x] Web client re-wired to point to specialized Partner endpoint.

## Remaining 📋
- [ ] Finalize Mobile Client re-wire (awaiting Expo Mobile app Phase 4B completion).
- [ ] Fine-tune Partner prompt response constraints (e.g. blocking clinical responses).
- [ ] Fine-tune Companion response styles and empathetic tone instructions.

## Notes
- Prevents cross-contamination of permissions between operational efficiency queries and empathetic recovery guidance.
