'use client';

import { useState } from 'react';
import { Button, Input } from '@/components/ui';
import { Layers } from 'lucide-react';
import { isFeatFamilyBase, type LeveledFeatLike } from '@/lib/leveled-feats';
import { cn } from '@/lib/utils';
import { ADMIN_FEAT_MODAL_SELECT_CLASS } from './admin-feat-edit-modal-fields';

/** Category dropdown plus “add a new stored label”. Options are the labels already on rows. */
export function AdminStoredCategoryField({
  label,
  ariaLabel,
  value,
  categories,
  onChange,
}: {
  label: string;
  ariaLabel: string;
  value: string;
  categories: readonly string[];
  onChange: (next: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const custom = Boolean(value) && !categories.includes(value);
  const showNew = adding || custom;
  const selectValue = showNew ? '__new__' : value;

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-text-secondary">{label}</label>
      <select
        value={selectValue}
        onChange={(e) => {
          const next = e.target.value;
          if (next === '__new__') {
            setAdding(true);
            if (!custom) onChange('');
            return;
          }
          setAdding(false);
          onChange(next);
        }}
        className={ADMIN_FEAT_MODAL_SELECT_CLASS}
        aria-label={ariaLabel}
      >
        <option value="">None</option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
        <option value="__new__">Add new category...</option>
      </select>
      {showNew && (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type new category"
          className="mt-2"
          aria-label={`${ariaLabel} text`}
        />
      )}
    </div>
  );
}

/** Level-1 rows of whatever catalog the caller passes (character feats or creature feats). */
export function AdminBaseFeatSelect({
  id,
  value,
  onChange,
  feats,
  hint,
}: {
  id: string;
  value: string;
  onChange: (featId: string) => void;
  feats: ReadonlyArray<LeveledFeatLike & { name?: string | undefined }>;
  hint: string;
}) {
  const bases = feats.filter((feat) => isFeatFamilyBase(feat));
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-text-secondary">
        Base feat (level 1)
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={ADMIN_FEAT_MODAL_SELECT_CLASS}
        aria-label="Base feat (level 1) (leave empty for level 1 feats)"
      >
        <option value="">None (this is level 1)</option>
        {bases.map((feat) => (
          <option key={String(feat.id)} value={String(feat.id)}>
            {feat.name} (id: {feat.id})
          </option>
        ))}
      </select>
      <p className="mt-1 text-xs text-text-muted">{hint}</p>
    </div>
  );
}

export function AdminFeatLevelControls({
  hasLevels,
  enableAddLevel,
  saving,
  selectedEditId,
  canAddFromSingle,
  levelOptions,
  dirtyLevelLabels,
  addLevelHelp,
  onSelectLevel,
  onAddLevel,
  selectClassName,
}: {
  hasLevels: boolean;
  enableAddLevel: boolean;
  saving: boolean;
  selectedEditId: string | null;
  canAddFromSingle: boolean;
  levelOptions: ReadonlyArray<{ id: string; label: string }>;
  dirtyLevelLabels: readonly string[];
  addLevelHelp: string;
  onSelectLevel: (id: string) => void;
  onAddLevel: () => void;
  selectClassName?: string | undefined;
}) {
  const selectClass = selectClassName ?? ADMIN_FEAT_MODAL_SELECT_CLASS;
  if (!enableAddLevel && !hasLevels) return null;

  if (hasLevels) {
    return (
      <div>
        <label className="mb-1 block text-sm font-medium text-text-secondary">Editing level</label>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <select
            value={selectedEditId ?? ''}
            onChange={(e) => onSelectLevel(e.target.value)}
            className={cn(selectClass, 'sm:w-auto')}
            aria-label="Select feat level to edit"
          >
            {levelOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          {enableAddLevel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              disabled={saving || !selectedEditId}
              onClick={onAddLevel}
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
    );
  }

  if (!enableAddLevel) return null;

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border-light bg-surface-alt px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-text-muted">{addLevelHelp}</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0"
        disabled={saving || !canAddFromSingle}
        onClick={onAddLevel}
      >
        <span className="inline-flex items-center gap-1.5">
          <Layers className="h-4 w-4" aria-hidden />
          Add Level
        </span>
      </Button>
    </div>
  );
}
