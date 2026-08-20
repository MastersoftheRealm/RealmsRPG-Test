/**
 * Edit Archetype Modal
 * ====================
 * Edit character archetype type and/or abilities from the sheet header.
 * Path characters see read-only path identity; switching to forge or another path
 * requires confirmation. Forge characters use the full type + ability picker.
 */

'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Modal, Button, Spinner, SelectionCard, DescriptorChip } from '@/components/ui';
import { AbilityPickButton, ConfirmActionModal } from '@/components/patterns';
import { useCodexArchetypes } from '@/hooks';
import { calculateProficiency } from '@/lib/game/formulas';
import { resolveArchetypeDisplayName } from '@/lib/game/archetype-display';
import { formatAbilityLabel } from '@/lib/constants/ability-effect-blurbs';
import { ARCHETYPE_CATEGORY_INFO } from '@/lib/constants/copy';
import {
  ARCHETYPE_ABILITY_OPTIONS,
  PATH_CATEGORY_GROUPS,
  buildPathSwitchResult,
  canSaveForgeAbilities,
  groupPathsByCategory,
  inferArchetypeCategoryFromCharacter,
  listPlayerVisiblePaths,
  pathCategoryGroupLabel,
  redistributeProficiency,
} from '@/lib/game/archetype-edit';
import { isPathCharacter } from '@/components/character-sheet/archetype-path-identity';
import type { Character, ArchetypeCategory, AbilityName, Archetype } from '@/types';

const PATH_SWITCH_WARNING =
  'Changing your archetype path updates your identity and abilities. Existing feats, powers, techniques, armaments, and equipment may no longer match the new path. Nothing is removed automatically. Review your sheet afterward.';

const FORGE_SWITCH_WARNING =
  'Switching to Forge Your Own removes archetype path guidance. Your existing selections are kept, but they may no longer match path recommendations. Path progression notes will no longer appear on your sheet or at level-up.';

type UiMode = 'path-view' | 'path-picker' | 'forge-edit';

type PendingConfirm = { type: 'switch-forge' } | { type: 'switch-path'; path: Archetype };

export interface EditArchetypeResult {
  archetype: { id: string; type: ArchetypeCategory };
  pow_abil?: AbilityName | undefined;
  mart_abil?: AbilityName | undefined;
  mart_prof: number;
  pow_prof: number;
  /** Pass `null` to clear when switching off a path. */
  archetypePathId?: string | null | undefined;
}

interface EditArchetypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  /** Codex-hydrated character for path name, description, and path_data. */
  displayCharacter?: Character | null | undefined;
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
      listPlayerVisiblePaths(codexArchetypes as Archetype[], {
        excludeId: display.archetypePathId,
      }),
    [codexArchetypes, display.archetypePathId],
  );

  const pathsByCategory = useMemo(() => groupPathsByCategory(pathOptions), [pathOptions]);

  const [uiMode, setUiMode] = useState<UiMode>(() => (isPath ? 'path-view' : 'forge-edit'));
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [selectedType, setSelectedType] = useState<ArchetypeCategory>(() =>
    inferArchetypeCategoryFromCharacter(character),
  );
  const [selectedPowerAbility, setSelectedPowerAbility] = useState<AbilityName | null>(
    character.pow_abil || null,
  );
  const [selectedMartialAbility, setSelectedMartialAbility] = useState<AbilityName | null>(
    character.mart_abil || null,
  );

  const { mart_prof: martProf, pow_prof: powProf } = redistributeProficiency(
    effectiveTotal,
    selectedType,
  );

  // Fresh state per open via editArchetypeSessionKey remount in CharacterSheetModals (no reset effect).

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

  const canSaveForge = canSaveForgeAbilities({
    selectedType,
    selectedPowerAbility,
    selectedMartialAbility,
  });

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
      archetypePathId: null,
    });
    onClose();
  };

  const handleConfirmSwitch = () => {
    if (!pendingConfirm) return;
    if (pendingConfirm.type === 'switch-forge') {
      setUiMode('forge-edit');
      setSelectedType(inferArchetypeCategoryFromCharacter(character));
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
    pendingConfirm?.type === 'switch-forge'
      ? 'Switch to Forge Your Own?'
      : 'Change archetype path?';
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
        flexLayout
        footer={
          uiMode === 'forge-edit' ? (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button size="lg" onClick={handleForgeSave} disabled={!canSaveForge}>
                Save
              </Button>
            </div>
          ) : uiMode === 'path-picker' ? (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUiMode('path-view')}>
                Back
              </Button>
            </div>
          ) : (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          )
        }
      >
        {uiMode === 'path-view' && (
          <div className="space-y-6">
            <div
              className="space-y-3 rounded-xl border-2 border-primary-subtle-border bg-primary-subtle-bg p-5"
              role="region"
              aria-label={`Archetype path: ${pathName}`}
            >
              <h3 className="text-lg font-semibold text-text-primary">{pathName}</h3>
              {pathDescription ? (
                <p className="text-sm text-text-secondary">{pathDescription}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {display.pow_abil ? (
                  <DescriptorChip variant="power">
                    Power: {formatAbilityLabel(display.pow_abil)}
                  </DescriptorChip>
                ) : null}
                {display.mart_abil ? (
                  <DescriptorChip variant="technique">
                    Martial: {formatAbilityLabel(display.mart_abil)}
                  </DescriptorChip>
                ) : null}
              </div>
              <p className="text-sm text-text-secondary">
                Power +{currentPow} · Martial +{currentMart} at level {level}
              </p>
              <p className="text-xs text-text-muted">
                Path abilities and proficiencies are set from the codex. Use the options below only
                if you want to leave this path or choose a different one.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-text-primary">Change creation style</h3>
              <div className="flex flex-col gap-3 sm:flex-row">
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
              <p className="text-sm text-text-secondary">
                No other archetype paths are available in the codex.
              </p>
            ) : (
              <div className="space-y-5">
                {PATH_CATEGORY_GROUPS.map((group) => {
                  const options = pathsByCategory[group];
                  if (options.length === 0) return null;
                  return (
                    <section key={group}>
                      <h4 className="mb-2 text-xs font-semibold tracking-wide text-text-secondary uppercase">
                        {pathCategoryGroupLabel(group)}
                      </h4>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {options.map((option) => (
                          <SelectionCard
                            key={option.id}
                            onClick={() => setPendingConfirm({ type: 'switch-path', path: option })}
                            className="min-h-[44px] text-left"
                          >
                            <span className="mb-1 block font-semibold text-text-primary">
                              {option.name}
                            </span>
                            {option.description ? (
                              <span className="block text-sm whitespace-pre-wrap text-text-secondary">
                                {option.description}
                              </span>
                            ) : null}
                          </SelectionCard>
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
            <p className="text-sm text-text-muted">
              Total proficiency at level {level}: {effectiveTotal} (redistributed when you change
              type).
            </p>

            <div>
              <h3 className="mb-2 text-sm font-medium text-text-primary">Archetype Type</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {(
                  Object.entries(ARCHETYPE_CATEGORY_INFO) as [
                    ArchetypeCategory,
                    typeof ARCHETYPE_CATEGORY_INFO.power,
                  ][]
                ).map(([type, info]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleTypeSelect(type)}
                    className={cn(
                      'min-h-[44px] rounded-lg border-2 p-4 text-left transition-all',
                      selectedType === type
                        ? 'border-primary-outline-border bg-primary-subtle-bg'
                        : 'border-border-light bg-surface hover:border-border',
                    )}
                  >
                    <span className="font-medium text-text-primary">{info.title}</span>
                    <p className="mt-1 text-xs text-text-muted">{info.description}</p>
                    {selectedType === type && (
                      <span className="mt-2 inline-block text-xs text-primary-fg">
                        {type === 'power' && `Power +${powProf}`}
                        {type === 'martial' && `Martial +${martProf}`}
                        {type === 'powered-martial' && `Martial +${martProf} / Power +${powProf}`}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-medium text-text-primary">
                {selectedType === 'powered-martial'
                  ? 'Power and Martial Abilities (must be different)'
                  : selectedType === 'power'
                    ? 'Power Ability'
                    : 'Martial Ability'}
              </h3>

              {selectedType === 'powered-martial' ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="mb-2 text-xs font-medium text-power-fg">Power Ability</h4>
                    <div className="flex flex-wrap gap-2">
                      {ARCHETYPE_ABILITY_OPTIONS.map((ability) => (
                        <AbilityPickButton
                          key={`power-${ability}`}
                          variant="power"
                          ability={ability}
                          selected={selectedPowerAbility === ability}
                          disabled={selectedMartialAbility === ability}
                          onPick={() => setSelectedPowerAbility(ability)}
                          withTooltip={false}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-2 text-xs font-medium text-martial-fg">Martial Ability</h4>
                    <div className="flex flex-wrap gap-2">
                      {ARCHETYPE_ABILITY_OPTIONS.map((ability) => (
                        <AbilityPickButton
                          key={`martial-${ability}`}
                          variant="martial"
                          ability={ability}
                          selected={selectedMartialAbility === ability}
                          disabled={selectedPowerAbility === ability}
                          onPick={() => setSelectedMartialAbility(ability)}
                          withTooltip={false}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {ARCHETYPE_ABILITY_OPTIONS.map((ability) => (
                    <AbilityPickButton
                      key={ability}
                      variant={selectedType === 'power' ? 'power' : 'martial'}
                      ability={ability}
                      selected={
                        selectedType === 'power'
                          ? selectedPowerAbility === ability
                          : selectedMartialAbility === ability
                      }
                      disabled={false}
                      onPick={() =>
                        selectedType === 'power'
                          ? setSelectedPowerAbility(ability)
                          : setSelectedMartialAbility(ability)
                      }
                      withTooltip={false}
                    />
                  ))}
                </div>
              )}
            </div>

            {(selectedPowerAbility || selectedMartialAbility) && (
              <div className="flex flex-wrap gap-2">
                {selectedPowerAbility && (
                  <DescriptorChip variant="power">
                    Power: {formatAbilityLabel(selectedPowerAbility)}
                  </DescriptorChip>
                )}
                {selectedMartialAbility && (
                  <DescriptorChip variant="technique">
                    Martial: {formatAbilityLabel(selectedMartialAbility)}
                  </DescriptorChip>
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
        confirmLabel={
          pendingConfirm?.type === 'switch-forge' ? 'Continue to forge editor' : 'Change path'
        }
        confirmVariant="danger"
      />
    </>
  );
}
