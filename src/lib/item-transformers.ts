/**
 * Item Transformers
 * =================
 * Transform raw database items into unified DisplayItem format
 * Consolidates display logic from various calculators and display functions
 */

import type { DisplayItem, TransformContext, ItemBadge, ItemStat, ItemDetail } from '@/types/items';
import { formatDamageDisplay, capitalize } from '@/lib/utils/string';
import { formatBonus } from '@/lib/utils/number';

// Helper: Format currency
export function formatCurrency(amount: number): string {
  // Format as simple currency value with 'c' unit
  if (amount >= 1) return `${amount}c`;
  if (amount >= 0.1) return `${(amount).toFixed(1)}c`;
  return `${(amount).toFixed(2)}c`;
}

// Legacy alias for backward compatibility
export const formatGold = formatCurrency;

// ===========================================
// POWER TRANSFORMER
// ===========================================
interface RawPower {
  id?: string;
  name: string;
  description?: string;
  cost?: number;
  action?: string;
  range?: string | number;
  area?: string;
  duration?: string;
  targets?: string;
  damage?: string;
  healing?: string;
  effects?: string[];
  parts?: string[];
  tags?: string[];
  school?: string;
}

export function transformPower(raw: RawPower, context?: TransformContext): DisplayItem {
  const stats: ItemStat[] = [];
  const details: ItemDetail[] = [];
  const badges: ItemBadge[] = [];

  // Cost
  if (raw.cost !== undefined) {
    stats.push({ label: 'Cost', value: `${raw.cost} PP` });
  }

  // Action
  if (raw.action) {
    stats.push({ label: 'Action', value: capitalize(raw.action) });
  }

  // Range
  if (raw.range) {
    stats.push({ label: 'Range', value: String(raw.range) });
  }

  // School badge
  if (raw.school) {
    badges.push({ label: capitalize(raw.school), variant: 'info' });
  }

  // Details for expanded view
  if (raw.area) {
    details.push({ label: 'Area', value: raw.area });
  }
  if (raw.duration) {
    details.push({ label: 'Duration', value: raw.duration });
  }
  if (raw.targets) {
    details.push({ label: 'Targets', value: raw.targets });
  }
  if (raw.damage) {
    const formattedDamage = formatDamageDisplay(raw.damage);
    if (formattedDamage) details.push({ label: 'Damage', value: formattedDamage });
  }
  if (raw.healing) {
    details.push({ label: 'Healing', value: raw.healing });
  }
  if (raw.effects?.length) {
    details.push({ label: 'Effects', value: raw.effects });
  }

  return {
    id: raw.id || raw.name,
    name: raw.name,
    description: raw.description,
    category: 'power',
    type: raw.school,
    cost: raw.cost,
    costLabel: 'PP',
    stats,
    details,
    badges,
    tags: raw.tags,
    isSelected: context?.selectedIds?.has(raw.id || raw.name),
    sourceData: { ...raw },
  };
}

// ===========================================
// TECHNIQUE TRANSFORMER
// ===========================================
interface RawTechnique {
  id?: string;
  name: string;
  description?: string;
  cost?: number;
  action?: string;
  range?: string | number;
  damage?: string;
  effects?: string[];
  parts?: string[];
  tags?: string[];
  type?: string;
  weaponType?: string;
}

export function transformTechnique(raw: RawTechnique, context?: TransformContext): DisplayItem {
  const stats: ItemStat[] = [];
  const details: ItemDetail[] = [];
  const badges: ItemBadge[] = [];

  // Cost
  if (raw.cost !== undefined) {
    stats.push({ label: 'Cost', value: `${raw.cost} TP` });
  }

  // Action
  if (raw.action) {
    stats.push({ label: 'Action', value: capitalize(raw.action) });
  }

  // Range
  if (raw.range) {
    stats.push({ label: 'Range', value: String(raw.range) });
  }

  // Type badge
  if (raw.type) {
    badges.push({ label: capitalize(raw.type), variant: 'primary' });
  }

  // Weapon type badge
  if (raw.weaponType) {
    badges.push({ label: raw.weaponType, variant: 'default' });
  }

  // Details
  if (raw.damage) {
    const formattedDamage = formatDamageDisplay(raw.damage);
    if (formattedDamage) details.push({ label: 'Damage', value: formattedDamage });
  }
  if (raw.effects?.length) {
    details.push({ label: 'Effects', value: raw.effects });
  }

  return {
    id: raw.id || raw.name,
    name: raw.name,
    description: raw.description,
    category: 'technique',
    type: raw.type,
    cost: raw.cost,
    costLabel: 'TP',
    stats,
    details,
    badges,
    tags: raw.tags,
    isSelected: context?.selectedIds?.has(raw.id || raw.name),
    sourceData: { ...raw },
  };
}

// ===========================================
// WEAPON TRANSFORMER
// ===========================================
interface RawWeapon {
  id?: string;
  name: string;
  description?: string;
  cost?: number;
  damage?: string;
  damageType?: string;
  range?: string | number;
  properties?: string[];
  type?: string;
  hands?: number;
  weight?: number;
}

export function transformWeapon(raw: RawWeapon, context?: TransformContext): DisplayItem {
  const stats: ItemStat[] = [];
  const details: ItemDetail[] = [];
  const badges: ItemBadge[] = [];

  // Damage
  if (raw.damage) {
    const formattedDamage = formatDamageDisplay(raw.damage);
    if (formattedDamage) stats.push({ label: 'Damage', value: formattedDamage });
  }

  // Damage type
  if (raw.damageType) {
    badges.push({ label: capitalize(raw.damageType), variant: 'warning' });
  }

  // Type
  if (raw.type) {
    badges.push({ label: capitalize(raw.type), variant: 'primary' });
  }

  // Range
  if (raw.range) {
    stats.push({ label: 'Range', value: String(raw.range) });
  }

  // Hands
  if (raw.hands) {
    stats.push({ label: 'Hands', value: raw.hands });
  }

  // Properties
  if (raw.properties?.length) {
    details.push({ label: 'Properties', value: raw.properties });
  }

  // Weight
  if (raw.weight) {
    details.push({ label: 'Weight', value: `${raw.weight} lb` });
  }

  return {
    id: raw.id || raw.name,
    name: raw.name,
    description: raw.description,
    category: 'weapon',
    type: raw.type,
    cost: raw.cost,
    costLabel: 'c',
    stats,
    details,
    badges,
    tags: raw.properties,
    isSelected: context?.selectedIds?.has(raw.id || raw.name),
    sourceData: { ...raw },
  };
}

// ===========================================
// ARMOR TRANSFORMER
// ===========================================
interface RawArmor {
  id?: string;
  name: string;
  description?: string;
  cost?: number;
  defense?: number;
  type?: string;
  properties?: string[];
  weight?: number;
  strengthReq?: number;
}

export function transformArmor(raw: RawArmor, context?: TransformContext): DisplayItem {
  const stats: ItemStat[] = [];
  const details: ItemDetail[] = [];
  const badges: ItemBadge[] = [];

  // Defense
  if (raw.defense !== undefined) {
    stats.push({ label: 'Defense', value: formatBonus(raw.defense) });
  }

  // Type
  if (raw.type) {
    badges.push({ label: capitalize(raw.type), variant: 'primary' });
  }

  // Properties
  if (raw.properties?.length) {
    details.push({ label: 'Properties', value: raw.properties });
  }

  // Weight
  if (raw.weight) {
    details.push({ label: 'Weight', value: `${raw.weight} lb` });
  }

  // Strength requirement
  if (raw.strengthReq) {
    details.push({ label: 'Str Req', value: raw.strengthReq });
  }

  return {
    id: raw.id || raw.name,
    name: raw.name,
    description: raw.description,
    category: 'armor',
    type: raw.type,
    cost: raw.cost,
    costLabel: 'c',
    stats,
    details,
    badges,
    tags: raw.properties,
    isSelected: context?.selectedIds?.has(raw.id || raw.name),
    sourceData: { ...raw },
  };
}

// ===========================================
// EQUIPMENT/GEAR TRANSFORMER
// ===========================================
interface RawEquipment {
  id?: string;
  name: string;
  description?: string;
  cost?: number;
  type?: string;
  category?: string;
  weight?: number;
  quantity?: number;
}

export function transformEquipment(raw: RawEquipment, context?: TransformContext): DisplayItem {
  const stats: ItemStat[] = [];
  const details: ItemDetail[] = [];
  const badges: ItemBadge[] = [];

  // Cost
  if (raw.cost !== undefined) {
    stats.push({ label: 'Cost', value: formatGold(raw.cost) });
  }

  // Type/Category badge
  if (raw.type) {
    badges.push({ label: capitalize(raw.type), variant: 'info' });
  }

  // Weight
  if (raw.weight) {
    details.push({ label: 'Weight', value: `${raw.weight} lb` });
  }

  return {
    id: raw.id || raw.name,
    name: raw.name,
    description: raw.description,
    category: 'equipment',
    type: raw.type || raw.category,
    cost: raw.cost,
    costLabel: 'c',
    stats,
    details,
    badges,
    isSelected: context?.selectedIds?.has(raw.id || raw.name),
    sourceData: { ...raw },
  };
}

// ===========================================
// FEAT TRANSFORMER
// ===========================================
interface RawFeat {
  id?: string;
  name: string;
  description?: string;
  category?: string;
  prerequisites?: string;
  benefit?: string;
  requirements?: {
    level?: number;
    abilities?: Record<string, number>;
    skills?: Record<string, number>;
    feats?: string[];
  };
}

export function transformFeat(raw: RawFeat, context?: TransformContext): DisplayItem {
  const stats: ItemStat[] = [];
  const details: ItemDetail[] = [];
  const badges: ItemBadge[] = [];
  const requirements: DisplayItem['requirements'] = [];

  // Category badge
  if (raw.category) {
    badges.push({ label: capitalize(raw.category), variant: 'primary' });
  }

  // Prerequisites text
  if (raw.prerequisites) {
    details.push({ label: 'Prerequisites', value: raw.prerequisites });
  }

  // Benefit
  if (raw.benefit) {
    details.push({ label: 'Benefit', value: raw.benefit });
  }

  // Check requirements against character
  if (raw.requirements?.level && context?.characterLevel !== undefined) {
    requirements.push({
      type: 'level',
      name: 'Level',
      value: raw.requirements.level,
      met: context.characterLevel >= raw.requirements.level,
    });
  }

  if (raw.requirements?.abilities && context?.characterAbilities) {
    for (const [ability, required] of Object.entries(raw.requirements.abilities)) {
      const current = context.characterAbilities[ability] || 0;
      requirements.push({
        type: 'ability',
        name: capitalize(ability),
        value: required,
        met: current >= required,
      });
    }
  }

  // Determine if feat is disabled
  const unmetRequirements = requirements.filter(r => !r.met);
  const isDisabled = unmetRequirements.length > 0;

  return {
    id: raw.id || raw.name,
    name: raw.name,
    description: raw.description || raw.benefit,
    category: 'feat',
    type: raw.category,
    details,
    badges,
    requirements,
    isSelected: context?.selectedIds?.has(raw.id || raw.name),
    isDisabled,
    disabledReason: isDisabled 
      ? `Missing: ${unmetRequirements.map(r => `${r.name} ${r.value}`).join(', ')}`
      : undefined,
    sourceData: { ...raw },
  };
}

// ===========================================
// SPECIES TRANSFORMER
// ===========================================
interface RawSpecies {
  id?: string;
  name: string;
  description?: string;
  type?: string; // Species type (Humanoid, Beast, etc.)
  size?: string;
  sizes?: string[];
  speed?: number;
  abilityBonuses?: Record<string, number>;
  traits?: string[];
  species_traits?: string[];
  ancestry_traits?: string[];
  flaws?: string[];
  characteristics?: string[];
  skills?: string[];
  languages?: string[];
  ave_height?: number;
  ave_weight?: number;
  adulthood_lifespan?: number[];
}

export function transformSpecies(raw: RawSpecies, context?: TransformContext): DisplayItem {
  const stats: ItemStat[] = [];
  const details: ItemDetail[] = [];
  const badges: ItemBadge[] = [];

  // Species type badge
  if (raw.type) {
    badges.push({ label: raw.type, variant: 'default' });
  }

  // Size badges - show all available sizes
  if (raw.sizes?.length) {
    raw.sizes.forEach(size => {
      badges.push({ label: capitalize(size), variant: 'info' });
    });
  } else if (raw.size) {
    badges.push({ label: capitalize(raw.size), variant: 'info' });
  }

  // Speed
  if (raw.speed) {
    stats.push({ label: 'Speed', value: `${raw.speed} ft` });
  }

  // Ability bonuses
  if (raw.abilityBonuses) {
    const bonusStr = Object.entries(raw.abilityBonuses)
      .map(([ability, bonus]) => `${capitalize(ability)} ${formatBonus(bonus)}`)
      .join(', ');
    if (bonusStr) {
      stats.push({ label: 'Abilities', value: bonusStr });
    }
  }

  // Physical stats
  if (raw.ave_height) {
    stats.push({ label: 'Avg Height', value: `${raw.ave_height} cm` });
  }
  if (raw.ave_weight) {
    stats.push({ label: 'Avg Weight', value: `${raw.ave_weight} kg` });
  }
  if (raw.adulthood_lifespan?.length === 2) {
    stats.push({ label: 'Adulthood', value: `${raw.adulthood_lifespan[0]} years` });
    stats.push({ label: 'Lifespan', value: `${raw.adulthood_lifespan[1]} years` });
  }

  // Species Traits
  if (raw.species_traits?.length) {
    details.push({ label: 'Species Traits', value: raw.species_traits });
  }

  // Ancestry Traits
  if (raw.ancestry_traits?.length) {
    details.push({ label: 'Ancestry Traits', value: raw.ancestry_traits });
  }

  // Flaws
  if (raw.flaws?.length) {
    details.push({ label: 'Flaws', value: raw.flaws });
  }

  // Characteristics
  if (raw.characteristics?.length) {
    details.push({ label: 'Characteristics', value: raw.characteristics });
  }

  // Skills
  if (raw.skills?.length) {
    details.push({ label: 'Skills', value: raw.skills });
  }

  // Traits (general)
  if (raw.traits?.length) {
    details.push({ label: 'Traits', value: raw.traits });
  }

  // Languages
  if (raw.languages?.length) {
    details.push({ label: 'Languages', value: raw.languages });
  }

  return {
    id: raw.id || raw.name,
    name: raw.name,
    description: raw.description,
    category: 'species',
    type: raw.type || raw.sizes?.join(', ') || raw.size, // Use type or sizes for filtering
    stats,
    details,
    badges,
    tags: raw.traits,
    isSelected: context?.selectedIds?.has(raw.id || raw.name),
    sourceData: { ...raw },
  };
}

// ===========================================
// SKILL TRANSFORMER
// ===========================================
interface RawSkill {
  id?: string;
  name: string;
  description?: string;
  ability?: string;
  category?: string;
  trained?: boolean;
}

export function transformSkill(raw: RawSkill, context?: TransformContext): DisplayItem {
  const stats: ItemStat[] = [];
  const badges: ItemBadge[] = [];

  // Linked ability
  if (raw.ability) {
    badges.push({ label: raw.ability.toUpperCase().slice(0, 3), variant: 'info' });
  }

  // Category
  if (raw.category) {
    badges.push({ label: capitalize(raw.category), variant: 'default' });
  }

  // Trained-only indicator
  if (raw.trained) {
    badges.push({ label: 'Trained Only', variant: 'warning' });
  }

  return {
    id: raw.id || raw.name,
    name: raw.name,
    description: raw.description,
    category: 'skill',
    type: raw.ability,
    badges,
    isSelected: context?.selectedIds?.has(raw.id || raw.name),
    sourceData: { ...raw },
  };
}

// ===========================================
// PROPERTY TRANSFORMER (Item Properties)
// ===========================================
interface RawProperty {
  id?: string;
  name: string;
  description?: string;
  type?: string;
  costModifier?: number;
  effect?: string;
}

export function transformProperty(raw: RawProperty): DisplayItem {
  const stats: ItemStat[] = [];
  const badges: ItemBadge[] = [];
  const details: ItemDetail[] = [];

  // Type badge
  if (raw.type) {
    badges.push({ label: capitalize(raw.type), variant: 'primary' });
  }

  // Cost modifier
  if (raw.costModifier !== undefined && raw.costModifier !== 0) {
    stats.push({ 
      label: 'Cost Mod', 
      value: formatBonus(raw.costModifier) 
    });
  }

  // Effect
  if (raw.effect) {
    details.push({ label: 'Effect', value: raw.effect });
  }

  return {
    id: raw.id || raw.name,
    name: raw.name,
    description: raw.description || raw.effect,
    category: 'property',
    type: raw.type,
    stats,
    badges,
    details,
    sourceData: { ...raw },
  };
}

// ===========================================
// PART TRANSFORMER (Power/Technique Parts for Codex)
// ===========================================
interface RawPart {
  id?: string;
  name: string;
  description?: string;
  type?: 'power' | 'technique' | string;
  category?: string;
  // Base costs
  base_en?: number;
  base_tp?: number;
  // Options (up to 3)
  op_1_desc?: string;
  op_1_en?: number;
  op_1_tp?: number;
  op_2_desc?: string;
  op_2_en?: number;
  op_2_tp?: number;
  op_3_desc?: string;
  op_3_en?: number;
  op_3_tp?: number;
  // Flags
  percentage?: boolean;
  mechanic?: boolean;
}

export function transformPart(raw: RawPart): DisplayItem {
  const stats: ItemStat[] = [];
  const badges: ItemBadge[] = [];
  const details: ItemDetail[] = [];

  // Type/Category badges
  if (raw.type) {
    badges.push({ 
      label: capitalize(raw.type), 
      variant: raw.type.toLowerCase() === 'power' ? 'info' : 'warning' 
    });
  }
  if (raw.category && raw.category !== raw.type) {
    badges.push({ label: capitalize(raw.category), variant: 'default' });
  }
  
  // Flags as badges
  if (raw.mechanic) {
    badges.push({ label: 'Mechanic', variant: 'primary' });
  }
  if (raw.percentage) {
    badges.push({ label: 'Percentage', variant: 'primary' });
  }

  // Base costs
  if (raw.base_en !== undefined && raw.base_en !== 0) {
    stats.push({ label: 'Base EN', value: raw.base_en });
  }
  if (raw.base_tp !== undefined && raw.base_tp !== 0) {
    stats.push({ label: 'Base TP', value: raw.base_tp });
  }

  // Options (add to details for expanded view)
  if (raw.op_1_desc) {
    details.push({ 
      label: 'Option 1', 
      value: `${raw.op_1_desc} (EN: ${raw.op_1_en || 0}, TP: ${raw.op_1_tp || 0})` 
    });
  }
  if (raw.op_2_desc) {
    details.push({ 
      label: 'Option 2', 
      value: `${raw.op_2_desc} (EN: ${raw.op_2_en || 0}, TP: ${raw.op_2_tp || 0})` 
    });
  }
  if (raw.op_3_desc) {
    details.push({ 
      label: 'Option 3', 
      value: `${raw.op_3_desc} (EN: ${raw.op_3_en || 0}, TP: ${raw.op_3_tp || 0})` 
    });
  }

  return {
    id: raw.id || raw.name,
    name: raw.name,
    description: raw.description,
    category: raw.category || 'part', // Part's category (e.g., 'Elemental', 'Buff')
    type: raw.type, // 'power' or 'technique'
    cost: (raw.base_en || 0) + (raw.base_tp || 0), // Combined cost for sorting
    stats,
    badges,
    details,
    sourceData: { ...raw },
  };
}

// ===========================================
// CREATURE TRANSFORMER
// ===========================================
interface RawCreature {
  id?: string;
  name: string;
  description?: string;
  level?: number;
  type?: string;
  size?: string;
  // Core stats - support both old and new field names
  hp?: number;
  hitPoints?: number;
  energyPoints?: number;
  defense?: number;
  abilities?: Record<string, number>;
  defenses?: Record<string, number>;
  // Proficiencies
  powerProficiency?: number;
  martialProficiency?: number;
  // Damage modifiers
  resistances?: string[];
  weaknesses?: string[];
  immunities?: string[];
  conditionImmunities?: string[];
  // Movement and senses
  senses?: string[];
  movementTypes?: string[];
  languages?: string[];
  // Skills
  skills?: Array<{ name: string; value: number; proficient?: boolean }> | Record<string, number>;
  // Combat
  powers?: unknown[];
  techniques?: unknown[];
  feats?: unknown[];
  armaments?: unknown[];
  // Legacy
  attacks?: unknown[];
  traits?: string[];
}

export function transformCreature(raw: RawCreature, context?: TransformContext): DisplayItem {
  const stats: ItemStat[] = [];
  const badges: ItemBadge[] = [];
  const details: ItemDetail[] = [];

  // Level
  if (raw.level !== undefined) {
    stats.push({ label: 'Level', value: raw.level });
  }

  // HP - support both old 'hp' and new 'hitPoints' field names
  const hitPoints = raw.hitPoints ?? raw.hp;
  if (hitPoints !== undefined) {
    stats.push({ label: 'HP', value: hitPoints });
  }

  // Energy
  if (raw.energyPoints !== undefined && raw.energyPoints > 0) {
    stats.push({ label: 'EP', value: raw.energyPoints });
  }

  // Type badge
  if (raw.type) {
    badges.push({ label: capitalize(raw.type), variant: 'primary' });
  }

  // Size badge
  if (raw.size) {
    badges.push({ label: capitalize(raw.size), variant: 'info' });
  }

  // Abilities - format as stat block
  if (raw.abilities) {
    const abilityStr = Object.entries(raw.abilities)
      .map(([ability, value]) => {
        const sign = value >= 0 ? '+' : '';
        return `${ability.slice(0, 3).toUpperCase()} ${sign}${value}`;
      })
      .join(', ');
    details.push({ label: 'Abilities', value: abilityStr });
  }

  // Defenses
  if (raw.defenses) {
    const defenseStr = Object.entries(raw.defenses)
      .filter(([, value]) => value !== 0)
      .map(([def, value]) => {
        // Shorten defense names
        const shortNames: Record<string, string> = {
          might: 'Mgt',
          fortitude: 'Fort',
          reflex: 'Ref',
          discernment: 'Dis',
          mentalFortitude: 'MF',
          resolve: 'Res',
        };
        const name = shortNames[def] || capitalize(def.slice(0, 3));
        return `${name} +${value}`;
      })
      .join(', ');
    if (defenseStr) {
      details.push({ label: 'Defense Bonuses', value: defenseStr });
    }
  }

  // Proficiencies
  const profs = [];
  if (raw.powerProficiency) profs.push(`Power +${raw.powerProficiency}`);
  if (raw.martialProficiency) profs.push(`Martial +${raw.martialProficiency}`);
  if (profs.length > 0) {
    details.push({ label: 'Proficiency', value: profs.join(', ') });
  }

  // Resistances, Weaknesses, Immunities
  if (raw.resistances?.length) {
    details.push({ label: 'Resistances', value: raw.resistances.join(', ') });
  }
  if (raw.weaknesses?.length) {
    details.push({ label: 'Weaknesses', value: raw.weaknesses.join(', ') });
  }
  if (raw.immunities?.length) {
    details.push({ label: 'Immunities', value: raw.immunities.join(', ') });
  }
  if (raw.conditionImmunities?.length) {
    details.push({ label: 'Condition Immunities', value: raw.conditionImmunities.join(', ') });
  }

  // Senses and Movement
  if (raw.senses?.length) {
    details.push({ label: 'Senses', value: raw.senses.join(', ') });
  }
  if (raw.movementTypes?.length) {
    details.push({ label: 'Movement', value: raw.movementTypes.join(', ') });
  }
  if (raw.languages?.length) {
    details.push({ label: 'Languages', value: raw.languages.join(', ') });
  }

  // Skills
  if (raw.skills) {
    let skillStr = '';
    if (Array.isArray(raw.skills)) {
      skillStr = raw.skills
        .filter(s => s.value !== 0 || s.proficient)
        .map(s => `${s.name} ${s.value >= 0 ? '+' : ''}${s.value}${s.proficient ? '*' : ''}`)
        .join(', ');
    } else {
      skillStr = Object.entries(raw.skills)
        .filter(([, value]) => value !== 0)
        .map(([skill, value]) => `${skill} +${value}`)
        .join(', ');
    }
    if (skillStr) {
      details.push({ label: 'Skills', value: skillStr });
    }
  }

  // Combat abilities summary
  const combatSummary = [];
  if (raw.powers && Array.isArray(raw.powers) && raw.powers.length > 0) {
    combatSummary.push(`${raw.powers.length} power(s)`);
  }
  if (raw.techniques && Array.isArray(raw.techniques) && raw.techniques.length > 0) {
    combatSummary.push(`${raw.techniques.length} technique(s)`);
  }
  if (raw.armaments && Array.isArray(raw.armaments) && raw.armaments.length > 0) {
    combatSummary.push(`${raw.armaments.length} armament(s)`);
  }
  if (raw.feats && Array.isArray(raw.feats) && raw.feats.length > 0) {
    combatSummary.push(`${raw.feats.length} feat(s)`);
  }
  if (combatSummary.length > 0) {
    details.push({ label: 'Combat', value: combatSummary.join(', ') });
  }

  // Legacy traits support
  if (raw.traits?.length) {
    details.push({ label: 'Traits', value: raw.traits });
  }

  return {
    id: raw.id || raw.name,
    name: raw.name,
    description: raw.description,
    category: 'creature',
    type: raw.type,
    stats,
    badges,
    details,
    tags: raw.traits,
    isSelected: context?.selectedIds?.has(raw.id || raw.name),
    sourceData: { ...raw },
  };
}
