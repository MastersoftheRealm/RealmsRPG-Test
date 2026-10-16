import type { CreatorLibraryType } from '@/hooks/use-creator-save';

/** Same copy as `useCreatorSave` when Save is clicked with an empty name. */
export function creatorMissingNameMessage(type: CreatorLibraryType): string {
  return `Please enter a ${type === 'species' ? 'species' : type.slice(0, -1)} name`;
}

/** Toolbar hint when Save is disabled because the name field is empty. */
export function creatorMissingNameSaveDisabledReason(
  name: string,
  type: CreatorLibraryType,
): string | null {
  return name.trim() ? null : creatorMissingNameMessage(type);
}
