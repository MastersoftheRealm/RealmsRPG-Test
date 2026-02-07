/**
 * RTDB Hooks
 * ===========
 * React Query hooks for Firebase Realtime Database data fetching.
 * Codex data now reads from Firestore (use-firestore-codex); RTDB paths deprecated.
 * Utility hooks (useResolvedTraits, useSkillIdToNameMap, etc.) use Firestore codex.
 */

'use client';

import { useCodexTraits, useCodexSkills } from './use-firestore-codex';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { ref, get, Database } from 'firebase/database';
import { rtdb, waitForFirebase } from '@/lib/firebase/client';
import { useMemo } from 'react';

// Helper to get RTDB with initialization wait
async function getRTDB(): Promise<Database> {
  await waitForFirebase();
  if (!rtdb) {
    throw new Error('RTDB not initialized after waitForFirebase');
  }
  return rtdb;
}

// =============================================================================
// Types for RTDB Data
// =============================================================================

export interface PowerPart {
  id: string;
  name: string;
  description: string;
  category: string;
  base_en: number;
  base_tp: number;
  op_1_desc?: string;
  op_1_en?: number;
  op_1_tp?: number;
  op_2_desc?: string;
  op_2_en?: number;
  op_2_tp?: number;
  op_3_desc?: string;
  op_3_en?: number;
  op_3_tp?: number;
  // Part type flags
  duration?: boolean;
  percentage?: boolean;
  mechanic?: boolean;
}

export interface TechniquePart {
  id: string;
  name: string;
  description: string;
  category: string;
  base_tp: number;
  base_stam: number;
  base_en?: number;
  op_1_desc?: string;
  op_1_en?: number;
  op_1_tp?: number;
  op_2_desc?: string;
  op_2_en?: number;
  op_2_tp?: number;
  op_3_desc?: string;
  op_3_en?: number;
  op_3_tp?: number;
  percentage?: boolean;
  mechanic?: boolean;
}

/** Combined Part type (for Codex Parts tab) */
export interface Part {
  id: string;
  name: string;
  description: string;
  category: string;
  type: 'power' | 'technique';
  base_en: number;
  base_tp: number;
  op_1_desc?: string;
  op_1_en?: number;
  op_1_tp?: number;
  op_2_desc?: string;
  op_2_en?: number;
  op_2_tp?: number;
  op_3_desc?: string;
  op_3_en?: number;
  op_3_tp?: number;
  percentage?: boolean;
  mechanic?: boolean;
}

export interface ItemProperty {
  id: string;
  name: string;
  description: string;
  type?: 'weapon' | 'armor' | 'shield' | 'general';
  // Legacy fields
  tp_cost?: number;
  gold_cost?: number;
  // New standardized fields matching power/technique parts
  base_ip?: number;
  base_tp?: number;
  base_c?: number;
  op_1_desc?: string;
  op_1_ip?: number;
  op_1_tp?: number;
  op_1_c?: number;
}

export interface Feat {
  id: string;
  name: string;
  description: string;
  category: string;
  ability?: string;
  ability_req: string[];
  abil_req_val: number[];
  tags: string[];
  skill_req: string[];
  skill_req_val: number[];
  lvl_req: number;
  rec_period?: string;
  uses_per_rec: number;
  mart_abil_req?: string;
  char_feat: boolean;
  state_feat: boolean;
  prereq_text?: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  ability: string;
  category: string;
  /** Base skill ID for sub-skills. 0 = any base skill, undefined = not a sub-skill */
  base_skill_id?: number;
  trained_only?: boolean;
}

export interface Species {
  id: string;
  name: string;
  description: string;
  type: string; // Species type (Humanoid, Beast, etc.)
  size: string; // Primary size
  sizes: string[]; // All available sizes
  speed: number;
  traits: string[];
  species_traits: string[];
  ancestry_traits: string[];
  flaws: string[];
  characteristics: string[];
  skills: string[];
  languages: string[];
  ability_bonuses?: Record<string, number>;
  ave_height?: number;
  ave_weight?: number;
  adulthood_lifespan?: number[];
}

export interface Trait {
  id: string;
  name: string;
  description: string;
  species?: string[];
  uses_per_rec?: number;
  rec_period?: string;
}

export interface EquipmentItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'equipment';
  subtype?: string;
  category?: string;
  description: string;
  damage?: string;
  armor_value?: number;
  gold_cost: number;
  currency: number;
  properties: string[];
  rarity?: string;
  weight?: number;
}

// =============================================================================
// Utility Functions
// =============================================================================

function toStrArray(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
  return [];
}

function toNumArray(val: unknown): number[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(Number);
  if (typeof val === 'number') return [val];
  if (typeof val === 'string') return val.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
  return [];
}

async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  attempts = 3
): Promise<T> {
  let lastErr: Error | unknown;
  
  for (let i = 0; i < attempts; i++) {
    try {
      return await fetchFn();
    } catch (err) {
      lastErr = err;
      const msg = (err as Error)?.message || '';
      const isOffline = msg.includes('Client is offline') || 
                       msg.toLowerCase().includes('network');
      
      if (!isOffline || i === attempts - 1) throw err;
      
      // Exponential backoff
      await new Promise(res => setTimeout(res, 500 * (i + 1)));
    }
  }
  
  throw lastErr;
}

// =============================================================================
// Generic RTDB Fetch Function
// =============================================================================

async function fetchRTDBData<T>(
  path: string,
  transform: (data: Record<string, unknown>) => T[]
): Promise<T[]> {
  // Wait for Firebase to be initialized
  const database = await getRTDB();
  
  const dbRef = ref(database, path);
  const snapshot = await fetchWithRetry(() => get(dbRef));
  
  if (!snapshot.exists()) {
    console.warn(`[rtdb-hooks] No data found at path: ${path}`);
    return [];
  }
  
  const data = snapshot.val() as Record<string, unknown>;
  return transform(data);
}

// =============================================================================
// Data Fetching Functions
// =============================================================================

async function fetchFeats(): Promise<Feat[]> {
  return fetchRTDBData<Feat>('feats', (data) => 
    Object.entries(data).map(([id, f]) => {
      const feat = f as Record<string, unknown>;
      return {
        id,
        name: (feat.name as string) || '',
        description: (feat.description as string) || '',
        category: (feat.category as string) || '',
        ability: feat.ability as string | undefined,
        ability_req: toStrArray(feat.ability_req),
        abil_req_val: toNumArray(feat.abil_req_val),
        tags: toStrArray(feat.tags),
        skill_req: toStrArray(feat.skill_req),
        skill_req_val: toNumArray(feat.skill_req_val),
        lvl_req: parseInt(feat.lvl_req as string) || 0,
        uses_per_rec: parseInt(feat.uses_per_rec as string) || 0,
        mart_abil_req: feat.mart_abil_req as string | undefined,
        char_feat: Boolean(feat.char_feat),
        state_feat: Boolean(feat.state_feat),
      };
    })
  );
}

async function fetchSkills(): Promise<Skill[]> {
  return fetchRTDBData<Skill>('skills', (data) =>
    Object.entries(data).map(([id, s]) => {
      const skill = s as Record<string, unknown>;
      
      // Handle ability - can be string, array, or comma-separated
      let ability = '';
      if (Array.isArray(skill.ability)) {
        ability = (skill.ability as string[]).join(', ');
      } else if (typeof skill.ability === 'string') {
        // Check if it's already comma-separated or needs fixing
        ability = skill.ability;
      }
      
      // Handle base_skill field - now stored as ID (number), 0 means "any base skill"
      const baseSkillRaw = skill.base_skill;
      const baseSkillId = typeof baseSkillRaw === 'number' 
        ? baseSkillRaw 
        : (typeof baseSkillRaw === 'string' && baseSkillRaw !== '' 
            ? parseInt(baseSkillRaw, 10) 
            : undefined);
      
      const category = (skill.category as string) || '';
      
      return {
        id,
        name: (skill.name as string) || '',
        description: (skill.description as string) || '',
        ability,
        category,
        base_skill_id: !isNaN(baseSkillId as number) ? baseSkillId : undefined,
        trained_only: skill.trained_only === true || skill.trained_only === 'true',
      };
    })
  );
}

async function fetchSpecies(): Promise<Species[]> {
  return fetchRTDBData<Species>('species', (data) =>
    Object.entries(data).map(([id, s]) => {
      const species = s as Record<string, unknown>;
      
      // Handle sizes - can be string (comma-separated) or array
      let sizes: string[] = [];
      if (typeof species.sizes === 'string') {
        sizes = species.sizes.split(',').map((sz: string) => sz.trim());
      } else if (Array.isArray(species.sizes)) {
        sizes = species.sizes;
      }
      
      // Get primary size for display
      const primarySize = sizes[0] || 'Medium';
      
      return {
        id,
        name: (species.name as string) || '',
        description: (species.description as string) || '',
        type: (species.type as string) || '', // Species type (Humanoid, Beast, etc.)
        size: primarySize, // Primary size for single-value compatibility
        sizes: sizes, // All available sizes
        speed: parseInt(species.speed as string) || 6,
        traits: toStrArray(species.traits),
        species_traits: toStrArray(species.species_traits),
        ancestry_traits: toStrArray(species.ancestry_traits),
        flaws: toStrArray(species.flaws),
        characteristics: toStrArray(species.characteristics),
        skills: toStrArray(species.skills),
        languages: toStrArray(species.languages),
        ability_bonuses: species.ability_bonuses as Record<string, number> | undefined,
        ave_height: (species.ave_hgt_cm as number) || undefined,
        ave_weight: (species.ave_wgt_kg as number) || undefined,
        adulthood_lifespan: species.adulthood_lifespan as number[] | undefined,
      };
    })
  );
}

async function fetchTraits(): Promise<Trait[]> {
  return fetchRTDBData<Trait>('traits', (data) =>
    Object.entries(data).map(([id, t]) => {
      const trait = t as Record<string, unknown>;
      return {
        id,
        name: (trait.name as string) || '',
        description: (trait.description as string) || '',
        species: toStrArray(trait.species),
      };
    })
  );
}

async function fetchPowerParts(): Promise<PowerPart[]> {
  return fetchRTDBData<PowerPart>('parts', (data) =>
    Object.entries(data)
      .filter(([, p]) => {
        const part = p as Record<string, unknown>;
        return (part.type as string)?.toLowerCase() === 'power';
      })
      .map(([key, p]) => {
        const part = p as Record<string, unknown>;
        // Use the 'id' field from the part data if available, otherwise use the key
        const partId = part.id !== undefined ? String(part.id) : key;
        return {
          id: partId,
          name: (part.name as string) || '',
          description: (part.description as string) || '',
          category: (part.category as string) || '',
          base_en: parseFloat(part.base_en as string) || 0,
          base_tp: parseFloat(part.base_tp as string) || 0,
          op_1_desc: part.op_1_desc as string | undefined,
          op_1_en: parseFloat(part.op_1_en as string) || 0,
          op_1_tp: parseFloat(part.op_1_tp as string) || 0,
          op_2_desc: part.op_2_desc as string | undefined,
          op_2_en: parseFloat(part.op_2_en as string) || 0,
          op_2_tp: parseFloat(part.op_2_tp as string) || 0,
          op_3_desc: part.op_3_desc as string | undefined,
          op_3_en: parseFloat(part.op_3_en as string) || 0,
          op_3_tp: parseFloat(part.op_3_tp as string) || 0,
          // Part type flags for mechanic builder and cost calculations
          mechanic: Boolean(part.mechanic),
          duration: Boolean(part.duration),
          percentage: Boolean(part.percentage),
        };
      })
  );
}

async function fetchTechniqueParts(): Promise<TechniquePart[]> {
  return fetchRTDBData<TechniquePart>('parts', (data) =>
    Object.entries(data)
      .filter(([, p]) => {
        const part = p as Record<string, unknown>;
        return (part.type as string)?.toLowerCase() === 'technique';
      })
      .map(([key, p]) => {
        const part = p as Record<string, unknown>;
        // Use the 'id' field from the part data if available, otherwise use the key
        const partId = part.id !== undefined ? String(part.id) : key;
        return {
          id: partId,
          name: (part.name as string) || '',
          description: (part.description as string) || '',
          category: (part.category as string) || '',
          base_tp: parseFloat(part.base_tp as string) || 0,
          base_stam: parseFloat(part.base_stam as string) || 0,
          base_en: parseFloat(part.base_en as string) || 0,
          op_1_desc: part.op_1_desc as string | undefined,
          op_1_en: parseFloat(part.op_1_en as string) || 0,
          op_1_tp: parseFloat(part.op_1_tp as string) || 0,
          op_2_desc: part.op_2_desc as string | undefined,
          op_2_en: parseFloat(part.op_2_en as string) || 0,
          op_2_tp: parseFloat(part.op_2_tp as string) || 0,
          op_3_desc: part.op_3_desc as string | undefined,
          op_3_en: parseFloat(part.op_3_en as string) || 0,
          op_3_tp: parseFloat(part.op_3_tp as string) || 0,
          // Part type flags for mechanic builder and cost calculations
          percentage: Boolean(part.percentage),
          mechanic: Boolean(part.mechanic),
        };
      })
  );
}

/** Fetch ALL parts (both power and technique) for Codex Parts tab */
async function fetchParts(): Promise<Part[]> {
  return fetchRTDBData<Part>('parts', (data) =>
    Object.entries(data).map(([key, p]) => {
      const part = p as Record<string, unknown>;
      // Use the 'id' field from the part data if available, otherwise use the key
      const partId = part.id !== undefined ? String(part.id) : key;
      return {
        id: partId,
        name: (part.name as string) || '',
        description: (part.description as string) || '',
        category: (part.category as string) || '',
        type: ((part.type as string)?.toLowerCase() || 'power') as 'power' | 'technique',
        base_en: parseFloat(part.base_en as string) || 0,
        base_tp: parseFloat(part.base_tp as string) || 0,
        op_1_desc: part.op_1_desc as string | undefined,
        op_1_en: parseFloat(part.op_1_en as string) || 0,
        op_1_tp: parseFloat(part.op_1_tp as string) || 0,
        op_2_desc: part.op_2_desc as string | undefined,
        op_2_en: parseFloat(part.op_2_en as string) || 0,
        op_2_tp: parseFloat(part.op_2_tp as string) || 0,
        op_3_desc: part.op_3_desc as string | undefined,
        op_3_en: parseFloat(part.op_3_en as string) || 0,
        op_3_tp: parseFloat(part.op_3_tp as string) || 0,
        percentage: part.percentage === true || part.percentage === 'true',
        mechanic: part.mechanic === true || part.mechanic === 'true',
      };
    })
  );
}

async function fetchItemProperties(): Promise<ItemProperty[]> {
  return fetchRTDBData<ItemProperty>('properties', (data) =>
    Object.entries(data).map(([key, p]) => {
      const prop = p as Record<string, unknown>;
      // Use the 'id' field from the property data if available, otherwise use the key
      const propId = prop.id !== undefined ? String(prop.id) : key;
      return {
        id: propId,
        name: (prop.name as string) || '',
        description: (prop.description as string) || '',
        type: ((prop.type as string) || 'general') as 'weapon' | 'armor' | 'shield' | 'general',
        // Legacy fields
        tp_cost: parseFloat(prop.tp_cost as string) || 0,
        gold_cost: parseFloat(prop.gold_cost as string) || 0,
        // New standardized fields matching power/technique parts
        base_ip: parseFloat(prop.base_ip as string) || 0,
        base_tp: parseFloat(prop.base_tp as string) || 0,
        base_c: parseFloat(prop.base_c as string) || 0,
        op_1_desc: prop.op_1_desc as string | undefined,
        op_1_ip: parseFloat(prop.op_1_ip as string) || 0,
        op_1_tp: parseFloat(prop.op_1_tp as string) || 0,
        op_1_c: parseFloat(prop.op_1_c as string) || 0,
      };
    })
  );
}

async function fetchEquipment(): Promise<EquipmentItem[]> {
  // Note: RTDB uses 'items' path for equipment data
  return fetchRTDBData<EquipmentItem>('items', (data) =>
    Object.entries(data).map(([key, e]) => {
      const equip = e as Record<string, unknown>;
      // Use the 'id' field from the equipment data if available, otherwise use the key
      const equipId = equip.id !== undefined ? String(equip.id) : key;
      return {
        id: equipId,
        name: (equip.name as string) || '',
        type: ((equip.type as string) || 'equipment') as 'weapon' | 'armor' | 'equipment',
        subtype: equip.subtype as string | undefined,
        category: (equip.category as string) || undefined,
        description: (equip.description as string) || '',
        damage: equip.damage as string | undefined,
        armor_value: parseInt(equip.armor_value as string) || undefined,
        gold_cost: parseFloat(equip.gold_cost as string) || 0,
        currency: parseFloat(equip.currency as string) || parseFloat(equip.gold_cost as string) || 0,
        properties: toStrArray(equip.properties),
        rarity: equip.rarity as string | undefined,
        weight: parseFloat(equip.weight as string) || undefined,
      };
    })
  );
}

// =============================================================================
// React Query Hooks
// =============================================================================

const DEFAULT_OPTIONS = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
  retry: 2,
  refetchOnWindowFocus: false,
};

export function useFeats(): UseQueryResult<Feat[], Error> {
  return useQuery({
    queryKey: ['feats'],
    queryFn: fetchFeats,
    ...DEFAULT_OPTIONS,
  });
}

export function useSkills(): UseQueryResult<Skill[], Error> {
  return useQuery({
    queryKey: ['skills'],
    queryFn: fetchSkills,
    ...DEFAULT_OPTIONS,
  });
}

export function useSpecies(): UseQueryResult<Species[], Error> {
  return useQuery({
    queryKey: ['species'],
    queryFn: fetchSpecies,
    ...DEFAULT_OPTIONS,
  });
}

export function useTraits(): UseQueryResult<Trait[], Error> {
  return useQuery({
    queryKey: ['traits'],
    queryFn: fetchTraits,
    ...DEFAULT_OPTIONS,
  });
}

export function usePowerParts(): UseQueryResult<PowerPart[], Error> {
  return useQuery({
    queryKey: ['power-parts'],
    queryFn: fetchPowerParts,
    ...DEFAULT_OPTIONS,
  });
}

export function useTechniqueParts(): UseQueryResult<TechniquePart[], Error> {
  return useQuery({
    queryKey: ['technique-parts'],
    queryFn: fetchTechniqueParts,
    ...DEFAULT_OPTIONS,
  });
}

export function useParts(): UseQueryResult<Part[], Error> {
  return useQuery({
    queryKey: ['all-parts'],
    queryFn: fetchParts,
    ...DEFAULT_OPTIONS,
  });
}

export function useItemProperties(): UseQueryResult<ItemProperty[], Error> {
  return useQuery({
    queryKey: ['item-properties'],
    queryFn: fetchItemProperties,
    ...DEFAULT_OPTIONS,
  });
}

export function useEquipment(): UseQueryResult<EquipmentItem[], Error> {
  return useQuery({
    queryKey: ['equipment'],
    queryFn: fetchEquipment,
    ...DEFAULT_OPTIONS,
  });
}

// =============================================================================
// Creature Feats
// =============================================================================

export interface CreatureFeat {
  id: string;
  name: string;
  description: string;
  points: number; // Cost in feat points (negative = gives points back)
  tiers?: number; // Number of levels/tiers if applicable
  prereqs?: string[];
}

async function fetchCreatureFeats(): Promise<CreatureFeat[]> {
  return fetchWithRetry(async () => {
    const snapshot = await get(ref(rtdb, 'creature_feats'));
    if (!snapshot.exists()) {
      console.warn('[rtdb] No creature_feats data found');
      return [];
    }
    const raw = snapshot.val();
    // Handle array or object format - preserve keys/indices for ID fallback
    const entries: [string, Record<string, unknown>][] = Array.isArray(raw)
      ? raw.map((item, idx) => [String(idx), item])
      : Object.entries(raw);
    
    return entries
      .filter(([, feat]) => feat != null)
      .map(([key, feat]) => ({
        // Use feat.id if present, otherwise use the array index/object key
        id: String(feat.id ?? key),
        name: String(feat.name ?? ''),
        description: String(feat.description ?? ''),
        points: Number(feat.feat_points ?? feat.points ?? feat.cost ?? 0),
        tiers: feat.tiers ? Number(feat.tiers) : undefined,
        prereqs: toStrArray(feat.prereqs),
      }));
  });
}

export function useCreatureFeats(): UseQueryResult<CreatureFeat[], Error> {
  return useQuery({
    queryKey: ['creature-feats'],
    queryFn: fetchCreatureFeats,
    ...DEFAULT_OPTIONS,
  });
}

// =============================================================================
// Trait Resolution Utilities
// =============================================================================

/**
 * Find a trait by ID or name in a collection
 * Used for resolving trait IDs from species to full trait objects
 */
export function findTraitByIdOrName(
  traits: Trait[],
  lookup: string | number
): Trait | undefined {
  if (!traits || !lookup) return undefined;
  
  const lookupStr = String(lookup);
  
  // Try exact ID match first
  const byId = traits.find(t => t.id === lookupStr);
  if (byId) return byId;
  
  // Try numeric ID match (in case of type mismatch)
  const byNumericId = traits.find(t => String(t.id) === lookupStr);
  if (byNumericId) return byNumericId;
  
  // Try case-insensitive name match
  const lowerLookup = lookupStr.toLowerCase();
  const byName = traits.find(t => t.name.toLowerCase() === lowerLookup);
  if (byName) return byName;
  
  // Try sanitized ID match (convert "Trait Name" to "trait_name" or "trait-name")
  const sanitizedLookup = lookupStr.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '');
  const bySanitizedId = traits.find(t => t.id === sanitizedLookup || t.id === sanitizedLookup.replace(/_/g, '-'));
  if (bySanitizedId) return bySanitizedId;
  
  // Try matching sanitized name to ID
  const bySanitizedName = traits.find(t => {
    const sanitizedName = t.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '');
    return sanitizedName === sanitizedLookup || sanitizedName === lowerLookup;
  });
  return bySanitizedName;
}

/**
 * Resolve an array of trait IDs to full trait objects
 */
export function resolveTraitIds(
  traitIds: (string | number)[],
  allTraits: Trait[]
): Trait[] {
  if (!traitIds || !allTraits) return [];
  
  return traitIds.map(id => {
    const trait = findTraitByIdOrName(allTraits, id);
    return trait || {
      id: String(id),
      name: String(id),
      description: 'Trait not found',
    };
  });
}

/**
 * Hook to resolve trait IDs to full trait objects
 * Automatically fetches all traits and resolves the given IDs
 */
export function useResolvedTraits(traitIds: (string | number)[]): {
  traits: Trait[];
  isLoading: boolean;
  error: Error | null;
} {
  const { data: allTraits, isLoading, error } = useCodexTraits();
  
  const resolvedTraits = useMemo(() => {
    if (!allTraits || !traitIds) return [];
    return resolveTraitIds(traitIds, allTraits);
  }, [allTraits, traitIds]);
  
  return {
    traits: resolvedTraits,
    isLoading,
    error: error || null,
  };
}

// =============================================================================
// Skill ID Resolution Utilities
// =============================================================================

/**
 * Build a map from skill ID to skill name for quick lookups
 */
export function buildSkillIdToNameMap(skills: Skill[]): Map<string, string> {
  return new Map(skills.map(s => [s.id, s.name]));
}

/**
 * Resolve skill IDs to skill names
 * @param skillIds Array of skill IDs (strings or numbers)
 * @param allSkills Full list of skills to search
 * @returns Array of skill names (preserving order)
 */
export function resolveSkillIdsToNames(
  skillIds: (string | number)[],
  allSkills: Skill[]
): string[] {
  const skillMap = buildSkillIdToNameMap(allSkills);
  return skillIds.map(id => skillMap.get(String(id)) || String(id));
}

/**
 * Hook to get a skill ID to name lookup map
 * Useful for components that need to display skill names from IDs
 */
export function useSkillIdToNameMap(): {
  skillIdToName: Map<string, string>;
  isLoading: boolean;
  error: Error | null;
} {
  const { data: skills, isLoading, error } = useCodexSkills();
  
  const skillIdToName = useMemo(() => {
    if (!skills) return new Map<string, string>();
    return buildSkillIdToNameMap(skills);
  }, [skills]);
  
  return {
    skillIdToName,
    isLoading,
    error: error || null,
  };
}

/**
 * Hook to resolve an array of skill IDs to names
 * Automatically fetches skills and resolves the given IDs
 */
export function useResolvedSkillNames(skillIds: (string | number)[]): {
  skillNames: string[];
  isLoading: boolean;
  error: Error | null;
} {
  const { data: skills, isLoading, error } = useCodexSkills();
  
  const skillNames = useMemo(() => {
    if (!skills || !skillIds?.length) return [];
    return resolveSkillIdsToNames(skillIds, skills);
  }, [skills, skillIds]);
  
  return {
    skillNames,
    isLoading,
    error: error || null,
  };
}

// =============================================================================
// Prefetch Functions (for SSR or preloading — now from Firestore)
// =============================================================================

export { prefetchFunctions } from './use-firestore-codex';
