/**
 * Archetype Step
 * ==============
 * Choose character archetype (Power, Martial, or Powered-Martial)
 */

'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Chip, Button, Spinner, HelpTooltip, Tooltip } from '@/components/ui';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { useCodexArchetypes, useTooltipByKey } from '@/hooks';
import { parseArchetypePathData, pathHasPlayerVisibleLevel1 } from '@/lib/game/archetype-path';
import type { Archetype, ArchetypeCategory, AbilityName } from '@/types';

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
  const tooltip = useTooltipByKey(`characters.new.step.archetype.ability.${ability}`, {
    scope: 'page:/characters/new',
  });

  const button = (
    <button
      type="button"
      onClick={onPick}
      disabled={disabled}
      className={cn(
        'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
        selected
          ? variant === 'power'
            ? 'bg-violet-500 text-white dark:bg-violet-600 dark:text-white'
            : 'bg-red-600 text-white dark:bg-red-700 dark:text-white'
          : disabled
            ? 'bg-surface text-text-muted dark:text-text-secondary cursor-not-allowed'
            : 'bg-surface border border-border-light hover:border-border'
      )}
    >
      {ability.charAt(0).toUpperCase() + ability.slice(1)}
    </button>
  );

  if (!tooltip.showTooltips || !tooltip.body) return button;

  return (
    <Tooltip content={tooltip.body} placement="top" trigger="hover">
      {button}
    </Tooltip>
  );
}

export function ArchetypeStep() {
  const { draft, setArchetype, setArchetypePath, setCreationMode, nextStep, prevStep, reselectArchetype } = useCharacterCreatorStore();
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
  const [creationChoice, setCreationChoice] = useState<'forge' | 'path' | null>(draft.creationMode || null);
  const archetypeTooltip = useTooltipByKey('characters.new.step.archetype.pathHelp', {
    scope: 'page:/characters/new',
  });
  
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

  const isLocked = draft.archetype?.type !== undefined && draft.creationMode !== undefined;

  const handleConfirm = () => {
    if (creationChoice === 'path') {
      if (!selectedPath) return;
      setArchetypePath(selectedPath);
      nextStep();
      return;
    }

    if (!selectedType || !selectedAbility) return;
    
    if (selectedType === 'powered-martial' && !selectedMartialAbility) return;
    
    setArchetype(
      selectedType, 
      selectedAbility, 
      selectedType === 'powered-martial' ? selectedMartialAbility! : undefined
    );
    nextStep();
  };

  const canConfirm =
    creationChoice === 'path'
      ? !!selectedPath
      : creationChoice === 'forge' &&
        !!selectedType &&
        !!selectedAbility &&
        (selectedType !== 'powered-martial' || !!selectedMartialAbility);

  if (isLocked) {
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-text-primary mb-2">Your Archetype</h2>
        
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl p-6 mb-6">
          <h3 className="text-xl font-bold text-success-800 dark:text-success-300 mb-2">{draft.archetype?.name || ARCHETYPE_INFO[draft.archetype!.type].title}</h3>
          <p className="text-success-700 dark:text-success-300 mb-4">{draft.archetype?.description || ARCHETYPE_INFO[draft.archetype!.type].description}</p>
          
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

        <div className="flex justify-between">
          <Button variant="secondary" onClick={prevStep} className="min-h-[44px]">
            ← Back
          </Button>
          <Button onClick={nextStep} className="min-h-[44px]">
            Continue →
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-1 mb-2">
        <h2 className="text-2xl font-bold text-text-primary">Choose Character Creation Style</h2>
        {archetypeTooltip.showTooltips && archetypeTooltip.body && (
          <HelpTooltip
            title={archetypeTooltip.title}
            content={archetypeTooltip.body}
            label="Archetype style help"
          />
        )}
      </div>
      <p className="text-text-secondary mb-6">Pick a fully custom creation flow or an archetype-guided path with curated recommendations.</p>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-8">
        <button
          type="button"
          onClick={() => {
            setCreationChoice('path');
            setCreationMode('path');
          }}
          className={cn(
            'selection-card text-left min-h-[160px] flex-1',
            creationChoice === 'path' && 'selection-card--selected'
          )}
        >
          <h3 className="text-lg font-bold text-text-primary mb-2">Choose a Path</h3>
          <p className="text-text-secondary text-sm">
            Faster setup with official archetype paths that recommend Feats, Powers, Techniques, Armaments, Skills, and Equipment.
          </p>
        </button>
        <span className="text-text-muted dark:text-text-secondary text-sm font-medium self-center shrink-0" aria-hidden="true">or</span>
        <button
          type="button"
          onClick={() => {
            setCreationChoice('forge');
            setCreationMode('forge');
            setSelectedPathId(null);
          }}
          className={cn(
            'selection-card text-left min-h-[160px] flex-1',
            creationChoice === 'forge' && 'selection-card--selected'
          )}
        >
          <h3 className="text-lg font-bold text-text-primary mb-2">Forge Your Own</h3>
          <p className="text-text-secondary text-sm">
            Fully customizable character creation. Pick your own Feats, Powers, Techniques, Armaments, Skills, and Equipment.
          </p>
        </button>
      </div>
      
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
                        <button
                          type="button"
                          key={option.id}
                          onClick={() => setSelectedPathId(option.id)}
                          className={cn(
                            'selection-card text-left',
                            selectedPathId === option.id && 'selection-card--selected'
                          )}
                        >
                          <h4 className="font-semibold text-text-primary mb-1">{option.name}</h4>
                          <p className="text-sm text-text-secondary mb-2 line-clamp-2">{option.description || 'No description provided.'}</p>
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

      {creationChoice === 'forge' && (
        <>
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
                      ? 'border-primary-600 bg-primary-50 shadow-lg'
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
            <div className="bg-surface-alt rounded-xl p-6 mb-6">
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
                      <h4 className="text-sm font-medium text-violet-600 dark:text-violet-300">Power Ability</h4>
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
                      <h4 className="text-sm font-medium text-red-700 dark:text-red-300">Martial Ability</h4>
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
            </div>
          )}
        </>
      )}
      
      {/* Confirm Button */}
      <Button
        onClick={handleConfirm}
        disabled={!canConfirm}
        className="w-full"
      >
        {creationChoice === 'path' ? 'Confirm Archetype Path' : 'Confirm Archetype'}
      </Button>
    </div>
  );
}
