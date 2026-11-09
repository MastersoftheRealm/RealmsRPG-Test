'use client';

import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import type { SelectableItem } from '@/components/patterns';
import { useCreatorSave } from '@/hooks';
import { stampCreatureSyncMeta } from '@/lib/library-sync';
import { useCreatorDraftDirty } from '@/hooks/use-creator-unsaved-guard';
import {
  findLoadedLibraryItem,
  resolveCreatorSaveTargetFromItem,
} from '@/lib/library/catalog-listing';
import {
  appendCreatureInventoryItems,
  removeCreatureInventoryItem,
} from '@/lib/game/creature-inventory';
import {
  removeCreaturePowerByRowKey,
  toggleCreaturePowerInnateByRowKey,
} from '@/lib/game/creature-power-instances';
import type { CreatureState } from './creature-creator-types';
import { initialState as creatureCreatorInitialState } from './creature-creator-constants';
import { rawRecordToCreatureState } from './creature-skill-utils';
import type { CreatureArmament } from './transformers';
import {
  commitCreatorEditClearAfterSave,
  scheduleCreatorEditClear,
} from '@/lib/creator/creator-edit-query';

type CreatureSaveStats = {
  isOverBudget: boolean;
};

type SyncPartDb = Parameters<typeof stampCreatureSyncMeta>[1];
type SyncPropertyDb = Parameters<typeof stampCreatureSyncMeta>[3];

type UseCreatureCreatorWorkspacePersistenceArgs = {
  creature: CreatureState;
  setCreature: Dispatch<SetStateAction<CreatureState>>;
  stats: CreatureSaveStats;
  load: {
    closeLoadModal: () => void;
    rawItems: unknown[];
  };
  editCreatureId: string | null;
  clearSessionDraftCache: () => void;
  isAdmin: boolean;
  powerPartsDb: SyncPartDb;
  techniquePartsDb: SyncPartDb;
  itemPropertiesDb: SyncPropertyDb;
};

export function useCreatureCreatorWorkspacePersistence({
  creature,
  setCreature,
  stats,
  load,
  editCreatureId,
  clearSessionDraftCache,
  isAdmin,
  powerPartsDb,
  techniquePartsDb,
  itemPropertiesDb,
}: UseCreatureCreatorWorkspacePersistenceArgs) {
  const router = useRouter();
  const clearEditQuery = useCallback(
    (href: string) => router.replace(href, { scroll: false }),
    [router],
  );
  const draftSnapshot = JSON.stringify({
    name: creature.name.trim(),
    data: creature,
  });
  const getPayload = useCallback(() => {
    return {
      name: creature.name.trim(),
      data: stampCreatureSyncMeta(
        { ...creature },
        powerPartsDb,
        techniquePartsDb,
        itemPropertiesDb,
      ),
    };
  }, [creature, itemPropertiesDb, powerPartsDb, techniquePartsDb]);
  const { isDirty: unsavedDirty, acceptDraft } = useCreatorDraftDirty(draftSnapshot);

  const save = useCreatorSave({
    type: 'creatures',
    getPayload,
    requirePublishConfirm: true,
    publishConfirmTitle: 'Publish to Realms Library',
    publishConfirmDescription: (n, { existingInPublic }) =>
      existingInPublic
        ? `Are you sure you want to override "${n}" (creature)? The existing public creature with this name will be replaced.`
        : `Are you sure you wish to publish this creature "${n}" to the Realms Library? All users will be able to see and use it.`,
    successMessage: 'Creature saved!',
    publicSuccessMessage: 'Creature saved to Realms Library!',
    initialSaveTarget: resolveCreatorSaveTargetFromItem(
      findLoadedLibraryItem(load.rawItems, editCreatureId),
      { canSaveToOfficial: isAdmin },
    ),
    editingId: editCreatureId,
    onSaveSuccess: () => {
      setCreature(creatureCreatorInitialState);
      clearSessionDraftCache();
      acceptDraft();
    },
    onSaveCommitted: () => {
      commitCreatorEditClearAfterSave(editCreatureId, clearEditQuery, acceptDraft);
    },
  });

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleLoadCreature = useCallback(
    (item: SelectableItem) => {
      setCreature(rawRecordToCreatureState(item.data as Record<string, unknown>));
      save.applyLoadedLibraryItem(item.data);
      acceptDraft();
      load.closeLoadModal();
      save.setSaveMessage({ type: 'success', text: 'Creature loaded successfully!' });
      setTimeout(() => save.setSaveMessage(null), 2000);
    },
    [acceptDraft, load, save, setCreature],
  );

  const handleSave = useCallback(async () => {
    if (stats.isOverBudget) {
      save.setSaveMessage({
        type: 'error',
        text: 'Cannot save: creature exceeds one or more point budgets.',
      });
      setTimeout(() => save.setSaveMessage(null), 3000);
      return;
    }
    await save.handleSave();
  }, [save, stats.isOverBudget]);

  const handleReset = useCallback(() => {
    setShowResetConfirm(true);
  }, []);

  const confirmReset = useCallback(
    (initialState: CreatureState, clearSessionDraftCache: () => void) => {
      setCreature(initialState);
      save.forgetLoadedLibraryItem();
      scheduleCreatorEditClear(editCreatureId, clearEditQuery);
      acceptDraft();
      clearSessionDraftCache();
      setShowResetConfirm(false);
    },
    [acceptDraft, clearEditQuery, editCreatureId, save, setCreature],
  );

  const onRemoveFeat = useCallback(
    (featId: string) => {
      setCreature((prev) => ({
        ...prev,
        feats: prev.feats.filter((f) => f.id !== featId),
      }));
    },
    [setCreature],
  );

  const onTogglePowerInnate = useCallback(
    (powerRowKey: string) => {
      setCreature((prev) => ({
        ...prev,
        powers: toggleCreaturePowerInnateByRowKey(prev.powers, powerRowKey),
      }));
    },
    [setCreature],
  );

  const onRemovePower = useCallback(
    (powerRowKey: string) => {
      setCreature((prev) => ({
        ...prev,
        powers: removeCreaturePowerByRowKey(prev.powers, powerRowKey),
      }));
    },
    [setCreature],
  );

  const onRemoveTechnique = useCallback(
    (techniqueId: string) => {
      setCreature((prev) => ({
        ...prev,
        techniques: prev.techniques.filter((t) => t.id !== techniqueId),
      }));
    },
    [setCreature],
  );

  const onRemoveArmament = useCallback(
    (armamentId: string) => {
      setCreature((prev) => ({
        ...prev,
        ...removeCreatureInventoryItem(prev, armamentId),
      }));
    },
    [setCreature],
  );

  const onAddArmaments = useCallback(
    (items: CreatureArmament[]) => {
      setCreature((prev) => ({
        ...prev,
        ...appendCreatureInventoryItems(prev, items),
      }));
    },
    [setCreature],
  );

  return {
    save,
    unsavedDirty,
    acceptDraft,
    handleSave,
    handleReset,
    confirmReset,
    handleLoadCreature,
    showResetConfirm,
    setShowResetConfirm,
    onRemoveFeat,
    onTogglePowerInnate,
    onRemovePower,
    onRemoveTechnique,
    onRemoveArmament,
    onAddArmaments,
  };
}
