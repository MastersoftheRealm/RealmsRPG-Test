# Remediation Status — 2026-06 (Current Truth)

Use this file as the **current** status of the June 2026 remediation effort.

- Historical snapshots: `ai/archive/HISTORY_INDEX.md` (June audits, full task backup)
- Active execution queue: `AI_TASK_QUEUE.md`
- Human-only actions: `DEVELOPER_TASK_QUEUE.md`

---

## Completed in production

- Waves 0-4 remediation shipped to production (build/test/lint green at gate points).
- BE-01 complete: `crafting_sessions.user_id` and `user_enhanced_items.user_id` unified to `text` + FK shape aligned.
- BE-02/06 complete: campaign membership is single-sourced on `campaign_members`; `campaigns.memberIds` dropped.
- BE-04 complete (proper close): campaign auth helper functions moved from exposed `public` schema to non-exposed `private` schema; dependent RLS policies repointed.
- Security advisor now reduced to dashboard-only leaked-password toggle (DEV-001). Performance advisor is INFO-only unused indexes.

---

## Open / deferred by design

These are intentionally deferred due to risk/QA constraints, not forgotten.

### HYG-01 — Codex typing and legacy-shape cleanup

Why deferred:
- `photoURL` is still the active avatar field in the current auth/profile path (not dead Firebase residue).
- Firestore `{ seconds }` timestamp parsing in roll display is a defensive compatibility shim for historical payloads.
- Tight typing `fetchCodex` cascades through all `useCodex*` hooks and selectors; needs coordinated refactor.

Execution plan:
1. Add focused type tests around `fetchCodex` result shape and `useCodex*` selectors.
2. Introduce a typed codex payload interface (non-breaking) while keeping compatibility adapters.
3. Remove `any` return from `fetchCodex` and update hook signatures.
4. Keep timestamp compatibility adapter until historical data migration is validated in production telemetry.
5. Only remove compatibility branches after QA confirms no legacy payload usage.

QA gate:
- `npm run build`, `npm test`, `npm run lint`
- DEV-V suite for codex reads + roll-log timestamp rendering with legacy and ISO payloads.

### DUP-05 / DUP-08 / DUP-11 + collapsible consolidation

Why deferred:
- These touch shared creator/sheet workflows with high regression blast radius and currently limited automated coverage.

Execution plan:
1. **DUP-05:** unify dual library pipelines to one builder + one normalizer.
2. **DUP-08:** make `LoadFromLibraryModal` a thin wrapper over `UnifiedSelectionModal`.
3. **DUP-11:** introduce `CreatorPageShell` for shared creator-page scaffolding.
4. Consolidate collapsible patterns only after wrapper parity checks pass.

QA gate:
- Add/expand DEV-V suites for creator load/save across all creator types.
- Manual smoke on character sheet add/load/edit flows before merge.

### BIG-01 / BIG-02 decomposition

Why deferred:
- Large file decomposition is behavior-neutral churn unless guarded by robust flow tests.

Execution plan:
1. Extract and test domain boundaries first (library actions, feat/trait actions, roll actions).
2. Create server-shell + client-island split behind parity tests.
3. Migrate one page at a time with rollback-ready PRs (no batched mega-refactor).

QA gate:
- New dedicated validation suite for decomposed pages.
- Staged rollout with production smoke checklist.

---

## Human-only action still required

- **DEV-001** (Dashboard): enable Supabase leaked-password protection.
  - Reference: `DEVELOPER_TASK_QUEUE.md`

---

## Documentation cleanup policy

To keep docs slim and current:

- Treat this file + `AI_TASK_QUEUE.md` + `DEVELOPER_TASK_QUEUE.md` as active status.
- Treat `ai/archive/HISTORY_INDEX.md` entries as historical snapshots only.
- When an old audit item is fully resolved, do not leave it as implied-open in active guides.
