# Crafting Implementation Plan

**Purpose:** Comprehensive plan for (1) adding crafting rules to the core rules database and admin editor, (2) building a crafting hub (encounter-like list) and crafting page, and (3) supporting general, enhanced, and consumable crafting with auto-calculated outcomes.

**Source:** `crafting.txt` (full crafting rules); `SUPABASE_SCHEMA.md`; `AGENT_GUIDE.md`; existing core rules, skill encounter, and creator patterns.

**Last updated:** 2026-03-10 — crafting under RM Tools; DS modifier and manual additional successes/failures.

---

## Part 0: Ideal UX Flow (Summary)

1. **Navigation:** Crafting is under **RM Tools** in the navbar (with Encounters, Creature Creator), not under Creators — crafting is encounter-like.

2. **Crafting Hub** (like Encounters list) — User lands here first. Shows:
   - Crafting completed
   - Crafting planned
   - Crafting in progress
   - "Start Crafting" button → no naming required; opens the actual crafting page

2. **Crafting Page** (actual crafting flow):
   - Select item/armament (or create custom for enhanced)
   - Toggle: Consumable (alters time/cost), Bulk (3 cost → 4 items), Enhanced (add power)
   - **DS modifier** — RM/player can add a modifier to the base Difficulty Score (e.g. finer tools, bonuses); effective DS = base DS + modifier.
   - **Additional successes / failures** — Manual add/remove (like skill encounters: "+ Success", "− Success", "+ Failure", "− Failure") for situational bonuses (e.g. help from another crafter, environmental bonuses).
   - Display: currency cost, (effective) DS, number of checks, total days; each roll input = one time increment (5 days, 8 hours, etc.)
   - Each session styled like skill encounter combatants (abbreviated/simplified)
   - Enter rolls incrementally — don't need all at once
   - After all sessions have values: auto-calculate and display final material cost, market price, outcome from Successes table
   - Sub-skill success/failure descriptions visible during process

3. **Enhanced Crafting:**
   - Toggle Enhanced → add power from library; custom base item (e.g. "Ring") with custom cost if not in codex
   - Potency: manual input OR use creator's potency at crafting time
   - Upgrade potency: 25% time + cost, 25% successes
   - Multiple use: Full/Partial recovery table → adjusted energy %
   - Single-use: Consumable Enhanced table; duration ≤ 1 day, potency ≤ 25
   - Save to Enhanced Equipment library (new library type)

---

## Part 1: Crafting Rules in Core Rules Database

### 1.1 Data Model

Add a new `CRAFTING` category to `core_rules`. Store as a single row: `id = 'CRAFTING'`, `data = { ... }`.

**Shape:** `CraftingRules` interface in `src/types/core-rules.ts`:

```ts
export interface CraftingTableRow {
  currencyMin: number;
  currencyMax: number | null;  // null = 100,000+
  rarity: string;
  difficultyScore: number;
  successes: number;
  timeValue: number;
  timeUnit: 'hours' | 'days';
}

export interface SuccessesTableRow {
  delta: number;           // +/- from required (e.g. 1, 2, 3...)
  failureEffect: string;   // e.g. "Item worth 75% of market price"
  successEffect: string;   // e.g. "Item worth 125% of market price"
  // For auto-calculation (delta < 0 uses failure*, delta > 0 uses success*):
  failureItemWorthPercent?: number;  // 0-100 (0 = worthless)
  successItemWorthPercent?: number;   // 100-200
  materialsRetainedPercent?: number; // 0-75 (success only)
  extraItemCount?: number;           // for delta 8+ (delta - 7)
  choiceExtraItemOrEnhance?: boolean; // delta 7: user picks extra @ 100% OR enhance to 200%
}

export interface EnhancedCraftingTableRow {
  rarity: string;
  currencyPerEnergy: number;
  energyMin: number;
  energyMax: number | null;
  difficultyScore: number;
  successes: number;
  timeValue: number;
  timeUnit: 'hours' | 'days';
}

export interface ConsumableEnhancedTableRow {
  rarity: string;
  costPerEnergy: number;
  energyMin: number;
  energyMax: number | null;
  difficultyScore: number;
  successes: number;
  timeValue: number;
  timeUnit: 'hours' | 'days';
}

export interface MultipleUseEnergyRow {
  partialRecovery: number | 'permanent';
  fullRecovery: number | 'permanent';
  adjustedEnergyPercent: number;
}

export interface CraftingRules {
  // General crafting
  craftingCostMultiplier: number;           // 0.75 (75% of market price)
  consumableTimeMultiplier: number;         // 0.25 (¼ of listed time)
  craftingDayHours: number;                 // 8
  generalTable: CraftingTableRow[];
  successesTable: SuccessesTableRow[];

  // Enhanced crafting
  enhancedTable: EnhancedCraftingTableRow[];
  multipleUseTable: MultipleUseEnergyRow[];
  enhancedSellPriceMultiplier: number;      // 1.25 (125%)

  // Consumable enhanced
  consumableEnhancedTable: ConsumableEnhancedTableRow[];

  // Upgrades
  upgradeMaterialCostMultiplier: number;    // 0.75
  npcUpgradeCostMultiplier: number;         // 1.0 (100% of price diff)
  npcServiceFeeWithMaterials: number;       // 0.25 (25%)

  // Bulk crafting
  bulkCraftCount: number;                   // 4 items
  bulkCraftMaterialCount: number;           // 3 (pay for 3, get 4)

  // Optional: finer tools bonuses (rarity → bonus)
  finerToolsBonus?: Record<string, number>;
}
```

### 1.2 Seed Data (from crafting.txt)

**General Crafting Table** (currency cost brackets):

| currencyMin | currencyMax | rarity | difficultyScore | successes | timeValue | timeUnit |
|-------------|-------------|--------|-----------------|-----------|----------|----------|
| 0 | 99 | Common | 14 | 1 | 8 | hours |
| 100 | 499 | Uncommon | 16 | 1 | 5 | days |
| 500 | 1499 | Rare | 18 | 2 | 10 | days |
| 1500 | 2499 | Epic | 20 | 4 | 20 | days |
| 2500 | 4999 | Epic | 22 | 5 | 25 | days |
| 5000 | 9999 | Epic | 24 | 6 | 30 | days |
| 10000 | 19999 | Legendary | 26 | 7 | 35 | days |
| 20000 | 34999 | Legendary | 28 | 8 | 40 | days |
| 35000 | 49999 | Legendary | 30 | 9 | 45 | days |
| 50000 | 64999 | Mythic | 32 | 10 | 50 | days |
| 65000 | 79999 | Mythic | 34 | 11 | 55 | days |
| 80000 | 99999 | Mythic | 36 | 12 | 60 | days |
| 100000 | null | Ascended | 38 | 14 | 70 | days |

**Successes Table** (delta from required; includes calculation fields for auto-cost/price):

| delta | failureEffect | successEffect | failureItemWorth% | successItemWorth% | materialsRetained% | extraItemCount | choiceExtraOrEnhance |
|-------|---------------|---------------|-------------------|-------------------|--------------------|----------------|----------------------|
| 0 | — | Create fully functional item worth market price | — | 100 | 0 | 0 | false |
| 1 | 75% market price | 125% market price | 75 | 125 | 0 | 0 | false |
| 2 | 50% market price | 125% + retain 25% | 50 | 125 | 25 | 0 | false |
| 3 | 25% market price | 125% + retain 50% | 25 | 125 | 50 | 0 | false |
| 4 | Worthless | 150% + retain 50% | 0 | 150 | 50 | 0 | false |
| 5 | — | 150% + retain 75% | — | 150 | 75 | 0 | false |
| 6 | — | 175% + retain 75% | — | 175 | 75 | 0 | false |
| 7 | — | Choice: extra @ 100% OR enhance to 200% + retain 75% | — | 200* | 75 | 0 | true |
| 8+ | — | Previous + 1 extra per success above 7 | — | 200* | 75 | (delta-7) | true |

*Delta 7: user chooses extra item (100%) OR enhance (200%); delta 8+ adds extra items.

**Enhanced Crafting Table** (energy brackets) — same structure as general but keyed by energy.

**Consumable Enhanced Table** — separate table from crafting.txt lines 248–283.

**Multiple Use Energy Adjustment Table** — partial/full recovery uses → adjusted energy %.

### 1.3 Implementation Steps (Part 1)

1. **Types:** Add `CraftingRules`, `CraftingTableRow`, etc. to `src/types/core-rules.ts`; add `CRAFTING` to `CoreRulesMap`.
2. **Seed script:** Add `CRAFTING` object to `scripts/seed-core-rules.js` with full tables from crafting.txt.
3. **Data file:** Create `data/core-rules/CRAFTING.json` (optional; seed script can embed).
4. **useGameRules fallback:** Add `CRAFTING` to `FALLBACK_RULES` in `use-game-rules.ts` with same seed data.
5. **Admin Core Rules tab:** Add `{ id: 'crafting', label: 'Crafting', category: 'CRAFTING' }` to `TABS` in `admin/core-rules/page.tsx`.
6. **CategoryEditor case:** Add `case 'CRAFTING':` with:
   - Editable table rows for `generalTable`, `successesTable`, `enhancedTable`, `consumableEnhancedTable`, `multipleUseTable`
   - NumInput for multipliers (`craftingCostMultiplier`, `consumableTimeMultiplier`, etc.)
   - Table editors: add/remove rows, inline edit cells (similar to ARMAMENT_PROFICIENCY table editor pattern)

---

## Part 2: Crafting Hub (Encounter-Like List)

### 2.1 Route & Purpose

- **Route:** `(main)/crafting` — landing page (hub). **Nav:** under **RM Tools** dropdown (with Encounters, Creature Creator).
- **Layout:** Same pattern as Encounters list — cards/sections for Completed, Planned, In Progress.
- **"Start Crafting"** — Primary CTA; no naming required (unlike encounters). Navigates to `(main)/crafting/new` or opens inline crafting flow.

### 2.2 Hub Sections

| Section | Description |
|---------|--------------|
| **In Progress** | Crafting sessions with some rolls entered but not all |
| **Planned** | Sessions created but no rolls yet (item selected, setup done) |
| **Completed** | All rolls entered; outcome calculated and displayed |

### 2.3 Persistence

- **Table:** `crafting_sessions` (or store in `encounters` with `type: 'crafting'` if we extend that model).
- **Columns:** id, user_id, status, item_name, currency_cost, created_at, updated_at, data (JSONB for full session state).

---

## Part 3: Crafting Page (Actual Crafting Flow)

### 3.1 Route

- **Route:** `(main)/crafting/new` or `(main)/crafting/[id]` — the actual place to do crafting (item selection, rolls, outcome).

### 3.2 Core Flow

1. **Select item to craft** — Equipment or armament from:
   - User library, Codex equipment, Public library
   - **Custom equipment** (Enhanced only): User can add equipment not in codex (e.g. "Ring") — custom name + custom currency cost for crafting calculations.

2. **Toggles:**
   - **Consumable** — Alters time (×¼ for general) and uses Consumable Enhanced table for single-use enhanced.
   - **Bulk** — Pay time and material cost for **3** items, produce **4**; required successes and number of roll sessions = **3 ×** single-item (crafting.txt: "you still must make the proper number of rolls and obtain the proper amount of successes that you would for 3 items"); DS unchanged.
   - **Enhanced** — Enables power selection; uses Enhanced Crafting Table (energy-based).

3. **Display (auto from core rules):**
   - Currency cost (market price; used to determine crafting costs)
   - Material cost = currency × craftingCostMultiplier (75%)
   - DS (difficulty score)
   - Number of checks (required successes)
   - Total days (or hours for Common)
   - Each roll input = one time increment (5 days, 8 hours, etc.) — labeled clearly

4. **Roll sessions (skill encounter style):**
   - Each session = one time increment; styled like skill encounter combatants (abbreviated/simplified body).
   - **Effective DS** = base DS (from table) + DS modifier. All rolls are compared to effective DS.
   - **Net successes** = sum(session successCount) + additionalSuccesses − sum(session failureCount) − additionalFailures.
   - Each session has: roll input, success/failure count it contributes (from `computeSkillRollResult(roll, effectiveDS)`).
   - **Incremental entry** — User can enter rolls over multiple visits; don't need all at once.
   - Reuse `computeSkillRollResult(roll, ds)`; display CheckCircle2/XCircle, successCount/failureCount per session.

5. **Craft sub-skill:**
   - Select before/during rolling.
   - `craft_success_desc` / `craft_failure_desc` displayed during process and in outcome.

6. **After all sessions have values:**
   - Net successes → delta → lookup Successes table.
   - **Auto-calculate and display:** final material cost spent, materials retained (if any), final item market price (worth %), extra items (if delta 7+).
   - Outcome text from Successes table + sub-skill flavor.

### 3.3 State Model (Crafting Session)

```ts
interface CraftingSession {
  id?: string;
  status: 'planned' | 'in_progress' | 'completed';
  itemId?: string;
  itemSource: 'library' | 'codex' | 'public' | 'custom';
  itemName: string;
  currencyCost: number;           // market price; custom if custom item
  isConsumable: boolean;
  isBulk: boolean;                // 3 cost → 4 items
  isEnhanced: boolean;
  craftSubSkillId: string;
  craftSubSkillName: string;
  // From rules lookup
  rarity: string;
  difficultyScore: number;        // base from table
  dsModifier: number;             // added to base DS (e.g. +2 finer tools, -1 help)
  requiredSuccesses: number;
  totalTimeValue: number;
  totalTimeUnit: 'hours' | 'days';
  materialCost: number;
  additionalSuccesses: number;    // manual (like skill encounters)
  additionalFailures: number;     // manual
  // Roll sessions (one per time increment)
  sessions: {
    periodLabel: string;          // e.g. "Days 1-5", "Hours 1-8"
    rollValue?: number;
    successCount: number;
    failureCount: number;
  }[];
  netSuccesses: number;
  delta: number;
  // Outcome (calculated when complete)
  outcomeEffect?: string;
  finalItemWorthPercent?: number;
  materialsRetainedPercent?: number;
  extraItemCount?: number;
  choiceExtraOrEnhance?: boolean;
}
```

### 3.4 Enhanced Crafting Additions

When `isEnhanced`:

- **Power selection** — From user or official power library. Energy cost drives Enhanced Crafting Table lookup.
- **Custom base item** — If not in codex: custom name (e.g. "Ring"), custom currency cost for base; enhanced cost from energy × currency per energy.
- **Potency** — Toggle: use creator's potency at crafting time, OR manual input. Single-use: potency ≤ 25.
- **Multiple use** — Full/Partial recovery table → adjusted energy % (100%, 125%, … 300% for Permanent/Passive).
- **Upgrade potency** — Separate flow: 25% original time + cost, 25% original successes, same DS.
- **Enhanced market price** — crafting cost × 125%, capped by rarity bracket max.
- **Single-use enhanced** — Consumable Enhanced Crafting Table; duration ≤ 1 day; bulk option (3→4).

### 3.5 UI Components

| Section | Component / Pattern |
|--------|---------------------|
| Item selection | Modal (fullScreenOnMobile); SearchInput, GridListRow; "Custom" option for enhanced |
| Toggles | Checkbox/toggle: Consumable, Bulk, Enhanced |
| Requirements | Card: currency cost, material cost, base DS, **DS modifier** (input), **effective DS**, checks, days, time increments |
| Additional success/failure | Buttons or ValueStepper: "+ Success", "− Success", "+ Failure", "− Failure" (same pattern as SkillEncounterView) |
| Roll sessions | List of session cards (abbreviated SkillEncounterView participant style): period label, roll input, success/failure badge |
| Sub-skill | Select + persistent display of craft_success_desc / craft_failure_desc |
| Outcome | Auto-calculated: material cost, retained %, item worth %, extra items; effect text |

### 3.6 Reuse from Skill Encounter

- `computeSkillRollResult(roll, effectiveDS)`, CheckCircle2/XCircle, successCount/failureCount styling.
- **DS modifier** and **additional successes/failures** — same pattern as SkillEncounterView (ValueStepper or +/- buttons for additional success/failure; DS can be displayed as base + modifier, rolls use effective DS).
- Session cards ≈ participant cards (simplified).

---

## Part 4: Enhanced Equipment Library

### 4.1 Purpose

- New library type for **enhanced equipment** (items with powers imbued).
- Official and personal (user) libraries, like powers/techniques/armaments.

### 4.2 Data Model

- **Table:** `user_enhanced_items` (or extend `user_items` with `is_enhanced` + power payload).
- **Schema:** Base item (armament/equipment ref or custom), power (ref to user/official power), description, uses (Full/Partial recovery, count), potency, custom name.

### 4.3 Library Page

- **Route:** `(main)/library` — add "Enhanced" tab alongside Powers, Techniques, Armaments, Creatures.
- **Display:** Base item name, power name, potency, uses; expandable for full description.
- **Save from crafting:** When user completes enhanced crafting, option to "Save to Library" → creates enhanced equipment entry.

### 4.4 Custom Base Items

- For enhanced crafting, user can create custom base (e.g. "Ring", "Amulet") with custom currency cost.
- Stored with enhanced item when saved; no separate codex entry required.

---

## Part 5: Utility Functions

### 5.1 `src/lib/game/crafting-utils.ts`

```ts
export function getCraftingRequirements(
  currencyCost: number,
  isConsumable: boolean,
  rules: CraftingRules
): {
  rarity: string;
  difficultyScore: number;
  requiredSuccesses: number;
  materialCost: number;
  timeValue: number;
  timeUnit: 'hours' | 'days';
  rollsPerPeriod: number;  // e.g. 1 roll per 5 days
} | null;

export function getSuccessesTableEffect(
  delta: number,
  table: SuccessesTableRow[]
): { failureEffect?: string; successEffect?: string } | null;

/** Auto-calculate final material cost, retained materials, item worth, extra items from delta + successes table */
export function calculateCraftingOutcome(
  delta: number,
  materialCost: number,
  marketPrice: number,
  table: SuccessesTableRow[]
): {
  finalMaterialCost: number;
  materialsRetained: number;
  itemWorth: number;
  extraItemCount?: number;
  choiceExtraOrEnhance?: boolean;
  effectText: string;
};

export function getEnhancedCraftingRequirements(
  energyCost: number,
  rules: CraftingRules
): { ... } | null;
```

### 5.2 Lookup Logic

- **General table:** Find row where `currencyMin <= currencyCost` and (`currencyMax === null` or `currencyCost <= currencyMax`). Use first match (rows ordered by currencyMin).
- **Successes table:** Find row where `delta === Math.abs(netDelta)`; if delta > 7, use row for 8+ and append "1 extra item per success above 7".
- **Roll period (crafting.txt):** One roll at the end of each **5-day period**, or after **8 hours** for Common items. So: Common (8h total, 1 success) → 1 session; 5 days, 1 success → 1 session; 10 days, 2 successes → 2 sessions (e.g. "Days 1–5", "Days 6–10"); 20 days, 4 successes → 4 sessions (1 per 5 days).

---

## Part 6a: Rules Reference (crafting.txt)

| Topic | crafting.txt | Plan coverage |
|-------|--------------|---------------|
| Material cost | 75% of market price (line 103) | craftingCostMultiplier 0.75 |
| Consumable time | ¼ of listed time (line 107) | consumableTimeMultiplier 0.25 |
| Roll timing | End of each 5-day period, or 8 hours for Common (lines 108, 119) | Sessions per time increment; Common = 1 roll/8h |
| Successes cancel failures | Same as Skill Encounters (lines 108–109) | computeSkillRollResult; net = successes − failures |
| Successes table | Applies to general and enhanced (line 152) | successesTable; calculateCraftingOutcome |
| Sub-skill outcomes | Per Sub-Skill descriptions in Codex (line 153) | craft_success_desc / craft_failure_desc |
| Enhanced: base item | Required; can craft base first (lines 184–187) | Custom base or select from library/codex |
| Enhanced: roll spacing | "1 roll every 5 crafting days" (line 275) | Same session logic as general |
| Enhanced market price | Crafting cost × 125%, cap by rarity bracket (lines 281–282) | enhancedSellPriceMultiplier; cap via general table currencyMax |
| Bulk consumables | Time/cost for 3 items → 4 items; rolls/successes as for 3 items (lines 284–285) | Bulk: 3× material, 3× time, 3× required successes, 3× sessions |
| Upgrade potency | 25% time + cost, 25% successes, same DS (lines 166–167) | Phase 5 / TASK-295 |
| Finer tools (optional) | Rarity → crafting bonus (lines 416–424) | DS modifier can represent this |
| Group crafting (optional) | Help Dice (lines 718–720) | Additional successes/failures or future phase |

---

## Part 6: File Checklist

| File | Action |
|------|--------|
| `src/types/core-rules.ts` | Add CraftingRules, CraftingTableRow, etc.; add CRAFTING to CoreRulesMap |
| `scripts/seed-core-rules.js` | Add CRAFTING seed data |
| `data/core-rules/CRAFTING.json` | Optional: export from seed for backup |
| `src/hooks/use-game-rules.ts` | Add CRAFTING to FALLBACK_RULES |
| `src/app/(main)/admin/core-rules/page.tsx` | Add Crafting tab; add CategoryEditor case |
| `src/lib/game/crafting-utils.ts` | New: getCraftingRequirements, getSuccessesTableEffect, calculateCraftingOutcome |
| `src/app/(main)/crafting/page.tsx` | New: Crafting Hub (list) + Start Crafting |
| `src/app/(main)/crafting/new/page.tsx` or `[id]/page.tsx` | New: actual crafting flow (item, toggles, sessions, outcome) |
| `src/components/crafting/` | **Not created:** Item selection is on `/crafting/new` (page, not modal); hub uses HubListRow; roll sessions and outcome are inline on `[id]` page. Optional future: extract CraftingRollSessions, CraftingOutcome if desired. |
| `src/app/(main)/library/page.tsx` | Add Enhanced tab; enhanced equipment list |
| `SUPABASE_SCHEMA.md` | Document crafting_sessions, user_enhanced_items (or schema choice) |
| `src/docs/ai/AGENT_GUIDE.md` | Add crafting routes; add crafting-utils to Key Files |

---

## Part 7: Phased Rollout

**Phase 1 — Core rules & admin:**
- Types, seed, useGameRules, admin tab, CategoryEditor for CRAFTING.
- Successes table includes calculation fields for auto-cost/price.

**Phase 2 — Crafting Hub + General crafting page:**
- Crafting Hub (list: completed, planned, in progress); "Start Crafting".
- Crafting page: item selection, Consumable/Bulk toggles, sessions (incremental rolls), outcome with auto-calculated costs.
- Persistence: crafting_sessions table.
- Sub-skill selection + craft_success_desc / craft_failure_desc.

**Phase 3 — Enhanced crafting:**
- Enhanced toggle; power selection; Enhanced Crafting Table; Multiple Use table.
- Custom base item (name + cost).
- Potency: manual or creator's.
- Consumable Enhanced table for single-use.
- Enhanced market price (×125%, capped by rarity).

**Phase 4 — Enhanced Equipment Library:**
- user_enhanced_items (or extended user_items).
- Library Enhanced tab; save from crafting page.

**Phase 5 — Upgrade potency (optional):**
- 25% time + cost, 25% successes, same DS.

---

## Part 8: Mobile & Accessibility

- **Modals:** `fullScreenOnMobile` on item selection modal.
- **Touch targets:** Roll inputs, buttons ≥44px.
- **Labels:** All inputs have `aria-label` or `<label htmlFor>`.
- **Headings:** h1 (page) → h2 (sections) → h3 (subsections).

---

## Part 9: Craft Sub-Skill Filtering

Codex skills: filter where `base_skill` equals the Craft skill ID (e.g. `"13"` or name `"Craft"`). Sub-skills are skills whose `base_skill` points to Craft. Use `useCodexSkills()` and filter client-side, or add a codex query for "craft sub-skills" if needed.

**Implemented:** `/crafting/new` filters craft sub-skills by `base_skill_id === 13` (Craft base skill id); skills with `craft_success_desc` or `craft_failure_desc` are shown. If no skills have `base_skill_id === 13`, fallback to any skill with craft descriptions so the dropdown still works.

---

## Summary

| Deliverable | Description |
|-------------|-------------|
| **CRAFTING core rules** | New category in core_rules with tables, multipliers, calculation fields |
| **Admin Crafting tab** | Editable crafting tables and constants |
| **Crafting Hub** | Encounter-like list (completed, planned, in progress); "Start Crafting" |
| **Crafting page** | Item selection, Consumable/Bulk/Enhanced toggles, incremental roll sessions, auto-calculated outcome |
| **crafting-utils** | getCraftingRequirements, getSuccessesTableEffect, calculateCraftingOutcome |
| **Craft sub-skill** | Selection + craft_success_desc / craft_failure_desc during process |
| **Enhanced crafting** | Power selection, custom base item, potency, Multiple Use table, Consumable Enhanced table |
| **Enhanced Equipment Library** | New library type; save enhanced items from crafting |

---

## Part 10: Implementation Readiness

All feedback from this session and the crafting page is encompassed:

- **Core rules in DB** — CRAFTING category, all tables and multipliers (TASK-293).
- **Admin Crafting tab** — Edit tables and constants.
- **Crafting under RM Tools** — Navbar updated (header.tsx).
- **Crafting Hub** — Encounter-like list; Start Crafting (TASK-294).
- **Crafting page** — Item selection (library/codex/public/custom), Consumable/Bulk/Enhanced toggles, **DS modifier**, **additional successes/failures**, incremental roll sessions, effective DS, net successes, outcome with auto-calculated costs, sub-skill flavor.
- **Bulk** — Correct rule: 3× cost/time/successes/sessions → 4 items.
- **Enhanced** — Power, custom base, potency, Multiple Use, Consumable Enhanced table, market price cap (TASK-295).
- **Enhanced Equipment Library** — Save from crafting; Enhanced tab in Library (TASK-295).
- **crafting.txt** — Roll period (5 days / 8h Common), Successes table, enhanced worth, bulk consumables, upgrade potency referenced in plan.

**Begin implementation:** Start with **Phase 1** (core rules + admin tab), then **Phase 2** (Crafting Hub + crafting page with general + consumable + bulk; DS modifier and additional success/failure). Phase 3–5 (enhanced, library, upgrade potency) can follow.
