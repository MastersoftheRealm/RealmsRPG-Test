'use client';

import { useCallback, useMemo, useState } from 'react';
import { getFeatLevel, type LeveledFeatLike } from '@/lib/leveled-feats';
import { codexEditorSnapshot } from './admin-codex-unsaved-leave';
import { creatorDraftIsDirty } from '@/lib/creator/creator-unsaved-guard';
import { newAdminPendingFeatLevelId } from './admin-pending-feat-level-id';

function formFeatLevel(form: { feat_lvl?: number | undefined }): number {
  return form.feat_lvl != null && form.feat_lvl > 0 ? form.feat_lvl : 1;
}

export type AdminLeveledFeatFamilyEntry<TForm> = {
  id: string;
  lvl: number;
  form: TForm;
};

/** Picks which row to copy when adding the next tier (matches prior modal behavior, incl. pending drafts). */
export function resolveAdminLeveledFeatAddSource<
  TForm extends { feat_lvl?: number | undefined },
>(input: {
  form: TForm;
  selectedEditId: string | null;
  fallbackEditId: string | null;
  family: AdminLeveledFeatFamilyEntry<TForm>[];
}): { sourceForm: TForm; sourceDbFeatId: string } | null {
  const activeId = input.selectedEditId ?? input.fallbackEditId;
  if (!activeId) return null;
  if (input.family.length === 0) {
    return { sourceForm: input.form, sourceDbFeatId: activeId };
  }
  const sorted = [...input.family].sort((a, b) => a.lvl - b.lvl);
  const peak = sorted[sorted.length - 1]!;
  const selected =
    input.family.find((row) => row.id === input.selectedEditId) ??
    input.family.find((row) => row.id === activeId);
  const selectedLvl = selected?.lvl ?? formFeatLevel(input.form);
  if (peak.lvl > selectedLvl) {
    return { sourceForm: peak.form, sourceDbFeatId: peak.id };
  }
  return { sourceForm: input.form, sourceDbFeatId: activeId };
}

/**
 * Drafts, dirty levels, and the level switch used by the character feat modal
 * and the creature feat modal. One session, not a second copy.
 */
export function useAdminLeveledFeatSession<
  TForm extends { feat_lvl?: number | undefined },
  TFeat extends LeveledFeatLike,
>({
  initialForm,
  initialEditId,
  levelFeats,
  toForm,
  computeNextLevel,
}: {
  initialForm: TForm;
  initialEditId: string | null;
  levelFeats: readonly TFeat[];
  toForm: (feat: TFeat) => TForm;
  computeNextLevel: (
    sourceForm: TForm,
    sourceDbFeatId: string,
    existingFamilyLevels?: readonly LeveledFeatLike[],
  ) => TForm;
}) {
  const [form, setForm] = useState<TForm>(initialForm);
  const [selectedEditId, setSelectedEditId] = useState<string | null>(initialEditId);
  const [draftsById, setDraftsById] = useState<Record<string, TForm>>(() =>
    initialEditId ? { [initialEditId]: initialForm } : {},
  );
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<string[]>([]);

  const hasLevels = levelFeats.length > 1 || pendingIds.length > 0;

  const familyEntries = useCallback((): AdminLeveledFeatFamilyEntry<TForm>[] => {
    const rows: AdminLeveledFeatFamilyEntry<TForm>[] = [];
    for (const feat of levelFeats) {
      const id = String(feat.id);
      rows.push({
        id,
        lvl: getFeatLevel(feat),
        form: draftsById[id] ?? toForm(feat),
      });
    }
    for (const id of pendingIds) {
      const draft = id === selectedEditId ? form : draftsById[id];
      if (draft) {
        rows.push({ id, lvl: formFeatLevel(draft), form: draft });
      }
    }
    return rows;
  }, [draftsById, form, levelFeats, pendingIds, selectedEditId, toForm]);

  const familyAsLeveled = useCallback((): LeveledFeatLike[] => {
    return familyEntries().map((row) => ({
      id: row.id,
      feat_lvl: row.lvl,
      base_feat_id: (row.form as { base_feat_id?: string }).base_feat_id,
    }));
  }, [familyEntries]);

  const levelOptions = useMemo(() => {
    if (!hasLevels) return [];
    return familyEntries()
      .sort((a, b) => a.lvl - b.lvl)
      .map((row) => {
        const isPending = pendingIds.includes(row.id);
        const label =
          row.lvl <= 1
            ? isPending
              ? 'Base (Level 1, unsaved)'
              : 'Base (Level 1)'
            : isPending
              ? `Level ${row.lvl} (unsaved)`
              : `Level ${row.lvl}`;
        return { id: row.id, label };
      });
  }, [familyEntries, hasLevels, pendingIds]);

  const dirtyLevelLabels = useMemo(() => {
    if (!hasLevels) return [];
    const byId = new Map(familyEntries().map((row) => [row.id, row] as const));
    return [...dirtyIds]
      .map((id) => byId.get(id))
      .filter((row): row is AdminLeveledFeatFamilyEntry<TForm> => row != null)
      .sort((a, b) => a.lvl - b.lvl)
      .map((row) => {
        const pending = pendingIds.includes(row.id);
        const base = row.lvl <= 1 ? 'Base' : `L${row.lvl}`;
        return pending ? `${base} (new)` : base;
      });
  }, [dirtyIds, familyEntries, hasLevels, pendingIds]);

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

  const stashCurrentLevelDraft = useCallback(() => {
    if (!selectedEditId) return;
    const baseline = draftsById[selectedEditId];
    if (baseline && creatorDraftIsDirty(codexEditorSnapshot(form), codexEditorSnapshot(baseline))) {
      markDirty(selectedEditId);
    }
    setDraftsById((drafts) => ({ ...drafts, [selectedEditId]: form }));
  }, [draftsById, form, markDirty, selectedEditId]);

  const addNextLevel = useCallback(
    (fallbackEditId: string | null) => {
      stashCurrentLevelDraft();
      const source = resolveAdminLeveledFeatAddSource({
        form,
        selectedEditId,
        fallbackEditId,
        family: familyEntries(),
      });
      if (!source) return;

      const nextForm = computeNextLevel(
        source.sourceForm,
        source.sourceDbFeatId,
        familyAsLeveled(),
      );

      const pendingId = newAdminPendingFeatLevelId();
      setPendingIds((ids) => [...ids, pendingId]);
      setDraftsById((drafts) => ({ ...drafts, [pendingId]: nextForm }));
      markDirty(pendingId);
      setSelectedEditId(pendingId);
      setForm(nextForm);
    },
    [
      computeNextLevel,
      familyAsLeveled,
      familyEntries,
      form,
      markDirty,
      selectedEditId,
      stashCurrentLevelDraft,
    ],
  );

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
    addNextLevel,
    pendingIds,
  };
}
