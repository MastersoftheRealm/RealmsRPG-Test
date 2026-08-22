/**
 * Creature Creator — editor section islands (TASK-381 Phase 4; TASK-610 splits)
 * ===========================================================
 * Presentational form sections. State, stats, save/load, modals, and
 * CreatorPageShell stay in page.tsx.
 */

'use client';

import type { ReactNode } from 'react';
import { SkillsAllocationPage, InfoTippy, RealmsImageField } from '@/components/patterns';
import { subSkillsHelp } from '../../../../public/tooltip-text';
import { Input, Select, Textarea, Card } from '@/components/ui';
import { HealthEnergyAllocator, AbilityScoreEditor, ArchetypeSelector } from '@/components/creator';
import type { AbilityName } from '@/types';
import type { Feat } from '@/hooks';
import type { SortState } from '@/components/patterns/list/list-header';
import type { CreatureState } from './creature-creator-types';
import type { CreatureFeat } from './transformers';
import type { CreatureInventoryTab } from './creature-creator-library-selectables';
import { CREATURE_TYPE_OPTIONS } from './creature-creator-constants';
import { CREATURE_LEVEL_SELECT_OPTIONS } from '@/lib/game';
import { CREATURE_SIZES } from '@/lib/game/creator-constants';
import { CreatureCreatorEditorTraitsSection } from './creature-creator-editor-traits-section';
import { CreatureCreatorEditorLoadoutSections } from './creature-creator-editor-loadout-sections';

const EMPTY_SPECIES_SKILL_IDS = new Set<string>();

export type CreatureCreatorStatsSlice = {
  maxProficiencyPoints: number;
  hePool: number;
  maxHealth: number;
  maxEnergy: number;
  abilityPoints: number;
  resistanceFeatCost: number;
  weaknessFeatCost: number;
  immunityFeatCost: number;
  conditionImmunityFeatCost: number;
  featSpent: number;
  featPoints: number;
  currencyRemaining: number;
  currency: number;
  currencySpent: number;
};

export type CreatureCreatorEditorProps = {
  isAdmin: boolean;
  creature: CreatureState;
  creatureLevel: number;
  stats: CreatureCreatorStatsSlice;
  skillPointsHelp: ReactNode;
  skillAllocations: Record<string, number>;
  senseDescriptions: Record<string, string>;
  movementDescriptions: Record<string, string>;
  getSenseCostLabel: (sense: string) => string | undefined;
  getMovementCostLabel: (movement: string) => string | undefined;
  featsSummary: string;
  powersSummary: string;
  techniquesSummary: string;
  armamentsSummary: string;
  featSort: SortState;
  onFeatSort: (key: string) => void;
  sortedFeats: Array<
    CreatureFeat & {
      typeLabel: string;
      levelMeta?:
        | {
            family: Feat[];
            currentLevel: number;
            minLevel: number;
            maxQualified: number;
          }
        | undefined;
    }
  >;
  armamentSort: SortState;
  onArmamentSort: (key: string) => void;
  sortedArmaments: Array<{
    id: string;
    name: string;
    type: string;
    range: string;
    attack: string;
    damage: string;
    block: string;
    damageReduction: string;
    criticalRangeIncrease: string;
    tp: number | string;
    currency: string;
    quantity?: number | undefined;
    image_id?: string | null | undefined;
    image_url?: string | null | undefined;
  }>;
  updateCreature: (updates: Partial<CreatureState>) => void;
  updateAbility: (ability: AbilityName, value: number) => void;
  addToArray: (field: keyof CreatureState, item: string) => void;
  removeFromArray: (field: keyof CreatureState, item: string) => void;
  onSkillAllocationsChange: (next: Record<string, number>) => void;
  onDefenseChange: (defense: CreatureState['defenses']) => void;
  onCreatureFeatLevelChange: (featId: string, level: number) => void;
  onRemoveFeat: (featId: string) => void;
  onTogglePowerInnate: (powerId: string) => void;
  onRemovePower: (powerId: string) => void;
  onRemoveTechnique: (techniqueId: string) => void;
  onRemoveArmament: (armamentId: string) => void;
  onOpenFeatModal: () => void;
  onOpenPowerModal: () => void;
  onOpenTechniqueModal: () => void;
  onOpenArmamentModal: (tab?: CreatureInventoryTab) => void;
};

export function CreatureCreatorEditor(props: CreatureCreatorEditorProps) {
  const {
    isAdmin,
    creature,
    creatureLevel,
    stats,
    skillPointsHelp,
    skillAllocations,
    onSkillAllocationsChange,
    onDefenseChange,
    updateCreature,
    updateAbility,
  } = props;

  return (
    <>
      <Card className="p-6 shadow-md">
        <h2 className="mb-4 text-lg font-bold text-text-primary">Basic Information</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Name</label>
            <Input
              type="text"
              value={creature.name}
              onChange={(e) => updateCreature({ name: e.target.value })}
              placeholder="Creature name..."
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Description
            </label>
            <Textarea
              value={creature.description}
              onChange={(e) => updateCreature({ description: e.target.value })}
              placeholder="Describe this creature's appearance, behavior, and special abilities..."
              rows={3}
            />
          </div>
          {isAdmin && (
            <RealmsImageField
              categories="creature"
              imageId={creature.imageId}
              imageUrl={creature.imageUrl}
              onChange={({ imageId, imageUrl }) => updateCreature({ imageId, imageUrl })}
              entityName={creature.name}
              label="Creature card art"
              hint="Uploads are saved to the shared image bank."
            />
          )}
          <div className="grid min-w-0 grid-cols-3 gap-2 sm:gap-4">
            <Select
              label="Level"
              value={String(creature.level)}
              onChange={(e) => updateCreature({ level: parseFloat(e.target.value) })}
              options={CREATURE_LEVEL_SELECT_OPTIONS}
            />
            <Select
              label="Type"
              value={creature.type}
              onChange={(e) => updateCreature({ type: e.target.value })}
              options={CREATURE_TYPE_OPTIONS}
            />
            <Select
              label="Size"
              value={creature.size}
              onChange={(e) => updateCreature({ size: e.target.value })}
              options={CREATURE_SIZES.map((s: { value: string; label: string }) => ({
                value: s.value,
                label: s.label,
              }))}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6 shadow-md">
        <h2 className="mb-4 text-lg font-bold text-text-primary">Archetype</h2>
        <ArchetypeSelector
          value={creature.archetypeType}
          powerProficiency={creature.powerProficiency}
          martialProficiency={creature.martialProficiency}
          maxProficiency={stats.maxProficiencyPoints}
          onTypeChange={(type) => updateCreature({ archetypeType: type })}
          onProficiencyChange={(power, martial) =>
            updateCreature({
              powerProficiency: power,
              martialProficiency: martial,
            })
          }
        />
      </Card>

      <Card className="p-6 shadow-md">
        <h2 className="mb-4 text-lg font-bold text-text-primary">Health & Energy</h2>
        <HealthEnergyAllocator
          hpBonus={creature.hitPoints}
          energyBonus={creature.energyPoints}
          poolTotal={stats.hePool}
          maxHp={stats.maxHealth}
          maxEnergy={stats.maxEnergy}
          onHpChange={(val) => updateCreature({ hitPoints: val })}
          onEnergyChange={(val) => updateCreature({ energyPoints: val })}
          enableHoldRepeat
        />
      </Card>

      <Card className="p-6 shadow-md">
        <h2 className="mb-4 text-lg font-bold text-text-primary">Abilities</h2>
        <AbilityScoreEditor
          abilities={creature.abilities}
          totalPoints={stats.abilityPoints}
          onAbilityChange={updateAbility}
          maxAbility={7}
          minAbility={-4}
          maxNegativeSum={null}
          isEditMode={true}
          compact={true}
          useHighAbilityCost={true}
        />
      </Card>

      <SkillsAllocationPage
        entityType="creature"
        level={creatureLevel}
        abilities={creature.abilities}
        allocations={skillAllocations}
        defenseSkills={creature.defenses}
        speciesSkillIds={EMPTY_SPECIES_SKILL_IDS}
        onAllocationsChange={onSkillAllocationsChange}
        onDefenseChange={onDefenseChange}
        className="max-w-none"
        headingAddon={<InfoTippy content={skillPointsHelp} label="Skill allocation help" />}
        addSubSkillAddon={
          <InfoTippy content={subSkillsHelp} label="Sub-skill help" placement="top" />
        }
      />

      <CreatureCreatorEditorTraitsSection {...props} />
      <CreatureCreatorEditorLoadoutSections {...props} />
    </>
  );
}
