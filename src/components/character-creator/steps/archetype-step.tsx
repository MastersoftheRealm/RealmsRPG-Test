/**
 * Archetype Step
 * ==============
 * Choose character archetype (Power, Martial, or Powered-Martial)
 */

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import type { ArchetypeCategory, AbilityName } from '@/types';

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
  const { draft, setArchetype, nextStep } = useCharacterCreatorStore();
  
  const [selectedType, setSelectedType] = useState<ArchetypeCategory | null>(
    draft.archetype?.type || null
  );
  const [selectedAbility, setSelectedAbility] = useState<AbilityName | null>(
    draft.pow_abil || draft.mart_abil || null
  );
  const [selectedMartialAbility, setSelectedMartialAbility] = useState<AbilityName | null>(
    draft.mart_abil || null
  );
  
  const isLocked = draft.archetype?.type !== undefined;

  const handleConfirm = () => {
    if (!selectedType || !selectedAbility) return;
    
    if (selectedType === 'powered-martial' && !selectedMartialAbility) return;
    
    setArchetype(
      selectedType, 
      selectedAbility, 
      selectedType === 'powered-martial' ? selectedMartialAbility! : undefined
    );
    nextStep();
  };

  const canConfirm = selectedType && selectedAbility && 
    (selectedType !== 'powered-martial' || selectedMartialAbility);

  if (isLocked) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Your Archetype</h1>
        
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-green-800 mb-2">
            {ARCHETYPE_INFO[draft.archetype!.type].title}
          </h2>
          <p className="text-green-700 mb-4">
            {ARCHETYPE_INFO[draft.archetype!.type].description}
          </p>
          
          <div className="flex flex-wrap gap-2">
            {draft.pow_abil && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                Power Ability: {draft.pow_abil.charAt(0).toUpperCase() + draft.pow_abil.slice(1)}
              </span>
            )}
            {draft.mart_abil && (
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full">
                Martial Ability: {draft.mart_abil.charAt(0).toUpperCase() + draft.mart_abil.slice(1)}
              </span>
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
      <h1 className="text-2xl font-bold text-text-primary mb-2">Choose Your Archetype</h1>
      <p className="text-text-secondary mb-6">
        Your archetype defines your character&apos;s approach to combat and supernatural abilities.
      </p>
      
      {/* Archetype Selection */}
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
                  : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow'
              )}
            >
              <h3 className="text-lg font-bold text-text-primary mb-2">{info.title}</h3>
              <p className="text-sm text-text-secondary">{info.description}</p>
            </button>
          )
        )}
      </div>
      
      {/* Ability Selection */}
      {selectedType && (
        <div className="bg-neutral-50 rounded-xl p-6 mb-6">
          <h3 className="font-bold text-text-primary mb-4">
            {selectedType === 'powered-martial' 
              ? 'Choose Your Power and Martial Abilities'
              : `Choose Your ${selectedType === 'power' ? 'Power' : 'Martial'} Ability`
            }
          </h3>
          
          {selectedType === 'powered-martial' ? (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-purple-700 mb-2">Power Ability</h4>
                <div className="grid grid-cols-2 gap-2">
                  {ABILITIES.map((ability) => (
                    <button
                      key={`power-${ability}`}
                      onClick={() => setSelectedAbility(ability)}
                      disabled={selectedMartialAbility === ability}
                      className={cn(
                        'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        selectedAbility === ability
                          ? 'bg-purple-600 text-white'
                          : selectedMartialAbility === ability
                          ? 'bg-neutral-100 text-text-muted cursor-not-allowed'
                          : 'bg-white border border-neutral-200 hover:border-purple-400'
                      )}
                    >
                      {ability.charAt(0).toUpperCase() + ability.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-red-700 mb-2">Martial Ability</h4>
                <div className="grid grid-cols-2 gap-2">
                  {ABILITIES.map((ability) => (
                    <button
                      key={`martial-${ability}`}
                      onClick={() => setSelectedMartialAbility(ability)}
                      disabled={selectedAbility === ability}
                      className={cn(
                        'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        selectedMartialAbility === ability
                          ? 'bg-red-600 text-white'
                          : selectedAbility === ability
                          ? 'bg-neutral-100 text-text-muted cursor-not-allowed'
                          : 'bg-white border border-neutral-200 hover:border-red-400'
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
                        ? 'bg-purple-600 text-white'
                        : 'bg-red-600 text-white'
                      : 'bg-white border border-neutral-200 hover:border-neutral-400'
                  )}
                >
                  {ability.charAt(0).toUpperCase() + ability.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Confirm Button */}
      <button
        onClick={handleConfirm}
        disabled={!canConfirm}
        className="btn-continue w-full"
      >
        Confirm Archetype
      </button>
    </div>
  );
}
