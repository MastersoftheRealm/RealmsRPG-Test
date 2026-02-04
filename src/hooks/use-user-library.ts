/**
 * User Library Hooks
 * ===================
 * React Query hooks for fetching user-specific library data from Firestore
 * (powers, techniques, items/armaments, creatures)
 */

'use client';

import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { collection, getDocs, doc, deleteDoc, addDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuthStore } from '@/stores/auth-store';

// =============================================================================
// Types
// =============================================================================

// Part with option levels as saved to Firestore
export interface SavedPart {
  id?: number;
  name?: string;
  op_1_lvl?: number;
  op_2_lvl?: number;
  op_3_lvl?: number;
  applyDuration?: boolean;
}

// Damage entry as saved to Firestore
export interface SavedDamage {
  amount?: number | string;
  size?: number | string;
  type?: string;
  applyDuration?: boolean;
}

export interface UserPower {
  id: string;
  docId: string;
  name: string;
  description?: string;
  parts: SavedPart[];
  damage?: SavedDamage[];
  // Directly saved fields from power creator
  actionType?: string;
  isReaction?: boolean;
  range?: {
    steps?: number;
    applyDuration?: boolean;
  };
  area?: {
    type?: string;
    level?: number;
    applyDuration?: boolean;
  };
  duration?: {
    type?: string;
    value?: number;
    focus?: boolean;
    noHarm?: boolean;
    endsOnActivation?: boolean;
    sustain?: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserTechnique {
  id: string;
  docId: string;
  name: string;
  description?: string;
  parts: SavedPart[];
  damage?: SavedDamage[];
  weapon?: {
    id?: number;
    name?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SavedProperty {
  id?: number;
  name?: string;
  op_1_lvl?: number;
}

export interface UserItem {
  id: string;
  docId: string;
  name: string;
  description?: string;
  type: 'weapon' | 'armor' | 'equipment' | 'shield';
  properties: SavedProperty[];
  damage?: SavedDamage[];
  // Weapon-specific fields
  isTwoHanded?: boolean;
  rangeLevel?: number;
  abilityRequirement?: {
    id?: string;
    name?: string;
    level?: number;
  };
  // Armor-specific fields
  damageReduction?: number;
  agilityReduction?: number;
  criticalRangeIncrease?: number;
  // Shield-specific fields
  shieldDR?: { amount: number; size: number };
  hasShieldDamage?: boolean;
  shieldDamage?: { amount: number; size: number };
  // Computed costs and rarity
  costs?: {
    totalTP?: number;
    totalCurrency?: number;
    totalIP?: number;
  };
  rarity?: string;
  armorValue?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreature {
  id: string;
  docId: string;
  name: string;
  description?: string;
  level: number;
  type?: string;
  size?: string;
  // Core stats
  hitPoints?: number;
  energyPoints?: number;
  abilities?: Record<string, number>;
  defenses?: Record<string, number>;
  // Proficiencies
  powerProficiency?: number;
  martialProficiency?: number;
  // Damage modifiers
  resistances?: string[];
  weaknesses?: string[];
  immunities?: string[];
  conditionImmunities?: string[];
  // Movement and senses
  senses?: string[];
  movementTypes?: string[];
  languages?: string[];
  // Skills
  skills?: Array<{ name: string; value: number; proficient?: boolean }>;
  // Combat
  powers?: Array<{ name: string; description?: string }>;
  techniques?: Array<{ name: string; description?: string }>;
  feats?: Array<{ name: string; description?: string }>;
  armaments?: Array<{ name: string }>;
  // Deprecated - kept for backwards compatibility
  hp?: number;
  attacks?: unknown[];
  createdAt?: Date;
  updatedAt?: Date;
}

// =============================================================================
// Query Keys
// =============================================================================

const QUERY_KEYS = {
  userPowers: (userId: string) => ['user-powers', userId] as const,
  userTechniques: (userId: string) => ['user-techniques', userId] as const,
  userItems: (userId: string) => ['user-items', userId] as const,
  userCreatures: (userId: string) => ['user-creatures', userId] as const,
};

// =============================================================================
// Fetch Functions
// =============================================================================

async function fetchUserPowers(userId: string): Promise<UserPower[]> {
  if (!userId) return [];
  
  const colRef = collection(db, 'users', userId, 'library');
  const q = query(colRef, orderBy('name'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    docId: doc.id,
    ...doc.data(),
  })) as UserPower[];
}

async function fetchUserTechniques(userId: string): Promise<UserTechnique[]> {
  if (!userId) return [];
  
  const colRef = collection(db, 'users', userId, 'techniqueLibrary');
  const q = query(colRef, orderBy('name'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    docId: doc.id,
    ...doc.data(),
  })) as UserTechnique[];
}

async function fetchUserItems(userId: string): Promise<UserItem[]> {
  if (!userId) return [];
  
  const colRef = collection(db, 'users', userId, 'itemLibrary');
  const q = query(colRef, orderBy('name'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    docId: doc.id,
    ...doc.data(),
  })) as UserItem[];
}

async function fetchUserCreatures(userId: string): Promise<UserCreature[]> {
  if (!userId) return [];
  
  const colRef = collection(db, 'users', userId, 'creatureLibrary');
  const q = query(colRef, orderBy('name'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    docId: doc.id,
    ...doc.data(),
  })) as UserCreature[];
}

// =============================================================================
// Hooks
// =============================================================================

export function useUserPowers(): UseQueryResult<UserPower[], Error> {
  const { user } = useAuthStore();
  const userId = user?.uid || '';
  
  return useQuery({
    queryKey: QUERY_KEYS.userPowers(userId),
    queryFn: () => fetchUserPowers(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useUserTechniques(): UseQueryResult<UserTechnique[], Error> {
  const { user } = useAuthStore();
  const userId = user?.uid || '';
  
  return useQuery({
    queryKey: QUERY_KEYS.userTechniques(userId),
    queryFn: () => fetchUserTechniques(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useUserItems(): UseQueryResult<UserItem[], Error> {
  const { user } = useAuthStore();
  const userId = user?.uid || '';
  
  return useQuery({
    queryKey: QUERY_KEYS.userItems(userId),
    queryFn: () => fetchUserItems(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useUserCreatures(): UseQueryResult<UserCreature[], Error> {
  const { user } = useAuthStore();
  const userId = user?.uid || '';
  
  return useQuery({
    queryKey: QUERY_KEYS.userCreatures(userId),
    queryFn: () => fetchUserCreatures(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// =============================================================================
// Mutations
// =============================================================================

export function useDeletePower(): UseMutationResult<void, Error, string> {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (docId: string) => {
      if (!user?.uid) throw new Error('Not authenticated');
      await deleteDoc(doc(db, 'users', user.uid, 'library', docId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.userPowers(user?.uid || '') 
      });
    },
  });
}

export function useDeleteTechnique(): UseMutationResult<void, Error, string> {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (docId: string) => {
      if (!user?.uid) throw new Error('Not authenticated');
      await deleteDoc(doc(db, 'users', user.uid, 'techniqueLibrary', docId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.userTechniques(user?.uid || '') 
      });
    },
  });
}

export function useDeleteItem(): UseMutationResult<void, Error, string> {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (docId: string) => {
      if (!user?.uid) throw new Error('Not authenticated');
      await deleteDoc(doc(db, 'users', user.uid, 'itemLibrary', docId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.userItems(user?.uid || '') 
      });
    },
  });
}

export function useDeleteCreature(): UseMutationResult<void, Error, string> {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (docId: string) => {
      if (!user?.uid) throw new Error('Not authenticated');
      await deleteDoc(doc(db, 'users', user.uid, 'creatureLibrary', docId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.userCreatures(user?.uid || '') 
      });
    },
  });
}

// =============================================================================
// Duplicate Mutations
// =============================================================================

// Helper to generate unique duplicate name with (x) suffix
function generateDuplicateName(baseName: string, existingNames: string[]): string {
  // Remove any existing (x) suffix to get base name
  const cleanName = baseName.replace(/\s*\(\d+\)$/, '').trim();
  
  // Find all existing copies with same base name
  let counter = 1;
  let newName = `${cleanName} (${counter})`;
  
  while (existingNames.includes(newName)) {
    counter++;
    newName = `${cleanName} (${counter})`;
  }
  
  return newName;
}

export function useDuplicatePower(): UseMutationResult<string, Error, string> {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (docId: string) => {
      if (!user?.uid) throw new Error('Not authenticated');
      
      const colRef = collection(db, 'users', user.uid, 'library');
      const snapshot = await getDocs(colRef);
      
      // Find the original power
      const originalDoc = snapshot.docs.find(d => d.id === docId);
      if (!originalDoc) throw new Error('Power not found');
      
      const originalData = originalDoc.data();
      const existingNames = snapshot.docs.map(d => d.data().name || '');
      
      // Create duplicate with new name
      const newPower = {
        ...originalData,
        name: generateDuplicateName(originalData.name || 'Power', existingNames),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const newDocRef = await addDoc(colRef, newPower);
      return newDocRef.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.userPowers(user?.uid || '') 
      });
    },
  });
}

export function useDuplicateTechnique(): UseMutationResult<string, Error, string> {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (docId: string) => {
      if (!user?.uid) throw new Error('Not authenticated');
      
      const colRef = collection(db, 'users', user.uid, 'techniqueLibrary');
      const snapshot = await getDocs(colRef);
      
      // Find the original technique
      const originalDoc = snapshot.docs.find(d => d.id === docId);
      if (!originalDoc) throw new Error('Technique not found');
      
      const originalData = originalDoc.data();
      const existingNames = snapshot.docs.map(d => d.data().name || '');
      
      // Create duplicate with new name
      const newTechnique = {
        ...originalData,
        name: generateDuplicateName(originalData.name || 'Technique', existingNames),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const newDocRef = await addDoc(colRef, newTechnique);
      return newDocRef.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.userTechniques(user?.uid || '') 
      });
    },
  });
}

export function useDuplicateItem(): UseMutationResult<string, Error, string> {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (docId: string) => {
      if (!user?.uid) throw new Error('Not authenticated');
      
      const colRef = collection(db, 'users', user.uid, 'itemLibrary');
      const snapshot = await getDocs(colRef);
      
      // Find the original item
      const originalDoc = snapshot.docs.find(d => d.id === docId);
      if (!originalDoc) throw new Error('Item not found');
      
      const originalData = originalDoc.data();
      const existingNames = snapshot.docs.map(d => d.data().name || '');
      
      // Create duplicate with new name
      const newItem = {
        ...originalData,
        name: generateDuplicateName(originalData.name || 'Item', existingNames),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const newDocRef = await addDoc(colRef, newItem);
      return newDocRef.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.userItems(user?.uid || '') 
      });
    },
  });
}

export function useDuplicateCreature(): UseMutationResult<string, Error, string> {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (docId: string) => {
      if (!user?.uid) throw new Error('Not authenticated');
      
      const colRef = collection(db, 'users', user.uid, 'creatureLibrary');
      const snapshot = await getDocs(colRef);
      
      // Find the original creature
      const originalDoc = snapshot.docs.find(d => d.id === docId);
      if (!originalDoc) throw new Error('Creature not found');
      
      const originalData = originalDoc.data();
      const existingNames = snapshot.docs.map(d => d.data().name || '');
      
      // Create duplicate with new name
      const newCreature = {
        ...originalData,
        name: generateDuplicateName(originalData.name || 'Creature', existingNames),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const newDocRef = await addDoc(colRef, newCreature);
      return newDocRef.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.userCreatures(user?.uid || '') 
      });
    },
  });
}
