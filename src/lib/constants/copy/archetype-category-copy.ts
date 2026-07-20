/**
 * Archetype category marketing copy (Power / Powered-Martial / Martial).
 * Owner-approved fantasy voice (TASK-599 option B — Advanced creator wording).
 * Titles are stable product terms; descriptions are selection marketing prose.
 */

import type { ArchetypeCategory } from '@/types';

export type ArchetypeCategoryInfo = {
  title: string;
  description: string;
};

/** Canonical title + description for each archetype category. */
export const ARCHETYPE_CATEGORY_INFO: Record<ArchetypeCategory, ArchetypeCategoryInfo> = {
  power: {
    title: 'Power',
    description:
      'Focus on supernatural, magical, or extraordinary abilities. You excel at manipulating energy and casting powerful effects.',
  },
  'powered-martial': {
    title: 'Powered-Martial',
    description:
      'A balanced blend of martial prowess and supernatural abilities. You can fight effectively while also wielding power.',
  },
  martial: {
    title: 'Martial',
    description:
      'Master of physical combat and martial techniques. You rely on skill, training, and physical prowess.',
  },
};
