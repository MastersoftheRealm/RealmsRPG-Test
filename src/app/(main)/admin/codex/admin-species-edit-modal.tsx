'use client';

import { useMemo, useState } from 'react';
import { ChipSelect } from '@/components/patterns/filters';
import {
  GridListRow,
  RealmsImageField,
  UnifiedSelectionModal,
  type SelectableItem,
  type SelectionColumnHeader,
} from '@/components/patterns';
import { Modal, Button, Input, Textarea, IconButton } from '@/components/ui';
import type { Skill, Trait } from '@/hooks';
import { Plus, X } from 'lucide-react';
import { formatListCellLabel } from '@/lib/utils';
import {
  TRAIT_PICKER_TITLES,
  type SpeciesFormState,
  type TraitPickerField,
} from './admin-species-form';

const TRAIT_PICKER_GRID = '1.5fr 0.6fr 0.6fr';
const TRAIT_PICKER_COLUMNS: SelectionColumnHeader[] = [
  { key: 'name', label: 'NAME' },
  { key: 'uses_per_rec', label: 'USES' },
  { key: 'rec_period', label: 'RECOVERY' },
];

export type AdminSpeciesEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  copySourceName: string | null;
  editingId: string | null;
  form: SpeciesFormState;
  setForm: React.Dispatch<React.SetStateAction<SpeciesFormState>>;
  skills: Skill[];
  traits: Trait[];
  saving: boolean;
  deleteConfirm: string | null;
  onRequestDelete: () => void;
  onSave: () => void;
};

export function AdminSpeciesEditModal({
  isOpen,
  onClose,
  title,
  copySourceName,
  editingId,
  form,
  setForm,
  skills,
  traits,
  saving,
  deleteConfirm,
  onRequestDelete,
  onSave,
}: AdminSpeciesEditModalProps) {
  const [traitPickerFor, setTraitPickerFor] = useState<TraitPickerField | null>(null);

  const skillOptions = useMemo(
    () => skills.map((s) => ({ value: String(s.id), label: s.name })),
    [skills],
  );

  const traitIdToTrait = useMemo(() => new Map(traits.map((t) => [String(t.id), t])), [traits]);

  const traitPickerAlreadyIds = traitPickerFor ? form[traitPickerFor] : null;
  const traitPickerItems = useMemo((): SelectableItem[] => {
    if (!traitPickerFor || !traitPickerAlreadyIds) return [];
    const already = new Set(traitPickerAlreadyIds.map(String));
    return traits
      .filter((t) => !already.has(String(t.id)))
      .map((t) => ({
        id: String(t.id),
        name: t.name,
        description: t.description ?? '',
        columns: [
          {
            key: 'uses_per_rec',
            value: t.uses_per_rec != null && t.uses_per_rec > 0 ? String(t.uses_per_rec) : '-',
            align: 'center' as const,
          },
          {
            key: 'rec_period',
            value: t.rec_period ? formatListCellLabel(t.rec_period) : '-',
            align: 'center' as const,
          },
        ],
        data: t,
      }));
  }, [traitPickerFor, traitPickerAlreadyIds, traits]);

  const addTraitsFromPicker = (selected: SelectableItem[]) => {
    if (!traitPickerFor || selected.length === 0) return;
    const field = traitPickerFor;
    const ids = selected.map((s) => String(s.id));
    setForm((f) => {
      const existing = new Set(f[field].map(String));
      return {
        ...f,
        [field]: [...f[field], ...ids.filter((id) => !existing.has(id))],
      };
    });
    setTraitPickerFor(null);
  };

  const handleClose = () => {
    setTraitPickerFor(null);
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
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
                      ? 'border-danger-500 text-danger-700 dark:text-danger-400'
                      : ''
                  }
                >
                  {deleteConfirm === editingId ? 'Click again to confirm delete' : 'Delete'}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={onSave} disabled={saving || !form.name.trim()}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {copySourceName && (
            <p className="rounded-md border border-border-light bg-surface-alt px-3 py-2 text-sm text-text-secondary">
              Creating a copy of <strong className="text-text-primary">{copySourceName}</strong>.
              Change the name and details as needed, then save to add the new species.
            </p>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Name *</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Species name"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Description
            </label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Species description"
              className="min-h-[120px] resize-y"
              rows={4}
            />
          </div>
          <RealmsImageField
            categories="species"
            imageId={form.imageId}
            imageUrl={form.imageUrl}
            onChange={({ imageId, imageUrl }) => setForm((f) => ({ ...f, imageId, imageUrl }))}
            entityName={form.name}
            label="Species card art"
            hint="Shown on guided creator species cards and the ancestry overview."
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-secondary">Type</label>
              <Input
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                placeholder="e.g. Humanoid"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-secondary">
                All Sizes (comma-separated)
              </label>
              <Input
                value={form.sizes}
                onChange={(e) => setForm((f) => ({ ...f, sizes: e.target.value }))}
                placeholder="Small, Medium, Large"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-secondary">
                Languages (comma-separated)
              </label>
              <Input
                value={form.languages}
                onChange={(e) => setForm((f) => ({ ...f, languages: e.target.value }))}
                placeholder="Universal, Any, ..."
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex min-h-11 cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isStarter}
                  onChange={(e) => setForm((f) => ({ ...f, isStarter: e.target.checked }))}
                  className="rounded border-border"
                />
                <span className="text-sm font-medium text-text-primary">
                  Starter species (guided creator)
                </span>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-secondary">
                Average Height (cm)
              </label>
              <Input
                type="number"
                min={0}
                value={form.aveHeight}
                onChange={(e) => setForm((f) => ({ ...f, aveHeight: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-secondary">
                Average Weight (kg)
              </label>
              <Input
                type="number"
                min={0}
                value={form.aveWeight}
                onChange={(e) => setForm((f) => ({ ...f, aveWeight: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-secondary">
                Adulthood Age
              </label>
              <Input
                type="number"
                min={0}
                value={form.adultAge}
                onChange={(e) => setForm((f) => ({ ...f, adultAge: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-secondary">Max Age</label>
              <Input
                type="number"
                min={0}
                value={form.maxAge}
                onChange={(e) => setForm((f) => ({ ...f, maxAge: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Species Skills
            </label>
            <ChipSelect
              label=""
              placeholder="Choose skills"
              options={skillOptions}
              selectedValues={form.skillIds}
              onSelect={(v) => setForm((f) => ({ ...f, skillIds: [...f.skillIds, v] }))}
              onRemove={(v) =>
                setForm((f) => ({ ...f, skillIds: f.skillIds.filter((id) => id !== v) }))
              }
            />
          </div>
          {(['speciesTraitIds', 'ancestryTraitIds', 'flawIds', 'characteristicIds'] as const).map(
            (key) => {
              const label =
                key === 'speciesTraitIds'
                  ? 'Species Traits'
                  : key === 'ancestryTraitIds'
                    ? 'Ancestry Traits'
                    : key === 'flawIds'
                      ? 'Flaws'
                      : 'Characteristics';
              const ids = form[key];
              return (
                <div key={key}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <label className="block text-sm font-medium text-text-secondary">{label}</label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTraitPickerFor(key)}
                      aria-label={`Add ${label}`}
                    >
                      <Plus className="mr-1 inline h-4 w-4" />
                      Add
                    </Button>
                  </div>
                  <div className="min-h-[44px] overflow-hidden rounded-lg border border-border-light bg-surface-alt">
                    {ids.length === 0 ? (
                      <p className="p-3 text-sm text-text-muted">
                        None. Click Add to choose traits.
                      </p>
                    ) : (
                      ids.map((id) => {
                        const t = traitIdToTrait.get(id);
                        return (
                          <GridListRow
                            key={id}
                            id={id}
                            name={t?.name ?? id}
                            description={t?.description ?? ''}
                            gridColumns="1fr 44px"
                            columns={[]}
                            rightSlot={
                              <IconButton
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setForm((f) => ({ ...f, [key]: f[key].filter((x) => x !== id) }))
                                }
                                label={`Remove ${t?.name ?? id}`}
                                aria-label={`Remove ${t?.name ?? id}`}
                              >
                                <X className="h-4 w-4" />
                              </IconButton>
                            }
                          />
                        );
                      })
                    )}
                  </div>
                </div>
              );
            },
          )}
        </div>
      </Modal>

      <UnifiedSelectionModal
        isOpen={traitPickerFor !== null}
        onClose={() => setTraitPickerFor(null)}
        title={traitPickerFor ? TRAIT_PICKER_TITLES[traitPickerFor] : 'Add Trait'}
        description="Traits already on this species field are hidden."
        items={traitPickerItems}
        onConfirm={addTraitsFromPicker}
        columns={TRAIT_PICKER_COLUMNS}
        gridColumns={TRAIT_PICKER_GRID}
        itemLabel="trait"
        emptyMessage="No traits found"
        emptySubMessage="Try adjusting your search, or add traits in the Traits admin tab first."
        searchPlaceholder="Search traits..."
        searchFields={['name', 'description']}
        confirmLabel="Add Selected"
        size="lg"
      />
    </>
  );
}
