"use client";

import type { Dispatch, SetStateAction } from "react";
import { ChipSelect } from "@/components/shared/filters";
import { Modal, Button, Input, Textarea } from "@/components/ui";
import { Plus, X } from "lucide-react";
import {
  baseEnToPercent,
  optionEnToPercent,
  percentToBaseEn,
  percentToOptionEn,
  type PartFormState,
} from "./admin-part-form";

export type AdminPartEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  copySourceName: string | null;
  editingId: string | null;
  form: PartFormState;
  setForm: Dispatch<SetStateAction<PartFormState>>;
  filterCategories: string[];
  targetedDefenseOptions: string[];
  optionSlotCount: number;
  setOptionSlotCount: Dispatch<SetStateAction<number>>;
  deleteOptionAndCompact: (index1Based: 1 | 2 | 3) => void;
  saving: boolean;
  deleteConfirm: string | null;
  onRequestDelete: () => void;
  onSave: () => void;
};

export function AdminPartEditModal({
  isOpen,
  onClose,
  title,
  copySourceName,
  editingId,
  form,
  setForm,
  filterCategories,
  targetedDefenseOptions,
  optionSlotCount,
  setOptionSlotCount,
  deleteOptionAndCompact,
  saving,
  deleteConfirm,
  onRequestDelete,
  onSave,
}: AdminPartEditModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="full"
      fullScreenOnMobile
      footer={
        <div className="flex justify-between">
          <div>
            {editingId && (
              <Button
                variant="outline"
                onClick={onRequestDelete}
                className={
                  deleteConfirm === editingId
                    ? "border-danger-500 text-danger-700 dark:text-danger-400"
                    : ""
                }
              >
                {deleteConfirm === editingId
                  ? "Click again to confirm delete"
                  : "Delete"}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onSave} disabled={saving || !form.name.trim()}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {copySourceName && (
          <p className="text-sm text-text-secondary rounded-md bg-surface-alt px-3 py-2 border border-border-light">
            Creating a copy of{" "}
            <strong className="text-text-primary">{copySourceName}</strong>.
            Change the name and details as needed, then save to add the new
            part.
          </p>
        )}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Name *
          </label>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Part name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Description
          </label>
          <Textarea
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="Part description"
            className="min-h-[120px] resize-y"
            rows={4}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Category
            </label>
            <select
              value={
                form.category && filterCategories.includes(form.category)
                  ? form.category
                  : form.category
                    ? "__new__"
                    : ""
              }
              onChange={(e) => {
                const v = e.target.value;
                if (v === "__new__")
                  setForm((f) => ({ ...f, category: f.category || "" }));
                else setForm((f) => ({ ...f, category: v }));
              }}
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-text-primary"
              aria-label="Part category"
            >
              <option value="">None</option>
              {filterCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value="__new__">Add new category...</option>
            </select>
            {form.category && !filterCategories.includes(form.category) && (
              <Input
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                placeholder="Type new category"
                className="mt-2"
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Type
            </label>
            <select
              value={form.type}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  type: e.target.value as "power" | "technique",
                }))
              }
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-text-primary"
              aria-label="Part type (power or technique)"
            >
              <option value="power">Power</option>
              <option value="technique">Technique</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Base EN {form.percentage ? "(%)" : ""}
            </label>
            {form.percentage ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="any"
                  value={baseEnToPercent(form.base_en)}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      base_en: percentToBaseEn(e.target.value),
                    }))
                  }
                  placeholder="e.g. -12.5 or 12.5"
                />
                <span className="text-sm text-text-muted shrink-0">%</span>
              </div>
            ) : (
              <Input
                type="number"
                min={0}
                step="any"
                value={form.base_en ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    base_en:
                      e.target.value === ""
                        ? undefined
                        : parseFloat(e.target.value) || 0,
                  }))
                }
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Base TP
            </label>
            <Input
              type="number"
              min={0}
              step="any"
              value={form.base_tp ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  base_tp:
                    e.target.value === ""
                      ? undefined
                      : parseFloat(e.target.value) || 0,
                }))
              }
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.mechanic}
              onChange={(e) =>
                setForm((f) => ({ ...f, mechanic: e.target.checked }))
              }
            />
            <span className="text-sm text-text-secondary">Mechanic Part</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.percentage}
              onChange={(e) =>
                setForm((f) => ({ ...f, percentage: e.target.checked }))
              }
            />
            <span className="text-sm text-text-secondary">Percentage Cost</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.duration}
              onChange={(e) =>
                setForm((f) => ({ ...f, duration: e.target.checked }))
              }
            />
            <span className="text-sm text-text-secondary">
              Affects Duration
            </span>
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Targeted defenses (optional)
          </label>
          <ChipSelect
            label=""
            placeholder="Choose defenses this part targets"
            options={targetedDefenseOptions.map((d) => ({
              value: d,
              label: d,
            }))}
            selectedValues={form.defense}
            onSelect={(v) =>
              setForm((f) => ({ ...f, defense: [...f.defense, v] }))
            }
            onRemove={(v) =>
              setForm((f) => ({
                ...f,
                defense: f.defense.filter((x) => x !== v),
              }))
            }
          />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-text-secondary">
              Options
            </h4>
            {optionSlotCount < 3 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOptionSlotCount((n) => Math.min(3, n + 1))}
                aria-label="Add option"
              >
                <Plus className="w-4 h-4 mr-1 inline" />
                Add option
              </Button>
            )}
          </div>
          {optionSlotCount === 0 ? (
            <p className="text-sm text-text-muted">
              No options. Click &quot;Add option&quot; to add cost options for
              this part.
            </p>
          ) : (
            <div className="space-y-4">
              {[1, 2, 3].slice(0, optionSlotCount).map((n) => (
                <div
                  key={n}
                  className="rounded-lg border border-border-light bg-surface-alt/50 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-secondary">
                      Option {n}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-text-muted hover:text-danger-fg"
                      onClick={() => deleteOptionAndCompact(n as 1 | 2 | 3)}
                      aria-label={`Remove option ${n}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Description
                    </label>
                    <textarea
                      value={
                        n === 1
                          ? form.op_1_desc
                          : n === 2
                            ? form.op_2_desc
                            : form.op_3_desc
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (n === 1) setForm((f) => ({ ...f, op_1_desc: val }));
                        else if (n === 2)
                          setForm((f) => ({ ...f, op_2_desc: val }));
                        else setForm((f) => ({ ...f, op_3_desc: val }));
                      }}
                      placeholder={`What option ${n} does`}
                      className="w-full min-h-[80px] resize-y px-3 py-2 rounded-md border border-border bg-background text-text-primary"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 max-w-xs">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        EN cost {form.percentage ? "(±%)" : ""}
                      </label>
                      {form.percentage ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="any"
                            value={
                              n === 1
                                ? optionEnToPercent(form.op_1_en)
                                : n === 2
                                  ? optionEnToPercent(form.op_2_en)
                                  : optionEnToPercent(form.op_3_en)
                            }
                            onChange={(e) => {
                              const v = percentToOptionEn(e.target.value);
                              if (n === 1)
                                setForm((f) => ({ ...f, op_1_en: v }));
                              else if (n === 2)
                                setForm((f) => ({ ...f, op_2_en: v }));
                              else setForm((f) => ({ ...f, op_3_en: v }));
                            }}
                            className="w-full"
                            placeholder="e.g. -12.5"
                          />
                          <span className="text-sm text-text-muted shrink-0">
                            %
                          </span>
                        </div>
                      ) : (
                        <Input
                          type="number"
                          step="any"
                          value={
                            n === 1
                              ? (form.op_1_en ?? "")
                              : n === 2
                                ? (form.op_2_en ?? "")
                                : (form.op_3_en ?? "")
                          }
                          onChange={(e) => {
                            const v =
                              e.target.value === ""
                                ? undefined
                                : parseFloat(e.target.value) || 0;
                            if (n === 1) setForm((f) => ({ ...f, op_1_en: v }));
                            else if (n === 2)
                              setForm((f) => ({ ...f, op_2_en: v }));
                            else setForm((f) => ({ ...f, op_3_en: v }));
                          }}
                          className="w-full"
                          placeholder="-"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        TP cost
                      </label>
                      <Input
                        type="number"
                        step="any"
                        value={
                          n === 1
                            ? (form.op_1_tp ?? "")
                            : n === 2
                              ? (form.op_2_tp ?? "")
                              : (form.op_3_tp ?? "")
                        }
                        onChange={(e) => {
                          const v =
                            e.target.value === ""
                              ? undefined
                              : parseFloat(e.target.value) || 0;
                          if (n === 1) setForm((f) => ({ ...f, op_1_tp: v }));
                          else if (n === 2)
                            setForm((f) => ({ ...f, op_2_tp: v }));
                          else setForm((f) => ({ ...f, op_3_tp: v }));
                        }}
                        className="w-full"
                        placeholder="-"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
