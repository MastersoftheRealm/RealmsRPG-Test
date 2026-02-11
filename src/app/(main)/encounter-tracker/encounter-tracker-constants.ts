/**
 * Encounter Tracker - Constants
 */

import type { ConditionDef } from './encounter-tracker-types';

export const STORAGE_KEY = 'realms-encounter-tracker';

export const CONDITION_OPTIONS: ConditionDef[] = [
  { name: "Bleed", leveled: true, description: "Lose 1 Health at the beginning of your turn for each level of Bleed. Any healing received reduces the Bleed condition by the amount healed, but reduces the amount restored to Health by an equal amount." },
  { name: "Blinded", leveled: false, description: "All targets are considered Completely Obscured to a blinded creature that relies on basic vision. Acuity Skill rolls that rely on sight automatically fail." },
  { name: "Charmed", leveled: false, description: "Charmed creatures can't attack or perform harmful Actions against the creature that charmed them. All Charisma rolls and potencies against this target from the charmer gain +2." },
  { name: "Dazed", leveled: false, description: "You cannot take Reactions." },
  { name: "Deafened", leveled: false, description: "You cannot hear anything in the world around you. You have resistance to Sonic damage. Acuity Skill rolls that rely on hearing automatically fail." },
  { name: "Dying", leveled: false, description: "HP at 0 or negative. Prone, 1 AP/turn. Take 1d4 irreducible damage at start of turn, doubling each turn (1d4, 1d8, 2d8, 4d8...). AP reduced to 1 on entry." },
  { name: "Exhausted", leveled: true, description: "For each level: reduce all Bonuses and Evasion by that level. For every 2 levels (starting at 2), Speed reduced by 1. Affects all Scores calculated from Bonuses. Each full recovery reduces by 1. Death at level 11+." },
  { name: "Exposed", leveled: true, description: "Decrease all Defenses and Evasion by an amount equal to the level of Exposed." },
  { name: "Faint", leveled: false, description: "You have -1 to Evasion, Might, Reflex, and on all D20 rolls requiring balance or poise. Outside forces gain +1 to D20 rolls and potency to make you prone, knock you back, or grapple you." },
  { name: "Frightened", leveled: true, description: "Penalty to all Scores and D20 rolls against the source of fear equal to the level. Penalty to all Scores and D20 rolls while seeing fear source equal to half the level." },
  { name: "Grappled", leveled: false, description: "Grappled targets have -2 to Attack rolls, are +2 to hit, cannot move away from the grappler, and cannot take Movement Actions." },
  { name: "Hidden", leveled: false, description: "While hidden, you have a +2 bonus on Attack rolls made against creatures unaware of your location in addition to any bonus granted by Obscurity." },
  { name: "Immobile", leveled: false, description: "Immobile creatures cannot take Movement Actions, and their Speed is considered 0. Speed cannot be increased until removed." },
  { name: "Invisible", leveled: false, description: "You are considered Completely Obscured to all creatures relying on basic vision." },
  { name: "Prone", leveled: false, description: "Speed reduced by ½. +2 to be hit from creatures within melee range. Increase Obscurity by 2 against creatures not above you or in your melee range." },
  { name: "Resilient", leveled: true, description: "Reduce damage taken by an amount equal to your Resilient level." },
  { name: "Restrained", leveled: false, description: "Restrained creatures cannot take Actions or Reactions that require the use of their arms." },
  { name: "Slowed", leveled: true, description: "Decrease all Speed types by an amount equal to your Slowed level." },
  { name: "Staggered", leveled: true, description: "Decrease Evasion by an amount equal to your Staggered level." },
  { name: "Stunned", leveled: true, description: "Lose AP equal to level (removes immediately and reduces AP gained at end of turn). Always receives at least 1 AP at end of turn." },
  { name: "Susceptible", leveled: true, description: "Increase all damage taken by an amount equal to your Susceptible level." },
  { name: "Terminal", leveled: false, description: "Your current Health is at or below ¼ of your maximum Health, placing you in the Terminal Range. Appears gravely injured and close to defeat." },
  { name: "Weakened", leveled: true, description: "Decrease all D20 rolls by an amount equal to your Weakened level." },
].sort((a, b) => a.name.localeCompare(b.name));
