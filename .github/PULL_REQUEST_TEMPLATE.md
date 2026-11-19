<!-- Workflow: AGENTS.md. Checklist: src/docs/ai/ARCHITECTURE_CONSTITUTION.md. Merge gate: GitHub check "Realms Independent Critic". -->

## ClickUp
- Task: <!-- id — title — https://app.clickup.com/t/<id> -->
- Related: <!-- other task ids, or "none" -->
- [ ] Task status and comments synced per `AGENTS.md`

## Result: REAL FIX | PATCH
<!-- PATCH: what is left unfixed. -->

## Root cause
<!-- file:line, traced in code -->

## Survey findings
<!-- forks, duplicates, rule literals, missing tests; what this PR removes -->

## Done when
-

## Out of scope
-

## Design brief (high-risk only; before Phase 2 code)
<!-- Required when AGENTS.md Risk by path matches. Link critic plan-pass comment, or "n/a". -->

## Rollout matrix (database or API contract only)
<!-- Each state → save OK or fail loud. Rollback SQL. Or "n/a". -->

## Test that fails before and passes after
<!-- Behavioral failure. Canonical sql/ for DB tests. Collection writes: add/edit/remove/reorder/mixed. -->

## Risk by path
- Risk: <!-- standard | high (paths from AGENTS.md table) -->
- [ ] GitHub label `high-risk` applied when required
- CI changes: <!-- pinned versions; ratchet/ignore justification, or "none" -->
- Kadin product OK: <!-- link to his PR comment, or "not needed" -->

## Stack / merge order
- [ ] GitHub does **not** block merge for stack order (if blocked, merge bottom of stack first — do not bypass, e.g. #601)

## Critic gate (enforcement — not self-attested)
<!-- Writer self-audit does not satisfy merge. Independent critic posts check "Realms Independent Critic". -->
- Head SHA for merge: <!-- full sha -->
- Repro command critic ran: 
- Critic session posted check: <!-- link to check run on that SHA, or "pending" -->

## For Kadin (plain language)
- **What it does:**
- **Why:**
- **REAL FIX or PATCH:**
- **What could go wrong:**
- **How to undo it:**
- **What I need from you:**

## Checks (writer — pre-handoff)
- [ ] No AI-invented game values, names, lore, or visuals
- [ ] Stale docs updated in this PR
- [ ] New `CREATE TABLE` has RLS + policies + GRANT (or n/a)
- [ ] Writer ran self `/audit` + `/remediate`; did **not** post GitHub critic check from writer session