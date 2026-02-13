# RealmsRPG Docs

**Stack:** Next.js, React, Tailwind, Supabase (PostgreSQL, Auth, Storage), Prisma, Vercel

## For AI Agents (Cursor)

1. **AGENT_GUIDE.md** (`ai/`) — Component locations, key files, hooks, recording progress.
2. **AI_TASK_QUEUE.md** (`ai/`) — Prioritized tasks; pick `not-started` high-priority items.
3. **ARCHITECTURE.md** — Data flow, Supabase/Prisma structure, enrichment pipeline, hooks/services.
4. **GAME_RULES.md** — Terminology, formulas, display conventions; use when implementing validation, caps, tooltips.
5. **UNIFICATION_STATUS.md** — Verified unification state; what's done, what remains.
6. **DESIGN_SYSTEM.md** — Color tokens, component API, migration patterns.
7. **ALL_FEEDBACK_CLEAN.md** — Owner feedback; append new entries here.
8. **UI_COMPONENT_REFERENCE.md** — Detailed component usage; includes component decision tree.
9. **DEPLOYMENT_AND_SECRETS_SUPABASE.md** — Vercel/Supabase env vars, deployment, secrets.
10. **ADMIN_SETUP.md** — Admin access (env vars only).
11. **CODEBASE_AUDIT_2026-02-13.md** (`ai/`) — Full codebase audit findings and fix status.

Root `AGENTS.md` and `.cursor/rules/` provide session-level instructions.
