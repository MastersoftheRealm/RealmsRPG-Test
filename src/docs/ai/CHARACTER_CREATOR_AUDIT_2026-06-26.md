# Character Creator Localized Audit — 2026-06-26

> **Scope:** `src/components/character-creator/**`, `src/app/(main)/characters/new/page.tsx`, `src/stores/character-creator-store.ts`, `src/lib/character-creator-validation.ts`.
> **Method:** Same 10-lens rubric as [`SYSTEMATIC_AUDIT_2026-06.md`](SYSTEMATIC_AUDIT_2026-06.md) (Area 5).
> **Companion:** [`FULL_AUDIT_2026-06.md`](FULL_AUDIT_2026-06.md) pathology taxonomy; prior Area 5 findings in systematic audit § Area 5.

## How to read this document

Dispositions match the full audit:

- **[SAFE-FIX]** — applied in the 2026-06-26 pass (or prior pass, noted).
- **[QUEUED → TASK-###]** — tracked in `AI_TASK_QUEUE.md` when a task exists; otherwise listed for follow-up.
- **[NOTE]** — informational / accepted.

### The 10-lens rubric (applied)

1. Purpose & fit · 2. UI consistency · 3. UX / QOL · 4. Mobile · 5. Accessibility · 6. Code health · 7. Data / fetch · 8. Security · 9. Performance · 10. Consistency with siblings

---

## Summary (2026-06-26 pass — complete)

| Lens | Status | Highlights |
|------|--------|------------|
| Purpose & fit | Good | Full creator→sheet loop; path vs forge modes; guest persist until save |
| UI consistency | Good | Shared `CreatorStepFooter`; species modal matches confirm-on-right pattern |
| UX / QOL | Good | Sticky step nav on all steps including archetype pick flow |
| Mobile | Good | Species/mixed modals use `fullScreenOnMobile`; step footers ≥44px |
| Accessibility | Good | Tab bar touch targets + `aria-current`; card keyboard; portrait remove label |
| Code health | Good | Footer chrome deduped; `apiUpload` for portrait; store schema version |
| Data / fetch | OK | Codex hooks + merged species; validation uses shared currency constant |
| Security | OK | Save gated on auth; validation before API |
| Performance | OK | No god-file growth in this pass |
| Sibling consistency | Good | Reuses `AbilityScoreEditor`, `SkillsAllocationPage`, `HealthEnergyAllocator` |

---

## Findings

### Resolved in 2026-06-26 pass

- **CC-26-1 [SAFE-FIX]** — `SpeciesModal` Pick Me / Nah scrolled away on long species pages. Added `flexLayout` + sticky footer slot; Nah (secondary) left, Pick Me (primary) right (`species-modal.tsx`).
- **CC-26-2 [SAFE-FIX]** — Step Continue bars were not sticky on Abilities, Skills, Feats, Powers, Equipment, Finalize. Introduced `CreatorStepFooter` and applied across all steps (`creator-step-footer.tsx`, all `steps/*`).
- **CC-26-3 [SAFE-FIX]** — `SkillsAllocationPage` footer was static at document bottom. Footer wrapper now sticky (`skills-allocation-page.tsx`).
- **CC-26-4 [SAFE-FIX]** — Species modal skill-dismiss control lacked `aria-label` (SA-5-11) (`species-modal.tsx`).
- **CC-26-10 [SAFE-FIX]** — Archetype pick flow Confirm button not sticky. Replaced with `CreatorStepFooter` primary action (`archetype-step.tsx`).
- **CC-26-11 [SAFE-FIX]** — Tab-bar validation modal and finalize `ValidationModal` use `flexLayout` (`creator-tab-bar.tsx`, `finalize-step.tsx`).
- **CC-26-12 [SAFE-FIX]** — Species modal duplicated name in Modal `title` + inner `<h2>` — removed inner title (`species-modal.tsx`).
- **CC-26-13 [SAFE-FIX]** — Feats step selected cards used raw `bg-white` → `bg-surface` (`feats-step.tsx`).
- **CC-26-14 [SAFE-FIX]** — Sticky footers only on Species/Ancestry before this pass — addressed by CC-26-2.
- **CC-26-15 [SAFE-FIX]** — Species/mixed species cards: `role="button"`, keyboard Enter/Space (`species-step.tsx`).
- **CC-26-16 [SAFE-FIX]** — Creator tab buttons min 44px + `aria-current="step"` (`creator-tab-bar.tsx`).
- **CC-26-17 [SAFE-FIX]** — Archetype ability picks / mixed-species skill pills min 44px (`archetype-step.tsx`, `ancestry-step.tsx`).
- **CC-26-18 [SAFE-FIX]** — Portrait remove: `aria-label`, min touch target (`finalize-step.tsx`).
- **CC-26-19 [SAFE-FIX]** — Continue gating: Abilities, Skills, Feats, Equipment (`continueDisabled` via shared validation); Powers optional (no hard requirements); Finalize uses validation modal on create (`abilities-step.tsx`, `skills-step.tsx`, `feats-step.tsx`, `equipment-step.tsx`, `powers-step.tsx`).
- **CC-26-20 [SAFE-FIX]** — HE overspend/unspent flagged on finalize step + aggregate validation (not abilities step, where HE is not allocated) (`character-creator-validation.ts`).
- **CC-26-21 [SAFE-FIX]** — Persist schema version `CREATOR_STORE_SCHEMA_VERSION` + migrate reset (`character-creator-store.ts`).
- **CC-26-22 [SAFE-FIX]** — `LoginPromptModal` preserves query params via `creatorReturnPath` (`finalize-step.tsx`).
- **CC-26-23 [SAFE-FIX]** — Portrait upload uses shared `apiUpload` (`api-client.ts`, `finalize-step.tsx`).
- **CC-26-25 [SAFE-FIX]** — `resetCreator()` clones fresh draft via `cloneInitialDraft()` (`character-creator-store.ts`).
- **CC-26-28 [SAFE-FIX]** — `MixedSpeciesModal` uses `flexLayout` for sticky footer.

### Resolved earlier (TASK-356 / prior work — verified 2026-06-26)

- **CC-26-5 [SAFE-FIX]** — Tab skip ancestry: `canNavigateToStep` uses `completedSteps`, not `ancestry.id` alone (`character-creator-store.ts`).
- **CC-26-6 [SAFE-FIX]** — Step guards require completed prior steps (`character-creator-store.ts`).
- **CC-26-7 [SAFE-FIX]** — Mixed-species validation (size, 2 skills, trait choices) (`character-creator-validation.ts`).
- **CC-26-8 [SAFE-FIX]** — Starting currency 200c via `CHARACTER_STARTING_CURRENCY` (store + validation).
- **CC-26-9 [SAFE-FIX]** — Archetype change clears downstream via `downstreamDraftReset()` / `reselectArchetype()` (`character-creator-store.ts`).

### Informational (no action)

- **CC-26-24 [NOTE]** — Good reuse: `AbilityScoreEditor`, `SkillsAllocationPage`, `HealthEnergyAllocator`, `UnifiedSelectionModal`, Collin tooltips on several steps.
- **CC-26-26 [NOTE]** — Creator mounted at `/characters/new` only — **SA-5-24**.
- **CC-26-27 [NOTE]** — Species modal: `fullScreenOnMobile` + `flexLayout` gives sticky header/footer on small viewports and desktop overflow.

---

## Step footer audit (post-fix)

| Step | Sticky nav | Primary action right |
|------|------------|----------------------|
| Archetype (locked) | Yes (`CreatorStepFooter`) | Yes |
| Archetype (pick flow) | Yes (`CreatorStepFooter`) | Yes |
| Species | Yes | Yes |
| Ancestry (all branches) | Yes | Yes |
| Abilities | Yes | Yes |
| Skills | Yes (via `SkillsAllocationPage`) | Yes |
| Feats | Yes | Yes |
| Powers | Yes | Yes |
| Equipment | Yes | Yes |
| Finalize | Yes | Yes (Create / Review) |
| Species detail modal | Yes (`flexLayout` footer) | Yes (Pick Me right) |
| Mixed species modal | Footer slot + `flexLayout` | Yes (Confirm right) |

---

## Changelog

- 2026-06-26: Full audit implementation pass — all CC-26 findings resolved or verified against TASK-356.
- 2026-06-26: Initial localized audit after sticky footer + species modal UX pass.
