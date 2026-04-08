# BRD Response: AI Image Generator for Sportsbook Promotions

**Document Type:** Technical Feasibility Review & Alignment Response
**Date:** April 8, 2026
**Prepared by:** Engineering Team
**In Response to:** Business Requirements Document — AI Image Generator for Sportsbook Promotions
**Status:** Pending Client Alignment

---

## Executive Summary

We have reviewed the BRD for the AI Image Generator for Sportsbook Promotions. The core vision is achievable and aligns well with our existing platform capabilities. Our current system — the **Multi-Brand Prompt Generator** — already implements approximately 60% of the described requirements through its Sports Banner Wizard module.

This response identifies what is already operational, what requires new development, and where we need additional clarification before committing to scope and timeline.

**Recommendation:** Align on the three open items identified below, then proceed with building only the incremental features — avoiding redundant development of capabilities that are already production-ready.

---

## 1. Requirements Already Fulfilled

The following BRD requirements are **fully operational** in the current platform and require no additional development:

| BRD Requirement | Current Implementation | Status |
|---|---|---|
| AI-powered image generation | Three providers: OpenAI (gpt-image-1), Google Gemini, and GCP Cloud Run supporting resolutions up to 4K | Production |
| Input fields for description and dimensions | 5-step Sports Banner Wizard with sport selection, player configuration, action poses, backgrounds, lighting, and banner sizing | Production |
| Brand color enforcement | Automated color-lock system across 9 brands with palette enforcement built into prompt generation | Production |
| Image preview | Full-screen image modal with side-by-side comparison and 4-variation spectrum at different creativity levels | Production |
| Regeneration capability | One-click regeneration via n8n webhook pipeline with GPT-powered prompt customization | Production |
| Mobile and desktop format support | Banner size selector supporting Portrait, Square, and Landscape aspect ratios with multiple resolution presets | Production |
| End-to-end processing pipeline | Complete flow: User Input → n8n Processing → AI Generation → Preview, fully automated via webhook architecture | Production |

**No action required on the above items.**

---

## 2. New Development Required

The following items are **not currently implemented** and represent the actual scope of new work:

### 2.1 Exact Dimension & File Size Targeting
**BRD Requirement:** Accept specific dimensions and file size constraints.
**Current Gap:** The platform supports aspect ratios and general size presets, but does not accept exact pixel dimensions (e.g., 1328x784) or target file sizes (e.g., "under 200KB").
**Proposed Solution:** Add a post-generation resize and compression step using server-side image processing. This is straightforward and low-risk.
**Estimated Effort:** Low

### 2.2 Download Module with Format Options
**BRD Requirement:** Downloadable outputs.
**Current Gap:** Users can view and copy images but lack a dedicated download flow with format selection (PNG, JPEG, WebP) and quality controls.
**Proposed Solution:** Add download button with format picker and quality slider to the existing image preview modal.
**Estimated Effort:** Low

---

## 3. Items Requiring Clarification

The following requirements cannot be scoped or estimated without additional specification from the product team:

### 3.1 Arabic Version Support
**BRD Statement:** "Build same image for Arabic version."

**Critical Context:** Current AI image generation models (OpenAI, Gemini) **cannot reliably render Arabic script** within generated images. Text in non-Latin scripts frequently appears garbled, mirrored, or illegible.

**We need clarification on the intended approach:**

| Option | Description | Complexity | Reliability |
|---|---|---|---|
| **A. Post-processing text overlay** | Generate the base image with AI, then programmatically overlay Arabic text using HTML Canvas or a server-side renderer | Medium | High — text is rendered by code, not AI |
| **B. Mirrored/RTL layout** | Generate the same image but flip composition for right-to-left visual flow (no Arabic text in image) | Low | High |
| **C. Arabic-language prompts** | Send Arabic-language descriptions to the AI model and let it generate culturally appropriate imagery (no Arabic text in image) | Low | Medium — depends on model's cultural accuracy |
| **D. Full Arabic text rendering in AI** | Ask the AI to render Arabic script within the image | N/A | **Not recommended** — current models cannot do this reliably |

**Action Required:** Please confirm which option aligns with the business need.

### 3.2 Brand Compliance Scope
**BRD Statement:** "Follow brand guidelines" + "Brand consistency module."

**Current State:** The platform enforces **brand colors** through an automated color-lock system. However, full brand compliance may encompass additional elements.

**We need clarification on what "brand compliance" includes:**

| Element | Currently Supported | If Needed |
|---|---|---|
| Brand color palette | Yes — automated color-lock | No work needed |
| Brand character/mascot consistency | Partial — referenced in prompts but AI output varies | AI limitation, cannot guarantee |
| Logo placement | No | Requires post-processing overlay layer |
| Typography / font rules | No | Requires post-processing overlay layer |
| Safe zones / margins | No | Requires post-processing crop/padding logic |
| Brand-specific templates | No | Requires template system development |

**Action Required:** Please define which elements constitute "brand compliance" for acceptance criteria.

### 3.3 Versioning Scope
**BRD Statement:** "Versioning" listed under Functional Requirements.

**We need clarification on what versioning covers:**

| Interpretation | Description | Effort |
|---|---|---|
| **Image generation history** | Track all generated images per prompt with timestamps ("v1, v2, v3 of this banner") | Medium |
| **Prompt version history** | Track edits to prompt configurations over time | Medium |
| **Audit trail** | Log who generated what, when, with which settings (compliance/governance) | Medium-High |
| **Rollback capability** | Ability to revert to a previous version of a prompt or regenerate from a past configuration | High |

**Action Required:** Please specify the intended scope and whether rollback functionality is required.

---

## 4. Future Enhancements (Acknowledged, Deferred)

The following items from the BRD are noted as future enhancements and are **excluded from the current scope:**

- A/B testing for banner performance
- Pre-built templates
- Multi-language support (beyond Arabic)

We agree these are valuable additions and recommend revisiting them after the core deliverables are complete.

---

## 5. Feasibility & Effort Overview

| Requirement | Feasibility | Effort | Dependency |
|---|---|---|---|
| Core AI generation pipeline | Already built | None | — |
| Input module & wizard | Already built | None | — |
| Brand color enforcement | Already built | None | — |
| Preview & regeneration | Already built | None | — |
| Exact dimension control | Achievable | Low | None |
| File size targeting | Achievable | Low | None |
| Download with format options | Achievable | Low | None |
| Arabic support | Achievable | Medium to High | Clarification on approach (Section 3.1) |
| Full brand compliance | Achievable | Medium | Clarification on scope (Section 3.2) |
| Versioning | Achievable | Medium | Clarification on scope (Section 3.3) |

---

## 6. Recommended Priority Sequence

Once alignment is achieved on the open items, we recommend the following implementation order:

1. **Exact dimension control + file size targeting** — Quick wins, immediate user value
2. **Download module with format options** — Completes the end-to-end workflow
3. **Brand compliance enhancements** — Based on agreed scope
4. **Arabic version support** — Based on agreed approach
5. **Versioning** — Based on agreed scope

---

## 7. Next Steps

| # | Action | Owner | Target |
|---|---|---|---|
| 1 | Review this document and provide clarification on Sections 3.1, 3.2, and 3.3 | Product / Client | — |
| 2 | Provide brand guidelines documentation (if full brand compliance is in scope) | Design Team | — |
| 3 | Confirm whether this extends the current platform or is a standalone application | Product / Client | — |
| 4 | Upon alignment, Engineering will produce a detailed implementation plan with estimates | Engineering | After Step 1-3 |

---

**End of Document**
