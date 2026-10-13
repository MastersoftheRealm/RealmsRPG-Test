# Remediation Status — 2026-08 (Current Truth)

Post-fix status for [`archive/CODEBASE_AUDIT_2026-08-01.md`](archive/CODEBASE_AUDIT_2026-08-01.md).

- Historical June snapshot: [`REMEDIATION_STATUS_2026-06.md`](REMEDIATION_STATUS_2026-06.md) (not current)
- Open agent work: [`ACTIVE_TASKS.md`](ACTIVE_TASKS.md)
- Waiting / human: [`WAITING_TASKS.md`](WAITING_TASKS.md) · [`DEVELOPER_TASK_QUEUE.md`](DEVELOPER_TASK_QUEUE.md)
- Audit snapshot (immutable findings): [`archive/HISTORY_INDEX.md`](archive/HISTORY_INDEX.md)

The Aug 1 audit was run **without project docs**. Companion tasks are **TASK-642–668** (+ **TASK-669** Redis provisioning). Do **not** re-file items already tracked (e.g. leaked-password = **TASK-326** / **TASK-353**, not a new Aug ID).

---

## Status matrix (audit ID → task)

| Audit | Finding (short) | Task | Status |
|-------|-----------------|------|--------|
| H1 | Profile email spoofing | TASK-642 | `done` — code fix landed; signup QA open (DEV-008, pending-qa) |
| H2 | In-memory rate limits on Vercel | TASK-645 → TASK-669 | Code + **prod Redis live 2026-08-13** (`KV_REST_API_*` on Vercel; TASK-645 pending-qa) |
| H3 | Invite join unthrottled | TASK-645 | `done` (pending-qa) |
| M1 | Codex `?debug=1` leaks DB errors | TASK-647 | `done` (pending-qa) |
| M2 | Raw Supabase errors to clients | TASK-648 | `done` |
| M3 | Public image GET via service role | TASK-651 | `done` (pending-qa) |
| M4 | Admin mutations missing rate limits | TASK-645 | `done` (pending-qa) |
| M5 | Weak admin body validation | TASK-652 | `done` |
| M6 | Character 404 vs 403 oracle | TASK-653 | `done` |
| M7 | Cross-user library for campaign viewers | TASK-654 | `done` (pending-qa) |
| D1 | Excessive `anon` table grants | TASK-649 | `done` (pending-qa) |
| D2 | Prod backup tables | TASK-649 | `done` (pending-qa) |
| D3 | Leaked password protection off | TASK-326 / TASK-353 | **WAITING** — Dashboard DEV-001 |
| D4 | `codex-art` public listing | TASK-649 (+ TASK-326 storage) | `done` / storage hardening partial |
| D5 | Mutable `search_path` functions | TASK-649 | `done` (pending-qa) |
| D6 | Multiple permissive campaigns SELECT | TASK-650 | `done` (pending-qa) |
| D7–D8 | Unused indexes / unindexed FKs | TASK-649 notes | Deferred / partial (images FK indexed; do not drop blindly) |
| B1 | Creature feat points fallback | TASK-643 | `done` (pending-qa) |
| B2 | Armor DR resolved 3+ ways | TASK-644 | `done` (pending-qa) — canonical `resolveArmorDamageReduction` |
| B3–B4 | Ability-req + unproficientBonus SSOT | TASK-660 | `done` |
| B5 | Silent catches on cost paths | TASK-661 | `done` |
| B6 | `calculators`/`game` → library/guided imports | TASK-662 / ADR-0010 | `done` |
| B7–B8 | Schema drift + `mixed` vs `powered-martial` | TASK-663 | `done` |
| §2 | No `typecheck` / broken test mocks | TASK-655 | `done` (pending-qa) |
| §2 | Next.js stale (npm audit highs) | TASK-646 | `done` |
| §3 | Lint warnings allowed in CI | TASK-656 | `done` (pending-qa) |
| §3 | No pre-commit hooks | TASK-657 | `done` |
| §3 | Creator Playwright not in default CI | TASK-659 | `done` |
| §3 | Thin API route auth/IDOR tests | TASK-658 / TASK-713 | `done` — user-owned slice covered; remainder (images, nested campaign, remaining admin, official/codex) in DEV queue |
| §7 | Mega prop bags | TASK-667 | `done` (pending-qa) |
| §7 | 600+ LOC god files | TASK-666 | `done` (pending-qa) |
| §7 | Twin character creators | — | **Deferred by design** — Guided + Advanced coexist (`guide/06`, CHARACTER_CREATOR_AUDIT); do not merge stores/routes |
| §8–9 | Hygiene (magic numbers, utils, tmp, tsconfig) | TASK-665 | `done` |
| Docs | Reconcile docs vs audit | TASK-668 | this file + pointer updates |

---

## Still open (do not rediscover)

1. **TASK-642** — manual signup QA (profile email from session only) — archived `pending-qa` / DEV-008.
2. **TASK-353** / **DEV-001** — enable Supabase leaked-password protection (HIBP).
3. **Character-creator consolidation** — intentionally deferred; product keeps two creators with shared chrome (`CreatorPageShell`, `LoadoutBudgetBar`, etc.).

Pending-qa rows for shipped Aug tasks live in [`DEVELOPER_TASK_QUEUE.md`](DEVELOPER_TASK_QUEUE.md) → Pending owner QA.

---

## Doc claims corrected under TASK-668

| Area | Correction |
|------|------------|
| FEATURE_INDEX | Canonical armor DR helper; rate-limit Upstash + TASK-669 note |
| ARCHITECTURE.md | Armor DR authority → `resolveArmorDamageReduction` |
| BUILD_VALIDATION DEV-V-011-T002 | Lint expects 0 errors **and** 0 warnings (`--max-warnings 0`) |
| guide/01 CI | Documents `ai-task-verifier` typecheck/vitest + husky |
| Pointers | June remediation demoted; this file is current truth |
| Twin creators | Confirmed documented as coexistence — **not** “single canonical” |

Test-coverage honesty: domain logic under `src/lib` has strong vitest coverage; UI/hooks/stores/services remain thin — do not claim broad automated coverage. Manual suites live in `BUILD_VALIDATION.md`.
