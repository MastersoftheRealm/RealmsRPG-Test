/**
 * Archetype Step
 * ==============
 * Choose character archetype (Power, Martial, or Powered-Martial)
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { statusPanel } from '@/lib/ui/status-surface-classes';
import { Button, Spinner, SelectionCard, Card, DescriptorChip } from '@/components/ui';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { useCodexArchetypes } from '@/hooks';
import { CreatorStepFooter } from '@/components/character-creator/creator-step-footer';
import { AbilityPickButton, InfoTippy } from '@/components/patterns';
import {
  ARCHETYPE_ABILITY_OPTIONS,
  PATH_CATEGORY_GROUPS,
  groupPathsByCategory,
  listPlayerVisiblePaths,
  pathCategoryGroupLabel,
} from '@/lib/game/archetype-edit';
import { buildPathAbilityChipLabels } from '@/lib/guided-creator/path-ability-labels';
import { ARCHETYPE_CATEGORY_INFO } from '@/lib/constants/copy';
import type { Archetype, ArchetypeCategory, AbilityName } from '@/types';
import {
  chooseCharacterCreationStyle,
  martialAbility,
  powerAbility,
} from '../../../../public/tooltip-text';

function PathAbilityChips({
  path,
  className,
}: {
  path: Archetype;
  className?: string | undefined;
}) {
  const chips = buildPathAbilityChipLabels(path);
  if (chips.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {chips.map((chip) => (
        <DescriptorChip
          key={chip.key}
          variant={chip.role === 'primary' ? 'power' : 'technique'}
          size="sm"
        >
          {chip.label}
        </DescriptorChip>
      ))}
    </div>
  );
}

export function ArchetypeStep() {
  const {
    draft,
    completedSteps,
    setArchetype,
    setArchetypePath,
    setCreationMode,
    nextStep,
    prevStep,
    reselectArchetype,
    updateDraft,
  } = useCharacterCreatorStore();
  const { data: codexArchetypes = [], isLoading } = useCodexArchetypes();

  const [selectedType, setSelectedType] = useState<ArchetypeCategory | null>(
    draft.archetype?.type || null,
  );
  const [selectedAbility, setSelectedAbility] = useState<AbilityName | null>(
    draft.pow_abil || draft.mart_abil || null,
  );
  const [selectedMartialAbility, setSelectedMartialAbility] = useState<AbilityName | null>(
    draft.mart_abil || null,
  );
  const [selectedPathId, setSelectedPathId] = useState<string | null>(
    draft.archetypePathId || null,
  );
  // Path is the default entry (REALMS_PRODUCT_OVERVIEW.md §5.1); Forge is the
  // always-reachable Layer 3 escape hatch, not a co-equal first choice.
  const [creationChoice, setCreationChoice] = useState<'forge' | 'path'>(
    draft.creationMode || 'path',
  );

  const archetypePathOptions = useMemo(
    () => listPlayerVisiblePaths(codexArchetypes as Archetype[]),
    [codexArchetypes],
  );

  const pathsByCategory = useMemo(
    () => groupPathsByCategory(archetypePathOptions),
    [archetypePathOptions],
  );

  const selectedPath = useMemo(
    () => archetypePathOptions.find((option) => option.id === selectedPathId),
    [archetypePathOptions, selectedPathId],
  );

  const isLocked = completedSteps.includes('archetype');

  const canConfirm =
    creationChoice === 'path'
      ? !!selectedPath
      : creationChoice === 'forge' &&
        !!selectedType &&
        !!selectedAbility &&
        (selectedType !== 'powered-martial' || !!selectedMartialAbility);

  // Keep draft in sync while picking so the next tab can act like Continue.
  useEffect(() => {
    if (isLocked) return;

    if (creationChoice === 'path') {
      if (selectedPath) setArchetypePath(selectedPath);
      return;
    }
    if (!canConfirm || !selectedType || !selectedAbility) return;
    if (selectedType === 'powered-martial' && !selectedMartialAbility) return;

    const archetype = {
      id: selectedType,
      name: selectedType.charAt(0).toUpperCase() + selectedType.slice(1),
      type: selectedType,
      pow_abil: selectedType !== 'martial' ? selectedAbility : undefined,
      mart_abil: selectedType !== 'power' ? selectedMartialAbility || selectedAbility : undefined,
      ability: selectedAbility,
    };

    updateDraft({
      creationMode: 'forge',
      archetype,
      pow_abil: archetype.pow_abil,
      mart_abil: archetype.mart_abil,
      archetypePathId: undefined,
    });
  }, [
    isLocked,
    creationChoice,
    canConfirm,
    selectedPath,
    selectedType,
    selectedAbility,
    selectedMartialAbility,
    setArchetypePath,
    updateDraft,
  ]);

  const handleConfirm = () => {
    if (!canConfirm) return;

    if (creationChoice === 'forge') {
      setArchetype(
        selectedType!,
        selectedAbility!,
        selectedType === 'powered-martial' ? selectedMartialAbility! : undefined,
      );
    }

    nextStep();
  };

  if (isLocked) {
    return (
      <div className="mx-auto flex min-h-0 max-w-2xl flex-1 flex-col">
        <h2 className="mb-2 text-2xl font-bold text-text-primary">Your Archetype</h2>

        <div className={cn('mb-6 rounded-xl border-2 p-6', statusPanel.complete)}>
          <h3 className="mb-2 text-xl font-bold text-success-fg">
            {draft.archetype?.name || ARCHETYPE_CATEGORY_INFO[draft.archetype!.type].title}
          </h3>
          <p className="mb-4 text-success-fg">
            {draft.archetype?.description ||
              ARCHETYPE_CATEGORY_INFO[draft.archetype!.type].description}
          </p>

          <div className="flex flex-wrap gap-2">
            {draft.creationMode && (
              <DescriptorChip variant="primary">
                {draft.creationMode === 'path' ? 'Archetype Path' : 'Forge Your Own Path'}
              </DescriptorChip>
            )}
            {draft.pow_abil && (
              <DescriptorChip variant="power">
                Power Ability: {draft.pow_abil.charAt(0).toUpperCase() + draft.pow_abil.slice(1)}
              </DescriptorChip>
            )}
            {draft.mart_abil && (
              <DescriptorChip variant="technique">
                Martial Ability:{' '}
                {draft.mart_abil.charAt(0).toUpperCase() + draft.mart_abil.slice(1)}
              </DescriptorChip>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedType(null);
            setSelectedAbility(null);
            setSelectedMartialAbility(null);
            reselectArchetype();
          }}
          className="mb-6 text-text-secondary underline hover:text-text-primary"
        >
          Choose a different archetype
        </button>

        <CreatorStepFooter onBack={prevStep} onContinue={nextStep} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-0 max-w-4xl flex-1 flex-col">
      <div className="mb-2 flex items-center gap-1">
        <h2 className="text-2xl font-bold text-text-primary">
          {creationChoice === 'forge' ? 'Forge Your Own Character' : 'Choose Your Path'}
        </h2>
        <InfoTippy
          content={chooseCharacterCreationStyle}
          label="Path vs Forge help"
          size="inline"
        />
      </div>
      <p className="mb-6 text-text-secondary">
        {creationChoice === 'forge'
          ? 'Full control: pick your own Feats, Powers, Techniques, Armaments, Skills, and Equipment.'
          : 'Pick an archetype path and we’ll guide your build with curated recommendations. You can still customize everything later.'}
      </p>

      {creationChoice === 'path' && (
        <div className="mb-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : (
            <div className="space-y-5">
              {PATH_CATEGORY_GROUPS.map((group) => {
                const options = pathsByCategory[group];
                if (options.length === 0) return null;
                return (
                  <section key={group}>
                    <h3 className="mb-2 text-sm font-semibold tracking-wide text-text-secondary uppercase">
                      {pathCategoryGroupLabel(group)}
                    </h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {options.map((option) => (
                        <SelectionCard
                          key={option.id}
                          selected={selectedPathId === option.id}
                          onClick={() => {
                            setSelectedPathId(option.id);
                            setCreationMode('path');
                          }}
                          className="text-left"
                        >
                          <h4 className="mb-1 font-semibold text-text-primary">{option.name}</h4>
                          <p
                            className={cn(
                              'mb-2 text-sm text-text-secondary',
                              selectedPathId !== option.id && 'line-clamp-2',
                            )}
                          >
                            {option.description || 'No description provided.'}
                          </p>
                          <PathAbilityChips path={option} className="mb-0" />
                        </SelectionCard>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          {selectedPath && (
            <div
              className="mt-5 rounded-xl border border-primary-subtle-border bg-primary-subtle-bg p-4"
              aria-live="polite"
            >
              <h4 className="mb-2 font-semibold text-text-primary">{selectedPath.name}</h4>
              <p className="text-sm whitespace-pre-wrap text-text-secondary">
                {selectedPath.description || 'No description provided.'}
              </p>
              <PathAbilityChips path={selectedPath} className="mt-3" />
            </div>
          )}

          {/* Forge — always-reachable Layer 3 escape hatch (never the default). */}
          <div className="mt-8 flex flex-col justify-between gap-3 rounded-xl border border-border-light bg-surface-alt p-4 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <h3 className="font-semibold text-text-primary">Want full control?</h3>
              <p className="text-sm text-text-secondary">
                Forge your own character and pick every Feat, Power, Technique, Armament, Skill, and
                piece of Equipment yourself.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setCreationChoice('forge');
                setCreationMode('forge');
                setSelectedPathId(null);
              }}
              className="min-h-11 shrink-0"
            >
              Forge your own →
            </Button>
          </div>
        </div>
      )}

      {creationChoice === 'forge' && (
        <>
          <button
            type="button"
            onClick={() => {
              setCreationChoice('path');
              setCreationMode('path');
              setSelectedType(null);
              setSelectedAbility(null);
              setSelectedMartialAbility(null);
            }}
            className="mb-6 min-h-11 text-text-secondary underline hover:text-text-primary"
          >
            ← Back to guided paths
          </button>
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {(
              Object.entries(ARCHETYPE_CATEGORY_INFO) as [
                ArchetypeCategory,
                typeof ARCHETYPE_CATEGORY_INFO.power,
              ][]
            ).map(([type, info]) => (
              <button
                key={type}
                onClick={() => {
                  setSelectedType(type);
                  setSelectedAbility(null);
                  setSelectedMartialAbility(null);
                }}
                className={cn(
                  'rounded-xl border-2 p-6 text-left transition-all',
                  selectedType === type
                    ? 'border-primary-outline-border bg-primary-subtle-bg shadow-lg'
                    : 'border-border-light bg-surface hover:border-border hover:shadow',
                )}
              >
                <h3 className="mb-2 text-lg font-bold text-text-primary">{info.title}</h3>
                <p className="text-sm text-text-secondary">{info.description}</p>
              </button>
            ))}
          </div>

          {selectedType && (
            <Card className="mb-6 bg-surface-alt p-6 shadow-none">
              <h3 className="mb-4 font-bold text-text-primary">
                {selectedType === 'powered-martial'
                  ? 'Choose Your Power and Martial Abilities'
                  : `Choose Your ${selectedType === 'power' ? 'Power' : 'Martial'} Ability`}
              </h3>

              {selectedType === 'powered-martial' ? (
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <div className="mb-2 flex items-center gap-1">
                      <h4 className="text-sm font-medium text-power-fg">Power Ability</h4>
                      <InfoTippy content={powerAbility} label="Power ability help" size="inline" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {ARCHETYPE_ABILITY_OPTIONS.map((ability) => (
                        <AbilityPickButton
                          key={`power-${ability}`}
                          variant="power"
                          ability={ability}
                          selected={selectedAbility === ability}
                          disabled={selectedMartialAbility === ability}
                          onPick={() => setSelectedAbility(ability)}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center gap-1">
                      <h4 className="text-sm font-medium text-martial-fg">Martial Ability</h4>
                      <InfoTippy
                        content={martialAbility}
                        label="Martial ability help"
                        size="inline"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {ARCHETYPE_ABILITY_OPTIONS.map((ability) => (
                        <AbilityPickButton
                          key={`martial-${ability}`}
                          variant="martial"
                          ability={ability}
                          selected={selectedMartialAbility === ability}
                          disabled={selectedAbility === ability}
                          onPick={() => setSelectedMartialAbility(ability)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {ARCHETYPE_ABILITY_OPTIONS.map((ability) => (
                    <AbilityPickButton
                      key={ability}
                      variant={selectedType === 'power' ? 'power' : 'martial'}
                      ability={ability}
                      selected={selectedAbility === ability}
                      disabled={false}
                      onPick={() => setSelectedAbility(ability)}
                    />
                  ))}
                </div>
              )}
            </Card>
          )}
        </>
      )}

      {/* Confirm Archetype */}
      <CreatorStepFooter
        primaryAction={
          <Button onClick={handleConfirm} disabled={!canConfirm} className="min-h-11 min-w-11">
            {creationChoice === 'path' ? 'Confirm Archetype Path' : 'Confirm Archetype'}
          </Button>
        }
      />
    </div>
  );
}
