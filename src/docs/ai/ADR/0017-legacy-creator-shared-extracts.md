# ADR-0017: Legacy creator symbols live in shared/

- **Status:** Accepted
- **Date:** 2026-08-18
- **Deciders:** owner (chat: official ack, first Architect leftover) / agent (Architect)
- **Task:** TASK-798

## Context

Audit report 02 classified five `character-creator/` modules as **SHARED** because Guided and/or the character sheet already import them: `AbilityPickButton`, `MixedSpeciesModal`, `PathHelpCard` (+ `PathNotes`), `TraitSection`, `CreatorPortraitUpload`. Leaving them under Legacy misrepresents ownership and keeps sheet/Guided depending on a folder the constitution still treats as the classic wizard.

TASK-791 already extracted currency + appearance-age into `lib/`. This ADR is the UI half: public shared chrome, not private co-located splits (ADR-0007).

## Decision

Move the five modules to kebab-case files under `src/components/patterns/` (chrome/select/help buckets per ADR-0019), export them from `@/components/patterns`, and update all call sites (Legacy, Guided, sheet). No re-export shims in `character-creator/`. No behavior or prop API changes. Do **not** delete `/characters/new/advanced`. `MixedSpeciesModal` stays an intentional non-USM dual picker (TASK-605). `mixed-species-skill-picker.tsx` leftover extracted in ADR-0018 / TASK-820.

## Consequences

- Positive: Correct layer for cross-surface chrome; FEATURE_INDEX / unification table list the shared barrel; TASK-794 folder split can move these with the rest of `shared/`.
- Negative / follow-ups: Allowlist grew by five public files. Remaining report 02 SHARED file (`mixed-species-skill-picker.tsx`) extracted in ADR-0018 / TASK-820. After ADR-0019 these modules live under `src/components/patterns/` (not `shared/`).
- Rejected alternatives: Compat re-exports from `character-creator/` (wrong dependency direction — same as ADR-0008). Migrating MixedSpeciesModal onto USM (product exception).
