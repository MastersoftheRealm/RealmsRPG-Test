/**
 * Admin Public Library — Powers tab
 * List displayed like Library (energy, action, duration, range, area, damage, TP, parts). Edit modal + row delete.
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
  type ChipData,
} from '@/components/shared';
import { usePublicLibrary, usePowerParts } from '@/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { useSort } from '@/hooks/use-sort';
import { derivePowerDisplay, formatPowerDamage } from '@/lib/calculators/power-calc';
import type { PowerDocument } from '@/lib/calculators/power-calc';
import { Wand2 } from 'lucide-react';
import { PublicPowerEditModal } from './PublicPowerEditModal';

const POWER_GRID = '1.5fr 0.8fr 1fr 1fr 0.8fr 1fr 1fr 40px';
const QUERY_KEY = ['public-library', 'powers'] as const;

export function AdminPublicPowersTab() {
  const queryClient = useQueryClient();
  const { data: items = [], isLoading, error } = usePublicLibrary('powers');
  const { data: partsDb = [] } = usePowerParts();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string; data: Record<string, unknown> } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const { sortState, handleSort, sortItems } = useSort('name');

  const cardData = useMemo(() => {
    return (items as Array<Record<string, unknown>>).map((p) => {
      const doc: PowerDocument = {
        name: String(p.name ?? ''),
        description: String(p.description ?? ''),
        parts: Array.isArray(p.parts) ? (p.parts as PowerDocument['parts']) : [],
        damage: p.damage as PowerDocument['damage'],
        actionType: p.actionType as string | undefined,
        isReaction: p.isReaction as boolean | undefined,
        range: p.range as PowerDocument['range'],
        area: p.area as PowerDocument['area'],
        duration: p.duration as PowerDocument['duration'],
      };
      const display = derivePowerDisplay(doc, partsDb);
      const damageStr = formatPowerDamage(doc.damage);
      const parts: ChipData[] = display.partChips.map((chip) => ({
        name: chip.text.split(' | TP:')[0].replace(/\s*\(Opt\d+ \d+\)/g, '').trim(),
        description: chip.description,
        cost: chip.finalTP,
        costLabel: 'TP',
      }));
      return {
        id: String(p.id ?? p.docId ?? ''),
        raw: p,
        name: display.name,
        description: display.description,
        energy: display.energy,
        action: display.actionType,
        duration: display.duration,
        range: display.range,
        area: display.area,
        damage: damageStr,
        tp: display.tp,
        parts,
      };
    });
  }, [items, partsDb]);

  const filtered = useMemo(() => {
    let r = cardData;
    if (search) {
      const s = search.toLowerCase();
      r = r.filter(
        (x) =>
          String(x.name ?? '').toLowerCase().includes(s) ||
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
      const res = await fetch(`/api/public/powers`, {
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
    fetch(`/api/public/powers?id=${encodeURIComponent(editing.id)}`, { method: 'DELETE' })
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
      const res = await fetch(`/api/public/powers?id=${encodeURIComponent(deleteConfirm.id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(res.statusText);
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setDeleteConfirm(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  if (error) return <ErrorDisplay message="Failed to load public powers" />;

  return (
    <div>
      <SectionHeader title="Public Powers" onAdd={openAdd} size="md" />
      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search powers..." />
      </div>
      <ListHeader
        columns={[
          { key: 'name', label: 'NAME' },
          { key: 'energy', label: 'ENERGY', sortable: false as const },
          { key: 'action', label: 'ACTION', sortable: false as const },
          { key: 'duration', label: 'DURATION', sortable: false as const },
          { key: 'range', label: 'RANGE', sortable: false as const },
          { key: 'area', label: 'AREA', sortable: false as const },
          { key: 'damage', label: 'DAMAGE', sortable: false as const },
          { key: '_actions', label: '', sortable: false as const },
        ]}
        gridColumns={POWER_GRID}
        sortState={sortState}
        onSort={handleSort}
      />
      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <ListEmptyState
            icon={<Wand2 className="w-8 h-8" />}
            title="No public powers"
            message="Add one from the header or publish from a creator."
          />
        ) : (
          filtered.map((p) => (
            <GridListRow
              key={p.id}
              id={p.id}
              name={p.name}
              description={p.description}
              gridColumns={POWER_GRID}
              columns={[
                { key: 'Energy', value: p.energy, highlight: true },
                { key: 'Action', value: p.action },
                { key: 'Duration', value: p.duration },
                { key: 'Range', value: p.range },
                { key: 'Area', value: p.area },
                { key: 'Damage', value: p.damage },
              ]}
              chips={p.parts}
              chipsLabel="Parts"
              totalCost={p.tp}
              costLabel="TP"
              onEdit={() => openEdit(p)}
              onDelete={() => setDeleteConfirm({ id: p.id, name: p.name })}
            />
          ))
        )}
      </div>

      <PublicPowerEditModal
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
          itemType="power"
          deleteContext="public library"
          isDeleting={false}
          onConfirm={handleDeleteFromList}
          onClose={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
