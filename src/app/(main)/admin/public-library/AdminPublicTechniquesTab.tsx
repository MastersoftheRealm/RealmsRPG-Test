/**
 * Admin Public Library — Techniques tab
 * List displayed like Library (energy, TP, action, weapon, damage, parts). Edit modal + row delete.
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
import { usePublicLibrary, useTechniqueParts } from '@/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { useSort } from '@/hooks/use-sort';
import type { TechniqueDocument } from '@/lib/calculators/technique-calc';
import { deriveTechniqueDisplay, formatTechniqueDamage } from '@/lib/calculators/technique-calc';
import { Swords } from 'lucide-react';
import { PublicTechniqueEditModal } from './PublicTechniqueEditModal';

const TECHNIQUE_GRID = '1.5fr 0.8fr 0.8fr 1fr 1fr 1fr 40px';
const QUERY_KEY = ['public-library', 'techniques'] as const;

export function AdminPublicTechniquesTab() {
  const queryClient = useQueryClient();
  const { data: items = [], isLoading, error } = usePublicLibrary('techniques');
  const { data: partsDb = [] } = useTechniqueParts();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string; data: Record<string, unknown> } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const { sortState, handleSort, sortItems } = useSort('name');

  const cardData = useMemo(() => {
    return (items as Array<Record<string, unknown>>).map((t) => {
      const doc: TechniqueDocument = {
        name: String(t.name ?? ''),
        description: String(t.description ?? ''),
        parts: Array.isArray(t.parts) ? (t.parts as TechniqueDocument['parts']) : [],
        damage: Array.isArray(t.damage) ? (t.damage[0] as TechniqueDocument['damage']) : (t.damage as TechniqueDocument['damage']),
        weapon: t.weapon as TechniqueDocument['weapon'],
      };
      const display = deriveTechniqueDisplay(doc, partsDb);
      const damageStr = formatTechniqueDamage(doc.damage);
      const parts: ChipData[] = display.partChips.map((chip) => ({
        name: chip.text.split(' | TP:')[0].replace(/\s*\(Opt\d+ \d+\)/g, '').trim(),
        description: chip.description,
        cost: chip.finalTP,
        costLabel: 'TP',
      }));
      return {
        id: String(t.id ?? t.docId ?? ''),
        raw: t,
        name: display.name,
        description: display.description,
        energy: display.energy,
        tp: display.tp,
        action: display.actionType,
        weapon: display.weaponName || '-',
        damage: damageStr,
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
          String(x.description ?? '').toLowerCase().includes(s) ||
          String(x.weapon ?? '').toLowerCase().includes(s)
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

  const handleDeleteFromModal = () => {
    if (!editing) return;
    if (deleteId !== editing.id) {
      setDeleteId(editing.id);
      return;
    }
    setSaving(true);
    fetch(`/api/public/techniques?id=${encodeURIComponent(editing.id)}`, { method: 'DELETE' })
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
      const res = await fetch(`/api/public/techniques?id=${encodeURIComponent(deleteConfirm.id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(res.statusText);
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setDeleteConfirm(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete');
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
          { key: 'tp', label: 'TP', sortable: false as const },
          { key: 'action', label: 'ACTION', sortable: false as const },
          { key: 'weapon', label: 'WEAPON', sortable: false as const },
          { key: 'damage', label: 'DAMAGE', sortable: false as const },
          { key: '_actions', label: '', sortable: false as const },
        ]}
        gridColumns={TECHNIQUE_GRID}
        sortState={sortState}
        onSort={handleSort}
      />
      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <ListEmptyState
            icon={<Swords className="w-8 h-8" />}
            title="No public techniques"
            message="Add one from the header or publish from a creator."
          />
        ) : (
          filtered.map((t) => (
            <GridListRow
              key={t.id}
              id={t.id}
              name={t.name}
              description={t.description}
              gridColumns={TECHNIQUE_GRID}
              columns={[
                { key: 'Energy', value: t.energy, highlight: true },
                { key: 'TP', value: t.tp },
                { key: 'Action', value: t.action },
                { key: 'Weapon', value: t.weapon },
                { key: 'Damage', value: t.damage },
              ]}
              chips={t.parts}
              chipsLabel="Parts"
              totalCost={t.tp}
              costLabel="TP"
              onEdit={() => openEdit(t)}
              onDelete={() => setDeleteConfirm({ id: t.id, name: t.name })}
            />
          ))
        )}
      </div>

      <PublicTechniqueEditModal
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
          itemType="technique"
          deleteContext="public library"
          isDeleting={false}
          onConfirm={handleDeleteFromList}
          onClose={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
