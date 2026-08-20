'use client';

import type { Dispatch, SetStateAction } from 'react';
import { ChipSelect } from '@/components/patterns/filters';
import { Modal, Input, Textarea } from '@/components/ui';
import { AdminCodexCopySourceBanner } from './admin-codex-copy-source-banner';
import { AdminCodexEditModalFooter } from './admin-codex-edit-modal-footer';

export type SkillFormState = {
  name: string;
  description: string;
  abilities: string[];
  baseSkillName: string;
  success_desc: string;
  failure_desc: string;
  ds_calc: string;
  craft_success_desc: string;
  craft_failure_desc: string;
};

export const EMPTY_SKILL_FORM: SkillFormState = {
  name: '',
  description: '',
  abilities: [],
  baseSkillName: '',
  success_desc: '',
  failure_desc: '',
  ds_calc: '',
  craft_success_desc: '',
  craft_failure_desc: '',
};

type AdminSkillEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  copySourceName: string | null;
  editingId: string | null;
  form: SkillFormState;
  setForm: Dispatch<SetStateAction<SkillFormState>>;
  abilityOptions: { value: string; label: string }[];
  baseSkillOptions: { id: string; name: string }[];
  saving: boolean;
  onDelete?: (() => void) | undefined;
  onSave: () => void;
};

export function AdminSkillEditModal({
  isOpen,
  onClose,
  title,
  copySourceName,
  editingId,
  form,
  setForm,
  abilityOptions,
  baseSkillOptions,
  saving,
  onDelete,
  onSave,
}: AdminSkillEditModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="full"
      fullScreenOnMobile
      footer={
        <AdminCodexEditModalFooter
          onDelete={editingId ? onDelete : undefined}
          onClose={onClose}
          onSave={onSave}
          saveDisabled={saving || !form.name.trim()}
          saving={saving}
        />
      }
    >
      <div className="space-y-4">
        <AdminCodexCopySourceBanner copySourceName={copySourceName} entityLabel="skill" />
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">Name *</label>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Skill name"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">Description</label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Skill description"
            className="min-h-[120px] resize-y"
            rows={4}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            Success outcome description
          </label>
          <Textarea
            value={form.success_desc}
            onChange={(e) => setForm((f) => ({ ...f, success_desc: e.target.value }))}
            placeholder="What happens on successes (expandable chip)"
            className="min-h-[100px] resize-y"
            rows={3}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            Failure outcome description
          </label>
          <Textarea
            value={form.failure_desc}
            onChange={(e) => setForm((f) => ({ ...f, failure_desc: e.target.value }))}
            placeholder="What happens on failures (expandable chip)"
            className="min-h-[100px] resize-y"
            rows={3}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            Difficulty score (DS) guidance
          </label>
          <Textarea
            value={form.ds_calc}
            onChange={(e) => setForm((f) => ({ ...f, ds_calc: e.target.value }))}
            placeholder="RM guidance for DS calculation (expandable chip)"
            className="min-h-[100px] resize-y"
            rows={3}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            Craft success description (Craft sub-skills)
          </label>
          <Textarea
            value={form.craft_success_desc}
            onChange={(e) => setForm((f) => ({ ...f, craft_success_desc: e.target.value }))}
            placeholder="Crafting success results"
            className="min-h-[100px] resize-y"
            rows={3}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            Craft failure description (Craft sub-skills)
          </label>
          <Textarea
            value={form.craft_failure_desc}
            onChange={(e) => setForm((f) => ({ ...f, craft_failure_desc: e.target.value }))}
            placeholder="Crafting failure results"
            className="min-h-[100px] resize-y"
            rows={3}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">Ability</label>
          <ChipSelect
            label=""
            placeholder="Choose governing ability"
            options={abilityOptions}
            selectedValues={form.abilities}
            onSelect={(v) => setForm((f) => ({ ...f, abilities: [...f.abilities, v] }))}
            onRemove={(v) =>
              setForm((f) => ({ ...f, abilities: f.abilities.filter((a) => a !== v) }))
            }
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            Base skill (for sub-skills)
          </label>
          <select
            value={form.baseSkillName}
            onChange={(e) => setForm((f) => ({ ...f, baseSkillName: e.target.value }))}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary"
            aria-label="Base skill"
          >
            <option value="">None (base skill)</option>
            <option value="Any">Any base skill (id 0)</option>
            {baseSkillOptions.map((opt) => (
              <option key={opt.id} value={opt.name}>
                {opt.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Modal>
  );
}
