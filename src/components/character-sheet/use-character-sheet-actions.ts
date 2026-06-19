'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { saveCharacter } from '@/services/character-service';
import { getArchetypeAbilityScore } from '@/lib/game/calculations';
import { getArchetypeCodexLookupId, applyPathProficiencyForLevel } from '@/lib/game/archetype-display';
import { calculateProficiency } from '@/lib/game/formulas';
import {
  buildRequiredProficiencies,
  dedupeHighestProficiencies,
  mergeOwnedWithRequired,
  calculateProficiencyTP,
  getTrainingPointLimit,
} from '@/lib/proficiencies';
import { DEFAULT_DEFENSE_SKILLS } from '@/types/skills';
import { withSyncedResourceFields } from '@/lib/encounter/character-resource-sync';
import type {
  AbilityName,
  Archetype,
  Character,
  CharacterFeat,
  CharacterPower,
  CharacterTechnique,
  Feat,
  Item,
} from '@/types';
import type { Trait } from '@/hooks/codex-types';
import type { CharacterSheetStats, CharacterSheetDerivedHandlers } from './use-character-sheet-derived';
import type { EditArchetypeResult } from './edit-archetype-modal';
import type { AddModalType, FeatModalType, SkillModalType } from './character-sheet-context';
import type { LibrarySectionProps } from './library-section';

export interface UseCharacterSheetActionsArgs {
  character: Character | null;
  setCharacter: React.Dispatch<React.SetStateAction<Character | null>>;
  calculatedStats: CharacterSheetStats | null;
  featsDb: Feat[];
  traitsDb: Trait[];
  codexArchetypes: Archetype[];
  powerPartsDb: LibrarySectionProps['powerPartsDb'];
  techniquePartsDb: LibrarySectionProps['techniquePartsDb'];
  itemPropertiesDb: LibrarySectionProps['itemPropertiesDb'];
  showToast: (message: string, variant?: 'success' | 'error' | 'warning' | 'info') => void;
  user: { uid: string } | null;
  addModalType: AddModalType;
  setFeatModalType: (type: FeatModalType) => void;
  setSkillModalType: (type: SkillModalType) => void;
  setFeatToRemove: (value: { id: string; name: string } | null) => void;
  featToRemove: { id: string; name: string } | null;
  setError: (message: string | null) => void;
  setUploadingPortrait: (value: boolean) => void;
  setPortraitRefreshKey: (value: number) => void;
  setShowEditArchetypeModal: (value: boolean) => void;
  setShowEditSpeciesModal: (value: boolean) => void;
  stateFeatsList: Array<CharacterFeat & { type: 'archetype' | 'character' }>;
  stateUsesMax: number;
}

export function useCharacterSheetActions(args: UseCharacterSheetActionsArgs) {
  const {
    character,
    setCharacter,
    calculatedStats,
    featsDb,
    traitsDb,
    codexArchetypes,
    powerPartsDb,
    techniquePartsDb,
    itemPropertiesDb,
    showToast,
    user,
    addModalType,
    setFeatModalType,
    setSkillModalType,
    setFeatToRemove,
    featToRemove,
    setError,
    setUploadingPortrait,
    setPortraitRefreshKey,
    setShowEditArchetypeModal,
    setShowEditSpeciesModal,
    stateFeatsList,
    stateUsesMax,
  } = args;

const handleHealthChange = useCallback((value: number) => {
  if (!character) return;
  setCharacter(prev =>
    prev ? withSyncedResourceFields(prev, { currentHealth: value }) : null
  );
}, [character]);

const handleEnergyChange = useCallback((value: number) => {
  if (!character) return;
  setCharacter(prev =>
    prev ? withSyncedResourceFields(prev, { currentEnergy: value }) : null
  );
}, [character]);

const handleActionPointsChange = useCallback((value: number) => {
  if (!character) return;
  setCharacter(prev => prev ? {
    ...prev,
    actionPoints: Math.max(0, Math.min(10, value)),
  } : null);
}, [character]);

// Experience change handler (always available)
const handleExperienceChange = useCallback((value: number) => {
  if (!character) return;
  setCharacter(prev => prev ? { ...prev, experience: value } : null);
}, [character]);

// Name change handler (always available)
const handleNameChange = useCallback((name: string) => {
  if (!character) return;
  setCharacter(prev => prev ? { ...prev, name } : null);
}, [character]);

// Portrait upload handler (Supabase Storage via API)
const handlePortraitChange = useCallback(async (file: File) => {
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

    const res = await fetch('/api/upload/portrait', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error((err as { error?: string }).error ?? 'Upload failed');
    }

    const { url } = (await res.json()) as { url: string };

    setCharacter(prev => prev ? { ...prev, portrait: url } : null);
    setPortraitRefreshKey(Date.now());
    await saveCharacter(character.id, { portrait: url });
  } catch (err) {
    setError('Failed to upload portrait');
  } finally {
    setUploadingPortrait(false);
  }
}, [character, user]);

const handleAbilityChange = useCallback((ability: AbilityName, value: number) => {
  if (!character) return;
  setCharacter(prev => prev ? {
    ...prev,
    abilities: { ...prev.abilities, [ability]: value }
  } : null);
}, [character]);

// Defense skill change handler
const handleDefenseChange = useCallback((defense: string, value: number) => {
  if (!character) return;
  setCharacter(prev => prev ? {
    ...prev,
    defenseVals: { 
      ...DEFAULT_DEFENSE_SKILLS,
      ...(prev.defenseVals || prev.defenseSkills || {}), 
      [defense]: Math.max(0, value) 
    }
  } : null);
}, [character]);

// Health points allocation handler — when increasing max, bump current if at full
const handleHealthPointsChange = useCallback((value: number) => {
  if (!character) return;
  setCharacter(prev => {
    if (!prev) return null;
    const oldPoints = prev.healthPoints ?? 0;
    const delta = value - oldPoints;
    const newPoints = Math.max(0, value);
    if (delta <= 0) {
      return { ...prev, healthPoints: newPoints };
    }
    const level = prev.level || 1;
    const vitality = prev.abilities?.vitality ?? 0;
    const oldMax = vitality < 0
      ? 8 + vitality + oldPoints
      : 8 + (vitality * level) + oldPoints;
    const currentHP = prev.currentHealth ?? prev.health?.current ?? oldMax;
    const shouldBump = currentHP >= oldMax;
    const newCurrent = shouldBump ? currentHP + delta : currentHP;
    return withSyncedResourceFields(
      { ...prev, healthPoints: newPoints },
      { currentHealth: newCurrent }
    );
  });
}, [character]);

// Energy points allocation handler — when increasing max, bump current if at full
const handleEnergyPointsChange = useCallback((value: number) => {
  if (!character) return;
  setCharacter(prev => {
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
    const oldMax = (powerVal * level) + oldPoints;
    const currentEN = prev.currentEnergy ?? prev.energy?.current ?? oldMax;
    const shouldBump = currentEN >= oldMax;
    const newCurrent = shouldBump ? currentEN + delta : currentEN;
    return withSyncedResourceFields(
      { ...prev, energyPoints: newPoints },
      { currentEnergy: newCurrent }
    );
  });
}, [character]);

// Full recovery handler - restores HP, EN, and feat/trait uses with "Full" or "Partial" recovery
// Per game rules: one-time-use feats (no recovery period) are NOT reset
const handleFullRecovery = useCallback(() => {
  if (!character || !calculatedStats) return;
  
  const hasFullOrPartialRecovery = (r?: string) => {
    const lower = (r || '').toLowerCase();
    return lower.includes('full') || lower.includes('partial');
  };

  // Lookup codex data for a feat (maxUses, recovery period)
  const getCodexFeat = (feat: CharacterFeat) => {
    let dbFeat = featsDb.find((f: Feat) => f.id === String(feat.id));
    if (!dbFeat && feat.name) dbFeat = featsDb.find((f: Feat) => String(f.name ?? '').toLowerCase() === String(feat.name ?? '').toLowerCase());
    return dbFeat as Feat | undefined;
  };
  
  // Reset feat uses only when recovery type is Full or Partial (not one-time-use)
  const resetArchetypeFeats = (character.archetypeFeats || []).map(feat => {
    const codex = getCodexFeat(feat);
    const maxUses = feat.maxUses ?? codex?.uses_per_rec;
    const recovery = feat.recovery || codex?.rec_period;
    return {
      ...feat,
      currentUses: hasFullOrPartialRecovery(recovery) && maxUses != null
        ? maxUses
        : feat.currentUses,
    };
  });
  
  const resetCharacterFeats = (character.feats || []).map(feat => {
    const codex = getCodexFeat(feat);
    const maxUses = feat.maxUses ?? codex?.uses_per_rec;
    const recovery = feat.recovery || codex?.rec_period;
    return {
      ...feat,
      currentUses: hasFullOrPartialRecovery(recovery) && maxUses != null
        ? maxUses
        : feat.currentUses,
    };
  });
  
  // Reset trait uses to max (traits with uses_per_rec have a recovery period)
  const resetTraitUses: Record<string, number> = {};
  if (character.traitUses) {
    Object.keys(character.traitUses).forEach(traitName => {
      const trait = traitsDb.find((t: Trait) => t.name === traitName);
      if (trait?.uses_per_rec) {
        resetTraitUses[traitName] = trait.uses_per_rec;
      }
    });
  }
  
  const stateUsesMaxRec = calculateProficiency(character.level || 1);
  setCharacter(prev =>
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
          }
        )
      : null
  );
  
  showToast('Full recovery complete!', 'success');
}, [character, calculatedStats, traitsDb, featsDb, showToast]);

// Partial recovery handler - restores specified HP/EN and resets partial-recovery feats/traits
const handlePartialRecovery = useCallback((hpRestored: number, enRestored: number, resetPartialFeats: boolean) => {
  if (!character || !calculatedStats) return;
  
  const currentHP = character.currentHealth ?? character.health?.current ?? calculatedStats.maxHealth;
  const currentEN = character.currentEnergy ?? character.energy?.current ?? calculatedStats.maxEnergy;
  
  // Lookup codex data for a feat (maxUses, recovery period)
  const getCodexFeat = (feat: CharacterFeat) => {
    let dbFeat = featsDb.find((f: Feat) => f.id === String(feat.id));
    if (!dbFeat && feat.name) dbFeat = featsDb.find((f: Feat) => String(f.name ?? '').toLowerCase() === String(feat.name ?? '').toLowerCase());
    return dbFeat as Feat | undefined;
  };

  // Reset feats with "Partial" recovery to max uses
  const resetArchetypeFeats = (character.archetypeFeats || []).map(feat => {
    const codex = getCodexFeat(feat);
    const maxUses = feat.maxUses ?? codex?.uses_per_rec;
    const recovery = feat.recovery || codex?.rec_period;
    return {
      ...feat,
      currentUses: resetPartialFeats && recovery?.toLowerCase().includes('partial')
        ? maxUses || feat.currentUses
        : feat.currentUses,
    };
  });
  
  const resetCharacterFeats = (character.feats || []).map(feat => {
    const codex = getCodexFeat(feat);
    const maxUses = feat.maxUses ?? codex?.uses_per_rec;
    const recovery = feat.recovery || codex?.rec_period;
    return {
      ...feat,
      currentUses: resetPartialFeats && recovery?.toLowerCase().includes('partial')
        ? maxUses || feat.currentUses
        : feat.currentUses,
    };
  });
  
  // Reset trait uses for "Partial" recovery traits
  const resetTraitUses: Record<string, number> = {};
  if (character.traitUses && resetPartialFeats) {
    Object.keys(character.traitUses).forEach(traitName => {
      const trait = traitsDb.find((t: Trait) => t.name === traitName);
      if (trait?.uses_per_rec && trait.rec_period?.toLowerCase().includes('partial')) {
        resetTraitUses[traitName] = trait.uses_per_rec;
      }
    });
  }
  
  setCharacter(prev =>
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
          }
        )
      : null
  );
  
  showToast(`Recovered ${hpRestored} HP and ${enRestored} EN`, 'success');
}, [character, calculatedStats, traitsDb, featsDb, showToast]);

// Level up handler
const handleLevelUp = useCallback((newLevel: number) => {
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
      'success'
    );
  }
}, [character, codexArchetypes, showToast]);

// Get existing item IDs for the modal (skip empty string so we don't filter out library items)
const existingIds = useMemo(() => {
  if (!character) return new Set<string>();
  const ids = new Set<string>();
  const add = (id: string | number | undefined) => {
    const s = String(id ?? '');
    if (s) ids.add(s);
  };
  character.powers?.forEach(p => add(p.id));
  character.techniques?.forEach(t => add(t.id));
  (character.equipment?.weapons as Item[] || []).forEach(w => add(w.id));
  (character.equipment?.shields as Item[] || []).forEach(s => add(s.id));
  (character.equipment?.armor as Item[] || []).forEach(a => add(a.id));
  (character.equipment?.items as Item[] || []).forEach(e => add(e.id));
  return ids;
}, [character]);

const buildRequiredForCharacter = useCallback((c: Character) => {
  const weapons = ((c.equipment?.weapons as Item[]) || []);
  const shields = ((c.equipment?.shields as Item[]) || []);
  const armor = ((c.equipment?.armor as Item[]) || []);
  return buildRequiredProficiencies({
    powers: c.powers || [],
    techniques: c.techniques || [],
    weapons,
    shields,
    armor,
    powerPartsDb,
    techniquePartsDb,
    itemPropertiesDb,
  });
}, [powerPartsDb, techniquePartsDb, itemPropertiesDb]);

const applyAutoProficiencies = useCallback((next: Character, reason: string): Character | null => {
  const required = buildRequiredForCharacter(next);
  const merged = mergeOwnedWithRequired(next.proficiencies || [], required);
  const deduped = dedupeHighestProficiencies(merged);
  const newSpent = deduped.reduce((sum, p) => sum + calculateProficiencyTP(p), 0);
  const currentDeduped = dedupeHighestProficiencies(next.proficiencies || []);
  const currentSpent = currentDeduped.reduce((sum, p) => sum + calculateProficiencyTP(p), 0);
  const ability = getArchetypeAbilityScore(next);
  const max = getTrainingPointLimit(next.level || 1, ability);
  const overLimit = newSpent > max;
  const thisActionAddedTp = newSpent > currentSpent;
  if (overLimit && thisActionAddedTp) {
    // Soft cap: the TP limit is visibly flagged on the sheet and recoverable in
    // the Proficiencies tab, so we apply the change and warn rather than block
    // with a modal/confirm (TASK-338).
    showToast(
      `${reason} puts proficiency TP over the limit (${newSpent}/${max}). Adjust in the Proficiencies tab.`,
      'warning'
    );
  }
  return { ...next, proficiencies: deduped };
}, [buildRequiredForCharacter, showToast]);

useEffect(() => {
  if (!character) return;
  if ((character.proficiencies || []).length > 0) return;
  if (!powerPartsDb?.length && !techniquePartsDb?.length && !itemPropertiesDb?.length) return;
  const required = buildRequiredForCharacter(character);
  if (required.length === 0) return;
  setCharacter((prev) => (prev ? { ...prev, proficiencies: required } : prev));
}, [character, powerPartsDb?.length, techniquePartsDb?.length, itemPropertiesDb?.length, buildRequiredForCharacter]);

// Add power handler
const handleAddPowers = useCallback((powers: CharacterPower[]) => {
  if (!character) return;
  const candidate: Character = {
    ...character,
    powers: [...(character.powers || []), ...powers],
  };
  const next = applyAutoProficiencies(candidate, 'Adding powers');
  if (!next) return;
  setCharacter(next);
}, [character, applyAutoProficiencies]);

// Remove power handler
const handleRemovePower = useCallback((powerId: string | number) => {
  if (!character) return;
  setCharacter(prev => prev ? {
    ...prev,
    powers: (prev.powers || []).filter(p => p.id !== powerId && String(p.id) !== String(powerId))
  } : null);
}, [character]);

// Toggle power innate handler
const handleTogglePowerInnate = useCallback((powerId: string | number, isInnate: boolean) => {
  if (!character) return;
  setCharacter(prev => prev ? {
    ...prev,
    powers: (prev.powers || []).map(p => 
      (p.id === powerId || String(p.id) === String(powerId)) 
        ? { ...p, innate: isInnate } 
        : p
    )
  } : null);
}, [character]);

// Use power handler (deducts energy)
const handleUsePower = useCallback((powerId: string | number, energyCost: number) => {
  if (!calculatedStats) return;
  setCharacter((prev) => {
    if (!prev) return null;
    const curEnergy = prev.currentEnergy ?? prev.energy?.current ?? calculatedStats.maxEnergy;
    if (curEnergy < energyCost) return prev;
    return { ...prev, currentEnergy: curEnergy - energyCost };
  });
}, [calculatedStats, setCharacter]);

// Add technique handler
const handleAddTechniques = useCallback((techniques: CharacterTechnique[]) => {
  if (!character) return;
  const candidate: Character = {
    ...character,
    techniques: [...(character.techniques || []), ...techniques],
  };
  const next = applyAutoProficiencies(candidate, 'Adding techniques');
  if (!next) return;
  setCharacter(next);
}, [character, applyAutoProficiencies]);

// Remove technique handler
const handleRemoveTechnique = useCallback((techId: string | number) => {
  if (!character) return;
  setCharacter(prev => prev ? {
    ...prev,
    techniques: (prev.techniques || []).filter(t => t.id !== techId && String(t.id) !== String(techId))
  } : null);
}, [character]);

// Use technique handler (deducts energy)
const handleUseTechnique = useCallback((techId: string | number, energyCost: number) => {
  if (!calculatedStats) return;
  setCharacter((prev) => {
    if (!prev) return null;
    const curEnergy = prev.currentEnergy ?? prev.energy?.current ?? calculatedStats.maxEnergy;
    if (curEnergy < energyCost) return prev;
    return { ...prev, currentEnergy: curEnergy - energyCost };
  });
}, [calculatedStats, setCharacter]);

// Add weapon handler
const handleAddWeapons = useCallback((items: Item[]) => {
  if (!character) return;
  const candidate: Character = {
    ...character,
    equipment: {
      ...character.equipment,
      weapons: [...((character.equipment?.weapons as Item[]) || []), ...items],
    },
  };
  const next = applyAutoProficiencies(candidate, 'Adding weapons');
  if (!next) return;
  setCharacter(next);
}, [character, applyAutoProficiencies]);

// Remove weapon handler
// Note: Match by ID, name, or index (when passed as number) since equipment may be stored as {name, equipped} without ID
const handleRemoveWeapon = useCallback((itemId: string | number) => {
  if (!character) return;
  const idStr = String(itemId);
  setCharacter(prev => prev ? {
    ...prev,
    equipment: {
      ...prev.equipment,
      weapons: ((prev.equipment?.weapons as Item[]) || []).filter((w, idx) => {
        const matches = w.id === itemId || 
                       String(w.id) === idStr || 
                       w.name === idStr || 
                       w.name?.toLowerCase() === idStr.toLowerCase() ||
                       (typeof itemId === 'number' && idx === itemId);
        return !matches;
      })
    }
  } : null);
}, [character]);

// Toggle equip weapon handler
// Note: Match by ID, name, or index (when passed as number) since equipment may be stored as {name, equipped} without ID
const handleToggleEquipWeapon = useCallback((itemId: string | number) => {
  if (!character) return;
  const idStr = String(itemId);
  setCharacter(prev => prev ? {
    ...prev,
    equipment: {
      ...prev.equipment,
      weapons: ((prev.equipment?.weapons as Item[]) || []).map((w, idx) => {
        const matches = w.id === itemId || 
                       String(w.id) === idStr || 
                       w.name === idStr || 
                       w.name?.toLowerCase() === idStr.toLowerCase() ||
                       (typeof itemId === 'number' && idx === itemId);
        return matches ? { ...w, equipped: !w.equipped } : w;
      })
    }
  } : null);
}, [character]);

// Add armor handler
const handleAddArmor = useCallback((items: Item[]) => {
  if (!character) return;
  const candidate: Character = {
    ...character,
    equipment: {
      ...character.equipment,
      armor: [...((character.equipment?.armor as Item[]) || []), ...items],
    },
  };
  const next = applyAutoProficiencies(candidate, 'Adding armor');
  if (!next) return;
  setCharacter(next);
}, [character, applyAutoProficiencies]);

// Remove armor handler
// Note: Match by ID, name, or index (when passed as number) since equipment may be stored as {name, equipped} without ID
const handleRemoveArmor = useCallback((itemId: string | number) => {
  if (!character) return;
  const idStr = String(itemId);
  setCharacter(prev => prev ? {
    ...prev,
    equipment: {
      ...prev.equipment,
      armor: ((prev.equipment?.armor as Item[]) || []).filter((a, idx) => {
        const matches = a.id === itemId || 
                       String(a.id) === idStr || 
                       a.name === idStr || 
                       a.name?.toLowerCase() === idStr.toLowerCase() ||
                       (typeof itemId === 'number' && idx === itemId);
        return !matches;
      })
    }
  } : null);
}, [character]);

// Toggle equip armor handler
// Note: Match by ID, name, or index (when passed as number) since equipment may be stored as {name, equipped} without ID
const handleToggleEquipArmor = useCallback((itemId: string | number) => {
  if (!character) return;
  const idStr = String(itemId);
  setCharacter(prev => prev ? {
    ...prev,
    equipment: {
      ...prev.equipment,
      armor: ((prev.equipment?.armor as Item[]) || []).map((a, idx) => {
        const matches = a.id === itemId || 
                       String(a.id) === idStr || 
                       a.name === idStr || 
                       a.name?.toLowerCase() === idStr.toLowerCase() ||
                       (typeof itemId === 'number' && idx === itemId);
        return matches ? { ...a, equipped: !a.equipped } : a;
      })
    }
  } : null);
}, [character]);

// Add shield handler
const handleAddShields = useCallback((items: Item[]) => {
  if (!character) return;
  const candidate: Character = {
    ...character,
    equipment: {
      ...character.equipment,
      shields: [...((character.equipment?.shields as Item[]) || []), ...items],
    },
  };
  const next = applyAutoProficiencies(candidate, 'Adding shields');
  if (!next) return;
  setCharacter(next);
}, [character, applyAutoProficiencies]);

// Remove shield handler
const handleRemoveShield = useCallback((itemId: string | number) => {
  if (!character) return;
  const idStr = String(itemId);
  setCharacter(prev => prev ? {
    ...prev,
    equipment: {
      ...prev.equipment,
      shields: ((prev.equipment?.shields as Item[]) || []).filter((s, idx) => {
        const matches = s.id === itemId || 
                       String(s.id) === idStr || 
                       s.name === idStr || 
                       s.name?.toLowerCase() === idStr.toLowerCase() ||
                       (typeof itemId === 'number' && idx === itemId);
        return !matches;
      })
    }
  } : null);
}, [character]);

// Toggle equip shield handler
const handleToggleEquipShield = useCallback((itemId: string | number) => {
  if (!character) return;
  const idStr = String(itemId);
  setCharacter(prev => prev ? {
    ...prev,
    equipment: {
      ...prev.equipment,
      shields: ((prev.equipment?.shields as Item[]) || []).map((s, idx) => {
        const matches = s.id === itemId || 
                       String(s.id) === idStr || 
                       s.name === idStr || 
                       s.name?.toLowerCase() === idStr.toLowerCase() ||
                       (typeof itemId === 'number' && idx === itemId);
        return matches ? { ...s, equipped: !s.equipped } : s;
      })
    }
  } : null);
}, [character]);

// Add equipment handler
const handleAddEquipment = useCallback((items: Item[]) => {
  if (!character) return;
  const candidate: Character = {
    ...character,
    equipment: {
      ...character.equipment,
      items: [...((character.equipment?.items as Item[]) || []), ...items],
    },
  };
  const next = applyAutoProficiencies(candidate, 'Adding equipment');
  if (!next) return;
  setCharacter(next);
}, [character, applyAutoProficiencies]);

// Remove equipment handler
// Note: Match by ID, name, or index (when passed as number) since equipment may be stored as {name} without ID
const handleRemoveEquipment = useCallback((itemId: string | number) => {
  if (!character) return;
  const idStr = String(itemId);
  setCharacter(prev => prev ? {
    ...prev,
    equipment: {
      ...prev.equipment,
      items: ((prev.equipment?.items as Item[]) || []).filter((e, idx) => {
        const matches = e.id === itemId || 
                       String(e.id) === idStr || 
                       e.name === idStr || 
                       e.name?.toLowerCase() === idStr.toLowerCase() ||
                       (typeof itemId === 'number' && idx === itemId);
        return !matches;
      })
    }
  } : null);
}, [character]);

// Equipment quantity change handler (+/-). If quantity goes below 1, remove the item.
const handleEquipmentQuantityChange = useCallback((itemId: string | number, delta: number) => {
  if (!character) return;
  const idStr = String(itemId);
  setCharacter(prev => {
    if (!prev) return null;
    const currentItems = (prev.equipment?.items as Item[]) || [];
    const items = currentItems.flatMap((item, idx) => {
      const matches = item.id === itemId ||
                     String(item.id) === idStr ||
                     item.name === idStr ||
                     item.name?.toLowerCase() === idStr.toLowerCase() ||
                     (typeof itemId === 'number' && idx === itemId);
      if (!matches) return [item];
      const newQty = (item.quantity ?? 1) + delta;
      if (newQty < 1) return []; // remove item
      return [{ ...item, quantity: newQty }];
    });
    return {
      ...prev,
      equipment: { ...prev.equipment, items }
    };
  });
}, [character]);

// Currency change handler
const handleCurrencyChange = useCallback((value: number) => {
  if (!character) return;
  setCharacter(prev => prev ? {
    ...prev,
    currency: value
  } : null);
}, [character]);

// Add feats handler — saves lean: { id, name, currentUses }
// description/maxUses/recovery derived from codex on display
// When type is 'state', each feat is added to archetype or character based on codex char_feat
const handleAddFeats = useCallback((feats: { id: string; name: string; description?: string; effect?: string; max_uses?: number }[], type: 'archetype' | 'character' | 'state') => {
  if (!character) return;
  const newFeats: CharacterFeat[] = feats.map(f => ({
    id: f.id,
    name: f.name,
    currentUses: f.max_uses, // Start at max uses; maxUses itself derived from codex
  }));
  
  if (type === 'state') {
    const db = featsDb as Array<Feat & { char_feat?: boolean }>;
    const toArchetype: CharacterFeat[] = [];
    const toCharacter: CharacterFeat[] = [];
    newFeats.forEach(f => {
      const codex = db.find(x => x.id === f.id || String(x.name ?? '').toLowerCase() === String(f.name ?? '').toLowerCase());
      if (codex?.char_feat) toCharacter.push(f);
      else toArchetype.push(f);
    });
    setCharacter(prev => prev ? {
      ...prev,
      archetypeFeats: [...(prev.archetypeFeats || []), ...toArchetype],
      feats: [...(prev.feats || []), ...toCharacter],
    } : null);
  } else if (type === 'archetype') {
    type LeveledFeat = Feat & { base_feat_id?: string; feat_lvl?: number };
    const db = featsDb as LeveledFeat[];
    const byId = new Map<string, LeveledFeat>(db.map((f) => [String(f.id), f]));
    const getLevel = (f: LeveledFeat | undefined) => (f?.feat_lvl != null && f.feat_lvl > 0 ? f.feat_lvl : 1);
    const getFamily = (f: LeveledFeat | undefined) => (f?.base_feat_id ? String(f.base_feat_id) : String(f?.id ?? ''));
    setCharacter(prev => prev ? {
      ...prev,
      archetypeFeats: newFeats.reduce<CharacterFeat[]>((acc, nextFeat) => {
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
      }, [...(prev.archetypeFeats || [])])
    } : null);
  } else {
    type LeveledFeat = Feat & { base_feat_id?: string; feat_lvl?: number };
    const db = featsDb as LeveledFeat[];
    const byId = new Map<string, LeveledFeat>(db.map((f) => [String(f.id), f]));
    const getLevel = (f: LeveledFeat | undefined) => (f?.feat_lvl != null && f.feat_lvl > 0 ? f.feat_lvl : 1);
    const getFamily = (f: LeveledFeat | undefined) => (f?.base_feat_id ? String(f.base_feat_id) : String(f?.id ?? ''));
    setCharacter(prev => prev ? {
      ...prev,
      feats: newFeats.reduce<CharacterFeat[]>((acc, nextFeat) => {
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
      }, [...(prev.feats || [])])
    } : null);
  }
  setFeatModalType(null);
}, [character, featsDb]);

// Remove feat handler (called after confirmation)
const handleRemoveFeat = useCallback((featId: string) => {
  if (!character) return;
  setCharacter(prev => {
    if (!prev) return null;
    // Try removing from archetype feats first
    const archetypeFeats = prev.archetypeFeats || [];
    const archetypeIdx = archetypeFeats.findIndex(f => String(f.id) === featId || f.name === featId);
    if (archetypeIdx !== -1) {
      return {
        ...prev,
        archetypeFeats: archetypeFeats.filter((_, i) => i !== archetypeIdx),
      };
    }
    // Then try character feats
    const charFeats = prev.feats || [];
    const charIdx = charFeats.findIndex(f => String(f.id) === featId || f.name === featId);
    if (charIdx !== -1) {
      return {
        ...prev,
        feats: charFeats.filter((_, i) => i !== charIdx),
      };
    }
    return prev;
  });
}, [character]);

// Request feat removal (opens confirmation modal)
const handleRequestRemoveFeat = useCallback((featId: string, featName?: string) => {
  setFeatToRemove({ id: featId, name: featName || featId });
}, []);

// Confirm feat removal (called from modal)
const handleConfirmRemoveFeat = useCallback(() => {
  if (featToRemove) {
    handleRemoveFeat(featToRemove.id);
    setFeatToRemove(null);
  }
}, [featToRemove, handleRemoveFeat]);

// Add skills handler - accepts skills from add-skill or add-sub-skill modals
const handleAddSkills = useCallback((newSkills: Array<{ 
  id: string; 
  name: string; 
  ability?: string; 
  base_skill_id?: number;
  selectedBaseSkillId?: string;
}>) => {
  if (!character) return;
  const skillsToAdd = newSkills.map(s => {
    // Parse available abilities from comma-separated string
    const availableAbilities = typeof s.ability === 'string' 
      ? s.ability.split(',').map(a => a.trim().toLowerCase()).filter(Boolean)
      : [];
    
    // Default to the first available ability, not just 'strength'
    const defaultAbility = availableAbilities[0] || 'strength';
    
    const skill: {
      id: string;
      name: string;
      category: string;
      skill_val: number;
      prof: boolean;
      ability?: string;
      availableAbilities?: string[];
      baseSkillId?: number;
      selectedBaseSkillId?: string;
    } = {
      id: s.id,
      name: s.name,
      category: defaultAbility,
      skill_val: 0,
      prof: false,
    };
    // Store the selected ability (defaults to first available)
    skill.ability = defaultAbility;
    // Store all available abilities for the dropdown
    if (availableAbilities.length > 0) {
      skill.availableAbilities = availableAbilities;
    }
    if (s.base_skill_id !== undefined) skill.baseSkillId = s.base_skill_id;
    if (s.selectedBaseSkillId) skill.selectedBaseSkillId = s.selectedBaseSkillId;
    return skill;
  });
  
  // Skills are stored as array of objects at runtime, but typed as Record
  // Cast to handle the type mismatch
  setCharacter(prev => {
    if (!prev) return null;
    const currentSkills = (prev.skills || []) as unknown as typeof skillsToAdd;
    return {
      ...prev,
      skills: [...currentSkills, ...skillsToAdd] as unknown as typeof prev.skills
    };
  });
  setSkillModalType(null);
}, [character]);

// Remove skill handler
const handleRemoveSkill = useCallback((skillId: string) => {
  if (!character) return;
  setCharacter(prev => {
    if (!prev) return null;
    const currentSkills = (prev.skills || []) as unknown as Array<{ id: string }>;
    return {
      ...prev,
      skills: currentSkills.filter(s => s.id !== skillId) as unknown as typeof prev.skills
    };
  });
}, [character]);

// Skill change handler (for editing skill values, proficiency, ability)
const handleSkillChange = useCallback((skillId: string, updates: Partial<{ skill_val: number; prof: boolean; ability: string }>) => {
  if (!character) return;
  setCharacter(prev => {
    if (!prev) return null;
    const currentSkills = (prev.skills || []) as unknown as Array<{ id: string; skill_val?: number; prof?: boolean; ability?: string }>;
    const updatedSkills = currentSkills.map(skill => {
      if (skill.id === skillId) {
        return { ...skill, ...updates };
      }
      return skill;
    });
    return {
      ...prev,
      skills: updatedSkills as unknown as typeof prev.skills
    };
  });
}, [character]);

// Martial proficiency change handler
const handleMartialProfChange = useCallback((value: number) => {
  if (!character) return;
  setCharacter(prev => prev ? {
    ...prev,
    mart_prof: Math.max(0, Math.min(6, value)),
    martialProficiency: Math.max(0, Math.min(6, value)),
  } : null);
}, [character]);

// Power proficiency change handler
const handlePowerProfChange = useCallback((value: number) => {
  if (!character) return;
  setCharacter(prev => prev ? {
    ...prev,
    pow_prof: Math.max(0, Math.min(6, value)),
    powerProficiency: Math.max(0, Math.min(6, value)),
  } : null);
}, [character]);

// Edit archetype modal save: update archetype, abilities, and proficiencies
const handleArchetypeSave = useCallback((result: EditArchetypeResult) => {
  if (!character) return;
  setCharacter(prev => prev ? {
    ...prev,
    archetype: { id: result.archetype.id, type: result.archetype.type },
    pow_abil: result.pow_abil,
    mart_abil: result.mart_abil,
    mart_prof: result.mart_prof,
    pow_prof: result.pow_prof,
    martialProficiency: result.mart_prof,
    powerProficiency: result.pow_prof,
    ...(result.creationMode !== undefined ? { creationMode: result.creationMode } : {}),
    ...(result.archetypePathId !== undefined
      ? { archetypePathId: result.archetypePathId ?? undefined }
      : {}),
  } : null);
  setShowEditArchetypeModal(false);
}, [character]);

// Edit species modal save: update ancestry and migrate skills
const handleEditSpeciesSave = useCallback((updates: { ancestry: Character['ancestry']; skills: unknown }) => {
  if (!character) return;
  let ancestry = updates.ancestry;
  if (ancestry?.mixed === true && Array.isArray(ancestry.selectedSpeciesTraits)) {
    const st = ancestry.selectedSpeciesTraits;
    ancestry = {
      ...ancestry,
      selectedSpeciesTraits: [String(st[0] ?? '').trim(), String(st[1] ?? '').trim()] as [string, string],
    };
  }
  setCharacter((prev) =>
    prev ? { ...prev, ancestry, skills: updates.skills as Character['skills'] } : null
  );
  setShowEditSpeciesModal(false);
}, [character]);

// Mixed archetype milestone choice handler
const handleMilestoneChoiceChange = useCallback((level: number, choice: 'innate' | 'feat') => {
  if (!character) return;
  setCharacter(prev => prev ? {
    ...prev,
    archetypeChoices: {
      ...(prev.archetypeChoices || {}),
      [level]: choice,
    },
  } : null);
}, [character]);

// Feat uses change handler (+/- buttons for feat tracking)
// maxUses derived from codex, with saved feat.maxUses as backward compat fallback
const handleFeatUsesChange = useCallback((featId: string, delta: number) => {
  if (!character) return;
  const codexFeat = featsDb.find((f: Feat) => f.id === featId) as Feat | undefined;
  setCharacter(prev => {
    if (!prev) return null;
    
    // Update archetype feats
    const updatedArchetypeFeats = (prev.archetypeFeats || []).map(feat => {
      const maxUses = feat.maxUses ?? codexFeat?.uses_per_rec;
      if (String(feat.id) === featId && maxUses) {
        const currentUses = feat.currentUses ?? maxUses;
        const newUses = Math.max(0, Math.min(maxUses, currentUses + delta));
        return { ...feat, currentUses: newUses };
      }
      return feat;
    });
    
    // Update character feats
    const updatedCharFeats = (prev.feats || []).map(feat => {
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
}, [character, featsDb]);

// Trait uses change handler (+/- buttons for trait tracking)
const handleTraitUsesChange = useCallback((traitName: string, delta: number) => {
  if (!character) return;
  setCharacter(prev => {
    if (!prev) return null;
    const currentUses = prev.traitUses?.[traitName] ?? 0;
    // Find the trait in traitsDb to get maxUses
    const traitData = traitsDb.find((t: Trait) => t.name?.toLowerCase() === traitName.toLowerCase());
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
}, [character, traitsDb]);

const handleStateUsesChange = useCallback((delta: number) => {
  if (!character || stateUsesMax <= 0) return;
  setCharacter(prev => {
    if (!prev) return null;
    const current = prev.stateUsesCurrent ?? stateUsesMax;
    const next = Math.max(0, Math.min(stateUsesMax, current + delta));
    return { ...prev, stateUsesCurrent: next };
  });
}, [character, stateUsesMax]);

const handleEnterState = useCallback(() => {
  if (!character || stateUsesMax <= 0) return;
  const current = character.stateUsesCurrent ?? stateUsesMax;
  if (current <= 0) return;
  setCharacter(prev => {
    if (!prev) return null;
    const db = featsDb as Array<Feat & { state_feat?: boolean; uses_per_rec?: number }>;
    const isStateFeat = (feat: CharacterFeat) => {
      const codex = db.find(f => f.id === String(feat.id)) ?? db.find(f => String(f.name ?? '').toLowerCase() === String(feat.name ?? '').toLowerCase());
      return !!(codex?.state_feat);
    };
    const getMaxUses = (feat: CharacterFeat) => {
      const codex = db.find(f => f.id === String(feat.id)) ?? db.find(f => String(f.name ?? '').toLowerCase() === String(feat.name ?? '').toLowerCase());
      return feat.maxUses ?? codex?.uses_per_rec ?? 0;
    };
    let nextArch = prev.archetypeFeats || [];
    let nextChar = prev.feats || [];
    stateFeatsList.forEach(sf => {
      const maxUses = getMaxUses(sf);
      if (maxUses <= 0) return;
      if (sf.type === 'archetype') {
        nextArch = nextArch.map(f => {
          if (String(f.id) !== String(sf.id) && f.name !== sf.name) return f;
          const cur = f.currentUses ?? maxUses;
          return { ...f, currentUses: Math.max(0, cur - 1) };
        });
      } else {
        nextChar = nextChar.map(f => {
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
}, [character, stateUsesMax, featsDb, stateFeatsList]);

// Handle modal item add based on type
const handleModalAdd = useCallback((items: CharacterPower[] | CharacterTechnique[] | Item[]) => {
  if (!addModalType) return;
  
  switch (addModalType) {
    case 'power':
      handleAddPowers(items as CharacterPower[]);
      break;
    case 'technique':
      handleAddTechniques(items as CharacterTechnique[]);
      break;
    case 'weapon':
      handleAddWeapons(items as Item[]);
      break;
    case 'armor':
      handleAddArmor(items as Item[]);
      break;
    case 'shield':
      handleAddShields(items as Item[]);
      break;
    case 'equipment':
      handleAddEquipment(items as Item[]);
      break;
  }
}, [addModalType, handleAddPowers, handleAddTechniques, handleAddWeapons, handleAddArmor, handleAddShields, handleAddEquipment]);
  const libraryHandlers: CharacterSheetDerivedHandlers = useMemo(
    () => ({
      setCharacter,
      handleRemovePower,
      handleTogglePowerInnate,
      handleUsePower,
      handleRemoveTechnique,
      handleUseTechnique,
      handleRemoveWeapon,
      handleToggleEquipWeapon,
      handleRemoveShield,
      handleToggleEquipShield,
      handleRemoveArmor,
      handleToggleEquipArmor,
      handleRemoveEquipment,
      handleEquipmentQuantityChange,
      handleCurrencyChange,
      handleStateUsesChange,
      handleEnterState,
      handleFeatUsesChange,
      handleRequestRemoveFeat,
      handleTraitUsesChange,
    }),
    [
      setCharacter,
      handleRemovePower,
      handleTogglePowerInnate,
      handleUsePower,
      handleRemoveTechnique,
      handleUseTechnique,
      handleRemoveWeapon,
      handleToggleEquipWeapon,
      handleRemoveShield,
      handleToggleEquipShield,
      handleRemoveArmor,
      handleToggleEquipArmor,
      handleRemoveEquipment,
      handleEquipmentQuantityChange,
      handleCurrencyChange,
      handleStateUsesChange,
      handleEnterState,
      handleFeatUsesChange,
      handleRequestRemoveFeat,
      handleTraitUsesChange,
    ]
  );

  return {
    handleHealthChange,
    handleEnergyChange,
    handleActionPointsChange,
    handleExperienceChange,
    handleNameChange,
    handlePortraitChange,
    handleAbilityChange,
    handleDefenseChange,
    handleHealthPointsChange,
    handleEnergyPointsChange,
    handleFullRecovery,
    handlePartialRecovery,
    handleLevelUp,
    existingIds,
    handleAddPowers,
    handleRemovePower,
    handleTogglePowerInnate,
    handleUsePower,
    handleAddTechniques,
    handleRemoveTechnique,
    handleUseTechnique,
    handleAddWeapons,
    handleRemoveWeapon,
    handleToggleEquipWeapon,
    handleAddArmor,
    handleRemoveArmor,
    handleToggleEquipArmor,
    handleAddShields,
    handleRemoveShield,
    handleToggleEquipShield,
    handleAddEquipment,
    handleRemoveEquipment,
    handleEquipmentQuantityChange,
    handleCurrencyChange,
    handleAddFeats,
    handleRemoveFeat,
    handleRequestRemoveFeat,
    handleConfirmRemoveFeat,
    handleAddSkills,
    handleRemoveSkill,
    handleSkillChange,
    handleMartialProfChange,
    handlePowerProfChange,
    handleArchetypeSave,
    handleEditSpeciesSave,
    handleMilestoneChoiceChange,
    handleFeatUsesChange,
    handleTraitUsesChange,
    handleStateUsesChange,
    handleEnterState,
    handleModalAdd,
    libraryHandlers,
  };
}
