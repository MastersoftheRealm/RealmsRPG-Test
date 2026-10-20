# Relational Character Cutover Review

**Review date:** October 14, 2026  
**Reviewers:** SQL/persistence reviewer and application/API reviewer  
**Status:** **Not ready to deploy.** The database migration has not been applied.

## What the change does

The cutover moves character storage away from reading and writing `characters.data` directly:

- Character details are assembled from relational columns and child tables.
- Character creation and PATCH operations go through transactional database RPCs.
- `characters.data` remains as a temporary compatibility and rollback mirror.
- List, campaign, encounter, tabletop, duplicate, and provisioning paths use the new relational persistence service.
- Realtime consumers use scalar fields immediately, then refetch the full relational document.
- An opt-in shadow comparison reports which top-level fields differ between the relational document and compatibility blob without logging character values.
- The local database types, schema documentation, ADR, SQL instructions, and tests were updated for the cutover.

The overall design is sound, but the reviewers found several correctness gaps that must be resolved before rollout.

## Findings both reviewers agreed on

### 1. The optimistic-lock token is broken — critical

The PATCH RPC calculates a timestamp with microsecond precision, but the database stores it at millisecond precision. The RPC returns the unrounded value to the client. A client's next save can therefore conflict with the row it just saved and return HTTP 409.

Relevant code: [`characters-relational-write-rpc.sql:185`](../../../sql/characters-relational-write-rpc.sql#L185) and [`characters-relational-write-rpc.sql:23`](../../../sql/characters-relational-write-rpc.sql#L23).

**Required fix:** round the timestamp before both writing and returning it, or return the stored value. Add a test that performs two consecutive PATCHes using the first PATCH response as the second lock token.

### 2. `data` is not guaranteed to be an exact relational mirror — high

The write helper stores the incoming JSON document in `data`. It does not reconstruct the document from the relational rows after projection. Defaults, aliases, deduplication, omitted values, and generated metadata can therefore differ immediately after create or provisioning.

This weakens rollback safety and makes the shadow comparison noisy. The current SQL parity test checks after a PATCH that already began with an assembled relational document, so it does not expose the create/provision problem.

Relevant code: [`characters-relational-write-rpc.sql:39`](../../../sql/characters-relational-write-rpc.sql#L39) and [`characters-relational-cutover-test.sql:89`](../../../sql/characters-relational-cutover-test.sql#L89).

### 3. A legacy armor shape can be lost — high

The projector accepts `equipment.armor` as an object and stores it with slot `armor`, but the relational reader only returns armor rows with no slot. The value disappears from reads and can be deleted by the next full child replacement.

Relevant code: [`characters-relational-expand.sql:1188`](../../../sql/characters-relational-expand.sql#L1188) and [`characters-relational-read-rpc.sql:186`](../../../sql/characters-relational-read-rpc.sql#L186).

### 4. Direct child-table writes bypass the intended transaction boundary — high

Authenticated owners can still insert, update, and delete child rows directly. These writes bypass full-document validation and mirror rebuilding. They can leave `data` stale and can generate repeated parent timestamp/realtime updates.

Relevant code: [`characters-relational-expand.sql:320`](../../../sql/characters-relational-expand.sql#L320).

**Required decision:** if the RPCs are the authoritative write API, revoke direct child-table DML from application roles while retaining the required read access.

### 5. Public character response shapes can change — high

The relational reader returns a canonical document rather than reproducing the stored document exactly. It can omit previously returned aliases or derived fields such as `health`, `energy`, `xp`, and `species`, while adding empty collections, empty objects, null values, and defaults.

Both reviewers concluded that this conflicts with the stated requirement that public HTTP payloads remain unchanged. Either reconstruct the legacy response contract at the HTTP boundary or explicitly adopt and test a new canonical contract.

Relevant code: [`characters-relational-read-rpc.sql:50`](../../../sql/characters-relational-read-rpc.sql#L50) and [`characters/[id]/route.ts:66`](../../app/api/characters/%5Bid%5D/route.ts#L66).

### 6. Campaign joins can partially succeed and report failure — high

The join and RM add flows update campaign membership/roster before performing the optimistic character visibility PATCH. If that final PATCH conflicts, the action reports failure even though the campaign mutations already succeeded. A retry can then say the character is already present while its visibility remains unchanged.

Relevant code: [`campaigns/actions.ts:280`](../../app/(main)/campaigns/actions.ts#L280) and [`campaigns/actions.ts:394`](../../app/(main)/campaigns/actions.ts#L394).

**Required fix:** make membership, roster, and visibility one transaction, or define explicit compensation and idempotent retry behavior.

### 7. The campaign character read has an authorization race — high

The campaign route checks visibility and roster access separately, then uses a service-role client to fetch the relational document. Visibility or ownership can change between those operations. Authorization and document assembly should occur in one database operation or be revalidated from the same consistent snapshot.

Relevant code: [`campaign character route.ts:70`](../../app/api/campaigns/%5Bid%5D/characters/%5BuserId%5D/%5BcharacterId%5D/route.ts#L70).

## Important follow-up findings

- **Realtime results can arrive out of order.** Each parent event starts an uncancelled relational fetch. An older response can overwrite a newer one. Add request generation or timestamp ordering, cancellation, or a cache layer that rejects stale results.
- **`lastPlayedAt` became client-writable.** The old dirty-patch helper protected it, but the new SQL exclusion list does not. Restore the protection unless this is an intentional contract change.
- **Malformed lock timestamps can return 500.** API validation accepts arbitrary short strings, while SQL casts the value to `timestamptz`. Validate the format or translate a failed cast into the established conflict/error response.
- **Legacy blob writes do not update all summary fields.** The compatibility trigger projects relational scalar/child data but not all promoted list and visibility columns. A direct legacy `data` write can leave relational reads or RLS decisions stale.
- **Equipment fidelity needs broader tests.** Main-hand and off-hand IDs are covered, but false/default values, metadata, coexistence with armor arrays, slot clearing, and references are not.
- **The implemented tests are narrower than the plan.** Missing coverage includes all child collections, create/provision mirror parity, chained lock-token reuse, concurrent idempotency, anonymous/public/campaign RLS, campaign partial failure, realtime races, and provisioning.
- **Generated types should be regenerated after approval.** They currently describe the staged local schema even though that schema has not been applied.

## Where the reviewers disagreed

There was no substantive disagreement about the release blockers. Their differences were about interpretation and severity:

| Topic | SQL reviewer | Application reviewer | Review conclusion |
| --- | --- | --- | --- |
| Null removal | Initially treated reintroduced `{}`, `[]`, and defaults as a direct violation of null-removal semantics. | Noted that relational storage is cleared correctly; the mismatch appears during document reconstruction. | Storage clearing works, but the HTTP/mirror shape contract does not. Specify and test behavior field by field. |
| Parent realtime events | Warned that multiple parent updates inside or around a logical write may emit redundant events. | Believed the intended RPC path suppresses child touches and should normally produce one final event; direct child DML is the clearer event-storm path. | Measure the RPC behavior in integration tests. Both agree direct child DML must not bypass the boundary. |
| Canonical response changes | Initially left open whether empty/default values might be acceptable normalization. | Rated this high because the plan explicitly promises unchanged HTTP payloads. | After discussion, both treated it as release-blocking unless the contract is deliberately changed. |
| Service-role authorization race | Rated the combined authorization/document race high after cross-review. | Considered the race real but initially allowed a medium severity because the timing window is narrow. | Fix before rollout because a narrow confidentiality race is still a correctness defect. |

## What the implementation did well

- Centralized relational persistence behind a typed server service.
- Preserved explicit `updated`, `conflict`, and `not_found` outcomes.
- Locked the parent row before PATCH assembly and replacement.
- Enforced ownership inside authenticated write RPCs.
- Restricted deterministic provisioning to `service_role`.
- Used fixed function search paths and revoked internal projector functions.
- Kept shadow logs privacy-safe by logging IDs and differing field names only.
- Moved the main application read paths away from `characters.data`.

## Recommended path to approval

1. Fix the timestamp token and add the chained-PATCH regression test.
2. Define the exact public document contract, then make reads, null behavior, the mirror, and shadow comparison conform to it.
3. Rebuild the compatibility mirror from canonical relational state and test create, patch, and provision parity.
4. Fix legacy armor reconstruction and expand equipment tests.
5. Close direct child-table writes and make campaign membership/visibility changes atomic.
6. Make campaign authorization plus document assembly atomic and prevent stale realtime fetches from winning.
7. Expand SQL and application coverage to the cases listed above, then rerun the full verification suite.
8. Obtain explicit Kadin approval before applying the cutover migration to the local database.

`characters.data` should remain in place until these issues are fixed and relational-versus-blob parity has been demonstrated.
