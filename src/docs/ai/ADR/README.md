# ADR — Architecture Decision Records

Lightweight process for **Architect**-role changes. Keep each ADR short.

## When required

- New shared component under `src/components/patterns/` or primitive under `src/components/ui/`
- New zustand store or new state-management approach
- Breaking or cross-client API contract change
- Choosing between two durable patterns (not a one-file bugfix)

**Skip ADR** when extending an existing pattern with a prop/variant, or when the owner explicitly acks in chat (note that ack in `DEVELOPER_TASK_QUEUE.md` or the task notes).

## How

1. Copy `0000-template.md` → `NNNN-short-slug.md` (next number).
2. Fill Context / Decision / Consequences (≤ ~40 lines).
3. Link from the PR / task notes.
4. Implement. Prefer deleting the rejected parallel approach.

## Index

| ID | Title | Status |
|----|-------|--------|
| 0000 | Template | — |
| 0001 | User Library entity tab shell | Accepted |
| 0002 | Unified ValueStepper chrome | Accepted |
| 0003 | Realms Image Library (shared bank + image_id) | Accepted |
| 0004 | PathGuidanceGroup audience (character vs archetype) | Accepted |
| 0005 | Codex browse list shell | Accepted |
| 0006 | Temp Modifier mode (sheet-level exclusive + persist) | Amended (TASK-782) |
| 0007 | Co-located private extracts for shared hot modules | Accepted |
| 0008 | LoadoutBudgetBar in shared | Accepted |
| 0009 | GLR required-facts registry | Superseded by 0016 |
| 0010 | Lib layer dependency direction | Accepted |
| 0011 | List search toolbar | Accepted |
| 0012 | Guided L3 inline catalog list | Accepted |
| 0013 | Character dirty-key PATCH + updatedAt 409 | Accepted (TASK-786 same-tab queue) |
| 0014 | Archetype Path filter reads path recommendation arrays live | Accepted |
| 0015 | Wave 3B fetch contracts (enrichment + counts + codex collection) | Accepted (TASK-773 / TASK-774 / TASK-775) |
| 0016 | GLR fact catalog, density modes, and layout solver | Accepted (TASK-806 / TASK-807 / TASK-810) |
| 0017 | Legacy creator symbols live in shared/ | Accepted (TASK-798) |
| 0018 | MixedSpeciesSkillPicker lives in shared/ | Accepted (TASK-820) |
| 0019 | Split shared/ into ui / patterns / feature | Accepted (TASK-794) |
| 0020 | Generated Supabase Database types | Accepted (TASK-795) |
| 0021 | First-party MDX rulebook + Codex detail metadata | Accepted (TASK-796) |
| 0022 | Enable `noUncheckedIndexedAccess` | Accepted (TASK-797) |
| 0023 | Responsive layout contracts and tiered touch targets | Accepted (TASK-831) |
| 0024 | Enable `exactOptionalPropertyTypes` | Accepted (TASK-824) |
| 0025 | Admin Codex CRUD chrome stays tab-local | Accepted (TASK-842 / TASK-845) |
