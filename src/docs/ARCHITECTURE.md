# RealmsRPG Architecture

> **Purpose:** Single reference for data flow, Supabase structure, and service/hook usage. For AI agents and engineers.

**Last verified:** Jun 2026

---

## Overview

RealmsRPG uses Next.js (App Router), React, Tailwind, and Supabase (PostgreSQL, Auth, Storage). Data flows through:

1. **Supabase** — All data: Codex via `/api/codex`; characters, library, campaigns, encounters, profile, admin via Supabase server client (`createClient` from `@/lib/supabase/server`).
2. **Hooks** — React Query + custom hooks for fetching and caching (`useCodexFeats`, `useCodexPowerParts`, etc.)
3. **Enrichment** — `data-enrichment.ts` resolves saved IDs against Codex parts and user library to compute display values
4. **Services** — Character CRUD, Codex API

---

## Codex Data (Supabase / PostgreSQL)

Codex reference data comes from Supabase via `/api/codex`. Hooks like `useCodexPowerParts`, `useCodexTechniqueParts`, `useCodexFeats`, `useCodexSkills` fetch from the Codex API.

| Data | Purpose |
|------|---------|
| `power_parts` | Power mechanic parts (base_en, base_tp, op_1/2/3 costs) |
| `technique_parts` | Technique mechanic parts |
| `item_properties` | Weapon/armor/shield properties |
| `skills` | Skill definitions (ability links, sub-skills) |
| `feats` | Feat definitions |
| `species` | Species definitions |
| `archetypes` | Archetype definitions |

**Key point:** Saved powers/techniques store **part IDs** and **option levels**. The display cost (EN/TP) is computed at render time by resolving IDs against Codex parts via `derivePowerDisplay` / `deriveTechniqueDisplay`.

---

## Data Enrichment Pipeline

**File:** `src/lib/data-enrichment.ts`

**Purpose:** Character data often stores only IDs or names. Enrichment pairs raw character data with full objects from the user's library and Codex to produce display-ready values.

### When to Use

| Function | When | Inputs | Output |
|----------|------|--------|--------|
| `enrichPowers` | Character sheet, library, creator lists | `characterPowers`, `userPowerLibrary`, `powerPartsDb` | `EnrichedPower[]` with `cost`, `actionType`, `area`, etc. |
| `enrichTechniques` | Same contexts | `characterTechniques`, `userTechniqueLibrary`, `techniquePartsDb` | `EnrichedTechnique[]` |
| `enrichItems` | Inventory, equipment lists | `characterItems`, `userItemLibrary` | `EnrichedItem[]` |

### Flow

1. Character has `powers: [{ name: "Fireball", innate: false }]` (or `{ id, name }`)
2. `findInLibrary(userPowerLibrary, charPower)` finds matching library item
3. `derivePowerDisplay(libraryItem, powerPartsDb)` computes energy cost from parts + option levels
4. Enriched object has `cost`, `actionType`, `area`, `duration`, etc.

**Codex dependency:** Parts must be loaded before enrichment produces correct costs. Library pages and character sheet use `useCodexPowerParts()` / `useCodexTechniqueParts()` for `powerPartsDb` / `techniquePartsDb` and pass them into enrichment.

---

## Hooks & Services

### Hooks

| Hook | Purpose | Returns |
|------|---------|---------|
| `useAuth` | Auth state, user | `{ user, loading, signOut, ... }` |
| `useCharacters` | User's characters | `{ characters, loading, createCharacter, updateCharacter, deleteCharacter }` |
| `useUserPowers` / `useUserItems` / … | User's powers, techniques, items, creatures (`use-user-library.ts`) | typed query results |
| `useCodexPowerParts`, `useCodexTechniqueParts`, `useCodexFeats`, `useCodexSkills`, etc. | Codex reference data | Parts, feats, skills, species from Supabase |
| `useAutoSave` | Auto-save character on change | Used in character sheet |

### Services

| Service | Purpose |
|---------|---------|
| `character-service.ts` | CRUD for characters (create, update, delete, load) |
| Codex API | `src/app/api/codex/` — fetches from Supabase |

**Use hooks in components.** Services are called by hooks or server actions.

---

## Key Files

| Purpose | File |
|---------|------|
| Supabase client | `src/lib/supabase/` |
| Codex API | `src/app/api/codex/` |
| Data enrichment | `src/lib/data-enrichment.ts` |
| Character CRUD | `src/services/character-service.ts` |
| Game formulas | `src/lib/game/formulas.ts`, `src/lib/game/calculations.ts`, `src/lib/game/skill-allocation.ts` |
| Game constants | `src/lib/game/constants.ts` |

**Data handling (codex, library, caching):** See `DATA_HANDLING.md` for single-source codex fetch, query keys, cache headers, and prefetch pattern.

---

## Type Definitions

| Location | Purpose |
|---------|---------|
| `src/types/character.ts` | Character, CharacterPower, CharacterTechnique |
| `src/types/items.ts` | UserItem, SavedDamage |
| `src/types/abilities.ts` | Abilities, Defenses |
| `src/types/skills.ts` | Skill, SubSkill |
| `src/hooks/use-rtdb.ts` | PowerPart, TechniquePart, ItemProperty, CreatureFeat (fetches from Codex API; filename is legacy) |

---

## Common Patterns

1. **List views with costs:** Load library + Codex parts, then enrich before rendering. Do not block render on `!partsDb.length` — show data as soon as library loads; costs update when parts are available.
2. **Character sheet:** Uses `useCharacters`, `useUserPowers` / `useUserItems` / …, Codex hooks. Enrichment happens in `library-section.tsx` and similar components.
3. **Creators:** Use Codex hooks for part/property options. Save to Supabase via `useUser*` mutations.

---

## Client error handling (API / Supabase boundaries)

**Authority for client-side failure UX.** Keep one pattern per boundary; do not mix silent swallows with toast/inline feedback on the same user action.

| Boundary | Convention |
|----------|------------|
| **`apiFetch` / `apiUpload` / `apiFetchOrNull`** (`@/lib/api-client`) | Failures **throw** `Error` with a parsed message. Callers `catch` and surface (toast or inline Alert). Prefer these over raw `fetch` for `/api/*`. |
| **Supabase JS client** (`createClient()` / server client) | Always inspect `{ data, error }`. On `error`, **throw** or return a typed failure — Supabase does **not** throw by default. |
| **Server actions** returning `{ success, error }` / `{ profile, error }` | Check the `error` / `success` field; do not treat a null payload as success when `error` is set. |
| **React Query mutations** | Prefer `onError` → `showToast(...)`, or `mutateAsync` inside `try/catch` with toast/Alert. Load errors → `ErrorDisplay` + retry (library tabs). |

### Rules

1. **User-initiated actions** (save, delete, sync, upload, account change): never empty `catch {}` / `.catch(() => {})`. Show toast or inline message with `getErrorMessage(err, fallback)`.
2. **Not-found vs failure:** Helpers that return `null` for “no row” (e.g. name lookup) must still **throw** on network/HTTP failure — `null` means not found only.
3. **Best-effort background work** (optional migrate, non-critical sync): log via `logClientError` from `@/lib/api-client` with an adjacent comment explaining why the user is not notified; do not use empty `catch {}`.
4. **Parse once:** Use `getErrorMessage` from `@/lib/api-client` instead of ad-hoc `(e as Error)?.message ?? '…'` at each callsite when touching a file.

### Reference migrations (TASK-479)

- Account: `my-account/page.tsx` — profile load and auth updates surface errors (no silent catch).
- Library: `findLibraryItemByName` in `library-service.ts` — lookup miss → `null`; API failure → throw (callers toast).

### Server error responses (Route Handlers)

**Authority for `/api/*` failure JSON.** Complements client-side handling above.

| Rule | Convention |
|------|------------|
| **Error shape** | `{ error: string }` with appropriate HTTP status. No raw Supabase/Postgres `.message`, `.details`, or stack in production responses. |
| **Logging** | `logApiError(context, err)` or `apiErrorResponse(message, status, context, err)` from `@/lib/api-error` — log full error server-side first. |
| **Debug / hints** | Optional `hint` or `debug` only when `NODE_ENV=development` or explicit gated `?debug=1` (e.g. codex admin gate). |
| **Validation** | Zod/validation failures may include field-level `details` when the message is derived from schema paths, not DB errors. |

Success responses remain route-specific (`{ id }`, `{ images }`, arrays, etc.); standardize **errors** only.

---

## Character schema (save/load boundary)

**Authority:** `src/lib/character/schema-normalize.ts` (TASK-663). Normalize at API load (`normalizeCharacterOnLoad` — promotes canonical fields and strips legacy aliases) and before persistence (`normalizeCharacterForSave` in `cleanForSave`, `prepareCharacterForSave`, and PATCH/duplicate merge paths).

| Concept | Canonical field | Legacy aliases (dual-read on load; stripped on save) |
|---------|-----------------|------------------------------------------------------|
| Defense allocation | `defenseVals` | `defenseSkills` |
| Martial proficiency | `mart_prof` | `martialProficiency` |
| Power proficiency | `pow_prof` | `powerProficiency` |
| Archetype category | `archetype.type` (`power` \| `powered-martial` \| `martial`) | `mixed` → `powered-martial` |

Proficiency-inferred archetype in `getArchetypeType()` uses `ProficiencyDerivedArchetype` (`ArchetypeCategory | 'none'`) — same vocabulary as stored `archetype.type`, not a separate `mixed` label.

Armor item DR at display time: resolve via canonical **`resolveArmorDamageReduction`** (`lib/game/resolve-armor-damage-reduction.ts`, TASK-644) — prefers `damageReduction`, then `armorValue` / `armor` / `armor_value`, then a Damage Reduction property. `deriveArmorItemCombatStats` and list/enrichment/guided catalog call sites consume that helper (`itemDamageReduction` is a deprecated alias).
