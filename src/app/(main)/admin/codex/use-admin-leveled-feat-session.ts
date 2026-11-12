'use client';

import { useCallback, useMemo, useState } from 'react';
import { getFeatLevel, type LeveledFeatLike } from '@/lib/leveled-feats';

/**
 * Drafts, dirty levels, and the level switch used by the character feat modal
 * and the creature feat modal. One session, not a second copy.
 */
export function useAdminLeveledFeatSession<TForm, TFeat extends LeveledFeatLike>({
  initialForm,
  initialEditId,
  levelFeats,
  toForm,
}: {
  initialForm: TForm;
  initialEditId: string | null;
  levelFeats: readonly TFeat[];
  toForm: (feat: TFeat) => TForm;
}) {
  const [form, setForm] = useState<TForm>(initialForm);
  const [selectedEditId, setSelectedEditId] = useState<string | null>(initialEditId);
  const [draftsById, setDraftsById] = useState<Record<string, TForm>>(() =>
    initialEditId ? { [initialEditId]: initialForm } : {},
  );
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());

  const hasLevels = levelFeats.length > 1;

  const levelOptions = useMemo(() => {
    if (!hasLevels) return [];
    return levelFeats.map((feat) => {
      const lvl = getFeatLevel(feat);
      const label = lvl <= 1 ? 'Base (Level 1)' : `Level ${lvl}`;
      return { id: String(feat.id), label };
    });
  }, [hasLevels, levelFeats]);

  const dirtyLevelLabels = useMemo(() => {
    if (!hasLevels) return [];
    const byId = new Map(levelFeats.map((feat) => [String(feat.id), feat] as const));
    return [...dirtyIds]
      .map((id) => byId.get(id))
      .filter((feat): feat is TFeat => feat != null)
      .sort((a, b) => getFeatLevel(a) - getFeatLevel(b))
      .map((feat) => {
        const lvl = getFeatLevel(feat);
        return lvl <= 1 ? 'Base' : `L${lvl}`;
      });
  }, [dirtyIds, hasLevels, levelFeats]);

  const markDirty = useCallback((id: string) => {
    setDirtyIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const setFormField = useCallback(
    <K extends keyof TForm>(key: K, value: TForm[K]) => {
      setForm((prev) => {
        const next = { ...prev, [key]: value };
        const id = selectedEditId;
        if (hasLevels && id) {
          setDraftsById((drafts) => ({ ...drafts, [id]: next }));
          markDirty(id);
        }
        return next;
      });
    },
    [hasLevels, selectedEditId, markDirty],
  );

  const setFormUpdater = useCallback(
    (updater: (prev: TForm) => TForm) => {
      setForm((prev) => {
        const next = updater(prev);
        const id = selectedEditId;
        if (hasLevels && id) {
          setDraftsById((drafts) => ({ ...drafts, [id]: next }));
          markDirty(id);
        }
        return next;
      });
    },
    [hasLevels, selectedEditId, markDirty],
  );

  const handleSelectLevel = (nextId: string) => {
    if (hasLevels && selectedEditId) {
      setDraftsById((drafts) => ({ ...drafts, [selectedEditId]: form }));
    }
    setSelectedEditId(nextId);

    const existingDraft = draftsById[nextId];
    if (existingDraft) {
      setForm(existingDraft);
      return;
    }

    const match = levelFeats.find((feat) => String(feat.id) === String(nextId));
    if (!match) return;
    const nextForm = toForm(match);
    setForm(nextForm);
    setDraftsById((drafts) => ({ ...drafts, [nextId]: nextForm }));
  };

  const dirtyPayload = (): Record<string, TForm> => {
    const nextDrafts: Record<string, TForm> = { ...draftsById };
    if (selectedEditId) nextDrafts[selectedEditId] = form;
    const payload: Record<string, TForm> = {};
    dirtyIds.forEach((id) => {
      const draft = nextDrafts[id];
      if (draft) payload[id] = draft;
    });
    return payload;
  };

  return {
    form,
    setFormField,
    setFormUpdater,
    selectedEditId,
    hasLevels,
    levelOptions,
    dirtyLevelLabels,
    dirtyIds,
    handleSelectLevel,
    dirtyPayload,
  };
}
