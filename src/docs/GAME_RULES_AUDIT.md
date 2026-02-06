# Game Rules Audit — Code vs. Core Rulebook

> **Purpose:** Identify where code, terminology, definitions, and descriptions differ from the Core Rulebook (parsed in `GAME_RULES.md`). Use this to prioritize fixes and ensure consistency.

**Reference:** `src/docs/GAME_RULES.md` (parsed from Core Rulebook)

---

## Summary

| Category | Count | Priority | Status |
|----------|-------|----------|--------|
| Terminology | 6 | Medium | TASK-064: item-creator, creature-creator, encounter-tracker done |
| Descriptions | 2 | Low | Pending |
| Schema/Data | 2 | High | TASK-064: CreatureStatBlock fixed |
| Already Addressed | 2 | — | — |

---

## 1. Terminology Mismatches

### 1.1 "Ability score" vs. "Ability"

**Rule:** Use "Abilities" not "Ability Scores" (GAME_RULES: "Display: Use 'Abilities' not 'Ability Scores'").

| Location | Current | Should Be |
|----------|---------|-----------|
| `item-creator/page.tsx` L1349 | "Require a minimum ability score to use..." | "Require a minimum Ability to use..." |
| `abilities-step.tsx` L53 | Comment: "Shared Ability Score Editor" | "Shared Ability Editor" |
| `proficiencies-tab.tsx` L49 | "archetype's key ability score value" | "archetype's key Ability value" |
| `filters/index.ts` L10 | "Filter by ability score requirements" | "Filter by Ability requirements" |
| `UI_COMPONENT_REFERENCE.md` | "View/edit ability scores" | "View/edit Abilities" |
| `point-status.tsx` L11 | "Ability Score Editor" | "Ability Editor" |

**Note:** TASK-055 addressed headings; some comments and copy remain.

### 1.2 "Reflex" vs. "Reflexes"

**Rule:** Core Rulebook uses "Reflexes" (plural) for the Defense linked to Agility.

| Location | Current | Should Be |
|----------|---------|-----------|
| `creature-creator/page.tsx` L1041 | Defense label "Reflex" | "Reflexes" |
| `creature-stat-block.tsx` L105 | Abbrev key `reflex` | Keep as internal key; display "Reflexes" or "Ref" |
| `encounter-tracker/page.tsx` L69 | Faint: "Evasion, Might, Reflex" | "Evasion, Might, Reflexes" |

**Note:** "Reflex" as a short label may be acceptable; rulebook uses "Reflexes" for the full name.

### 1.3 "Damage Modifiers" vs. rulebook terms

**Rule:** Rulebook uses "Resistance," "Vulnerability," "Immunity" — not "Damage Modifiers" as a section title.

| Location | Current | Note |
|----------|---------|------|
| `creature-creator/page.tsx` L1068 | "Damage Modifiers" (section) | Rulebook uses "Resistance," "Vulnerability," "Immunity" — "Damage Modifiers" is a reasonable umbrella; optional rename to "Resistances, Weaknesses & Immunities" |

---

## 2. Ability Descriptions (Enrichment)

**Rule:** GAME_RULES has fuller definitions. Current descriptions are shorter; enriching could improve tooltips.

| Ability | Current (ability-score-editor) | GAME_RULES |
|---------|--------------------------------|------------|
| Strength | "Physical power and melee damage" | "Lifting, breaking, throwing, climbing, stability; hit and damage with some melee weapons" |
| Vitality | "Health and endurance" | "Resilience, endurance, resistance to damage/toxins/illness; contributes to Health" |
| Agility | "Speed, reflexes, and finesse" | "Speed, reflexes; Evasion, Speed; hit and damage with finesse weapons" |
| Acuity | "Perception and ranged accuracy" | "Mental sharpness, perception, aim; hit and damage with most ranged weapons" |
| Intelligence | "Knowledge and mental power" | "Knowledge, problem-solving, memory, history, lore, language" |
| Charisma | "Social influence and presence" | "Social skills, persuasion, intimidation, presence, resolve" |

**Recommendation:** Add optional tooltips with full definitions; keep short labels for compact UI.

---

## 3. Schema / Data Mismatches

### 3.1 CreatureStatBlock — Wrong ability names (HIGH)

**Rule:** Realms uses Strength, Vitality, Agility, Acuity, Intelligence, Charisma.

`creature-stat-block.tsx` uses D&D-style ability names:

- `intellect` → should support `intelligence`
- `perception` → should support `acuity`
- `willpower` → should support `charisma` (or Resolve for defense)

**Impact:** AbilityRow `order` is `['strength', 'agility', 'vitality', 'intellect', 'charisma', 'perception', 'willpower']`. Creatures from the creator use `acuity` and `intelligence` — they are **not in the order**, so Acuity and Intelligence may not display correctly.

**Action:** Update CreatureStatBlock to use Realms ability names (acuity, intelligence, charisma) and correct display order.

### 3.2 formulas.ts / types — "ability score" in comments

**Rule:** Prefer "Ability" in user-facing text; internal comments can use "ability value" or "ability score" for clarity.

| Location | Current |
|----------|---------|
| `formulas.ts` | "ability score," "archetype ability score" in JSDoc |
| `types/abilities.ts` | "ability scores" in comments |

**Note:** Low priority; internal code comments. User-facing copy is higher priority.

---

## 4. Already Addressed

- **Radiant → Light:** TASK-027 removed "radiant" from damage types; "light" is correct.
- **Ability Scores → Abilities:** TASK-055 renamed headings; some comments/copy remain (see 1.1).
- **HP/EN Pool → Health/Energy Allocation:** TASK-055 updated label.

---

## 5. Recommendations

1. **High:** Fix CreatureStatBlock ability schema so Realms creatures (acuity, intelligence) display correctly.
2. **Medium:** Replace remaining "ability score" with "Ability" in user-facing copy (item-creator, etc.).
3. **Low:** Consider "Reflexes" for defense label; add richer ability tooltips from GAME_RULES.
4. **Reference:** When adding new UI or copy, check GAME_RULES.md for correct terminology.
