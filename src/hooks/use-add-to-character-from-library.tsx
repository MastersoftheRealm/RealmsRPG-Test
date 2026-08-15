'use client';

/**
 * Add a library power/technique/armament row directly to a filtered character (Library browse).
 * Confirm modal + save + auto-proficiency apply — mirrors sheet add-library handlers.
 * PATCH sends updatedAt and re-applies the add on 409 (ADR-0013 / TASK-746).
 */

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { ConfirmActionModal } from '@/components/shared';
import { useToast } from '@/components/ui';
import {
  computeAutoProficiencies,
  deferProficiencyOverLimitToast,
} from '@/components/character-sheet/use-sheet-auto-proficiencies';
import { getErrorMessage } from '@/lib/api-client';
import { buildRequiredProficiencies } from '@/lib/proficiencies';
import type { Character, Item } from '@/types';
import { useCodexItemProperties, useCodexPowerParts, useCodexTechniqueParts } from './use-codex';
import { useCharacter, useSaveCharacter } from './use-characters';
import {
  appendLibraryItemToCharacter,
  characterOwnsLibraryItem,
  entityBucketLabel,
  libraryAddDirtyFields,
  libraryItemRowId,
  mergeLibraryAddOnConflict,
  type LibraryToCharacterKind,
  type LibraryToCharacterRaw,
} from './add-library-item/map-library-to-character';
import type { CodexDbRefs } from './add-library-item/types';

type PendingAdd = {
  name: string;
  raw: LibraryToCharacterRaw;
};

function applyLibraryAddToCharacter(
  character: Character,
  kind: LibraryToCharacterKind,
  raw: LibraryToCharacterRaw,
  dbs: CodexDbRefs,
  buildRequiredForCharacter: (c: Character) => ReturnType<typeof buildRequiredProficiencies>,
) {
  const withItem = appendLibraryItemToCharacter(character, kind, raw, dbs);
  return computeAutoProficiencies(
    withItem,
    `Adding ${entityBucketLabel(kind)}`,
    buildRequiredForCharacter,
  );
}

export function useAddToCharacterFromLibrary(kind: LibraryToCharacterKind, characterId: string) {
  const { showToast } = useToast();
  const saveCharacter = useSaveCharacter();
  const { data: characterResult, isLoading: characterLoading } = useCharacter(
    characterId || undefined,
  );
  const character = characterResult?.character ?? null;
  const { data: powerPartsDb = [] } = useCodexPowerParts();
  const { data: techniquePartsDb = [] } = useCodexTechniqueParts();
  const { data: itemPropertiesDb = [] } = useCodexItemProperties();
  const [pending, setPending] = useState<PendingAdd | null>(null);

  const active = Boolean(characterId && character);

  const buildRequiredForCharacter = useCallback(
    (c: Character) =>
      buildRequiredProficiencies({
        powers: c.powers || [],
        techniques: c.techniques || [],
        weapons: (c.equipment?.weapons as Item[]) || [],
        shields: (c.equipment?.shields as Item[]) || [],
        armor: (c.equipment?.armor as Item[]) || [],
        powerPartsDb,
        techniquePartsDb,
        itemPropertiesDb,
      }),
    [powerPartsDb, techniquePartsDb, itemPropertiesDb],
  );

  const isOnCharacter = useCallback(
    (raw: LibraryToCharacterRaw) => {
      if (!character) return false;
      return characterOwnsLibraryItem(character, kind, libraryItemRowId(raw));
    },
    [character, kind],
  );

  const openAddConfirm = useCallback(
    (name: string, raw: LibraryToCharacterRaw) => {
      if (!characterId || characterLoading || !character) return;
      if (isOnCharacter(raw)) return;
      setPending({ name, raw });
    },
    [character, characterId, characterLoading, isOnCharacter],
  );

  const handleConfirm = useCallback(() => {
    if (!pending || !character) return;
    const dbs: CodexDbRefs = { powerPartsDb, techniquePartsDb, itemPropertiesDb };
    const first = applyLibraryAddToCharacter(
      character,
      kind,
      pending.raw,
      dbs,
      buildRequiredForCharacter,
    );
    saveCharacter.mutate(
      {
        id: character.id,
        data: libraryAddDirtyFields(kind, first.character),
        updatedAt: character.updatedAt,
        mergeOnConflict: (remote) =>
          mergeLibraryAddOnConflict(remote, kind, pending.raw, (c) =>
            applyLibraryAddToCharacter(c, kind, pending.raw, dbs, buildRequiredForCharacter),
          ),
      },
      {
        onSuccess: () => {
          showToast(`Added "${pending.name}" to ${character.name}.`, 'success');
          deferProficiencyOverLimitToast(showToast, first.overLimitWarning);
          setPending(null);
        },
        onError: (e) => {
          showToast(getErrorMessage(e, 'Failed to add to character'), 'error');
        },
      },
    );
  }, [
    pending,
    character,
    kind,
    powerPartsDb,
    techniquePartsDb,
    itemPropertiesDb,
    buildRequiredForCharacter,
    saveCharacter,
    showToast,
  ]);

  const confirmModal = useMemo((): ReactNode => {
    const characterName = character?.name ?? 'your character';
    const bucket = entityBucketLabel(kind);
    return (
      <ConfirmActionModal
        isOpen={!!pending}
        onClose={() => setPending(null)}
        onConfirm={handleConfirm}
        title={`Add to ${characterName}'s ${bucket}?`}
        description={pending ? `Add "${pending.name}" to ${characterName}'s ${bucket}?` : ''}
        confirmLabel="Add"
        loadingLabel="Adding..."
        isLoading={saveCharacter.isPending}
        icon="publish"
      />
    );
  }, [pending, character?.name, kind, handleConfirm, saveCharacter.isPending]);

  return {
    active,
    isOnCharacter,
    openAddConfirm,
    confirmModal,
  };
}
