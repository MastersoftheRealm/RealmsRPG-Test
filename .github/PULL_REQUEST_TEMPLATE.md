<!-- Workflow: AGENTS.md. Checklist the reviewer grades: src/docs/ai/ARCHITECTURE_CONSTITUTION.md. Fill every section; write "none" rather than deleting one. -->

## ClickUp
- Task: <!-- id — title — https://app.clickup.com/t/<id> -->
- Related: <!-- other task ids, or "none" -->
- [ ] Task status and comments synced per `AGENTS.md` (in progress → PR link → in review after audit APPROVE → testing after merge)

## Result: REAL FIX | PATCH
<!-- Keep one. PATCH: say what is left unfixed and what the real fix needs. -->

## Root cause
<!-- Traced through the real code path, with file:line. Not a guess. -->

## Survey findings
<!-- From the Phase 1 survey of the affected area: forks, duplicates, dead code, rule values in code, missing tests, unclear done-when. What this PR removes or consolidates, and what it leaves (with follow-up task ids). -->

## Done when
-

## Out of scope
-

## Design brief (high-risk paths only; required before Phase 2 code)
<!-- sql/, schema, RPCs, auth, scripts/, .github/ — done-when, out of scope, data model, rollout sketch. Link plan-pass /audit APPROVE (critic + SHA), or "n/a — standard risk". -->

## Rollout matrix (database or API contract changes only)
<!-- Each row: state (e.g. old app + new DB, stale tab) → save OK or fail loud (no silent dropped writes). Rollback SQL or revert steps. Or "n/a". -->

## Test that fails before and passes after
<!-- Test file and command. Failure must be behavioral (the bug), not a missing symbol or unapplied migration. SQL/pgTAP tests must use canonical files under sql/, not hand-copied DDL. Collection/list writes: add, edit, remove, reorder, mixed — or say why not. If not feasible, say why. -->

## Risk by path
<!-- List the high-risk areas from the AGENTS.md "Risk by path" table that this diff touches, or "standard". The paths decide, not a checkbox. -->
- Risk:
- CI changes: <!-- pinned versions only; any ratchet bump or ignored path needs plain justification here, or "none" -->
- Approvals needed: <!-- Collin (CODEOWNERS) for high-risk paths; Kadin for product or rule decisions -->
- Sign-off on survey: <!-- link, or "not required" with the reason -->
- Approval path: Collin | Fallback <!-- keep one; Fallback only when Kadin invoked it himself -->

## Audit record
<!-- Each critic APPROVE only (not REQUEST CHANGES). New commits invalidate prior rows — add a new row after remediate. -->
| Round (plan / impl / 1 / 2 …) | Critic (agent/model, separate session) | Verdict | Head SHA |
|---|---|---|---|
| | | | |

## Fallback evidence (only for the Fallback path; every line required)
<!-- AGENTS.md "Fallback when Collin is unavailable". Delete this section on the Collin path. -->
- Kadin's invocation (his own comment): 
- Plain-English brief + Kadin's decision: 
- Senior review, plan pass: 
- Senior review, implementation pass (verdict REAL FIX, or Kadin's own "I accept this as a PATCH" comment): 
- Test that fails before / passes after: 
- Repro on the preview deploy (steps + result): 
- Rollback plan: 
- Database backup (name, time), or "no database change": 
- [ ] `collin-post-review` label applied and ClickUp post-review task filed for Collin

## For Kadin (plain language)
<!-- Required on high-risk PRs and whenever Kadin must decide something. -->
- **What it does:**
- **Why:**
- **REAL FIX or PATCH:**
- **What could go wrong:**
- **How to undo it:**
- **What I need from you:**

## Checks
- [ ] No game value, formula, name, lore, flavor text or visual choice was invented by AI
- [ ] Stale docs updated or deleted in this PR
- [ ] New `CREATE TABLE` in `sql/` has RLS, policies and `GRANT` in the same file (or n/a)
- [ ] Writer and critic are different agents in **separate sessions** (same-session `/audit` does not count as APPROVE)
- [ ] Latest critic APPROVE row in **Audit record** matches current PR head SHA
