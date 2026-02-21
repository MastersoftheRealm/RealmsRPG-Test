/**
 * Admin Public Library — Creatures tab
 * List (name, level, type) + structured edit modal. Row delete with confirm.
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
  DeleteConfirmModal,
} from '@/components/shared';
import { usePublicLibrary } from '@/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { useSort } from '@/hooks/use-sort';
import { Users } from 'lucide-react';
import { PublicCreatureEditModal } from './PublicCreatureEditModal';

const CREATURE_GRID = '1.5fr 0.8fr 1fr 40px';
const QUERY_KEY = ['public-library', 'creatures'] as const;

export function AdminPublicCreaturesTab() {
  const queryClient = useQueryClient();
  const { data: items = [], isLoading, error } = usePublicLibrary('creatures');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string; data: Record<string, unknown> } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const { sortState, handleSort, sortItems } = useSort('name');

  const cardData = useMemo(() => {
    return (items as Array<Record<string, unknown>>).map((c) => ({
      id: String(c.id ?? c.docId ?? ''),
      raw: c,
      name: String(c.name ?? ''),
      description: String(c.description ?? ''),
      level: Number(c.level ?? 0),
      type: String(c.type ?? ''),
    }));
  }, [items]);

  const filtered = useMemo(() => {
    let r = cardData;
    if (search) {
      const s = search.toLowerCase();
      r = r.filter(
        (x) =>
          String(x.name ?? '').toLowerCase().includes(s) ||
          String(x.type ?? '').toLowerCase().includes(s) ||
          String(x.description ?? '').toLowerCase().includes(s)
      );
    }
    return sortItems(r);
  }, [cardData, search, sortItems]);

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (item: (typeof cardData)[0]) => {
    const data = { ...item.raw } as Record<string, unknown>;
    delete data.id;
    delete data.docId;
    delete data._source;
    setEditing({ id: item.id, name: item.name, data });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setDeleteId(null);
  };

  const handleSave = async (payload: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/public/creatures`, {
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

  const handleDeleteFromModal = () => {
    if (!editing) return;
    if (deleteId !== editing.id) {
      setDeleteId(editing.id);
      return;
    }
    setSaving(true);
    fetch(`/api/public/creatures?id=${encodeURIComponent(editing.id)}`, { method: 'DELETE' })
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        closeModal();
      })
      .catch((e) => alert(e instanceof Error ? e.message : 'Failed to delete'))
      .finally(() => setSaving(false));
  };

  const handleDeleteFromList = async () => {
    if (!deleteConfirm) return;
    try {
      const res = await fetch(`/api/public/creatures?id=${encodeURIComponent(deleteConfirm.id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(res.statusText);
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setDeleteConfirm(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  if (error) return <ErrorDisplay message="Failed to load public creatures" />;

  return (
    <div>
      <SectionHeader title="Public Creatures" onAdd={openAdd} size="md" />
      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search creatures..." />
      </div>
      <ListHeader
        columns={[
          { key: 'name', label: 'NAME' },
          { key: 'level', label: 'LEVEL', sortable: false as const },
          { key: 'type', label: 'TYPE', sortable: false as const },
          { key: '_actions', label: '', sortable: false as const },
        ]}
        gridColumns={CREATURE_GRID}
        sortState={sortState}
        onSort={handleSort}
      />
      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <ListEmptyState
            icon={<Users className="w-8 h-8" />}
            title="No public creatures"
            message="Add one from the header or publish from a creator."
          />
        ) : (
          filtered.map((c) => (
            <GridListRow
              key={c.id}
              id={c.id}
              name={c.name}
              description={c.description}
              gridColumns={CREATURE_GRID}
              columns={[
                { key: 'Level', value: c.level, highlight: true },
                { key: 'Type', value: c.type },
              ]}
              onEdit={() => openEdit(c)}
              onDelete={() => setDeleteConfirm({ id: c.id, name: c.name })}
            />
          ))
        )}
      </div>

      <PublicCreatureEditModal
        isOpen={modalOpen}
        onClose={closeModal}
        initialData={editing?.data ?? null}
        existingId={editing?.id ?? null}
        onSave={handleSave}
        onDelete={editing ? handleDeleteFromModal : null}
        saving={saving}
        deleteConfirm={editing ? deleteId === editing.id : false}
      />

      {deleteConfirm && (
        <DeleteConfirmModal
          isOpen={true}
          itemName={deleteConfirm.name}
          itemType="creature"
          deleteContext="public library"
          isDeleting={false}
          onConfirm={handleDeleteFromList}
          onClose={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
