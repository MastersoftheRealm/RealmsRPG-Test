/**
 * Guided ("Simple") Character Creator Store
 * =========================================
 * Separate from `character-creator-store.ts` (the Advanced/Classic creator).
 * Models the chapter-based guided flow described in REALMS_PRODUCT_OVERVIEW.md §5.0.
 *
 * Chapters (rulebook-aligned):
 *   1. Foundation  -> path, species
 *   2. Ancestry    -> ancestry (species-trait options, ancestry trait, characteristic, optional flaw)
 *   3. Abilities   -> abilities (recommended array or customize)
 *   4. Your Archetype -> skills, archetype feats, character feat
 *   5. Equipment   -> loadout, powers OR techniques
 *   6. Your Hero   -> reveal/finalize
 *
 * Guest-friendly: persists to localStorage; login required only to save.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AbilityName, ArchetypeCategory } from '@/types';
import { DEFAULT_ABILITIES } from '@/types';
import type { PathItemRecommendation } from '@/types/archetype';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const chapterCopy = GUIDED_CREATOR_COPY.chapters;

/** Chapters shown in the rail. */
export type GuidedChapterId =
  | 'foundation'
  | 'ancestry'
  | 'abilities'
  | 'archetype'
  | 'equipment'
  | 'reveal';

/** Individual sub-steps (one screen each in Layer 1). */
export type GuidedSubStep =
  | 'path'
  | 'species'
  | 'ancestry'
  | 'abilities'
  | 'skills'
  | 'archetype-feats'
  | 'character-feat'
  | 'loadout'
  | 'powers-techniques'
  | 'reveal';

export interface GuidedChapterMeta {
  id: GuidedChapterId;
  title: string;
  subtitle: string;
  subSteps: GuidedSubStep[];
}

/** Working chapter backbone (refinable). Single source of truth for the rail + ordering. */
export const GUIDED_CHAPTERS: GuidedChapterMeta[] = [
  {
    id: 'foundation',
    title: chapterCopy.foundation.title,
    subtitle: chapterCopy.foundation.subtitle,
    subSteps: ['path', 'species'],
  },
  {
    id: 'ancestry',
    title: chapterCopy.ancestry.title,
    subtitle: chapterCopy.ancestry.subtitle,
    subSteps: ['ancestry'],
  },
  {
    id: 'abilities',
    title: chapterCopy.abilities.title,
    subtitle: chapterCopy.abilities.subtitle,
    subSteps: ['abilities'],
  },
  {
    id: 'archetype',
    title: chapterCopy.archetype.title,
    subtitle: chapterCopy.archetype.subtitle,
    subSteps: ['skills', 'archetype-feats', 'character-feat'],
  },
  {
    id: 'equipment',
    title: chapterCopy.equipment.title,
    subtitle: chapterCopy.equipment.subtitle,
    subSteps: ['loadout', 'powers-techniques'],
  },
  {
    id: 'reveal',
    title: chapterCopy.reveal.title,
    subtitle: chapterCopy.reveal.subtitle,
    subSteps: ['reveal'],
  },
];

/** Flat, ordered list of sub-steps derived from the chapter backbone. */
export const GUIDED_SUBSTEP_ORDER: GuidedSubStep[] = GUIDED_CHAPTERS.flatMap((c) => c.subSteps);

export const GUIDED_SUBSTEP_LABELS: Record<GuidedSubStep, string> = {
  path: 'Path',
  species: 'Species',
  ancestry: 'Ancestry',
  abilities: 'Abilities',
  skills: 'Skills',
  'archetype-feats': 'Archetype Feats',
  'character-feat': 'Character Feat',
  loadout: 'Loadout',
  'powers-techniques': 'Powers & Techniques',
  reveal: 'Your Hero',
};

export function getChapterForSubStep(subStep: GuidedSubStep): GuidedChapterMeta {
  return (
    GUIDED_CHAPTERS.find((c) => c.subSteps.includes(subStep)) ?? GUIDED_CHAPTERS[0]
  );
}

export interface GuidedDraft {
  // Chapter 1 — Foundation
  archetypePathId: string | null;
  archetypeType: ArchetypeCategory | null;
  pow_abil: AbilityName | null;
  mart_abil: AbilityName | null;
  speciesId: string | null;
  speciesName: string | null;

  // Chapter 2 — Ancestry
  /** parent species-trait id -> chosen option trait id (for `option_trait_ids` traits) */
  selectedSpeciesTraitChoices: Record<string, string>;
  /** ancestry trait ids (1 normally, 2 when a flaw is taken) */
  selectedAncestryTraitIds: string[];
  selectedCharacteristicId: string | null;
  selectedFlawId: string | null;

  // Chapter 3 — Abilities
  abilities: Record<AbilityName, number>;
  abilitiesMode: 'recommended' | 'custom' | null;

  // Chapter 4 — Your Archetype
  skillIds: string[];
  declinedPathSkillIds: string[];
  archetypeFeatIds: string[];
  characterFeatIds: string[];

  // Chapter 5 — Equipment / Powers / Techniques
  loadoutId: string | null;
  armaments: PathItemRecommendation[];
  equipment: PathItemRecommendation[];
  powerIds: string[];
  techniqueIds: string[];

  // Chapter 6 — Your Hero
  name: string;
  age: string;
  heightCm: number | null;
  weightKg: number | null;
  appearanceNotes: string;
  portraitUrl: string | null;
  hpAllocated: number | null;
  energyAllocated: number | null;
}

function createInitialDraft(): GuidedDraft {
  return {
    archetypePathId: null,
    archetypeType: null,
    pow_abil: null,
    mart_abil: null,
    speciesId: null,
    speciesName: null,
    selectedSpeciesTraitChoices: {},
    selectedAncestryTraitIds: [],
    selectedCharacteristicId: null,
    selectedFlawId: null,
    abilities: { ...DEFAULT_ABILITIES },
    abilitiesMode: null,
    skillIds: [],
    declinedPathSkillIds: [],
    archetypeFeatIds: [],
    characterFeatIds: [],
    loadoutId: null,
    armaments: [],
    equipment: [],
    powerIds: [],
    techniqueIds: [],
    name: '',
    age: '',
    heightCm: null,
    weightKg: null,
    appearanceNotes: '',
    portraitUrl: null,
    hpAllocated: null,
    energyAllocated: null,
  };
}

function cloneInitialDraft(): GuidedDraft {
  return JSON.parse(JSON.stringify(createInitialDraft())) as GuidedDraft;
}

interface GuidedCreatorState {
  currentSubStep: GuidedSubStep;
  completedSubSteps: GuidedSubStep[];
  draft: GuidedDraft;

  setSubStep: (subStep: GuidedSubStep) => void;
  nextSubStep: () => void;
  prevSubStep: () => void;
  markSubStepComplete: (subStep: GuidedSubStep) => void;
  canNavigateToSubStep: (subStep: GuidedSubStep) => boolean;
  updateDraft: (partial: Partial<GuidedDraft>) => void;
  resetCreator: () => void;
}

/** Bump when persisted draft shape changes; old versions migrate forward. */
const GUIDED_STORE_SCHEMA_VERSION = 2;

export const useGuidedCreatorStore = create<GuidedCreatorState>()(
  persist(
    (set, get) => ({
      currentSubStep: 'path',
      completedSubSteps: [],
      draft: cloneInitialDraft(),

      setSubStep: (subStep) => {
        if (get().canNavigateToSubStep(subStep)) {
          set({ currentSubStep: subStep });
        }
      },

      nextSubStep: () => {
        const current = get().currentSubStep;
        const idx = GUIDED_SUBSTEP_ORDER.indexOf(current);
        if (idx < 0 || idx >= GUIDED_SUBSTEP_ORDER.length - 1) return;
        get().markSubStepComplete(current);
        set({ currentSubStep: GUIDED_SUBSTEP_ORDER[idx + 1] });
      },

      prevSubStep: () => {
        const current = get().currentSubStep;
        const idx = GUIDED_SUBSTEP_ORDER.indexOf(current);
        if (idx <= 0) return;
        set({ currentSubStep: GUIDED_SUBSTEP_ORDER[idx - 1] });
      },

      markSubStepComplete: (subStep) => {
        const completed = get().completedSubSteps;
        if (!completed.includes(subStep)) {
          set({ completedSubSteps: [...completed, subStep] });
        }
      },

      canNavigateToSubStep: (subStep) => {
        const targetIdx = GUIDED_SUBSTEP_ORDER.indexOf(subStep);
        if (targetIdx <= 0) return true;
        // Allow navigating to any already-completed step, the current step,
        // or the immediate next step after the furthest completed one.
        const { completedSubSteps, currentSubStep } = get();
        if (subStep === currentSubStep) return true;
        if (completedSubSteps.includes(subStep)) return true;
        const prev = GUIDED_SUBSTEP_ORDER[targetIdx - 1];
        return completedSubSteps.includes(prev);
      },

      updateDraft: (partial) => {
        set({ draft: { ...get().draft, ...partial } });
      },

      resetCreator: () => {
        set({
          currentSubStep: 'path',
          completedSubSteps: [],
          draft: cloneInitialDraft(),
        });
      },
    }),
    {
      name: 'guided-creator-storage',
      version: GUIDED_STORE_SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted, version) => {
        if (persisted && typeof persisted === 'object') {
          const state = persisted as GuidedCreatorState;
          if (version < 2 && state.draft) {
            return {
              ...state,
              draft: {
                ...state.draft,
                appearanceNotes:
                  'appearanceNotes' in state.draft && typeof state.draft.appearanceNotes === 'string'
                    ? state.draft.appearanceNotes
                    : '',
              },
            };
          }
          if (version >= GUIDED_STORE_SCHEMA_VERSION - 1) {
            return state;
          }
        }
        return {
          currentSubStep: 'path' as GuidedSubStep,
          completedSubSteps: [] as GuidedSubStep[],
          draft: cloneInitialDraft(),
        };
      },
    }
  )
);
