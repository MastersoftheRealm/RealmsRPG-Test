# ClickUp ↔ Codebase ↔ GitHub delivery sync

**Status:** adopted (owner 2026-09-24; MCP budget tightened same day) · **Authority** for agent delivery linkage  
**ClickUp home:** Web Development → **Website** list (`901708996877`) — https://app.clickup.com/9017636492/v/l/li/901708996877  
**Code reviewer (PR):** Collin Morrison (ClickUp user `44381886`)  
**Owner override:** The owner may skip or alter any step in chat (“batch these”, “no PR”, “skip ClickUp”). Unless overridden, follow this doc.

## Goal

| System | Identifier | Role |
|--------|------------|------|
| Codebase | `TASK-###` in `ACTIVE_TASKS.md` / archive | Spec, AC, DoD, verification |
| ClickUp | One Website task per delivery unit | Team board, status, assignees |
| GitHub | Branch + PR | Review, merge, CI |

**Default:** one delivery unit = one ClickUp Website task + one branch + one PR.  
A delivery unit is usually one `TASK-###`. Owner-batched work = **one** ClickUp card that lists every `TASK-###` in the description (no ClickUp subtasks unless the owner asks).

## MCP budget (do not burn the workspace)

ClickUp MCP is a **shared workspace daily/rolling limit**. Every search, get, create, update, and comment counts.

**Hard rules for agents:**

1. **At most ~2–3 ClickUp MCP calls per delivery unit** in the happy path:
   - Start: **one** `clickup_create_task` *or* `clickup_update_task` if `clickup_task_id` already exists (set **`in development`**).
   - Hand off: **one** `clickup_update_task` → **`in review`** + assign Collin + PR URL in the description (or a single comment if the update cannot carry the URL).
2. **Do not** search-then-create by default. Prefer create with name `TASK-###: <title>`. Search only when the owner says a card already exists and the id is unknown.
3. **Do not** comment for “started on branch”, progress chatter, or status narration.
4. **Do not** create ClickUp subtasks, bulk checklists, or mass QA trees as part of normal delivery. Bulk list work (e.g. Build Test Sweep) is owner-directed and should wait for quota / a higher plan — never dump hundreds of MCP creates into the shared pool.
5. **Do not** call ClickUp MCP at session start “just to sync.” Code first; ClickUp only at start/handoff (or pending flush).

### Rate limit / pending flush

If MCP returns rate-limit / daily limit:

1. **Stop** further ClickUp MCP calls this session.
2. Keep coding / PR work. On the codebase task set `clickup_sync: pending` and a one-line note of what still needs filing (create link, or `in review` + Collin + PR URL).
3. **After each `TASK-###` reaches implementable done (or when opening the PR):** if any open/archived task on this branch has `clickup_sync: pending`, try **one** flush attempt for the current delivery unit. If still limited, leave pending and tell the owner once.
4. Pending ClickUp does **not** block `done` / archive / PR. Repo + GitHub stay the source of truth until the flush lands.

## Website list statuses (exact names)

| ClickUp status | When |
|----------------|------|
| `ready for development` | Filed / ready (optional; often skip straight to `in development`) |
| `in development` | Actively implementing |
| `in review` | PR open; Collin assigned |
| `testing` | Merged; waiting on QA (human) |
| `shipped` | QA cleared (human) |
| `backlog` / `cancelled` | Owner only |

Do **not** invent `in progress` — use **`in development`**.

Bugs may already live in **Website Bugs**. Prefer updating that card over duplicating. New agent feature work defaults to **Website**.

## Lifecycle (lean)

```
ACTIVE_TASKS TASK-###  ←→  one ClickUp Website task  ←→  git branch + PR
        │                         │                           │
   in-progress            in development               task/TASK-###-slug
   done (archive)         in review (+ Collin)         PR open
   pending-qa             testing (human)              merged
   verified               shipped (human)              —
```

### 1. Start work (~1 MCP call)

1. Checkout `task/TASK-###-short-slug` (or owner batch branch).
2. If `clickup_task_id` missing: create Website task `TASK-###: <title>` with short markdown (summary + AC bullets + “Repo: TASK-###”), status **`in development`**. Record `clickup_task_id` / `clickup_url`.
3. If id already known: one update → **`in development`**.
4. Codebase `status: in-progress`.

Skip ClickUp create when filing new tasks into `ACTIVE_TASKS` only — create/link when **starting** implementation (or flush later if pending).

### 2. Finish → PR + Collin (~1 MCP call)

When implementable AC are met:

1. Commit (subject lists every `TASK-###` in the PR) → push → PR → `master`.
2. PR body: `TASK-###` id(s), ClickUp link if known, how to test.
3. Archive / `verification_status` / changelog as usual.
4. ClickUp: **`in review`**, assign **Collin Morrison**, include PR URL (description or one comment).
5. Agent stops unless asked for review fixes.

### 3. After merge / QA (human)

Merge → **`testing`**. QA clear → **`shipped`**. Agents only touch these if the owner says merge/QA already happened.

## Owner-batched multi-task PR

One branch/PR, **one** ClickUp card named like `Batch: <theme> (TASK-A + TASK-B)`. Description lists each `TASK-###`. Each codebase task records the same `clickup_task_id` / `clickup_url`. Commit subjects list every id. No ClickUp subtasks unless the owner asks.

## Codebase fields

See `AI_REQUEST_TEMPLATE.md`:

- `clickup_task_id` / `clickup_url` — when linked
- `clickup_sync: pending` — ClickUp create/handoff still owed (rate limit or deferred)
- `github_branch` / `pr_link`

## Best practices

- Repo tasks + GitHub remain authoritative if ClickUp is pending.
- Never fork a second Website card for the same `TASK-###`.
- Do not mark `in review` without a real PR URL; do not mark `shipped` from the agent.
- Owner “skip ClickUp” → no MCP; still put every `TASK-###` in the landing commit subject.

## Tooling

ClickUp Cursor plugin: `clickup_create_task`, `clickup_update_task`, `clickup_create_comment` (handoff only if needed). Avoid `clickup_search` / `clickup_filter_tasks` / `clickup_get_task` unless required to recover an unknown id.

## Related

- Process: `AI_TASK_QUEUE.md`
- Template: `AI_REQUEST_TEMPLATE.md`
- DoD / verification: `ARCHITECTURE_CONSTITUTION.md`
- PR gates: `PR_CHECKLIST.md`
