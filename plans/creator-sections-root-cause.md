# Creator section forks — root cause

**Status:** Root cause only. No fix in this change.
**Label:** The bugs below are real. This note does not remove them.

## Cause

Widespread, not one-off. Power, empowered technique, technique, and the armament creator each render their own damage and action sections. They share constants and calculators, then fork the editor and the badge math.

Two later patches edited only the power copy and left the empowered copy on the old path:

- `c616764e` pointed power damage, area, parts, and mechanics badges at `calculatePowerSectionContribution` (`power-creator-cost-derivation.ts` 345–354). Empowered still calls `calculatePowerCosts` on the section alone (`empowered-technique-cost-derivation.ts` 339–365).
- `f8425773` made power’s Power Mechanics Add Part skip an id already selected (`power-creator-part-actions.ts` `nextMechanicPartToAdd`). Empowered still inserts the first mechanic again (`empowered-technique-part-actions.ts` 49–64).

The split that created the copies is `edee3308` / `96dfd173` (TASK-610 / TASK-616). `2e35c758` then built empowered’s shared action only as a power part (`mechanic-builder.ts` 120–121). The technique payload never receives that action (`empowered-technique-cost-derivation.ts` 126–137 and 205–235).

## Proven bugs

Same inputs, different numbers. Repros are in `creator-section-fork-drift.test.ts`. They fail on master.

1. **Duration on a section badge.** 1d4 magic and a level-1 sphere, both with Apply duration, plus Duration (Minute) at 2 energy. Power badges are **12** and **12**. Empowered badges are **4** and **4**. Duration is supposed to multiply duration-affected energy (`DECISIONS.md`, Duration; `calculatePowerSectionContribution`). The combined empowered total can still include duration. The section the person reads does not.
2. **Quick Action on both halves.** 1d4 magic and 1d4 technique damage, Quick Action at ×1.5. The power half becomes 6. The technique half stays **4**. The total is **10**. The written rule is that a whole-thing scaler such as action type applies to both halves (`DECISIONS.md`, Empowered techniques), so the technique half is **6** and the total is **12**.

## Fork map

| Section | Copies | Shared | Forked behavior |
|---|---|---|---|
| Action + attack | `power-creator-editor-action-profile.tsx` (two sections); `empowered-technique-editor-action-profile.tsx` (one); combat block in `technique-creator-editor.tsx` | `ACTION_OPTIONS`, `actionTypeFromSelection`, `buildMechanicParts` | Labels match. Empowered does not scale the technique half (bug 2). Power and technique show the No Attack warning; empowered does not. |
| Power damage | `power-creator-editor-power-damage.tsx`; `empowered-technique-editor-power-damage.tsx` | `DIE_SIZES`, `POWER_DAMAGE_TYPES`, `calculateDamageOptionLevel` | Same dice row. Badge math diverges (bug 1). |
| Technique damage | Additional Damage in `technique-creator-editor.tsx`; `empowered-technique-editor-technique-parts.tsx` | `buildMechanicParts` technique damage | Same dice, no type picker. |
| Weapon / shield dice | `item-creator-editor-weapon-shield.tsx`; `item-creator-editor-shield-panels.tsx` | `DIE_SIZES` | Own steppers. Item cost inlines the same split formula as `computeSplits`. |
| Range, area, duration | `power-creator-editor-power-config.tsx` (three sections); `empowered-technique-editor-power-config.tsx` (one) | `AREA_TYPES`, `DURATION_TYPES`, `DURATION_VALUES`, `buildMechanicParts` | Area badge diverges (bug 1). Power disables duration modifiers at 1 round; empowered does not. |
| Parts | `power-creator-editor-power-parts.tsx`; `empowered-technique-editor-power-parts.tsx`; technique parts block | `PowerPartCard` | Add-mechanic skip exists only on power. Technique cards pass `showApplyDuration={false}`. |
| Meta | power, empowered, item meta files; technique card in the monolith | `CreatorNameField`, `CreatorDescriptionField` | Item adds the armament-type control. |

Creature and species do not edit these sections. Creature picks finished library rows. Species edits traits and sizes.

## Intended differences

- Power damage is typed. Technique additional damage has no type; it follows the weapon (`technique-creator-editor.tsx`).
- Weapon damage types are only slashing, piercing, and bludgeoning (`creator-constants.ts`, `GAME_RULES.md` weapon damage).
- Variant action rules are power-only: every tab shares action type, except each Alternate version (`DECISIONS.md`, Power composition). Technique and armament have no variant tabs.
- Weapon Attack and No Attack on an empowered technique pick the cheaper energy part (`GAME_RULES.md`, Empowered Techniques). That overlap rule is not the action-scaler rule.
- Armaments: the same property not more than once; identical parts may be added twice (`DECISIONS.md`, Product / UX).

## Open questions for Kadin

1. Quick Action: one multiplier on the sum of both halves (what the failing test expects), or a cheaper-EN pick that scales only one half?
2. Should empowered Power Mechanics Add Part skip a mechanic already on the list, the way power does, even though identical parts may be saved twice?
3. At 1 round, should empowered hide and clear Focus, No Harm, Ends on Activation, and Sustain the way power does? Cost already treats 1 round as no duration.
4. Damage dice steppers stop at 20 on power and technique and at 10 on weapons and shields. Which cap is the rule?
5. Should the empowered action section show the same No Attack warning as power and technique?

## Fix (not in this change)

Point the empowered badges at `calculatePowerSectionContribution` in `src/lib/calculators/power-calc.ts`, and apply the one action multiplier inside `calculateEmpoweredTechniqueCosts` in `src/lib/calculators/empowered-technique-calc.ts`. Then render action, damage, and the power configuration from one module under `src/components/creator/` and delete the parallel editor copies. Do not fold weapon damage types or power variant tabs into that module.
