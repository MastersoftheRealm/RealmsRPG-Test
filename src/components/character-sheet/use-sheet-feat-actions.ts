/**
 * Character sheet — feats / traits / state (TASK-381 Phase 2b)
 */

'use client';

import { useCallback } from 'react';
import type { Character, CharacterFeat } from '@/types';
import type { CodexFeat, Skill, Trait } from '@/hooks/codex-types';
import {
  checkFeatRequirements,
  characterToFeatRequirementCharacter,
} from '@/lib/game/feat-requirements';
import { getFeatFamilyId, getFeatLevel, formatFeatName } from '@/lib/leveled-feats';
import type { FeatModalType } from './character-sheet-context';

type UseSheetFeatActionsArgs = {
  character: Character | null;
  setCharacter: React.Dispatch<React.SetStateAction<Character | null>>;
  featsDb: CodexFeat[];
  codexSkills: Skill[];
  traitsDb: Trait[];
  setFeatModalType: (type: FeatModalType) => void;
  setFeatToRemove: (value: { id: string; name: string } | null) => void;
  featToRemove: { id: string; name: string } | null;
  stateFeatsList: Array<CharacterFeat & { type: 'archetype' | 'character' }>;
  stateUsesMax: number;
};

function applyFeatCustomization(
  feats: CharacterFeat[] | undefined,
  featId: string,
  updates: Partial<{ customName?: string; note?: string }>,
): CharacterFeat[] {
  return (feats || []).map((feat) => {
    if (String(feat.id) !== featId) return feat;
    const next = { ...feat };
    if ('customName' in updates) {
      if (updates.customName !== undefined && updates.customName !== '')
        next.customName = updates.customName;
      else delete next.customName;
    }
    if ('note' in updates) {
      if (updates.note !== undefined && updates.note !== '') next.note = updates.note;
      else delete next.note;
    }
    return next;
  });
}

export function useSheetFeatActions({
  character,
  setCharacter,
  featsDb,
  codexSkills,
  traitsDb,
  setFeatModalType,
  setFeatToRemove,
  featToRemove,
  stateFeatsList,
  stateUsesMax,
}: UseSheetFeatActionsArgs) {
  const handleAddFeats = useCallback(
    (
      feats: {
        id: string;
        name: string;
        description?: string;
        effect?: string;
        max_uses?: number;
      }[],
      type: 'archetype' | 'character' | 'state',
    ) => {
      if (!character) return;
      const newFeats: CharacterFeat[] = feats.map((f) => ({
        id: f.id,
        name: f.name,
        currentUses: f.max_uses,
      }));

      if (type === 'state') {
        const db = featsDb as Array<CodexFeat & { char_feat?: boolean }>;
        const toArchetype: CharacterFeat[] = [];
        const toCharacter: CharacterFeat[] = [];
        newFeats.forEach((f) => {
          const codex = db.find(
            (x) =>
              x.id === f.id ||
              String(x.name ?? '').toLowerCase() === String(f.name ?? '').toLowerCase(),
          );
          if (codex?.char_feat) toCharacter.push(f);
          else toArchetype.push(f);
        });
        setCharacter((prev) =>
          prev
            ? {
                ...prev,
                archetypeFeats: [...(prev.archetypeFeats || []), ...toArchetype],
                feats: [...(prev.feats || []), ...toCharacter],
              }
            : null,
        );
      } else if (type === 'archetype') {
        type LeveledFeat = CodexFeat & { base_feat_id?: string; feat_lvl?: number };
        const db = featsDb as LeveledFeat[];
        const byId = new Map<string, LeveledFeat>(db.map((f) => [String(f.id), f]));
        const getLevel = (f: LeveledFeat | undefined) =>
          f?.feat_lvl != null && f.feat_lvl > 0 ? f.feat_lvl : 1;
        const getFamily = (f: LeveledFeat | undefined) =>
          f?.base_feat_id ? String(f.base_feat_id) : String(f?.id ?? '');
        setCharacter((prev) =>
          prev
            ? {
                ...prev,
                archetypeFeats: newFeats.reduce<CharacterFeat[]>(
                  (acc, nextFeat) => {
                    const nextDef = byId.get(String(nextFeat.id));
                    const nextFamily = getFamily(nextDef);
                    const nextLevel = getLevel(nextDef);
                    const filtered = acc.filter((existing) => {
                      const existingDef = byId.get(String(existing.id));
                      if (!existingDef || !nextFamily) return true;
                      if (getFamily(existingDef) !== nextFamily) return true;
                      return getLevel(existingDef) >= nextLevel;
                    });
                    return [...filtered, nextFeat];
                  },
                  [...(prev.archetypeFeats || [])],
                ),
              }
            : null,
        );
      } else {
        type LeveledFeat = CodexFeat & { base_feat_id?: string; feat_lvl?: number };
        const db = featsDb as LeveledFeat[];
        const byId = new Map<string, LeveledFeat>(db.map((f) => [String(f.id), f]));
        const getLevel = (f: LeveledFeat | undefined) =>
          f?.feat_lvl != null && f.feat_lvl > 0 ? f.feat_lvl : 1;
        const getFamily = (f: LeveledFeat | undefined) =>
          f?.base_feat_id ? String(f.base_feat_id) : String(f?.id ?? '');
        setCharacter((prev) =>
          prev
            ? {
                ...prev,
                feats: newFeats.reduce<CharacterFeat[]>(
                  (acc, nextFeat) => {
                    const nextDef = byId.get(String(nextFeat.id));
                    const nextFamily = getFamily(nextDef);
                    const nextLevel = getLevel(nextDef);
                    const filtered = acc.filter((existing) => {
                      const existingDef = byId.get(String(existing.id));
                      if (!existingDef || !nextFamily) return true;
                      if (getFamily(existingDef) !== nextFamily) return true;
                      return getLevel(existingDef) >= nextLevel;
                    });
                    return [...filtered, nextFeat];
                  },
                  [...(prev.feats || [])],
                ),
              }
            : null,
        );
      }
      setFeatModalType(null);
    },
    [character, featsDb, setCharacter, setFeatModalType],
  );

  const handleFeatLevelChange = useCallback(
    (featId: string, targetLevel: number, listType: 'archetype' | 'character') => {
      if (!character) return;
      type LeveledFeat = CodexFeat & {
        base_feat_id?: string;
        feat_lvl?: number;
        uses_per_rec?: number;
        max_uses?: number;
      };
      const db = featsDb as LeveledFeat[];
      const codexFeat = db.find((f) => String(f.id) === String(featId));
      if (!codexFeat) return;

      const family = db
        .filter((f) => getFeatFamilyId(f) === getFeatFamilyId(codexFeat))
        .sort((a, b) => getFeatLevel(a) - getFeatLevel(b));
      if (family.length <= 1) return;

      const targetCodex = family.find((f) => getFeatLevel(f) === targetLevel);
      if (!targetCodex || String(targetCodex.id) === String(featId)) return;

      const requirementCharacter = characterToFeatRequirementCharacter(character);
      const { met } = checkFeatRequirements(targetCodex, requirementCharacter, codexSkills, db);
      if (!met) return;

      const newFeat: CharacterFeat = {
        id: String(targetCodex.id),
        name: formatFeatName(targetCodex),
        currentUses: targetCodex.uses_per_rec ?? targetCodex.max_uses,
      };

      setCharacter((prev) => {
        if (!prev) return null;
        const mergeCustomization = (existing: CharacterFeat): CharacterFeat => ({
          ...newFeat,
          customName: existing.customName,
          note: existing.note,
        });
        if (listType === 'archetype') {
          return {
            ...prev,
            archetypeFeats: (prev.archetypeFeats || []).map((f) =>
              String(f.id) === String(featId) ? mergeCustomization(f) : f,
            ),
          };
        }
        return {
          ...prev,
          feats: (prev.feats || []).map((f) =>
            String(f.id) === String(featId) ? mergeCustomization(f) : f,
          ),
        };
      });
    },
    [character, featsDb, codexSkills, setCharacter],
  );

  const handleRemoveFeat = useCallback(
    (featId: string) => {
      if (!character) return;
      setCharacter((prev) => {
        if (!prev) return null;
        const archetypeFeats = prev.archetypeFeats || [];
        const archetypeIdx = archetypeFeats.findIndex(
          (f) => String(f.id) === featId || f.name === featId,
        );
        if (archetypeIdx !== -1) {
          return {
            ...prev,
            archetypeFeats: archetypeFeats.filter((_, i) => i !== archetypeIdx),
          };
        }
        const charFeats = prev.feats || [];
        const charIdx = charFeats.findIndex((f) => String(f.id) === featId || f.name === featId);
        if (charIdx !== -1) {
          return {
            ...prev,
            feats: charFeats.filter((_, i) => i !== charIdx),
          };
        }
        return prev;
      });
    },
    [character, setCharacter],
  );

  const handleRequestRemoveFeat = useCallback(
    (featId: string, featName?: string) => {
      setFeatToRemove({ id: featId, name: featName || featId });
    },
    [setFeatToRemove],
  );

  const handleConfirmRemoveFeat = useCallback(() => {
    if (featToRemove) {
      handleRemoveFeat(featToRemove.id);
      setFeatToRemove(null);
    }
  }, [featToRemove, handleRemoveFeat, setFeatToRemove]);

  const handleFeatUsesChange = useCallback(
    (featId: string, delta: number) => {
      if (!character) return;
      const codexFeat = featsDb.find((f: CodexFeat) => f.id === featId) as CodexFeat | undefined;
      setCharacter((prev) => {
        if (!prev) return null;

        const updatedArchetypeFeats = (prev.archetypeFeats || []).map((feat) => {
          const maxUses = feat.maxUses ?? codexFeat?.uses_per_rec;
          if (String(feat.id) === featId && maxUses) {
            const currentUses = feat.currentUses ?? maxUses;
            const newUses = Math.max(0, Math.min(maxUses, currentUses + delta));
            return { ...feat, currentUses: newUses };
          }
          return feat;
        });

        const updatedCharFeats = (prev.feats || []).map((feat) => {
          const maxUses = feat.maxUses ?? codexFeat?.uses_per_rec;
          if (String(feat.id) === featId && maxUses) {
            const currentUses = feat.currentUses ?? maxUses;
            const newUses = Math.max(0, Math.min(maxUses, currentUses + delta));
            return { ...feat, currentUses: newUses };
          }
          return feat;
        });

        return {
          ...prev,
          archetypeFeats: updatedArchetypeFeats,
          feats: updatedCharFeats,
        };
      });
    },
    [character, featsDb, setCharacter],
  );

  const handleFeatCustomizationChange = useCallback(
    (
      featId: string,
      listType: 'archetype' | 'character',
      updates: Partial<{ customName?: string; note?: string }>,
    ) => {
      if (!character) return;
      setCharacter((prev) => {
        if (!prev) return null;
        if (listType === 'archetype') {
          return {
            ...prev,
            archetypeFeats: applyFeatCustomization(prev.archetypeFeats, featId, updates),
          };
        }
        return {
          ...prev,
          feats: applyFeatCustomization(prev.feats, featId, updates),
        };
      });
    },
    [character, setCharacter],
  );

  const handleTraitCustomizationChange = useCallback(
    (traitKey: string, updates: Partial<{ customName?: string; note?: string }>) => {
      if (!character) return;
      setCharacter((prev) => {
        if (!prev) return null;
        const existing = { ...(prev.traitCustomizations || {}) };
        const current = { ...(existing[traitKey] || {}) };
        if ('customName' in updates) {
          if (updates.customName !== undefined && updates.customName !== '') {
            current.customName = updates.customName;
          } else delete current.customName;
        }
        if ('note' in updates) {
          if (updates.note !== undefined && updates.note !== '') current.note = updates.note;
          else delete current.note;
        }
        if (Object.keys(current).length > 0) existing[traitKey] = current;
        else delete existing[traitKey];
        return {
          ...prev,
          traitCustomizations: Object.keys(existing).length > 0 ? existing : undefined,
        };
      });
    },
    [character, setCharacter],
  );

  const handleTraitUsesChange = useCallback(
    (traitName: string, delta: number) => {
      if (!character) return;
      setCharacter((prev) => {
        if (!prev) return null;
        const currentUses = prev.traitUses?.[traitName] ?? 0;
        const traitData = traitsDb.find(
          (t: Trait) => t.name?.toLowerCase() === traitName.toLowerCase(),
        );
        const maxUses = (traitData as Trait & { uses_per_rec?: number })?.uses_per_rec ?? 999;
        const newUses = Math.max(0, Math.min(maxUses, currentUses + delta));
        return {
          ...prev,
          traitUses: {
            ...(prev.traitUses || {}),
            [traitName]: newUses,
          },
        };
      });
    },
    [character, traitsDb, setCharacter],
  );

  const handleStateUsesChange = useCallback(
    (delta: number) => {
      if (!character || stateUsesMax <= 0) return;
      setCharacter((prev) => {
        if (!prev) return null;
        const current = prev.stateUsesCurrent ?? stateUsesMax;
        const next = Math.max(0, Math.min(stateUsesMax, current + delta));
        return { ...prev, stateUsesCurrent: next };
      });
    },
    [character, stateUsesMax, setCharacter],
  );

  const handleEnterState = useCallback(() => {
    if (!character || stateUsesMax <= 0) return;
    const current = character.stateUsesCurrent ?? stateUsesMax;
    if (current <= 0) return;
    setCharacter((prev) => {
      if (!prev) return null;
      const db = featsDb as Array<CodexFeat & { state_feat?: boolean; uses_per_rec?: number }>;
      const getMaxUses = (feat: CharacterFeat) => {
        const codex =
          db.find((f) => f.id === String(feat.id)) ??
          db.find(
            (f) => String(f.name ?? '').toLowerCase() === String(feat.name ?? '').toLowerCase(),
          );
        return feat.maxUses ?? codex?.uses_per_rec ?? 0;
      };
      let nextArch = prev.archetypeFeats || [];
      let nextChar = prev.feats || [];
      stateFeatsList.forEach((sf) => {
        const maxUses = getMaxUses(sf);
        if (maxUses <= 0) return;
        if (sf.type === 'archetype') {
          nextArch = nextArch.map((f) => {
            if (String(f.id) !== String(sf.id) && f.name !== sf.name) return f;
            const cur = f.currentUses ?? maxUses;
            return { ...f, currentUses: Math.max(0, cur - 1) };
          });
        } else {
          nextChar = nextChar.map((f) => {
            if (String(f.id) !== String(sf.id) && f.name !== sf.name) return f;
            const cur = f.currentUses ?? maxUses;
            return { ...f, currentUses: Math.max(0, cur - 1) };
          });
        }
      });
      return {
        ...prev,
        stateUsesCurrent: (prev.stateUsesCurrent ?? stateUsesMax) - 1,
        archetypeFeats: nextArch,
        feats: nextChar,
      };
    });
  }, [character, stateUsesMax, featsDb, stateFeatsList, setCharacter]);

  return {
    handleAddFeats,
    handleFeatLevelChange,
    handleRequestRemoveFeat,
    handleConfirmRemoveFeat,
    handleFeatUsesChange,
    handleFeatCustomizationChange,
    handleTraitCustomizationChange,
    handleTraitUsesChange,
    handleStateUsesChange,
    handleEnterState,
  };
}
