/**
 * Creature Creator — editor section islands (TASK-381 Phase 4)
 * ===========================================================
 * Presentational form sections. State, stats, save/load, modals, and
 * CreatorPageShell stay in page.tsx.
 */

'use client';

import { useState, type ReactNode } from 'react';
import { cn, formatListCellLabel } from '@/lib/utils';
import {
  GridListRow,
  ListHeader,
  InnateToggle,
  SkillsAllocationPage,
  ValueStepper,
  InfoTippy,
  RealmsImageField,
} from '@/components/shared';
import { resolveListRowThumbnail } from '@/lib/list-row-image';
import { subSkillsHelp } from '../../../../public/tooltip-text';
import { Button, Input, Select, Textarea, IconButton, Card } from '@/components/ui';
import { X } from 'lucide-react';
import {
  HealthEnergyAllocator,
  AbilityScoreEditor,
  ArchetypeSelector,
  CollapsibleSection,
} from '@/components/creator';
import type { AbilityName } from '@/types';
import type { Feat } from '@/hooks';
import { buildFeatLevelChips } from '@/lib/leveled-feats';
import type { SortState } from '@/components/shared/list-header';
import type { CreatureState } from './creature-creator-types';
import type { CreatureFeat } from './transformers';
import {
  LEVEL_OPTIONS,
  CREATURE_TYPE_OPTIONS,
  DAMAGE_TYPES,
  SENSES,
  MOVEMENT_TYPES,
} from './creature-creator-constants';
import { CREATURE_SIZES, CONDITIONS } from '@/lib/game/creator-constants';
import {
  ChipList,
  ExpandableChipList,
  AddItemDropdown,
} from './CreatureCreatorHelpers';

const CREATURE_FEAT_LIST_GRID = '1.15fr 0.58fr 0.52fr 0.4fr 40px';
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
  abilityDefenseBonuses: {
    might: number;
    fortitude: number;
    reflex: number;
    discernment: number;
    mentalFortitude: number;
    resolve: number;
  };
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
      levelMeta?: {
        family: Feat[];
        currentLevel: number;
        minLevel: number;
        maxQualified: number;
      };
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
    tp: number | string;
    currency: string;
    image_id?: string | null;
    image_url?: string | null;
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
  onOpenArmamentModal: () => void;
};

export function CreatureCreatorEditor({
  isAdmin,
  creature,
  creatureLevel,
  stats,
  skillPointsHelp,
  skillAllocations,
  abilityDefenseBonuses,
  senseDescriptions,
  movementDescriptions,
  getSenseCostLabel,
  getMovementCostLabel,
  featsSummary,
  powersSummary,
  techniquesSummary,
  armamentsSummary,
  featSort,
  onFeatSort,
  sortedFeats,
  armamentSort,
  onArmamentSort,
  sortedArmaments,
  updateCreature,
  updateAbility,
  addToArray,
  removeFromArray,
  onSkillAllocationsChange,
  onDefenseChange,
  onCreatureFeatLevelChange,
  onRemoveFeat,
  onTogglePowerInnate,
  onRemovePower,
  onRemoveTechnique,
  onRemoveArmament,
  onOpenFeatModal,
  onOpenPowerModal,
  onOpenTechniqueModal,
  onOpenArmamentModal,
}: CreatureCreatorEditorProps) {
  const [newLanguage, setNewLanguage] = useState('');

  const addLanguage = () => {
    if (newLanguage.trim() && !creature.languages.includes(newLanguage.trim())) {
      addToArray('languages', newLanguage.trim());
      setNewLanguage('');
    }
  };

  const handleFeatSort = onFeatSort;
  const handleArmamentSort = onArmamentSort;
  const handleSkillAllocationsChange = onSkillAllocationsChange;
  const handleDefenseSkillsChange = onDefenseChange;
  const handleCreatureFeatLevelChange = onCreatureFeatLevelChange;

  return (
    <>
      {/* Basic Info - name, description, level, type, size (matches other creators) */}
      <Card className="shadow-md p-6">
        <h2 className="text-lg font-bold text-text-primary mb-4">Basic Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
            <Input
              type="text"
              value={creature.name}
              onChange={(e) => updateCreature({ name: e.target.value })}
              placeholder="Creature name..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
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
          <div className="grid grid-cols-3 gap-4">
            <Select
              label="Level"
                value={String(creature.level)}
                onChange={(e) => updateCreature({ level: parseFloat(e.target.value) })}
                options={LEVEL_OPTIONS}
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
                options={CREATURE_SIZES.map((s: { value: string; label: string }) => ({ value: s.value, label: s.label }))}
            />
          </div>
        </div>
      </Card>

      {/* Archetype Selection */}
      <Card className="shadow-md p-6">
        <h2 className="text-lg font-bold text-text-primary mb-4">Archetype</h2>
        <ArchetypeSelector
          value={creature.archetypeType}
          powerProficiency={creature.powerProficiency}
          martialProficiency={creature.martialProficiency}
          maxProficiency={stats.maxProficiencyPoints}
          onTypeChange={(type) => updateCreature({ archetypeType: type })}
          onProficiencyChange={(power, martial) => updateCreature({ 
            powerProficiency: power, 
            martialProficiency: martial 
          })}
        />
      </Card>

      {/* HP/EN Allocation */}
      <Card className="shadow-md p-6">
        <h2 className="text-lg font-bold text-text-primary mb-4">Health & Energy</h2>
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

      {/* Abilities - Using shared AbilityScoreEditor */}
      <Card className="shadow-md p-6">
        <h2 className="text-lg font-bold text-text-primary mb-4">Abilities</h2>
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

      {/* Skills & defense bonuses (shared SkillsAllocationPage) */}
      <SkillsAllocationPage
        entityType="creature"
        level={creatureLevel}
        abilities={creature.abilities}
        allocations={skillAllocations}
        defenseSkills={creature.defenses}
        speciesSkillIds={EMPTY_SPECIES_SKILL_IDS}
        onAllocationsChange={handleSkillAllocationsChange}
        onDefenseChange={handleDefenseSkillsChange}
        abilityDefenseBonuses={abilityDefenseBonuses}
        className="max-w-none"
        headingAddon={
          <InfoTippy
            content={skillPointsHelp}
            allowHTML
            label="Skill allocation help"
            size="inline"
          />
        }
        addSubSkillAddon={
          <InfoTippy
            content={subSkillsHelp}
            allowHTML
            label="Sub-skill help"
            placement="top"
            size="inline"
          />
        }
      />

      {/* Resistances, Weaknesses, Immunities */}
      <Card className="shadow-md p-6">
        <h2 className="text-lg font-bold text-text-primary mb-4">Resistances, Weaknesses & Immunities</h2>
        <p className="text-sm text-text-muted dark:text-text-secondary mb-3">Each type costs feat points as shown. Resistances and immunities cost points; weaknesses grant points.</p>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Resistances <span className="font-normal text-primary-link-fg">(+{stats.resistanceFeatCost} pt each)</span>
            </label>
            <ChipList 
              items={creature.resistances} 
              onRemove={(item) => removeFromArray('resistances', item)}
              color="bg-success-light text-success-fg"
              costLabel={() => `+${stats.resistanceFeatCost} pt`}
            />
            <AddItemDropdown
              options={DAMAGE_TYPES}
              selectedItems={[...creature.resistances, ...creature.immunities]}
              onAdd={(item) => addToArray('resistances', item)}
              placeholder="Add resistance..."
              sectionCostLabel={`+${stats.resistanceFeatCost} pt each`}
              costForOption={() => stats.resistanceFeatCost}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Weaknesses <span className="font-normal text-primary-link-fg">({stats.weaknessFeatCost} pt each)</span>
            </label>
            <ChipList 
              items={creature.weaknesses} 
              onRemove={(item) => removeFromArray('weaknesses', item)}
              color="bg-danger-light text-danger-fg"
              costLabel={() => `${stats.weaknessFeatCost} pt`}
            />
            <AddItemDropdown
              options={DAMAGE_TYPES}
              selectedItems={creature.weaknesses}
              onAdd={(item) => addToArray('weaknesses', item)}
              placeholder="Add weakness..."
              sectionCostLabel={`${stats.weaknessFeatCost} pt each`}
              costForOption={() => stats.weaknessFeatCost}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Immunities <span className="font-normal text-primary-link-fg">(+{stats.immunityFeatCost} pt each)</span>
            </label>
            <ChipList 
              items={creature.immunities} 
              onRemove={(item) => removeFromArray('immunities', item)}
              color="bg-power-light text-power-fg"
              costLabel={() => `+${stats.immunityFeatCost} pt`}
            />
            <AddItemDropdown
              options={DAMAGE_TYPES}
              selectedItems={[...creature.resistances, ...creature.immunities]}
              onAdd={(item) => addToArray('immunities', item)}
              placeholder="Add immunity..."
              sectionCostLabel={`+${stats.immunityFeatCost} pt each`}
              costForOption={() => stats.immunityFeatCost}
            />
          </div>
        </div>
      </Card>

      {/* Senses & Movement */}
      <Card className="shadow-md p-6">
        <h2 className="text-lg font-bold text-text-primary mb-4">Senses & Movement</h2>
        <p className="text-sm text-text-muted dark:text-text-secondary mb-3">Each sense and movement type has a feat point cost shown when adding and on each row.</p>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Senses</label>
            <ExpandableChipList 
              items={creature.senses} 
              onRemove={(item) => removeFromArray('senses', item)}
              color="bg-info-light text-info-fg"
              rowHoverClass="hover:bg-info-200 dark:hover:bg-info-900/40"
              descriptions={senseDescriptions}
              costLabel={getSenseCostLabel}
            />
            <AddItemDropdown
              options={SENSES}
              selectedItems={creature.senses}
              onAdd={(item) => addToArray('senses', item)}
              placeholder="Add sense..."
              costForOption={(value) => getSenseCostLabel(value)?.replace(' pt', '')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Movement Types</label>
            <ExpandableChipList 
              items={creature.movementTypes} 
              onRemove={(item) => removeFromArray('movementTypes', item)}
              color="bg-warning-light text-warning-fg"
              rowHoverClass="hover:bg-warning-200 dark:hover:bg-warning-800/40"
              descriptions={movementDescriptions}
              costLabel={getMovementCostLabel}
            />
            <AddItemDropdown
              options={MOVEMENT_TYPES}
              selectedItems={creature.movementTypes}
              onAdd={(item) => addToArray('movementTypes', item)}
              placeholder="Add movement..."
              costForOption={(value) => getMovementCostLabel(value)?.replace(' pt', '')}
            />
          </div>
        </div>
      </Card>

      {/* Condition Immunities */}
      <Card className="shadow-md p-6">
        <h2 className="text-lg font-bold text-text-primary mb-4">Condition Immunities</h2>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Conditions <span className="font-normal text-primary-link-fg">(+{stats.conditionImmunityFeatCost} pt each)</span>
        </label>
        <ChipList 
          items={creature.conditionImmunities} 
          onRemove={(item) => removeFromArray('conditionImmunities', item)}
          color="bg-surface-alt text-text-primary"
          costLabel={() => `+${stats.conditionImmunityFeatCost} pt`}
        />
        <AddItemDropdown
          options={CONDITIONS}
          selectedItems={creature.conditionImmunities}
          onAdd={(item) => addToArray('conditionImmunities', item)}
          placeholder="Add condition immunity..."
          sectionCostLabel={`+${stats.conditionImmunityFeatCost} pt each`}
          costForOption={() => stats.conditionImmunityFeatCost}
        />
      </Card>

      {/* Languages */}
      <Card className="shadow-md p-6">
        <h2 className="text-lg font-bold text-text-primary mb-4">Languages</h2>
        <ChipList 
          items={creature.languages} 
          onRemove={(item) => removeFromArray('languages', item)}
          color="bg-info-light text-info-fg"
        />
        <div className="flex gap-2 mt-2">
          <Input
            type="text"
            value={newLanguage}
            onChange={(e) => setNewLanguage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addLanguage()}
            placeholder="Enter language..."
            className="flex-1"
          />
          <Button
            onClick={addLanguage}
            disabled={!newLanguage.trim()}
            size="sm"
          >
            Add
          </Button>
        </div>
      </Card>

      {/* Feats - Always visible, below languages (matches other creator ordering) */}
      <CollapsibleSection
        title="Feats"
        subtitle="Special abilities and traits"
        collapsedSummary={featsSummary}
        icon="⭐"
        itemCount={creature.feats.length}
        points={{ spent: stats.featSpent, total: stats.featPoints }}
        defaultExpanded={true}
      >
        {creature.feats.length === 0 ? (
          <p className="text-sm text-text-muted dark:text-text-secondary italic mb-4">No feats added</p>
        ) : (
          <div className="border border-border-light rounded-lg overflow-hidden mb-4">
            <ListHeader
              columns={[
                { key: 'name', label: 'NAME' },
                { key: 'typeLabel', label: 'TYPE', width: '0.58fr', align: 'center' },
                { key: 'level', label: 'LVL', width: '0.52fr', align: 'center' },
                { key: 'points', label: 'PTS', width: '0.4fr', align: 'center' },
                { key: '_actions', label: '', sortable: false as const },
              ]}
              gridColumns={CREATURE_FEAT_LIST_GRID}
              sortState={featSort}
              onSort={handleFeatSort}
            />
            <div className="space-y-1">
              {sortedFeats.map((feat) => {
                const levelChips =
                  feat.levelMeta && feat.levelMeta.family.length > 1
                    ? buildFeatLevelChips(feat.levelMeta.family, feat.id)
                    : [];
                return (
                <GridListRow
                  key={feat.id}
                  id={feat.id}
                  name={feat.name}
                  description={feat.description}
                  gridColumns={CREATURE_FEAT_LIST_GRID}
                  detailSections={
                    levelChips.length > 0
                      ? [{ label: 'Other feat levels', chips: levelChips }]
                      : undefined
                  }
                  columns={[
                    {
                      key: 'typeLabel',
                      value: formatListCellLabel(feat.typeLabel),
                      align: 'center',
                    },
                    {
                      key: 'level',
                      value: feat.levelMeta ? (
                        <ValueStepper
                          value={feat.levelMeta.currentLevel}
                          onChange={(level) => handleCreatureFeatLevelChange(feat.id, level)}
                          min={feat.levelMeta.minLevel}
                          max={feat.levelMeta.maxQualified}
                          size="sm"
                          variant="inline"
                          decrementTitle={`Decrease ${feat.name} level`}
                          incrementTitle={`Increase ${feat.name} level`}
                        />
                      ) : (
                        '-'
                      ),
                      align: 'center',
                    },
                    {
                      key: 'points',
                      value: feat.points != null ? feat.points : '-',
                      align: 'center',
                    },
                  ]}
                  rightSlot={
                    <IconButton
                      variant="danger"
                      size="sm"
                      onClick={() => onRemoveFeat(feat.id)}
                      label="Remove feat"
                    >
                      <X className="w-4 h-4" />
                    </IconButton>
                  }
                  compact
                />
                );
              })}
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onOpenFeatModal()}>Add feat</Button>
        </div>
      </CollapsibleSection>

      {/* Powers - Optional */}
      <CollapsibleSection
        title="Powers"
        subtitle="Supernatural abilities and magical effects"
        collapsedSummary={powersSummary}
        icon="✨"
        optional
        enabled={creature.enablePowers}
        onEnabledChange={(enabled) => updateCreature({ enablePowers: enabled })}
        itemCount={creature.powers.length}
        defaultExpanded={true}
      >
        {creature.powers.length === 0 ? (
          <p className="text-sm text-text-muted dark:text-text-secondary italic mb-4">No powers added</p>
        ) : (
          <div className="border border-border-light rounded-lg overflow-hidden mb-4">
            <ListHeader
              columns={[
                { key: '_innate', label: '', width: '2rem', sortable: false as const },
                { key: 'name', label: 'NAME', width: '1.4fr' },
                { key: 'Energy', label: 'ENERGY', width: '0.6fr', align: 'center' },
                { key: 'Action', label: 'ACTION', width: '0.8fr', align: 'center' },
                { key: 'Damage', label: 'DAMAGE', width: '0.8fr', align: 'center' },
                { key: 'Area', label: 'AREA', width: '0.7fr', align: 'center' },
                { key: 'Duration', label: 'DURATION', width: '0.8fr', align: 'center' },
              ]}
              gridColumns="2rem 1.4fr 0.6fr 0.8fr 0.8fr 0.7fr 0.8fr"
              hasThumbnailColumn
            />
            <div className="space-y-1">
              {creature.powers.map((power: { id: string; name: string; energy?: number; action?: string; damage?: string; area?: string; duration?: string; innate?: boolean; image_id?: string | null; image_url?: string | null }) => (
                <GridListRow
                  key={power.id}
                  id={power.id}
                  name={power.name}
                  thumbnail={resolveListRowThumbnail('power', power, power.name)}
                  columns={[
                    { key: 'Energy', value: power.energy ?? '-', align: 'center' as const },
                    { key: 'Action', value: power.action ?? '-', align: 'center' as const },
                    { key: 'Damage', value: power.damage ?? '-', align: 'center' as const },
                    { key: 'Area', value: power.area ?? '-', align: 'center' as const },
                    { key: 'Duration', value: power.duration ?? '-', align: 'center' as const },
                  ]}
                  gridColumns="1.4fr 0.6fr 0.8fr 0.8fr 0.7fr 0.8fr"
                  innate={power.innate === true}
                  leftSlot={
                    <InnateToggle
                      isInnate={power.innate === true}
                      onToggle={() => onTogglePowerInnate(power.id)}
                      size="md"
                    />
                  }
                  rightSlot={
                    <IconButton
                      variant="danger"
                      size="sm"
                      onClick={() => onRemovePower(power.id)}
                      label="Remove power"
                    >
                      <X className="w-4 h-4" />
                    </IconButton>
                  }
                  compact
                />
              ))}
            </div>
          </div>
        )}
        <Button
          onClick={() => onOpenPowerModal()}
        >
          Add Power
        </Button>
      </CollapsibleSection>

      {/* Techniques - Optional */}
      <CollapsibleSection
        title="Techniques"
        subtitle="Combat maneuvers and martial skills"
        collapsedSummary={techniquesSummary}
        icon="⚔️"
        optional
        enabled={creature.enableTechniques}
        onEnabledChange={(enabled) => updateCreature({ enableTechniques: enabled })}
        itemCount={creature.techniques.length}
        defaultExpanded={true}
      >
        {creature.techniques.length === 0 ? (
          <p className="text-sm text-text-muted dark:text-text-secondary italic mb-4">No techniques added</p>
        ) : (
          <div className="border border-border-light rounded-lg overflow-hidden mb-4">
            <ListHeader
              columns={[
                { key: 'name', label: 'Name', width: '1.4fr' },
                { key: 'Energy', label: 'Energy', width: '0.7fr', align: 'center' },
                { key: 'Weapon', label: 'Attack', width: '1fr', align: 'center' },
                { key: 'Training Pts', label: 'Training Pts', width: '0.8fr', align: 'center' },
              ]}
              gridColumns="1.4fr 0.7fr 1fr 0.8fr"
              hasThumbnailColumn
            />
            <div className="space-y-1">
              {creature.techniques.map((tech: { id: string; name: string; energy?: number; weapon?: string; tp?: number; image_id?: string | null; image_url?: string | null }) => (
                <GridListRow
                  key={tech.id}
                  id={tech.id}
                  name={tech.name}
                  thumbnail={resolveListRowThumbnail('technique', tech, tech.name)}
                  columns={[
                    { key: 'Energy', value: tech.energy ?? '-', align: 'center' as const },
                    { key: 'Weapon', value: tech.weapon ?? '-', align: 'center' as const },
                    { key: 'Training Pts', value: tech.tp ?? '-', align: 'center' as const },
                  ]}
                  gridColumns="1.4fr 0.7fr 1fr 0.8fr"
                  rightSlot={
                    <IconButton
                      variant="danger"
                      size="sm"
                      onClick={() => onRemoveTechnique(tech.id)}
                      label="Remove technique"
                    >
                      <X className="w-4 h-4" />
                    </IconButton>
                  }
                  compact
                />
              ))}
            </div>
          </div>
        )}
        <Button
          onClick={() => onOpenTechniqueModal()}
        >
          Add Technique
        </Button>
      </CollapsibleSection>

      {/* Inventory - Optional */}
      <CollapsibleSection
        title="Inventory"
        subtitle="Weapons, armor, shields, and equipment"
        collapsedSummary={armamentsSummary}
        icon="🛡️"
        optional
        enabled={creature.enableArmaments}
        onEnabledChange={(enabled) => updateCreature({ enableArmaments: enabled })}
        itemCount={creature.armaments.length}
        defaultExpanded={true}
      >
        {creature.armaments.length === 0 ? (
          <p className="text-sm text-text-muted dark:text-text-secondary italic mb-4">No inventory items added</p>
        ) : (
          <div className="space-y-3 mb-4">
            <div className="rounded-lg border border-border-light bg-surface-alt p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-text-secondary dark:text-text-primary">Currency from inventory</span>
                <span
                  className={cn(
                    'font-semibold',
                    stats.currencyRemaining < 0 ? 'text-danger-fg' : 'text-text-primary'
                  )}
                >
                  {stats.currencyRemaining}c / {stats.currency}c
                </span>
              </div>
              <p className="mt-1 text-xs text-text-muted dark:text-text-secondary">
                Spent {stats.currencySpent}c from selected inventory items.
              </p>
            </div>
          <div className="border border-border-light rounded-lg overflow-hidden">
            <ListHeader
              columns={[
                { key: 'name', label: 'NAME' },
                { key: 'type', label: 'TYPE', width: 'minmax(72px, 0.55fr)', align: 'center' },
                { key: 'range', label: 'RANGE', width: 'minmax(92px, 7.5rem)', align: 'center' },
                { key: 'attack', label: 'ATTACK', width: 'minmax(64px, 4.25rem)', align: 'center' },
                { key: 'damage', label: 'DAMAGE', width: 'minmax(92px, 6.75rem)', align: 'center' },
                { key: 'tp', label: 'TP', width: '0.5fr', align: 'center' },
                { key: 'currency', label: 'COST', width: '0.6fr', align: 'center' },
                { key: '_actions', label: '', sortable: false as const },
              ]}
              gridColumns="minmax(180px, 0.9fr) minmax(72px, 0.55fr) minmax(88px, 7rem) minmax(60px, 4rem) minmax(110px, 8rem) minmax(56px, 0.45fr) minmax(64px, 0.55fr) 40px"
              sortState={armamentSort}
              onSort={handleArmamentSort}
              hasThumbnailColumn
            />
            <div className="space-y-1">
              {sortedArmaments.map((armament) => {
                return (
                <GridListRow
                  key={armament.id}
                  id={armament.id}
                  name={armament.name}
                  thumbnail={resolveListRowThumbnail('equipment', armament, armament.name)}
                  gridColumns="minmax(180px, 0.9fr) minmax(72px, 0.55fr) minmax(88px, 7rem) minmax(60px, 4rem) minmax(110px, 8rem) minmax(56px, 0.45fr) minmax(64px, 0.55fr) 40px"
                  columns={[
                    {
                      key: 'type',
                      value: armament.type,
                      align: 'center',
                    },
                    {
                      key: 'range',
                      value: armament.range,
                      align: 'center',
                    },
                    {
                      key: 'attack',
                      value: armament.attack,
                      align: 'center',
                    },
                    {
                      key: 'damage',
                      value: armament.damage,
                      align: 'center',
                    },
                    {
                      key: 'tp',
                      value: armament.tp,
                      align: 'center',
                    },
                    {
                      key: 'currency',
                      value: armament.currency,
                      align: 'center',
                    },
                  ]}
                  rightSlot={
                    <IconButton
                      variant="danger"
                      size="sm"
                      onClick={() => onRemoveArmament(armament.id)}
                      label="Remove inventory item"
                    >
                      <X className="w-4 h-4" />
                    </IconButton>
                  }
                  compact
                />
                );
              })}
            </div>
          </div>
          </div>
        )}
        <Button
          onClick={() => onOpenArmamentModal()}
        >
          Add Inventory Item
        </Button>
      </CollapsibleSection>
    </>
  );
}
