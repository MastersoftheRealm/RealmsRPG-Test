/**
 * Edit Archetype Modal
 * ====================
 * Edit character archetype type and/or abilities from the sheet header.
 * Path characters see read-only path identity; switching to forge or another path
 * requires confirmation. Forge characters use the full type + ability picker.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Modal, Button, Chip, Spinner } from '@/components/ui';
import { ConfirmActionModal } from '@/components/shared';
import { useCodexArchetypes } from '@/hooks';
import { calculateProficiency } from '@/lib/game/formulas';
import { parseArchetypePathData, pathHasPlayerVisibleLevel1 } from '@/lib/game/archetype-path';
import { applyPathProficiencyForLevel, resolveArchetypeDisplayName } from '@/lib/game/archetype-display';
import {
  ArchetypeCreationBadge,
  isPathCharacter,
} from '@/components/character-sheet/archetype-path-identity';
import type { Character, ArchetypeCategory, AbilityName, Archetype } from '@/types';

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

const PATH_SWITCH_WARNING =
  'Changing your archetype path updates your identity and abilities. Existing feats, powers, techniques, armaments, and equipment may no longer match the new path. Nothing is removed automatically — review your sheet afterward.';

const FORGE_SWITCH_WARNING =
  'Switching to Forge Your Own removes archetype path guidance. Your existing selections are kept, but they may no longer match path recommendations. Path progression notes will no longer appear on your sheet or at level-up.';

function getArchetypeTypeFromCharacter(c: Character): ArchetypeCategory {
  if (c.archetype?.type) return c.archetype.type;
  const mart = c.mart_prof ?? c.martialProficiency ?? 0;
  const pow = c.pow_prof ?? c.powerProficiency ?? 0;
  if (pow > 0 && mart === 0) return 'power';
  if (mart > 0 && pow === 0) return 'martial';
  if (mart > 0 && pow > 0) return 'powered-martial';
  return 'power';
}

function redistributeProficiency(total: number, type: ArchetypeCategory): { mart_prof: number; pow_prof: number } {
  if (type === 'power') return { mart_prof: 0, pow_prof: total };
  if (type === 'martial') return { mart_prof: total, pow_prof: 0 };
  const half = Math.floor(total / 2);
  return { mart_prof: half + (total % 2), pow_prof: half };
}

function buildPathSwitchResult(path: Archetype, character: Character): EditArchetypeResult {
  const type = path.type;
  const level = character.level || 1;
  const totalProf = calculateProficiency(level);
  const currentMart = character.mart_prof ?? character.martialProficiency ?? 0;
  const currentPow = character.pow_prof ?? character.powerProficiency ?? 0;
  const effectiveTotal = Math.min(currentMart + currentPow, totalProf);
  const { mart_prof, pow_prof } = redistributeProficiency(effectiveTotal, type);

  const primaryAbility = path.archetype_ability;
  const powAbil =
    type !== 'martial'
      ? ((path.pow_abil || path.ability || primaryAbility) as AbilityName | undefined)
      : undefined;
  const martAbil =
    type !== 'power'
      ? ((path.mart_abil || path.secondary_ability || path.ability || primaryAbility) as
          | AbilityName
          | undefined)
      : undefined;

  const base: EditArchetypeResult = {
    archetype: { id: path.id, type },
    pow_abil: powAbil,
    mart_abil: martAbil,
    mart_prof,
    pow_prof,
    creationMode: 'path',
    archetypePathId: path.id,
  };

  const profUpdate = applyPathProficiencyForLevel(
    {
      ...character,
      ...base,
      creationMode: 'path',
      archetypePathId: path.id,
    },
    level,
    path
  );

  return profUpdate ? { ...base, ...profUpdate } : base;
}

function capitalizeAbility(value?: string): string {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

type UiMode = 'path-view' | 'path-picker' | 'forge-edit';

type PendingConfirm =
  | { type: 'switch-forge' }
  | { type: 'switch-path'; path: Archetype };

export interface EditArchetypeResult {
  archetype: { id: string; type: ArchetypeCategory };
  pow_abil?: AbilityName;
  mart_abil?: AbilityName;
  mart_prof: number;
  pow_prof: number;
  creationMode?: 'forge' | 'path';
  /** Pass `null` to clear when switching to forge. */
  archetypePathId?: string | null;
}

interface EditArchetypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  /** Codex-hydrated character for path name, description, and path_data. */
  displayCharacter?: Character | null;
  onSave: (result: EditArchetypeResult) => void;
}

export function EditArchetypeModal({
  isOpen,
  onClose,
  character,
  displayCharacter,
  onSave,
}: EditArchetypeModalProps) {
  const display = displayCharacter ?? character;
  const isPath = isPathCharacter(display);

  const level = character.level || 1;
  const totalProf = calculateProficiency(level);
  const currentMart = character.mart_prof ?? character.martialProficiency ?? 0;
  const currentPow = character.pow_prof ?? character.powerProficiency ?? 0;
  const effectiveTotal = Math.min(currentMart + currentPow, totalProf);

  const { data: codexArchetypes = [], isLoading: pathsLoading } = useCodexArchetypes();

  const pathOptions = useMemo(
    () =>
      (codexArchetypes as Archetype[])
        .map((archetype) => ({
          ...archetype,
          path_data: parseArchetypePathData(archetype.path_data),
        }))
        .filter((archetype) => pathHasPlayerVisibleLevel1(archetype.path_data))
        .filter((option) => option.id !== display.archetypePathId),
    [codexArchetypes, display.archetypePathId]
  );

  const [uiMode, setUiMode] = useState<UiMode>(() => (isPath ? 'path-view' : 'forge-edit'));
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [selectedType, setSelectedType] = useState<ArchetypeCategory>(() =>
    getArchetypeTypeFromCharacter(character)
  );
  const [selectedPowerAbility, setSelectedPowerAbility] = useState<AbilityName | null>(
    character.pow_abil || null
  );
  const [selectedMartialAbility, setSelectedMartialAbility] = useState<AbilityName | null>(
    character.mart_abil || null
  );

  const martProf = redistributeProficiency(effectiveTotal, selectedType).mart_prof;
  const powProf = redistributeProficiency(effectiveTotal, selectedType).pow_prof;

  useEffect(() => {
    if (!isOpen) return;
    const path = isPathCharacter(displayCharacter ?? character);
    setUiMode(path ? 'path-view' : 'forge-edit');
    setPendingConfirm(null);
    setSelectedType(getArchetypeTypeFromCharacter(character));
    setSelectedPowerAbility(character.pow_abil || null);
    setSelectedMartialAbility(character.mart_abil || null);
  }, [isOpen, character.id, character.pow_abil, character.mart_abil, displayCharacter]);

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

  const canSaveForge =
    selectedType === 'power'
      ? Boolean(selectedPowerAbility)
      : selectedType === 'martial'
        ? Boolean(selectedMartialAbility)
        : Boolean(selectedPowerAbility && selectedMartialAbility && selectedPowerAbility !== selectedMartialAbility);

  const handleForgeSave = () => {
    if (!canSaveForge) return;
    onSave({
      archetype: { id: selectedType, type: selectedType },
      pow_abil: selectedType !== 'martial' ? (selectedPowerAbility ?? undefined) : undefined,
      mart_abil:
        selectedType !== 'power'
          ? (selectedMartialAbility ?? selectedPowerAbility ?? undefined)
          : undefined,
      mart_prof: martProf,
      pow_prof: powProf,
      creationMode: 'forge',
      archetypePathId: null,
    });
    onClose();
  };

  const handleConfirmSwitch = () => {
    if (!pendingConfirm) return;
    if (pendingConfirm.type === 'switch-forge') {
      setUiMode('forge-edit');
      setSelectedType(getArchetypeTypeFromCharacter(character));
      setPendingConfirm(null);
      return;
    }
    onSave(buildPathSwitchResult(pendingConfirm.path, character));
    setPendingConfirm(null);
    onClose();
  };

  const pathName =
    resolveArchetypeDisplayName(display) ?? display.archetype?.name ?? 'Archetype path';
  const pathDescription = display.archetype?.description?.trim();

  const confirmTitle =
    pendingConfirm?.type === 'switch-forge' ? 'Switch to Forge Your Own?' : 'Change archetype path?';
  const confirmDescription =
    pendingConfirm?.type === 'switch-forge'
      ? FORGE_SWITCH_WARNING
      : pendingConfirm?.type === 'switch-path'
        ? `${PATH_SWITCH_WARNING} New path: ${pendingConfirm.path.name}.`
        : '';

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Edit Archetype & Ability"
        description={
          uiMode === 'path-view'
            ? 'Your character follows an official archetype path.'
            : uiMode === 'path-picker'
              ? 'Choose a different archetype path. You will confirm before changes apply.'
              : 'Change archetype type or abilities. Proficiency points will be redistributed when you change type.'
        }
        size="lg"
        fullScreenOnMobile
        footer={
          uiMode === 'forge-edit' ? (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} className="min-h-[44px]">
                Cancel
              </Button>
              <Button onClick={handleForgeSave} disabled={!canSaveForge} className="min-h-[44px]">
                Save
              </Button>
            </div>
          ) : uiMode === 'path-picker' ? (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUiMode('path-view')} className="min-h-[44px]">
                Back
              </Button>
            </div>
          ) : (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} className="min-h-[44px]">
                Close
              </Button>
            </div>
          )
        }
      >
        {uiMode === 'path-view' && (
          <div className="space-y-6">
            <div
              className="rounded-xl border-2 border-primary-200 dark:border-primary-800 bg-primary-50/80 dark:bg-primary-900/20 p-5 space-y-3"
              role="region"
              aria-label={`Archetype path: ${pathName}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-text-primary">{pathName}</h3>
                <ArchetypeCreationBadge character={display} />
              </div>
              {pathDescription ? (
                <p className="text-sm text-text-secondary">{pathDescription}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {display.pow_abil ? (
                  <Chip variant="power">
                    Power: {capitalizeAbility(display.pow_abil)}
                  </Chip>
                ) : null}
                {display.mart_abil ? (
                  <Chip variant="technique">
                    Martial: {capitalizeAbility(display.mart_abil)}
                  </Chip>
                ) : null}
              </div>
              <p className="text-sm text-text-secondary">
                Power +{currentPow} · Martial +{currentMart} at level {level}
              </p>
              <p className="text-xs text-text-muted dark:text-text-secondary">
                Path abilities and proficiencies are set from the codex. Use the options below only if you
                want to leave this path or choose a different one.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-text-primary">Change creation style</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  className="min-h-[44px] flex-1"
                  onClick={() => setPendingConfirm({ type: 'switch-forge' })}
                >
                  Switch to Forge Your Own
                </Button>
                <Button
                  variant="outline"
                  className="min-h-[44px] flex-1"
                  onClick={() => setUiMode('path-picker')}
                >
                  Choose a Different Path
                </Button>
              </div>
            </div>
          </div>
        )}

        {uiMode === 'path-picker' && (
          <div className="space-y-4">
            {pathsLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : pathOptions.length === 0 ? (
              <p className="text-text-secondary text-sm">No other archetype paths are available in the codex.</p>
            ) : (
              <div className="space-y-5 max-h-[50vh] overflow-y-auto pr-1">
                {(['power', 'powered-martial', 'martial'] as const).map((group) => {
                  const options = pathOptions.filter((option) => option.type === group);
                  if (options.length === 0) return null;
                  return (
                    <section key={group}>
                      <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                        {group === 'power'
                          ? 'Power Paths'
                          : group === 'martial'
                            ? 'Martial Paths'
                            : 'Powered-Martial Paths'}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {options.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setPendingConfirm({ type: 'switch-path', path: option })}
                            className="selection-card text-left min-h-[44px] p-4"
                          >
                            <span className="font-semibold text-text-primary block mb-1">{option.name}</span>
                            {option.description ? (
                              <span className="text-sm text-text-secondary line-clamp-2 block">
                                {option.description}
                              </span>
                            ) : null}
                          </button>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {uiMode === 'forge-edit' && (
          <div className="space-y-6">
            <p className="text-sm text-text-muted dark:text-text-secondary">
              Total proficiency at level {level}: {effectiveTotal} (redistributed when you change type).
            </p>

            <div>
              <h3 className="text-sm font-medium text-text-primary mb-2">Archetype Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(Object.entries(ARCHETYPE_INFO) as [ArchetypeCategory, typeof ARCHETYPE_INFO.power][]).map(
                  ([type, info]) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleTypeSelect(type)}
                      className={cn(
                        'p-4 rounded-lg border-2 text-left transition-all min-h-[44px]',
                        selectedType === type
                          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-border-light bg-surface hover:border-border'
                      )}
                    >
                      <span className="font-medium text-text-primary">{info.title}</span>
                      <p className="text-xs text-text-muted dark:text-text-secondary mt-1">{info.description}</p>
                      {selectedType === type && (
                        <span className="text-xs text-primary-700 dark:text-primary-300 mt-2 inline-block">
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
                    <h4 className="text-xs font-medium text-power-dark dark:text-violet-300 mb-2">Power Ability</h4>
                    <div className="flex flex-wrap gap-2">
                      {ABILITIES.map((ability) => (
                        <button
                          key={`power-${ability}`}
                          type="button"
                          onClick={() => setSelectedPowerAbility(ability)}
                          disabled={selectedMartialAbility === ability}
                          className={cn(
                            'px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] min-w-[44px]',
                            selectedPowerAbility === ability
                              ? 'bg-violet-600 text-white dark:bg-violet-600'
                              : selectedMartialAbility === ability
                                ? 'bg-surface-alt text-text-muted dark:text-text-secondary cursor-not-allowed'
                                : 'bg-surface border border-border-light hover:border-border'
                          )}
                        >
                          {capitalizeAbility(ability)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-martial-dark dark:text-orange-300 mb-2">
                      Martial Ability
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {ABILITIES.map((ability) => (
                        <button
                          key={`martial-${ability}`}
                          type="button"
                          onClick={() => setSelectedMartialAbility(ability)}
                          disabled={selectedPowerAbility === ability}
                          className={cn(
                            'px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] min-w-[44px]',
                            selectedMartialAbility === ability
                              ? 'bg-red-600 text-white dark:bg-red-700'
                              : selectedPowerAbility === ability
                                ? 'bg-surface-alt text-text-muted dark:text-text-secondary cursor-not-allowed'
                                : 'bg-surface border border-border-light hover:border-border'
                          )}
                        >
                          {capitalizeAbility(ability)}
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
                      type="button"
                      onClick={() =>
                        selectedType === 'power'
                          ? setSelectedPowerAbility(ability)
                          : setSelectedMartialAbility(ability)
                      }
                      className={cn(
                        'px-4 py-2 rounded-lg font-medium transition-colors min-h-[44px]',
                        (selectedType === 'power'
                          ? selectedPowerAbility === ability
                          : selectedMartialAbility === ability)
                          ? 'bg-primary-600 text-white dark:bg-primary-100 dark:text-white'
                          : 'bg-surface border border-border-light hover:border-border'
                      )}
                    >
                      {capitalizeAbility(ability)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {(selectedPowerAbility || selectedMartialAbility) && (
              <div className="flex flex-wrap gap-2">
                {selectedPowerAbility && (
                  <Chip variant="power">
                    Power: {capitalizeAbility(selectedPowerAbility)}
                  </Chip>
                )}
                {selectedMartialAbility && (
                  <Chip variant="technique">
                    Martial: {capitalizeAbility(selectedMartialAbility)}
                  </Chip>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmActionModal
        isOpen={Boolean(pendingConfirm)}
        onClose={() => setPendingConfirm(null)}
        onConfirm={handleConfirmSwitch}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel={pendingConfirm?.type === 'switch-forge' ? 'Continue to forge editor' : 'Change path'}
        confirmVariant="danger"
      />
    </>
  );
}
