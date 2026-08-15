'use client';

import type { Dispatch, SetStateAction } from 'react';
import { Button, Input } from '@/components/ui';
import { Plus, X } from 'lucide-react';
import { optionEnToPercent, percentToOptionEn, type PartFormState } from './admin-part-form';

export type AdminPartEditModalOptionsProps = {
  form: PartFormState;
  setForm: Dispatch<SetStateAction<PartFormState>>;
  optionSlotCount: number;
  setOptionSlotCount: Dispatch<SetStateAction<number>>;
  deleteOptionAndCompact: (index1Based: 1 | 2 | 3) => void;
};

export function AdminPartEditModalOptions({
  form,
  setForm,
  optionSlotCount,
  setOptionSlotCount,
  deleteOptionAndCompact,
}: AdminPartEditModalOptionsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-text-secondary">Options</h4>
        {optionSlotCount < 3 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOptionSlotCount((n) => Math.min(3, n + 1))}
            aria-label="Add option"
          >
            <Plus className="mr-1 inline h-4 w-4" />
            Add option
          </Button>
        )}
      </div>
      {optionSlotCount === 0 ? (
        <p className="text-sm text-text-muted">
          No options. Click &quot;Add option&quot; to add cost options for this part.
        </p>
      ) : (
        <div className="space-y-4">
          {[1, 2, 3].slice(0, optionSlotCount).map((n) => (
            <div
              key={n}
              className="space-y-2 rounded-lg border border-border-light bg-surface-alt/50 p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-secondary">Option {n}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-text-muted hover:text-danger-fg"
                  onClick={() => deleteOptionAndCompact(n as 1 | 2 | 3)}
                  aria-label={`Remove option ${n}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">
                  Description
                </label>
                <textarea
                  value={n === 1 ? form.op_1_desc : n === 2 ? form.op_2_desc : form.op_3_desc}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (n === 1) setForm((f) => ({ ...f, op_1_desc: val }));
                    else if (n === 2) setForm((f) => ({ ...f, op_2_desc: val }));
                    else setForm((f) => ({ ...f, op_3_desc: val }));
                  }}
                  placeholder={`What option ${n} does`}
                  className="min-h-[80px] w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-text-primary"
                  rows={3}
                />
              </div>
              <div className="grid max-w-xs grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-secondary">
                    EN cost {form.percentage ? '(±%)' : ''}
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
                          if (n === 1) setForm((f) => ({ ...f, op_1_en: v }));
                          else if (n === 2) setForm((f) => ({ ...f, op_2_en: v }));
                          else setForm((f) => ({ ...f, op_3_en: v }));
                        }}
                        className="w-full"
                        placeholder="e.g. -12.5"
                      />
                      <span className="shrink-0 text-sm text-text-muted">%</span>
                    </div>
                  ) : (
                    <Input
                      type="number"
                      step="any"
                      value={
                        n === 1
                          ? (form.op_1_en ?? '')
                          : n === 2
                            ? (form.op_2_en ?? '')
                            : (form.op_3_en ?? '')
                      }
                      onChange={(e) => {
                        const v =
                          e.target.value === '' ? undefined : parseFloat(e.target.value) || 0;
                        if (n === 1) setForm((f) => ({ ...f, op_1_en: v }));
                        else if (n === 2) setForm((f) => ({ ...f, op_2_en: v }));
                        else setForm((f) => ({ ...f, op_3_en: v }));
                      }}
                      className="w-full"
                      placeholder="-"
                    />
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-secondary">
                    TP cost
                  </label>
                  <Input
                    type="number"
                    step="any"
                    value={
                      n === 1
                        ? (form.op_1_tp ?? '')
                        : n === 2
                          ? (form.op_2_tp ?? '')
                          : (form.op_3_tp ?? '')
                    }
                    onChange={(e) => {
                      const v = e.target.value === '' ? undefined : parseFloat(e.target.value) || 0;
                      if (n === 1) setForm((f) => ({ ...f, op_1_tp: v }));
                      else if (n === 2) setForm((f) => ({ ...f, op_2_tp: v }));
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
  );
}
