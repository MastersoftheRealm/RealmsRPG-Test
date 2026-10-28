## ClickUp
- Task: <!-- <id> — <title> -->
- Stack / Related: <!-- other task IDs or "none" -->

## Summary
-

## Risk flags
Check all that apply (see `src/docs/ai/PR_REVIEWER_BRIEF.md` **Risk classification**):
- [ ] Schema/migration/SQL/seeds
- [ ] Auth/RLS/permissions/roles
- [ ] Rules math / formulas / legality checks
- [ ] ID allocation
- [ ] Destructive/delete (user or official data)
- [ ] Codex/core_rules data
- [ ] Secrets / env vars
- [ ] CI/workflows or deploy/Vercel/DNS settings
- [ ] New API route or endpoint (triggers §9 endpoint security pass)
- [ ] None of the above

## For Kadin (plain language)
<!-- Required when Kadin is the approver, and on every high-risk PR. See PR_REVIEWER_BRIEF.md -->
- **What it does:**
- **Why:**
- **What could go wrong:**
- **How to undo it:**
- **What I need from you:**

## Test plan
- [ ] Unit/targeted
- [ ] Preview smoke / QA Tester
- [ ] Regression for bug repro (if bugfix)
- [ ] New/changed `sql/` with `CREATE TABLE`: RLS, policies, and `GRANT` in the same file (`sql/_TEMPLATE_new_table.sql`)

## AI policy
- [ ] No creative naming/lore/art introduced by AI

## Reviewer
- [ ] Writer and PR Reviewer are different bots with different prompts (`src/docs/ai/PR_REVIEWER_BRIEF.md`)
- [ ] Pre-merge checklist: `src/docs/ai/PR_CHECKLIST.md`
