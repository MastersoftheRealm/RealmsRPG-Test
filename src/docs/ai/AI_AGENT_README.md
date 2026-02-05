# AI Agent README

Purpose
- Provide a single canonical entry point describing how AI agents should read, write, and use the repo-level docs for continuity across sessions.

Where to look
- `ALL_FEEDBACK_CLEAN.md`: canonical raw owner feedback (append-only).
- `src/docs/ai/AI_TASK_QUEUE.md`: prioritized actionable tasks (machine-parseable YAML-like list).
- `src/docs/ai/AI_REQUEST_TEMPLATE.md`: canonical template to format extracted requests.
- `src/docs/ai/AI_CHANGELOG.md`: append-only agent change log with date/agent/summary/files/PR.

Agent Responsibilities
- On session start: read `AI_AGENT_README.md` then `AI_TASK_QUEUE.md` and `ALL_FEEDBACK_CLEAN.md`.
- Convert raw feedback into `AI_TASK_QUEUE.md` entries using `AI_REQUEST_TEMPLATE.md`.
- When performing work: create a branch, open a PR, and append a changelog entry to `AI_CHANGELOG.md`.
- Update `AI_TASK_QUEUE.md` task status (not-started → in-progress → done).

Session prompt & automation
- A recommended session prompt is stored at `src/docs/ai/AGENT_SESSION_PROMPT.md` — use it at session start.
- A simple extractor script `scripts/extract_feedback.js` can convert raw entries in `ALL_FEEDBACK_CLEAN.md` into tasks in `AI_TASK_QUEUE.md` (run locally and review results before committing).

Autonomy modes
- This repo supports three autonomy modes for agents: `autonomous`, `semi-autonomous`, and `approval-required`.
- Current recommended default: `semi-autonomous` — agents will parse and triage raw feedback automatically, infer priorities, and implement only low-risk tasks. Agents should open PRs for code changes and request human approval for high-risk or UI-wide changes.
- To change modes, update `src/docs/ai/AI_AGENT_README.md` or instruct the agent in the session prompt.
Reconciliation & verification
- A reconciliation script (`scripts/reconcile_tasks.js`) exists to map `TASK-###` references to commits/PRs and produce a verification report.
- Agents and CI should use this script to validate that `TASK-###` entries marked `done` actually correspond to merged PRs and that changed files overlap the task's `related_files`.
- CI workflow (`.github/workflows/ai-task-verifier.yml`) runs on PR and push to `main` to: run `npm run build`, execute `scripts/reconcile_tasks.js` (dry-run), and fail the CI if build/test fails or reconciliation finds mismatches for tasks declared `done`.
- Policy: Tasks marked `done` must include `pr_link` and `merged_at` (or be matched by reconciliation) before they are considered complete.

Session automation (semi-autonomous)
- `scripts/session_submit.js` — append your raw feedback message to `ALL_FEEDBACK_CLEAN.md`, run the extractor (`--apply`), and run triage (`--apply`).
	- Usage: `node scripts/session_submit.js "My raw feedback..."`
	- Optional autopush: `node scripts/session_submit.js --autopush "..."` (requires GitHub CLI `gh` and repo push permissions).
- `scripts/triage_tasks.js` — infers `related_files` for tasks by searching the repo. Dry-run by default; `--apply` updates `AI_TASK_QUEUE.md`.

Secrets & requirements
- For full autopush/PR creation the agent requires a pre-authenticated GitHub CLI (`gh`) or `GITHUB_TOKEN` set in environment on CI. Local `gh auth login` is recommended for local usage.
- CI already runs reconcile on PR/push and uploads a reconcile report.
Human-Owner Responsibilities
- Paste new raw feedback at the bottom of `ALL_FEEDBACK_CLEAN.md` using the Raw Entry Template.
- After PRs, confirm changes and mark `AI_TASK_QUEUE.md` entries as `done` if merged.

Secrets & Deployment
- Agents must not store secrets in repository files. Use project deployment procedures (Firebase frameworksBackend + GCloud Secret Manager) documented in `SECRETS_SETUP.md` and `firebase.json`.

Quick Start (for an agent):
1. Read `AI_AGENT_README.md` and `ALL_FEEDBACK_CLEAN.md`.
2. Run an extraction: map new raw entries → `AI_REQUEST_TEMPLATE.md` → append to `AI_TASK_QUEUE.md`.
3. Pick a high-priority task, implement, create PR, update `AI_CHANGELOG.md`, and mark the task in `AI_TASK_QUEUE.md`.

Notes
- Keep each AI write operation idempotent: write structured data so subsequent agents can parse and continue.
- Files under `src/docs/ai/` are machine-friendly; prefer these over freeform docs for agent coordination.