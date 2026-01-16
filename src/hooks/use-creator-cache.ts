/**
 * Creator Cache Hook
 * ==================
 * Provides localStorage-based caching for creator pages
 * Allows users to work on creations without being logged in,
 * and preserves their progress across sessions.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

const CACHE_PREFIX = 'realms-creator-';

export type CreatorType = 
  | 'power' 
  | 'technique' 
  | 'item' 
  | 'creature' 
  | 'encounter' 
  | 'character';

interface CacheState<T> {
  data: T;
  timestamp: number;
}

/**
 * Hook for caching creator state in localStorage
 * @param creatorType - The type of creator (power, technique, etc.)
 * @param initialState - The initial state to use if no cache exists
 * @returns [state, setState, clearCache, hasCache]
 */
export function useCreatorCache<T>(
  creatorType: CreatorType,
  initialState: T
): [T, (value: T | ((prev: T) => T)) => void, () => void, boolean] {
  const storageKey = `${CACHE_PREFIX}${creatorType}`;
  const [hasCache, setHasCache] = useState(false);
  const [state, setStateInternal] = useState<T>(initialState);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cached state on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsed: CacheState<T> = JSON.parse(cached);
        // Only use cache if it's less than 30 days old
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        if (Date.now() - parsed.timestamp < thirtyDays) {
          setStateInternal(parsed.data);
          setHasCache(true);
        } else {
          localStorage.removeItem(storageKey);
        }
      }
    } catch (e) {
      console.error(`Failed to load ${creatorType} cache:`, e);
    }
    setIsInitialized(true);
  }, [storageKey, creatorType]);

  // Auto-save to localStorage when state changes
  useEffect(() => {
    if (!isInitialized) return;
    
    try {
      const cacheState: CacheState<T> = {
        data: state,
        timestamp: Date.now(),
      };
      localStorage.setItem(storageKey, JSON.stringify(cacheState));
      setHasCache(true);
    } catch (e) {
      console.error(`Failed to save ${creatorType} cache:`, e);
    }
  }, [state, storageKey, creatorType, isInitialized]);

  // Wrapper for setState that also updates cache
  const setState = useCallback((value: T | ((prev: T) => T)) => {
    setStateInternal(value);
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setHasCache(false);
      setStateInternal(initialState);
    } catch (e) {
      console.error(`Failed to clear ${creatorType} cache:`, e);
    }
  }, [storageKey, creatorType, initialState]);

  return [state, setState, clearCache, hasCache];
}

/**
 * Hook for individual cached values within a creator
 * Useful when you need to cache multiple separate pieces of state
 */
export function useCreatorCacheValue<T>(
  creatorType: CreatorType,
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const storageKey = `${CACHE_PREFIX}${creatorType}-${key}`;
  const [value, setValueInternal] = useState<T>(initialValue);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cached value on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        setValueInternal(JSON.parse(cached));
      }
    } catch (e) {
      console.error(`Failed to load ${creatorType}/${key} cache:`, e);
    }
    setIsInitialized(true);
  }, [storageKey, creatorType, key]);

  // Auto-save to localStorage when value changes
  useEffect(() => {
    if (!isInitialized) return;
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to save ${creatorType}/${key} cache:`, e);
    }
  }, [value, storageKey, creatorType, key, isInitialized]);

  const setValue = useCallback((newValue: T | ((prev: T) => T)) => {
    setValueInternal(newValue);
  }, []);

  return [value, setValue];
}

/**
 * Clear all creator caches
 */
export function clearAllCreatorCaches() {
  try {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(CACHE_PREFIX));
    keys.forEach(key => localStorage.removeItem(key));
  } catch (e) {
    console.error('Failed to clear all creator caches:', e);
  }
}

/**
 * Get cache info for a specific creator
 */
export function getCreatorCacheInfo(creatorType: CreatorType): { exists: boolean; timestamp?: number } {
  try {
    const storageKey = `${CACHE_PREFIX}${creatorType}`;
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      const parsed: CacheState<unknown> = JSON.parse(cached);
      return { exists: true, timestamp: parsed.timestamp };
    }
  } catch (e) {
    console.error(`Failed to get ${creatorType} cache info:`, e);
  }
  return { exists: false };
}
