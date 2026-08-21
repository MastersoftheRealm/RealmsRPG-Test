/**
 * Admin Archetypes — form mutators (TASK-617)
 */

import type { Dispatch, SetStateAction } from 'react';
import { LAYER1_GOVERNANCE } from '@/lib/constants/creator-layer-governance';
import { filterFeatGuidanceGroups, resolvePathGuidanceAudience } from '@/lib/game/archetype-path';
import type { PathGuidanceAudience, PathGuidanceGroup } from '@/types/archetype';
import { newFeatGuidanceGroup, type AdminArchetypeFormState } from './admin-archetype-path-form';

export function createFeatGuidanceMutators(
  setForm: Dispatch<SetStateAction<AdminArchetypeFormState>>,
  showToast: (message: string, variant: 'warning' | 'error' | 'success') => void,
) {
  const updateFeatGuidanceGroup = (
    groupId: string,
    patch: Partial<Pick<PathGuidanceGroup, 'title' | 'why' | 'feats'>>,
  ) => {
    setForm((prev) => ({
      ...prev,
      guidanceGroups: prev.guidanceGroups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              ...patch,
              audience: resolvePathGuidanceAudience(g),
            }
          : g,
      ),
    }));
  };

  const addFeatGuidanceGroup = (audience: PathGuidanceAudience) => {
    setForm((prev) => {
      const current = filterFeatGuidanceGroups(prev.guidanceGroups, audience);
      if (current.length >= LAYER1_GOVERNANCE.maxGroupsPerStep) {
        showToast(
          `At most ${LAYER1_GOVERNANCE.maxGroupsPerStep} ${audience} feat groups (Layer 1 governance).`,
          'warning',
        );
        return prev;
      }
      return {
        ...prev,
        guidanceGroups: [...prev.guidanceGroups, newFeatGuidanceGroup(audience)],
      };
    });
  };

  const removeFeatGuidanceGroup = (groupId: string) => {
    setForm((prev) => ({
      ...prev,
      guidanceGroups: prev.guidanceGroups.filter((g) => g.id !== groupId),
    }));
  };

  return { updateFeatGuidanceGroup, addFeatGuidanceGroup, removeFeatGuidanceGroup };
}

export function createLevel1ArmamentMutators(
  setForm: Dispatch<SetStateAction<AdminArchetypeFormState>>,
) {
  const addLevel1Armament = (value: string) => {
    setForm((prev) => {
      if (prev.level1Path.armamentEntries.some((e) => e.id === value)) return prev;
      return {
        ...prev,
        level1Path: {
          ...prev.level1Path,
          armamentEntries: [...prev.level1Path.armamentEntries, { id: value, quantity: 1 }],
        },
      };
    });
  };

  const updateLevel1ArmamentQty = (id: string, quantity: number) => {
    setForm((prev) => ({
      ...prev,
      level1Path: {
        ...prev.level1Path,
        armamentEntries: prev.level1Path.armamentEntries.map((e) =>
          e.id === id ? { ...e, quantity } : e,
        ),
      },
    }));
  };

  const removeLevel1Armament = (id: string) => {
    setForm((prev) => ({
      ...prev,
      level1Path: {
        ...prev.level1Path,
        armamentEntries: prev.level1Path.armamentEntries.filter((e) => e.id !== id),
      },
    }));
  };

  return { addLevel1Armament, updateLevel1ArmamentQty, removeLevel1Armament };
}
