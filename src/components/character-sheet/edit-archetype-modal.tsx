/**
 * Edit Archetype Modal
 * ====================
 * Edit character archetype type and/or abilities from the sheet header.
 * Changing type redistributes proficiency: Power → all power, Martial → all martial,
 * Powered-Martial → equal split (martial gets the extra point if odd).
 */

'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Modal, Button, Chip } from '@/components/ui';
import type { Character, ArchetypeCategory, AbilityName } from '@/types';
import { calculateProficiency } from '@/lib/game/formulas';

const ABILITIES: AbilityName[] = ['strength', 'vitality', 'agility', 'acuity', 'intelligence', 'charisma'];

const ARCHETYPE_INFO: Record<ArchetypeCategory, { title: string; description: string }> = {
  power: {
    title: 'Power',
    description: 'All proficiency points in Power. Choose your Power ability.',
  },
  'powered-martial': {
    title: 'Powered-Martial',
    description: 'Proficiency split between Power and Martial (more in Martial if odd total). Choose both abilities.',
  },
  martial: {
    title: 'Martial',
    description: 'All proficiency points in Martial. Choose your Martial ability.',
  },
};

function getArchetypeTypeFromCharacter(c: Character): ArchetypeCategory {
  const mart = c.mart_prof ?? c.martialProficiency ?? 0;
  const pow = c.pow_prof ?? c.powerProficiency ?? 0;
  if (pow > 0 && mart === 0) return 'power';
  if (mart > 0 && pow === 0) return 'martial';
  if (mart > 0 && pow > 0) return 'powered-martial';
  return 'power';
}

export interface EditArchetypeResult {
  archetype: { id: string; type: ArchetypeCategory };
  pow_abil?: AbilityName;
  mart_abil?: AbilityName;
  mart_prof: number;
  pow_prof: number;
}

interface EditArchetypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  onSave: (result: EditArchetypeResult) => void;
}

export function EditArchetypeModal({
  isOpen,
  onClose,
  character,
  onSave,
}: EditArchetypeModalProps) {
  const level = character.level || 1;
  const totalProf = calculateProficiency(level);
  const currentMart = character.mart_prof ?? character.martialProficiency ?? 0;
  const currentPow = character.pow_prof ?? character.powerProficiency ?? 0;
  const effectiveTotal = Math.min(currentMart + currentPow, totalProf);

  const [selectedType, setSelectedType] = useState<ArchetypeCategory>(() => getArchetypeTypeFromCharacter(character));
  const [selectedPowerAbility, setSelectedPowerAbility] = useState<AbilityName | null>(
    character.pow_abil || null
  );
  const [selectedMartialAbility, setSelectedMartialAbility] = useState<AbilityName | null>(
    character.mart_abil || null
  );

  // Redistribute proficiencies when type changes
  const martProf = (() => {
    if (selectedType === 'power') return 0;
    if (selectedType === 'martial') return effectiveTotal;
    const half = Math.floor(effectiveTotal / 2);
    return half + (effectiveTotal % 2);
  })();
  const powProf = (() => {
    if (selectedType === 'martial') return 0;
    if (selectedType === 'power') return effectiveTotal;
    return Math.floor(effectiveTotal / 2);
  })();

  // Sync from character when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedType(getArchetypeTypeFromCharacter(character));
      setSelectedPowerAbility(character.pow_abil || null);
      setSelectedMartialAbility(character.mart_abil || null);
    }
  }, [isOpen, character.id, character.pow_abil, character.mart_abil]);

  const handleTypeSelect = (type: ArchetypeCategory) => {
    setSelectedType(type);
    if (type === 'power') {
      setSelectedMartialAbility(null);
      if (!character.pow_abil) setSelectedPowerAbility(null);
    } else if (type === 'martial') {
      setSelectedPowerAbility(null);
      if (!character.mart_abil) setSelectedMartialAbility(null);
    } else {
      if (!character.pow_abil) setSelectedPowerAbility(null);
      if (!character.mart_abil) setSelectedMartialAbility(null);
    }
  };

  const canSave =
    selectedType === 'power'
      ? Boolean(selectedPowerAbility)
      : selectedType === 'martial'
        ? Boolean(selectedMartialAbility)
        : Boolean(selectedPowerAbility && selectedMartialAbility && selectedPowerAbility !== selectedMartialAbility);

  const handleSave = () => {
    if (!canSave) return;
    const archetype = {
      id: selectedType,
      type: selectedType,
    };
    onSave({
      archetype,
      pow_abil: selectedType !== 'martial' ? (selectedPowerAbility ?? undefined) : undefined,
      mart_abil: selectedType !== 'power' ? (selectedMartialAbility ?? selectedPowerAbility ?? undefined) : undefined,
      mart_prof: martProf,
      pow_prof: powProf,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Archetype & Ability"
      description="Change archetype type or abilities. Proficiency points will be redistributed when you change type."
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            Save
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Proficiency summary */}
        <p className="text-sm text-text-muted">
          Total proficiency at level {level}: {effectiveTotal} (will be redistributed when you change type).
        </p>

        {/* Archetype type selection */}
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-2">Archetype Type</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(Object.entries(ARCHETYPE_INFO) as [ArchetypeCategory, typeof ARCHETYPE_INFO.power][]).map(
              ([type, info]) => (
                <button
                  key={type}
                  onClick={() => handleTypeSelect(type)}
                  className={cn(
                    'p-4 rounded-lg border-2 text-left transition-all',
                    selectedType === type
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-border-light bg-surface hover:border-border'
                  )}
                >
                  <span className="font-medium text-text-primary">{info.title}</span>
                  <p className="text-xs text-text-muted mt-1">{info.description}</p>
                  {selectedType === type && (
                    <span className="text-xs text-primary-600 mt-2 inline-block">
                      {type === 'power' && `Power +${powProf}`}
                      {type === 'martial' && `Martial +${martProf}`}
                      {type === 'powered-martial' && `Martial +${martProf} / Power +${powProf}`}
                    </span>
                  )}
                </button>
              )
            )}
          </div>
        </div>

        {/* Ability selection */}
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-2">
            {selectedType === 'powered-martial'
              ? 'Power and Martial Abilities (must be different)'
              : selectedType === 'power'
                ? 'Power Ability'
                : 'Martial Ability'}
          </h3>

          {selectedType === 'powered-martial' ? (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-medium text-category-power mb-2">Power Ability</h4>
                <div className="flex flex-wrap gap-2">
                  {ABILITIES.map((ability) => (
                    <button
                      key={`power-${ability}`}
                      onClick={() => setSelectedPowerAbility(ability)}
                      disabled={selectedMartialAbility === ability}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        selectedPowerAbility === ability
                          ? 'bg-primary-600 text-white'
                          : selectedMartialAbility === ability
                            ? 'bg-surface-alt text-text-muted cursor-not-allowed'
                            : 'bg-surface border border-border-light hover:border-primary-400'
                      )}
                    >
                      {ability.charAt(0).toUpperCase() + ability.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-medium text-category-technique mb-2">Martial Ability</h4>
                <div className="flex flex-wrap gap-2">
                  {ABILITIES.map((ability) => (
                    <button
                      key={`martial-${ability}`}
                      onClick={() => setSelectedMartialAbility(ability)}
                      disabled={selectedPowerAbility === ability}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        selectedMartialAbility === ability
                          ? 'bg-primary-600 text-white'
                          : selectedPowerAbility === ability
                            ? 'bg-surface-alt text-text-muted cursor-not-allowed'
                            : 'bg-surface border border-border-light hover:border-primary-400'
                      )}
                    >
                      {ability.charAt(0).toUpperCase() + ability.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {ABILITIES.map((ability) => (
                <button
                  key={ability}
                  onClick={() =>
                    selectedType === 'power'
                      ? setSelectedPowerAbility(ability)
                      : setSelectedMartialAbility(ability)
                  }
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium transition-colors',
                    (selectedType === 'power' ? selectedPowerAbility === ability : selectedMartialAbility === ability)
                      ? 'bg-primary-600 text-white'
                      : 'bg-surface border border-border-light hover:border-primary-400'
                  )}
                >
                  {ability.charAt(0).toUpperCase() + ability.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Summary chips */}
        {(selectedPowerAbility || selectedMartialAbility) && (
          <div className="flex flex-wrap gap-2">
            {selectedPowerAbility && (
              <Chip variant="power">
                Power: {selectedPowerAbility.charAt(0).toUpperCase() + selectedPowerAbility.slice(1)}
              </Chip>
            )}
            {selectedMartialAbility && (
              <Chip variant="technique">
                Martial: {selectedMartialAbility.charAt(0).toUpperCase() + selectedMartialAbility.slice(1)}
              </Chip>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
