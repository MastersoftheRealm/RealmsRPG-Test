# ADR-0030: Relational character persistence

- **Status:** Accepted; local expansion applied, compatibility cutover prepared
- **Deciders:** owner, engineering

## Context

`public.characters.data` is the authoritative document for character creation, sheets,
autosave, campaign access, and encounter resources. List columns already duplicate some
keys. A direct column drop would destroy character state and break deployed clients.
Character references also span Codex, official, and owner library tables; some saved
references contain only a name, and private library rows can be deleted independently.

## Decision

1. Keep the public `Character` HTTP contract. A server persistence boundary maps it to
   scalar `characters` columns and typed child tables. No replacement character JSONB
   document is stored after the contract migration.
2. Scalar identity, resources, abilities, defenses, notes, and preferences live in
   `characters`. One-to-many selections and state live in named `character_*` tables.
   Child rows carry position where order is visible. A source-specific nullable FK
   points to exactly one definition table when a reference resolves uniquely.
3. Codex and official FKs restrict deletion. User library FKs set null on deletion;
   the character row keeps its source ID and name snapshot for unresolved display.
   A private library FK must belong to the same user as the parent character.
4. Expand creates tables and backfills while `data` remains. The app switches to a
   transactional persistence API and shadow-compares assembled rows to legacy JSON.
   A separate, owner-approved contract migration removes `data` only after a backup,
   zero unknown keys/conflicts, parity, and manual QA.
5. `characters.updated_at` remains the optimistic lock and realtime notification
   source. Every child write touches its parent in the same transaction. Dirty PATCH
   replaces only collections explicitly present in the request; an empty array clears.

## Consequences

- Access control must follow the parent character's visibility and ownership, while
  private library lookups stay scoped to the owner.
- SQL must reject malformed or ambiguous legacy entries rather than guess and lose
  data. Migration scripts are committed separately from live application.
- Rollback before contract means returning to the legacy read path. After contract,
  recovery requires the pre-drop database backup; no automatic reverse migration.

## Local-backup preflight (2026-10-13)

The read-only `sql/characters-relational-audit.sql` ran against the owner's local
Supabase backup inside a read-only transaction. It found 57 characters, no unknown
top-level keys, no malformed top-level objects/collections, no conflicting list
columns, and no duplicate references. All saved feat/power/technique references
resolved uniquely. The first visibility-conflict report was an audit false positive:
the database column is authoritative, and 18 documents merely omitted the key.

The migration must additionally handle:

- One legacy character with feat description, skill category/base-skill, and ten
  item cost snapshots. Its `equipment.inventory` exactly equals `equipment.items`;
  the duplicate array may be omitted after verification. Its item `properties`
  arrays are all empty, so no non-empty property payload is lost.
- One legacy `ancestry.id = mixed:<id>+<id>` without `speciesIds`; parse both
  source IDs into ordered species rows. Eight other mixed rows have explicit IDs.
- Four missing inventory-library references: retain saved ID/name snapshots with
  a null FK. `custom-*` inventory IDs are intentionally custom, not failed FKs.
- Proficiency `id` is its character-local generated row ID, while `refId` is the
  Codex FK. All 535 non-custom `refId` values resolve uniquely; one custom row
  correctly has no Codex FK.
- `creationMode` is a deprecated UI routing hint (20 forge, 19 path); path
  selection is represented by `archetypePathId`. Three apparent resource-copy
  differences are absent `health.current`/`energy.current`, not unequal values.

These findings are from the local backup, not a guarantee about later live writes.
The audit must be rerun on the target database immediately before each phase.

The expansion was subsequently applied to the owner's local database. All 57
rows projected; the count/scalar verifier returned zero mismatches and zero
orphans. The compatibility cutover adds the two remaining approved scalars,
transactional write RPCs, slot reconstruction, and an exact `data` mirror. Its
DDL and smoke tests passed locally inside a forced rollback on 2026-10-14; it
has not been persistently applied and still requires explicit high-risk
approval. This is not final-drop approval.
