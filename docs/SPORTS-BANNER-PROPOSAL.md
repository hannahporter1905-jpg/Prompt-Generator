# Sports Banner Generator — Proposal
**Date:** April 8, 2026
**For:** Product & Marketing Team

---

## What This Is

Based on the BRD for "AI Image Generator for Sportsbook Promotions," here's what we'll build. We're taking a **build → try → feedback → improve** approach — you'll get a working mockup to test, then we iterate based on your input.

---

## What Already Works (You Can Try These Now)

These are live at the current tool:

| Feature | How It Works |
|---|---|
| **AI image generation** | OpenAI + Google Gemini + Cloud Run, up to 4K resolution |
| **Sports Banner Wizard** | 5-step guided form: pick sport → player setup → positioning → background & lighting → size |
| **9 brands supported** | FortunePlay, PlayMojo, SpinJo, Roosterbet, SpinsUp, LuckyVibe, Lucky7even, NovaDreams, Rollero |
| **Brand color enforcement** | Automatic color-lock per brand |
| **Preview & regenerate** | See the image, don't like it, regenerate with one click |
| **4 variation modes** | Get 4 versions at different creativity levels from one prompt |
| **Multiple aspect ratios** | Portrait, Square, Landscape + custom dimensions |

---

## What We're Adding — Phase 1

### 1. Free-Text Prompt Mode
**What:** A simple text box where you type what you want in plain English.
**Example:** *"Create a Basketball banner for a versus match with players on each side, leaving center space for text"*
**Why:** Faster than the 5-step wizard for users who know exactly what they want. The wizard is still available for guided creation.

### 2. Multi-Size Batch Generation
**What:** Enter multiple dimensions (e.g., 2588x312, 1440x312, 1200x600, 720x600) and generate the same image in ALL sizes from one prompt.
**Why:** You need mobile + desktop + various banner formats from a single design. No more generating one at a time.

### 3. File Size Control (512KB Target)
**What:** Set a maximum file size (default 512KB for CMS). The system auto-compresses output to meet the target.
**Why:** Your CMS requires files under 512KB. Currently there's no file size control.

### 4. Arabic Mirror Toggle
**What:** A simple YES/NO switch — "Generate Arabic (mirrored) copy?" When enabled, the system generates a horizontally flipped version alongside the original.
**Example:** Player on the right → mirrored version has player on the left.
**Why:** Arabic layouts need RTL visual flow. Since banners have no text, a mirror flip is all that's needed.

### 5. Batch Download
**What:** Download all generated sizes at once. Choose PNG or JPEG (or both). Each size saves as a separate file.
**Why:** Currently you can only download one image at a time. With multi-size generation, you need batch download.

### 6. Human Review Step
**What:** After generation, an "Approve" or "Reject & Regenerate" button before the image is finalized for download.
**Why:** Gives the team a clear checkpoint to verify the output before using it.

### 7. Version History
**What:** See all previously generated versions of a banner. Click any version to view it. Regenerate from any previous version.
**Why:** Track what was generated and go back to a version you liked.

---

## Phase 2 (After Feedback)

These are more complex and will be scoped after you've tested Phase 1:

| Feature | Description |
|---|---|
| **Version compositing** | Mix elements from different versions ("player from v1 + background from v2") |
| **Full brand guidelines** | Logo placement, typography, safe zones (waiting on Elena's brand doc) |
| **Advanced optimization** | AI upscaling, sharpening, quality enhancement |
| **Formal approval workflow** | Multi-reviewer approval chain with status tracking |
| **A/B testing** | Compare banner performance (from BRD future enhancements) |
| **Templates** | Pre-built banner templates (from BRD future enhancements) |

---

## What We Need From You

| Item | Who | Status |
|---|---|---|
| Brand guidelines document (colors, themes, logos, fonts) | Elena / Design Team | Pending |
| Test the current tool + new mockups and give feedback | Product / Marketing | After we deploy mockups |
| Confirm the priority order above makes sense | Product | Pending |
| Share reference banners for each brand if available | Marketing / Design | Pending |

---

## Timeline

We'll deploy the Phase 1 mockups for you to try. Once you give feedback, we iterate. No long planning cycles — build, test, improve.
