/**
 * Guided ("Simple") Character Creator Store
 * =========================================
 * Separate from `character-creator-store.ts` (the Advanced/Classic creator).
 * Models the chapter-based guided flow described in REALMS_PRODUCT_OVERVIEW.md §5.0.
 *
 * Chapters (rulebook-aligned):
 *   1. Foundation  -> path, species
 *   2. Ancestry    -> ancestry (species-trait options, characteristic, ancestry trait, optional flaw)
 *   3. Abilities   -> abilities (recommended array or customize)
 *   4. Your Archetype -> skills, archetype feats, character feat
 *   5. Equipment   -> loadout, powers OR techniques
 *   6. Your Hero   -> reveal/finalize
 *
 * Guest-friendly: persists to localStorage; login required only to save.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AbilityName, ArchetypeCategory, DefenseSkills } from '@/types';
import { DEFAULT_ABILITIES, DEFAULT_DEFENSE_SKILLS } from '@/types';
import type { PathItemRecommendation } from '@/types/archetype';
import { mergeLoadoutArmaments } from '@/lib/guided-creator/resolve-loadout-items';
import type { CreatorEntryMode } from '@/lib/guided-creator/creator-entry-mode';
import {
  nextGuidedSubStep,
  prevGuidedSubStep,
  type GuidedNavigationIntent,
} from '@/lib/guided-creator/guided-substep-nav';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { buildCreatorResetDraftPatch } from '@/lib/guided-creator/path-selection-draft';
import {
  canOpenGuidedSubStep,
  isGuidedSubStepSatisfied,
} from '@/lib/guided-creator/substep-satisfaction';
import { CHARACTER_STARTING_CURRENCY } from '@/lib/game/constants';
import { isClientRequestId } from '@/lib/character-save';

const chapterCopy = GUIDED_CREATOR_COPY.chapters;

export type GuidedEquipmentPhase = 'weapon' | 'armor' | 'gear';
/** In-step powers/techniques wizard phase (TASK-756). */
export type GuidedPowersPhase = 'innate' | 'powers' | 'techniques';

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

/** Path step catalog face: L1 = path cards; L3 = custom archetype (no distinct L2). */
export type GuidedPathLayer = 'l1' | 'l3';

export interface GuidedDraft {
  /** Chooser entry: guided = L1 faces; custom = deeper catalogs when no path id. */
  creatorEntryMode: CreatorEntryMode;
  // Chapter 1 — Foundation
  /** Which Path face is showing (REALMS §5.1). */
  pathLayer: GuidedPathLayer;
  archetypePathId: string | null;
  archetypeType: ArchetypeCategory | null;
  pow_abil: AbilityName | null;
  mart_abil: AbilityName | null;
  speciesId: string | null;
  speciesName: string | null;
  /** True when the player chose mixed species (two parent species). */
  speciesMixed: boolean;
  /** Parent species ids when `speciesMixed` (exactly two). */
  mixedSpeciesIds: [string, string] | null;
  /** Parent species display names when `speciesMixed`. */
  mixedSpeciesNames: [string, string] | null;
  /** Mixed species: up to two skill ids chosen from combined parent skills. */
  selectedSpeciesSkillIds: string[];
  /** Mixed species: one species trait id per parent [A, B]. */
  selectedSpeciesTraits: string[];
  /** Mixed species: which parent species the chosen flaw comes from. */
  selectedFlawSpeciesId: string | null;
  /** When species offers multiple sizes, player picks one on the ancestry overview. */
  selectedSize: string | null;

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
  /** skillId -> skill value (0 = proficient, +0 bonus) */
  skills: Record<string, number>;
  /** Skill-point Defense Bonus allocation (2 pts per +1; cap = level). */
  defenseVals: DefenseSkills;
  /** Explicit governing Ability per skill id (multi-ability skills). */
  skillAbilities: Record<string, string>;
  declinedPathSkillIds: string[];
  archetypeFeatIds: string[];
  characterFeatIds: string[];

  // Chapter 5 — Equipment / Powers / Techniques
  /** In-step equipment wizard phase (TASK-424). */
  equipmentPhase: GuidedEquipmentPhase;
  /** In-step innate → powers → techniques phase (TASK-756). */
  powersPhase: GuidedPowersPhase;
  /** Weapons + shields selected in loadout step. */
  loadoutWeapons: PathItemRecommendation[];
  /** Armor selected in loadout step (empty when unarmored / power). */
  loadoutArmor: PathItemRecommendation[];
  /** Combined weapons/shields/armor — kept in sync for legacy callers. */
  armaments: PathItemRecommendation[];
  equipment: PathItemRecommendation[];
  /**
   * Signed remaining Currency after weapon/armor/gear spend. LoadoutStep syncs this
   * as picks change so the rail can lock on overspend (`currency >= 0`). The saved
   * character clamps at 0 via `clampSavedCurrency`.
   */
  currency: number;
  /** 0 = not taken; level 1 at character creation when path recommends unarmed. */
  unarmedProwess: number;
  powerIds: string[];
  /**
   * Innate power picks (Power / Powered-Martial) — separate from regular `powerIds` (TASK-471).
   */
  innatePowerIds: string[];
  techniqueIds: string[];

  // Chapter 6 — Your Hero
  name: string;
  age: string;
  heightCm: number | null;
  weightKg: number | null;
  appearanceNotes: string;
  /** General background / personality (maps to Character.backstory). */
  description: string;
  portraitUrl: string | null;
  hpAllocated: number | null;
  energyAllocated: number | null;
  /**
   * Idempotency key for POST create. Persisted with the draft so a reload-then-retry
   * still hits the same row. Cleared by `resetCreator` (new character).
   */
  clientRequestId?: string | null | undefined;
}

function createInitialDraft(): GuidedDraft {
  return {
    creatorEntryMode: 'guided',
    pathLayer: 'l1',
    archetypePathId: null,
    archetypeType: null,
    pow_abil: null,
    mart_abil: null,
    speciesId: null,
    speciesName: null,
    speciesMixed: false,
    mixedSpeciesIds: null,
    mixedSpeciesNames: null,
    selectedSpeciesSkillIds: [],
    selectedSpeciesTraits: [],
    selectedFlawSpeciesId: null,
    selectedSize: null,
    selectedSpeciesTraitChoices: {},
    selectedAncestryTraitIds: [],
    selectedCharacteristicId: null,
    selectedFlawId: null,
    abilities: { ...DEFAULT_ABILITIES },
    abilitiesMode: null,
    skills: {},
    defenseVals: { ...DEFAULT_DEFENSE_SKILLS },
    skillAbilities: {},
    declinedPathSkillIds: [],
    archetypeFeatIds: [],
    characterFeatIds: [],
    equipmentPhase: 'weapon',
    powersPhase: 'innate',
    loadoutWeapons: [],
    loadoutArmor: [],
    armaments: [],
    equipment: [],
    currency: CHARACTER_STARTING_CURRENCY,
    unarmedProwess: 0,
    powerIds: [],
    innatePowerIds: [],
    techniqueIds: [],
    name: '',
    age: '',
    heightCm: null,
    weightKg: null,
    appearanceNotes: '',
    description: '',
    portraitUrl: null,
    hpAllocated: null,
    energyAllocated: null,
    clientRequestId: null,
  };
}

function cloneInitialDraft(): GuidedDraft {
  return JSON.parse(JSON.stringify(createInitialDraft())) as GuidedDraft;
}

interface GuidedCreatorState {
  currentSubStep: GuidedSubStep;
  draft: GuidedDraft;
  /**
   * How the current sub-step was entered (multi-screen steps use this for landing):
   * - `first` — chapter rail / edit jump: land on first inner screen
   * - `forward` — footer Continue: land on first inner screen (never jump to furthest)
   * - `back` — footer Back: land on last inner screen (sequential history)
   *
   * Not persisted — hard refresh defaults to `forward` (first inner screen), which matches
   * “never jump to furthest” better than resuming mid-step progress.
   */
  navigationIntent: GuidedNavigationIntent;
  /** Bumped on every chapter/sub-step transition so inner steps can re-apply entry landing. */
  entryNonce: number;

  setSubStep: (subStep: GuidedSubStep) => void;
  nextSubStep: () => void;
  prevSubStep: () => void;
  /** Derived: does the draft carry this step's required picks? (no stored progress list) */
  isSubStepSatisfied: (subStep: GuidedSubStep) => boolean;
  canNavigateToSubStep: (subStep: GuidedSubStep) => boolean;
  updateDraft: (partial: Partial<GuidedDraft>) => void;
  resetCreator: () => void;
}

/** Bump when persisted draft shape changes; old versions migrate forward. */
const GUIDED_STORE_SCHEMA_VERSION = 15;

export const useGuidedCreatorStore = create<GuidedCreatorState>()(
  persist(
    (set, get) => ({
      currentSubStep: 'path',
      draft: cloneInitialDraft(),
      navigationIntent: 'forward',
      entryNonce: 0,

      setSubStep: (subStep) => {
        if (get().canNavigateToSubStep(subStep)) {
          set((state) => ({
            currentSubStep: subStep,
            navigationIntent: 'first',
            entryNonce: state.entryNonce + 1,
          }));
        }
      },

      nextSubStep: () => {
        const current = get().currentSubStep;
        const next = nextGuidedSubStep(current, GUIDED_SUBSTEP_ORDER);
        if (!next) return;
        set((state) => ({
          currentSubStep: next,
          navigationIntent: 'forward',
          entryNonce: state.entryNonce + 1,
        }));
      },

      prevSubStep: () => {
        const current = get().currentSubStep;
        const prev = prevGuidedSubStep(current, GUIDED_SUBSTEP_ORDER);
        if (!prev) return;
        set((state) => ({
          currentSubStep: prev,
          navigationIntent: 'back',
          entryNonce: state.entryNonce + 1,
        }));
      },

      isSubStepSatisfied: (subStep) => isGuidedSubStepSatisfied(subStep, get().draft),

      /**
       * Derived from the draft, not from visit history: a step opens only while every step
       * ahead of it still holds its required picks. Clearing a chapter (path/species change)
       * therefore re-locks everything downstream instead of leaving a stale ✓ behind.
       */
      canNavigateToSubStep: (subStep) => {
        const { currentSubStep, draft } = get();
        if (subStep === currentSubStep) return true;
        return canOpenGuidedSubStep(subStep, GUIDED_SUBSTEP_ORDER, draft);
      },

      updateDraft: (partial) => {
        const prev = get().draft;
        const next = { ...prev, ...partial };
        if ('loadoutWeapons' in partial || 'loadoutArmor' in partial) {
          next.armaments = mergeLoadoutArmaments(next);
        }
        set({ draft: next });
      },

      resetCreator: () => {
        const { creatorEntryMode } = get().draft;
        set({
          currentSubStep: 'path',
          draft: {
            ...cloneInitialDraft(),
            ...buildCreatorResetDraftPatch(creatorEntryMode),
          },
          navigationIntent: 'forward',
          entryNonce: 0,
        });
      },
    }),
    {
      name: 'guided-creator-storage',
      version: GUIDED_STORE_SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentSubStep: state.currentSubStep,
        draft: state.draft,
      }),
      migrate: (persisted, version) => {
        if (!persisted || typeof persisted !== 'object') {
          return {
            currentSubStep: 'path' as GuidedSubStep,
            draft: cloneInitialDraft(),
          };
        }

        let state = persisted as GuidedCreatorState & {
          completedSubSteps?: GuidedSubStep[] | undefined;
          draft?: (GuidedDraft & { skillIds?: string[] | undefined }) | undefined;
        };

        if (version < 2 && state.draft) {
          state = {
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

        if (version < 4 && state.draft) {
          state = {
            ...state,
            draft: {
              ...state.draft,
              unarmedProwess:
                typeof state.draft.unarmedProwess === 'number' ? state.draft.unarmedProwess : 0,
            },
          };
        }

        if (version < 5 && state.draft) {
          const legacy = state.draft;
          const legacyArmaments = legacy.armaments ?? [];
          state = {
            ...state,
            draft: {
              ...legacy,
              equipmentPhase: legacy.equipmentPhase ?? 'weapon',
              loadoutWeapons: legacy.loadoutWeapons ?? legacyArmaments,
              loadoutArmor: legacy.loadoutArmor ?? [],
              armaments: legacyArmaments,
              currency:
                typeof legacy.currency === 'number' ? legacy.currency : CHARACTER_STARTING_CURRENCY,
            },
          };
        }

        if (version < 6 && state.draft) {
          state = {
            ...state,
            draft: {
              ...state.draft,
              innatePowerIds: Array.isArray(state.draft.innatePowerIds)
                ? state.draft.innatePowerIds
                : [],
            },
          };
        }

        if (version < 7 && state.draft) {
          const hasPath = Boolean(state.draft.archetypePathId);
          state = {
            ...state,
            draft: {
              ...state.draft,
              pathLayer:
                state.draft.pathLayer === 'l3'
                  ? 'l3'
                  : hasPath
                    ? 'l1'
                    : state.draft.archetypeType
                      ? 'l3'
                      : 'l1',
            },
          };
        }

        if (version < 8 && state.draft) {
          const { creationMode: _removed, ...rest } = state.draft as GuidedDraft & {
            creationMode?: string | undefined;
          };
          void _removed;
          state = { ...state, draft: rest as GuidedDraft };
        }

        if (version < 9 && state.draft) {
          const draft = state.draft;
          const inferredCustom =
            draft.pathLayer === 'l3' && !draft.archetypePathId && Boolean(draft.archetypeType);
          state = {
            ...state,
            draft: {
              ...draft,
              creatorEntryMode: inferredCustom ? 'custom' : 'guided',
            },
          };
        }

        if (version < 10 && state.draft) {
          const draft = state.draft;
          const legacyMixed =
            typeof draft.speciesId === 'string' && draft.speciesId.startsWith('mixed:');
          state = {
            ...state,
            draft: {
              ...draft,
              speciesMixed: draft.speciesMixed ?? legacyMixed,
              mixedSpeciesIds: draft.mixedSpeciesIds ?? null,
              mixedSpeciesNames: draft.mixedSpeciesNames ?? null,
              selectedSpeciesSkillIds: draft.selectedSpeciesSkillIds ?? [],
            },
          };
        }

        if (version < 11 && state.draft) {
          state = {
            ...state,
            draft: {
              ...state.draft,
              selectedSpeciesTraits: state.draft.selectedSpeciesTraits ?? [],
              selectedFlawSpeciesId: state.draft.selectedFlawSpeciesId ?? null,
            },
          };
        }

        if (version < 12) {
          // Progress is derived from the draft now (substep-satisfaction), so a recorded
          // list can only go stale — drop it instead of migrating it forward.
          const { completedSubSteps: _dropped, ...rest } = state;
          void _dropped;
          state = rest as typeof state;
        }

        if (version < 14 && state.draft) {
          state = {
            ...state,
            draft: {
              ...state.draft,
              powersPhase: state.draft.powersPhase ?? 'innate',
            },
          };
        }

        if (version < 15 && state.draft) {
          state = {
            ...state,
            draft: {
              ...state.draft,
              defenseVals: state.draft.defenseVals ?? { ...DEFAULT_DEFENSE_SKILLS },
              skillAbilities: state.draft.skillAbilities ?? {},
            },
          };
        }

        if (version < 3 && state.draft) {
          const legacy = state.draft;
          const skills: Record<string, number> = legacy.skills ?? {};
          if (Object.keys(skills).length === 0 && legacy.skillIds?.length) {
            legacy.skillIds.forEach((id) => {
              skills[String(id)] = 0;
            });
          }
          const { skillIds, ...rest } = legacy;
          void skillIds;
          state = {
            ...state,
            draft: {
              ...rest,
              skills,
              declinedPathSkillIds: legacy.declinedPathSkillIds ?? [],
            },
          };
        }

        if (state.draft) {
          const draft = state.draft;
          state = {
            ...state,
            draft: {
              ...cloneInitialDraft(),
              ...draft,
              skills:
                draft.skills && typeof draft.skills === 'object' && !Array.isArray(draft.skills)
                  ? draft.skills
                  : {},
              declinedPathSkillIds: draft.declinedPathSkillIds ?? [],
              clientRequestId: isClientRequestId(draft.clientRequestId)
                ? draft.clientRequestId
                : null,
            },
          };
        }

        return state;
      },
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<GuidedCreatorState> | undefined;
        if (!persisted) return currentState;
        const draft = { ...currentState.draft, ...persisted.draft };
        if (!draft.skills || typeof draft.skills !== 'object' || Array.isArray(draft.skills)) {
          draft.skills = {};
        }
        if (!Array.isArray(draft.declinedPathSkillIds)) {
          draft.declinedPathSkillIds = [];
        }
        if (typeof draft.unarmedProwess !== 'number') {
          draft.unarmedProwess = 0;
        }
        if (!draft.equipmentPhase) {
          draft.equipmentPhase = 'weapon';
        }
        if (!draft.powersPhase) {
          draft.powersPhase = 'innate';
        }
        if (!draft.defenseVals || typeof draft.defenseVals !== 'object') {
          draft.defenseVals = { ...DEFAULT_DEFENSE_SKILLS };
        }
        if (!draft.skillAbilities || typeof draft.skillAbilities !== 'object') {
          draft.skillAbilities = {};
        }
        if (!Array.isArray(draft.loadoutWeapons)) {
          draft.loadoutWeapons = [];
        }
        if (!Array.isArray(draft.loadoutArmor)) {
          draft.loadoutArmor = [];
        }
        if (typeof draft.currency !== 'number') {
          draft.currency = CHARACTER_STARTING_CURRENCY;
        }
        if (typeof draft.description !== 'string') {
          draft.description = '';
        }
        if (!Array.isArray(draft.innatePowerIds)) {
          draft.innatePowerIds = [];
        }
        if (draft.pathLayer !== 'l1' && draft.pathLayer !== 'l3') {
          draft.pathLayer = draft.archetypePathId ? 'l1' : draft.archetypeType ? 'l3' : 'l1';
        }
        if (draft.creatorEntryMode !== 'guided' && draft.creatorEntryMode !== 'custom') {
          draft.creatorEntryMode = 'guided';
        }
        if (!isClientRequestId(draft.clientRequestId)) {
          draft.clientRequestId = null;
        }
        return {
          ...currentState,
          ...persisted,
          draft,
        };
      },
    },
  ),
);
