# Archive — Historical AI/Agent Docs

This folder contains **one-off audits**, **design snapshots**, and **migration plans** that are no longer the active reference. Kept for reference only.

**Schema & DB layout:** Use [SUPABASE_SCHEMA.md](../../SUPABASE_SCHEMA.md) — single source of truth. Do not use archive docs for current schema.

**Active agent docs** (do not move here): `AGENT_GUIDE.md`, `AI_TASK_QUEUE.md`, `AI_CHANGELOG.md`, `AI_REQUEST_TEMPLATE.md`.

## Contents

- **Audits** — CODEBASE_AUDIT, UNIFICATION_AUDIT, MODAL_UNIFICATION_AUDIT, UNIMPLEMENTED_AUDIT, ACCESSIBILITY_SITEWIDE_PLAN, ACCESSIBILITY_AUDIT_2026-02-18 (findings addressed or deferred).
- **Path C (migration complete)** — PATH_C_MIGRATION_PLAN (Prisma → Supabase; Phases 0–6 done), PATH_C_AUDIT_FULFILLMENT (one-time fulfillment audit). For current schema use SUPABASE_SCHEMA.md; for SQL run order see sql/README.md.
- **Design docs** — PUBLIC_LIBRARY_IN_MODALS_DESIGN (snapshot; implementation may have diverged).
- **templates/** — Optional PR/commit/request templates; not required by current workflow.

Agents should prefer the active docs and SUPABASE_SCHEMA.md; use archive only when tracing historical context.
