# BRD Clarification Questions
**Re:** AI Image Generator for Sportsbook Promotions
**Date:** April 8, 2026

---

Hi team,

Thanks for sharing the BRD. Before we move to planning, I went through all 10 sections and have some clarification questions. Most of these are quick — just need a confirmation or a pick from options.

---

## Section 1 — Project Overview

> "Develop an AI-powered system to generate promotional images based on backend user inputs."

- When you say **"backend user inputs"** — do you mean inputs from a web UI (like the current tool), or inputs from an actual backend system (e.g., an API call from your CMS or promotion management system that triggers image generation automatically)?
- **"Manual creation is time-consuming"** — is this referring to designers manually creating banners in Photoshop/Figma? Just confirming that the goal is to replace that manual design process with AI generation.

---

## Section 2 — Objectives

**"Automate image creation"**
- Does "automate" mean a user clicks a button and gets an image (on-demand, which is how it works now)?
- Or do you want **scheduled/batch generation** — images auto-generated on a schedule (e.g., every day for upcoming promotions)?
- Or **triggered automation** — images generated automatically when a new promotion is created in your system?

This is an important distinction — it changes the architecture.

**"Ensure brand consistency"**
- We already enforce brand color palettes automatically. Has there been a specific case where the output didn't match the brand? (e.g., wrong colors, mascot looking different each time, missing logos?)
- Knowing what "inconsistency" you've seen will help us target the right fix.

**"Reduce turnaround time"**
- Is this the AI generation speed (~10-30 seconds currently), or the overall workflow time from brief to final banner (the back-and-forth between teams)?

**"Support mobile & desktop formats"**
- We already support Portrait, Square, and Landscape with multiple resolutions. Do you have specific required dimensions? (e.g., 1080x1920 for mobile stories, 1920x1080 for desktop hero banners)
- Any file size limits? (e.g., "must be under 200KB")

**"Build same image for Arabic version"**
- AI models can't reliably render Arabic text inside images. So which approach are you thinking:
  - Same image, Arabic text added as an overlay on top? (most reliable)
  - Mirrored/flipped layout for RTL visual flow?
  - Completely separate image generated with Arabic-language prompts?
- Who provides the Arabic copy — the user types it, or auto-translate from English?

---

## Section 4 — Scope

> In Scope: "Input fields for description, dimensions, size"

- By **"description"** — is this a free-text field where the user describes what they want? Or structured fields (sport, player, background, etc.) like our current wizard?
- By **"size"** — do you mean file size (KB/MB) or image resolution? Or both?

> "Brand enforcement"

- Is this colors only? Or does it also include logo placement, fonts, and layout templates?

> "Preview & download"

- For download: do users need format options (PNG, JPEG, WebP) or just a single default format?
- Do they need to download mobile + desktop versions together as a bundle?

---

## Section 6 — Functional Requirements

**"Input module"**
- What fields does the user fill in? The current Sports Banner Wizard has: sport, player role, action/pose, background, lighting, occasion, dimensions. Is this the right set, or do you need different/additional fields?

**"AI generation engine"**
- We currently use OpenAI and Google Gemini. Are these the expected providers, or is there a preference for one over the other?

**"Brand consistency module"**
- Beyond color enforcement (which we have), does this include:
  - Automatic logo placement on generated images?
  - Font/typography rules?
  - Safe zones and margins?
  - If yes — who provides the brand guidelines document with these rules?

**"Output module"**
- What formats are needed? PNG, JPEG, WebP, or all three?
- Do you need different quality levels (e.g., preview quality vs. production quality)?

**"Versioning"**
- What does versioning apply to:
  - Generated images? (track v1, v2, v3 of a banner)
  - Prompt configurations? (track changes to input settings)
  - Both?
- Do users need to roll back to a previous version?

---

## Section 7 — Process Flow

> User Input → AI Processing → Image Generation → Optimization → Preview → Download

- What does **"Optimization"** mean in this flow? Is it:
  - Automatic image compression/resizing to meet size requirements?
  - AI-powered quality enhancement (upscaling, sharpening)?
  - Brand compliance check before showing the preview?

---

## Section 8 — Assumptions & Constraints

> "Brand guidelines provided"

- When can we expect the brand guidelines document? This is a dependency for the brand consistency module.

> "File size may impact quality"

- What's the acceptable quality trade-off? Is there a minimum quality standard, or is hitting the exact file size the priority?

> "AI limitations may require review"

- Do you want a **human review step** built into the flow? (e.g., image goes to a reviewer before it's finalized) Or is this just an acknowledgment that some images may need regeneration?

---

## Section 9 — Acceptance Criteria

> "Correct dimensions"

- Pixel-perfect? Or is a small tolerance acceptable (e.g., ±2px)?

> "Brand compliance"

- Who signs off on brand compliance — the design team? Or is it automated checks only?

> "Downloadable outputs"

- Single image download, or do you need batch download (e.g., download all sizes at once)?

---

## Section 10 — Future Enhancements

> "A/B testing, Templates, Multi-language support"

- These are noted as future and we agree. Just confirming — these are **out of scope** for this phase, correct?
- Is multi-language (beyond Arabic) planned for a specific timeline, or just a "nice to have" for later?

---

That's everything from the BRD. Most answers should be quick picks — once we have these, we'll put together the implementation plan.

Looking forward to your responses.
