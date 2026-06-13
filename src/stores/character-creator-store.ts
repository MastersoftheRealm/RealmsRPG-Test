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
  Archetype,
  Item,
} from '@/types';
import { DEFAULT_ABILITIES, DEFAULT_DEFENSE_SKILLS } from '@/types';
import { calculateMaxHealth, calculateMaxEnergy } from '@/lib/game/calculations';
import { buildRequiredProficiencies } from '@/lib/proficiencies';

export const CHARACTER_STARTING_CURRENCY = 200;

function downstreamDraftReset(): Partial<CharacterDraft> {
  return {
    ancestry: undefined,
    skills: {},
    feats: [],
    equipment: undefined,
    powers: [],
    techniques: [],
    abilities: { ...DEFAULT_ABILITIES },
    healthPoints: 0,
    energyPoints: 0,
    currency: CHARACTER_STARTING_CURRENCY,
    defenseVals: { ...DEFAULT_DEFENSE_SKILLS },
    defenseSkills: { ...DEFAULT_DEFENSE_SKILLS },
    pow_prof: undefined,
    mart_prof: undefined,
    declinedPathSkillIds: undefined,
  };
}

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

function completedStepsThrough(step: CreatorStep): CreatorStep[] {
  const idx = STEP_ORDER.indexOf(step);
  return STEP_ORDER.slice(0, idx + 1);
}

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
  setCreationMode: (mode: 'forge' | 'path') => void;
  setArchetypePath: (archetype: Archetype) => void;
  setSpecies: (speciesId: string, speciesName: string) => void;
  setMixedSpecies: (speciesA: { id: string; name: string }, speciesB: { id: string; name: string }) => void;
  setAncestry: (ancestryId: string, ancestryName: string, traits: string[]) => void;
  updateAbility: (ability: AbilityName, value: number) => void;
  reselectArchetype: () => void;
  
  // Reset
  resetCreator: () => void;
  
  // Generate final character (pass part DBs so proficiencies get correct TP from codex)
  getCharacter: (options?: {
    powerPartsDb?: Array<{ id?: string | number; name?: string; base_tp?: number; op_1_tp?: number; op_2_tp?: number; op_3_tp?: number }>;
    techniquePartsDb?: Array<{ id?: string | number; name?: string; base_tp?: number; op_1_tp?: number; op_2_tp?: number; op_3_tp?: number }>;
    itemPropertiesDb?: Array<{ id?: string | number; name?: string; base_tp?: number; op_1_tp?: number }>;
  }) => Partial<Character>;
}

const initialDraft: CharacterDraft = {
  name: '',
  level: 1,
  abilities: { ...DEFAULT_ABILITIES },
  step: 0,
  isComplete: false,
  currency: CHARACTER_STARTING_CURRENCY,
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
        const { draft, completedSteps } = get();
        const idx = STEP_ORDER.indexOf(step);
        if (idx === 0) return true;

        for (let i = 0; i < idx; i++) {
          const prev = STEP_ORDER[i];
          if (prev === 'archetype') {
            if (!draft.archetype?.type) return false;
            continue;
          }
          if (!completedSteps.includes(prev)) return false;
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
          completedSteps: completedStepsThrough('archetype'),
          draft: {
            ...get().draft,
            ...downstreamDraftReset(),
            creationMode: 'forge',
            archetype,
            pow_abil: archetype.pow_abil,
            mart_abil: archetype.mart_abil,
            archetypePathId: undefined,
          },
        });
      },

      setCreationMode: (mode) => {
        set({
          draft: {
            ...get().draft,
            creationMode: mode,
          },
        });
      },

      setArchetypePath: (archetype) => {
        const type = (archetype.type || 'power') as ArchetypeCategory;
        const pathPowerProf = archetype.power_prof_start ?? (type === 'power' ? 2 : type === 'powered-martial' ? 1 : 0);
        const pathMartialProf = archetype.martial_prof_start ?? (type === 'martial' ? 2 : type === 'powered-martial' ? 1 : 0);
        const primaryAbility = archetype.archetype_ability;
        const fallbackPowerAbility = archetype.pow_abil || archetype.ability || primaryAbility;
        const fallbackMartialAbility = archetype.mart_abil || archetype.ability || primaryAbility;
        const prevPathId = get().draft.archetypePathId;
        const pathChanged = prevPathId !== undefined && prevPathId !== archetype.id;

        set({
          completedSteps: pathChanged ? completedStepsThrough('archetype') : get().completedSteps,
          draft: {
            ...get().draft,
            ...(pathChanged ? downstreamDraftReset() : {}),
            creationMode: 'path',
            archetype: {
              id: archetype.id,
              name: archetype.name,
              type,
              description: archetype.description,
              archetype_ability: archetype.archetype_ability,
              secondary_ability: archetype.secondary_ability,
              power_prof_start: archetype.power_prof_start,
              martial_prof_start: archetype.martial_prof_start,
              power_prof_level5: archetype.power_prof_level5,
              martial_prof_level5: archetype.martial_prof_level5,
              path_data: archetype.path_data,
              pow_abil: archetype.pow_abil,
              mart_abil: archetype.mart_abil,
              ability: archetype.ability,
            },
            archetypePathId: archetype.id,
            pow_abil: fallbackPowerAbility,
            mart_abil: fallbackMartialAbility,
            pow_prof: pathPowerProf,
            mart_prof: pathMartialProf,
            ...(pathChanged ? { declinedPathSkillIds: undefined } : {}),
          },
        });
      },
      
      setSpecies: (speciesId, speciesName) => {
        set({
          draft: {
            ...get().draft,
            ancestry: {
              id: speciesId,
              name: speciesName,
              selectedTraits: [],
              selectedFlaw: undefined,
              selectedCharacteristic: undefined,
              mixed: false,
              speciesIds: undefined,
              speciesNames: undefined,
              selectedSize: undefined,
              selectedSpeciesTraits: undefined,
              selectedFlawSpeciesId: undefined,
              mixedPhysical: undefined,
              selectedSpeciesTraitChoices: undefined,
            } as CharacterDraft['ancestry'],
          }
        });
      },

      setMixedSpecies: (speciesA, speciesB) => {
        set({
          draft: {
            ...get().draft,
            ancestry: {
              id: `mixed:${speciesA.id}+${speciesB.id}`,
              name: `${speciesA.name} / ${speciesB.name}`,
              mixed: true,
              speciesIds: [speciesA.id, speciesB.id],
              speciesNames: [speciesA.name, speciesB.name],
              selectedTraits: [],
              selectedFlaw: undefined,
              selectedCharacteristic: undefined,
              selectedSize: undefined,
              selectedSpeciesTraits: undefined,
              selectedFlawSpeciesId: undefined,
              mixedPhysical: undefined,
              selectedSpeciesSkillIds: undefined,
              selectedSpeciesTraitChoices: undefined,
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

      reselectArchetype: () => {
        set({
          completedSteps: [],
          draft: {
            ...get().draft,
            ...downstreamDraftReset(),
            archetype: undefined,
            pow_abil: undefined,
            mart_abil: undefined,
            creationMode: undefined,
            archetypePathId: undefined,
          },
        });
      },
      
      resetCreator: () => {
        set({
          currentStep: 'archetype',
          completedSteps: [],
          draft: initialDraft,
        });
      },
      
      getCharacter: (options) => {
        const { draft } = get();
        
        // Calculate health/energy using centralized formulas (calculations.ts)
        const abilities = draft.abilities || { ...DEFAULT_ABILITIES };
        const level = draft.level || 1;
        const allocatedHealth = draft.healthPoints || 0;
        const allocatedEnergy = draft.energyPoints || 0;
        
        const powAbil = draft.pow_abil || draft.archetype?.pow_abil || draft.archetype?.ability;
        const martAbil = draft.mart_abil || draft.archetype?.mart_abil;
        
        const maxHealth = calculateMaxHealth(allocatedHealth, abilities.vitality || 0, level, powAbil, abilities);
        const maxEnergy = calculateMaxEnergy(allocatedEnergy, powAbil || martAbil, abilities, level);
        
        // Save lean archetype — just id + type. Name/description derived from codex on load.
        // pow_abil/mart_abil saved at top level as user choices.
        const archetype = draft.archetype ? {
          id: draft.archetype.id,
          type: draft.archetype.type,
        } : undefined;
        
        // Transform equipment from inventory format to weapons/armor/items format
        // for compatibility with character sheet
        const inventory = draft.equipment?.inventory || [];
        const weapons = inventory.filter(item => item.type === 'weapon');
        const armor = inventory.filter(item => item.type === 'armor');
        const items = inventory.filter(item => item.type === 'equipment' || (!item.type));
        const equipment = {
          weapons,
          armor,
          items,
          shields: inventory.filter(item => item.type === 'shield'),
          // Also keep original inventory for reference
          inventory,
        };

        const proficiencies = buildRequiredProficiencies({
          powers: (draft.powers as Character['powers']) || [],
          techniques: (draft.techniques as Character['techniques']) || [],
          weapons: weapons as Item[],
          shields: equipment.shields as unknown as Item[],
          armor: armor as unknown as Item[],
          powerPartsDb: options?.powerPartsDb ?? [],
          techniquePartsDb: options?.techniquePartsDb ?? [],
          itemPropertiesDb: options?.itemPropertiesDb ?? [],
        });
        
        return {
          name: draft.name || 'Unnamed Character',
          level,
          abilities,
          ...(archetype && { archetype }),
          ...(draft.archetypePathId && { archetypePathId: draft.archetypePathId }),
          ...(draft.creationMode && { creationMode: draft.creationMode }),
          ...(draft.pow_abil && { pow_abil: draft.pow_abil }),
          ...(draft.mart_abil && { mart_abil: draft.mart_abil }),
          // Proficiency allocation - set based on archetype type
          mart_prof: draft.mart_prof ?? (
            draft.archetype?.type === 'martial' ? 2 : 
            draft.archetype?.type === 'powered-martial' ? 1 : 0
          ),
          pow_prof: draft.pow_prof ?? (
            draft.archetype?.type === 'power' ? 2 : 
            draft.archetype?.type === 'powered-martial' ? 1 : 0
          ),
          // Health/Energy point allocations from character creation
          healthPoints: draft.healthPoints || 0,
          energyPoints: draft.energyPoints || 0,
          // Currency remaining from equipment purchases
          currency: draft.currency ?? CHARACTER_STARTING_CURRENCY,
          // Species/ancestry — lean save: { id, name, selectedTraits, selectedFlaw, selectedCharacteristic }
          ancestry: draft.ancestry,
          skills: draft.skills || {},
          defenseVals: draft.defenseVals || draft.defenseSkills || { ...DEFAULT_DEFENSE_SKILLS },
          // Separate feats by type - archetype feats vs character feats
          // The feats step stores them with type: 'archetype' | 'character'
          archetypeFeats: (draft.feats || [])
            .filter((f: { type?: string }) => f.type !== 'character')
            .map(({ type, ...rest }) => rest), // Remove the type field
          feats: (draft.feats || [])
            .filter((f: { type?: string }) => f.type === 'character')
            .map(({ type, ...rest }) => rest), // Remove the type field
          powers: draft.powers || [],
          techniques: draft.techniques || [],
          equipment: equipment,
          unarmedProwess: draft.unarmedProwess ?? 0,
          proficiencies,
          // Health/Energy current values (max is calculated from healthPoints + level + abilities)
          currentHealth: maxHealth,
          currentEnergy: maxEnergy,
          // Optional fields - only include if defined
          ...(draft.description && { description: draft.description }),
          ...(draft.notes && { notes: draft.notes }),
          ...(draft.appearance && { appearance: draft.appearance }),
          ...(draft.portrait && { portrait: draft.portrait }),
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
