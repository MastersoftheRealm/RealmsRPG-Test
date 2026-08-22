import { AbilityName } from '@/types';
import { ABILITIES } from '@/types/abilities';
import type { CoreRulesMap } from '@/types/core-rules';
import type { DefenseSkills } from '@/types/skills';
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

/** Definition help for ability name labels (sheet, guided creator, skills). No icon — tip on the word.
 * Lead with the name once in the sentence (not "Acuity. Acuity is…"). */
export const ABILITY_HELP: Record<AbilityName, string> = {
  strength:
    'Strength governs physical actions like lifting, breaking, throwing, climbing, and stability. It determines your chance to hit and the damage dealt with some melee weapons.',
  vitality:
    'Vitality represents resilience and endurance, affecting resistance to damage, toxins, illnesses, and more. It also contributes to your Health (HP) at each level.',
  agility:
    'Agility measures speed and reflexes, affecting Evasion (EV) and Speed (SP). It determines your chance to hit and damage dealt with melee or ranged finesse weapons.',
  acuity:
    'Acuity reflects mental sharpness, influencing perception, reaction, and aim. It determines your chance to hit and the damage dealt with most ranged weapons.',
  intelligence:
    'Intelligence covers knowledge, problem-solving, memory, and knowledge in topics such as history, lore, and language.',
  charisma:
    'Charisma governs social skills, including persuasion, intimidation, and emotional intelligence. It also represents your presence, poise, resolve, and confidence.',
};

export function getAbilityHelp(ability: AbilityName): string {
  return ABILITY_HELP[ability] ?? '';
}

/** Definition help for defense name labels (sheet, skills allocation). No icon — tip on the word.
 * Name once, then definition (not "Might. Might resists…"). Linked Ability stays in parentheses. */
export const DEFENSE_HELP: Record<keyof DefenseSkills, string> = {
  might:
    'Might (Strength) resists being moved by force, grappled, or restrained, and helps to maintain a firm grip.',
  fortitude:
    'Fortitude (Vitality) resists poisons, environmental effects, and helps fend off diseases.',
  reflex:
    'Reflex (Agility) helps you dodge hazards, avoid being toppled, and maneuver to escape danger.',
  discernment:
    'Discernment (Acuity) helps you detect illusions, incoming attacks, trickery (e.g., sleight of hand or mimicry), and disguises.',
  mentalFortitude:
    'Mental Fortitude (Intelligence) helps you overcome mind-altering effects, mind-reading, cognitive manipulation, and logical challenges.',
  resolve:
    'Resolve (Charisma) helps you overcome charm, resist temptations, and avoid fear, intimidation, or possession.',
};

export function getDefenseHelp(defense: keyof DefenseSkills): string {
  return DEFENSE_HELP[defense] ?? '';
}

/** Sheet tip on defense Score values (not the defense name). Same copy for all six. */
export const defenseScoreHelp =
  'This number is a Defense Score: 10 + Defense Bonus. Scores are passive targets (Bonus + 10).';

export const powerAbility = `Your Power Ability pairs with your Power usage and best fits your character. It helps determine Energy, your Power-related
effectiveness, and Training Points used for crafting powers. Common choices include Acuity, Intelligence, or Charisma.`;

export const martialAbility = `Your Martial Ability reflects your combat style and approach to challenges. It influences Energy and Training
Points for Techniques and proficiencies. Common picks include Strength, Vitality, Agility, or Acuity depending on your concept.`;

/** Guided / L1 tip — Path step title (what an Archetype Path is; not "class"). */
export const guidedArchetypePathHelp = `An Archetype Path is the type of adventurer your character is. Paths guide you with suggestions for Abilities, Skills, Feats, and Loadout - you can still deviate or rebuild the Path to make it your own.`;

/** Guided / L3 tip — Custom Archetype step title (not the same as Archetype Path). */
export const guidedCustomArchetypeHelp = `A Custom Archetype lets you define your adventuring style from scratch — pick Power, Martial, or Powered-Martial, then choose your Power and/or Martial Abilities. You won't get curated path recommendations, but you have full freedom to build your own concept.`;

/** Guided / L3 tip — "Choose your archetype" type cards (Power / Martial / Powered-Martial). */
export const guidedChooseArchetypeTypeHelp = `Your archetype type sets how your character leans into Powers, Techniques, and martial training. Power focuses on supernatural ability; Martial on weapons and physical skill; Powered-Martial blends both at a lighter level than a pure path.`;

/** Guided / L1 Path step section tips (Power / Powered-Martial / Martial). */
export const guidedPowerPathTypeHelp = `Power paths focus on supernatural ability - think spellcasters, artificers, elemental benders, warlocks, and bards. You lean on Powers and Energy more than weapons or Techniques.`;

export const guidedMartialPathTypeHelp = `Martial paths focus on physical combat and training - think weapon masters, scouts, and unarmed specialists. You rely on weapons, Techniques, and martial skill rather than Powers.`;

export const guidedPoweredMartialPathTypeHelp = `Powered-Martial paths blend fighting skill with supernatural ability - you train with both weapons or Techniques and Powers, each at a lighter level than a pure Martial or Power path.`;

/**
 * Guided / L1-simplified tip for Path More details — Primary vs Secondary Ability.
 * Prefer `guided*` prefix for creator teaching tips (see guide/04 § Copy scoping).
 * Global Archetype Ability tips elsewhere may be more formula-specific.
 */
export const guidedArchetypeAbilityHelp = (
  <div>
    <div>
      Your <strong>Primary Ability</strong> is this path&apos;s Archetype Ability. Its value
      influences Energy, Training Points, and your Attack Bonus (Power Bonus or Martial Bonus).
    </div>
    <div>
      Powered-Martial paths have <strong>two</strong> Primary Abilities (Power and Martial); both
      are Archetype Abilities.
    </div>
    <div>
      A <strong>Secondary Ability</strong> is only a recommendation. It has no direct game effect.
    </div>
  </div>
);

/**
 * Global term tip — Armament Proficiency (weapons/armor Training Points ceiling).
 * Reuse anywhere the label appears (Path overview, sheet Inventory, etc.).
 * Do not fork a second string; see guide/04 § Copy scoping.
 */
export const armamentProficiencyHelp = (
  <div>
    <div>
      <strong>Armament Proficiency</strong> is the highest Training Points cost of a weapon or armor
      piece you can use.
    </div>
    <div>Higher Martial Proficiency raises this limit as you level.</div>
  </div>
);

/**
 * Parts / Properties & Proficiencies section tips (TASK-583).
 * Resolved from MetadataDetailSection.labelHelpKey in GridListRow — do not fork per surface.
 */
export const partsProficienciesPowerHelp = (
  <div>
    <div>
      <strong>Parts</strong> are the pieces that compose a Power. You need proficiency with each part
      to perform the Power with proficiency. Each part has a Training Points cost.
    </div>
  </div>
);

export const partsProficienciesTechniqueHelp = (
  <div>
    <div>
      <strong>Parts</strong> are the pieces that compose a Technique. You need proficiency with each
      part to perform the Technique with proficiency. Each part has a Training Points cost.
    </div>
  </div>
);

export const partsProficienciesGenericHelp = (
  <div>
    <div>
      <strong>Parts</strong> are the pieces that compose a Power or Technique. You need proficiency
      with each part to use or perform it with proficiency. Each part has a Training Points cost.
    </div>
  </div>
);

export const propertiesProficienciesWeaponHelp = (
  <div>
    <div>
      <strong>Properties</strong> are the pieces that compose a weapon. You need proficiency with each
      property to wield the weapon with proficiency. Each property has a Training Points cost.
    </div>
  </div>
);

export const propertiesProficienciesArmorHelp = (
  <div>
    <div>
      <strong>Properties</strong> are the pieces that compose armor. You need proficiency with each
      property to wear the armor with proficiency. Each property has a Training Points cost.
    </div>
  </div>
);

export const propertiesProficienciesShieldHelp = (
  <div>
    <div>
      <strong>Properties</strong> are the pieces that compose a shield. You need proficiency with each
      property to wield the shield with proficiency. Each property has a Training Points cost.
    </div>
  </div>
);

export const propertiesProficienciesItemHelp = (
  <div>
    <div>
      <strong>Properties</strong> are the pieces that compose a weapon, armor, or shield. You need
      proficiency with each property to wield or wear it with proficiency. Each property has a
      Training Points cost.
    </div>
  </div>
);

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

export function getSkillPointsHelp(
  level: number,
  rules: CoreRulesMap,
  entityType: 'character' | 'creature' = 'character',
) {
  const skillPoints = calculateSkillPointsForEntity(level, entityType, rules);
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

/**
 * Guided Skills step — how a listed Skill Bonus is calculated (proficient base skills).
 * DESIGN_INTENT: Parameterized help like getAbilityPointsHelp (live numbers + static formula
 * structure in tooltip-text). Supplementary InfoTippy copy — not a generic stat popover.
 */
export function getGuidedSkillBonusHelp(options: {
  abilityLabel: string;
  abilityValue: number;
  skillValue: number;
  skillBonus: number;
  multiAbility?: boolean;
}) {
  const { abilityLabel, abilityValue, skillValue, skillBonus, multiAbility } = options;
  const signed = (n: number) => (n >= 0 ? `+${n}` : `${n}`);
  return (
    <div>
      <div>
        Your <strong>Skill Bonus</strong> is added to d20 Skill Rolls. It reflects proficiency with this
        Skill and includes your full linked Ability. Each Skill Point you allocate here increases the
        bonus by +1.
      </div>
      <div>
        <strong>{abilityLabel}</strong> ({signed(abilityValue)}) + Skill Value ({signed(skillValue)}) ={' '}
        <strong>{signed(skillBonus)}</strong>
      </div>
      {multiAbility ? (
        <div>Uses your highest linked Ability for this Skill.</div>
      ) : null}
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
    <div>Track remaining currency while adding weapons, armor, and Equipment.</div>
    <div>Path mode can add a recommended loadout in one click.</div>
  </div>
);

/** Guided Loadout + powers/techniques — shared Training Points budget (TASK-456 / TASK-580). */
export const trainingPointsHelp = (
  <div>
    <div>
      <strong>Training Points</strong> are a shared budget you spend on weapons, armor, Powers, and
      Techniques.
    </div>
    <div>Remaining is what you can still afford. Choices that cost more stay unavailable.</div>
  </div>
);

/**
 * Global term tip — Innate Energy (Pools × Threshold; combined energy of innate powers).
 * Reuse anywhere the label appears (TASK-726).
 */
export const innateEnergyHelp = (
  <div>
    <div>
      <strong>Innate Energy</strong> is the total combined energy of all your innate powers.
    </div>
    <div>Your pool is Innate Pools × Innate Threshold.</div>
  </div>
);

/**
 * Global term tip — Innate Powers (usable without spending Energy; Energy ≤ Innate Threshold).
 */
export const innatePowersHelp = (
  <div>
    <div>
      <strong>Innate Powers</strong> are powers you can use without spending Energy.
    </div>
    <div>
      Each must cost at or below your Innate Threshold — the max energy cost to be innate. Their
      Energy totals count against your Innate Energy pool.
    </div>
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

// Guided choice-card deep-dive (InfoTippy bodies — no redundant section titles)

export const guidedSpeciesDetailSpeciesTraitOptions = (
  <div>
    <div>
      Some Species Traits ask you to pick a variant during Ancestry. Expand a row for the full
      description.
    </div>
  </div>
);

export const guidedSpeciesDetailAncestryTraits = (
  <div>
    <div>
      You choose one Ancestry Trait by default. Taking a Flaw grants one extra Ancestry Trait.
      Expand any row to read more.
    </div>
  </div>
);

export const guidedSpeciesDetailCharacteristics = (
  <div>
    <div>You choose one Characteristic during Ancestry. Expand a row for details.</div>
  </div>
);

export const guidedSpeciesDetailFlaws = (
  <div>
    <div>
      Flaws are optional. Taking one grants an extra Ancestry Trait. Expand a row for details.
    </div>
  </div>
);

export const guidedPathDetailArchetypeFeats = (
  <div>
    <div>
      These combat focused Feats come from this Archetype Path. You choose among them during Your
      Archetype.
    </div>
  </div>
);

export const guidedPathDetailCharacterFeats = (
  <div>
    <div>
      These Character Feats are tied to this Archetype Path. You pick one during Your Archetype.
    </div>
  </div>
);

export const guidedPathDetailWeapons = (
  <div>
    <div>
      Weapons and shields recommended for this path, including kits. Expand a row for Damage, Range,
      and properties.
    </div>
  </div>
);

export const guidedPathDetailArmor = (
  <div>
    <div>
      Armor recommended across this path kits. Expand a row for Damage Reduction and other details.
    </div>
  </div>
);

export const guidedPathDetailLoadouts = (
  <div>
    <div>
      Coherent kits this Archetype Path offers. Equipment listed elsewhere may also be shared across kits.
    </div>
  </div>
);

export const guidedPathDetailTechniques = (
  <div>
    <div>
      Techniques this Martial path recommends. Expand a row for Action Type, Energy, and Damage.
    </div>
  </div>
);

export const guidedPathDetailPowers = (
  <div>
    <div>
      Powers this Archetype Path recommends. Expand a row for Energy, Action Type, Range, and
      Duration.
    </div>
  </div>
);

/**
 * Your Hero / Advanced finalize — Auto-allocate Health/Energy (TASK-729).
 * Names the live highest-cost Power/Technique when known.
 */
export function getGuidedAutoAllocateHelp(options?: {
  name?: string;
  energy?: number;
  kind?: 'power' | 'technique';
}) {
  const { name, energy, kind } = options ?? {};
  if (name && energy != null && energy > 0) {
    const kindLabel = kind === 'technique' ? 'Technique' : 'Power';
    return (
      <div>
        <div>
          Your highest Energy-cost {kindLabel}, <strong>{name}</strong>, is{' '}
          <strong>{energy} Energy</strong>.
        </div>
        <div>
          Auto-allocate gives you enough Energy to use {name} once, and puts the rest of the pool
          into Health.
        </div>
      </div>
    );
  }
  return (
    <div>
      <div>
        Auto-allocate gives you enough Energy to use your highest Energy-cost Power or Technique
        once, and puts the rest of the pool into Health.
      </div>
      <div>If none of those cost Energy, the whole pool goes to Health.</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Power Creator (advanced / L3) — owner draft in POWER_CREATOR_TOOLTIPS_DRAFT.md
// (TASK-408). Guided L1 placeholders are strings only; wiring is TASK-411.
// ---------------------------------------------------------------------------

export const powerCreatorDescriptionHelp = (
  <div>
    <div>
      Describe the mechanics of how your Power works, along with its flavor.
    </div>
    <div>
      Example: &quot;Hurl a massive fireball. As a Basic Action, make a Power Attack against Reflex of
      all creatures within a 2-space radius of a point within 6 spaces of range, dealing 2d6 Fire
      damage on a success.&quot;
    </div>
  </div>
);

export const powerCreatorActionTypeHelp = (
  <div>
    <div>
      This determines how much AP you must spend to use this Power. The less AP it takes to use, the
      more expensive the Power is.
    </div>
    <div>
      Outside of combat you cannot have an action longer than a Basic Action (2 AP). Innate Powers
      must be Basic Actions or Reactions.
    </div>
  </div>
);

export const powerCreatorReactionHelp =
  'Decide if this Power can be used as a reaction to some triggering event, such as being hit by an attack. Reaction Powers cost more.';

export const powerCreatorAttackHelp = (
  <div>
    <div>
      If you add a weapon to your Power, you may choose to make a Weapon Attack using that weapon as
      part of the same action to use the Power.
    </div>
    <div>
      You may also choose to have the Power affect that weapon and its attacks for the duration of
      the Power.
    </div>
  </div>
);

export const powerCreatorAreaHelp = (
  <div>
    <div>
      By default, a Power only affects one target or one space for its duration. Add an area of
      effect that applies to all Power parts and mechanics. Area-of-effect parts that would normally
      target Evasion target Reflex instead. Each creature in the area is a target of the Power — on
      your side or not — unless an area mechanic specifies otherwise.
    </div>
    <div>
      If you want the Power to last for a duration in an area, or on the targets who were initially
      affected, toggle <strong>Apply duration</strong>. Effects on targets initially affected apply
      at the start of those targets&apos; next turn after this. If the effect applies to an area,
      when a target first moves into the area or ends their turn there, they must re-make a defense
      roll against the original targeted defense(s) or be affected again.
    </div>
  </div>
);

export const powerCreatorDurationHelp = (
  <div>
    <div>
      Normally a Power has either an instantaneous or single-round effect that ends at the start of
      your next turn. You can increase the duration by picking an amount and unit of time (such as
      10 minutes).
    </div>
    <div>
      Only Parts and Mechanics with <strong>Apply duration</strong> toggled are considered to last
      for the Power&apos;s duration. Work with a friend or RM if duration is confusing for your
      table.
    </div>
  </div>
);

export const powerCreatorPartsHelp =
  'These are the payload of your Power — what the Power does. There are limitless options and you can combine them in many ways, but the best Powers often have only one to three parts.';

export const powerCreatorMechanicsHelp = (
  <div>
    <div>
      Power Mechanics are the <em>how</em> behind what a Power does.
    </div>
    <div>
      If your Power&apos;s Energy cost is too high, use mechanics in the <strong>Restriction</strong>{' '}
      category, which offer reduced cost with stipulations. Try other mechanics to customize
      further.
    </div>
  </div>
);

export const powerCreatorDamageHelp = (
  <div>
    <div>
      Choose a damage type, number of dice, and die size. Often using more dice of lower values is
      more expensive (for example, 2d6 over 1d12).
    </div>
    <div>
      This damage is dealt when the Power is used, not again each turn with duration, unless
      duration is in an area of effect instead of on a target. You can add multiple damage types.
    </div>
  </div>
);

export const powerCreatorEnergyHelp = (
  <div>
    <div>
      This is the cost of your Power — a rounded-up value from all Energy contributions of your
      Power Parts and Mechanics.
    </div>
    <div>
      See <strong>Advanced calculations</strong> below for each contribution.
    </div>
  </div>
);

export const powerCreatorInnateHelp = (
  <div>
    <div>
      A Power can be <strong>Innate</strong> if its Energy is at or below your{' '}
      <strong>Innate Threshold</strong> for your level and archetype (see character sheet). At level
      1: <strong>8</strong> for Power characters, <strong>6</strong> for Powered-Martial. Threshold
      increases by +1 every 3 levels starting at level 4.
    </div>
    <div>
      Innate Powers are usable without spending Energy from your pool (subject to innate pool
      limits).
    </div>
    <div>
      To qualify as an Innate Power it must be a <strong>Basic Action</strong> or{' '}
      <strong>Reaction</strong>, and cannot include Healing or Energy-gaining parts.
    </div>
  </div>
);

export const powerCreatorTrainingPointsHelp = (
  <div>
    <div>
      The sum of Training Point costs for each Part added to this Power.
    </div>
    <div>
      You may already have proficiency with some or all parts, so this total may not equal what you
      must spend to add the Power to your character.
    </div>
  </div>
);

export const powerCreatorLoadHelp =
  'Load any Power from your library or the Realms Library.';

export const powerCreatorResetHelp =
  'Remove all current parts, mechanics, and settings — start with a clean slate.';

/** Guided L1 placeholders — strings only; do not wire until TASK-411. */
export const guidedPowerCreatorPowerCharacterHelp =
  'A full Power archetype. Higher Innate Threshold at level 1 (8) and Power proficiency — not martial training.';

export const guidedPowerCreatorPoweredMartialHelp =
  'A split martial and power track. Lower Innate Threshold at level 1 (6) than a full Power character.';

export const guidedPowerCreatorAudienceHelp =
  'Selecting a character enables Innate Threshold filtering and Training Point context for this Power.';

export const guidedPowerCreatorInnateIntentHelp =
  'Innate Powers are usable without spending Energy when they qualify: Basic Action or Reaction, Energy at or below your Innate Threshold, and no Healing or Energy-gaining parts.';

export const guidedPowerCreatorCategoryHelp =
  'Maps to part categories such as Offense, Defense, Utility, and Control. Pick one primary category for this Power.';

