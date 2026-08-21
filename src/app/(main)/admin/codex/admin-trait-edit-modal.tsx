'use client';

import type { Dispatch, SetStateAction } from 'react';
import {
  ListHeader,
  GridListRow,
  gridColumnsWithInlineSelection,
  type SortState,
} from '@/components/patterns';
import { Modal, Button, Input, Textarea, SearchInput } from '@/components/ui';
import type { Trait } from '@/hooks';
import { Plus } from 'lucide-react';
import type { TraitFormState } from './admin-trait-form';
import { AdminCodexCopySourceBanner } from './admin-codex-copy-source-banner';
import { AdminCodexEditModalFooter } from './admin-codex-edit-modal-footer';

const CHOICE_TRAIT_GRID = '1.5fr 0.6fr 0.6fr';

export type AdminTraitEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  copySourceName: string | null;
  editingId: string | null;
  form: TraitFormState;
  setForm: Dispatch<SetStateAction<TraitFormState>>;
  sortedChoiceTraits: Trait[];
  choiceSearch: string;
  setChoiceSearch: (v: string) => void;
  choiceSortState: SortState;
  handleChoiceSort: (col: string) => void;
  saving: boolean;
  onDelete?: (() => void) | undefined;
  onSave: () => void;
  onOpenCreateTrait: () => void;
};

export function AdminTraitEditModal({
  isOpen,
  onClose,
  title,
  copySourceName,
  editingId,
  form,
  setForm,
  sortedChoiceTraits,
  choiceSearch,
  setChoiceSearch,
  choiceSortState,
  handleChoiceSort,
  saving,
  onDelete,
  onSave,
  onOpenCreateTrait,
}: AdminTraitEditModalProps) {
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
        <AdminCodexCopySourceBanner copySourceName={copySourceName} entityLabel="trait" />
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">Name *</label>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Trait name"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">Description</label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Trait description"
            className="min-h-[120px] resize-y"
            rows={4}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Uses per Recovery
            </label>
            <Input
              type="number"
              min={0}
              value={form.uses_per_rec}
              onChange={(e) => setForm((f) => ({ ...f, uses_per_rec: e.target.value }))}
              placeholder="No value"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Recovery Period
            </label>
            <select
              value={form.rec_period}
              onChange={(e) => setForm((f) => ({ ...f, rec_period: e.target.value }))}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-text-primary"
              aria-label="Recovery period"
            >
              <option value="">None</option>
              <option value="Full">Full</option>
              <option value="Partial">Partial</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.flaw}
              onChange={(e) => setForm((f) => ({ ...f, flaw: e.target.checked }))}
            />
            <span className="text-sm text-text-secondary">Flaw</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.characteristic}
              onChange={(e) => setForm((f) => ({ ...f, characteristic: e.target.checked }))}
            />
            <span className="text-sm text-text-secondary">Characteristic</span>
          </label>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <label className="block text-sm font-medium text-text-secondary">
              Choice trait options
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenCreateTrait}
              aria-label="Create trait and add to options"
            >
              <Plus className="mr-1 inline h-4 w-4" />
              Create trait and add
            </Button>
          </div>
          <p className="mb-2 text-xs text-text-muted">
            When set, this trait becomes a choice trait: the player selects it then picks one option
            from this list. Expand rows to see descriptions.
          </p>
          {/* DESIGN_INTENT: choice options = inline editor chrome (not nested USM). TASK-572 */}
          <SearchInput
            value={choiceSearch}
            onChange={setChoiceSearch}
            placeholder="Search traits to add as options..."
            className="mb-2"
          />
          <ListHeader
            columns={[
              { key: 'name', label: 'NAME' },
              { key: 'uses_per_rec', label: 'USES' },
              { key: 'rec_period', label: 'RECOVERY' },
            ]}
            gridColumns={CHOICE_TRAIT_GRID}
            sortState={choiceSortState}
            onSort={handleChoiceSort}
            hasSelectionColumn
          />
          <div className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-surface-alt">
            {sortedChoiceTraits.length === 0 ? (
              <p className="p-4 text-center text-sm text-text-muted">
                No other traits to add. Create traits first or adjust search.
              </p>
            ) : (
              sortedChoiceTraits.map((t: Trait) => {
                const isSelected = form.option_trait_ids.includes(t.id);
                return (
                  <GridListRow
                    key={t.id}
                    id={t.id}
                    name={t.name}
                    description={t.description || ''}
                    gridColumns={gridColumnsWithInlineSelection(CHOICE_TRAIT_GRID)}
                    columns={[
                      { key: 'Uses', value: t.uses_per_rec != null ? String(t.uses_per_rec) : '-' },
                      { key: 'Recovery', value: t.rec_period || '-' },
                    ]}
                    selectable
                    isSelected={isSelected}
                    onSelect={() => {
                      if (isSelected)
                        setForm((f) => ({
                          ...f,
                          option_trait_ids: f.option_trait_ids.filter((id) => id !== t.id),
                        }));
                      else
                        setForm((f) => ({
                          ...f,
                          option_trait_ids: [...f.option_trait_ids, t.id],
                        }));
                    }}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export type AdminTraitCreateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  form: { name: string; description: string };
  setForm: Dispatch<SetStateAction<{ name: string; description: string }>>;
  creating: boolean;
  onCreate: () => void;
};

export function AdminTraitCreateModal({
  isOpen,
  onClose,
  form,
  setForm,
  creating,
  onCreate,
}: AdminTraitCreateModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create trait and add to options"
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button size="lg" onClick={onCreate} disabled={creating || !form.name.trim()}>
            {creating ? 'Creating...' : 'Create and add'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">Name *</label>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Trait name"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">Description</label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Trait description"
            className="min-h-[100px] resize-y"
            rows={3}
          />
        </div>
      </div>
    </Modal>
  );
}
