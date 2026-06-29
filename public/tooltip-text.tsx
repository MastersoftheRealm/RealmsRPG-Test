import { AbilityName } from '@/types';
import { ABILITIES } from '@/types/abilities';
import type { CoreRulesMap } from '@/types/core-rules';
import { calculateAbilityPoints, calculateSkillPointsForEntity } from '@/lib/game/formulas';

// Navbar
export const navbarLibrary = `Realms Library contains official content.
My Library is your personal saved collection.
Use Library to add or customize Powers, Techniques, Armaments, and Creatures.`;

export const navbarCodex = `The Codex is your rules and reference index for Skills, Feats, Species, Parts, and Equipment.
Use it while creating Characters or custom content.`;

// Character Creator

export const createNewCharacter = `Create your character step-by-step: Archetype, Species, Ancestry, Abilities, Skills,
 Feats, Equipment, Powers, then Finalize. Use Choose a Path for guided picks, or Forge Your Own for full manual control.`;

export const chooseCharacterCreationStyle = `Choose a Path gives curated level 1 recommendations.
Forge Your Own gives full manual customization from the start. Both follow the same core progression rules.`;

export function getTooltipTextByPowerAbility(ability: AbilityName) {
  switch (ability) {
    case ABILITIES.strength:
      return `Great for heavy weapons, grappling, raw force, and "front-line bruiser" builds.`;
    case ABILITIES.vitality:
      return `Fits resilient tanks, endurance-focused fighters, and characters who outlast threats.`;
    case ABILITIES.agility:
      return `Good for nimble archers, evasive duelists, and precision/positioning playstyles.`;
    case ABILITIES.acuity:
      return `A focus-and-awareness stat. Works for tacticians, sharpshooters, and characters channeling power through focus/attunement.`;
    case ABILITIES.intelligence:
      return `Ideal for scholars, inventors, and spellcasters who study and refine their craft.`;
    case ABILITIES.charisma:
      return `Fits leaders, performers, and power users who influence the world through presence and will.`;
    default:
      return '';
  }
}

export const powerAbility = `Your Power Ability pairs with your Power usage and best fits your character. It helps determine Energy, your Power-related
effectiveness, and Training Points used for crafting powers. Common choices include Acuity, Intelligence, or Charisma.`;

export const martialAbility = `Your Martial Ability reflects your combat style and approach to challenges. It influences Energy and Training
Points for Techniques and proficiencies. Common picks include Strength, Vitality, Agility, or Acuity depending on your concept.`;

export const chooseYourSpecies = (
  <div>
    <div>Species Sources</div>
    <strong>Choose Your Species</strong>
    <br />
    Your species defines your character&apos;s physical traits and inherent abilities.
    <ul>
      <li><strong>Public species</strong> are official Realms options.</li>
      <li><strong>My species</strong> are custom species you created.</li>
    </ul>
  </div>
);

export const chooseYourAncestryTraits = (
  <div>
    <div>Ancestry Trait Rules</div>
    <div>
      Default selection is <strong>1 ancestry trait.</strong>
    </div>
    <div>
      Taking a flaw grants <strong>+1 extra ancestry trait</strong> (for 2 total).
    </div>
    <div>
      In mixed species, choose one species trait from each side before finalizing ancestry.
    </div>
  </div>
);

/** @deprecated Use getAbilityPointsHelp for level-aware copy */
export const assignAbilities = (
  <div>
    <div>Ability Point Rules</div>
    <div>
      At level <strong>1</strong>, you have <strong>7 Ability Points.</strong>
    </div>
    <div>
      At creation, each Ability can be between <strong>-2</strong> and <strong>3</strong>.
    </div>
    <div>
      Total negative adjustments cannot go below <strong>-3</strong>.
    </div>
  </div>
);

export function getAbilityPointsHelp(level: number, rules: CoreRulesMap) {
  const points = calculateAbilityPoints(level, false, rules);
  const min = rules.ABILITY_RULES.min;
  const maxStarting = rules.ABILITY_RULES.maxStarting;
  const maxNegative = rules.ABILITY_RULES.maxTotalNegative;
  return (
    <div>
      <div>Ability Point Rules</div>
      <div>
        At level <strong>{level}</strong>, you have <strong>{points} Ability Points.</strong>
      </div>
      <div>
        At creation, each Ability can be between <strong>{min}</strong> and <strong>{maxStarting}</strong>.
      </div>
      <div>
        Total negative adjustments cannot go below <strong>{maxNegative}</strong>.
      </div>
    </div>
  );
}

export function getSkillPointsHelp(level: number, rules: CoreRulesMap) {
  const skillPoints = calculateSkillPointsForEntity(level, 'character', rules);
  const maxSkill = rules.SKILLS_AND_DEFENSES.maxSkillValue;
  const basePastCap = rules.SKILLS_AND_DEFENSES.baseSkillPastCapCost;
  const subPastCap = rules.SKILLS_AND_DEFENSES.subSkillPastCapCost;
  return (
    <div>
      <div>Skill Point Rules</div>
      <div>
        At level <strong>{level}</strong>, you have <strong>{skillPoints} Skill Points</strong>.
      </div>
      <div>
        Base skill cap is <strong>{maxSkill}</strong>.
      </div>
      <div>
        Past-cap cost: base <strong>{basePastCap}</strong>, sub-skill <strong>{subPastCap}</strong>.
      </div>
    </div>
  );
}

export const subSkillsHelp = (
  <div>
    <div>Sub-Skills</div>
    <div>
      Sub-skills are <strong>specialized skills</strong> that build on a broader base skill (example: <em>Lockpicking</em> under{' '}
      <em>Sleight of Hand</em>).
    </div>
    <div>
      You <strong>can&apos;t gain proficiency</strong> in a sub-skill until you have proficiency in its <strong>base skill</strong>.
    </div>
    <div>When you add a sub-skill here, the base skill will be added automatically if needed.</div>
  </div>
);

export const featSelectionHelp = (
  <div>
    <div>Feat Selection</div>
    <div>
      Pick both <strong>Archetype Feats</strong> and <strong>Character Feats</strong>.
    </div>
    <div>Path mode starts with recommended feats, but you can switch to your own picks.</div>
    <div>Requirement warnings show when a feat needs specific stats, skills, or other prerequisites.</div>
  </div>
);

export const powersSelectionHelp = (
  <div>
    <div>Powers and Techniques</div>
    <div>Add powers and techniques from your library sources.</div>
    <div>Path mode can auto-add recommendations from your archetype path.</div>
    <div>If a list is empty, create content first in the related creator pages.</div>
  </div>
);

export const equipmentCurrencyHelp = (
  <div>
    <div>Starting Equipment Budget</div>
    <div>Starting currency is typically <strong>200</strong>.</div>
    <div>Track remaining currency while adding weapons, armor, and gear.</div>
    <div>Path mode can add a recommended loadout in one click.</div>
  </div>
);

export const finalizeSummaryHelp = (
  <div>
    <div>Finalize Checklist</div>
    <div>Review your summary, set name/portrait, then resolve any validation warnings.</div>
    <div>Health and Energy come from the allocation pool and your current ability setup.</div>
    <div>You can still tune details later on the character sheet.</div>
  </div>
);

// Campaigns

export const campaignsHelp = `Create a campaign as Realm Master, share the invite code, then manage party characters.
Players join with a valid invite code and one of their characters.`;

export const campaignsInviteHelp = `Invite codes are campaign-specific.
When a player joins, their character visibility can be set to Campaign for party access.`;

// Library / Codex (page headers)

export const libraryModeHelp = `Realms Library is official shared content.
My Library is your personal saved content.
Use source filters in creators and selectors to combine My, Realms, or All.`;

export const codexModeHelp = `The Codex is the master reference for Skills, Feats, Species, Equipment, Parts, and Properties.
Use Advanced to reveal deeper rule sections for parts/properties and creature feats.`;
