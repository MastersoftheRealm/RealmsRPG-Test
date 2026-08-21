'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils/cn';
import { GridListRow } from './grid-list-row';
import type { ColumnValue } from '@/components/patterns/list/grid-list-row';
import { resolveListRowThumbnail } from '@/lib/list-row-image';
import { useRollsOptional } from '@/components/rolls';
import {
  useCodexSkills,
  usePowerParts,
  useTechniqueParts,
  useItemProperties,
  useOfficialLibrary,
  useUserPowers,
  useUserTechniques,
  useGameRules,
} from '@/hooks';
import { calculateCreatureMaxHealth, calculateCreatureMaxEnergy } from '@/lib/game/encounter-utils';
import { calculateCreatureSpeed, calculateEvasion } from '@/lib/game/calculations';
import { CREATURE_STAT_BLOCK_GRID } from '@/lib/library/official-creature-list';
import { formatCreatureLevel, formatCreatureLevelLabel } from '@/lib/game';
import { formatListCellLabel } from '@/lib/utils';
import type { Abilities } from '@/types';
import {
  collectCreatureInventoryItems,
  resolveCreatureInventoryBuckets,
} from '@/lib/game/creature-inventory';

export type {
  CreatureAbilities,
  CreatureDefenses,
  CreatureData,
  CreatureStatBlockArmament,
  CreatureStatBlockProps,
} from './creature-stat-block-types';

import type { CreatureStatBlockProps } from './creature-stat-block-types';
import {
  REALMS_ABILITY_ORDER,
  DEFENSES_BY_ABILITY,
  formatArchetype,
  formatModifier,
  getAbilityValue,
  compactLine,
} from './creature-stat-block-helpers';
import {
  buildPowersForDisplay,
  buildTechniquesForDisplay,
  buildSkillRows,
} from './creature-stat-block-display-data';
import { CreatureStatBlockExpandedContent } from './creature-stat-block-panels';

export function CreatureStatBlock({
  creature,
  onEdit,
  onDelete,
  onDuplicate,
  onAddToLibrary,
  rightSlot,
  rowChrome,
  warningMessage,
  badges,
  showActions = true,
  expanded: initialExpanded = false,
  className,
}: CreatureStatBlockProps) {
  const rollContext = useRollsOptional();
  const { data: skillsDb = [] } = useCodexSkills();
  const { data: powerPartsDb = [] } = usePowerParts();
  const { data: techniquePartsDb = [] } = useTechniqueParts();
  const { data: itemPropertiesDb = [] } = useItemProperties();
  const { data: userPowers = [] } = useUserPowers();
  const { data: officialPowers = [] } = useOfficialLibrary('powers');
  const { data: userTechniques = [] } = useUserTechniques();
  const { data: officialTechniques = [] } = useOfficialLibrary('techniques');
  const { rules } = useGameRules();
  const level = creature.level ?? 1;
  const abilitiesRecord = creature.abilities ?? {};
  /** Normalized Realms abilities (legacy keys via getAbilityValue) for shared weapon attack math. */
  const attackAbilities: Abilities = {
    strength: getAbilityValue(abilitiesRecord, 'strength'),
    vitality: getAbilityValue(abilitiesRecord, 'vitality'),
    agility: getAbilityValue(abilitiesRecord, 'agility'),
    acuity: getAbilityValue(abilitiesRecord, 'acuity'),
    intelligence: getAbilityValue(abilitiesRecord, 'intelligence'),
    charisma: getAbilityValue(abilitiesRecord, 'charisma'),
  };
  const hpAlloc = creature.hitPoints ?? creature.hp ?? 0;
  const enAlloc = creature.energyPoints ?? 0;
  const maxHpDisplay = calculateCreatureMaxHealth(level, abilitiesRecord, hpAlloc);
  const maxEnDisplay = calculateCreatureMaxEnergy(level, abilitiesRecord, enAlloc);
  const archetype = formatArchetype(creature.powerProficiency, creature.martialProficiency);
  const subline = `${formatCreatureLevelLabel(creature.level ?? 1)} ${creature.size ? formatListCellLabel(creature.size) : 'Medium'} ${formatListCellLabel(creature.type ?? 'creature')}`;

  const highestAbility = useMemo(() => {
    const abilities = creature.abilities ?? {};
    const entries = REALMS_ABILITY_ORDER.map((k) => ({
      key: k,
      val: getAbilityValue(abilities, k),
    }));
    entries.sort((a, b) => b.val - a.val);
    const top = entries[0] ?? { key: 'strength' as const, val: 0 };
    const keyName = top.key;
    const displayName = keyName.charAt(0).toUpperCase() + keyName.slice(1);
    return { key: keyName, value: top.val, displayName };
  }, [creature.abilities]);

  const defensesSentence = (() => {
    const defs = creature.defenses ?? {};
    const parts = DEFENSES_BY_ABILITY.map((d) => ({
      ...d,
      bonus: typeof defs[d.defenseKey] === 'number' ? (defs[d.defenseKey] as number) : 0,
    }))
      .filter((d) => d.bonus !== 0)
      .map(
        (d) =>
          `${d.label} ${formatModifier(getAbilityValue(creature.abilities ?? {}, d.ability) + d.bonus)}`,
      );
    return parts.length ? `Defenses ${parts.join(', ')}` : null;
  })();

  const agility = getAbilityValue(creature.abilities ?? {}, 'agility');
  const speed = calculateCreatureSpeed(agility, rules);
  const evasion = calculateEvasion(agility, undefined, rules);

  const inventory = useMemo(() => resolveCreatureInventoryBuckets(creature), [creature]);
  const weapons = inventory.weapons;
  const shields = inventory.shields;
  const armor = inventory.armor;
  const equipment = inventory.equipment;
  const armaments = collectCreatureInventoryItems(inventory);

  const senses = creature.senses ?? [];
  const movement = creature.movementTypes ?? [];
  const hasSensesOrMovement = senses.length > 0 || movement.length > 0;
  const creatureSkills = useMemo(() => {
    if (!creature.skills)
      return [] as Array<{
        id?: string | undefined;
        name: string;
        value: number;
        proficient: boolean;
        baseSkillId?: string | undefined;
        isSubSkill?: boolean | undefined;
      }>;
    if (Array.isArray(creature.skills)) {
      return creature.skills.map((s) => ({ ...s, proficient: s.proficient !== false }));
    }
    // Record fallback: treat as proficient base skills with value
    return Object.entries(creature.skills).map(([name, value]) => ({
      id: undefined,
      name,
      value: Number(value) || 0,
      proficient: true,
    }));
  }, [creature.skills]);
  const hasSkills = creatureSkills.length > 0;
  const hasFeats = (creature.feats ?? []).length > 0;
  const hasWeapons = weapons.length > 0;
  const hasShields = shields.length > 0;
  const hasArmor = armor.length > 0;
  const hasPowers = (creature.powers ?? []).length > 0;
  const hasTechniques = (creature.techniques ?? []).length > 0;
  const hasEquipment = equipment.length > 0;

  const powersForDisplay = useMemo(
    () => buildPowersForDisplay(creature, userPowers, officialPowers, powerPartsDb),
    [creature, officialPowers, powerPartsDb, userPowers],
  );

  const techniquesForDisplay = useMemo(
    () => buildTechniquesForDisplay(creature, userTechniques, officialTechniques, techniquePartsDb),
    [creature, officialTechniques, techniquePartsDb, userTechniques],
  );

  const damageReduction = useMemo(() => {
    return armaments.reduce((sum, item) => {
      if (typeof item.damageReduction === 'number') return sum + item.damageReduction;
      if (typeof item.armorValue === 'number') return sum + item.armorValue;
      const props = item.properties || [];
      const dr = props.find(
        (p) => p.id === 17 || String(p.name ?? '').toLowerCase() === 'damage reduction',
      );
      return sum + (dr ? 1 + (dr.op_1_lvl ?? 0) : 0);
    }, 0);
  }, [armaments]);

  const summaryLines = [
    compactLine('Resistances', creature.resistances),
    compactLine('Weaknesses', creature.weaknesses),
    compactLine('Immunities', creature.immunities),
    compactLine('Languages', creature.languages),
    defensesSentence,
  ].filter((line): line is string => Boolean(line));

  const headerColumns: ColumnValue[] = [
    { key: 'level', value: formatCreatureLevel(creature.level ?? 1), align: 'center' },
    { key: 'size', value: formatListCellLabel(creature.size), align: 'center' },
    { key: 'type', value: formatListCellLabel(creature.type), align: 'center' },
    {
      key: 'archetype',
      value: formatListCellLabel(archetype),
      align: 'center',
      className:
        archetype === 'Power'
          ? 'text-power-fg'
          : archetype === 'Martial'
            ? 'text-martial-fg'
            : archetype === 'Powered-Martial'
              ? 'text-power-fg'
              : undefined,
    },
    { key: 'hp', value: maxHpDisplay, align: 'center', highlight: true },
    { key: 'en', value: maxEnDisplay, align: 'center' },
  ];

  const skillRows = useMemo(
    () => buildSkillRows(creature, creatureSkills, skillsDb),
    [creature, creatureSkills, skillsDb],
  );

  const listThumbnail = resolveListRowThumbnail(
    'creature',
    { image_url: creature.imageUrl ?? null },
    creature.name,
  );

  return (
    <GridListRow
      id={creature.id}
      name={creature.name}
      description={subline}
      thumbnail={listThumbnail}
      columns={headerColumns}
      gridColumns={CREATURE_STAT_BLOCK_GRID}
      onEdit={showActions ? onEdit : undefined}
      onDelete={showActions ? onDelete : undefined}
      onDuplicate={showActions ? onDuplicate : undefined}
      onAddToLibrary={onAddToLibrary}
      rightSlot={rightSlot}
      rowChrome={rowChrome}
      warningMessage={warningMessage}
      badges={badges}
      defaultExpanded={initialExpanded}
      className={cn('border-border-light', className)}
      expandedContent={
        <CreatureStatBlockExpandedContent
          creature={creature}
          subline={subline}
          archetype={archetype}
          highestAbility={highestAbility}
          speed={speed}
          evasion={evasion}
          maxHpDisplay={maxHpDisplay}
          maxEnDisplay={maxEnDisplay}
          summaryLines={summaryLines}
          damageReduction={damageReduction}
          rollContext={rollContext}
          attackAbilities={attackAbilities}
          itemPropertiesDb={itemPropertiesDb}
          senses={senses}
          movement={movement}
          hasSensesOrMovement={hasSensesOrMovement}
          skillRows={skillRows}
          hasSkills={hasSkills}
          hasFeats={hasFeats}
          hasWeapons={hasWeapons}
          hasShields={hasShields}
          hasArmor={hasArmor}
          hasPowers={hasPowers}
          hasTechniques={hasTechniques}
          hasEquipment={hasEquipment}
          weapons={weapons}
          shields={shields}
          armor={armor}
          equipment={equipment}
          powersForDisplay={powersForDisplay}
          techniquesForDisplay={techniquesForDisplay}
        />
      }
    />
  );
}
