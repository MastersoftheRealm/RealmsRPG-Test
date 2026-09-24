# AI Task Queue — Process

**Agent-eligible tasks:** [`ACTIVE_TASKS.md`](ACTIVE_TASKS.md)  
**Blocked / human-owned:** [`WAITING_TASKS.md`](WAITING_TASKS.md)  
**Done history:** [`archive/TASK_QUEUE_DONE.md`](archive/TASK_QUEUE_DONE.md) · snapshot [`archive/TASK_QUEUE_DONE_2026-07-15.md`](archive/TASK_QUEUE_DONE_2026-07-15.md)  
**Delivery sync (ClickUp + GitHub):** [`CLICKUP_GITHUB_WORKFLOW.md`](CLICKUP_GITHUB_WORKFLOW.md) · ADR-0028

Agents must **not** load WAITING, the done archive, or historical dumps at session start. Read **`ARCHITECTURE_CONSTITUTION.md`** + **`ACTIVE_TASKS.md`**.

**Next task ID:** see header of `ACTIVE_TASKS.md`.

## Workflow

1. Pick highest-priority open task in `ACTIVE_TASKS.md` (`not-started` / continue `partial` / `in-progress`).
2. Blocked or human `assignee:` work stays in `WAITING_TASKS.md` until unblocked.
3. **ClickUp + branch (default — owner may override):** Checkout `task/TASK-###-short-slug`. Create/update **one** Website ClickUp card → **`in development`** (~1 MCP call), or set `clickup_sync: pending` if rate-limited. Record ids when linked. Owner batch → one card listing all `TASK-###`s. See `CLICKUP_GITHUB_WORKFLOW.md` (MCP budget).
4. Set codebase `status: in-progress` while working.
5. Mark **`done`** when all implementable acceptance criteria pass (build, targeted tests, docs — see constitution Definition of Done). Set **`verification_status`** on archive (see Verification gate). Otherwise **`partial`** + `completed_work` / `remaining_work` / `follow_up_tasks`.
6. When marking `done`: move the task block from `ACTIVE_TASKS.md` into `archive/TASK_QUEUE_DONE.md` (append). If user-facing and manual QA not yet run → `verification_status: pending-qa` and add to `DEVELOPER_TASK_QUEUE.md` → Pending owner QA. Prefer keeping ACTIVE under ~20 KB / ≤40 items. If any `clickup_sync: pending` on this delivery, try **one** ClickUp flush.
7. **Hand off for review (default):** Commit on the task branch (subject includes `TASK-###`), open PR → `master`, one ClickUp update → **`in review`** + Collin + PR URL (or leave pending). Agents stop unless asked for review fixes. After merge → humans move ClickUp to **`testing`**; after QA → **`shipped`**.
8. Append `AI_CHANGELOG.md`. User-facing: `BUILD_VALIDATION.md` + `developer_test_plan` as required.
9. Human-only steps → `DEVELOPER_TASK_QUEUE.md`.

## New tasks

Use [`AI_REQUEST_TEMPLATE.md`](AI_REQUEST_TEMPLATE.md). Add to **`ACTIVE_TASKS.md`** (or `WAITING_TASKS.md` if blocked/human). Update the Next task ID on ACTIVE. Create/link ClickUp when **starting** the work — not required at file-time.

## Evidence / CI

`npm run tasks:validate` — strict reconcile, doc links, FEATURE_INDEX + generated barrels, related_files, shared/ui allowlist. Run **before push** / opening a PR when you touched tasks or archives.

**Per-task branch + PR (default):** One `TASK-###` → one branch → one PR. Commit subjects must include `TASK-###`.

**Owner batch:** One ClickUp card + one branch/PR listing every `TASK-###`. Commit subject(s) list every id. See `CLICKUP_GITHUB_WORKFLOW.md`.

**Strict reconcile:** Every `status: done` task with `completed_at` on/after the CI `--strict-since` date that is **already in HEAD** must appear in **some** commit subject (`git log --all --grep=TASK-###`). Put every newly done `TASK-###` in that landing subject (space-separated). En-dash ranges (`TASK-530–534`) and changelog-only mentions do **not** count. Squash merges that rewrite subjects often wipe evidence — re-commit IDs explicitly.

Local `npm run tasks:reconcile:strict` uses `--allow-uncommitted-done` so archive rows that exist only in the working tree do not fail mid-session. CI (`ai-task-verifier.yml`) omits that flag.

**Unique IDs:** `ACTIVE_TASKS.md`, `WAITING_TASKS.md`, and live `archive/TASK_QUEUE_DONE.md` must not repeat a `- id: TASK-###` (TASK-719 class). Ids must be `TASK-` + digits only (`TASK-199b` is invalid). The dated snapshot `TASK_QUEUE_DONE_2026-07-15.md` is a copy and is excluded.

**related_files:** Open tasks (`not-started` / `in-progress` / `partial` / `blocked`) must list paths that exist in the tree. Verify with `ls` / editor, not guessed names (hooks often live in barrels like `use-codex.ts`, not `use-codex-skills.ts`).

Uploads: eslint `realms/no-raw-upload-fetch`.

## Schema / codex

See constitution **Migrations** policy and `.cursor/rules/realms-codex-data.mdc`. No Prisma.
