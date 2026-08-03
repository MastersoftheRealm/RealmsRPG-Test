# Remediation Status — 2026-06 (Historical Snapshot)

**Not current truth.** For post–Aug 2026 audit status, use [`REMEDIATION_STATUS_2026-08.md`](REMEDIATION_STATUS_2026-08.md).
Open work: [`ACTIVE_TASKS.md`](ACTIVE_TASKS.md) · waiting [`WAITING_TASKS.md`](WAITING_TASKS.md) · human [`DEVELOPER_TASK_QUEUE.md`](DEVELOPER_TASK_QUEUE.md).

Kept as a June 2026 remediation snapshot only.

---

## Completed in production (June waves)

- Waves 0-4 remediation shipped to production (build/test/lint green at gate points).
- BE-01 complete: `crafting_sessions.user_id` and `user_enhanced_items.user_id` unified to `text` + FK shape aligned.
- BE-02/06 complete: campaign membership is single-sourced on `campaign_members`; `campaigns.memberIds` dropped.
- BE-04 complete (proper close): campaign auth helper functions moved from exposed `public` schema to non-exposed `private` schema; dependent RLS policies repointed.

---

## June-era deferred items — later disposition

| June ID | Disposition (do not treat as still-deferred here) |
|---------|---------------------------------------------------|
| Security advisor “only HIBP left” | **Superseded** — Aug 2026 audit found more app/DB debt; see `REMEDIATION_STATUS_2026-08.md`. HIBP remains **TASK-353** / DEV-001. |
| HYG-01 — Codex typing / legacy shape | May still apply; track via ACTIVE/WAITING if reopened — not auto-open from this snapshot. |
| DUP-08 — `LoadFromLibraryModal` thin USM wrapper | **Shipped** (TASK-379 era). |
| DUP-11 — `CreatorPageShell` | **Shipped** (TASK-380 era). |
| DUP-05 — dual library pipelines | Partially addressed by later library-selectable unification; verify in FEATURE_INDEX before re-filing. |
| BIG-01 / BIG-02 decomposition | Continued under later facade splits (e.g. TASK-666 wave); not an open June queue. |

---

## Human-only (still accurate)

- **DEV-001** (Dashboard): enable Supabase leaked-password protection — [`DEVELOPER_TASK_QUEUE.md`](DEVELOPER_TASK_QUEUE.md) / **TASK-353**.

---

## Documentation cleanup policy

- Treat [`REMEDIATION_STATUS_2026-08.md`](REMEDIATION_STATUS_2026-08.md) + `ACTIVE_TASKS.md` + `WAITING_TASKS.md` + `DEVELOPER_TASK_QUEUE.md` as active status.
- Treat this file and `ai/archive/HISTORY_INDEX.md` entries as historical snapshots only.
