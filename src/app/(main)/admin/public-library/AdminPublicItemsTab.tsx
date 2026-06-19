/**
 * Admin Official Library — Armaments (items) tab
 * List displayed like Library. Edit opens Item Creator with item loaded; row delete remains.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DeleteConfirmModal, OfficialItemList } from '@/components/shared';
import { useToast } from '@/components/ui';
import { useOfficialLibrary, useItemProperties } from '@/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Shield } from 'lucide-react';

const QUERY_KEY = ['official-library', 'items'] as const;

export function AdminPublicItemsTab() {
  const { showToast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
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
      await queryClient.refetchQueries({ queryKey: QUERY_KEY });
      setDeleteConfirm(null);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to delete', 'error');
    }
  };

  return (
    <>
      <OfficialItemList
        items={items as Array<Record<string, unknown>>}
        propertiesDb={propertiesDb}
        isLoading={isLoading}
        error={error}
        onRetry={() => { void refetch(); }}
        errorMessage="Failed to load official armaments"
        sectionTitle="Official Armaments"
        emptyIcon={<Shield className="w-8 h-8" />}
        emptyTitle="No official armaments"
        emptyMessage="Add one from the header or publish from a creator."
        variant="admin"
        onEdit={(id) => router.push(`/item-creator?edit=${encodeURIComponent(id)}`)}
        onDelete={(id, name) => setDeleteConfirm({ id, name })}
      />

      {deleteConfirm && (
        <DeleteConfirmModal
          isOpen={true}
          itemName={deleteConfirm.name}
          itemType="armament"
          deleteContext="Realms Library"
          isDeleting={false}
          onConfirm={handleDeleteFromList}
          onClose={() => setDeleteConfirm(null)}
        />
      )}
    </>
  );
}
