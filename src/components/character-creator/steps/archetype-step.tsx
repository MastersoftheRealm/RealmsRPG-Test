/**
 * Archetype Step
 * ==============
 * Choose character archetype (Power, Martial, or Powered-Martial)
 */

'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Chip, Button, Spinner } from '@/components/ui';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { useCodexArchetypes } from '@/hooks';
import { parseArchetypePathData } from '@/lib/game/archetype-path';
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

export function ArchetypeStep() {
  const { draft, setArchetype, setArchetypePath, setCreationMode, nextStep } = useCharacterCreatorStore();
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
  
  const archetypePathOptions = useMemo(() => {
    return (codexArchetypes as Archetype[])
      .map((archetype) => ({
        ...archetype,
        path_data: parseArchetypePathData(archetype.path_data),
      }))
      .filter((archetype) => {
        const hasLevelOne =
          !!archetype.path_data?.level1 &&
          (archetype.path_data.level1.feats?.length ||
            archetype.path_data.level1.skills?.length ||
            archetype.path_data.level1.powers?.length ||
            archetype.path_data.level1.techniques?.length ||
            archetype.path_data.level1.armaments?.length ||
            archetype.path_data.level1.equipment?.length);
        return hasLevelOne;
      });
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
          onClick={() => {
            setSelectedType(null);
            setSelectedAbility(null);
            setSelectedMartialAbility(null);
            useCharacterCreatorStore.setState({ 
              draft: { 
                ...draft, 
                archetype: undefined,
                pow_abil: undefined,
                mart_abil: undefined,
                creationMode: undefined,
                archetypePathId: undefined,
              }
            });
          }}
          className="text-text-secondary hover:text-text-primary underline"
        >
          Choose a different archetype
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-text-primary mb-2">Choose Character Creation Style</h2>
      <p className="text-text-secondary mb-6">Pick a fully custom creation flow or an archetype-guided path with curated recommendations.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <button
          type="button"
          onClick={() => {
            setCreationChoice('forge');
            setCreationMode('forge');
            setSelectedPathId(null);
          }}
          className={cn(
            'selection-card text-left min-h-[160px]',
            creationChoice === 'forge' && 'selection-card--selected'
          )}
        >
          <h3 className="text-lg font-bold text-text-primary mb-2">Forge Your Own Path</h3>
          <p className="text-text-secondary text-sm">
            Fully customizable character creation. Pick your own Feats, Powers, Techniques, Armaments, Skills, and Equipment.
          </p>
        </button>
        <button
          type="button"
          onClick={() => {
            setCreationChoice('path');
            setCreationMode('path');
          }}
          className={cn(
            'selection-card text-left min-h-[160px]',
            creationChoice === 'path' && 'selection-card--selected'
          )}
        >
          <h3 className="text-lg font-bold text-text-primary mb-2">Choose a Path</h3>
          <p className="text-text-secondary text-sm">
            Faster setup with official archetype paths that recommend Feats, Powers, Techniques, Armaments, Skills, and Equipment.
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
                      {options.map((option) => {
                        const level1 = option.path_data?.level1;
                        const chips = [
                          ...(level1?.feats || []).map((id: string) => ({ label: id, variant: 'feat' as const })),
                          ...(level1?.skills || []).map((id: string) => ({ label: id, variant: 'secondary' as const })),
                          ...(level1?.powers || []).map((id: string) => ({ label: id, variant: 'power' as const })),
                          ...(level1?.techniques || []).map((id: string) => ({ label: id, variant: 'technique' as const })),
                          ...(level1?.armaments || []).map((id: string) => ({ label: id, variant: 'outline' as const })),
                          ...(level1?.equipment || []).map((id: string) => ({ label: id, variant: 'default' as const })),
                        ];

                        return (
                          <button
                            type="button"
                            key={option.id}
                            onClick={() => setSelectedPathId(option.id)}
                            className={cn(
                              'selection-card text-left',
                              selectedPathId === option.id && 'selection-card--selected'
                            )}
                          >
                            <div className="flex items-center justify-between mb-1 gap-2">
                              <h4 className="font-semibold text-text-primary">{option.name}</h4>
                              <span className="text-xs px-2 py-0.5 rounded bg-surface-alt text-text-secondary">{option.type}</span>
                            </div>
                            <p className="text-sm text-text-secondary mb-2 line-clamp-2">{option.description || 'No description provided.'}</p>
                            <div className="flex flex-wrap gap-1">
                              {chips.slice(0, 8).map((chip) => (
                                <Chip key={`${option.id}-${chip.label}-${chip.variant}`} variant={chip.variant} size="sm">
                                  {chip.label}
                                </Chip>
                              ))}
                              {chips.length > 8 && (
                                <Chip variant="default" size="sm">+{chips.length - 8} more</Chip>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          {selectedPath && (
            <div className="mt-4 p-4 rounded-lg border border-border-light bg-surface-alt">
              <p className="text-sm text-text-secondary">
                <strong className="text-text-primary">Selected Path:</strong> {selectedPath.name}
                {selectedPath.archetype_ability ? ` • Primary Ability: ${selectedPath.archetype_ability}` : ''}
                {selectedPath.secondary_ability ? ` • Secondary Ability: ${selectedPath.secondary_ability}` : ''}
              </p>
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
                    <h4 className="text-sm font-medium text-violet-600 dark:text-violet-300 mb-2">Power Ability</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {ABILITIES.map((ability) => (
                        <button
                          key={`power-${ability}`}
                          onClick={() => setSelectedAbility(ability)}
                          disabled={selectedMartialAbility === ability}
                          className={cn(
                            'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                            selectedAbility === ability
                              ? 'bg-violet-500 text-white dark:bg-violet-600 dark:text-white'
                              : selectedMartialAbility === ability
                              ? 'bg-surface text-text-muted dark:text-text-secondary cursor-not-allowed'
                              : 'bg-surface border border-border-light hover:border-violet-400'
                          )}
                        >
                          {ability.charAt(0).toUpperCase() + ability.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">Martial Ability</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {ABILITIES.map((ability) => (
                        <button
                          key={`martial-${ability}`}
                          onClick={() => setSelectedMartialAbility(ability)}
                          disabled={selectedAbility === ability}
                          className={cn(
                            'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                            selectedMartialAbility === ability
                              ? 'bg-red-600 text-white dark:bg-red-700 dark:text-white'
                              : selectedAbility === ability
                              ? 'bg-surface text-text-muted dark:text-text-secondary cursor-not-allowed'
                              : 'bg-surface border border-border-light hover:border-red-400'
                          )}
                        >
                          {ability.charAt(0).toUpperCase() + ability.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {ABILITIES.map((ability) => (
                    <button
                      key={ability}
                      onClick={() => setSelectedAbility(ability)}
                      className={cn(
                        'px-4 py-3 rounded-lg font-medium transition-colors',
                        selectedAbility === ability
                          ? selectedType === 'power' 
                            ? 'bg-violet-500 text-white dark:bg-violet-600 dark:text-white'
                            : 'bg-red-600 text-white dark:bg-red-700 dark:text-white'
                          : 'bg-surface border border-border-light hover:border-border'
                      )}
                    >
                      {ability.charAt(0).toUpperCase() + ability.slice(1)}
                    </button>
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
