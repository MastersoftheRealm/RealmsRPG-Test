# RealmsRPG Docs

**Stack:** Next.js, React, Tailwind, Supabase (PostgreSQL, Auth, Storage), Prisma, Vercel

## For AI Agents (Cursor)

1. **AGENT_GUIDE.md** (`ai/`) — Component locations, key files, hooks, recording progress.
2. **AI_TASK_QUEUE.md** (`ai/`) — Prioritized tasks; pick `not-started` high-priority items.
3. **ARCHITECTURE.md** — Data flow, Supabase/Prisma structure, enrichment pipeline, hooks/services.
4. **GAME_RULES.md** — Terminology, formulas, display conventions; use when implementing validation, caps, tooltips.
5. **GAME_RULES_AUDIT.md** — Code vs. rulebook mismatches; audit findings and fix priorities.
6. **UNIFICATION_STATUS.md** — Verified unification state; what's done, what remains.
7. **DESIGN_SYSTEM.md** — Color tokens, component API, migration patterns.
8. **ALL_FEEDBACK_CLEAN.md** — Owner feedback; append new entries here.
9. **UI_COMPONENT_REFERENCE.md** — Detailed component usage; includes component decision tree.
10. **DEPLOYMENT_AND_SECRETS_SUPABASE.md** — Vercel/Supabase env vars, deployment, secrets.
11. **ADMIN_SETUP.md** — Admin access (env vars only).

Root `AGENTS.md` and `.cursor/rules/` provide session-level instructions.

## Archived

`archived_docs/` — Historical migration, audit, and unification docs. Includes Firebase→Supabase migration plan, documentation migration audit, unification plans, and point-in-time audits.
