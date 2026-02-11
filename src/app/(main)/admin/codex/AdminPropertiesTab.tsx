'use client';

import { useMemo, useState } from 'react';
import {
  SectionHeader,
  SearchInput,
  LoadingState,
  ErrorDisplay as ErrorState,
  GridListRow,
  ListEmptyState as EmptyState,
  SortHeader,
} from '@/components/shared';
import { Modal, Button, Input } from '@/components/ui';
import { SelectFilter, FilterSection } from '@/components/codex';
import { useItemProperties, type ItemProperty } from '@/hooks';
import { useSort } from '@/hooks/use-sort';
import { useQueryClient } from '@tanstack/react-query';
import { createCodexDoc, updateCodexDoc, deleteCodexDoc } from './actions';
import { Pencil, Trash2 } from 'lucide-react';
import { IconButton } from '@/components/ui';

const PROPERTY_GRID_COLUMNS = '1.5fr 1fr 0.8fr 0.8fr 0.8fr 80px';

interface PropertyFilters {
  search: string;
  typeFilter: string;
}

export function AdminPropertiesTab() {
  const { data: properties, isLoading, error } = useItemProperties();
  const queryClient = useQueryClient();
  const { sortState, handleSort } = useSort('name');
  const [filters, setFilters] = useState<PropertyFilters>({
    search: '',
    typeFilter: '',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string; description: string; type?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [form, setForm] = useState({ name: '', description: '', type: 'general' });

  const typeOptions = useMemo(() => {
    if (!properties) return [] as string[];
    const types = new Set<string>();
    properties.forEach((p: ItemProperty) => p.type && types.add(p.type));
    return Array.from(types).sort();
  }, [properties]);

  const filteredProperties = useMemo(() => {
    if (!properties) return [];

    const filtered = properties.filter((p: ItemProperty) => {
      if (
        filters.search &&
        !p.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !p.description?.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }
      if (filters.typeFilter && p.type !== filters.typeFilter) return false;
      return true;
    });

    return filtered.sort((a: ItemProperty, b: ItemProperty) => {
      const { col, dir } = sortState;
      if (col === 'name') return dir * a.name.localeCompare(b.name);
      if (col === 'type') return dir * (a.type || 'general').localeCompare(b.type || 'general');
      if (col === 'ip') return dir * ((a.base_ip ?? 0) - (b.base_ip ?? 0));
      if (col === 'tp') return dir * ((a.base_tp ?? a.tp_cost ?? 0) - (b.base_tp ?? b.tp_cost ?? 0));
      if (col === 'cost') return dir * ((a.base_c ?? a.gold_cost ?? 0) - (b.base_c ?? b.gold_cost ?? 0));
      return 0;
    });
  }, [properties, filters, sortState]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', description: '', type: 'general' });
    setModalOpen(true);
  };

  const openEdit = (p: { id: string; name: string; description: string; type?: string }) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description || '', type: (p.type as string) || 'general' });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setDeleteConfirm(null);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const data = { name: form.name.trim(), description: form.description.trim(), type: form.type };

    const id = form.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '').slice(0, 100) || `prop_${Date.now()}`;

    const result = editing ? await updateCodexDoc('codex_properties', editing.id, data) : await createCodexDoc('codex_properties', id, data);

    setSaving(false);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['codex'] });
      closeModal();
    } else {
      alert(result.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      return;
    }
    const result = await deleteCodexDoc('codex_properties', id);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['codex'] });
      closeModal();
    } else {
      alert(result.error);
    }
  };

  if (error) return <ErrorState message="Failed to load properties" />;

  return (
    <div>
      <SectionHeader title="Armament Properties" onAdd={openAdd} size="md" />
      <div className="mb-4 mt-2">
        <SearchInput
          value={filters.search}
          onChange={(v) => setFilters(f => ({ ...f, search: v }))}
          placeholder="Search properties..."
        />
      </div>

      <FilterSection>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SelectFilter
            label="Type"
            value={filters.typeFilter}
            options={typeOptions.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
            onChange={(v) => setFilters(f => ({ ...f, typeFilter: v }))}
            placeholder="All Types"
          />
        </div>
      </FilterSection>

      <div
        className="hidden lg:grid gap-2 px-4 py-3 bg-primary-50 border-b border-border-light rounded-t-lg font-semibold text-sm text-primary-700"
        style={{ gridTemplateColumns: PROPERTY_GRID_COLUMNS }}
      >
        <SortHeader label="NAME" col="name" sortState={sortState} onSort={handleSort} />
        <SortHeader label="TYPE" col="type" sortState={sortState} onSort={handleSort} />
        <SortHeader label="ITEM PTS" col="ip" sortState={sortState} onSort={handleSort} />
        <SortHeader label="TP" col="tp" sortState={sortState} onSort={handleSort} />
        <SortHeader label="COST MULT" col="cost" sortState={sortState} onSort={handleSort} />
      </div>

      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="flex flex-col gap-1 mt-2">
          {filteredProperties.length === 0 ? (
            <EmptyState
              title="No properties found"
              description="No properties match your filters."
              action={{ label: 'Add Property', onClick: openAdd }}
              size="sm"
            />
          ) : (
            filteredProperties.map((p: ItemProperty) => (
              <div key={p.id} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <GridListRow
                    id={p.id}
                    name={p.name}
                    description={p.description || ''}
                    gridColumns={PROPERTY_GRID_COLUMNS}
                    columns={[
                      { key: 'Type', value: (p.type || 'general') as string },
                      { key: 'IP', value: p.base_ip && p.base_ip > 0 ? String(p.base_ip) : '-', className: 'text-blue-600' },
                      {
                        key: 'TP',
                        value: (p.base_tp ?? p.tp_cost ?? 0) > 0 ? String(p.base_tp ?? p.tp_cost ?? 0) : '-',
                        className: 'text-tp',
                      },
                      {
                        key: 'Cost',
                        value: (p.base_c ?? p.gold_cost ?? 0) > 0 ? `×${p.base_c ?? p.gold_cost ?? 0}` : '-',
                      },
                    ]}
                  />
                </div>
                <div className="flex gap-1 shrink-0 pr-2">
                  <IconButton variant="ghost" size="sm" onClick={() => openEdit(p)} label="Edit">
                    <Pencil className="w-4 h-4" />
                  </IconButton>
                  <IconButton
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(p)}
                    label="Delete"
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </IconButton>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit Property' : 'Add Property'} size="lg"
        footer={
          <div className="flex justify-between">
            <div>
              {editing && (
                <Button variant="outline" onClick={() => handleDelete(editing.id)} className={deleteConfirm === editing.id ? 'border-red-500 text-red-600' : ''}>
                  {deleteConfirm === editing.id ? 'Click again to confirm delete' : 'Delete'}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={closeModal}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Name *</label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Property name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Property description" className="w-full min-h-[80px] px-3 py-2 rounded-md border border-border bg-background text-text-primary" rows={3} />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 rounded-md border border-border bg-background text-text-primary">
              <option value="general">General</option>
              <option value="weapon">Weapon</option>
              <option value="armor">Armor</option>
              <option value="shield">Shield</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
