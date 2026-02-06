/**
 * Encounter Tracker - Constants
 */

import type { ConditionDef } from './encounter-tracker-types';

export const STORAGE_KEY = 'realms-encounter-tracker';

export const CONDITION_OPTIONS: ConditionDef[] = [
  { name: "Bleeding", leveled: true, description: "Bleeding creatures lose 1 Hit Point for each level of bleeding at the beginning of their turn. Any healing received reduces the bleeding condition by the amount healed." },
  { name: "Blinded", leveled: false, description: "All targets are considered completely obscured to a blinded creature that relies on basic vision. Acuity Skill rolls that rely on sight automatically fail." },
  { name: "Charmed", leveled: false, description: "Charmed creatures can't attack or perform harmful Actions against the creature that charmed them. All Charisma rolls and potencies against this target from the charmer gain +2." },
  { name: "Dazed", leveled: false, description: "Dazed creatures cannot take Reactions." },
  { name: "Deafened", leveled: false, description: "You cannot hear anything in the world around you. You have resistance to sonic damage. Acuity Skill rolls that rely on hearing automatically fail." },
  { name: "Dying", leveled: false, description: "When your Hit Point total is reduced to zero or a negative value, you enter the dying condition. Each turn, at the beginning of your turn, you take 1d4 irreducible damage, doubling each turn." },
  { name: "Exhausted", leveled: true, description: "Exhaustion reduces all bonuses and Evasion by an amount equal to its level. At level 10, the character dies." },
  { name: "Exposed", leveled: true, description: "Exposed creatures decrease their Evasion by 1 for each level of Exposed." },
  { name: "Faint", leveled: false, description: "You have -1 to Evasion, Might, Reflexes, and on all D20 rolls requiring balance or poise." },
  { name: "Frightened", leveled: false, description: "Frightened creatures have -2 on all scores and D20 rolls against the source of their fear." },
  { name: "Grappled", leveled: false, description: "Grappled targets have -2 to attack rolls, are +2 to hit, and cannot take movement Actions." },
  { name: "Hidden", leveled: false, description: "While hidden, you have a +2 bonus on attack rolls made against creatures unaware of your location." },
  { name: "Immobile", leveled: false, description: "Immobile creatures cannot take Movement Actions, and their Speed is considered 0." },
  { name: "Invisible", leveled: false, description: "You are considered completely obscured to all creatures relying on basic vision." },
  { name: "Prone", leveled: false, description: "While prone, your movement speed is reduced by ½. You are +2 to hit by others and have -2 to hit others." },
  { name: "Resilient", leveled: true, description: "Resilient creatures take 1 less damage each time they are damaged per Resilient level." },
  { name: "Slowed", leveled: true, description: "Slowed creatures lose 1 or more movement speed depending on the level of Slowed." },
  { name: "Stunned", leveled: true, description: "Stunned creatures lose 1 or more Action Points based on the level of Stun." },
  { name: "Susceptible", leveled: true, description: "Susceptible creatures take 1 extra damage each time they are damaged per Susceptible level." },
  { name: "Terminal", leveled: false, description: "Your current health is at or below ¼ of your maximum health, placing you in the Terminal Range." },
  { name: "Weakened", leveled: true, description: "Weakened creatures decrease all D20 rolls by 1 or more depending on the level of Weakened." },
].sort((a, b) => a.name.localeCompare(b.name));
