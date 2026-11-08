# ADR-0030: Codex admin persisted write contract

- **Status:** Accepted
- **Date:** 2026-11-08
- **Deciders:** owner (B7 follow-up to #491 / #493)

## Context

Admin Codex saves (`createCodexDoc` / `updateCodexDoc`) and official library admin POSTs must reject malformed payloads without breaking spreadsheet rows, modal editors, or legacy comma-separated column shapes. `library-persisted-contract.ts` already owns user/official **library** columnar writes (powers, items, creatures, species). Codex reference tables use a different column set and serializers (`codex-column-map.ts`, admin `*FormToSavePayload`, `row-map.ts`).

## Decision

1. **`lib/codex-columnar-keys.ts`** — authoritative allowlists and field metadata for admin Codex collections (feats, skills, species, traits, parts, properties, equipment, archetypes, creature feats).
2. **`lib/codex-persisted-contract.ts`** — collection-aware value validation (lists, numeric scalars, archetype JSONB cells) before mapping. Validation is lenient on null/empty legacy shapes; it does not invent game-rule numbers.
3. **`lib/codex-mutation-validation.ts`** — throws with editor-safe messages; wired from `assertCodexAdminPayloadKeys` in `codex-column-map.ts` (single path into `toColumnarPayload` / `toDbPayload`).
4. **`lib/codex-archetype-path-save-validation.ts`** — same persisted contract for admin **`saveArchetypeWithPath`** (path workspace save), including progression level rows and trusted numeric ids.
5. **Official/user library writes** stay on `library-persisted-contract.ts` + `validateUserLibraryWriteBody` — no duplicate Codex contract on those routes.

Archetype JSON columns call strict write validators in `lib/game/archetype-path.ts` (`codexWriteLevel1LoadoutsError`, `codexWriteRecommendedAbilitiesError`, `codexWriteGuidanceGroupsError`). They enforce the same structural rules as the lenient read parsers (`parseLevel1LoadoutsField`, `parseRecommendedAbilities`, `parseGuidanceGroups`) but reject invalid nested elements instead of dropping them.

## Consequences

- Positive: one validation layer aligned with existing spreadsheet serialization; producer and row-map regressions can target the same guard as live admin saves.
- Negative: new collection/field shapes need an explicit entry in the contract (not a generic catch-all schema).
- Relation to **library-persisted-contract**: parallel modules (library vs codex admin), shared pattern only — different allowlists, different legacy shapes, no shared fork of columnar mapping.
