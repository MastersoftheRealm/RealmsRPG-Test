# ADR-0018: MixedSpeciesSkillPicker lives in shared/

- **Status:** Accepted
- **Date:** 2026-08-18
- **Deciders:** owner (chat: Architect leftover ack, excluding Legacy route deletion) / agent (Architect)
- **Task:** TASK-820
- **Parent:** ADR-0017 / TASK-798

## Context

ADR-0017 extracted five Legacy creator symbols into `shared/` and deferred `mixed-species-skill-picker.tsx` because the sheet Edit Species ancestry step already imported it from `character-creator/`. That leftover still pointed the sheet at the classic wizard folder.

## Decision

Move `MixedSpeciesSkillPicker` to `src/components/shared/mixed-species-skill-picker.tsx`, export from `@/components/shared`, and update Legacy mixed ancestry + sheet Edit Species. No character-creator shim. No behavior or prop API changes. Do **not** delete `/characters/new/advanced`. Do not fold into TASK-799 list/modal clusters. Do not migrate onto USM (TraitSection-style selectable rows, not a dual species picker). Guided mixed skills stay `GuidedChoiceCard`.

## Consequences

- Positive: Report 02 SHARED leftover closed; TASK-794 folder split can move this with the rest of `shared/`.
- Negative / follow-ups: Allowlist +1 public file. TASK-799 done (confirm/toggle/admin delete). TASK-795 done (ADR-0020). TASK-796 done (ADR-0021). TASK-797 done (ADR-0022). After ADR-0019 this module lives at `src/components/patterns/select/mixed-species-skill-picker.tsx`.
- Rejected alternatives: Compat re-export from `character-creator/` (wrong dependency direction — ADR-0008 / ADR-0017).
