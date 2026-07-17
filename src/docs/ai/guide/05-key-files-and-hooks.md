> Back: [`AGENT_GUIDE.md`](../AGENT_GUIDE.md) · Core: [`ARCHITECTURE_CONSTITUTION.md`](../ARCHITECTURE_CONSTITUTION.md)

# Key Files & Hooks

## Key Files

| Purpose | File |
|---------|------|
| Design tokens | `src/app/globals.css` |
| Data enrichment | `src/lib/data-enrichment.ts` |
| Character logic | `src/services/character-service.ts`, `src/hooks/use-characters.ts` |
| Creator state | `src/stores/character-creator-store.ts` (Advanced) · `src/stores/guided-creator-store.ts` (Simple/Guided) |
| Supabase | `src/lib/supabase/` |
| **Database schema (single source of truth)** | `src/docs/SUPABASE_SCHEMA.md` — all public tables, columnar vs JSONB, API→tables; do not duplicate elsewhere |
| Database types | `src/types/database.ts` (or Supabase-generated types) |
| Codex API | `src/app/api/codex/` — fetches from Supabase |
| **Game rules + user-facing terms** | `src/docs/GAME_RULES.md` — formulas, caps, **Terminology & Definitions** (capitalize game terms; **named Bonuses Title Case** e.g. Attack Bonus, Martial Bonus, Power Bonus; prefer/avoid vocab; Score = Bonus + 10; no em dash in new UI copy; **spell game terms in full on Layer 1/2**, e.g. Currency not `c`). Read before writing labels, tips, or guided copy. |
| **Entity card art (list thumb, choice cards, upload)** | `REALMS_PRODUCT_OVERVIEW.md` §5.0.3 + [`ADR-0003`](../ADR/0003-realms-image-library.md) + [`03-entity-card-art.md`](03-entity-card-art.md); bank: `realms-images.ts` + `/api/images*`; admin bank UI: `/admin/images`; resolve: `guided-choice-image.ts`, `list-row-image.ts` |
| **Accessibility & contrast** | `src/docs/ACCESSIBILITY.md` — contrast tokens (success-700 + dark variant, power/martial-dark), form labels, headings, modals, touch targets; `src/docs/DESIGN_SYSTEM.md` — status and game-specific color tokens for light + dark mode. When editing UI, ensure new or changed text/controls follow these so both themes pass WCAG 2.1 AA. |
| **User experience goals** | `src/docs/USER_EXPERIENCE_GOALS.md` — UX goals, terminology (Realms Codex/Library, My Library), what's implemented vs backlog, and AI checklist for onboarding/retention/copy. Read when changing landing, creator, library, or onboarding flows. |
| Architecture | `src/docs/ARCHITECTURE.md` |
| **Codex/library data** | `src/docs/DATA_HANDLING.md` — single codex fetch, query keys, cache headers, prefetch; read when adding or changing codex/library hooks or APIs |
| **Character/creature math** | `src/lib/game/formulas.ts`, `src/lib/game/calculations.ts`, `src/lib/game/skill-allocation.ts` — all ability, defense, skill, and derived stats |
| **Power/technique/item cost and display** | `src/lib/calculators/` — part costs, derive*Display helpers, filterSavedItemPropertiesForList; use for creator preview and library/codex display |
| **Crafting requirements and outcome** | `src/lib/game/crafting-utils.ts` — getCraftingRequirements, getUpgradeRequirements, getEnhancedCraftingRequirements, calculateCraftingOutcome, optional modifiers; `src/types/crafting.ts` — session types, `UserEnhancedItem`, `OfficialEnhancedItem` / `OfficialEnhancedItemPayload`, create/patch inputs; hooks in `use-enhanced-items.ts` |

## Hooks & Services

| Need | Hook / Service |
|------|----------------|
| Auth state | `useAuth` |
| User's characters | `useCharacters` |
| User's library (powers, techniques, items, creatures) | `useUserLibrary` |
| Codex reference data (parts, skills, feats, species) | `useCodexFeats`, `useCodexSkills`, `usePowerParts`, etc. (from `use-codex.ts`; data from Supabase) |
| Character CRUD | `character-service.ts` (via useCharacters) |

**Enrichment:** Use `enrichPowers`, `enrichTechniques`, `enrichItems` from `data-enrichment.ts` when displaying character powers/techniques/items. Pass `powerPartsDb` / `techniquePartsDb` from `useCodexPowerParts()` / `useCodexTechniqueParts()` for correct EN/TP costs. See `ARCHITECTURE.md`. **Codex/library:** Use `useCodex*` hooks (single `['codex']` fetch); avoid duplicate codex fetches. See `DATA_HANDLING.md`.
