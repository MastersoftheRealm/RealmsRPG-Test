'use client';

import { useState, useMemo, useCallback } from 'react';
import { Modal, Button } from '@/components/ui';
import type { Feat, Skill } from '@/hooks';
import { Layers } from 'lucide-react';
import { getFeatLevel } from '@/lib/leveled-feats';
import { featToFormState, type FeatFormState } from './admin-feat-form';
import { AdminFeatEditModalFields } from './admin-feat-edit-modal-fields';
import { AdminCodexCopySourceBanner } from './admin-codex-copy-source-banner';
import { AdminCodexEditModalFooter } from './admin-codex-edit-modal-footer';

export function AdminFeatEditModal({
  isOpen,
  onClose,
  title,
  copySourceName,
  feats,
  levelFeats,
  skills,
  filterOptions,
  abilityOptions,
  saving,
  canDelete,
  onDelete,
  onSave,
  onSaveAll,
  initialForm,
  initialEditId,
  enableAddLevel,
  onAddLevel,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  copySourceName: string | null;
  feats: Feat[] | undefined;
  /** When editing a leveled feat family, this contains all feats in that family (sorted). */
  levelFeats: Feat[];
  skills: Skill[];
  filterOptions: {
    levels: number[];
    abilities: string[];
    categories: string[];
    tags: string[];
    abilReqAbilities: string[];
  };
  abilityOptions: { value: string; label: string }[];
  saving: boolean;
  canDelete: boolean;
  onDelete?: (() => void) | undefined;
  onSave: (id: string | null, form: FeatFormState) => void;
  onSaveAll: (editsById: Record<string, FeatFormState>) => void;
  initialForm: FeatFormState;
  initialEditId: string | null;
  enableAddLevel: boolean;
  onAddLevel?: ((form: FeatFormState, sourceDbFeatId: string) => void) | undefined;
}) {
  // Fresh state per open: parent remounts with key={modalSessionKey}.
  const [form, setForm] = useState<FeatFormState>(initialForm);
  const [selectedEditId, setSelectedEditId] = useState<string | null>(initialEditId);
  const [draftsById, setDraftsById] = useState<Record<string, FeatFormState>>(() =>
    initialEditId ? { [initialEditId]: initialForm } : {},
  );
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());

  const hasLevels = levelFeats.length > 1;
  const levelOptions = useMemo(() => {
    if (!hasLevels) return [];
    return levelFeats.map((f) => {
      const lvl = getFeatLevel(f);
      const label = lvl <= 1 ? 'Base (Level 1)' : `Level ${lvl}`;
      return { id: String(f.id), label };
    });
  }, [hasLevels, levelFeats]);

  const dirtyLevelLabels = useMemo(() => {
    if (!hasLevels) return [];
    const byId = new Map(levelFeats.map((f) => [String(f.id), f] as const));
    return [...dirtyIds]
      .map((id) => byId.get(id))
      .filter(Boolean)
      .sort((a, b) => getFeatLevel(a!) - getFeatLevel(b!))
      .map((feat) => {
        const lvl = getFeatLevel(feat!);
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
    <K extends keyof FeatFormState>(key: K, value: FeatFormState[K]) => {
      setForm((prev) => {
        const next = { ...prev, [key]: value };
        const id = selectedEditId;
        if (hasLevels && id) {
          setDraftsById((d) => ({ ...d, [id]: next }));
          markDirty(id);
        }
        return next;
      });
    },
    [hasLevels, selectedEditId, markDirty],
  );

  const setFormUpdater = useCallback(
    (updater: (prev: FeatFormState) => FeatFormState) => {
      setForm((prev) => {
        const next = updater(prev);
        const id = selectedEditId;
        if (hasLevels && id) {
          setDraftsById((d) => ({ ...d, [id]: next }));
          markDirty(id);
        }
        return next;
      });
    },
    [hasLevels, selectedEditId, markDirty],
  );

  const handleSelectLevel = (nextId: string) => {
    // Persist current level draft before switching
    if (hasLevels && selectedEditId) {
      setDraftsById((d) => ({ ...d, [selectedEditId]: form }));
    }
    setSelectedEditId(nextId);

    // If we've already started editing this level in this session, restore the draft.
    const existingDraft = draftsById[nextId];
    if (existingDraft) {
      setForm(existingDraft);
      return;
    }

    const match = levelFeats.find((f) => String(f.id) === String(nextId));
    if (!match) return;

    const nextForm = featToFormState(match);
    setForm(nextForm);
    setDraftsById((d) => ({ ...d, [nextId]: nextForm }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="full"
      fullScreenOnMobile
      footer={
        <AdminCodexEditModalFooter
          onDelete={canDelete ? onDelete : undefined}
          onClose={onClose}
          onSave={() => {
            if (hasLevels) {
              // Ensure current form is captured before bulk-save.
              const currentId = selectedEditId;
              const nextDrafts: Record<string, FeatFormState> = { ...draftsById };
              if (currentId) nextDrafts[currentId] = form;
              const payload: Record<string, FeatFormState> = {};
              dirtyIds.forEach((id) => {
                const draft = nextDrafts[id];
                if (draft) payload[id] = draft;
              });
              // If user didn't change anything, do nothing.
              if (Object.keys(payload).length === 0) return;
              onSaveAll(payload);
              return;
            }
            onSave(selectedEditId, form);
          }}
          saveDisabled={saving || !form.name.trim() || (hasLevels && dirtyIds.size === 0)}
          saving={saving}
        />
      }
    >
      <div className="space-y-4">
        {hasLevels && (
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Editing level
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              <select
                value={selectedEditId ?? ''}
                onChange={(e) => handleSelectLevel(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-text-primary sm:w-auto"
                aria-label="Select feat level to edit"
              >
                {levelOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {enableAddLevel && onAddLevel && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  disabled={saving || !selectedEditId}
                  onClick={() => {
                    if (!selectedEditId || !onAddLevel) return;
                    onAddLevel(form, selectedEditId);
                  }}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Layers className="h-4 w-4" aria-hidden />
                    Add Level
                  </span>
                </Button>
              )}
              {dirtyLevelLabels.length > 0 && (
                <div className="text-xs text-text-muted">
                  <span className="font-medium text-text-secondary">Unsaved:</span>{' '}
                  {dirtyLevelLabels.join(', ')}
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-text-muted">
              This feat has multiple levels. Select which level you want to edit.
            </p>
          </div>
        )}
        {!hasLevels && enableAddLevel && onAddLevel && (
          <div className="flex flex-col gap-2 rounded-md border border-border-light bg-surface-alt px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-text-muted">
              Save a new row for the next feat tier. Level and character level required are filled
              from the current feat.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              disabled={saving || !initialEditId}
              onClick={() => {
                if (!initialEditId || !onAddLevel) return;
                onAddLevel(form, initialEditId);
              }}
            >
              <span className="inline-flex items-center gap-1.5">
                <Layers className="h-4 w-4" aria-hidden />
                Add Level
              </span>
            </Button>
          </div>
        )}
        <AdminCodexCopySourceBanner copySourceName={copySourceName} entityLabel="feat" />
        <AdminFeatEditModalFields
          form={form}
          setFormField={setFormField}
          setFormUpdater={setFormUpdater}
          feats={feats}
          skills={skills}
          filterOptions={filterOptions}
          abilityOptions={abilityOptions}
        />
      </div>
    </Modal>
  );
}
