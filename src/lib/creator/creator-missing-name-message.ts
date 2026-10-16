import type { CreatorLibraryType } from '@/hooks/use-creator-save';
import { indefiniteArticle } from '@/lib/utils/string';

function creatorEntityNoun(type: CreatorLibraryType): string {
  return type === 'species' ? 'species' : type.slice(0, -1);
}

/** Same copy as `useCreatorSave` when Save is clicked with an empty name. */
export function creatorMissingNameMessage(type: CreatorLibraryType): string {
  const noun = creatorEntityNoun(type);
  return `Please enter ${indefiniteArticle(noun)} ${noun} name`;
}

/** Toolbar hint when Save is disabled because the name field is empty. */
export function creatorMissingNameSaveDisabledReason(
  name: string,
  type: CreatorLibraryType,
): string | null {
  return name.trim() ? null : creatorMissingNameMessage(type);
}
