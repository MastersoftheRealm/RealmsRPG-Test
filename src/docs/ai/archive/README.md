# Archive — Historical AI/Agent Docs

This folder contains **one-off audits**, **design snapshots**, **migration plans**, and **completed implementation plans** that are no longer the active reference. Kept for historical context only.

**Schema & DB layout:** Use [SUPABASE_SCHEMA.md](../../SUPABASE_SCHEMA.md) — single source of truth. Do not use archive docs for current schema.

**Active agent docs** (do not move here): `AGENT_GUIDE.md`, `FEATURE_INDEX.md`, `AI_TASK_QUEUE.md`, `AI_CHANGELOG.md`, `AI_REQUEST_TEMPLATE.md`.

**Active cross-cutting docs:** `PERFORMANCE_AND_EDGE.md`, `DATABASE_CONSISTENCY_CHECKLIST.md`, `FULL_AUDIT_2026-06.md`, `SYSTEMATIC_AUDIT_2026-06.md` (until task backlog drains).

## Contents

- **Audits** — CODEBASE_AUDIT, UNIFICATION_AUDIT, MODAL_UNIFICATION_AUDIT, UNIMPLEMENTED_AUDIT, ACCESSIBILITY_SITEWIDE_PLAN, ACCESSIBILITY_AUDIT_2026-02-18, ADMIN_EDIT_AUDIT, TOOLTIP_AUDIT, CDN_QUERY_AUDIT (merged into PERFORMANCE_AND_EDGE.md).
- **Path C (migration complete)** — PATH_C_MIGRATION_PLAN, PATH_C_AUDIT_FULFILLMENT, SUPABASE_PATH_C_OPERATOR_GUIDE. For SQL run order see `sql/README.md`.
- **DB rationale (superseded by SUPABASE_SCHEMA.md)** — DATABASE_CODEX_AUDIT, DATABASE_SCALABILITY_AUDIT, OFFICIAL_LIBRARY_COLUMNAR_PLAN.
- **Completed designs** — LEVELED_FEATS_DESIGN, CRAFTING_IMPLEMENTATION_PLAN, PUBLIC_LIBRARY_IN_MODALS_DESIGN, UNIFICATION_STATUS (folded into AGENT_GUIDE).
- **Edge spike branch doc** — EDGE_REQUESTS_REDUCTION (merged into PERFORMANCE_AND_EDGE.md).
- **templates/** — Optional PR/commit/request templates; not required by current workflow.

Agents should prefer `AGENTS.md` Source-of-Truth Map and active docs; use archive only when tracing historical context.
