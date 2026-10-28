# PR Checklist — AI failure modes

Use before opening the draft PR. Keep answers short. Agents do not mark the ClickUp task **complete**.

**PR Reviewer grades items 1–12** in `src/docs/ai/PR_REVIEWER_BRIEF.md` (single checklist — do not duplicate that text here). Before you open the draft PR, confirm your diff would pass those items.

## Writer checks (not repeated in the brief)

1. **AC complete** — Every acceptance criterion met? Else `partial` + follow-ups on the ClickUp task.
2. **ClickUp** — Id in the branch and the PR? Risk flags in the template? Task comment says what changed?
3. **Tests (brief item 5)** — Regression test for the repro run locally? CI runs typecheck, the unit suite, and the build. Do not also run them locally.
4. **Tokens** — Semantic / `*-fg`; no raw palette outside exemptions?
5. **Responsive** — `fullScreenOnMobile` where needed? Touch tier assigned (not blanket 44px)? Contracts C1–C6 hold at 360 / 390 / 768 / 1024 / 1280 / 1440 (`npm run verify:responsive`)?
6. **A11y** — Labels, headings, modal title/`titleA11y`? **WCAG 2.2 AA** (including target size SC 2.5.8, focus not obscured SC 2.4.11)?
7. **Uploads (brief item 3)** — Client uploads through `apiUpload`; no raw `fetch('/api/upload…')` (eslint `realms/no-raw-upload-fetch`).
8. **Schema/codex (brief item 10)** — SQL in `sql/`; Kadin explicit OK for live codex mutate? High-risk per brief **Risk classification**. **New `CREATE TABLE` in `public`:** same file has RLS, policies, and explicit `GRANT` (`sql/_TEMPLATE_new_table.sql`; CI `tasks:check-sql-grants`).
9. **ClickUp status** — Per `.cursor/rules/realms-tasks.mdc`: **in progress** only while active; **in review** after PR Reviewer + green CI with human approver assigned (usually Kadin); **testing** after merge with QA steps; agents do not mark **complete**.
10. **Owner QA** — User-facing? QA steps on the ClickUp comment? `BUILD_VALIDATION.md` only when that suite does not already cover the check.
11. **Notes** — PR and ClickUp comment only; no new `AI_CHANGELOG.md` entry.
12. **Design intent** — Non-obvious constraint documented (`DESIGN_INTENT` / comment); stale docs updated (brief item **11**).
13. **Human gates** — New shared/ui on allowlist + ADR; store/API contract; live codex mutate (constitution + brief items **3–4**, **10**).
14. **Barrels** — Shared UI: `npm run tasks:validate-shared-ui`? Export changes: `npm run tasks:generate-index`?
15. **Git** — PR against `master`; never push `master`; never merge.
16. **Decisions** — Checked `src/docs/ai/DECISIONS.md` for settled rulings (brief **Read first** #2).
17. **Plain language** — If Kadin is the approver or the PR is high-risk, filled **For Kadin (plain language)** in the PR template (brief plain-language block).

## PR Reviewer and cleanup

**Before Human OK:** PR Reviewer (different bot, different prompt than the writer) grades using **`src/docs/ai/PR_REVIEWER_BRIEF.md`** while CI runs. `/cleanup` only when PR Reviewer named an in-scope gap in REQUEST CHANGES. Doc nits are not a cleanup.

| Command | Status | What it does |
|---------|--------|----------------|
| PR Reviewer | Primary gate | Different bot/prompt. Verdict: APPROVE, REQUEST CHANGES, or HOLD FOR HUMAN. Checklist: brief items **1–12**. |
| `/cleanup` | Stays | Fixes that in-scope gap. Re-runs the repro test. |
| `/audit` | Retired | Superseded by PR Reviewer (2026-10-28). |
| `/global-audit` | Unused on a task | Do not run. |
| `/debt` | Unused on a task | Do not run. |

**Implementation:** `.cursor/commands/cleanup.md`. Retired stubs (not live commands): `src/docs/ai/archive/global-audit.md`, `archive/debt.md`.
