/**
 * useCreatorLoad — Unified load-from-library state and data for creators
 * =========================================================================
 * Encapsulates "fetch library, modal visibility" for power, technique, and item
 * creators. Type-specific "onSelect → reset + restore mechanics + restore list"
 * remains in each creator (see AGENT_GUIDE Creator load logic).
 */

'use client';

import { useState, useCallback } from 'react';
import { useUserPowers } from './use-user-library';
import { useUserTechniques } from './use-user-library';
import { useUserItems } from './use-user-library';

export type CreatorLoadType = 'powers' | 'techniques' | 'items';

export interface UseCreatorLoadReturn<T = unknown> {
  showLoadModal: boolean;
  setShowLoadModal: (show: boolean) => void;
  openLoadModal: () => void;
  closeLoadModal: () => void;
  items: T[];
  isLoading: boolean;
  error: Error | null;
}

export function useCreatorLoad(type: 'powers'): UseCreatorLoadReturn;
export function useCreatorLoad(type: 'techniques'): UseCreatorLoadReturn;
export function useCreatorLoad(type: 'items'): UseCreatorLoadReturn;
export function useCreatorLoad(type: CreatorLoadType): UseCreatorLoadReturn {
  const [showLoadModal, setShowLoadModal] = useState(false);

  const powers = useUserPowers();
  const techniques = useUserTechniques();
  const items = useUserItems();

  const openLoadModal = useCallback(() => setShowLoadModal(true), []);
  const closeLoadModal = useCallback(() => setShowLoadModal(false), []);

  if (type === 'powers') {
    return {
      showLoadModal,
      setShowLoadModal,
      openLoadModal,
      closeLoadModal,
      items: powers.data ?? [],
      isLoading: powers.isLoading,
      error: powers.error ?? null,
    };
  }
  if (type === 'techniques') {
    return {
      showLoadModal,
      setShowLoadModal,
      openLoadModal,
      closeLoadModal,
      items: techniques.data ?? [],
      isLoading: techniques.isLoading,
      error: techniques.error ?? null,
    };
  }
  return {
    showLoadModal,
    setShowLoadModal,
    openLoadModal,
    closeLoadModal,
    items: items.data ?? [],
    isLoading: items.isLoading,
    error: items.error ?? null,
  };
}
