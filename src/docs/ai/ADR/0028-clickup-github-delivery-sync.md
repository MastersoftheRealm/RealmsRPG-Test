# ADR-0028: ClickUp ↔ TASK-### ↔ GitHub delivery sync

- **Status:** accepted
- **Date:** 2026-09-24
- **Deciders:** owner (Kadin)

## Context

Agent work lived primarily in `ACTIVE_TASKS.md` with batch commits and often direct `master` pushes. The team also tracks delivery in ClickUp (Web Development → Website) and needs Collin to review PRs before QA. Without a single pipeline, board status, repo tasks, and GitHub diverged. ClickUp MCP also has a **shared workspace rolling daily call limit**, so a heavy sync (search + create + comments + subtasks per task, or mass QA trees) can exhaust the pool for everyone.

## Decision

Default agent delivery is documented in `CLICKUP_GITHUB_WORKFLOW.md`:

1. Every delivery unit has (or eventually links) **one** ClickUp task on the **Website** list.
2. Start work → ClickUp **`in development`** + git branch `task/TASK-###-slug` (~1 MCP call).
3. Finish → open PR → assign **Collin Morrison** → ClickUp **`in review`** (~1 MCP call).
4. After merge → **`testing`** (QA); after QA clear → **`shipped`** (humans).
5. Owner may override any step in chat.
6. **Owner-batched multi-task PRs:** one ClickUp card lists every `TASK-###`; one branch/PR; commit subjects list every id. No ClickUp subtasks unless the owner asks.
7. **MCP budget:** ~2–3 calls per delivery unit; no search-by-default; no progress comments; no mass creates. On rate limit → `clickup_sync: pending`, keep shipping in git, flush once when a task completes or PR opens.

## Consequences

- Positive: visible pipeline for reviewers/QA without burning shared MCP quota; smaller reviewable PRs; batches stay one board card.
- Negative / follow-ups: board may lag briefly when pending; agents must not treat ClickUp as a bulk content store via MCP.
- Rejected alternatives: batch-only master commits as default; mandatory ClickUp subtask per `TASK-###`; search-before-create + comment on every status change.
