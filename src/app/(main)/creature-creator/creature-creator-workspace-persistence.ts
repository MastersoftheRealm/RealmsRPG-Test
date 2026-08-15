'use client';

import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import type { SelectableItem } from '@/components/shared';
import { useCreatorSave } from '@/hooks';
import type { CreatureState } from './creature-creator-types';
import { rawRecordToCreatureState } from './creature-skill-utils';

type CreatureSaveStats = {
  isOverBudget: boolean;
};

type UseCreatureCreatorWorkspacePersistenceArgs = {
  creature: CreatureState;
  setCreature: Dispatch<SetStateAction<CreatureState>>;
  stats: CreatureSaveStats;
  load: {
    closeLoadModal: () => void;
  };
};

export function useCreatureCreatorWorkspacePersistence({
  creature,
  setCreature,
  stats,
  load,
}: UseCreatureCreatorWorkspacePersistenceArgs) {
  const getPayload = useCallback(
    () => ({
      name: creature.name.trim(),
      data: { ...creature },
    }),
    [creature],
  );

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
  });

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleLoadCreature = useCallback(
    (item: SelectableItem) => {
      setCreature(rawRecordToCreatureState(item.data as Record<string, unknown>));
      load.closeLoadModal();
      save.setSaveMessage({ type: 'success', text: 'Creature loaded successfully!' });
      setTimeout(() => save.setSaveMessage(null), 2000);
    },
    [load, save, setCreature],
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
    (powerId: string) => {
      setCreature((prev) => ({
        ...prev,
        powers: prev.powers.map((p) =>
          p.id === powerId ? { ...p, innate: !(p.innate === true) } : p,
        ),
      }));
    },
    [setCreature],
  );

  const onRemovePower = useCallback(
    (powerId: string) => {
      setCreature((prev) => ({
        ...prev,
        powers: prev.powers.filter((p) => p.id !== powerId),
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
        armaments: prev.armaments.filter((a) => a.id !== armamentId),
      }));
    },
    [setCreature],
  );

  return {
    save,
    handleSave,
    handleReset,
    handleLoadCreature,
    showResetConfirm,
    setShowResetConfirm,
    onRemoveFeat,
    onTogglePowerInnate,
    onRemovePower,
    onRemoveTechnique,
    onRemoveArmament,
  };
}
