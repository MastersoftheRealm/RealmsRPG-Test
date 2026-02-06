# RealmsRPG Architecture

> **Purpose:** Single reference for data flow, Firebase structure, and service/hook usage. For AI agents and engineers.

**Last verified:** Feb 2026

---

## Overview

RealmsRPG uses Next.js (App Router), React, Tailwind, and Firebase. Data flows through:

1. **Firebase** — Firestore (user data, characters, library) + Realtime Database (RTDB) for game reference data
2. **Hooks** — React Query + custom hooks for fetching and caching
3. **Enrichment** — `data-enrichment.ts` resolves saved IDs against RTDB and user library to compute display values
4. **Services** — Character CRUD, game data fetching

---

## Firebase Structure

### Firestore

| Collection | Purpose |
|-----------|---------|
| `users` | User profiles, displayName, username |
| `usernames` | Username → uid lookup (for uniqueness) |
| `characters` | Player characters (per user) |
| `user_powers` | User-created powers (library) |
| `user_techniques` | User-created techniques (library) |
| `user_items` | User-created armaments/equipment (library) |
| `user_creatures` | User-created creatures (library) |

Characters and library items are stored per-user. Codex content is read from RTDB (shared reference data).

### Realtime Database (RTDB)

| Path | Purpose |
|------|---------|
| `power_parts` | Power mechanic parts (base_en, base_tp, op_1/2/3 costs) |
| `technique_parts` | Technique mechanic parts |
| `item_properties` | Weapon/armor/shield properties |
| `skills` | Skill definitions (ability links, sub-skills) |
| `feats` | Feat definitions (codex) |
| `species` | Species definitions |
| `archetypes` | Archetype definitions |

**Key point:** Saved powers/techniques store **part IDs** and **option levels**. The display cost (EN/TP) is computed at render time by resolving IDs against RTDB parts via `derivePowerDisplay` / `deriveTechniqueDisplay`.

---

## Data Enrichment Pipeline

**File:** `src/lib/data-enrichment.ts`

**Purpose:** Character data often stores only IDs or names. Enrichment pairs raw character data with full objects from the user's library and RTDB to produce display-ready values.

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

**RTDB dependency:** Parts must be loaded before enrichment produces correct costs. Library pages and character sheet use `useRTDB()` for `powerPartsDb` / `techniquePartsDb` and pass them into enrichment.

---

## Hooks & Services

### Hooks

| Hook | Purpose | Returns |
|------|---------|---------|
| `useAuth` | Auth state, user | `{ user, loading, signOut, ... }` |
| `useCharacters` | User's characters | `{ characters, loading, createCharacter, updateCharacter, deleteCharacter }` |
| `useUserLibrary` | User's powers, techniques, items, creatures | `{ powers, techniques, items, creatures, loading }` |
| `useRTDB` | RTDB reference data | `{ powerParts, techniqueParts, itemProperties, skills, feats, species, loading }` |
| `useGameData` | Combined game data (RTDB + optional library) | `{ gameData, loading }` |
| `useAutoSave` | Auto-save character on change | Used in character sheet |

### Services

| Service | Purpose |
|---------|---------|
| `character-service.ts` | CRUD for characters (create, update, delete, load) |
| `game-data-service.ts` | Fetch RTDB data |

**Use hooks in components.** Services are called by hooks or server actions.

---

## Key Files

| Purpose | File |
|---------|------|
| Firebase client | `src/lib/firebase/client.ts` |
| Firebase server | `src/lib/firebase/server.ts` |
| Data enrichment | `src/lib/data-enrichment.ts` |
| Character CRUD | `src/services/character-service.ts` |
| Game formulas | `src/lib/game/formulas.ts` |
| Game constants | `src/lib/game/constants.ts` |
| Progression | `src/lib/game/progression.ts` |

---

## Type Definitions

| Location | Purpose |
|---------|---------|
| `src/types/character.ts` | Character, CharacterPower, CharacterTechnique |
| `src/types/items.ts` | UserItem, SavedDamage |
| `src/types/abilities.ts` | Abilities, Defenses |
| `src/types/skills.ts` | Skill, SubSkill |
| `src/hooks/use-rtdb.ts` | PowerPart, TechniquePart, ItemProperty |

---

## Common Patterns

1. **List views with costs:** Load library + RTDB parts, then enrich before rendering. Do not block render on `!partsDb.length` — show data as soon as library loads; costs update when parts are available.
2. **Character sheet:** Uses `useCharacters`, `useUserLibrary`, `useRTDB`. Enrichment happens in `library-section.tsx` and similar components.
3. **Creators:** Use `useRTDB` for part/property options. Save to Firestore via `useUserLibrary` mutations or direct Firestore writes.
