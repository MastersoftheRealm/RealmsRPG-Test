## ClickUp
- Task: <!-- <id> — <title> -->
- Stack / Related: <!-- other task IDs or "none" -->

## Summary
-

## Risk flags
Check all that apply (must match `src/docs/ai/PR_REVIEWER_BRIEF.md` **Risk classification** one-to-one):
- [ ] Auth
- [ ] Roles
- [ ] RLS/permissions
- [ ] Database schema/SQL/migrations/seeds
- [ ] ID allocation
- [ ] Rules values or formulas
- [ ] Legality checks
- [ ] Secrets/env vars
- [ ] CI/workflows
- [ ] Deploy/Vercel/DNS settings
- [ ] Deletes user/official data
- [ ] Admin tools that can delete or bulk-change data
- [ ] Billing or anything sent outside the team (email, messages, posts)
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
