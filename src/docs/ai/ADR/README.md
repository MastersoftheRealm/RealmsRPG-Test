# ADR — Architecture Decision Records

Lightweight process for **Architect**-role changes. Keep each ADR short.

## When required

- New shared component under `src/components/shared/` or `src/components/ui/`
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
| 0006 | Temp Modifier mode (dual affordance + persist) | Accepted |
| 0007 | Co-located private extracts for shared hot modules | Accepted |
| 0008 | LoadoutBudgetBar in shared | Accepted |
| 0009 | GLR required-facts registry | Accepted |
