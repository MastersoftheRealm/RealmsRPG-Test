# RealmsRPG Docs

**Stack:** Next.js, React, Tailwind, Supabase (PostgreSQL, Auth, Storage), Vercel. No Prisma.

## For New Developers

Start here: **[ENGINEERING_ONBOARDING.md](./ENGINEERING_ONBOARDING.md)** — architecture, directory map, data layer, state/persistence, gotchas, and a safe-edit ramp path.

## For AI Agents (Cursor)

**Start at root [`AGENTS.md`](../../AGENTS.md)** — Source-of-Truth Map and session workflow.

Then, as needed:

| Topic | Doc |
|-------|-----|
| Component locations, patterns | [`ai/AGENT_GUIDE.md`](./ai/AGENT_GUIDE.md) |
| Does this feature exist? | [`ai/FEATURE_INDEX.md`](./ai/FEATURE_INDEX.md) |
| Open tasks | [`ai/AI_TASK_QUEUE.md`](./ai/AI_TASK_QUEUE.md) |
| DB tables / columns | [`SUPABASE_SCHEMA.md`](./SUPABASE_SCHEMA.md) |
| Codex field definitions | [`CODEX_SCHEMA_REFERENCE.md`](./CODEX_SCHEMA_REFERENCE.md) |
| Game rules, formulas, caps | [`GAME_RULES.md`](./GAME_RULES.md) |
| Data flow, enrichment | [`ARCHITECTURE.md`](./ARCHITECTURE.md) |
| Codex/library caching | [`DATA_HANDLING.md`](./DATA_HANDLING.md) |
| Design tokens, components | [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) |
| Accessibility | [`ACCESSIBILITY.md`](./ACCESSIBILITY.md) |
| Mobile patterns | [`MOBILE_UX.md`](./MOBILE_UX.md) |
| Deploy / secrets | [`DEPLOYMENT_AND_SECRETS_SUPABASE.md`](./DEPLOYMENT_AND_SECRETS_SUPABASE.md) |
| DB ops runbook | [`DATABASE_CONSISTENCY_CHECKLIST.md`](./DATABASE_CONSISTENCY_CHECKLIST.md) |
| Edge / CDN performance | [`PERFORMANCE_AND_EDGE.md`](./PERFORMANCE_AND_EDGE.md) |
| Owner feedback | [`ALL_FEEDBACK_CLEAN.md`](./ALL_FEEDBACK_CLEAN.md) |

**Human deep-dive:** [`UI_COMPONENT_REFERENCE.md`](./UI_COMPONENT_REFERENCE.md) — detailed component catalog (agents: prefer `AGENT_GUIDE.md` + `.cursor/rules/realms-unification.mdc`).

**Historical audits, migration plans, completed designs:** [`ai/archive/`](./ai/archive/) — reference only; do not treat as current truth.

Root `.cursor/rules/` provide session-level instructions.
