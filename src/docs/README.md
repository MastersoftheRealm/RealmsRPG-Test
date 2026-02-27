# RealmsRPG Docs

**Stack:** Next.js, React, Tailwind, Supabase (PostgreSQL, Auth, Storage), Vercel. No Prisma.

## For AI Agents (Cursor)

1. **AGENT_GUIDE.md** (`ai/`) — Component locations, key files, hooks, recording progress.
2. **AI_TASK_QUEUE.md** (`ai/`) — Prioritized tasks; pick `not-started` high-priority items.
3. **SUPABASE_SCHEMA.md** — **Single source of truth** for Supabase public schema (tables, columns, columnar vs JSONB). Use this for DB layout; not PATH_C_AUDIT_FULFILLMENT or scattered docs.
4. **ARCHITECTURE.md** — Data flow, Supabase structure, enrichment pipeline, hooks/services.
5. **GAME_RULES.md** — Terminology, formulas, display conventions; use when implementing validation, caps, tooltips.
6. **UNIFICATION_STATUS.md** — Verified unification state; what's done, what remains.
7. **DESIGN_SYSTEM.md** — Color tokens, component API, migration patterns.
8. **ALL_FEEDBACK_CLEAN.md** — Owner feedback; append new entries here.
9. **UI_COMPONENT_REFERENCE.md** — Detailed component usage; includes component decision tree.
10. **DEPLOYMENT_AND_SECRETS_SUPABASE.md** — Vercel/Supabase env vars, deployment, secrets.
11. **ADMIN_SETUP.md** — Admin access (env vars only).
12. **ai/archive/** — Historical one-off audits and design docs (CODEBASE_AUDIT, UNIFICATION_AUDIT, MODAL_UNIFICATION_AUDIT, etc.). Reference only; active agent docs are AGENT_GUIDE, AI_TASK_QUEUE, AI_CHANGELOG, AI_REQUEST_TEMPLATE.

Root `AGENTS.md` and `.cursor/rules/` provide session-level instructions.
