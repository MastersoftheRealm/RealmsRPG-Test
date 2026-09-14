/**
 * Admin Official Library — Creatures tab
 * List (name, level, type). Edit opens Creature Creator with item loaded; row delete remains.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DeleteConfirmModal, OfficialCreatureList } from '@/components/patterns';
import { useToast } from '@/components/ui';
import { officialLibraryKeys, useOfficialLibrary, usePatchOfficialCatalogListing } from '@/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Users } from 'lucide-react';

export function AdminPublicCreaturesTab() {
  const { showToast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useOfficialLibrary('creatures', {
    includeUnlisted: true,
  });
  const patchListing = usePatchOfficialCatalogListing('creatures');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const handleDeleteFromList = async () => {
    if (!deleteConfirm) return;
    try {
      await apiFetch(`/api/official/creatures?id=${encodeURIComponent(deleteConfirm.id)}`, {
        method: 'DELETE',
      });
      queryClient.invalidateQueries({ queryKey: officialLibraryKeys.all, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: officialLibraryKeys.counts, refetchType: 'all' });
      await queryClient.refetchQueries({ queryKey: officialLibraryKeys.all });
      setDeleteConfirm(null);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to delete', 'error');
    }
  };

  return (
    <>
      <OfficialCreatureList
        items={items}
        isLoading={isLoading}
        error={error}
        onRetry={() => {
          void refetch();
        }}
        errorMessage="Failed to load official creatures"
        sectionTitle="Official Creatures"
        emptyIcon={<Users className="h-8 w-8" />}
        emptyTitle="No official creatures"
        emptyMessage="Add one from the header or publish from a creator."
        variant="admin"
        onEdit={(id) => router.push(`/creature-creator?edit=${encodeURIComponent(id)}`)}
        onDelete={(id, name) => setDeleteConfirm({ id, name })}
        onCatalogListingChange={patchListing}
      />

      {deleteConfirm && (
        <DeleteConfirmModal
          isOpen={true}
          itemName={deleteConfirm.name}
          itemType="creature"
          deleteContext="Realms Library"
          isDeleting={false}
          onConfirm={handleDeleteFromList}
          onClose={() => setDeleteConfirm(null)}
        />
      )}
    </>
  );
}
