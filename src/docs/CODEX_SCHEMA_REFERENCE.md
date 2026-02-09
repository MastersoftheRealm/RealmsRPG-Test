# Codex Schema Reference

> **Purpose:** Centralized reference for all codex entity schemas. Use when implementing validation, admin editors, display logic, or AI-assisted tasks. Each field includes name, type, description, valid values, and example.

**Related:** `GAME_RULES.md` (terminology, formulas), `prisma/schema.prisma` (table structure), `Codex csv/` (CSV sources).

---

## Feats (codex_feats)

| Field | Type | Description | Valid Values | Example |
|-------|------|-------------|--------------|---------|
| `name` | string | Feat name | Non-empty | "Skilled Actor" |
| `description` | string | Full feat description | | "When acting in a way that would require..." |
| `req_desc` | string | Human-readable requirement description | | |
| `prereq_text` | string | Legacy prerequisite text | | |
| `ability_req` | string[] | Ability/Defense names required (6 Abilities + 6 Defenses) | Strength, Vitality, Agility, Acuity, Intelligence, Charisma, Might, Fortitude, Reflexes, Discernment, Mental Fortitude, Resolve | ["Agility", "Fortitude"] |
| `abil_req_val` | number[] | Min value for each ability_req (paired by index) | | [3, 4] |
| `skill_req` | string[] | Skill names required | From codex_skills | ["Stealth", "Acrobatics"] |
| `skill_req_val` | number[] | Min bonus for each skill_req (paired by index) | | [2, 1] |
| `feat_cat_req` | string | Feat category required (e.g. need one feat with this category) | | "Defense" |
| `pow_abil_req` | number | Min Power Ability to gain feat | | 3 |
| `mart_abil_req` | number | Min Martial Ability to gain feat | | 2 |
| `pow_prof_req` | number | Min Power Proficiency | | 1 |
| `mart_prof_req` | number | Min Martial Proficiency | | 1 |
| `speed_req` | number | Min character/creature speed | | 6 |
| `feat_lvl` | number | Level of feat (Bloodlust II=2, Bloodlust=1). 0 = no level | 0+ | 1 |
| `lvl_req` | number | Character level required | 0+ | 1 |
| `uses_per_rec` | number | Max uses before recovery | 0+ | 2 |
| `rec_period` | string | Recovery period for uses | "Full", "Partial" | "Partial" |
| `category` | string | Feat category (sorting) | | "Utility", "Combat" |
| `ability` | string \| string[] | Associated ability/defense (sorting) | Same as ability_req | "Charisma" |
| `tags` | string[] | Sorting tags | | ["Power", "Martial Bonus"] |
| `char_feat` | boolean | true = character feat, false = archetype feat | | true |
| `state_feat` | boolean | true = state feat (in addition to type) | | false |

---

## Skills (codex_skills)

| Field | Type | Description | Valid Values | Example |
|-------|------|-------------|--------------|---------|
| `name` | string | Skill name | | "Acrobatics" |
| `description` | string | Full skill description | | |
| `ability` | string | Governing ability | See GAME_RULES Abilities | "Agility" |
| `category` | string | Skill category | | |
| `base_skill_id` | number | ID of base skill (for sub-skills) | From codex_skills | 1 |
| `trained_only` | boolean | Requires training to use | | false |
| `success_desc` | string | Success outcome descriptions | | |
| `failure_desc` | string | Failure outcome descriptions | | |
| `ds_calc` | string | Difficulty score calculation | | |
| `craft_success_desc` | string | Craft success description | | |
| `craft_failure_desc` | string | Craft failure description | | |

---

## Species (codex_species)

| Field | Type | Description | Valid Values | Example |
|-------|------|-------------|--------------|---------|
| `name` | string | Species name | | "Human" |
| `description` | string | Full description | | |
| `type` | string | Creature type | Humanoid, Fey, etc. | "Humanoid" |
| `size` | string | Default size | See GAME_RULES Size | "Medium" |
| `sizes` | string[] | Allowed sizes | | ["Small", "Medium"] |
| `speed` | number | Base speed (spaces/round) | | 6 |
| `skills` | string[] | Skill IDs or names (species skills) | From codex_skills | ["7", "42"] or ["Stealth", "Acrobatics"] |
| `species_traits` | string[] | Species trait IDs/names | From codex_traits | |
| `ancestry_traits` | string[] | Ancestry trait IDs/names | From codex_traits | |
| `flaws` | string[] | Flaw trait IDs/names | From codex_traits | |
| `characteristics` | string[] | Characteristic trait IDs/names | From codex_traits | |
| `languages` | string[] | Starting languages | | ["Universal", "Any"] |
| `ave_hgt_cm` | number | Average height (cm) | | 175 |
| `ave_wgt_kg` | number | Average weight (kg) | | 70 |
| `adulthood_lifespan` | number[] | [age adult, max age] | | [18, 100] |
| `part_cont` | boolean | Part construct (e.g. Vessel) | | false |

---

## Traits (codex_traits)

| Field | Type | Description | Valid Values | Example |
|-------|------|-------------|--------------|---------|
| `name` | string | Trait name | | "Absorbent" |
| `description` | string | Full description | | |
| `uses_per_rec` | number | Uses per recovery | | |
| `rec_period` | string | Recovery period | "Full", "Partial" | |
| `flaw` | boolean | Is a flaw trait | | false |
| `characteristic` | boolean | Is a characteristic trait | | true |

---

## Parts (codex_parts)

Power and Technique parts. `type` = "Power" or "Technique".

| Field | Type | Description | Valid Values | Example |
|-------|------|-------------|--------------|---------|
| `name` | string | Part name | | "True Damage" |
| `description` | string | Full description | | |
| `category` | string | Part category | General, etc. | "General" |
| `type` | string | Part type | "Power", "Technique" | "Technique" |
| `base_en` | number | Base energy cost | | 1.5 |
| `base_tp` | number | Base training points | | 2 |
| `op_1_desc`, `op_2_desc`, `op_3_desc` | string | Option level descriptions | | |
| `op_1_en`, `op_2_en`, `op_3_en` | number | Option energy costs | | |
| `op_1_tp`, `op_2_tp`, `op_3_tp` | number | Option TP costs | | |
| `mechanic` | boolean | Is mechanic part | | false |
| `percentage` | boolean | Uses percentage | | true |
| `duration` | boolean | Affects duration | | false |
| `defense` | boolean | Defense-related | | false |

---

## Properties (codex_properties)

Item properties (armor, weapon, etc.).

| Field | Type | Description | Valid Values | Example |
|-------|------|-------------|--------------|---------|
| `name` | string | Property name | | "Damage Reduction" |
| `description` | string | Full description | | |
| `type` | string | Property type | Armor, Weapon, etc. | "Armor" |
| `base_ip` | number | Base item points | | 1.5 |
| `base_tp` | number | Base training points | | 2 |
| `base_c` | number | Base currency | | 3.5 |
| `op_1_desc`, etc. | string | Option descriptions | | |
| `op_1_ip`, `op_1_tp`, `op_1_c` | number | Option costs | | |

---

## Equipment (codex_equipment)

| Field | Type | Description | Valid Values | Example |
|-------|------|-------------|--------------|---------|
| `name` | string | Item name | | "Rations" |
| `description` | string | Full description | | |
| `category` | string | Item category | Consumable, Container, etc. | "Consumable" |
| `currency` | number | Base cost | | 3 |
| `rarity` | string | Rarity tier | Common, Uncommon, Rare, etc. | "Common" |

---

## Archetypes (codex_archetypes)

| Field | Type | Description | Valid Values | Example |
|-------|------|-------------|--------------|---------|
| `name` | string | Archetype name | | "Power" |
| `type` | string | Archetype type | "power", "martial", "powered-martial" | "power" |
| `description` | string | Full description | | |

---

## Creature Feats (codex_creature_feats)

| Field | Type | Description | Valid Values | Example |
|-------|------|-------------|--------------|---------|
| `name` | string | Feat name | | "Uncanny Dodge" |
| `description` | string | Full description | | |
| `feat_points` | number | Cost in creature feat points | | 3 |
| `feat_lvl` | number | Feat level | | 1 |
| `lvl_req` | number | Level required | | |
| `mechanic` | boolean | Is mechanical (auto-applied) | | false |

---

## Abilities and Defenses (Reference)

For `ability_req`, `ability`, and similar fields, use these 12 options:

**6 Abilities:** Strength, Vitality, Agility, Acuity, Intelligence, Charisma  
**6 Defenses:** Might, Fortitude, Reflexes, Discernment, Mental Fortitude, Resolve

Source: `src/lib/game/constants.ts` — `ABILITIES_AND_DEFENSES`

---

## Array Field Conventions

- **ID arrays (species skills, traits):** CSV may store comma-separated IDs (e.g. `"7, 42"`). Admin UI should use dropdowns of names; resolve to IDs when saving.
- **Name arrays (feat skill_req, ability_req):** Prefer names over IDs for clarity. Store as stored in codex.
- **Paired arrays (ability_req + abil_req_val, skill_req + skill_req_val):** Same length; index i pairs requirement with its value.
