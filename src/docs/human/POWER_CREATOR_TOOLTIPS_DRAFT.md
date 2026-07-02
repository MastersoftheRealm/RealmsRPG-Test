# Power Creator - Tooltip Copy Draft (Owner)

> **Purpose:** Owner-authored reference for future `InfoTippy` wiring on the power creator (guided and advanced). Copy is **placeholder** - grammar and rule precision will be edited before production.
> **Canonical implementation target:** `public/tooltip-text.tsx` (easy for owner to edit in one place).
> **Authority for rules:** [`GAME_RULES.md`](../GAME_RULES.md) (innate threshold, archetype progression).
> **Related:** [`REALMS_PRODUCT_OVERVIEW.md`](../REALMS_PRODUCT_OVERVIEW.md) Section 5.11, Section 2.6.

**Last updated:** 2026-07-01

---

## Teaching users how to use creators (open question)

**Tooltips purpose:** Quick reference for game rules and how to use creators. Hover or focus a term, button, or info icon to read context.

**Open design question (not decided):** How much beyond tooltips?

- Short videos?
- Guided tutorial (step overlay)?
- Tooltips only?

**Default until decided:** `InfoTippy` + static copy in `tooltip-text.tsx`. Prefer copy the owner can edit without hunting through TSX.

---

## Power Creator - field tooltips (draft)

### Description

Describe the mechanics of how your power works, along with its flavor. Example: "Hurl a massive fireball. As a Basic Action, make a Power Attack against Reflex of all creatures within a 2-space radius of a point within 6 spaces of range, dealing 2d6 Fire damage on a success."

### Action Type

This determines how much AP you must spend to use this Power. The less AP it takes to use, the more expensive the Power is. Outside of combat you cannot have an action longer than a Basic Action (2 AP). Innate Powers must be Basic Actions or Reactions.

### Reaction toggle

Decide if this Power can be used as a reaction to some triggering event, such as being hit by an attack. Reaction Powers cost more.

### Add Weapon to Power

If you add a weapon to your Power, you may choose to make a Weapon Attack using that weapon as part of the same action to use the Power. You may also choose to have the Power affect that weapon and its attacks for the duration of the Power.

### Area of Effect

By default, a Power only affects one target or one space for its duration. Add an area of effect that applies to all Power parts and mechanics. Area-of-effect parts that would normally target Evasion target Reflex instead. Each creature in the area is a target of the Power - on your side or not - unless an area mechanic specifies otherwise.

If you want the Power to last for a duration in an area, or on the targets who were initially affected, toggle **Apply duration**. Effects on targets initially affected apply at the start of those targets' next turn after this. If the effect applies to an area, when a target first moves into the area or ends their turn there, they must re-make a defense roll against the original targeted defense(s) or be affected again.

### Duration

Normally a Power has either an instantaneous or single-round effect that ends at the start of your next turn. You can increase the duration by picking an amount and unit of time (such as 10 minutes). Only Parts and Mechanics with **Apply duration** toggled are considered to last for the Power's duration. Work with a friend or RM if duration is confusing for your table.

### Power Parts

These are the payload of your Power - what the Power does. There are limitless options and you can combine them in many ways, but the best Powers often have only one to three parts.

### Mechanics (Power Mechanics)

Power Mechanics are the *how* behind what a Power does. If your Power's Energy cost is too high, use mechanics in the **Restriction** category, which offer reduced cost with stipulations. Try other mechanics to customize further.

### Damage

Choose a damage type, number of dice, and die size. Often using more dice of lower values is more expensive (for example, 2d6 over 1d12). This damage is dealt when the Power is used, not again each turn with duration, unless duration is in an area of effect instead of on a target. You can add multiple damage types.

### Energy

This is the cost of your Power - a rounded-up value from all Energy contributions of your Power Parts and Mechanics. See **Advanced calculations** below for each contribution.

### Innate Power (Energy threshold)

A Power can be **Innate** if its Energy is at or below your **Innate Threshold** for your level and archetype (see character sheet). At level 1: **8** for Power characters, **6** for Powered-Martial. Threshold increases by +1 every 3 levels starting at level 4. Innate Powers are usable without spending Energy from your pool (subject to innate pool limits).

### Innate Power (requirements)

To qualify as an Innate Power it must be a **Basic Action** or **Reaction**, and cannot include Healing or Energy-gaining parts.

### Training Points

The sum of Training Point costs for each Part added to this Power. You may already have proficiency with some or all parts, so this total may not equal what you must spend to add the Power to your character.

### Load

Load any Power from your library or the Realms Library.

### Reset

Remove all current parts, mechanics, and settings - start with a clean slate.

---

## Guided Layer 1 - additional tooltip topics (to draft)

| Topic | Notes |
|-------|--------|
| **Power character** | Full Power archetype; higher innate threshold at L1; power proficiency |
| **Powered-Martial character** | Split martial/power track; lower innate threshold at L1 |
| **Who is this power for?** | Selecting a character enables innate threshold filtering and TP context |
| **Innate vs standard** | Innate = no energy spend when qualified; see requirements above |
| **Power category** | Maps to part categories (Offense, Defense, Utility, Control, etc.) |

---

## Item creator - related drafts (armament guided)

| Topic | Notes |
|-------|--------|
| **Armament proficiency** | Max TP on armament depends on character level and archetype |
| **Rarity at level 1** | Level 1 characters typically only have access to **Common** rarity armaments in play |
| **Who is this for?** | Selecting a character filters TP budget and surfaces proficiency context |

See [`GAME_RULES.md`](../GAME_RULES.md) archetype progression table (Armament Prof column).
