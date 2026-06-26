# AI Task Queue (Active Only)

**Last slimmed:** 2026-06-26 (TASK-382). Full history: [`archive/AI_TASK_QUEUE_FULL_BACKUP_2026-06-26.md`](archive/AI_TASK_QUEUE_FULL_BACKUP_2026-06-26.md) and [`archive/TASK_QUEUE_DONE.md`](archive/TASK_QUEUE_DONE.md).

**Next task ID:** TASK-383

**Agent rules:** Skip `blocked` tasks and any task with `assignee:` (e.g. TASK-376). Skip human-only tasks (TASK-353 → `DEVELOPER_TASK_QUEUE.md` DEV-001). Pick highest-priority `not-started` or continue `partial`.

---

- id: TASK-321
  title: Reduce ESLint warnings (batch by rule)
  priority: low
  status: partial
  created_at: 2026-06-12
  created_by: agent
  description: |
    ~324 ESLint warnings dominated by `@typescript-eslint/no-unused-vars`,
    `react-hooks/exhaustive-deps`, and `react-hooks/set-state-in-effect`. Address in batches by rule.
  related_files:
    - (repo-wide)
  acceptance_criteria:
    - Warning count materially reduced; no new errors introduced.
    - `react-hooks/exhaustive-deps` fixes do not change runtime behavior.
    - `npm run build` passes.
  completed_work: |
    - Batch 1 lint fix; 0 errors.
    - Batch 2 (TASK-350): lib/hooks no-unused-vars; character sheet page destructuring; ESLint 393→339 warnings.
  remaining_work: |
    - ~339 ESLint warnings remain (mostly exhaustive-deps, set-state-in-effect, admin any).
  follow_up_tasks:
    - TASK-350
  notes: "2026-06-13 batch 1."

- id: TASK-326
  title: Tighten Supabase security advisors (bucket listing + leaked-password protection)
  priority: medium
  status: partial
  created_at: 2026-06-12
  created_by: agent
  description: |
    Storage SELECT policies scoped; enable HIBP leaked-password check in Supabase Auth.
  related_files:
    - src/docs/DEPLOYMENT_AND_SECRETS_SUPABASE.md
  acceptance_criteria:
    - Storage SELECT policies scoped so buckets aren't broadly listable (read-by-key still works).
    - Leaked-password protection enabled in Supabase Auth.
    - SQL/migration documented; advisors re-checked.
  completed_work: |
    - Storage SELECT hardening applied live (MCP).
  remaining_work: |
    - Enable HIBP in Supabase Auth (DEV-001).
  follow_up_tasks:
    - TASK-353
  notes: "2026-06-13. See DEVELOPER_TASK_QUEUE."

- id: TASK-346
  title: "Systemic token & console cleanup (batch by rule)"
  priority: low
  status: partial
  created_at: 2026-06-12
  created_by: agent
  description: |
    Repo-wide batch cleanup: status colors -600 → -700 in light mode; replace stray gray-*/neutral-* outside auth;
    remove leftover client console.*. Do in small, rule-scoped batches with build between.
  related_files:
    - src/app/globals.css
    - src/components/layout/footer.tsx
    - src/components/shared/roll-button.tsx
  acceptance_criteria:
    - Status/secondary text passes WCAG AA tokens in both modes; no stray gray-*/neutral- outside auth.
    - No client console.* left; npm run build + lint pass.
  completed_work: |
    - Batch 1: footer, roll-button, crafting console.*.
    - Batch 2 (TASK-351): ~38 client console.* removed; home-page/item-creator neutral→semantic; shared status text -600→-700.
  remaining_work: |
    - Residual status -600 on hover/button backgrounds (intentional); some admin/codex body text.
  follow_up_tasks:
    - TASK-351
  notes: "2026-06-13 batch 1."

- id: TASK-353
  title: Enable Supabase leaked-password protection (HIBP)
  priority: medium
  status: not-started
  created_at: 2026-06-13
  parent_task: TASK-326
  assignee: human
  notes: "**Human-only — AI skip.** DEVELOPER_TASK_QUEUE DEV-001."

- id: TASK-376
  title: Retire DB tooltips — full migration to Collin Tippy + tooltip-text.tsx
  priority: high
  status: blocked
  assignee: Collin Morrison
  created_at: 2026-06-25
  created_by: owner
  description: |
    Collin's `@tippyjs/react` + `public/tooltip-text.tsx` is the only tooltip standard.
    **AI agents: do not implement this task.**
  related_files:
    - public/tooltip-text.tsx
    - src/components/shared/context-help-tooltip.tsx
    - src/hooks/use-tooltips.ts
    - src/app/api/tooltips/route.ts
    - src/app/(main)/admin/tooltips/page.tsx
  acceptance_criteria:
    - All contextual help uses Tippy + `public/tooltip-text.tsx`
    - Legacy DB tooltip stack removed; build passes
  notes: |
    **ASSIGNED TO COLLIN — NOT FOR AI AGENTS.** See DEVELOPER_TASK_QUEUE → COLLIN-001.

- id: TASK-378
  title: HYG-01 codex typing hardening + legacy payload compatibility gates
  priority: high
  status: not-started
  created_at: 2026-06-26
  created_by: agent
  description: |
    Replace `fetchCodex`'s `any`-based response typing with a canonical typed payload, preserving
    compatibility adapters for historical data shapes (roll/campaign displays).
  related_files:
    - src/lib/api-client.ts
    - src/hooks/use-codex.ts
    - src/hooks/use-game-data.ts
    - src/hooks/use-game-rules.ts
    - src/components/character-sheet/roll-log.tsx
    - src/types/campaign-roll.ts
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
  acceptance_criteria:
    - `fetchCodex` returns a strongly typed payload (no broad `Record<string, any[]>`).
    - All `useCodex*`/rules consumers compile without `any` fallback leakage.
    - Roll timestamp compatibility remains safe for ISO + legacy `{ seconds }` payloads.
    - `photoURL` semantics documented as active auth/profile alias.
    - `npm run build`, `npm test`, and `npm run lint` pass.
    - Build validation suite added/indexed for codex + roll-log compatibility checks.
  notes: |
    Planned from remediation close-out. Compatibility-first phases required.

- id: TASK-379
  title: DUP-05/08 unify library selection pipelines and make LoadFromLibraryModal a thin wrapper
  priority: high
  status: not-started
  created_at: 2026-06-26
  created_by: agent
  description: |
    Unify add/load library selection pipelines into one builder+normalizer path; refactor
    `LoadFromLibraryModal` into a thin wrapper over `UnifiedSelectionModal`.
  related_files:
    - src/hooks/use-load-modal-library.ts
    - src/hooks/add-library-item/
    - src/lib/library-selectable-builders.ts
    - src/components/creator/LoadFromLibraryModal.tsx
    - src/components/shared/unified-selection-modal.tsx
    - src/docs/ai/BUILD_VALIDATION.md
  acceptance_criteria:
    - Single shared pipeline for selectable-item shaping used by add + load flows.
    - `LoadFromLibraryModal` is wrapper-level composition, not a parallel list implementation.
    - No behavior regressions in powers/techniques/items/creatures/species load-add flows.
    - `npm run build`, `npm test`, and `npm run lint` pass.
    - Build validation coverage added for add/load parity per creator type.
  notes: |
    Deferred from remediation waves. Requires QA-first execution.

- id: TASK-380
  title: DUP-11 + collapsible consolidation with CreatorPageShell rollout
  priority: medium
  status: not-started
  created_at: 2026-06-26
  created_by: agent
  description: |
    Introduce shared creator-page shell scaffolding and consolidate collapsible patterns after parity tests exist.
  related_files:
    - src/app/(main)/power-creator/page.tsx
    - src/app/(main)/technique-creator/page.tsx
    - src/app/(main)/empowered-technique-creator/page.tsx
    - src/app/(main)/item-creator/page.tsx
    - src/app/(main)/species-creator/page.tsx
    - src/app/(main)/creature-creator/page.tsx
    - src/components/creator/
    - src/docs/ai/BUILD_VALIDATION.md
  acceptance_criteria:
    - Shared CreatorPageShell removes duplicated auth/load/save scaffolding.
    - Collapsible usage consolidated to supported patterns.
    - Creator page behavior equivalent across all six routes.
    - `npm run build`, `npm test`, and `npm run lint` pass.
    - Dedicated creator parity validation suite added before merge.
  notes: |
    Execute after TASK-379 and associated QA harness.

- id: TASK-381
  title: BIG-01/02 phased decomposition of character-sheet and creator god files
  priority: medium
  status: not-started
  created_at: 2026-06-26
  created_by: agent
  description: |
    Decompose large character-sheet/creator files via phased extractions with test-backed parity checkpoints.
  related_files:
    - src/components/character-sheet/use-character-sheet-actions.ts
    - src/app/(main)/characters/[id]/page.tsx
    - src/app/(main)/*-creator/page.tsx
    - src/docs/ai/BUILD_VALIDATION.md
  acceptance_criteria:
    - `use-character-sheet-actions` split by domain boundaries without behavior regressions.
    - Targeted large creator/sheet routes decomposed into stable shells/islands in phases.
    - Each phase ships with explicit parity validation and rollback plan.
    - `npm run build`, `npm test`, and `npm run lint` pass per phase.
  notes: |
    High blast radius — proceed only with expanded DEV-V validation and small-scope PRs.

- id: TASK-382
  title: Docs compaction pass (active queue slimming + stale-reference pruning)
  priority: medium
  status: done
  created_at: 2026-06-26
  created_by: agent
  description: |
    Keep active docs lean: move historical audits and done task blocks out of agent line-of-sight;
    prune stale references in active guidance docs.
  related_files:
    - src/docs/ai/AI_TASK_QUEUE.md
    - src/docs/ai/archive/
    - src/docs/ai/AGENT_GUIDE.md
    - src/docs/README.md
    - AGENTS.md
    - .cursorignore
  acceptance_criteria:
    - `AI_TASK_QUEUE.md` contains only active/pending work; history in archive.
    - Active docs contain no stale route/component references unless marked historical.
    - Archive pointers explicit; `.cursorignore` excludes archive from indexing.
    - `npm run build` passes.
  notes: |
    DONE 2026-06-26: Slimmed queue to 10 active entries; moved June audits + root CODEBASE_AUDIT to
    `ai/archive/`; human onboarding/reference to `src/docs/human/`; added HISTORY_INDEX.md + .cursorignore.
