/**
 * Archetype Step
 * ==============
 * Choose character archetype (Power, Martial, or Powered-Martial)
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { statusPanel } from '@/lib/ui/status-surface-classes';
import { Chip, Button, Spinner, SelectionCard, Card } from '@/components/ui';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { useCodexArchetypes } from '@/hooks';
import { CreatorStepFooter } from '@/components/character-creator/creator-step-footer';
import { parseArchetypePathData, pathHasPlayerVisibleLevel1 } from '@/lib/game/archetype-path';
import type { Archetype, ArchetypeCategory, AbilityName } from '@/types';
import { InfoTippy } from '@/components/shared';
import { chooseCharacterCreationStyle, getTooltipTextByPowerAbility, martialAbility, powerAbility } from '../../../../public/tooltip-text';

const ABILITIES: AbilityName[] = ['strength', 'vitality', 'agility', 'acuity', 'intelligence', 'charisma'];

const ARCHETYPE_INFO: Record<ArchetypeCategory, { title: string; description: string }> = {
  power: {
    title: 'Power',
    description: 'Focus on supernatural, magical, or extraordinary abilities. You excel at manipulating energy and casting powerful effects.',
  },
  'powered-martial': {
    title: 'Powered-Martial',
    description: 'A balanced blend of martial prowess and supernatural abilities. You can fight effectively while also wielding power.',
  },
  martial: {
    title: 'Martial',
    description: 'Master of physical combat and martial techniques. You rely on skill, training, and physical prowess.',
  },
};

function AbilityPickButton({
  variant,
  ability,
  selected,
  disabled,
  onPick,
}: {
  variant: 'power' | 'martial';
  ability: AbilityName;
  selected: boolean;
  disabled: boolean;
  onPick: () => void;
}) {

  const abilityLabel = ability.charAt(0).toUpperCase() + ability.slice(1);

  return (
    <InfoTippy
      content={getTooltipTextByPowerAbility(ability)}
      label={`${abilityLabel} ability guidance`}
    >
      <button
        type="button"
        onClick={onPick}
        disabled={disabled}
        className={cn(
          'px-3 py-2 min-h-11 min-w-11 rounded-lg text-sm font-medium transition-colors',
          selected
            ? variant === 'power'
              ? 'bg-power-dark text-white'
              : 'bg-martial-dark text-white'
            : disabled
              ? 'bg-surface text-text-muted dark:text-text-secondary cursor-not-allowed'
              : 'bg-surface border border-border-light hover:border-border'
        )}
      >
        {abilityLabel}
      </button>
    </InfoTippy>
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
    draft.archetype?.type || null
  );
  const [selectedAbility, setSelectedAbility] = useState<AbilityName | null>(
    draft.pow_abil || draft.mart_abil || null
  );
  const [selectedMartialAbility, setSelectedMartialAbility] = useState<AbilityName | null>(
    draft.mart_abil || null
  );
  const [selectedPathId, setSelectedPathId] = useState<string | null>(draft.archetypePathId || null);
  // Path is the default entry (REALMS_PRODUCT_OVERVIEW.md §5.1); Forge is the
  // always-reachable Layer 3 escape hatch, not a co-equal first choice.
  const [creationChoice, setCreationChoice] = useState<'forge' | 'path'>(draft.creationMode || 'path');
  
  const archetypePathOptions = useMemo(() => {
    return (codexArchetypes as Archetype[])
      .map((archetype) => ({
        ...archetype,
        path_data: parseArchetypePathData(archetype.path_data),
      }))
      .filter((archetype) => pathHasPlayerVisibleLevel1(archetype.path_data));
  }, [codexArchetypes]);

  const selectedPath = useMemo(
    () => archetypePathOptions.find((option) => option.id === selectedPathId),
    [archetypePathOptions, selectedPathId]
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
      mart_abil: selectedType !== 'power' ? (selectedMartialAbility || selectedAbility) : undefined,
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
        selectedType === 'powered-martial' ? selectedMartialAbility! : undefined
      );
    }

    nextStep();
  };

  if (isLocked) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col flex-1 min-h-0">
        <h2 className="text-2xl font-bold text-text-primary mb-2">Your Archetype</h2>
        
        <div className={cn('border-2 rounded-xl p-6 mb-6', statusPanel.complete)}>
          <h3 className="text-xl font-bold text-success-fg mb-2">{draft.archetype?.name || ARCHETYPE_INFO[draft.archetype!.type].title}</h3>
          <p className="text-success-fg mb-4">{draft.archetype?.description || ARCHETYPE_INFO[draft.archetype!.type].description}</p>
          
          <div className="flex flex-wrap gap-2">
            {draft.creationMode && (
              <Chip variant="primary">
                {draft.creationMode === 'path' ? 'Archetype Path' : 'Forge Your Own Path'}
              </Chip>
            )}
            {draft.pow_abil && (
              <Chip variant="power">
                Power Ability: {draft.pow_abil.charAt(0).toUpperCase() + draft.pow_abil.slice(1)}
              </Chip>
            )}
            {draft.mart_abil && (
              <Chip variant="technique">
                Martial Ability: {draft.mart_abil.charAt(0).toUpperCase() + draft.mart_abil.slice(1)}
              </Chip>
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
          className="text-text-secondary hover:text-text-primary underline mb-6"
        >
          Choose a different archetype
        </button>

        <CreatorStepFooter onBack={prevStep} onContinue={nextStep} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col flex-1 min-h-0">
      <div className="flex items-center gap-1 mb-2">
        <h2 className="text-2xl font-bold text-text-primary">
          {creationChoice === 'forge' ? 'Forge Your Own Character' : 'Choose Your Path'}
        </h2>
          <InfoTippy content={chooseCharacterCreationStyle} label="Path vs Forge help" size="inline" />
      </div>
      <p className="text-text-secondary mb-6">
        {creationChoice === 'forge'
          ? 'Full control: pick your own Feats, Powers, Techniques, Armaments, Skills, and Equipment.'
          : 'Pick an archetype path and we’ll guide your build with curated recommendations. You can still customize everything later.'}
      </p>

      {creationChoice === 'path' && (
        <div className="mb-8">
          {isLoading ? (
            <div className="py-8 flex items-center justify-center">
              <Spinner size="md" />
            </div>
          ) : (
            <div className="space-y-5">
              {(['power', 'powered-martial', 'martial'] as const).map((group) => {
                const options = archetypePathOptions.filter((option) => option.type === group);
                if (options.length === 0) return null;
                return (
                  <section key={group}>
                    <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-2">
                      {group === 'power' ? 'Power Paths' : group === 'martial' ? 'Martial Paths' : 'Powered-Martial Paths'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                          <h4 className="font-semibold text-text-primary mb-1">{option.name}</h4>
                          <p
                            className={cn(
                              'text-sm text-text-secondary mb-2',
                              selectedPathId !== option.id && 'line-clamp-2'
                            )}
                          >
                            {option.description || 'No description provided.'}
                          </p>
                          {(option.archetype_ability || option.secondary_ability) && (
                            <div className="flex flex-wrap gap-1">
                              {option.archetype_ability && (
                                <Chip variant="power" size="sm">
                                  Primary Ability: {option.archetype_ability.charAt(0).toUpperCase() + option.archetype_ability.slice(1)}
                                </Chip>
                              )}
                              {option.secondary_ability && (
                                <Chip variant="technique" size="sm">
                                  Secondary Ability: {option.secondary_ability.charAt(0).toUpperCase() + option.secondary_ability.slice(1)}
                                </Chip>
                              )}
                            </div>
                          )}
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
              <h4 className="font-semibold text-text-primary mb-2">{selectedPath.name}</h4>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">
                {selectedPath.description || 'No description provided.'}
              </p>
              {(selectedPath.archetype_ability || selectedPath.secondary_ability) && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {selectedPath.archetype_ability && (
                    <Chip variant="power" size="sm">
                      Primary Ability:{' '}
                      {selectedPath.archetype_ability.charAt(0).toUpperCase() +
                        selectedPath.archetype_ability.slice(1)}
                    </Chip>
                  )}
                  {selectedPath.secondary_ability && (
                    <Chip variant="technique" size="sm">
                      Secondary Ability:{' '}
                      {selectedPath.secondary_ability.charAt(0).toUpperCase() +
                        selectedPath.secondary_ability.slice(1)}
                    </Chip>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Forge — always-reachable Layer 3 escape hatch (never the default). */}
          <div className="mt-8 rounded-xl border border-border-light bg-surface-alt p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-text-primary">Want full control?</h3>
              <p className="text-sm text-text-secondary">
                Forge your own character and pick every Feat, Power, Technique, Armament, Skill, and piece of Equipment yourself.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setCreationChoice('forge');
                setCreationMode('forge');
                setSelectedPathId(null);
              }}
              className="shrink-0 min-h-11"
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
            className="text-text-secondary hover:text-text-primary underline mb-6 min-h-11"
          >
            ← Back to guided paths
          </button>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {(Object.entries(ARCHETYPE_INFO) as [ArchetypeCategory, typeof ARCHETYPE_INFO.power][]).map(
              ([type, info]) => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedType(type);
                    setSelectedAbility(null);
                    setSelectedMartialAbility(null);
                  }}
                  className={cn(
                    'p-6 rounded-xl border-2 text-left transition-all',
                    selectedType === type
                      ? 'border-primary-outline-border bg-primary-subtle-bg shadow-lg'
                      : 'border-border-light bg-surface hover:border-border hover:shadow'
                  )}
                >
                  <h3 className="text-lg font-bold text-text-primary mb-2">{info.title}</h3>
                  <p className="text-sm text-text-secondary">{info.description}</p>
                </button>
              )
            )}
          </div>
      
          {selectedType && (
            <Card className="bg-surface-alt p-6 mb-6 shadow-none">
              <h3 className="font-bold text-text-primary mb-4">
                {selectedType === 'powered-martial' 
                  ? 'Choose Your Power and Martial Abilities'
                  : `Choose Your ${selectedType === 'power' ? 'Power' : 'Martial'} Ability`
                }
              </h3>
              
              {selectedType === 'powered-martial' ? (
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-1 mb-2">
                      <h4 className="text-sm font-medium text-power-fg">Power Ability</h4>
                      <InfoTippy content={powerAbility} label="Power ability help" size="inline" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {ABILITIES.map((ability) => (
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
                    <div className="flex items-center gap-1 mb-2">
                      <h4 className="text-sm font-medium text-martial-fg">Martial Ability</h4>
                      <InfoTippy content={martialAbility} label="Martial ability help" size="inline" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {ABILITIES.map((ability) => (
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
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {ABILITIES.map((ability) => (
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
