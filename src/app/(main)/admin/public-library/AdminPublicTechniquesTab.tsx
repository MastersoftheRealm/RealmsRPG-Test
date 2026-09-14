/**
 * Admin Official Library — Techniques tab
 * List displayed like Library. Edit opens Technique Creator with item loaded; row delete remains.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DeleteConfirmModal, OfficialTechniqueList } from '@/components/patterns';
import { useToast } from '@/components/ui';
import {
  officialLibraryKeys,
  useOfficialLibrary,
  usePatchOfficialCatalogListing,
  useTechniqueParts,
  usePowerParts,
} from '@/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Swords } from 'lucide-react';

export function AdminPublicTechniquesTab({
  mode = 'standard',
}: {
  mode?: 'standard' | 'empowered' | undefined;
}) {
  const { showToast } = useToast();
  const libraryType = mode === 'empowered' ? 'empowered-techniques' : 'techniques';
  const creatorPath = mode === 'empowered' ? '/empowered-technique-creator' : '/technique-creator';
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useOfficialLibrary(libraryType, {
    includeUnlisted: true,
  });
  const { data: partsDb = [] } = useTechniqueParts();
  const { data: powerPartsDb = [] } = usePowerParts({ enabled: mode === 'empowered' });
  const patchListing = usePatchOfficialCatalogListing(libraryType);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const empowered = mode === 'empowered';

  const handleDeleteFromList = async () => {
    if (!deleteConfirm) return;
    try {
      await apiFetch(`/api/official/${libraryType}?id=${encodeURIComponent(deleteConfirm.id)}`, {
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
      <OfficialTechniqueList
        items={items}
        partsDb={partsDb}
        powerPartsDb={powerPartsDb}
        isLoading={isLoading}
        error={error}
        onRetry={() => {
          void refetch();
        }}
        mode={mode}
        errorMessage={`Failed to load official ${empowered ? 'empowered techniques' : 'techniques'}`}
        sectionTitle={empowered ? 'Official Empowered Techniques' : 'Official Techniques'}
        emptyIcon={<Swords className="h-8 w-8" />}
        emptyTitle="No official techniques"
        emptyMessage={
          empowered
            ? 'Publish one from the Empowered Technique Creator.'
            : 'Add one from the header or publish from a creator.'
        }
        variant="admin"
        onEdit={(id) => router.push(`${creatorPath}?edit=${encodeURIComponent(id)}`)}
        onDelete={(id, name) => setDeleteConfirm({ id, name })}
        onCatalogListingChange={patchListing}
      />

      {deleteConfirm && (
        <DeleteConfirmModal
          isOpen={true}
          itemName={deleteConfirm.name}
          itemType={empowered ? 'empowered technique' : 'technique'}
          deleteContext="Realms Library"
          isDeleting={false}
          onConfirm={handleDeleteFromList}
          onClose={() => setDeleteConfirm(null)}
        />
      )}
    </>
  );
}
