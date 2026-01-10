/**
 * Character Creator Store
 * ========================
 * Zustand store for character creation state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { 
  Character, 
  CharacterDraft, 
  ArchetypeCategory, 
  AbilityName, 
  Abilities 
} from '@/types';
import { DEFAULT_ABILITIES, DEFAULT_DEFENSE_SKILLS } from '@/types';

export type CreatorStep = 
  | 'archetype' 
  | 'species' 
  | 'ancestry' 
  | 'abilities' 
  | 'skills' 
  | 'feats' 
  | 'equipment' 
  | 'powers' 
  | 'finalize';

const STEP_ORDER: CreatorStep[] = [
  'archetype',
  'species', 
  'ancestry',
  'abilities',
  'skills',
  'feats',
  'equipment',
  'powers',
  'finalize',
];

interface CharacterCreatorState {
  // Current step
  currentStep: CreatorStep;
  completedSteps: CreatorStep[];
  
  // Character draft data
  draft: CharacterDraft;
  
  // Actions
  setStep: (step: CreatorStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  markStepComplete: (step: CreatorStep) => void;
  canNavigateToStep: (step: CreatorStep) => boolean;
  
  // Draft updates
  updateDraft: (updates: Partial<CharacterDraft>) => void;
  setArchetype: (type: ArchetypeCategory, ability: AbilityName, martialAbility?: AbilityName) => void;
  setSpecies: (speciesId: string, speciesName: string) => void;
  setAncestry: (ancestryId: string, ancestryName: string, traits: string[]) => void;
  updateAbility: (ability: AbilityName, value: number) => void;
  
  // Reset
  resetCreator: () => void;
  
  // Generate final character
  getCharacter: () => Partial<Character>;
}

const initialDraft: CharacterDraft = {
  name: '',
  level: 1,
  abilities: { ...DEFAULT_ABILITIES },
  step: 0,
  isComplete: false,
};

export const useCharacterCreatorStore = create<CharacterCreatorState>()(
  persist(
    (set, get) => ({
      currentStep: 'archetype',
      completedSteps: [],
      draft: initialDraft,
      
      setStep: (step) => {
        if (get().canNavigateToStep(step)) {
          set({ currentStep: step });
        }
      },
      
      nextStep: () => {
        const currentIndex = STEP_ORDER.indexOf(get().currentStep);
        if (currentIndex < STEP_ORDER.length - 1) {
          get().markStepComplete(get().currentStep);
          set({ currentStep: STEP_ORDER[currentIndex + 1] });
        }
      },
      
      prevStep: () => {
        const currentIndex = STEP_ORDER.indexOf(get().currentStep);
        if (currentIndex > 0) {
          set({ currentStep: STEP_ORDER[currentIndex - 1] });
        }
      },
      
      markStepComplete: (step) => {
        const completed = get().completedSteps;
        if (!completed.includes(step)) {
          set({ completedSteps: [...completed, step] });
        }
      },
      
      canNavigateToStep: (step) => {
        const targetIndex = STEP_ORDER.indexOf(step);
        const currentIndex = STEP_ORDER.indexOf(get().currentStep);
        const completed = get().completedSteps;
        
        // Can always go back
        if (targetIndex <= currentIndex) return true;
        
        // Can only go forward if all previous steps are complete
        for (let i = 0; i < targetIndex; i++) {
          if (!completed.includes(STEP_ORDER[i])) return false;
        }
        return true;
      },
      
      updateDraft: (updates) => {
        set({ draft: { ...get().draft, ...updates } });
      },
      
      setArchetype: (type, ability, martialAbility) => {
        const archetype = {
          id: type,
          name: type.charAt(0).toUpperCase() + type.slice(1),
          type,
          pow_abil: type !== 'martial' ? ability : undefined,
          mart_abil: type !== 'power' ? (martialAbility || ability) : undefined,
          ability,
        };
        
        set({
          draft: {
            ...get().draft,
            archetype,
            pow_abil: archetype.pow_abil,
            mart_abil: archetype.mart_abil,
          }
        });
      },
      
      setSpecies: (speciesId, speciesName) => {
        const currentAncestry = get().draft.ancestry;
        set({
          draft: {
            ...get().draft,
            ancestry: {
              ...currentAncestry,
              id: speciesId,
              name: speciesName,
            } as CharacterDraft['ancestry'],
          }
        });
      },
      
      setAncestry: (ancestryId, ancestryName, traits) => {
        const currentAncestry = get().draft.ancestry;
        set({
          draft: {
            ...get().draft,
            ancestry: {
              ...currentAncestry,
              id: ancestryId,
              name: ancestryName,
              traits,
            } as CharacterDraft['ancestry'],
          }
        });
      },
      
      updateAbility: (ability, value) => {
        const abilities = get().draft.abilities || { ...DEFAULT_ABILITIES };
        set({
          draft: {
            ...get().draft,
            abilities: { ...abilities, [ability]: value },
          }
        });
      },
      
      resetCreator: () => {
        set({
          currentStep: 'archetype',
          completedSteps: [],
          draft: initialDraft,
        });
      },
      
      getCharacter: () => {
        const { draft } = get();
        
        // Calculate base and allocated health/energy
        const baseHealth = 10; // Default base health
        const baseEnergy = 10; // Default base energy
        const allocatedHealth = draft.healthPoints || 0;
        const allocatedEnergy = draft.energyPoints || 0;
        
        return {
          name: draft.name || 'Unnamed Character',
          level: draft.level || 1,
          abilities: draft.abilities || { ...DEFAULT_ABILITIES },
          archetype: draft.archetype,
          pow_abil: draft.pow_abil,
          mart_abil: draft.mart_abil,
          // Match vanilla naming
          species: draft.ancestry?.name || '',
          ancestry: draft.ancestry,
          skills: draft.skills,
          defenseSkills: draft.defenseSkills || { ...DEFAULT_DEFENSE_SKILLS },
          defenseVals: draft.defenseSkills || { ...DEFAULT_DEFENSE_SKILLS },
          feats: draft.feats || [],
          powers: draft.powers || [],
          techniques: draft.techniques || [],
          equipment: draft.equipment || [],
          // Health/Energy tracking
          health_energy_points: {
            health: allocatedHealth,
            energy: allocatedEnergy,
          },
          currentHealth: baseHealth + allocatedHealth,
          currentEnergy: baseEnergy + allocatedEnergy,
          // Optional fields
          description: draft.description || '',
          notes: draft.notes || '',
          appearance: draft.appearance || '',
          portrait: draft.portrait || '',
          status: 'complete' as const,
        };
      },
    }),
    {
      name: 'character-creator-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        draft: state.draft,
      }),
    }
  )
);

export { STEP_ORDER };
