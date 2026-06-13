# Data Handling — Codex, Library & Best Practices

> **Purpose:** How we fetch, cache, and invalidate codex and library data. For AI agents and engineers.

**Last updated:** Jun 2026

---

## Principles

1. **Single source for codex** — One network request for the full codex; all consumers share it via React Query `queryKey: ['codex']` and `select` for slices.
2. **Cache aggressively** — Codex and official library change rarely (admin-only). Use long `staleTime`, HTTP `Cache-Control` on APIs, and avoid duplicate fetches.
3. **Unify, don’t duplicate** — Any new consumer of codex data should use the shared `['codex']` query (or a `useCodex*` hook), not a new endpoint or query key that re-fetches the full payload.

---

## Codex (reference data)

### API

- **Endpoint:** `GET /api/codex` — returns all codex collections (feats, skills, species, traits, powerParts, techniqueParts, parts, itemProperties, equipment, archetypes, creatureFeats, coreRules).
- **Cache:** Response uses `Cache-Control: public, max-age=300, s-maxage=600, stale-while-revalidate=300` (browser 5 min, CDN 10 min).

### Client: one fetch, many consumers

- **Query key:** `['codex']` — all codex hooks and `useGameRules` use this key so React Query deduplicates: one request, many subscribers.
- **Hooks:** `useCodexFeats`, `useCodexSkills`, `useCodexSpecies`, `useCodexTraits`, `useCodexPowerParts`, `useCodexTechniqueParts`, `useCodexParts`, `useCodexItemProperties`, `useCodexEquipment`, `useCodexArchetypes`, `useCodexCreatureFeats`, `useCodexFull` — same `queryKey: ['codex']`, same `queryFn: fetchCodex`, different `select` for each slice.
- **useGameRules:** Uses `queryKey: ['codex']` and `select` to derive `coreRules` from the codex response (no separate `/api/codex` call).
- **useArchetypes / useArchetype:** `useArchetypes` is `useCodexArchetypes` (re-export). `useArchetype(id)` uses `['codex']` with `select` to return the single archetype by id.

### Prefetch

- **prefetchFunctions** (e.g. for loaders): All slice helpers (`feats`, `skills`, `species`, …) use a **single shared in-flight fetch** for `/api/codex`. Calling multiple prefetch functions only triggers one request.

### Invalidation

- When admin edits codex (any tab), invalidate `['codex']` so all codex hooks and game rules refetch.

---

## Library (user + official)

### User library

- **Endpoints:** `GET/POST/PATCH/DELETE /api/user/library/{type}` — `type` = powers, techniques, items, creatures, species, empowered-techniques, enhanced-items.
- **Query keys:** `['user-powers', userId]`, `['user-techniques', userId]`, etc. — per-type, per-user.
- **Hooks:** `useUserPowers`, `useUserTechniques`, `useUserItems`, `useUserCreatures`, `useUserSpecies`, etc.
- **Stale time:** 2 min; user library changes when the user saves from creators or add-to-library.

### Official library (Realms Library)

- **Endpoint:** `GET /api/official/{type}` — type = powers, techniques, empowered-techniques, items, creatures, species. No auth.
- **Legacy:** `GET /api/public/{type}` still exists but is deprecated; migrate to `/api/official` (see TASK-315).
- **Cache:** `Cache-Control: public, max-age=300, s-maxage=600, stale-while-revalidate=300`.
- **Query keys:** `['official-library', type]`.
- **Hooks:** `useOfficialLibrary(type)`, `useAddOfficialToLibrary(type)`.
- **Deprecated aliases:** `usePublicLibrary`, `useAddPublicToLibrary` — same implementations; prefer official names in new code.

### Invalidation

- After adding from official to user library: invalidate both `['official-library', type]` and the corresponding user library key.

---

## Query key conventions

| Data           | Query key pattern           | Example                    |
|----------------|-----------------------------|----------------------------|
| Full codex     | `['codex']`                 | All codex hooks, useGameRules |
| User library   | `['user-powers', userId]`    | useUserPowers              |
| Official library | `['official-library', type]` | `useOfficialLibrary('powers')` |
| Campaign rolls  | `['campaign-rolls', campaignId]` | useCampaignRolls       |

---

## What to avoid

- **New codex fetches with a different query key** — e.g. a `['core-rules']` or `['gameData', 'archetypes']` that calls `/api/codex` again. Use `['codex']` and `select` instead.
- **Prefetch that fetches full codex per slice** — Use the shared `prefetchFunctions` (they share one fetch) or `queryClient.prefetchQuery({ queryKey: ['codex'], queryFn: fetchCodex })`.
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
| Game rules (codex slice) | `src/hooks/use-game-rules.ts` |
| User library hooks | `src/hooks/use-user-library.ts` |
| Official library hooks | `src/hooks/use-public-library.ts` (`useOfficialLibrary`), `src/app/api/official/[type]/route.ts` |
| Legacy public API (deprecated) | `src/app/api/public/[type]/route.ts` |
| Library service   | `src/services/library-service.ts` |
| Admin codex actions | `src/app/(main)/admin/codex/actions.ts` — create/update/delete codex + core_rules |
| Admin official library | `src/app/(main)/admin/public-library/` — uses /api/official (official_* tables) |
