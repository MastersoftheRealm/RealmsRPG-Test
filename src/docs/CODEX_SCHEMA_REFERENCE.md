# Codex Schema Reference

> **Purpose:** Centralized reference for all codex entity schemas. Use when implementing validation, admin editors, display logic, or AI-assisted tasks. Each field includes name, type, description, valid values, and example.

**Related:** `GAME_RULES.md` (terminology, formulas), `prisma/schema.prisma` (table structure), `Codex csv/` (CSV sources).

---

## Feats (codex_feats)

| Field | Type | Description | Use | Valid Values | Example |
|-------|------|-------------|-----|--------------|---------|
| `name` | string | Feat name | Display name in Codex, creators, and character sheet lists; key label for selection and sorting. | Non-empty | "Skilled Actor" |
| `description` | string | Full feat description | Main rules text shown in Codex, character sheet, and tooltips. | | "When acting in a way that would require..." |
| `req_desc` | string | Human-readable requirement description | Explanatory text for prerequisites; shown alongside requirements so RMs/players can see why a feat is gated. | | "Requires Agility 3 and Fortitude 4." |
| `ability_req` | string[] | Ability/Defense names required to gain the feat | Names of abilities/defenses that must meet or exceed the paired `abil_req_val` when taking the feat. | Strength, Vitality, Agility, Acuity, Intelligence, Charisma, Might, Fortitude, Reflexes, Discernment, Mental Fortitude, Resolve | ["Agility", "Fortitude"] |
| `abil_req_val` | number[] | Min value for each `ability_req` (paired by index) | Requirement thresholds; `abil_req_val[i]` is the minimum bonus for `ability_req[i]`. Used to validate whether a character can gain the feat. | 0+ | [3, 4] |
| `skill_req` | string[] | Skill IDs required to gain the feat | IDs of skills that are prerequisites; pairs with `skill_req_val` for required bonuses. UI resolves these IDs to names when displaying. | String IDs from `codex_skills` | ["7","42"] |
| `skill_req_val` | number[] | Min bonus for each `skill_req` (paired by index) | `skill_req_val[i]` is the minimum skill bonus required in `skill_req[i]`. Used when checking if a character qualifies. | Typically -5 to +10 | [2, 1] |
| `feat_cat_req` | string | Required feat category | You must already have at least one feat with this category to gain the feat (e.g. "Defense" feats). | Any defined feat category | "Defense" |
| `pow_abil_req` | number | Required Power Ability | Minimum Power Ability bonus required to gain the feat. | 0+ | 3 |
| `mart_abil_req` | number | Required Martial Ability | Minimum Martial Ability bonus required to gain the feat. | 0+ | 2 |
| `pow_prof_req` | number | Required Power Proficiency | Minimum Power Proficiency required to gain the feat. | 0+ | 1 |
| `mart_prof_req` | number | Required Martial Proficiency | Minimum Martial Proficiency required to gain the feat. | 0+ | 1 |
| `speed_req` | number | Required speed | Minimum character/creature speed required to gain the feat. | 0+ | 6 |
| `feat_lvl` | number | Level of the feat itself | Encodes feat tier (e.g. Bloodlust=1, Bloodlust II=2, Bloodlust III=3); 0 implies no leveled variant. Used for sorting and validation so you can’t take tiers out of order. | 0+ | 1 |
| `lvl_req` | number | Character level required | Minimum character level required to gain the feat. | 0+ | 1 |
| `uses_per_rec` | number | Uses per recovery period | Maximum number of times the feat can be used between recoveries. | 0+ | 2 |
| `rec_period` | string | Recovery period for uses | Determines when `uses_per_rec` refreshes. | "Full", "Partial" | "Partial" |
| `category` | string | Feat category (for grouping/sorting) | High-level grouping for filters and display (e.g. Combat, Utility, Defense). | Any configured category string | "Utility" |
| `ability` | string \| string[] | Associated ability/defense (for sorting/filtering) | Tags the feat to the ability/defense it most relates to; can be one or more of the 12 abilities/defenses for filtering and organization. | Same set as `ability_req` | "Charisma" or ["Charisma","Resolve"] |
| `tags` | string[] | Additional sorting/filtering tags | Free-form tags used for more granular filtering (e.g. "Reaction", "Ranged", "Movement"). | Any tag strings | ["Power", "Martial Bonus"] |
| `char_feat` | boolean | Character-feat flag | true if the feat is taken directly by characters as a character feat; false implies archetype-only feat. | true / false | true |
| `state_feat` | boolean | State-feat flag | Marks feats that are also state feats in addition to being character/archetype feats, used for state-based UI and logic. | true / false | false |

---

## Skills (codex_skills)

| Field | Type | Description | Use | Valid Values | Example |
|-------|------|-------------|-----|--------------|---------|
| `name` | string | Skill name | Display name in Codex, creators, and character sheet skill lists. | | "Acrobatics" |
| `description` | string | Core skill description | Main explanation of what the skill covers; always shown anywhere the skill appears. | | "You can tumble, balance, and perform agile movements…" |
| `ability` | string[] | Governing ability or abilities | One or more abilities that govern the skill; used for display chips and for any logic that references the governing ability. | See GAME_RULES abilities | ["Agility"] |
| `base_skill_id` | number | Base-skill relationship for sub-skills | If set, this skill is a sub-skill of the base skill with that ID; blank/undefined means this is a base skill; `0` means it can be treated as a sub-skill of any base skill. | From `codex_skills` IDs (or 0) | 1 |
| `success_desc` | string | Success outcome description | Narrative description of what happens on successes; appended after the main description and surfaced as an expandable chip in skill item cards. | | "On 1–2 successes, you keep your footing; on 3+ you can also reposition…" |
| `failure_desc` | string | Failure outcome description | Narrative description of what happens on failures; appended after the main description and surfaced as an expandable chip. | | "On failure you fall prone; on 2+ failures you also drop held items…" |
| `ds_calc` | string | Difficulty score guidance | Text guidance for RMs on how to calculate the DS for this skill (e.g. base DS, modifiers); shown as an expandable chip and used as a rules reference. | | "Base DS = 10 + ½ Party Level; +2 if surface is slick." |
| `craft_success_desc` | string | Crafting success description (Craft sub-skills only) | For Craft sub-skills (base skill Craft, id 13), describes mechanical results of each success when crafting; shown as an extra chip after the description. | | "Each success reduces crafting time by 25%…" |
| `craft_failure_desc` | string | Crafting failure description (Craft sub-skills only) | For Craft sub-skills, describes mechanical results of each failure when crafting; also surfaced as a chip. | | "Each failure increases material cost by 10% and risks flaws…" |

---

## Species (codex_species)

| Field | Type | Description | Use | Valid Values | Example |
|-------|------|-------------|-----|--------------|---------|
| `name` | string | Species name | Display name in species selection (creators) and Codex. | | "Human" |
| `description` | string | Full species description | Lore and rules text for the species; shown in Codex and species detail views. | | |
| `type` | string | Creature type | Categorizes the species (Humanoid, Fey, Undead, etc.) for rules and filters. | Humanoid, Fey, Undead, Construct, etc. | "Humanoid" |
| `sizes` | string[] | Allowed sizes | The set of sizes a character of this species may choose at creation. | See GAME_RULES Size | ["Small", "Medium"] |
| `skills` | string[] | Species skills (by ID) | Two species skills the character automatically gains proficiency in; an ID of `0` indicates a player-chosen species skill instead of a fixed one. These are permanent/unremovable proficiencies. | From `codex_skills` (IDs); may include 0 | ["7", "42"] |
| `species_traits` | string[] | Species traits (non-flaw, non-characteristic) | Trait IDs granted as core species traits. | From `codex_traits` | ["4","67"] |
| `ancestry_traits` | string[] | Ancestry traits | Trait IDs granted through ancestry options. | From `codex_traits` | |
| `flaws` | string[] | Flaw traits | Trait IDs/names whose `flaw` flag is true; usually 3 flaws per species. | From `codex_traits` where flaw=true | ["8","41","29"] |
| `characteristics` | string[] | Characteristic traits | Trait IDs whose `characteristic` flag is true; usually 3 characteristics per species. | From `codex_traits` where characteristic=true | ["90","87","25"] |
| `ave_hgt_cm` | number | Average height (cm) | Used for reference and defaulting height suggestions. | 0+ | 175 |
| `ave_wgt_kg` | number | Average weight (kg) | Used for reference and defaulting weight suggestions. | 0+ | 70 |
| `adulthood_lifespan` | number[] | Adulthood age and typical max age | `[adultAge, maxAge]` for the species; used as a lore/rules reference. | [adult, max] | [18, 100] |
| `languages` | string[] | Starting languages | List of languages the species starts with; non-numeric names only. | e.g. "Universal", "Any", setting-specific languages | ["Universal", "Any"] |

---

## Traits (codex_traits)

| Field | Type | Description | Use | Valid Values | Example |
|-------|------|-------------|-----|--------------|---------|
| `name` | string | Trait name | Display name in Codex, creators, and character sheet. | | "Absorbent" |
| `description` | string | Full trait description | Rules text for what the trait does; shown wherever the trait is displayed. | | |
| `uses_per_rec` | number | Uses per recovery | Maximum times the trait can be used between recoveries. | 0+ | 1 |
| `rec_period` | string | Recovery period | Defines whether uses refresh on Full or Partial recovery. | "Full", "Partial" | "Full" |
| `flaw` | boolean | Flaw flag | true if the trait is a flaw; used to categorize and enforce flaw selections. | true / false | false |
| `characteristic` | boolean | Characteristic flag | true if the trait is a characteristic; used for cosmetic/flavor traits and selection UIs. | true / false | true |

---

## Parts (codex_parts)

Power and Technique parts. `type` = "power" or "technique".

| Field | Type | Description | Use | Valid Values | Example |
|-------|------|-------------|-----|--------------|---------|
| `name` | string | Part name | Display name for the part in creators, Codex, and chips. | | "True Damage" |
| `description` | string | Full description | Rules text describing what the part does; shown in Codex and expanded chips. | | |
| `category` | string | Part category | Used for grouping and filtering parts (e.g. damage, action, duration). | e.g. "Damage", "Action", "Duration" | "Damage" |
| `type` | string | Part type | Distinguishes whether the part applies to powers or techniques. | "power", "technique" | "technique" |
| `base_en` | number | Base energy cost | Base EN contribution of the part before options; combined with option EN and `percentage` to compute final power/technique cost. | 0+ (may be fractional) | 1.5 |
| `base_tp` | number | Base training point cost | Base TP cost for being proficient with this part. | 0+ (integer) | 2 |
| `op_1_desc`, `op_2_desc`, `op_3_desc` | string | Option level descriptions | Text for each option level (1–3), describing the effect of taking that option level. | | "Increase damage by 2 per die." |
| `op_1_en`, `op_2_en`, `op_3_en` | number | Option energy costs | Additional EN cost per level of each option; added to `base_en` (or treated as a percentage if `percentage` is true). | 0+ | 1 |
| `op_1_tp`, `op_2_tp`, `op_3_tp` | number | Option TP costs | Additional TP cost per level of each option; added to `base_tp`. | 0+ | 1 |
| `mechanic` | boolean | Mechanic flag | true if this is a mechanic part (affecting how a power/technique functions rather than content flavor); used for filtering and UI. | true / false | false |
| `percentage` | boolean | Percentage-cost flag | When true, the EN values from this part are treated as percentage modifiers instead of flat EN (e.g. +25% cost). | true / false | true |
| `duration` | boolean | Duration-affecting flag | Marks parts that modify duration, to help creators and UI present duration-related controls correctly. | true / false | false |
| `defense` | string[] | Targeted defenses (if applicable) | Optional list of defenses this part targets (for future use in UI and rules references). | Subset of the 6 defenses | ["Reflexes","Resolve"] |

---

## Properties (codex_properties)

Item properties (armor, weapon, etc.).

| Field | Type | Description | Use | Valid Values | Example |
|-------|------|-------------|-----|--------------|---------|
| `name` | string | Property name | Display label for the property in Codex, creators, and item cards. | | "Damage Reduction" |
| `description` | string | Full description | Rules text describing the property’s effect; shown in expanded property chips. | | |
| `type` | string | Property type | Determines which armament types the property can apply to and how it is grouped in the UI. | "Armor", "Shield", "Weapon" | "Armor" |
| `base_ip` | number | Base item points | Base IP used to derive item rarity when this property is applied. | 0+ | 1.5 |
| `base_tp` | number | Base training points | Base TP cost contributing to the proficiency requirement for this property. | 0+ | 2 |
| `base_c` | number | Base currency multiplier | Multiplier applied to the item’s currency cost when this property is present. | 0+ | 3.5 |
| `op_1_desc`, etc. | string | Option descriptions | Rules text for each property option level. | | "Increase DR by 1 per option." |
| `op_1_ip`, `op_1_tp`, `op_1_c` | number | Option costs | Additional IP/TP/C per option level; added on top of base values. | 0+ | 1 |
| `mechanic` | boolean | Mechanic-only flag | When true, this property is a mechanic property that should not appear in normal “add property” lists (it is integrated into the UI logic instead). Used for things like base costs, stat requirements, and similar mechanics. | true / false | true |

---

## Equipment (codex_equipment)

| Field | Type | Description | Use | Valid Values | Example |
|-------|------|-------------|-----|--------------|---------|
| `name` | string | Equipment name | Display name for equipment in Codex, library, and creators. | | "Rations" |
| `description` | string | Full description | Rules text and flavor for the equipment item. | | |
| `category` | string | Equipment category | Used for grouping/filtering equipment (e.g. Consumable, Container, Tool). | "Consumable", "Container", "Tool", etc. | "Consumable" |
| `currency` | number | Base cost | Base currency cost of the equipment. | 0+ | 3 |
| `rarity` | string | Rarity tier | Describes how rare/powerful an item of equipment is. | Common, Uncommon, Rare, Epic, Legendary, Mythic, Ascended | "Common" |

---

## Archetypes (codex_archetypes)

| Field | Type | Description | Use | Valid Values | Example |
|-------|------|-------------|-----|--------------|---------|
| `name` | string | Archetype name | Display name for the archetype in creators, Codex, and character sheets. | | "Power" |
| `type` | string | Archetype type | Determines whether the archetype is power-focused, martial-focused, or powered-martial. | "power", "martial", "powered-martial" | "power" |
| `description` | string | Full description | Rules/lore description for the archetype. | | |

---

## Creature Feats (codex_creature_feats)

| Field | Type | Description | Use | Valid Values | Example |
|-------|------|-------------|-----|--------------|---------|
| `name` | string | Creature feat name | Display name in creature creator and Codex. | | "Uncanny Dodge" |
| `description` | string | Full description | Rules text describing the creature feat’s effect. | | |
| `feat_points` | number | Creature feat point cost | Represents how many archetype feats’ worth of power this creature feat is equivalent to; used to balance total feat points. | 0+ | 3 |
| `feat_lvl` | number | Feat level | Level of this feat relative to earlier/lower versions (Jump, Jump II, Jump III, etc.). | 0+ | 1 |
| `lvl_req` | number | Creature level required | Minimum creature level required to add/gain this feat. | 0+ | 5 |
| `mechanic` | boolean | Mechanic-only flag | true if the feat functions as a mechanic (e.g. weaknesses/resistances) and may be integrated into UI without listing as a traditional feat entry. | true / false | false |

---

## Abilities and Defenses (Reference)

For `ability_req`, `ability`, and similar fields, use these 12 options:

**6 Abilities:** Strength, Vitality, Agility, Acuity, Intelligence, Charisma  
**6 Defenses:** Might, Fortitude, Reflexes, Discernment, Mental Fortitude, Resolve

Source: `src/lib/game/constants.ts` — `ABILITIES_AND_DEFENSES`

---

## Array Field Conventions

- **ID arrays (species skills/traits and feat skill_req):** CSV stores comma-separated string IDs (e.g. `"7,42"`). Admin UI should show names via lookup but always save IDs.
- **Name arrays (ability_req, ability):** Use ability/defense names (one of the 12 canonical options) for clarity.
- **Paired arrays (ability_req + abil_req_val, skill_req + skill_req_val):** Same length; index i pairs requirement with its value.
