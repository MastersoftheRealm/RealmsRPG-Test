/**
 * Admin Public Library — Creatures tab
 * List (name, level, type). Edit opens Creature Creator with item loaded; row delete remains.
 */

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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

const CREATURE_GRID = '1.5fr 0.8fr 1fr 40px';
const QUERY_KEY = ['public-library', 'creatures'] as const;

export function AdminPublicCreaturesTab() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: items = [], isLoading, error } = usePublicLibrary('creatures');
  const [search, setSearch] = useState('');
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
      <SectionHeader title="Public Creatures" size="md" />
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
              onEdit={() => router.push(`/creature-creator?edit=${encodeURIComponent(c.id)}`)}
              onDelete={() => setDeleteConfirm({ id: c.id, name: c.name })}
            />
          ))
        )}
      </div>

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
