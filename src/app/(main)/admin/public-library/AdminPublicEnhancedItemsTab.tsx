'use client';

import { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import {
  SectionHeader,
  SearchInput,
  ListHeader,
  LoadingState,
  ErrorDisplay,
  GridListRow,
  ListEmptyState,
  DeleteConfirmModal,
} from '@/components/shared';
import { useOfficialLibrary } from '@/hooks';
import {
  useOfficialEnhancedItems,
  useCreateOfficialEnhancedItem,
  useDeleteOfficialEnhancedItem,
  type OfficialEnhancedItem,
} from '@/hooks/use-official-enhanced-items';
import { useSort } from '@/hooks/use-sort';
import { Button, Modal, Select, Input } from '@/components/ui';

const GRID = '1.6fr 1.3fr 1.3fr 0.9fr 0.9fr 0.9fr 40px';

export function AdminPublicEnhancedItemsTab() {
  const { data: enhanced = [], isLoading, error } = useOfficialEnhancedItems();
  const { data: items = [] } = useOfficialLibrary('items');
  const { data: powers = [] } = useOfficialLibrary('powers');

  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<OfficialEnhancedItem | null>(null);
  const [editTarget, setEditTarget] = useState<OfficialEnhancedItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const createMutation = useCreateOfficialEnhancedItem();
  const deleteMutation = useDeleteOfficialEnhancedItem();
  const { sortState, handleSort, sortItems } = useSort('name');

  const filtered = useMemo(() => {
    let list = [...enhanced];
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(s) ||
          e.base_item_name.toLowerCase().includes(s) ||
          e.power_name.toLowerCase().includes(s)
      );
    }
    return sortItems(list);
  }, [enhanced, search, sortItems]);

  if (error) {
    return <ErrorDisplay message="Failed to load official enhanced items" />;
  }

  return (
    <div>
      <SectionHeader title="Official Enhanced Items" size="md" />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name, base item, or power..."
          />
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditTarget(null);
            setIsCreateOpen(true);
          }}
        >
          New Enhanced Item
        </Button>
      </div>

      <ListHeader
        columns={[
          { key: 'name', label: 'NAME' },
          { key: 'base', label: 'BASE ITEM' },
          { key: 'power', label: 'POWER' },
          { key: 'rarity', label: 'RARITY' },
          { key: 'cost', label: 'COST (C)' },
          { key: 'uses', label: 'USES', sortable: false },
          { key: '_actions', label: '', sortable: false as const },
        ]}
        gridColumns={GRID}
        sortState={sortState}
        onSort={handleSort}
      />

      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <ListEmptyState
            icon={<Sparkles className="w-8 h-8" />}
            title="No official enhanced items"
            message="Use 'New Enhanced Item' to add one."
          />
        ) : (
          filtered.map((e) => (
            <GridListRow
              key={e.id}
              id={e.id}
              name={e.name}
              description={e.description ?? undefined}
              gridColumns={GRID}
              columns={[
                { key: 'Base', value: e.base_item_name },
                { key: 'Power', value: e.power_name },
                { key: 'Rarity', value: e.rarity },
                { key: 'Cost', value: e.currency_cost, align: 'right' },
                {
                  key: 'Uses',
                  value:
                    e.uses_type === 'permanent'
                      ? 'Permanent'
                      : `${e.uses_count ?? 1} / ${
                          e.uses_type === 'full' ? 'Full' : 'Partial'
                        }`,
                  align: 'right',
                },
              ]}
              badges={[{ label: 'Enhanced', color: 'purple' }]}
              onEdit={() => {
                setEditTarget(e);
                setIsCreateOpen(true);
              }}
              onDelete={() => setDeleteConfirm(e)}
            />
          ))
        )}
      </div>

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
          onSave={async (body) => {
            await createMutation.mutateAsync(body);
            setIsCreateOpen(false);
          }}
        />
      )}
    </div>
  );
}

type EnhancedEditBody = {
  name: string;
  description?: string;
  baseItemSource: 'codex' | 'public' | 'custom';
  baseItemId?: string;
  baseItemName: string;
  baseItemDescription?: string;
  powerSource: 'official' | 'public' | 'library';
  powerId: string;
  powerName: string;
  powerEnergy: number;
  usesType: 'full' | 'partial' | 'permanent';
  usesCount?: number;
};

function EnhancedItemEditModal({
  isOpen,
  onClose,
  items,
  powers,
  initial,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  items: Array<Record<string, unknown>>;
  powers: Array<Record<string, unknown>>;
  initial?: OfficialEnhancedItem;
  onSave: (body: EnhancedEditBody) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [selectedItemId, setSelectedItemId] = useState<string | ''>('');
  const [selectedPowerId, setSelectedPowerId] = useState<string | ''>('');
  const [usesType, setUsesType] = useState<'full' | 'partial' | 'permanent'>(
    (initial?.uses_type as 'full' | 'partial' | 'permanent' | undefined) ?? 'full'
  );
  const [usesCount, setUsesCount] = useState<number>(initial?.uses_count ?? 1);

  const itemOptions = items as Array<{
    id?: unknown;
    name?: unknown;
    description?: unknown;
    currency?: unknown;
    rarity?: unknown;
  }>;
  const powerOptions = powers as Array<{
    id?: unknown;
    name?: unknown;
    description?: unknown;
    energy?: unknown;
  }>;

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
      size="lg"
      fullScreenOnMobile
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Name
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="E.g. Ring of Echoed Flame"
            aria-label="Enhanced item name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Description
          </label>
          <Input
            value={description ?? ''}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description"
            aria-label="Enhanced item description"
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-sm font-medium text-text-secondary mb-1">
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
          <div className="flex-1 min-w-[220px]">
            <label className="block text-sm font-medium text-text-secondary mb-1">
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
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Recovery
            </label>
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
              <label className="block text-sm font-medium text-text-secondary mb-1">
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
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}

