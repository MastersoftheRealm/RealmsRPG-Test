'use client';

/**
 * Add a library power/technique/armament row directly to a filtered character (Library browse).
 * Confirm modal + save + auto-proficiency apply — mirrors sheet add-library handlers.
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
import {
  useCharacter,
  useItemProperties,
  usePowerParts,
  useSaveCharacter,
  useTechniqueParts,
} from '@/hooks';
import {
  appendLibraryItemToCharacter,
  characterOwnsLibraryItem,
  entityBucketLabel,
  isArmamentKind,
  libraryItemRowId,
  type LibraryToCharacterKind,
  type LibraryToCharacterRaw,
} from './add-library-item/map-library-to-character';

type PendingAdd = {
  name: string;
  raw: LibraryToCharacterRaw;
};

export function useAddToCharacterFromLibrary(
  kind: LibraryToCharacterKind,
  characterId: string
) {
  const { showToast } = useToast();
  const saveCharacter = useSaveCharacter();
  const { data: characterResult, isLoading: characterLoading } = useCharacter(
    characterId || undefined
  );
  const character = characterResult?.character ?? null;
  const { data: powerPartsDb = [] } = usePowerParts();
  const { data: techniquePartsDb = [] } = useTechniqueParts();
  const { data: itemPropertiesDb = [] } = useItemProperties();
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
    [powerPartsDb, techniquePartsDb, itemPropertiesDb]
  );

  const isOnCharacter = useCallback(
    (raw: LibraryToCharacterRaw) => {
      if (!character) return false;
      return characterOwnsLibraryItem(character, kind, libraryItemRowId(raw));
    },
    [character, kind]
  );

  const openAddConfirm = useCallback(
    (name: string, raw: LibraryToCharacterRaw) => {
      if (!characterId || characterLoading || !character) return;
      if (isOnCharacter(raw)) return;
      setPending({ name, raw });
    },
    [character, characterId, characterLoading, isOnCharacter]
  );

  const handleConfirm = useCallback(() => {
    if (!pending || !character) return;
    const withItem = appendLibraryItemToCharacter(character, kind, pending.raw, {
      powerPartsDb,
      techniquePartsDb,
      itemPropertiesDb,
    });
    const result = computeAutoProficiencies(
      withItem,
      `Adding ${entityBucketLabel(kind)}`,
      buildRequiredForCharacter
    );

    const data = isArmamentKind(kind)
      ? {
          equipment: result.character.equipment,
          proficiencies: result.character.proficiencies,
        }
      : {
          powers: result.character.powers,
          techniques: result.character.techniques,
          proficiencies: result.character.proficiencies,
        };

    saveCharacter.mutate(
      {
        id: character.id,
        data,
      },
      {
        onSuccess: () => {
          showToast(`Added "${pending.name}" to ${character.name}.`, 'success');
          deferProficiencyOverLimitToast(showToast, result.overLimitWarning);
          setPending(null);
        },
        onError: (e) => {
          showToast(getErrorMessage(e, 'Failed to add to character'), 'error');
        },
      }
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
        description={
          pending ? `Add "${pending.name}" to ${characterName}'s ${bucket}?` : ''
        }
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
