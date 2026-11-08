# Relational Character Cutover Review

**Review date:** November 8, 2026

**Scope:** staged ADR-0030 compatibility and final contract cutover

**Status:** **Implementation and current-production disposable-clone verification passed. Kadin approved the work on November 8, 2026; take a fresh production backup immediately before each production schema change.**

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
- Confirm the recorded Kadin approval still covers the scheduled production window and take a fresh backup immediately before each production schema change.
- Deploy the relational-only application before applying the final contract migration.

No later application change is required for the drop. Runtime TypeScript no longer
reads or writes the legacy character column, generated types no longer expose it,
and the final contract transaction replaces the three mirror-dependent RPCs before
dropping the column. The pre-contract compatibility SQL retains legacy references
only because it must migrate and verify the old production state.

## Verification completed for this refresh

- TypeScript typecheck, lint/ratchets, production build, and the full Vitest suite passed.
- SQL grant validation and agent-document/index validation passed.
- A disposable clone of the November 8 production snapshot passed the read-only audit, expansion verifier, all three compatibility scripts, and the rollback smoke test.
- Production-only document shapes discovered by that audit are now mapped relationally: library-section visibility, note-section order and visibility, and the named-note `hidden` flag. An unresolved legacy archetype path is retained as a snapshot value instead of violating the Codex foreign key.
- All 71 production-snapshot characters reached relational parity. The one explicitly stored `hidden: false` value round-tripped, and the aggregate `updated_at` hash remained identical to the untouched clone baseline (`32ea5d2b145bebeb9c1b66e0abad0ea1`).
- The final contract migration and its rollback-only smoke test passed on that clean production clone: all 71 characters remained readable, the legacy column and compatibility trigger were absent, the two new preference tables contained the expected 8 and 12 rows, and active public functions had no legacy-column reference.
- The old child-write policy was absent, service-only RPC grants were enforced, and no smoke fixture leaked after rollback.
- Before the approved local write, a validated custom-format backup was taken. The local database then received the nine production migrations missing from its checkout, the production Codex rename function, and the updated relational compatibility sequence. Its 57 character rows retained the same aggregate `updated_at` hash, reached exact mirror/relational parity with zero mismatches or orphans, and passed the rollback smoke test without leaking fixtures; the compatibility `data` column remains intentionally present locally until the contract phase.

The authoritative schema and rollout state remain in [SUPABASE_SCHEMA.md](../SUPABASE_SCHEMA.md) and [sql/README.md](../../../sql/README.md).
