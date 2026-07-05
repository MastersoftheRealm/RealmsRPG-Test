import type { UserItem, UserPower, UserTechnique, LibraryPower, LibraryTechnique, LibraryItem } from '@/types/library';
import type { EqItem } from './types';

export function normalizePublicPower(p: LibraryPower): UserPower {
  return p;
}

export function normalizePublicTechnique(t: LibraryTechnique): UserTechnique {
  return { ...t, docId: t.docId || t.id, isReaction: t.isReaction ?? false };
}

export function normalizePublicItem(i: LibraryItem): UserItem | EqItem {
  return i;
}
