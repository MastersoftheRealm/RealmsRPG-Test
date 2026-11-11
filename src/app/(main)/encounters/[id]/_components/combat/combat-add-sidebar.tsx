/**
 * Combat encounter add-combatant sidebar + conditions reference (TASK-608)
 */

'use client';

import { cn } from '@/lib/utils';
import { Checkbox, Input, Card, Button } from '@/components/ui';
import { ValueStepper } from '@/components/patterns';
import { CONDITION_OPTIONS } from '@/components/encounters/encounter-constants';
import type { Encounter } from '@/types/encounter';
import type { Campaign } from '@/types/campaign';
import type { NewCombatantForm } from './combat-encounter-helpers';
import { EncounterCampaignRosterSection } from '../EncounterCampaignRosterSection';

export interface CombatAddSidebarProps {
  encounter: Encounter;
  setEncounter: React.Dispatch<React.SetStateAction<Encounter | null>>;
  campaignsFull: Campaign[];
  linkedCampaign: Campaign | undefined;
  availableCampaignCharacterCount: number;
  addingAllChars: boolean;
  newCombatant: NewCombatantForm;
  setNewCombatant: React.Dispatch<React.SetStateAction<NewCombatantForm>>;
  onOpenAddModal: () => void;
  onAddAllCampaignCharacters: () => void;
  onAddCombatant: () => void;
}

export function CombatAddSidebar({
  encounter,
  setEncounter,
  campaignsFull,
  linkedCampaign,
  availableCampaignCharacterCount,
  addingAllChars,
  newCombatant,
  setNewCombatant,
  onOpenAddModal,
  onAddAllCampaignCharacters,
  onAddCombatant,
}: CombatAddSidebarProps) {
  return (
    <div className="flex min-h-0 min-w-0 flex-col space-y-6">
      <Card className="flex-shrink-0 p-6 shadow-md">
        <h2 className="mb-4 text-lg font-bold text-text-primary">Add Combatant</h2>
        <EncounterCampaignRosterSection
          selectId="combat-encounter-campaign"
          encounter={encounter}
          setEncounter={setEncounter}
          campaignsFull={campaignsFull}
          linkedCampaign={linkedCampaign}
          availableCampaignCharacterCount={availableCampaignCharacterCount}
          addingAllChars={addingAllChars}
          onAddAllCampaignCharacters={onAddAllCampaignCharacters}
          disableAddAllWhenActive
          onOpenAddModal={onOpenAddModal}
        />
        <div className="space-y-4">
          <Input
            label="Name"
            type="text"
            value={newCombatant.name}
            onChange={(e) => setNewCombatant((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Creature name..."
          />
          <div className="grid min-w-0 grid-cols-2 gap-3">
            <Input
              label="Roll"
              type="number"
              value={newCombatant.initiative || ''}
              onChange={(e) =>
                setNewCombatant((prev) => ({
                  ...prev,
                  initiative: parseInt(e.target.value) || 0,
                }))
              }
              placeholder="Init"
            />
            <Input
              label="Acuity"
              type="number"
              value={newCombatant.acuity || ''}
              onChange={(e) =>
                setNewCombatant((prev) => ({
                  ...prev,
                  acuity: parseInt(e.target.value) || 0,
                }))
              }
              placeholder="Acuity"
            />
          </div>
          <div className="grid min-w-0 grid-cols-2 gap-3">
            <Input
              label="Max HP"
              type="number"
              value={newCombatant.maxHealth}
              onChange={(e) =>
                setNewCombatant((prev) => ({
                  ...prev,
                  maxHealth: parseInt(e.target.value) || 1,
                }))
              }
            />
            <Input
              label="Max EN"
              type="number"
              value={newCombatant.maxEnergy}
              onChange={(e) =>
                setNewCombatant((prev) => ({
                  ...prev,
                  maxEnergy: parseInt(e.target.value) || 0,
                }))
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Quantity</label>
            <div className="flex items-center gap-2">
              <ValueStepper
                value={newCombatant.quantity || 1}
                onChange={(value) => setNewCombatant((prev) => ({ ...prev, quantity: value }))}
                min={1}
                max={26}
                size="sm"
                enableHoldRepeat
              />
              <span className="ml-2 text-xs text-text-muted">A, B, C... suffixes</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {(['ally', 'enemy', 'companion'] as const).map((t) => (
              <label key={t} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="combatantType"
                  checked={newCombatant.combatantType === t}
                  onChange={() =>
                    setNewCombatant((prev) => ({
                      ...prev,
                      combatantType: t,
                      isAlly: t !== 'enemy',
                    }))
                  }
                  className="h-4 w-4"
                />
                <span
                  className={cn(
                    'text-sm font-medium',
                    t === 'ally'
                      ? 'text-ally-text'
                      : t === 'enemy'
                        ? 'text-enemy-text'
                        : 'text-companion-text',
                  )}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </span>
              </label>
            ))}
          </div>
          <Checkbox
            checked={newCombatant.isSurprised}
            onChange={(e) =>
              setNewCombatant((prev) => ({
                ...prev,
                isSurprised: e.target.checked,
              }))
            }
            label="Surprised (goes last in round 1)"
          />
          <Button
            onClick={onAddCombatant}
            disabled={!newCombatant.name.trim()}
            className="w-full font-bold"
          >
            Add Creature
          </Button>
        </div>
      </Card>
      <Card className="p-6 shadow-md">
        <h3 className="mb-4 text-lg font-bold text-text-primary">Conditions Reference</h3>
        <div className="flex flex-wrap gap-1">
          {CONDITION_OPTIONS.map((condition) => (
            <span
              key={condition.name}
              title={condition.description}
              className={cn(
                'cursor-help rounded-full px-2 py-1 text-xs',
                condition.leveled
                  ? 'bg-companion-light text-companion-text'
                  : 'bg-surface-alt text-text-secondary',
              )}
            >
              {condition.name}
              {condition.leveled && ' \u2B07'}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}
