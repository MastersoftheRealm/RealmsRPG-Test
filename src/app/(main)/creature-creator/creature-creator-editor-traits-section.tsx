/**
 * Creature Creator — resistances, senses, movement, conditions, languages (TASK-610)
 */

'use client';

import { useState } from 'react';
import { Button, Input, Card } from '@/components/ui';
import { CONDITIONS } from '@/lib/game/creator-constants';
import { DAMAGE_TYPES, SENSES, MOVEMENT_TYPES } from './creature-creator-constants';
import { ChipList, ExpandableChipList, AddItemDropdown } from './CreatureCreatorHelpers';
import type { CreatureCreatorEditorProps } from './creature-creator-editor';

type TraitsSectionProps = Pick<
  CreatureCreatorEditorProps,
  | 'creature'
  | 'stats'
  | 'senseDescriptions'
  | 'movementDescriptions'
  | 'getSenseCostLabel'
  | 'getMovementCostLabel'
  | 'addToArray'
  | 'removeFromArray'
>;

export function CreatureCreatorEditorTraitsSection({
  creature,
  stats,
  senseDescriptions,
  movementDescriptions,
  getSenseCostLabel,
  getMovementCostLabel,
  addToArray,
  removeFromArray,
}: TraitsSectionProps) {
  const [newLanguage, setNewLanguage] = useState('');

  const addLanguage = () => {
    if (newLanguage.trim() && !creature.languages.includes(newLanguage.trim())) {
      addToArray('languages', newLanguage.trim());
      setNewLanguage('');
    }
  };

  return (
    <>
      <Card className="p-6 shadow-md">
        <h2 className="mb-4 text-lg font-bold text-text-primary">
          Resistances, Weaknesses & Immunities
        </h2>
        <p className="mb-3 text-sm text-text-muted">
          Each type costs feat points as shown. Resistances and immunities cost points; weaknesses
          grant points.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-text-secondary">
              Resistances{' '}
              <span className="font-normal text-primary-link-fg">
                (+{stats.resistanceFeatCost} pt each)
              </span>
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
            <label className="mb-2 block text-sm font-medium text-text-secondary">
              Weaknesses{' '}
              <span className="font-normal text-primary-link-fg">
                ({stats.weaknessFeatCost} pt each)
              </span>
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
            <label className="mb-2 block text-sm font-medium text-text-secondary">
              Immunities{' '}
              <span className="font-normal text-primary-link-fg">
                (+{stats.immunityFeatCost} pt each)
              </span>
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

      <Card className="p-6 shadow-md">
        <h2 className="mb-4 text-lg font-bold text-text-primary">Senses & Movement</h2>
        <p className="mb-3 text-sm text-text-muted">
          Each sense and movement type has a feat point cost shown when adding and on each row.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-text-secondary">Senses</label>
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
            <label className="mb-2 block text-sm font-medium text-text-secondary">
              Movement Types
            </label>
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

      <Card className="p-6 shadow-md">
        <h2 className="mb-4 text-lg font-bold text-text-primary">Condition Immunities</h2>
        <label className="mb-2 block text-sm font-medium text-text-secondary">
          Conditions{' '}
          <span className="font-normal text-primary-link-fg">
            (+{stats.conditionImmunityFeatCost} pt each)
          </span>
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

      <Card className="p-6 shadow-md">
        <h2 className="mb-4 text-lg font-bold text-text-primary">Languages</h2>
        <ChipList
          items={creature.languages}
          onRemove={(item) => removeFromArray('languages', item)}
          color="bg-info-light text-info-fg"
        />
        <div className="mt-2 flex gap-2">
          <Input
            type="text"
            value={newLanguage}
            onChange={(e) => setNewLanguage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addLanguage()}
            placeholder="Enter language..."
            className="flex-1"
          />
          <Button onClick={addLanguage} disabled={!newLanguage.trim()} size="sm">
            Add
          </Button>
        </div>
      </Card>
    </>
  );
}
