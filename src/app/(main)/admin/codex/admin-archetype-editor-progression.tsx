'use client';

import { ChipSelect } from '@/components/shared';
import { Button, Input } from '@/components/ui';
import { dedupeStrings, makeLevelRow } from './admin-archetype-path-form';
import { SelectedFeatRows } from './admin-archetype-path-rows';
import { removeFieldConfig, selectionFieldConfig, type AdminArchetypeEditorProps } from './admin-archetype-editor-config';

export type AdminArchetypeEditorProgressionProps = Pick<
  AdminArchetypeEditorProps,
  'form' | 'setForm' | 'optionsByField' | 'getFeatOptionsForLevel' | 'featById'
>;

export function AdminArchetypeEditorProgression({
  form,
  setForm,
  optionsByField,
  getFeatOptionsForLevel,
  featById,
}: AdminArchetypeEditorProgressionProps) {
  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-text-primary">Level Progression (2+)</h4>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setForm((f) => ({
                ...f,
                levelPathRows: [...f.levelPathRows, makeLevelRow(Math.max(2, ...f.levelPathRows.map((row) => row.level)) + 1)],
              }))
            }
          >
            Add Level
          </Button>
        </div>

        {form.levelPathRows.map((row) => (
          <div key={row.rowId} className="rounded-md border border-border-light p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-text-secondary">Level</label>
                <Input
                  type="number"
                  value={String(row.level)}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      levelPathRows: f.levelPathRows.map((candidate) =>
                        candidate.rowId === row.rowId ? { ...candidate, level: Number(e.target.value || 2) } : candidate
                      ),
                    }))
                  }
                  className="w-20"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    levelPathRows: f.levelPathRows.length > 1 ? f.levelPathRows.filter((candidate) => candidate.rowId !== row.rowId) : [makeLevelRow(2)],
                  }))
                }
              >
                Remove
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectionFieldConfig.map((field) => {
                const isFeatField = field.key === 'feats';
                const options =
                  (isFeatField
                    ? getFeatOptionsForLevel(row.level)
                    : optionsByField[field.key]) ?? [];
                const selected = row[field.key];
                if (isFeatField) {
                  return (
                    <div key={`${row.rowId}-${field.key}`} className="space-y-2">
                      <ChipSelect
                        label={`Add ${field.label}`}
                        placeholder={field.placeholder}
                        options={options
                          .filter((option) => !selected.includes(option.value))
                          .map((option) => ({
                            value: option.value,
                            label: option.label,
                          }))}
                        selectedValues={[]}
                        onSelect={(value) =>
                          setForm((f) => ({
                            ...f,
                            levelPathRows: f.levelPathRows.map((candidate) =>
                              candidate.rowId === row.rowId
                                ? {
                                    ...candidate,
                                    [field.key]: dedupeStrings([
                                      ...candidate[field.key],
                                      value,
                                    ]),
                                  }
                                : candidate
                            ),
                          }))
                        }
                      />
                      <SelectedFeatRows
                        featIds={selected}
                        featById={featById}
                        onRemove={(value) =>
                          setForm((f) => ({
                            ...f,
                            levelPathRows: f.levelPathRows.map((candidate) =>
                              candidate.rowId === row.rowId
                                ? {
                                    ...candidate,
                                    [field.key]: candidate[field.key].filter(
                                      (entry) => entry !== value
                                    ),
                                  }
                                : candidate
                            ),
                          }))
                        }
                      />
                    </div>
                  );
                }
                return (
                  <ChipSelect
                    key={`${row.rowId}-${field.key}`}
                    label={`Add ${field.label}`}
                    placeholder={field.placeholder}
                    options={options.map((option) => ({
                      value: option.value,
                      label: option.label,
                    }))}
                    selectedValues={selected}
                    onSelect={(value) =>
                      setForm((f) => ({
                        ...f,
                        levelPathRows: f.levelPathRows.map((candidate) =>
                          candidate.rowId === row.rowId
                            ? {
                                ...candidate,
                                [field.key]: dedupeStrings([
                                  ...candidate[field.key],
                                  value,
                                ]),
                              }
                            : candidate
                        ),
                      }))
                    }
                    onRemove={(value) =>
                      setForm((f) => ({
                        ...f,
                        levelPathRows: f.levelPathRows.map((candidate) =>
                          candidate.rowId === row.rowId
                            ? {
                                ...candidate,
                                [field.key]: candidate[field.key].filter(
                                  (entry) => entry !== value
                                ),
                              }
                            : candidate
                        ),
                      }))
                    }
                  />
                );
              })}
              {removeFieldConfig.map((field) => {
                const isFeatField = field.key === 'removeFeats';
                const options =
                  (isFeatField
                    ? getFeatOptionsForLevel(row.level)
                    : optionsByField[field.key]) ?? [];
                const selected = row[field.key];
                if (isFeatField) {
                  return (
                    <div key={`${row.rowId}-${field.key}`} className="space-y-2">
                      <ChipSelect
                        label={field.label}
                        placeholder={field.placeholder}
                        options={options
                          .filter((option) => !selected.includes(option.value))
                          .map((option) => ({
                            value: option.value,
                            label: option.label,
                          }))}
                        selectedValues={[]}
                        onSelect={(value) =>
                          setForm((f) => ({
                            ...f,
                            levelPathRows: f.levelPathRows.map((candidate) =>
                              candidate.rowId === row.rowId
                                ? {
                                    ...candidate,
                                    [field.key]: dedupeStrings([
                                      ...candidate[field.key],
                                      value,
                                    ]),
                                  }
                                : candidate
                            ),
                          }))
                        }
                      />
                      <SelectedFeatRows
                        featIds={selected}
                        featById={featById}
                        onRemove={(value) =>
                          setForm((f) => ({
                            ...f,
                            levelPathRows: f.levelPathRows.map((candidate) =>
                              candidate.rowId === row.rowId
                                ? {
                                    ...candidate,
                                    [field.key]: candidate[field.key].filter(
                                      (entry) => entry !== value
                                    ),
                                  }
                                : candidate
                            ),
                          }))
                        }
                      />
                    </div>
                  );
                }
                return (
                  <ChipSelect
                    key={`${row.rowId}-${field.key}`}
                    label={field.label}
                    placeholder={field.placeholder}
                    options={options.map((option) => ({
                      value: option.value,
                      label: option.label,
                    }))}
                    selectedValues={selected}
                    onSelect={(value) =>
                      setForm((f) => ({
                        ...f,
                        levelPathRows: f.levelPathRows.map((candidate) =>
                          candidate.rowId === row.rowId
                            ? {
                                ...candidate,
                                [field.key]: dedupeStrings([
                                  ...candidate[field.key],
                                  value,
                                ]),
                              }
                            : candidate
                        ),
                      }))
                    }
                    onRemove={(value) =>
                      setForm((f) => ({
                        ...f,
                        levelPathRows: f.levelPathRows.map((candidate) =>
                          candidate.rowId === row.rowId
                            ? {
                                ...candidate,
                                [field.key]: candidate[field.key].filter(
                                  (entry) => entry !== value
                                ),
                              }
                            : candidate
                        ),
                      }))
                    }
                  />
                );
              })}
            </div>
            <Input
              value={row.notes}
              onChange={(e) => setForm((f) => ({ ...f, levelPathRows: f.levelPathRows.map((candidate) => candidate.rowId === row.rowId ? { ...candidate, notes: e.target.value } : candidate) }))}
              placeholder="Level notes (optional)"
              aria-label={`Notes for level ${row.level}`}
            />
          </div>
        ))}
      </div>

      <div>
        <label
          htmlFor="admin-archetype-advanced-path-json"
          className="block text-sm font-medium text-text-secondary mb-1"
        >
          Advanced Path JSON Override (optional)
        </label>
        <textarea
          id="admin-archetype-advanced-path-json"
          value={form.advancedPathJson}
          onChange={(e) => setForm((f) => ({ ...f, advancedPathJson: e.target.value }))}
          placeholder="Optional: paste full path_data JSON to override builder output."
          className="w-full min-h-[120px] px-3 py-2 rounded-md border border-border bg-background text-text-primary font-mono text-xs"
          rows={6}
        />
      </div>
    </>
  );
}
