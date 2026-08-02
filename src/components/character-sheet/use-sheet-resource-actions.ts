/**
 * Character sheet — resources / recovery / level-up (TASK-381 Phase 2c)
 */

'use client';

import { useCallback } from 'react';
import { saveCharacter } from '@/services/character-service';
import { apiUpload } from '@/lib/api-client';
import { getArchetypeCodexLookupId, applyPathProficiencyForLevel } from '@/lib/game/archetype-display';
import { calculateProficiency } from '@/lib/game/formulas';
import { DEFAULT_DEFENSE_SKILLS } from '@/types/skills';
import {
  withSyncedResourceFields,
  notifyLocalResourceEdit,
} from '@/lib/encounter/character-resource-sync';
import type { AbilityName, Archetype, Character, CharacterFeat, CharacterTempModifiers } from '@/types';
import type { CodexFeat, Trait } from '@/hooks/codex-types';
import { patchTempModifiers } from '@/lib/character/temp-modifiers';
import type { CharacterSheetStats } from './use-character-sheet-derived';

type UseSheetResourceActionsArgs = {
  character: Character | null;
  setCharacter: React.Dispatch<React.SetStateAction<Character | null>>;
  calculatedStats: CharacterSheetStats | null;
  featsDb: CodexFeat[];
  traitsDb: Trait[];
  codexArchetypes: Archetype[];
  showToast: (message: string, variant?: 'success' | 'error' | 'warning' | 'info') => void;
  user: { uid: string } | null;
  setError: (message: string | null) => void;
  setUploadingPortrait: (value: boolean) => void;
  setPortraitRefreshKey: (value: number) => void;
};

export function useSheetResourceActions({
  character,
  setCharacter,
  calculatedStats,
  featsDb,
  traitsDb,
  codexArchetypes,
  showToast,
  user,
  setError,
  setUploadingPortrait,
  setPortraitRefreshKey,
}: UseSheetResourceActionsArgs) {
  const handleHealthChange = useCallback(
    (value: number) => {
      setCharacter((prev) => {
        if (!prev) return null;
        notifyLocalResourceEdit(prev.id);
        return withSyncedResourceFields(prev, { currentHealth: value });
      });
    },
    [setCharacter],
  );

  const handleEnergyChange = useCallback(
    (value: number) => {
      setCharacter((prev) => {
        if (!prev) return null;
        notifyLocalResourceEdit(prev.id);
        return withSyncedResourceFields(prev, { currentEnergy: value });
      });
    },
    [setCharacter],
  );

  const handleActionPointsChange = useCallback(
    (value: number) => {
      setCharacter((prev) => {
        if (!prev) return null;
        notifyLocalResourceEdit(prev.id);
        return {
          ...prev,
          actionPoints: Math.max(0, Math.min(10, value)),
        };
      });
    },
    [setCharacter],
  );

  const handleExperienceChange = useCallback(
    (value: number) => {
      if (!character) return;
      setCharacter((prev) => (prev ? { ...prev, experience: value } : null));
    },
    [character, setCharacter],
  );

  const handleNameChange = useCallback(
    (name: string) => {
      if (!character) return;
      setCharacter((prev) => (prev ? { ...prev, name } : null));
    },
    [character, setCharacter],
  );

  const handlePortraitChange = useCallback(
    async (file: File) => {
      if (!character || !user) return;

      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }

      try {
        setUploadingPortrait(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('characterId', character.id);

        // DESIGN_INTENT: all multipart uploads go through apiUpload for shared error parsing.
        const { url } = await apiUpload<{ url: string }>('/api/upload/portrait', formData);

        setCharacter((prev) => (prev ? { ...prev, portrait: url } : null));
        setPortraitRefreshKey(Date.now());
        await saveCharacter(character.id, { portrait: url });
      } catch {
        setError('Failed to upload portrait');
      } finally {
        setUploadingPortrait(false);
      }
    },
    [character, user, setCharacter, setError, setUploadingPortrait, setPortraitRefreshKey],
  );

  const handlePortraitUrlChange = useCallback(
    async (url: string) => {
      if (!character) return;
      try {
        setUploadingPortrait(true);
        setError(null);
        setCharacter((prev) => (prev ? { ...prev, portrait: url } : null));
        setPortraitRefreshKey(Date.now());
        await saveCharacter(character.id, { portrait: url });
      } catch {
        setError('Failed to update portrait');
      } finally {
        setUploadingPortrait(false);
      }
    },
    [character, setCharacter, setError, setPortraitRefreshKey, setUploadingPortrait],
  );

  const handleAbilityChange = useCallback(
    (ability: AbilityName, value: number) => {
      if (!character) return;
      setCharacter((prev) =>
        prev
          ? {
              ...prev,
              abilities: { ...prev.abilities, [ability]: value },
            }
          : null,
      );
    },
    [character, setCharacter],
  );

  const handleDefenseChange = useCallback(
    (defense: string, value: number) => {
      if (!character) return;
      setCharacter((prev) =>
        prev
          ? {
              ...prev,
              defenseVals: {
                ...DEFAULT_DEFENSE_SKILLS,
                ...(prev.defenseVals || prev.defenseSkills || {}),
                [defense]: Math.max(0, value),
              },
            }
          : null,
      );
    },
    [character, setCharacter],
  );

  const handleTempModifiersChange = useCallback(
    (patch: CharacterTempModifiers) => {
      setCharacter((prev) => {
        if (!prev) return null;
        const next = patchTempModifiers(prev.tempModifiers, patch);
        if (next) return { ...prev, tempModifiers: next };
        const rest = { ...prev };
        delete rest.tempModifiers;
        return rest as Character;
      });
    },
    [setCharacter],
  );

  const handleHealthPointsChange = useCallback(
    (value: number) => {
      if (!character) return;
      setCharacter((prev) => {
        if (!prev) return null;
        const oldPoints = prev.healthPoints ?? 0;
        const delta = value - oldPoints;
        const newPoints = Math.max(0, value);
        if (delta <= 0) {
          return { ...prev, healthPoints: newPoints };
        }
        const level = prev.level || 1;
        const vitality = prev.abilities?.vitality ?? 0;
        const oldMax =
          vitality < 0 ? 8 + vitality + oldPoints : 8 + vitality * level + oldPoints;
        const currentHP = prev.currentHealth ?? prev.health?.current ?? oldMax;
        const shouldBump = currentHP >= oldMax;
        const newCurrent = shouldBump ? currentHP + delta : currentHP;
        return withSyncedResourceFields({ ...prev, healthPoints: newPoints }, { currentHealth: newCurrent });
      });
    },
    [character, setCharacter],
  );

  const handleEnergyPointsChange = useCallback(
    (value: number) => {
      if (!character) return;
      setCharacter((prev) => {
        if (!prev) return null;
        const oldPoints = prev.energyPoints ?? 0;
        const delta = value - oldPoints;
        const newPoints = Math.max(0, value);
        if (delta <= 0) {
          return { ...prev, energyPoints: newPoints };
        }
        const level = prev.level || 1;
        const powerAbil = prev.pow_abil?.toLowerCase() as AbilityName | undefined;
        const powerVal = powerAbil ? (prev.abilities?.[powerAbil] ?? 0) : 0;
        const oldMax = powerVal * level + oldPoints;
        const currentEN = prev.currentEnergy ?? prev.energy?.current ?? oldMax;
        const shouldBump = currentEN >= oldMax;
        const newCurrent = shouldBump ? currentEN + delta : currentEN;
        return withSyncedResourceFields({ ...prev, energyPoints: newPoints }, { currentEnergy: newCurrent });
      });
    },
    [character, setCharacter],
  );

  const handleFullRecovery = useCallback(() => {
    if (!character || !calculatedStats) return;

    const hasFullOrPartialRecovery = (r?: string) => {
      const lower = (r || '').toLowerCase();
      return lower.includes('full') || lower.includes('partial');
    };

    const getCodexFeat = (feat: CharacterFeat) => {
      let dbFeat = featsDb.find((f: CodexFeat) => f.id === String(feat.id));
      if (!dbFeat && feat.name) {
        dbFeat = featsDb.find(
          (f: CodexFeat) => String(f.name ?? '').toLowerCase() === String(feat.name ?? '').toLowerCase(),
        );
      }
      return dbFeat as CodexFeat | undefined;
    };

    const resetArchetypeFeats = (character.archetypeFeats || []).map((feat) => {
      const codex = getCodexFeat(feat);
      const maxUses = feat.maxUses ?? codex?.uses_per_rec;
      const recovery = feat.recovery || codex?.rec_period;
      return {
        ...feat,
        currentUses:
          hasFullOrPartialRecovery(recovery) && maxUses != null ? maxUses : feat.currentUses,
      };
    });

    const resetCharacterFeats = (character.feats || []).map((feat) => {
      const codex = getCodexFeat(feat);
      const maxUses = feat.maxUses ?? codex?.uses_per_rec;
      const recovery = feat.recovery || codex?.rec_period;
      return {
        ...feat,
        currentUses:
          hasFullOrPartialRecovery(recovery) && maxUses != null ? maxUses : feat.currentUses,
      };
    });

    const resetTraitUses: Record<string, number> = {};
    if (character.traitUses) {
      Object.keys(character.traitUses).forEach((traitName) => {
        const trait = traitsDb.find((t: Trait) => t.name === traitName);
        if (trait?.uses_per_rec) {
          resetTraitUses[traitName] = trait.uses_per_rec;
        }
      });
    }

    const stateUsesMaxRec = calculateProficiency(character.level || 1);
    setCharacter((prev) =>
      prev
        ? withSyncedResourceFields(
            {
              ...prev,
              conditions: [],
              archetypeFeats: resetArchetypeFeats,
              feats: resetCharacterFeats,
              traitUses: { ...(prev.traitUses || {}), ...resetTraitUses },
              stateUsesCurrent: stateUsesMaxRec,
            },
            {
              currentHealth: calculatedStats.maxHealth,
              currentEnergy: calculatedStats.maxEnergy,
            },
          )
        : null,
    );

    showToast('Full recovery complete!', 'success');
  }, [character, calculatedStats, traitsDb, featsDb, showToast, setCharacter]);

  const handlePartialRecovery = useCallback(
    (hpRestored: number, enRestored: number, resetPartialFeats: boolean) => {
      if (!character || !calculatedStats) return;

      const currentHP = character.currentHealth ?? character.health?.current ?? calculatedStats.maxHealth;
      const currentEN = character.currentEnergy ?? character.energy?.current ?? calculatedStats.maxEnergy;

      const getCodexFeat = (feat: CharacterFeat) => {
        let dbFeat = featsDb.find((f: CodexFeat) => f.id === String(feat.id));
        if (!dbFeat && feat.name) {
          dbFeat = featsDb.find(
            (f: CodexFeat) => String(f.name ?? '').toLowerCase() === String(feat.name ?? '').toLowerCase(),
          );
        }
        return dbFeat as CodexFeat | undefined;
      };

      const resetArchetypeFeats = (character.archetypeFeats || []).map((feat) => {
        const codex = getCodexFeat(feat);
        const maxUses = feat.maxUses ?? codex?.uses_per_rec;
        const recovery = feat.recovery || codex?.rec_period;
        return {
          ...feat,
          currentUses:
            resetPartialFeats && recovery?.toLowerCase().includes('partial')
              ? maxUses || feat.currentUses
              : feat.currentUses,
        };
      });

      const resetCharacterFeats = (character.feats || []).map((feat) => {
        const codex = getCodexFeat(feat);
        const maxUses = feat.maxUses ?? codex?.uses_per_rec;
        const recovery = feat.recovery || codex?.rec_period;
        return {
          ...feat,
          currentUses:
            resetPartialFeats && recovery?.toLowerCase().includes('partial')
              ? maxUses || feat.currentUses
              : feat.currentUses,
        };
      });

      const resetTraitUses: Record<string, number> = {};
      if (character.traitUses && resetPartialFeats) {
        Object.keys(character.traitUses).forEach((traitName) => {
          const trait = traitsDb.find((t: Trait) => t.name === traitName);
          if (trait?.uses_per_rec && trait.rec_period?.toLowerCase().includes('partial')) {
            resetTraitUses[traitName] = trait.uses_per_rec;
          }
        });
      }

      setCharacter((prev) =>
        prev
          ? withSyncedResourceFields(
              {
                ...prev,
                archetypeFeats: resetArchetypeFeats,
                feats: resetCharacterFeats,
                traitUses: { ...(prev.traitUses || {}), ...resetTraitUses },
              },
              {
                currentHealth: Math.min(currentHP + hpRestored, calculatedStats.maxHealth),
                currentEnergy: Math.min(currentEN + enRestored, calculatedStats.maxEnergy),
              },
            )
          : null,
      );

      showToast(`Recovered ${hpRestored} HP and ${enRestored} EN`, 'success');
    },
    [character, calculatedStats, traitsDb, featsDb, showToast, setCharacter],
  );

  const handleLevelUp = useCallback(
    (newLevel: number) => {
      if (!character) return;
      const lookupId = getArchetypeCodexLookupId(character);
      const pathArch = lookupId
        ? (codexArchetypes.find((a) => a.id === lookupId) as Character['archetype'] | undefined)
        : undefined;
      const profUpdate = applyPathProficiencyForLevel(character, newLevel, pathArch ?? character.archetype);

      setCharacter((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          level: newLevel,
          ...(profUpdate ?? {}),
        };
      });

      if (profUpdate) {
        showToast(
          `Path proficiency updated: Power ${profUpdate.pow_prof}, Martial ${profUpdate.mart_prof}`,
          'success',
        );
      }
    },
    [character, codexArchetypes, showToast, setCharacter],
  );

  return {
    handleHealthChange,
    handleEnergyChange,
    handleActionPointsChange,
    handleExperienceChange,
    handleNameChange,
    handlePortraitChange,
    handlePortraitUrlChange,
    handleAbilityChange,
    handleDefenseChange,
    handleTempModifiersChange,
    handleHealthPointsChange,
    handleEnergyPointsChange,
    handleFullRecovery,
    handlePartialRecovery,
    handleLevelUp,
  };
}
