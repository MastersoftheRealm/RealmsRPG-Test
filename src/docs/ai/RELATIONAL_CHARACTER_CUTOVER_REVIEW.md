# Relational Character Cutover Review

**Review date:** November 7, 2026

**Scope:** staged ADR-0030 compatibility and final contract cutover

**Status:** **Implementation and disposable-clone verification passed; production application still requires Kadin's explicit approval and a fresh backup.**

## Review result

The five open code blockers from the prior cutover review are resolved in the staged compatibility files:

| Finding | Resolution | Regression coverage |
| --- | --- | --- |
| Authenticated users could write child tables directly | The child tables retain the explicit table grants required by the schema rules, but the authenticated write RLS policy is removed. Mutations must use the security-definer relational RPCs. | The rollback smoke test changes to `authenticated` and proves a direct child insert is rejected. |
| Campaign membership, roster, and visibility could partially commit | Join and RM-add now use service-only RPCs that lock the campaign and character, recheck authorization/limits, and change membership, roster, and visibility in one transaction. Removal changes roster and membership in one transaction. | The rollback smoke test covers join, RM-add, removal, and a stale-token join that leaves membership and roster unchanged. |
| Campaign character reads had a service-role authorization race | The route now calls one authenticated RPC that locks and verifies campaign membership, roster placement, character ownership, and scalar visibility before assembling the document. The application route no longer creates a service-role client. | Route tests assert the single authorization/document RPC; the SQL smoke test covers the authorized result. |
| Realtime relational fetches could finish out of order | Each refetch receives a generation number; only the newest generation may merge into the character cache. Cleanup invalidates pending generations. | Type checking and the existing realtime merge suite cover the surrounding merge boundary; local usage QA remains required. |
| Lock validation accepted values PostgreSQL could not cast | The PATCH schema accepts only ISO date-time values, including the local timestamp form emitted by the database and timezone-qualified forms. | API validation tests cover accepted local/UTC/offset forms and malformed values. |

The refresh also preserves the prior fixes for lock-token precision, canonical mirror rebuilding, and legacy armor reconstruction. `lastPlayedAt` is again server-owned in the relational PATCH RPC and is covered by the SQL smoke test.

## Review verdict

The code is ready for the production rollout sequence documented in
[sql/README.md](../../../sql/README.md), with these operational gates still required:

- Rerun the read-only audit and compatibility smoke test against the approved target.
- Complete relational/mirror application QA, including realtime and campaign flows.
- Obtain Kadin's explicit high-risk approval and take a fresh backup before each approved production schema change.
- Deploy the relational-only application before applying the final contract migration.

No later application change is required for the drop. Runtime TypeScript no longer
reads or writes the legacy character column, generated types no longer expose it,
and the final contract transaction replaces the three mirror-dependent RPCs before
dropping the column. The pre-contract compatibility SQL retains legacy references
only because it must migrate and verify the old production state.

## Verification completed for this refresh

- TypeScript typecheck, lint/ratchets, production build, and the full Vitest suite passed.
- SQL grant validation and agent-document/index validation passed.
- A same-snapshot disposable clone of the 57-character local database passed the read-only audit and expansion verifier, all three compatibility scripts, and the rollback smoke test.
- All 57 existing compatibility mirrors reached exact relational parity; the aggregate `updated_at` hash matched the untouched same-dump baseline, including null tokens.
- The final contract migration and its rollback-only smoke test then passed on a fresh exact-baseline clone: all 57 characters remained readable, the aggregate `updated_at` hash still matched the source (`e4cb5ac8fa2cbb282d3a5df50c6a4ec3`), the legacy column and compatibility trigger were absent, and the active character RPC definitions had no legacy-column reference.
- The old child-write policy was absent, service-only RPC grants were enforced, and no smoke fixture leaked after rollback.
- The source local database remained unchanged throughout clone verification.

The authoritative schema and rollout state remain in [SUPABASE_SCHEMA.md](../SUPABASE_SCHEMA.md) and [sql/README.md](../../../sql/README.md).
