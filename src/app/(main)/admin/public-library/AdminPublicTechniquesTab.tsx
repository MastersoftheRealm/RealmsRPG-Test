/**
 * Admin Public Library — Techniques tab
 */

'use client';

import { useState, useMemo } from 'react';
import {
  SectionHeader,
  SearchInput,
  ListHeader,
  LoadingState,
  ErrorDisplay,
  GridListRow,
  ListEmptyState,
} from '@/components/shared';
import { Modal, Button, Input, Textarea } from '@/components/ui';
import { usePublicLibrary } from '@/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { useSort } from '@/hooks/use-sort';
import { Swords } from 'lucide-react';

const GRID = '1.5fr 0.8fr 0.8fr 80px';
const QUERY_KEY = ['public-library', 'techniques'] as const;

export function AdminPublicTechniquesTab() {
  const queryClient = useQueryClient();
  const { data: items = [], isLoading, error } = usePublicLibrary('techniques');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string; data: Record<string, unknown> } | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [jsonBody, setJsonBody] = useState('{}');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { sortState, handleSort, sortItems } = useSort('name');

  const filtered = useMemo(() => {
    let list = items as Array<Record<string, unknown>>;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((p: Record<string, unknown>) =>
        String(p.name ?? '').toLowerCase().includes(s) || String(p.description ?? '').toLowerCase().includes(s)
      );
    }
    return sortItems(list.map((p: Record<string, unknown>) => ({ ...p, name: String(p.name ?? '') })));
  }, [items, search, sortItems]);

  const openAdd = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setJsonBody('{}');
    setModalOpen(true);
  };

  const openEdit = (item: Record<string, unknown>) => {
    const id = String(item.id ?? item.docId ?? '');
    const data = { ...item } as Record<string, unknown>;
    delete data.id;
    delete data.docId;
    delete data._source;
    setEditing({ id, name: String(item.name ?? ''), data });
    setName(String(item.name ?? ''));
    setDescription(String(item.description ?? ''));
    setJsonBody(JSON.stringify(data, null, 2));
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setDeleteId(null);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(jsonBody || '{}') as Record<string, unknown>;
      } catch {
        alert('Invalid JSON in document body.');
        setSaving(false);
        return;
      }
      payload.name = name.trim();
      payload.description = description.trim();
      if (editing) payload.id = editing.id;

      const res = await fetch(`/api/public/techniques`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || res.statusText);
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      closeModal();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editing) return;
    if (deleteId !== editing.id) {
      setDeleteId(editing.id);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/public/techniques?id=${encodeURIComponent(editing.id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      closeModal();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete');
    } finally {
      setSaving(false);
    }
  };

  if (error) return <ErrorDisplay message="Failed to load public techniques" />;

  return (
    <div>
      <SectionHeader title="Public Techniques" onAdd={openAdd} size="md" />
      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search techniques..." />
      </div>
      <ListHeader
        columns={[
          { key: 'name', label: 'NAME' },
          { key: 'energy', label: 'ENERGY', sortable: false as const },
          { key: 'weapon', label: 'WEAPON', sortable: false as const },
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
          <ListEmptyState icon={<Swords className="w-8 h-8" />} title="No public techniques" message="Add one from the header or publish from a creator." />
        ) : (
          filtered.map((p: Record<string, unknown>) => (
            <GridListRow
              key={String(p.id ?? p.docId)}
              id={String(p.id ?? p.docId)}
              name={String(p.name ?? '')}
              description={String(p.description ?? '')}
              gridColumns={GRID}
              columns={[
                { key: 'Energy', value: String(p.energy ?? '-'), highlight: true },
                { key: 'Weapon', value: String(p.weapon ?? '-') },
              ]}
              onEdit={() => openEdit(p)}
            />
          ))
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit Public Technique' : 'Add Public Technique'}>
        <div className="space-y-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Technique name" />
          <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" rows={2} />
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Document (JSON)</label>
            <Textarea value={jsonBody} onChange={(e) => setJsonBody(e.target.value)} className="font-mono text-sm" rows={12} placeholder="{}" />
          </div>
          <div className="flex justify-between pt-2">
            <div>
              {editing && (
                <Button variant="outline" onClick={handleDelete} disabled={saving}>
                  {deleteId === editing.id ? 'Confirm delete?' : 'Delete'}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={closeModal}>Cancel</Button>
              <Button variant="primary" onClick={handleSave} disabled={saving}>Save</Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
