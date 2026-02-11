# RealmsRPG Game Rules Reference

> **Purpose:** Centralized game rules for AI agents and engineers. Use when implementing validation, caps, display logic, helpful subtext, and calculations. Parsed from the Core Rulebook.

**Pure source of truth:** `core_rulebook_extracted.txt` (the extracted Core Rulebook)
**Code sources:** `src/lib/game/constants.ts`, `src/lib/game/formulas.ts`, `src/lib/game/progression.ts`, `src/lib/game/creator-constants.ts`

---

## Core Patterns & Unifying Rules

These patterns recur throughout the system. Understanding them makes the game easier to grasp as a whole.

### The Score Pattern

**Almost every Score = 10 + Bonus.**

| Score | Formula | Notes |
|-------|---------|-------|
| Defense Score | 10 + Defense Bonus | For Might, Fortitude, Reflexes, etc. |
| Evasion | 10 + Agility | No "Bonus" — Agility is used directly |
| Skill Score | 10 + Skill Bonus | Passive use (e.g., Stealth Score when hiding) |
| Martial Potency | 10 + Martial Bonus | Passive "attack score" for resisting effects |
| Power Potency | 10 + Power Bonus | Same for Powers |

**Rule of thumb:** Any Bonus that applies to a D20 roll can be converted to a Score by adding 10. The active party rolls; the passive party uses their Score as the target.

### The Proficiency Pattern

**Proficient:** Full Ability + full Proficiency (or Skill Value, etc.) — you get the complete Bonus.

**Unproficient:** Half the relevant Ability (round up). If the Ability is **negative**, **double** the negative instead. No Proficiency or other Bonuses apply.

Applies to: Skills, weapon attacks, armor, improvised weapons, partially proficient weapons.

### The Bonus Structure (Martial vs. Power)

Both follow the same pattern: **Relevant Ability + Proficiency = Bonus**

| Type | Bonus | Potency (Score) |
|------|-------|-----------------|
| Martial | Ability + Martial Proficiency | Bonus + 10 |
| Power | Power Ability + Power Proficiency | Bonus + 10 |

Relevant Ability varies by attack type (Strength for melee, Acuity for ranged, etc.). **Archetype Potency** = your Martial or Power Potency, whichever is higher (if you have both).

### The "Half" Pattern

Several rules use **½** or "half":

| Rule | Formula |
|------|---------|
| Companion max level | ½ Character level |
| Feat level you can acquire | Feat level ≤ ½ your level |
| Skill Encounter DS | 10 + ½ Party Level |
| Skill Encounter successes | # Characters + 1 |
| Jump beyond limit (per space) | DS 10 + 5 per space over |
| Bonding DS | 10 + (creature level × 2) |
| Carrying > ½ capacity | Movement speed halved |

### Time & Scale

| Unit | Value |
|------|-------|
| 1 round/turn | 10 seconds |
| 1 minute | 10 rounds |
| 1 space | ~1.5 m or 5 ft |
| Falling speed | 30 spaces (45 m) per round |

### Experience

| Rule | Formula |
|------|---------|
| XP to level up | Level × 4 |
| Skill Encounter XP | Party avg level × # Characters (adjusted by DS) |
| Combat XP | Sum of defeated enemy levels × 2 |
| Division | Split evenly among participating Characters |

### Negative Ability Handling

- **Negative Vitality:** Applied to Health only once at level 1, not again when leveling.
- **Negative Strength (improvised/unproficient):** Double the negative for attack/damage.
- **Negative Ability (unproficient Skill):** Double the negative instead of half.

### Obscurity & Modifiers

**Apply modifiers to the active party only** — the one making the roll. Do not apply the same modifier to both attacker and defender (e.g., -2 to attack from darkness is enough; don't also give +2 Evasion to the defender).

### Ranged Attack Penalties

| Situation | Penalty |
|-----------|---------|
| Target within 1 space | -5 to Attack Roll |
| Long range (4× normal distance) | -5 to Attack Roll |

### Conditions Don't Stack

A creature can have only **one instance** of a given Condition at a time. Leveled Conditions (Stunned 2, Slowed 3, etc.) do not combine; a new source **replaces** the old one (stronger replaces weaker). Durations do not stack.

### Common DS Values

| Situation | DS |
|-----------|-----|
| Calm water swimming | 10 |
| Fall Reflex (base) | 10 + 1 per 2 spaces fallen |
| Mount knocked prone (rider save) | 15 |
| Unwilling mount control | 10 + mount's level |
| Fast travel exhaustion | 10 (+2 per additional day) |
| Jump beyond limit (per space over) | 10 + 5 per space |

### Session Resources

| Resource | Rules |
|----------|-------|
| **Determination Die** | Start with 1; RM can award more; max 3; lost at session end |
| **Starting currency** | Typically 200 (RM discretion) |

---

## Terminology & Definitions

### Official Game Terms (Capitalize These)

These terms are used consistently across all Realms resources. Capitalize them in UI and documentation:

| Term | Definition |
|------|------------|
| **Abilities** | The six defining attributes of every Character: Strength, Vitality, Agility, Acuity, Intelligence, Charisma |
| **Character** | A player-controlled entity (use "Character" not "character" when referring to the game concept) |
| **Creature** | NPCs, monsters, companions, summoned entities |
| **Realm Master (RM)** | The game moderator who runs the adventure |
| **Encounter** | A structured challenge: Skill Encounter, Combat Encounter, or social interaction |
| **Power** | Supernatural/magical ability (spells, mana, divine favor, etc.) |
| **Technique** | Physical or martial ability (weapon attacks, unarmed prowess, etc.) |
| **Feat** | Archetype Feat or Character Feat—a discrete ability or talent |
| **Species** | Character lineage (Human, Elf, Dwarf, etc.) |
| **Archetype** | Character class/role: Power, Martial, or Powered-Martial |
| **Score** | A numerical representation used passively or reactively (Skill Score, Defense Score, Evasion) |
| **Bonus** | A number added to rolls (Skill Bonus, Attack Bonus, Defense Bonus) |
| **Penalty** | A number subtracted from rolls |
| **Overcome** | When a roll meets or exceeds a target Score, or Vice Versa |
| **Action** | Something a creature does during its turn (Basic, Quick, Free, Movement, etc.) |
| **Reaction** | Something a creature does outside its turn in response to a trigger |
| **Determination Die** | Session resource: spend to re-roll any roll and choose which result to keep |

### How We Refer to Rolls

| Phrase | Usage |
|--------|-------|
| **Skill Roll** | D20 + Skill Bonus vs. Difficulty Score or another Score |
| **Attack Roll** | D20 + Attack Bonus (Martial or Power) vs. Evasion or Defense |
| **Defense Roll** | D20 + Defense Bonus vs. Potency or Difficulty Score |
| **Ability Roll** | Generic term for Skill or Defense rolls |
| **D20 roll** | Any roll using a twenty-sided die |

### Rounding

**Round up** whenever you get a fraction or decimal from division. Complete all calculations first, then round up only at the end.

---

## Abilities

Every Character, creature, and monster has six Abilities:

| Ability | Governs |
|---------|---------|
| **Strength (STR)** | Lifting, breaking, throwing, climbing, stability; hit and damage with some melee weapons |
| **Vitality (VIT)** | Resilience, endurance, resistance to damage/toxins/illness; contributes to Health |
| **Agility (AGI)** | Speed, reflexes; Evasion, Speed; hit and damage with finesse weapons |
| **Acuity (ACU)** | Mental sharpness, perception, aim; hit and damage with most ranged weapons |
| **Intelligence (INT)** | Knowledge, problem-solving, memory, history, lore, language |
| **Charisma (CHA)** | Social skills, persuasion, intimidation, presence, resolve |

### Ability Ranges

| Rule | Value | Notes |
|------|-------|------|
| Typical range | -3 to 5 | Default for player Characters |
| Absolute min | -5 | Never below |
| Hard cap (characters) | 10 | Absolute maximum for player Characters |
| Hard cap (creatures) | 20 | Absolute maximum for creatures |
| Max at creation | 3 | From point allocation alone |
| Level cap | None | No level-based ability cap; cost increase provides soft cap |

### Ability Point Allocation (Creation)

| Method | Rules |
|--------|-------|
| **Custom** | Total = 7 after adjustments; no Ability > +3 from allocation; no Ability < -2; total negative adjustments ≤ -3 |
| **Standard Array** | Basic: 3, 2, 2, 1, 0, -1. Skewed: 3, 3, 2, 2, -1, -2. Even: 2, 2, 1, 1, 1, 0 |
| **Randomized** | Roll 1d8 − 4 seven times, remove lowest; sum must be 6–8 |

### Ability Increase Cost

| Current Value | Cost to Increase |
|---------------|------------------|
| 0 → 1, 1 → 2, 2 → 3, 3 → 4 | 1 point |
| 4 → 5, 5 → 6, 6 → 7, etc. | 2 points per +1 |

**Soft cap:** The doubled cost starting at 4+ serves as the auto-balancing soft cap. No hard level-based ability cap exists.

**Display:** Use "Abilities" not "Ability Scores". For values 4+, show "Next: 2 Points".

---

## Defenses

Each Ability has a corresponding Defense used to withstand harmful effects or break free from ongoing effects:

| Defense | Ability | Resists |
|---------|---------|---------|
| **Might** | Strength | Being moved, grappled, restrained; maintaining grip |
| **Fortitude** | Vitality | Poisons, environmental effects, diseases |
| **Reflexes** | Agility | Hazards, being toppled, escaping danger |
| **Discernment** | Acuity | Illusions, incoming attacks, trickery, disguises |
| **Mental Fortitude** | Intelligence | Mind-altering effects, mind-reading, cognitive manipulation |
| **Resolve** | Charisma | Charm, temptations, fear, intimidation, possession |

### Defense Formulas

| Formula | Definition |
|---------|------------|
| **Defense Bonus** | Ability + Skill Point increases (up to level from Skill Points) |
| **Defense Score** | 10 + Defense Bonus |
| **Evasion (EV)** | 10 + Agility (passive only; not a "Defense"; cannot be increased with Skill Points) |

**Evasion** is the default target for attacks. Feats/Powers that reference "Defenses" do **not** include Evasion.

---

## Helping & Help Die

When assisting another creature with a Skill Roll (with proficiency and logical context):

- **Help Die:** Die size = Skill Bonus rounded **up** to nearest **even** number (2, 4, 6, 8, 10, 12).
  - +1 → 1d2, +2 → 1d2, +3–4 → 1d4, +5–6 → 1d6, +7–8 → 1d8, +9–10 → 1d10, +11+ → 1d12
  - Max die type: 1d12
- Add the result to the assisted creature's Skill roll total.
- Multiple creatures may assist; each rolls their Help Die.

---

## Obscurity

Obscurity affects Stealth, Hide, and attack rolls. **Apply to the active party (the one rolling), not both.**

| Level | Modifier | Description |
|-------|----------|--------------|
| Completely Obscured | ±4 | Entirely out of sight |
| Heavily Obscured | ±3 | Almost entirely hidden |
| Moderately Obscured | ±2 | ~Half body hidden |
| Lightly Obscured | ±1 | Minor concealment |

**Attack penalty:** -1 per Obscurity level against obscured targets. Completely obscured = typically untargetable.

---

## Skills

### Skill Structure

- **Base Skills** — Do not build on another Skill (e.g., Sleight of Hand, Medicine)
- **Sub-Skills** — Derive from a Base Skill (e.g., Lockpicking under Sleight of Hand)
- Proficiency in a Sub-Skill requires proficiency in its Base Skill first

### Skill Bonus Formulas

| Situation | Formula |
|-----------|---------|
| **Base Skill (Proficient)** | Relevant Ability + Skill Value = Skill Bonus |
| **Sub-Skill (Proficient)** | Relevant Ability + Base Skill Value + Sub-Skill Value = Sub-Skill Bonus |
| **Unproficient Skill** | ½ Relevant Ability (or ×2 if negative) = Unproficient Skill Bonus |
| **Unproficient Sub-Skill** | Relevant Ability + Base Skill Value = Sub-Skill Bonus |

**Skill Value** = Skill Points allocated after gaining proficiency. Sub-Skill Value includes the point spent to gain proficiency.

### Skill Roll Formula

```
D20 + Skill Bonus = Total
```

### Skill Points & Limits

| Rule | Value | Notes |
|------|-------|------|
| Max skill value per skill | 3 | Skill Value Cap |
| Skill points per level (characters) | 3 | e.g. 3 at level 1, 6 at level 2 |
| Skill points at level 1 (creatures) | 5 | No species skills |
| Skill points per level (creatures) | 3 | e.g. 5 at level 1, 8 at level 2 |
| Species skills | 2 permanent | Always proficient, cannot remove; proficiency free |
| Gain proficiency (base skill) | 1 Skill Point | |
| Gain proficiency (sub-skill) | 1 Skill Point | Also grants +1 skill value |
| Increase skill value | 1:1 | 1 pt per +1 up to cap of 3 |
| Increase past cap (base skill) | 3 Skill Points | Per +1 above 3 |
| Increase past cap (sub-skill) | 2 Skill Points | Per +1 above 3 |
| Increase Defense Bonus | 2 Skill Points | +1 to a Defense; total defense bonus cannot exceed level |

**Defense bonus cap:** Defense bonuses from **skill point allocation** cannot exceed character level. Ability-derived defense bonus is unrestricted.

---

## Dice & Rolls

### Dice Notation

- **XdY** — X = number of dice, Y = die size (e.g., 3d8 = three eight-sided dice)
- **1d2** — Coin flip or even die: odd = 1, even = 2
- **D100** — Percentile: two d10s (one tens, one ones); 00 + 0 = 100

### Dice Conversion (Increasing Die Sizes)

Two of the same die → next size: 1d6+1d6=1d12, 1d8+1d2=1d10. Beyond 1d12 splits (e.g., 1d12+1d4=2d8).

### D20 Roll Formula

```
D20 + Bonuses + Penalties = Outcome
```

Compare to target Score. If total ≥ Score, you Overcome it.

### Special Roll Results

| Roll | Effect |
|------|--------|
| **Natural 20** | +2 bonus to the roll |
| **Natural 1** | -2 penalty to the roll |

### Successes & Failures

- **Success:** Roll meets or exceeds target Score (+ every 5 above = +1 Success)
- **Failure:** Roll falls short (+ every 5 below = +1 Failure)
- **Partial Success:** Exceeds Score by exactly 1 — success with small negative consequence
- **Partial Failure:** Falls short by exactly 1 — failure with small positive consequence
- **Critical Success:** 3+ Successes (+10 or more above target)
- **Critical Failure:** 3+ Failures (-10 or more below target)

---

## Scores & Difficulty

### Score Formula

```
10 + Bonus = Score
```

Any Bonus can be converted to a Score by adding 10.

**To Roll, or Not to Roll:** The individual in the **active** position makes the roll. Attackers roll against Evasion (a Score); the creature avoiding a trap rolls against a DS. When the environment acts on a creature (e.g., floor collapses), the creature rolls.

### Difficulty Score (DS) Table

| DS Range | Challenge |
|----------|-----------|
| 0–4 | Trivial |
| 5–9 | Easy |
| 10–14 | Moderate |
| 15–19 | Difficult |
| 20–24 | Formidable |
| 25–29 | Strenuous |
| 30–34 | Overwhelming |
| 35–40 | Insurmountable |

### Skill Encounter Difficulty

- **Average DS:** 10 + ½ Party Level
- **Required Successes:** Number of participating Characters + 1
- **Power/Technique bonus:** +1 per 5 Energy cost when using a resource to aid (see Rarity/Energy table in rulebook)

---

## Level Progression (Player)

| Resource | Level 1 | Per Level |
|----------|---------|-----------|
| Ability points | 7 | +1 every 3 levels (3, 6, 9...) |
| Skill points | 3 | +3 |
| HP/EN pool | 18 | +12 |
| Proficiency | 2 | +1 every 5 levels |
| Training points | 22 + ability + (2 + ability) × (level − 1) | `calculateTrainingPoints` |
| Character feats | 1 per level | Always = level, all archetypes |
| Archetype feats (base) | 1 per level | = level; martial gets bonus (see Archetype Progression) |

### Health & Energy Allocation

- **Base health:** 8 + Vitality (or Strength if Vitality is archetype ability)
- **Base energy:** Archetype ability score
- **Pool at level 1:** 18 points to divide between HP and EN
- **Per level:** +12 to pool; add Vitality to Health, highest Archetype Ability to Energy

---

## Level Progression (Creature)

| Resource | Level 1 | Per Level |
|----------|---------|-----------|
| Ability points | 7 | +1 every 3 levels |
| Skill points | 5 | +3 |
| HP/EN pool | 26 | +12 |
| Proficiency | 2 | +1 every 5 levels |
| Training points | 22 + ability + (2 + ability) × (level − 1) | Same formula as characters |
| Currency | 200 × 1.45^(level−1) | `calculateCreatureCurrency` |

---

## Archetype Rules

### Archetype Progression (Level 1)

| Archetype | Martial Prof | Power Prof | Innate Threshold | Innate Pools | Innate Energy | Armament Prof |
|-----------|--------------|------------|------------------|--------------|---------------|---------------|
| Power | 0 | 2 | 8 | 2 | 16 | 3 |
| Martial | 2 | 0 | — | — | — | 12 |
| Powered-Martial | 1 | 1 | 6 | 1 | 6 | 8 |

### Character Feats

**Always 1 per level, regardless of archetype.** Total character feats = level.

### Archetype Feats

**Base:** 1 per level (all archetypes).
**Martial bonus:** +2 at level 1, then +1 every 3 levels starting at 4.
- Formula (martial total): level + 2 + floor((level − 1) / 3)
- Power characters: total archetype feats = level (no martial bonus)
- Powered-Martial: at milestones (every 3 levels starting at 4), choose Additional Feat OR Increase Innate Power

### Power Character Progression

| Level | Innate Threshold | Innate Energy | Innate Pools | Power Prof |
|-------|-----------------|---------------|--------------|------------|
| 1 | 8 | 16 | 2 | 2 |
| 2 | 8 | 16 | 2 | 2 |
| 3 | 8 | 16 | 2 | 2 |
| 4 | 9 | 27 | 3 | 2 |
| 5 | 9 | 27 | 3 | 3 |
| 6 | 9 | 27 | 3 | 3 |
| 7 | 10 | 40 | 4 | 3 |
| 8 | 10 | 40 | 4 | 3 |
| 9 | 10 | 40 | 4 | 3 |
| 10 | 11 | 55 | 5 | 4 |
| 11 | 11 | 55 | 5 | 4 |
| 12 | 11 | 55 | 5 | 4 |
| 13 | 12 | 72 | 6 | 4 |
| 14 | 12 | 72 | 6 | 4 |
| 15 | 12 | 72 | 6 | 5 |
| 16 | 13 | 91 | 7 | 5 |
| 17 | 13 | 91 | 7 | 5 |
| 18 | 13 | 91 | 7 | 5 |
| 19 | 14 | 112 | 8 | 5 |
| 20 | 14 | 112 | 8 | 6 |

**Innate Threshold:** Max energy cost for a power to be Innate. Increases by +1 every 3 levels starting at 4.
**Innate Energy:** Innate Pools × Innate Threshold. Total combined energy of all innate powers.
**Innate Pools:** Number of innate powers (if each uses max threshold). +1 every 3 levels starting at 4.

### Martial Character Progression

| Level | Bonus Archetype Feats | Total Archetype Feats | Armament Prof | Martial Prof |
|-------|----------------------|----------------------|---------------|--------------|
| 1 | +2 | 3 | 12 | 2 |
| 2 | — | 4 | 12 | 2 |
| 3 | — | 5 | 12 | 2 |
| 4 | +1 | 7 | 12 | 2 |
| 5 | — | 8 | 15 | 3 |
| 6 | — | 9 | 15 | 3 |
| 7 | +1 | 11 | 15 | 3 |
| 8 | — | 12 | 15 | 3 |
| 9 | — | 13 | 15 | 3 |
| 10 | +1 | 15 | 18 | 4 |
| 11 | — | 16 | 18 | 4 |
| 12 | — | 17 | 18 | 4 |
| 13 | +1 | 19 | 18 | 4 |
| 14 | — | 20 | 18 | 4 |
| 15 | — | 21 | 21 | 5 |
| 16 | +1 | 23 | 21 | 5 |
| 17 | — | 24 | 21 | 5 |
| 18 | — | 25 | 21 | 5 |
| 19 | +1 | 27 | 21 | 5 |
| 20 | — | 28 | 24 | 6 |

### Powered-Martial Character Progression

**Becoming Powered-Martial:** When you increase an Archetype Proficiency from 0 to 1:
- **Power Prof gained:** Innate Threshold=6, Innate Energy=6, 1 Innate Pool
- **Martial Prof gained:** +1 Archetype Feat, Armament Prof Max=8

| Level | Innate Power or Feat | Archetype Prof Increase |
|-------|---------------------|------------------------|
| 1–3 | — | — |
| 4 | +1 | — |
| 5 | — | +1 |
| 6 | — | — |
| 7 | +1 | — |
| 8–9 | — | — |
| 10 | +1 | +1 |
| 11–12 | — | — |
| 13 | +1 | — |
| 14 | — | — |
| 15 | — | +1 |
| 16 | +1 | — |
| 17–18 | — | — |
| 19 | +1 | — |
| 20 | — | +1 |

**Increase Innate Power:** +1 Innate Pool; Threshold 6→8 or +1 if already 8+. Innate Energy = Threshold × Pools.
**Additional Feat:** Gain 1 Archetype or Character feat.
**Every 5th level:** +1 to either Martial or Power Proficiency.

### Armament Proficiency by Martial Proficiency

| Martial Prof | Armament Prof Max |
|--------------|-------------------|
| 0 | 3 |
| 1 | 8 |
| 2 | 12 |
| 3 | 15 |
| 4 | 18 |
| 5 | 21 |
| 6 | 24 |

---

## Damage Types

There is no "physical vs magic" split. All damage types are equal categories. The only distinction is which types are reduced by armor.

### All Damage Types

Magic, Fire, Ice, Lightning, Spiritual, Sonic, Poison, Necrotic, Acid, Psychic, Light, Bludgeoning, Piercing, Slashing

### Armor Exceptions

Standard armor **does not reduce** Psychic, Spiritual, or Sonic damage. All other damage types ARE reduced by armor. Specialized armor may override this.

### Levels by Rarity (Reference)

Helpful reference for what rarity of items/feats/powers a character should have at a given level:

| Rarity | Character Levels |
|--------|-----------------|
| Common | 1–4 |
| Uncommon | 5–9 |
| Rare | 10–14 |
| Epic | 15–19 |
| Legendary | 20–24 |
| Mythic | 25–29 |
| Ascended | 30+ |

### Energy Below Zero

If Energy (EN) drops below 0, take 1 damage per point below 0 (e.g., -3 EN = 3 damage). Energy cannot fall below 0; you cannot cause your own EN to go negative.

### Healing

When healed, regain HP up to maximum. **Healing from a Power** adds the healer's Power Bonus to the amount healed. **Overheal** can exceed max HP temporarily until damage or recovery.

### Damage Modifiers

| Modifier | Effect |
|----------|--------|
| **Resistance** | Half damage (round up); multiple sources = Immunity |
| **Vulnerability** | Double damage |
| **Immunity** | No damage |
| **Resistance + Vulnerability** | Cancel out |

### Damage Reduction

- Applies to total damage in one instance, not per damage type
- Minimum damage after reduction: 1 (unless Immunity)
- Armor effectiveness decreases by 1 per hit in a turn until next turn

---

## Recovery

**Requirements:** Adequate nutrition/hydration, reasonably temperate conditions, bedding if necessary. Characters must doff armor to sleep.

**Resources restored:** Health, Energy, and some Feat Uses.

| Type | Duration | Effect |
|------|----------|--------|
| **Partial** | 2, 4, or 6 hours | Each 2 hours: regain ¼ of both max Energy and Health, OR ½ of one (Health or Energy). Some temporary effects wear off. |
| **Full** | 8–10 hours | Fully restore Energy and Health, remove most temporary effects. Feat uses (Full) restored. Can do light activities (investigate, repair, practice, keep watch) as long as 8+ hours of downtime including sleep. |

**Partial recovery interruption:** If interrupted, you lose benefits of the interrupted block. For 4+ hour recoveries, you keep completed 2-hour blocks if you resume within 10 minutes of interruption.

**Rounding:** Round up for fractions (e.g., 9 max HP ÷ 4 = 3 HP per quarter).

**Feat uses:** Partial recovery resets "Partial" only; "Full" requires full recovery.

**Without Full Recovery:** If 24 hours pass without full recovery, max HP and EN reduce by ¼ each (accumulates, min 1 each HP and EN).

---

## Combat Basics

### Action Points (AP)

- **Per round:** 4 AP at start and end of turn
- **0 AP actions:** 1 free Interaction + 1 free Ability Roll per round

### Action Costs

| Action | AP |
|--------|-----|
| Basic (attack, Power, Technique) | 2 |
| Quick (attack, Power, Technique) | 1 |
| Free (attack, Power, Technique) | 0 (each additional = 1) |
| Movement | 1 |
| Interaction | 1 |
| Ability Roll | 1 |
| Skill Encounter Action | 2 |
| Evade | 1 |
| Brace | 1 |
| Focus | 1 |
| Search | 1 |
| Overcome | 1 (or 0 at end of turn) |

### Multiple Action Penalty

Using the same Action/Reaction more than once in a turn: -5 per subsequent use (stacks: -5, -10, -15...).

### Attack Formulas

| Type | Formula |
|------|---------|
| **Weapon Attack Roll** | D20 + Martial Bonus |
| **Martial Bonus** | Relevant Ability + Martial Proficiency |
| **Martial Potency** | Martial Bonus + 10 |
| **Power Attack Roll** | D20 + Power Bonus |
| **Power Bonus** | Power Ability + Power Proficiency |
| **Power Potency** | Power Bonus + 10 |

### Relevant Abilities by Attack Type

| Attack Type | Ability |
|-------------|---------|
| Melee Weapon | Strength |
| Ranged Weapon | Acuity |
| Unarmed Prowess | Strength or Agility (if proficient) |
| Finesse Weapon | Agility |
| Thrown Weapon | Strength |

### Critical Hits

- **Standard Critical Range:** +10 over Defense/Evasion
- **Effect:** Double damage dice (2× multiplier)
- **Coup de Grâce:** Unconscious/asleep target within 1 space = auto hit + critical

---

## Movement

| Rule | Formula |
|------|---------|
| **Speed** | 6 + ½ Agility (spaces per round) |
| **Jump horizontal** | Strength or Agility (spaces) |
| **Jump vertical** | ½ Strength or ½ Agility (spaces) |
| **Climb speed** | ½ Strength (without Climb Speed) |
| **Swim speed** | ½ Agility or ½ Vitality |
| **Falling speed** | 30 spaces (45 m) per round |
| **Fall damage** | 1d4 bludgeoning per 200 kg per 2 spaces (max 800 kg → 4d4 per 2 spaces) |

**Difficult terrain:** Costs double movement. Moving through another creature's space = difficult terrain.

---

## Size & Carrying Capacity

| Size | Height | Spaces | Carrying Capacity | Min Carry |
|------|--------|--------|-------------------|-----------|
| Miniscule | Under 1 ft | 1/8 | 10 + 5×STR kg | 5 kg |
| Tiny | 1–2 ft | 1/4 | 25 + 10×STR kg | 10 kg |
| Small | 2–4 ft | 1 | 50 + 25×STR kg | 25 kg |
| Medium | 5–7 ft | 1 | 100 + 50×STR kg | 50 kg |
| Large | 7–10 ft | 1–2 | 200 + 100×STR kg | 100 kg |
| Huge | 10–15 ft | 4 | 400 + 200×STR kg | 200 kg |
| Humongous | 15–25 ft | 9 | 800 + 400×STR kg | 400 kg |
| Gargantuan | 25+ ft | 16+ | 1600 + 800×STR kg | 800 kg |

Carrying > ½ capacity halves movement speed.

---

## Conditions

Conditions are temporary effects. Leveled conditions have proportional effects. Conditions don't stack — stronger replaces weaker.

**Leveled Conditions:** Most conditions followed by a number (e.g., "Stunned 2"). If a condition exceeds the value it reduces (e.g., Stunned 5 vs 4 AP), it reduces to a minimum of 1.

### Standard Conditions

| Condition | Effect |
|-----------|--------|
| **Blinded** | All targets Completely Obscured to blinded creature relying on basic vision. Sight-based Acuity rolls auto-fail. |
| **Charmed** | Can't attack or perform harmful Actions against charmer. Charmer's Charisma rolls and potencies gain +2. |
| **Restrained** | Cannot take Actions or Reactions requiring arms. RM may allow limited-mobility arm actions. |
| **Dazed** | Cannot take Reactions. |
| **Deafened** | Cannot hear. Resistance to Sonic damage. Hearing-based Acuity rolls auto-fail. |
| **Dying** | HP at 0 or negative. Prone, 1 AP/turn. Take 1d4 irreducible damage at start of turn, doubling each turn (1d4, 1d8, 2d8, 4d8...). AP reduced to 1 on entry. |
| **Faint** | -1 to Evasion, Might, Reflex, and all D20 rolls requiring balance/poise. Outside forces gain +1 to D20 rolls and potency to make you prone, knock back, or grapple. |
| **Grappled** | -2 to Attack rolls, +2 to be hit, cannot move away from grappler, cannot take Movement Actions. |
| **Hidden** | +2 bonus on Attack rolls vs unaware creatures (plus Obscurity bonus). Location unknown until Perceive/Search roll vs Stealth/Hide Score. |
| **Immobile** | Cannot take Movement Actions, Speed = 0. Speed cannot be increased until removed. |
| **Invisible** | Completely Obscured to all creatures relying on basic vision. |
| **Prone** | Speed reduced by ½. +2 to be hit from creatures within melee range. +2 Obscurity vs creatures not above you or in melee range. |
| **Terminal** | Current HP ≤ ¼ max HP. Appears gravely injured, close to defeat. |

### Leveled Conditions

| Condition | Effect per Level |
|-----------|-----------------|
| **Bleed** | Lose 1 HP at start of turn per level. Healing received reduces Bleed by amount healed (but also reduces HP restored by same amount). |
| **Exhausted** | -1 to all Bonuses and Evasion per level. -1 Speed per 2 levels (starting at level 2). Affects all Scores calculated from Bonuses. Each full recovery reduces by 1. Death at level 11+. |
| **Exposed** | -1 to all Defenses and Evasion per level. |
| **Frightened** | Penalty to all Scores/D20 rolls vs fear source equal to level. Penalty to all Scores/D20 rolls while seeing fear source equal to ½ level. |
| **Staggered** | -1 Evasion per level. |
| **Resilient** | Reduce damage taken by amount equal to level. |
| **Slowed** | -1 to all Speed types per level. |
| **Stunned** | Lose AP equal to level (removes immediately and reduces AP gained at end of turn). Always receives at least 1 AP at end of turn. |
| **Susceptible** | Increase all damage taken by amount equal to level. |
| **Weakened** | -1 to all D20 rolls per level. |

---

## Death & Dying

- **0 or negative HP:** Enter Dying, fall prone, 1 AP/turn
- **Negative HP damage:** 1d4 turn 1, 2d4 turn 2, 4d4 turn 3, doubling each turn
- **Stabilization:** Medicine, bandages, potions, Healing Powers stop escalation
- **Death:** HP ≤ −(max HP)

---

## Rarity & Currency

| Rarity | Currency Range |
|--------|----------------|
| Common | 0–99 |
| Uncommon | 100–499 |
| Rare | 500–1,499 |
| Epic | 1,500–9,999 |
| Legendary | 10,000–49,999 |
| Mythic | 50,000–99,999 |
| Ascended | 100,000+ |

---

## Naming & Display Conventions

| Rule | Example |
|------|---------|
| Damage types | Capitalize: "Radiant" not "radiant"; use "Light" not "radiant" (invalid) |
| Single target | Display "Target" not "1 target" |
| Duration | Abbreviate: "4 MIN", "2 RNDS", "1 RND", "1 HR" |
| Valid damage types | Reference `creator-constants.ts` |

---

## Helpful Subtext Ideas

Use these for tooltips, placeholders, and contextual help:

- *"Skill Bonus = Ability + Skill Value. Proficient Skills use the full value."*
- *"Evasion (10 + Agility) is the default target for attacks."*
- *"Defense Bonuses from Skill Points cannot exceed your level."*
- *"Each 5 points above the target = 1 additional Success."*
- *"Standard armor doesn't reduce Psychic, Spiritual, or Sonic damage."*
- *"Round up for all fractions in calculations."*
- *"Increasing an Ability above +4 costs 2 points per increase."*
