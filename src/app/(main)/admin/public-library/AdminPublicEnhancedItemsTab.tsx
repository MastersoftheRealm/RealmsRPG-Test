/**
 * Admin Official Library — Enhanced Items tab
 * List chrome via OfficialEnhancedList (TASK-575). Create/edit stays in-tab modal.
 */

'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DeleteConfirmModal, OfficialEnhancedList } from '@/components/shared';
import {
  useOfficialLibrary,
  useEnhancedItems,
  useCreateOfficialEnhancedItem,
  useDeleteOfficialEnhancedItem,
  type OfficialEnhancedItem,
  type CreateOfficialEnhancedItemInput,
} from '@/hooks';
import { enhancedItemsKeys } from '@/hooks/use-enhanced-items';
import { apiFetch } from '@/lib/api-client';
import { Button, Modal, Select, Input } from '@/components/ui';
import type { LibraryItem, LibraryPower } from '@/types/library';

/** Edit sends the same body as create to `PATCH ?id=`; POST would insert a second entity. */
function useUpdateOfficialEnhancedItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: CreateOfficialEnhancedItemInput }) =>
      apiFetch(`/api/official/enhanced-items?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enhancedItemsKeys.lists('official') });
    },
  });
}

export function AdminPublicEnhancedItemsTab() {
  const { data: enhanced = [], isLoading, error, refetch } = useEnhancedItems('official');
  const { data: items = [] } = useOfficialLibrary('items');
  const { data: powers = [] } = useOfficialLibrary('powers');

  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [editTarget, setEditTarget] = useState<OfficialEnhancedItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const createMutation = useCreateOfficialEnhancedItem();
  const updateMutation = useUpdateOfficialEnhancedItem();
  const deleteMutation = useDeleteOfficialEnhancedItem();

  return (
    <>
      <OfficialEnhancedList
        items={enhanced}
        isLoading={isLoading}
        error={error}
        onRetry={() => {
          void refetch();
        }}
        errorMessage="Failed to load official enhanced items"
        sectionTitle="Official Enhanced Items"
        emptyTitle="No official enhanced items"
        emptyMessage="Use 'New Enhanced Item' to add one."
        variant="admin"
        onEdit={(id) => {
          const item = enhanced.find((e) => e.id === id);
          if (!item) return;
          setEditTarget(item);
          setIsCreateOpen(true);
        }}
        onDelete={(id, name) => setDeleteConfirm({ id, name })}
        searchTrailing={
          <Button
            size="sm"
            onClick={() => {
              setEditTarget(null);
              setIsCreateOpen(true);
            }}
          >
            New Enhanced Item
          </Button>
        }
      />

      {deleteConfirm && (
        <DeleteConfirmModal
          isOpen
          itemName={deleteConfirm.name}
          itemType="enhanced item"
          deleteContext="Realms Library"
          isDeleting={deleteMutation.isPending}
          onConfirm={async () => {
            await deleteMutation.mutateAsync(deleteConfirm.id);
            setDeleteConfirm(null);
          }}
          onClose={() => setDeleteConfirm(null)}
        />
      )}

      {isCreateOpen && (
        <EnhancedItemEditModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          items={items}
          powers={powers}
          initial={editTarget ?? undefined}
          isSaving={createMutation.isPending || updateMutation.isPending}
          onSave={async (body) => {
            if (editTarget) await updateMutation.mutateAsync({ id: editTarget.id, body });
            else await createMutation.mutateAsync(body);
            setIsCreateOpen(false);
          }}
        />
      )}
    </>
  );
}

type EnhancedEditBody = CreateOfficialEnhancedItemInput;

function EnhancedItemEditModal({
  isOpen,
  onClose,
  items,
  powers,
  initial,
  isSaving,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  items: LibraryItem[];
  powers: LibraryPower[];
  initial?: OfficialEnhancedItem;
  isSaving: boolean;
  onSave: (body: EnhancedEditBody) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [selectedItemId, setSelectedItemId] = useState<string | ''>(initial?.base_item_id ?? '');
  const [selectedPowerId, setSelectedPowerId] = useState<string | ''>(initial?.power_id ?? '');
  const [usesType, setUsesType] = useState<'full' | 'partial' | 'permanent'>(
    (initial?.uses_type as 'full' | 'partial' | 'permanent' | undefined) ?? 'full',
  );
  const [usesCount, setUsesCount] = useState<number>(initial?.uses_count ?? 1);

  const itemOptions = items;
  const powerOptions = powers;

  const handleSubmit = async () => {
    const power = powerOptions.find((p) => String(p.id) === selectedPowerId);
    const item = itemOptions.find((i) => String(i.id) === selectedItemId);
    if (!power || !item || !name.trim()) return;

    const body: EnhancedEditBody = {
      name: name.trim(),
      description: description || undefined,
      baseItemSource: 'public',
      baseItemId: String(item.id),
      baseItemName: String(item.name ?? ''),
      baseItemDescription: String(item.description ?? ''),
      powerSource: 'official',
      powerId: String(power.id),
      powerName: String(power.name ?? ''),
      powerEnergy: Number((power as { energy?: unknown }).energy ?? 0),
      usesType,
      usesCount: usesType === 'permanent' ? undefined : usesCount,
    };

    await onSave(body);
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'Edit Enhanced Item' : 'New Enhanced Item'}
      size="full"
      fullScreenOnMobile
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="E.g. Ring of Echoed Flame"
            aria-label="Enhanced item name"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">Description</label>
          <Input
            value={description ?? ''}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description"
            aria-label="Enhanced item description"
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[220px] flex-1">
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Base item (official)
            </label>
            <Select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              aria-label="Select base item from official items"
              placeholder="Select base item"
              options={itemOptions.map((i) => ({
                value: String(i.id),
                label: String(i.name ?? ''),
              }))}
            />
          </div>
          <div className="min-w-[220px] flex-1">
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Power (official)
            </label>
            <Select
              value={selectedPowerId}
              onChange={(e) => setSelectedPowerId(e.target.value)}
              aria-label="Select power from official powers"
              placeholder="Select power"
              options={powerOptions.map((p) => ({
                value: String(p.id),
                label: String(p.name ?? ''),
              }))}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Recovery</label>
            <Select
              value={usesType}
              onChange={(e) => setUsesType(e.target.value as 'full' | 'partial' | 'permanent')}
              aria-label="Uses recovery type"
              options={[
                { value: 'full', label: 'Full' },
                { value: 'partial', label: 'Partial' },
                { value: 'permanent', label: 'Permanent' },
              ]}
            />
          </div>
          {usesType !== 'permanent' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-text-secondary">
                Uses per {usesType === 'full' ? 'Full' : 'Partial'} Recovery
              </label>
              <Input
                type="number"
                min={1}
                value={usesCount}
                onChange={(e) => setUsesCount(Number(e.target.value) || 1)}
                className="w-24"
                aria-label="Uses per recovery"
              />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving || !name.trim() || !selectedItemId || !selectedPowerId}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
