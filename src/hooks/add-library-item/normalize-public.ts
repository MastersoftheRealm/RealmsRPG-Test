import type { UserItem, UserPower, UserTechnique, LibraryPower, LibraryTechnique, LibraryItem } from '@/types/library';
import type { EqItem } from './types';

export function normalizePublicPower(p: LibraryPower): UserPower {
  return p;
}

export function normalizePublicTechnique(t: LibraryTechnique): UserTechnique {
  const weaponName =
    typeof (t as LibraryTechnique & { weaponName?: string }).weaponName === 'string'
      ? (t as LibraryTechnique & { weaponName?: string }).weaponName
      : undefined;
  return {
    ...t,
    docId: t.docId || t.id,
    weapon: t.weapon ?? (weaponName ? { name: weaponName } : undefined),
    isReaction: t.isReaction ?? false,
  };
}

export function normalizePublicItem(i: LibraryItem): UserItem | EqItem {
  return i;
}
