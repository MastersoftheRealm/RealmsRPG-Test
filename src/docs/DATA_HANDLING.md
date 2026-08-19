# Data Handling — Codex, Library & Best Practices

> **Purpose:** How we fetch, cache, and invalidate codex and library data. For AI agents and engineers.

**Last updated:** Aug 2026

---

## Principles

1. **Single source for codex** — One route (`GET /api/codex`) and one key family (`['codex', …]`). Consumers fetch the collection they read, not the whole catalog (TASK-775).
2. **Cache aggressively** — Codex and official library change rarely (admin-only). Use long `staleTime`, HTTP `Cache-Control` on APIs, and avoid duplicate fetches.
3. **Unify, don’t duplicate** — Any new consumer of codex data should use a `useCodex*` hook, not a new endpoint or a query key outside the `['codex']` prefix.

---

## Codex (reference data)

### API

- **Endpoint:** `GET /api/codex` — returns all codex collections (feats, skills, species, traits, powerParts, techniqueParts, parts, itemProperties, equipment, archetypes, creatureFeats, coreRules).
- **One collection:** `GET /api/codex?collection=<payload key>` returns the same payload shape with only that key, and only queries that collection's tables (`archetypes` also reads `codex_archetype_levels`). An unknown value is a `400 { error }`. Adding a collection means adding it to `CODEX_PAYLOAD_KEYS` + `COLLECTION_TABLES` — there is no second response shape and no `/api/codex/[collection]` route (ADR-0015).
- **Row mapping:** `lib/codex/row-map.ts` is the one DB-row → entity mapper for GET `/api/codex` and `getCharacterViewEnrichment` (TASK-777). Route-only `updated_at` stays on the route. Archetype path join stays in the route.
- **Cache:** `Cache-Control: private, max-age=0, must-revalidate` — codex is admin-editable, so a long public cache served stale feats/archetypes after saves.

### Client: one collection per consumer

- **Query keys:** `codexKeys.all` = `['codex']` (full payload) and `codexKeys.collection(key)` = `['codex', key]`. Slices live under the full-payload prefix, so `invalidateQueries({ queryKey: ['codex'] })` still refreshes every one of them.
- **Browse hooks:** `useCodexFeats`, `useCodexSkills`, `useCodexSpecies`, `useCodexTraits`, `useCodexParts`, `useCodexPowerParts`, `useCodexTechniqueParts`, `useCodexItemProperties`, `useCodexEquipment`, `useCodexArchetypes`, `useCodexCreatureFeats` — each fetches its own collection via `fetchCodexCollection`. Opening a Codex tab downloads that table only.
- **Parts:** `useCodexParts` / `useCodexPowerParts` / `useCodexTechniqueParts` share `['codex', 'parts']` (one `codex_parts` read) and split with `selectPowerParts` / `selectTechniqueParts` from `lib/codex/part-type.ts` — the same helpers the route uses.
- **useCodexFull:** keeps `['codex']` + `fetchCodex` for the admin spreadsheet (the only multi-collection view). Creators and browse tabs use the collection hooks.
- **useGameRules:** `['codex', 'coreRules']` — it is mounted on most pages, so it must not pull the whole catalog.
- **Single archetype:** `useCodexArchetypes` and `select` the row by id — do not add a parallel codex fetch.

### Invalidation

- When admin edits codex (any tab), invalidate `['codex']`. Prefix matching covers the full payload and every `['codex', collection]` slice.

---

## Library (user + official)

### User library

- **Endpoints:** `GET/POST/PATCH/DELETE /api/user/library/{type}` — `type` = powers, techniques, items, creatures, species, empowered-techniques. Tab badges: `GET /api/user/library/counts` (auth). Enhanced items stay on `/api/user/enhanced-items`.
- **Query keys:** `['user-powers', userId]`, `['user-techniques', userId]`, etc. — per-type, per-user. Counts: `['user-library-counts', userId]`.
- **Hooks:** `useUserPowers`, `useUserTechniques`, `useUserItems`, `useUserCreatures`, `useUserSpecies`, `useUserLibraryCounts`, etc.
- **Stale time:** 2 min; user library changes when the user saves from creators or add-to-library.

### Official library (Realms Library)

- **Endpoint:** `GET /api/official/{type}` — type = powers, techniques, empowered-techniques, items, creatures, species. No auth. Tab badges: `GET /api/official/counts` (`enhanced` is always 0).
- **Cache:** list + counts use `Cache-Control: private, max-age=0, must-revalidate` so create/delete invalidation can refresh badges.
- **Query keys:** `['official-library', type]`. Counts: `['official-library-counts']`.
- **Hooks:** `useOfficialLibrary(type)`, `useOfficialLibraryCounts`, `useAddOfficialToLibrary(type)` in `hooks/use-official-library.ts`.

### Invalidation

- After adding from official to user library: invalidate `['official-library', type]`, the corresponding user library key, and `['user-library-counts']`.
- After create/delete/duplicate (creators, My Library, enhanced): invalidate that collection **and** the matching counts key.

---

## Query key conventions

| Data           | Query key pattern           | Example                    |
|----------------|-----------------------------|----------------------------|
| Full codex     | `['codex']`                 | `useCodexFull` (admin spreadsheet) |
| One codex collection | `['codex', collection]` | `useCodexFeats`, `useGameRules` (`coreRules`) |
| User library   | `['user-powers', userId]`    | useUserPowers              |
| Official library | `['official-library', type]` | `useOfficialLibrary('powers')` |
| User library counts | `['user-library-counts', userId]` | `useUserLibraryCounts` |
| Official library counts | `['official-library-counts']` | `useOfficialLibraryCounts` |
| User library counts | `['user-library-counts', userId]` | `useUserLibraryCounts` |
| Official library counts | `['official-library-counts']` | `useOfficialLibraryCounts` |
| Campaign rolls  | `['campaign-rolls', campaignId]` | useCampaignRolls       |

---

## What to avoid

- **New codex fetches outside the `['codex']` prefix** — e.g. a `['core-rules']` or `['gameData', 'archetypes']` key that calls `/api/codex` again. Use `codexKeys` + a `useCodex*` hook so admin invalidation still reaches it.
- **Reaching for `useCodexFull` to read one collection** — that re-downloads every table. Use the collection hook; add a new key to `CODEX_PAYLOAD_KEYS` if the collection does not exist yet.
- **Read-only GETs without cache headers** — High-volume GETs (codex, official library) should set `Cache-Control` to reduce transfer and load (see `PERFORMANCE_AND_EDGE.md` and `DEPLOYMENT_AND_SECRETS_SUPABASE.md`).

---

## Admin data sources (in sync with DB)

Admin pages read/write the same tables as the app; schema reference: `src/docs/SUPABASE_SCHEMA.md`.

| Admin page | Data source | Tables / API |
|------------|-------------|--------------|
| **Codex Editor** (list + spreadsheet) | GET /api/codex, server actions | public.codex_feats, codex_skills, codex_species, codex_traits, codex_parts, codex_properties, codex_equipment, codex_archetypes, codex_creature_feats, core_rules |
| **Official Library Editor** | GET/POST/DELETE /api/official/[type] | public.official_powers, official_techniques, official_items, official_creatures (run sql/supabase-official-library-public-schema.sql if empty) |
| **Core Rules Editor** | useGameRules + codex actions | public.core_rules (id, data, updated_at) |
| **User Management** | GET /api/admin/users, PATCH /api/admin/users/update-role | public.user_profiles (id, username, role) |

Spreadsheet and list edit modes in the Codex Editor persist via `createCodexDoc` / `updateCodexDoc` / `deleteCodexDoc` (service role); columnar fields match DB columns (snake_case); API response keys (e.g. base_skill_id, ave_height) are mapped in actions so edits round-trip correctly.

---

## Files

| Purpose           | File |
|-------------------|------|
| **DB schema (tables/columns)** | `src/docs/SUPABASE_SCHEMA.md` — single source of truth for public schema |
| Codex API         | `src/app/api/codex/route.ts` |
| Codex hooks       | `src/hooks/use-codex.ts` |
| Codex fetch       | `src/lib/api-client.ts` (`fetchCodex`) |
| Codex types       | `src/types/codex.ts` (`CodexPayload` — canonical GET /api/codex shape) |
| Game rules (codex slice) | `src/hooks/use-game-rules.ts` |
| User library hooks | `src/hooks/use-user-library.ts` |
| Official library hooks | `src/hooks/use-official-library.ts`, `src/app/api/official/[type]/route.ts`, `src/app/api/official/counts/route.ts` |
| User library counts | `src/app/api/user/library/counts/route.ts`, `src/lib/library/library-tab-counts.ts` |
| Library service   | `src/services/library-service.ts` |
| Library types     | `src/types/library.ts` (`LibraryItemByType` — user + official GET shapes) |
| Admin codex actions | `src/app/(main)/admin/codex/actions.ts` — create/update/delete codex + core_rules |
| Admin official library | `src/app/(main)/admin/public-library/` — uses /api/official (official_* tables) |
