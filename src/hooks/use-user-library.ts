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
  type: 'weapon' | 'armor' | 'equipment';
  properties: SavedProperty[];
  damage?: string;
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
