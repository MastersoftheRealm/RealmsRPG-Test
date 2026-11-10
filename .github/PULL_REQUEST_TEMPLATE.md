<!-- Workflow: AGENTS.md. Checklist the reviewer grades: src/docs/ai/ARCHITECTURE_CONSTITUTION.md. Fill every section; write "none" rather than deleting one. -->

## ClickUp
- Task: <!-- id — title -->
- Related: <!-- other task ids, or "none" -->

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

## Test that fails before and passes after
<!-- Test file and command. Say how you confirmed it failed before the fix. If not feasible, say why. -->

## Risk by path
<!-- List the high-risk areas from the AGENTS.md "Risk by path" table that this diff touches, or "standard". The paths decide, not a checkbox. -->
- Risk:
- Approvals needed: <!-- Collin (CODEOWNERS) for high-risk paths; Kadin for product or rule decisions -->
- Sign-off on survey: <!-- link, or "not required" with the reason -->

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
- [ ] Writer and reviewer are different agents with different prompts
