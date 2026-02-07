/**
 * Character Sheet Page
 * ====================
 * Dynamic route for viewing/editing individual characters
 */

'use client';

import { use, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCharacter, saveCharacter } from '@/services/character-service';
import { useAuth, useAutoSave, useCampaignsFull, useUserPowers, useUserTechniques, useUserItems, useTraits, usePowerParts, useTechniqueParts, useItemProperties, useSpecies, useCodexFeats, useCodexSkills, useEquipment, type Species, type Trait, type Skill } from '@/hooks';
import { LoadingState } from '@/components/ui';
import { enrichCharacterData, cleanForSave } from '@/lib/data-enrichment';
import { calculateArchetypeProgression, calculateSkillPointsForEntity } from '@/lib/game/formulas';
import {
  SheetHeader,
  AbilitiesSection,
  SkillsSection,
  ArchetypeSection,
  LibrarySection,
  RollLog,
  RollProvider,
  SheetActionToolbar,
} from '@/components/character-sheet';
import { useToast } from '@/components/ui';
import type { Character, AbilityName, Item, CharacterPower, CharacterTechnique, CharacterFeat } from '@/types';
import { DEFAULT_DEFENSE_SKILLS } from '@/types/skills';
import { calculateStats } from './character-sheet-utils';
import { CharacterSheetModals, type AddModalType, type FeatModalType, type SkillModalType } from './CharacterSheetModals';

interface PageParams {
  params: Promise<{ id: string }>;
}

export default function CharacterSheetPage({ params }: PageParams) {
  const { id } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [addModalType, setAddModalType] = useState<AddModalType>(null);
  const [featModalType, setFeatModalType] = useState<FeatModalType>(null);
  const [skillModalType, setSkillModalType] = useState<SkillModalType>(null);
  const [featToRemove, setFeatToRemove] = useState<{ id: string; name: string } | null>(null);
  const [uploadingPortrait, setUploadingPortrait] = useState(false);
  
  // Fetch user's library for data enrichment
  const { data: userPowers = [] } = useUserPowers();
  const { data: userTechniques = [] } = useUserTechniques();
  const { data: userItems = [] } = useUserItems();
  const { data: traitsDb = [] } = useTraits();
  const { data: featsDb = [] } = useCodexFeats();
  
  // Codex parts data for enrichment (descriptions, TP costs)
  const { data: powerPartsDb = [] } = usePowerParts();
  const { data: techniquePartsDb = [] } = useTechniqueParts();
  const { data: itemPropertiesDb = [] } = useItemProperties();
  
  // Codex equipment for enrichment fallback
  const { data: codexEquipment = [] } = useEquipment();
  
  // Fetch all species data to look up species traits
  const { data: allSpecies = [] } = useSpecies();
  
  // Fetch all Codex skills to get ability options for each skill
  const { data: codexSkills = [] } = useCodexSkills();

  // Campaigns (for roll log context when character is in a campaign)
  const { data: campaignsFull = [] } = useCampaignsFull();
  const campaignContext = useMemo(() => {
    if (!user?.uid || !character) return undefined;
    const campaign = campaignsFull.find((c) =>
      c.characters?.some((cc) => cc.userId === user.uid && cc.characterId === character.id)
    );
    if (!campaign) return undefined;
    return {
      campaignId: campaign.id,
      characterId: character.id,
      characterName: character.name,
    };
  }, [campaignsFull, user?.uid, character]);
  
  // Enrich character data with full library objects
  const enrichedData = useMemo(() => {
    if (!character) return null;
    return enrichCharacterData(character, userPowers, userTechniques, userItems, codexEquipment, powerPartsDb, techniquePartsDb);
  }, [character, userPowers, userTechniques, userItems, codexEquipment, powerPartsDb, techniquePartsDb]);
  
  // Look up character's species and its species_traits (automatically granted to all characters of that species)
  const characterSpeciesTraits = useMemo(() => {
    if (!character || !allSpecies.length) return [];
    
    // Find species by ID first (handle type coercion), then by name
    const speciesId = character.ancestry?.id;
    const speciesName = character.ancestry?.name || character.species;
    
    let species = allSpecies.find((s: Species) => String(s.id) === String(speciesId));
    if (!species && speciesName) {
      species = allSpecies.find((s: Species) => s.name.toLowerCase() === speciesName?.toLowerCase());
    }
    
    // Return the species_traits array (IDs/names of traits automatically granted)
    return species?.species_traits || [];
  }, [character, allSpecies]);
  
  // Look up character's species skills (auto-granted proficiencies that don't cost choosable skill points)
  const characterSpeciesSkills = useMemo(() => {
    if (!character || !allSpecies.length) return [] as string[];
    
    const speciesId = character.ancestry?.id;
    const speciesName = character.ancestry?.name || character.species;
    
    let species = allSpecies.find((s: Species) => String(s.id) === String(speciesId));
    if (!species && speciesName) {
      species = allSpecies.find((s: Species) => s.name.toLowerCase() === speciesName?.toLowerCase());
    }
    
    return (species?.skills || []) as string[];
  }, [character, allSpecies]);
  
  // Load character data
  useEffect(() => {
    async function loadCharacter() {
      if (!user || authLoading) return;

      try {
        setLoading(true);
        const data = await getCharacter(id);
        if (!data) {
          setError('Character not found');
          return;
        }
        setCharacter(data);
      } catch (err) {
        console.error('Error loading character:', err);
        setError('Failed to load character');
      } finally {
        setLoading(false);
      }
    }

    loadCharacter();
  }, [id, user, authLoading]);
  
  // Calculate stats
  const calculatedStats = useMemo(() => {
    if (!character) return null;
    return calculateStats(character);
  }, [character]);
  
  // Calculate point budgets for edit mode
  const pointBudgets = useMemo(() => {
    if (!character) return null;
    
    const level = character.level || 1;
    const abilities = character.abilities || {};
    
    // Total ability points: 7 base, +1 every 3 levels starting at level 3
    // Formula: 7 + floor((level - 1) / 3)
    const bonusPoints = level < 3 ? 0 : Math.floor((level - 1) / 3);
    const totalAbilityPoints = 7 + bonusPoints;
    
    // Calculate spent ability points (with 2-point cost for 4+)
    let spentAbilityPoints = 0;
    Object.values(abilities).forEach((value) => {
      const val = value || 0;
      if (val > 0) {
        for (let i = 1; i <= val; i++) {
          spentAbilityPoints += i >= 4 ? 2 : 1;
        }
      } else if (val < 0) {
        // Negative values refund 1 point each
        spentAbilityPoints += val;
      }
    });
    
    // Skill points: 2 + (level * 3), but species auto-allocates 2 points
    // For display, show only choosable points: total - speciesCost, spent - speciesCost
    const rawTotalSkillPoints = 2 + (level * 3);
    const speciesSkillCount = characterSpeciesSkills.length;
    const totalSkillPoints = rawTotalSkillPoints - speciesSkillCount;
    
    // Calculate spent skill points (exclude species skill proficiency costs)
    const skills = (character.skills || []) as Array<{ skill_val?: number; prof?: boolean; baseSkill?: string; name?: string; id?: string }>;
    let spentSkillPoints = skills.reduce((sum, skill) => {
      let cost = skill.skill_val || 0;
      // Proficiency costs 1 for base skills, but species skills are free
      if (skill.prof && !skill.baseSkill) {
        const isSpecies = characterSpeciesSkills.some(ss => 
          String(ss).toLowerCase() === String(skill.name || '').toLowerCase() ||
          String(ss) === String(skill.id || '')
        );
        if (!isSpecies) cost += 1;
      }
      return sum + cost;
    }, 0);
    
    // Defense skills cost 2 per point
    const defenseSkills = character.defenseSkills || {};
    const spentDefensePoints = Object.values(defenseSkills).reduce((sum: number, val) => sum + ((val as number || 0) * 2), 0);
    spentSkillPoints += spentDefensePoints;
    
    return {
      totalAbilityPoints,
      spentAbilityPoints,
      availableAbilityPoints: totalAbilityPoints - spentAbilityPoints,
      totalSkillPoints,
      spentSkillPoints,
      availableSkillPoints: totalSkillPoints - spentSkillPoints,
    };
  }, [character, characterSpeciesSkills]);
  
  // Calculate archetype progression (innate energy, threshold, pools, bonus feats)
  const archetypeProgression = useMemo(() => {
    if (!character) return null;
    return calculateArchetypeProgression(
      character.level || 1,
      character.mart_prof || 0,
      character.pow_prof || 0,
      character.archetypeChoices || {}
    );
  }, [character]);
  
  // Calculate if character has unapplied points (for notification dot)
  const hasUnappliedPoints = useMemo(() => {
    if (!character) return false;
    
    const level = character.level || 1;
    const xp = character.experience ?? 0;
    const canLevelUp = xp >= (level * 4);
    
    // Calculate ability points: 7 base, +1 every 3 levels starting at level 3
    const bonusAbilityPoints = level < 3 ? 0 : Math.floor((level - 1) / 3);
    const totalAbilityPoints = 7 + bonusAbilityPoints;
    const currentAbilities = character.abilities || {};
    const spentAbilityPoints = Object.values(currentAbilities).reduce((sum, val) => sum + (val || 0), 0);
    const abilityPointsRemaining = totalAbilityPoints - spentAbilityPoints;
    
    // Calculate health/energy pool: 18 + 12 * (level - 1)
    const totalHEPoints = 18 + 12 * (level - 1);
    const spentHEPoints = (character.healthPoints || 0) + (character.energyPoints || 0);
    const hePointsRemaining = totalHEPoints - spentHEPoints;
    
    // Calculate skill points: 2 + (level * 3) minus species auto-allocated skills
    const rawTotalSkillPoints = 2 + (level * 3);
    const speciesCount = characterSpeciesSkills.length;
    const totalSkillPoints = rawTotalSkillPoints - speciesCount;
    const skills = (character.skills || []) as Array<{ skill_val?: number; prof?: boolean; baseSkill?: string; name?: string; id?: string }>;
    const spentSkillPoints = skills.reduce((sum, skill) => {
      let cost = skill.skill_val || 0;
      if (skill.prof && !skill.baseSkill) {
        const isSpecies = characterSpeciesSkills.some(ss => 
          String(ss).toLowerCase() === String(skill.name || '').toLowerCase() ||
          String(ss) === String(skill.id || '')
        );
        if (!isSpecies) cost += 1;
      }
      return sum + cost;
    }, 0);
    // Defense skills cost 2 per point
    const defenseSkills = character.defenseSkills || {};
    const spentDefensePoints = Object.values(defenseSkills).reduce((sum: number, val) => sum + ((val as number) * 2), 0);
    const skillPointsRemaining = totalSkillPoints - spentSkillPoints - spentDefensePoints;
    
    // Calculate feat slots: 1 archetype feat per 4 levels, 1 character feat per 4 levels
    const archetypeFeatSlots = Math.floor(level / 4) + 1;
    const characterFeatSlots = Math.floor(level / 4) + 1;
    const usedArchetypeFeats = (character.archetypeFeats || []).length;
    const usedCharacterFeats = (character.feats || []).length;
    const archetypeFeatsRemaining = archetypeFeatSlots - usedArchetypeFeats;
    const characterFeatsRemaining = characterFeatSlots - usedCharacterFeats;
    
    return (
      canLevelUp ||
      abilityPointsRemaining > 0 ||
      hePointsRemaining > 0 ||
      skillPointsRemaining > 0 ||
      archetypeFeatsRemaining > 0 ||
      characterFeatsRemaining > 0
    );
  }, [character, characterSpeciesSkills]);
  
  // Auto-save with debounce
  const { hasUnsavedChanges, isSaving, lastSaved, saveNow } = useAutoSave({
    data: character,
    onSave: async (data) => {
      if (!user || !data) return;
      setSaving(true);
      try {
        const cleanedData = cleanForSave(data);
        await saveCharacter(id, cleanedData);
      } finally {
        setSaving(false);
      }
    },
    delay: 2000,
    enabled: isEditMode,
    onSaveStart: () => setSaving(true),
    onSaveComplete: () => {
      setSaving(false);
    },
    onSaveError: (err) => {
      console.error('Auto-save failed:', err);
      setSaving(false);
      showToast('Failed to save character', 'error');
    },
  });
  
  // Save when leaving edit mode
  const handleToggleEditMode = useCallback(async () => {
    if (isEditMode && hasUnsavedChanges) {
      await saveNow();
    }
    setIsEditMode(!isEditMode);
  }, [isEditMode, hasUnsavedChanges, saveNow]);
  
  // Update handlers
  const handleHealthChange = useCallback((value: number) => {
    if (!character) return;
    setCharacter(prev => prev ? {
      ...prev,
      health: { ...prev.health, current: value, max: prev.health?.max || 0 }
    } : null);
  }, [character]);
  
  const handleEnergyChange = useCallback((value: number) => {
    if (!character) return;
    setCharacter(prev => prev ? {
      ...prev,
      energy: { ...prev.energy, current: value, max: prev.energy?.max || 0 }
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
      await saveCharacter(character.id, { portrait: url });
    } catch (err) {
      console.error('Portrait upload error:', err);
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
      defenseSkills: { 
        ...DEFAULT_DEFENSE_SKILLS,
        ...(prev.defenseSkills || {}), 
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
      const currentHP = prev.health?.current ?? oldMax;
      const shouldBump = currentHP >= oldMax;
      const newCurrent = shouldBump ? currentHP + delta : currentHP;
      return {
        ...prev,
        healthPoints: newPoints,
        health: prev.health
          ? { ...prev.health, current: newCurrent }
          : { current: newCurrent, max: oldMax + delta },
      };
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
      const currentEN = prev.energy?.current ?? oldMax;
      const shouldBump = currentEN >= oldMax;
      const newCurrent = shouldBump ? currentEN + delta : currentEN;
      return {
        ...prev,
        energyPoints: newPoints,
        energy: prev.energy
          ? { ...prev.energy, current: newCurrent }
          : { current: newCurrent, max: oldMax + delta },
      };
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
    
    // Reset feat uses only when recovery type is Full or Partial (not one-time-use)
    const resetArchetypeFeats = (character.archetypeFeats || []).map(feat => ({
      ...feat,
      currentUses: hasFullOrPartialRecovery(feat.recovery) && feat.maxUses != null
        ? feat.maxUses
        : feat.currentUses,
    }));
    
    const resetCharacterFeats = (character.feats || []).map(feat => ({
      ...feat,
      currentUses: hasFullOrPartialRecovery(feat.recovery) && feat.maxUses != null
        ? feat.maxUses
        : feat.currentUses,
    }));
    
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
    
    setCharacter(prev => prev ? {
      ...prev,
      health: { current: calculatedStats.maxHealth, max: calculatedStats.maxHealth },
      energy: { current: calculatedStats.maxEnergy, max: calculatedStats.maxEnergy },
      conditions: [], // Clear all conditions
      archetypeFeats: resetArchetypeFeats,
      feats: resetCharacterFeats,
      traitUses: { ...(prev.traitUses || {}), ...resetTraitUses },
    } : null);
    
    showToast('Full recovery complete!', 'success');
  }, [character, calculatedStats, traitsDb, showToast]);
  
  // Partial recovery handler - restores specified HP/EN and resets partial-recovery feats/traits
  const handlePartialRecovery = useCallback((hpRestored: number, enRestored: number, resetPartialFeats: boolean) => {
    if (!character || !calculatedStats) return;
    
    const currentHP = character.health?.current ?? calculatedStats.maxHealth;
    const currentEN = character.energy?.current ?? calculatedStats.maxEnergy;
    
    // Reset feats with "Partial" recovery to max uses
    const resetArchetypeFeats = (character.archetypeFeats || []).map(feat => ({
      ...feat,
      currentUses: resetPartialFeats && feat.recovery?.toLowerCase().includes('partial')
        ? feat.maxUses || feat.currentUses
        : feat.currentUses,
    }));
    
    const resetCharacterFeats = (character.feats || []).map(feat => ({
      ...feat,
      currentUses: resetPartialFeats && feat.recovery?.toLowerCase().includes('partial')
        ? feat.maxUses || feat.currentUses
        : feat.currentUses,
    }));
    
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
    
    setCharacter(prev => prev ? {
      ...prev,
      health: { 
        current: Math.min(currentHP + hpRestored, calculatedStats.maxHealth), 
        max: calculatedStats.maxHealth 
      },
      energy: { 
        current: Math.min(currentEN + enRestored, calculatedStats.maxEnergy), 
        max: calculatedStats.maxEnergy 
      },
      archetypeFeats: resetArchetypeFeats,
      feats: resetCharacterFeats,
      traitUses: { ...(prev.traitUses || {}), ...resetTraitUses },
    } : null);
    
    showToast(`Recovered ${hpRestored} HP and ${enRestored} EN`, 'success');
  }, [character, calculatedStats, traitsDb, showToast]);
  
  // Level up handler
  const handleLevelUp = useCallback((newLevel: number) => {
    if (!character) return;
    setCharacter(prev => prev ? {
      ...prev,
      level: newLevel
    } : null);
  }, [character]);
  
  // Get existing item IDs for the modal
  const existingIds = useMemo(() => {
    if (!character) return new Set<string>();
    const ids = new Set<string>();
    
    character.powers?.forEach(p => ids.add(String(p.id || '')));
    character.techniques?.forEach(t => ids.add(String(t.id || '')));
    (character.equipment?.weapons as Item[] || []).forEach(w => ids.add(String(w.id || '')));
    (character.equipment?.armor as Item[] || []).forEach(a => ids.add(String(a.id || '')));
    (character.equipment?.items as Item[] || []).forEach(e => ids.add(String(e.id || '')));
    
    return ids;
  }, [character]);
  
  // Add power handler
  const handleAddPowers = useCallback((powers: CharacterPower[]) => {
    if (!character) return;
    setCharacter(prev => prev ? {
      ...prev,
      powers: [...(prev.powers || []), ...powers]
    } : null);
  }, [character]);
  
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
    if (!character || !calculatedStats) return;
    const currentEnergy = character.energy?.current ?? calculatedStats.maxEnergy;
    if (currentEnergy < energyCost) return;
    
    setCharacter(prev => prev ? {
      ...prev,
      energy: { 
        current: currentEnergy - energyCost, 
        max: prev.energy?.max ?? calculatedStats.maxEnergy 
      }
    } : null);
  }, [character, calculatedStats]);
  
  // Add technique handler
  const handleAddTechniques = useCallback((techniques: CharacterTechnique[]) => {
    if (!character) return;
    setCharacter(prev => prev ? {
      ...prev,
      techniques: [...(prev.techniques || []), ...techniques]
    } : null);
  }, [character]);
  
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
    if (!character || !calculatedStats) return;
    const currentEnergy = character.energy?.current ?? calculatedStats.maxEnergy;
    if (currentEnergy < energyCost) return;
    
    setCharacter(prev => prev ? {
      ...prev,
      energy: { 
        current: currentEnergy - energyCost, 
        max: prev.energy?.max ?? calculatedStats.maxEnergy 
      }
    } : null);
  }, [character, calculatedStats]);
  
  // Add weapon handler
  const handleAddWeapons = useCallback((items: Item[]) => {
    if (!character) return;
    setCharacter(prev => prev ? {
      ...prev,
      equipment: {
        ...prev.equipment,
        weapons: [...((prev.equipment?.weapons as Item[]) || []), ...items]
      }
    } : null);
  }, [character]);
  
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
    setCharacter(prev => prev ? {
      ...prev,
      equipment: {
        ...prev.equipment,
        armor: [...((prev.equipment?.armor as Item[]) || []), ...items]
      }
    } : null);
  }, [character]);
  
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
  
  // Add equipment handler
  const handleAddEquipment = useCallback((items: Item[]) => {
    if (!character) return;
    setCharacter(prev => prev ? {
      ...prev,
      equipment: {
        ...prev.equipment,
        items: [...((prev.equipment?.items as Item[]) || []), ...items]
      }
    } : null);
  }, [character]);
  
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
  
  // Equipment quantity change handler (+/-)
  // Note: Match by ID, name, or index (when passed as number) since equipment may be stored as {name} without ID
  const handleEquipmentQuantityChange = useCallback((itemId: string | number, delta: number) => {
    if (!character) return;
    const idStr = String(itemId);
    setCharacter(prev => {
      if (!prev) return null;
      const items = ((prev.equipment?.items as Item[]) || []).map((item, idx) => {
        const matches = item.id === itemId || 
                       String(item.id) === idStr || 
                       item.name === idStr || 
                       item.name?.toLowerCase() === idStr.toLowerCase() ||
                       (typeof itemId === 'number' && idx === itemId);
        if (matches) {
          const newQty = Math.max(1, (item.quantity || 1) + delta);
          return { ...item, quantity: newQty };
        }
        return item;
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
  
  // Add feats handler
  const handleAddFeats = useCallback((feats: { id: string; name: string; description?: string; effect?: string; max_uses?: number }[], type: 'archetype' | 'character') => {
    if (!character) return;
    const newFeats: CharacterFeat[] = feats.map(f => ({
      id: f.id,
      name: f.name,
      description: f.description || f.effect || '',
      maxUses: f.max_uses,
      currentUses: f.max_uses,
    }));
    
    if (type === 'archetype') {
      setCharacter(prev => prev ? {
        ...prev,
        archetypeFeats: [...(prev.archetypeFeats || []), ...newFeats]
      } : null);
    } else {
      setCharacter(prev => prev ? {
        ...prev,
        feats: [...(prev.feats || []), ...newFeats]
      } : null);
    }
    setFeatModalType(null);
  }, [character]);

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
  const handleFeatUsesChange = useCallback((featId: string, delta: number) => {
    if (!character) return;
    setCharacter(prev => {
      if (!prev) return null;
      
      // Update archetype feats
      const updatedArchetypeFeats = (prev.archetypeFeats || []).map(feat => {
        if (String(feat.id) === featId && feat.maxUses) {
          const currentUses = feat.currentUses ?? feat.maxUses;
          const newUses = Math.max(0, Math.min(feat.maxUses, currentUses + delta));
          return { ...feat, currentUses: newUses };
        }
        return feat;
      });
      
      // Update character feats
      const updatedCharFeats = (prev.feats || []).map(feat => {
        if (String(feat.id) === featId && feat.maxUses) {
          const currentUses = feat.currentUses ?? feat.maxUses;
          const newUses = Math.max(0, Math.min(feat.maxUses, currentUses + delta));
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
  }, [character]);
  
  // Trait uses change handler (+/- buttons for trait tracking)
  const handleTraitUsesChange = useCallback((traitName: string, delta: number) => {
    if (!character) return;
    setCharacter(prev => {
      if (!prev) return null;
      const currentUses = prev.traitUses?.[traitName] ?? 0;
      // Find the trait in traitsDb to get maxUses
      const traitData = traitsDb.find((t: Trait) => t.name?.toLowerCase() === traitName.toLowerCase());
      // Codex trait objects may include `uses_per_rec`; cast to any to avoid strict type mismatch
      const maxUses = (traitData as any)?.uses_per_rec ?? 999;
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
      case 'equipment':
        handleAddEquipment(items as Item[]);
        break;
    }
  }, [addModalType, handleAddPowers, handleAddTechniques, handleAddWeapons, handleAddArmor, handleAddEquipment]);
  
  // Enrich skills with availableAbilities from Codex
  // This ensures existing skills that lack availableAbilities get them from the database
  // NOTE: This useMemo must be before any early returns to follow React's Rules of Hooks
  const skills = useMemo(() => {
    if (!character) return [];
    
    const rawSkills = (character.skills || []) as Array<{
      id: string;
      name: string;
      category?: string;
      skill_val: number;
      prof?: boolean;
      baseSkill?: string;
      ability?: string;
      availableAbilities?: string[];
    }>;
    
    // If no Codex skills loaded yet, return raw skills
    if (codexSkills.length === 0) return rawSkills;
    
    return rawSkills.map(skill => {
      // If skill already has availableAbilities, use those
      if (skill.availableAbilities && skill.availableAbilities.length > 0) {
        return skill;
      }
      
      // Find matching skill in Codex by name or id
      const codexSkill = codexSkills.find(
        (rs: Skill) => rs.id === skill.id || rs.name.toLowerCase() === skill.name.toLowerCase()
      );
      
      if (codexSkill && codexSkill.ability) {
        const availableAbilities = codexSkill.ability.split(',').map((a: string) => a.trim().toLowerCase()).filter(Boolean);
        
        // If the skill's current ability is not in the available list, default to first available
        let ability = skill.ability;
        if (!ability || !availableAbilities.includes(ability.toLowerCase())) {
          ability = availableAbilities[0] || 'strength';
        }
        
        return {
          ...skill,
          ability,
          availableAbilities,
        };
      }
      
      return skill;
    });
  }, [character, codexSkills]);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);
  
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState message="Loading character..." size="lg" />
      </div>
    );
  }
  
  if (error || !character) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            {error || 'Character not found'}
          </h1>
          <Link
            href="/characters"
            className="text-primary-600 hover:text-primary-700"
          >
            ← Back to Characters
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <RollProvider campaignContext={campaignContext}>
      <div className="min-h-screen bg-background pb-8">
        {/* Floating Action Toolbar */}
        <SheetActionToolbar
          isEditMode={isEditMode}
          hasUnappliedPoints={hasUnappliedPoints}
          hasUnsavedChanges={hasUnsavedChanges}
          isSaving={saving || isSaving}
          lastSaved={lastSaved}
          onToggleEditMode={handleToggleEditMode}
          onRecovery={() => setShowRecoveryModal(true)}
          onLevelUp={() => setShowLevelUpModal(true)}
        />
        
        {/* Character Sheet Content */}
        <div className="max-w-[1600px] mx-auto px-4 pt-4">
          {calculatedStats && (
            <>
              <SheetHeader
                character={character}
                calculatedStats={calculatedStats}
                isEditMode={isEditMode}
                onHealthChange={handleHealthChange}
                onEnergyChange={handleEnergyChange}
                onHealthPointsChange={handleHealthPointsChange}
                onEnergyPointsChange={handleEnergyPointsChange}
                onPortraitChange={handlePortraitChange}
                isUploadingPortrait={uploadingPortrait}
                onNameChange={isEditMode ? handleNameChange : undefined}
                onExperienceChange={handleExperienceChange}
                speedBase={character.speedBase ?? 6}
                evasionBase={character.evasionBase ?? 10}
                onSpeedBaseChange={(v: number) => setCharacter(prev => prev ? { ...prev, speedBase: v } : null)}
                onEvasionBaseChange={(v: number) => setCharacter(prev => prev ? { ...prev, evasionBase: v } : null)}
                innateThreshold={archetypeProgression?.innateThreshold || 0}
                innatePools={archetypeProgression?.innatePools || 0}
              />
              
              <AbilitiesSection
                abilities={character.abilities}
                defenseSkills={character.defenseSkills}
                level={character.level || 1}
                archetypeAbility={character.archetype?.ability as AbilityName}
                martialAbility={character.mart_abil}
                powerAbility={character.pow_abil}
                isEditMode={isEditMode}
                totalAbilityPoints={pointBudgets?.totalAbilityPoints}
                spentAbilityPoints={pointBudgets?.spentAbilityPoints}
                totalSkillPoints={pointBudgets?.totalSkillPoints}
                spentSkillPoints={pointBudgets?.spentSkillPoints}
                onAbilityChange={handleAbilityChange}
                onDefenseChange={handleDefenseChange}
              />
            
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_2fr] gap-4 items-stretch">
              <div className="flex flex-col min-h-[400px]">
                <SkillsSection
                  skills={skills}
                  abilities={character.abilities}
                  isEditMode={isEditMode}
                  totalSkillPoints={calculateSkillPointsForEntity(character.level || 1, 'character')}
                  speciesSkills={characterSpeciesSkills}
                  onSkillChange={handleSkillChange}
                  onRemoveSkill={handleRemoveSkill}
                  onAddSkill={() => setSkillModalType('skill')}
                  onAddSubSkill={() => setSkillModalType('subskill')}
                  className="flex-1"
                />
              </div>
              
              <div className="flex flex-col min-h-[400px]">
                <ArchetypeSection
                  character={character}
                  isEditMode={isEditMode}
                  onMartialProfChange={handleMartialProfChange}
                  onPowerProfChange={handlePowerProfChange}
                  onMilestoneChoiceChange={handleMilestoneChoiceChange}
                  unarmedProwess={character.unarmedProwess}
                  onUnarmedProwessChange={(level) => setCharacter(prev => prev ? { ...prev, unarmedProwess: level } : null)}
                  className="flex-1"
                />
              </div>
              
              <div className="flex flex-col min-h-[400px]">
                <LibrarySection
                  className="flex-1"
                  powers={enrichedData?.powers || character.powers || []}
                  techniques={enrichedData?.techniques || character.techniques || []}
                  weapons={enrichedData?.weapons || (character.equipment?.weapons || []) as Item[]}
                  armor={enrichedData?.armor || (character.equipment?.armor || []) as Item[]}
                  equipment={enrichedData?.equipment || (character.equipment?.items || []) as Item[]}
                  currency={character.currency}
                  innateEnergy={archetypeProgression?.innateEnergy || 0}
                  innateThreshold={archetypeProgression?.innateThreshold || 0}
                  innatePools={archetypeProgression?.innatePools || 0}
                  currentEnergy={character.energy?.current ?? calculatedStats.maxEnergy}
                  martialProficiency={character.mart_prof}
                  isEditMode={isEditMode}
                  onAddPower={() => setAddModalType('power')}
                  onRemovePower={handleRemovePower}
                  onTogglePowerInnate={handleTogglePowerInnate}
                  onUsePower={handleUsePower}
                  onAddTechnique={() => setAddModalType('technique')}
                  onRemoveTechnique={handleRemoveTechnique}
                  onUseTechnique={handleUseTechnique}
                  onAddWeapon={() => setAddModalType('weapon')}
                  onRemoveWeapon={handleRemoveWeapon}
                  onToggleEquipWeapon={handleToggleEquipWeapon}
                  onAddArmor={() => setAddModalType('armor')}
                  onRemoveArmor={handleRemoveArmor}
                  onToggleEquipArmor={handleToggleEquipArmor}
                  onAddEquipment={() => setAddModalType('equipment')}
                  onRemoveEquipment={handleRemoveEquipment}
                  onEquipmentQuantityChange={handleEquipmentQuantityChange}
                  onCurrencyChange={handleCurrencyChange}
                  // Notes tab props
                  weight={character.weight}
                  height={character.height}
                  appearance={character.appearance}
                  archetypeDesc={character.archetypeDesc}
                  notes={character.notes}
                  abilities={character.abilities}
                  onWeightChange={(v) => setCharacter(prev => prev ? { ...prev, weight: v } : null)}
                  onHeightChange={(v) => setCharacter(prev => prev ? { ...prev, height: v } : null)}
                  visibility={character.visibility}
                  onVisibilityChange={(v) => setCharacter(prev => prev ? { ...prev, visibility: v } : null)}
                  onAppearanceChange={(v) => setCharacter(prev => prev ? { ...prev, appearance: v } : null)}
                  onArchetypeDescChange={(v) => setCharacter(prev => prev ? { ...prev, archetypeDesc: v } : null)}
                  onNotesChange={(v) => setCharacter(prev => prev ? { ...prev, notes: v } : null)}
                  // Custom notes props
                  namedNotes={character.namedNotes}
                  onAddNote={() => {
                    const newNote = {
                      id: `note_${Date.now()}`,
                      name: 'New Note',
                      content: '',
                    };
                    setCharacter(prev => prev ? {
                      ...prev,
                      namedNotes: [...(prev.namedNotes || []), newNote],
                    } : null);
                  }}
                  onUpdateNote={(id, updates) => {
                    setCharacter(prev => prev ? {
                      ...prev,
                      namedNotes: (prev.namedNotes || []).map(note =>
                        note.id === id ? { ...note, ...updates } : note
                      ),
                    } : null);
                  }}
                  onDeleteNote={(id) => {
                    setCharacter(prev => prev ? {
                      ...prev,
                      namedNotes: (prev.namedNotes || []).filter(note => note.id !== id),
                    } : null);
                  }}
                  // Proficiencies tab props
                  level={character.level}
                  archetypeAbility={character.abilities?.[character.pow_abil as keyof typeof character.abilities] || 0}
                  unarmedProwess={character.unarmedProwess}
                  onUnarmedProwessChange={(level) => setCharacter(prev => prev ? { ...prev, unarmedProwess: level } : null)}
                  powerPartsDb={powerPartsDb}
                  techniquePartsDb={techniquePartsDb}
                  itemPropertiesDb={itemPropertiesDb}
                  // Feats tab props
                  // Cast ancestry to any to accommodate nullable fields from Codex (selectedFlaw may be null)
                  ancestry={character.ancestry as any}
                  // Vanilla site trait fields (stored at top level)
                  vanillaTraits={{
                    ancestryTraits: character.ancestryTraits,
                    flawTrait: character.flawTrait,
                    characteristicTrait: character.characteristicTrait,
                    speciesTraits: character.speciesTraits,
                  }}
                  // Species traits from Codex (automatically granted to all characters of this species)
                  speciesTraitsFromCodex={characterSpeciesTraits}
                  archetypeFeats={character.archetypeFeats}
                  characterFeats={character.feats}
                  onFeatUsesChange={handleFeatUsesChange}
                  onAddArchetypeFeat={() => setFeatModalType('archetype')}
                  onAddCharacterFeat={() => setFeatModalType('character')}
                  onRemoveFeat={handleRequestRemoveFeat}
                  // Traits enrichment props
                  traitsDb={traitsDb}
                  featsDb={featsDb}
                  traitUses={character.traitUses}
                  onTraitUsesChange={handleTraitUsesChange}
                />
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Fixed Roll Log */}
      <RollLog />

      {/* Modals */}
      <CharacterSheetModals
        addModalType={addModalType}
        setAddModalType={setAddModalType}
        featModalType={featModalType}
        setFeatModalType={setFeatModalType}
        skillModalType={skillModalType}
        setSkillModalType={setSkillModalType}
        featToRemove={featToRemove}
        setFeatToRemove={setFeatToRemove}
        showLevelUpModal={showLevelUpModal}
        setShowLevelUpModal={setShowLevelUpModal}
        showRecoveryModal={showRecoveryModal}
        setShowRecoveryModal={setShowRecoveryModal}
        character={character}
        calculatedStats={calculatedStats}
        existingIds={existingIds}
        skills={skills}
        traitsDb={traitsDb}
        onModalAdd={handleModalAdd}
        onAddFeats={handleAddFeats}
        onAddSkills={handleAddSkills}
        onConfirmRemoveFeat={handleConfirmRemoveFeat}
        onLevelUp={handleLevelUp}
        onFullRecovery={handleFullRecovery}
        onPartialRecovery={handlePartialRecovery}
      />
    </div>
    </RollProvider>
  );
}
