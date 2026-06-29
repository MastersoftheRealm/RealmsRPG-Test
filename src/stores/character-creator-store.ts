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
import type { CoreRulesMap } from '@/types/core-rules';
import { buildRequiredProficiencies } from '@/lib/proficiencies';

export const CHARACTER_STARTING_CURRENCY = 200;

function downstreamDraftReset(): Partial<CharacterDraft> {
  return {
    species: undefined,
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

/**
 * Three-layer interaction model (REALMS_PRODUCT_OVERVIEW.md §3).
 * 1 = Guided (default for path mode), 2 = Semi-guided, 3 = Full system (default for forge).
 */
export type CreatorLayer = 1 | 2 | 3;

/** Path-mode steps auto-skipped during Continue (Phase F — conditional steps). */
export function isCreatorStepSkipped(step: CreatorStep, draft: CharacterDraft): boolean {
  if (draft.creationMode !== 'path') return false;
  // Pure martial paths skip powers/techniques in guided Layer 1 flow.
  if (step === 'powers' && draft.archetype?.type === 'martial') return true;
  return false;
}

function resolveAdjacentStep(
  from: CreatorStep,
  direction: 1 | -1,
  draft: CharacterDraft
): CreatorStep | null {
  let idx = STEP_ORDER.indexOf(from) + direction;
  while (idx >= 0 && idx < STEP_ORDER.length) {
    const candidate = STEP_ORDER[idx];
    if (!isCreatorStepSkipped(candidate, draft)) return candidate;
    idx += direction;
  }
  return null;
}

function completedStepsThrough(step: CreatorStep): CreatorStep[] {
  const idx = STEP_ORDER.indexOf(step);
  return STEP_ORDER.slice(0, idx + 1);
}

interface CharacterCreatorState {
  // Current step
  currentStep: CreatorStep;
  completedSteps: CreatorStep[];

  /**
   * Per-step disclosure layer. Absent = use the mode default
   * (1 for path/guided, 3 for forge/full). See getStepLayer().
   */
  stepLayer: Partial<Record<CreatorStep, CreatorLayer>>;
  
  // Character draft data
  draft: CharacterDraft;
  
  // Actions
  setStep: (step: CreatorStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  markStepComplete: (step: CreatorStep) => void;
  canNavigateToStep: (step: CreatorStep) => boolean;

  // Layer (progressive disclosure) actions
  getStepLayer: (step: CreatorStep) => CreatorLayer;
  setStepLayer: (step: CreatorStep, layer: CreatorLayer) => void;
  expandLayer: (step: CreatorStep) => void;
  collapseLayer: (step: CreatorStep) => void;
  
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
    rules?: Partial<CoreRulesMap>;
  }) => Partial<Character>;
}

function cloneInitialDraft(): CharacterDraft {
  return {
    name: '',
    level: 1,
    abilities: { ...DEFAULT_ABILITIES },
    step: 0,
    isComplete: false,
    currency: CHARACTER_STARTING_CURRENCY,
  };
}

/** Bump when persisted draft shape or defaults change; old versions reset to a fresh draft. */
const CREATOR_STORE_SCHEMA_VERSION = 2;

export const useCharacterCreatorStore = create<CharacterCreatorState>()(
  persist(
    (set, get) => ({
      currentStep: 'archetype',
      completedSteps: [],
      stepLayer: {},
      draft: cloneInitialDraft(),
      
      setStep: (step) => {
        if (get().canNavigateToStep(step)) {
          set({ currentStep: step });
        }
      },
      
      nextStep: () => {
        const current = get().currentStep;
        const next = resolveAdjacentStep(current, 1, get().draft);
        if (next) {
          get().markStepComplete(current);
          const currentIdx = STEP_ORDER.indexOf(current);
          const nextIdx = STEP_ORDER.indexOf(next);
          for (let i = currentIdx + 1; i < nextIdx; i++) {
            const between = STEP_ORDER[i];
            if (isCreatorStepSkipped(between, get().draft)) {
              get().markStepComplete(between);
            }
          }
          set({ currentStep: next });
        }
      },
      
      prevStep: () => {
        const prev = resolveAdjacentStep(get().currentStep, -1, get().draft);
        if (prev) set({ currentStep: prev });
      },
      
      markStepComplete: (step) => {
        const completed = get().completedSteps;
        if (!completed.includes(step)) {
          set({ completedSteps: [...completed, step] });
        }
      },
      
      canNavigateToStep: (step) => {
        const { draft, completedSteps } = get();
        if (isCreatorStepSkipped(step, draft)) return false;
        const idx = STEP_ORDER.indexOf(step);
        if (idx === 0) return true;

        for (let i = 0; i < idx; i++) {
          const prev = STEP_ORDER[i];
          if (isCreatorStepSkipped(prev, draft)) continue;
          if (prev === 'archetype') {
            if (!draft.archetype?.type) return false;
            continue;
          }
          if (!completedSteps.includes(prev)) return false;
        }
        return true;
      },
      
      getStepLayer: (step) => {
        const explicit = get().stepLayer[step];
        if (explicit) return explicit;
        // Forge mode is full-system by default; path/guided defaults to Layer 1.
        return get().draft.creationMode === 'forge' ? 3 : 1;
      },

      setStepLayer: (step, layer) => {
        set({ stepLayer: { ...get().stepLayer, [step]: layer } });
      },

      expandLayer: (step) => {
        const current = get().getStepLayer(step);
        const next = (Math.min(3, current + 1)) as CreatorLayer;
        set({ stepLayer: { ...get().stepLayer, [step]: next } });
      },

      collapseLayer: (step) => {
        // "Back to recommendations" always returns to the guided layer.
        set({ stepLayer: { ...get().stepLayer, [step]: 1 } });
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
          stepLayer: {},
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
          stepLayer: pathChanged ? {} : get().stepLayer,
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
          stepLayer: {},
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
          stepLayer: {},
          draft: cloneInitialDraft(),
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
        
        const maxHealth = calculateMaxHealth(
          allocatedHealth,
          abilities.vitality || 0,
          level,
          powAbil,
          abilities,
          options?.rules,
          martAbil
        );
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
            .map((f) => {
              const rest = { ...f };
              delete (rest as { type?: string }).type;
              return rest;
            }),
          feats: (draft.feats || [])
            .filter((f: { type?: string }) => f.type === 'character')
            .map((f) => {
              const rest = { ...f };
              delete (rest as { type?: string }).type;
              return rest;
            }),
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
          ...(draft.height != null && { height: draft.height }),
          ...(draft.weight != null && { weight: draft.weight }),
          ...(draft.portrait && { portrait: draft.portrait }),
          status: 'complete' as const,
        };
      },
    }),
    {
      name: 'character-creator-storage',
      version: CREATOR_STORE_SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState, version) => {
        if (version < CREATOR_STORE_SCHEMA_VERSION) {
          return {
            currentStep: 'archetype' as CreatorStep,
            completedSteps: [] as CreatorStep[],
            stepLayer: {} as Partial<Record<CreatorStep, CreatorLayer>>,
            draft: cloneInitialDraft(),
          };
        }
        return persistedState as Pick<CharacterCreatorState, 'currentStep' | 'completedSteps' | 'stepLayer' | 'draft'>;
      },
      partialize: (state) => ({
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        stepLayer: state.stepLayer,
        draft: state.draft,
      }),
    }
  )
);

export { STEP_ORDER };
