/**
 * Admin Official Library — Armaments (items) tab
 * List displayed like Library. Edit opens Item Creator with item loaded; row delete remains.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DeleteConfirmModal, OfficialItemList, SegmentedControl } from '@/components/shared';
import { useToast } from '@/components/ui';
import { officialLibraryKeys, useOfficialLibrary, useItemProperties } from '@/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import {
  ARMAMENT_LABELS_BY_KIND,
  type ArmamentLibraryKind,
} from '@/lib/library/armament-library-labels';

const QUERY_KEY = ['official-library', 'items'] as const;

const ARMAMENT_KIND_OPTIONS: { value: ArmamentLibraryKind; label: string }[] = [
  { value: 'weapon', label: 'Weapons' },
  { value: 'armor', label: 'Armor' },
  { value: 'shield', label: 'Shields' },
];

export function AdminPublicItemsTab() {
  const { showToast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [armamentKind, setArmamentKind] = useState<ArmamentLibraryKind>('weapon');
  const { data: items = [], isLoading, error, refetch } = useOfficialLibrary('items');
  const { data: propertiesDb = [] } = useItemProperties();
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const handleDeleteFromList = async () => {
    if (!deleteConfirm) return;
    try {
      await apiFetch(`/api/official/items?id=${encodeURIComponent(deleteConfirm.id)}`, {
        method: 'DELETE',
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: officialLibraryKeys.counts });
      await queryClient.refetchQueries({ queryKey: QUERY_KEY });
      setDeleteConfirm(null);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to delete', 'error');
    }
  };

  const labels = ARMAMENT_LABELS_BY_KIND[armamentKind];
  const sectionTitle =
    armamentKind === 'weapon'
      ? 'Official Weapons'
      : armamentKind === 'armor'
        ? 'Official Armor'
        : 'Official Shields';

  return (
    <>
      <div className="mb-4">
        <SegmentedControl
          value={armamentKind}
          onChange={setArmamentKind}
          options={ARMAMENT_KIND_OPTIONS}
          aria-label="Armament type"
        />
      </div>
      <OfficialItemList
        armamentKind={armamentKind}
        items={items}
        propertiesDb={propertiesDb}
        isLoading={isLoading}
        error={error}
        onRetry={() => {
          void refetch();
        }}
        errorMessage={`Failed to load official ${labels.entityPlural}`}
        sectionTitle={sectionTitle}
        emptyTitle={`No official ${labels.entityPlural}`}
        emptyMessage="Add one from the header or publish from a creator."
        variant="admin"
        onEdit={(id) => router.push(`/item-creator?edit=${encodeURIComponent(id)}`)}
        onDelete={(id, name) => setDeleteConfirm({ id, name })}
      />

      {deleteConfirm && (
        <DeleteConfirmModal
          isOpen={true}
          itemName={deleteConfirm.name}
          itemType={armamentKind}
          deleteContext="Realms Library"
          isDeleting={false}
          onConfirm={handleDeleteFromList}
          onClose={() => setDeleteConfirm(null)}
        />
      )}
    </>
  );
}
