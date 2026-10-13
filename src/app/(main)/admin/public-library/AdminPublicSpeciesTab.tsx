/**
 * Admin Official Library — Species tab
 * List (name, type, sizes). Edit opens Species Creator with the item loaded; row delete remains.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { DeleteConfirmModal } from '@/components/patterns';
import { OfficialEntityList } from '@/components/patterns/list/official-entity-list';
import { useToast } from '@/components/ui';
import { officialLibraryKeys, useOfficialLibrary, usePatchOfficialCatalogListing } from '@/hooks';
import { apiFetch } from '@/lib/api-client';
import { parseCatalogListing, type CatalogListing } from '@/lib/library/catalog-listing';
import { resolveSpeciesListRowThumbnail } from '@/lib/list-row-image';
import { formatListCellLabel } from '@/lib/utils';
import type { LibrarySpecies } from '@/types/library';
import { speciesCreatorEditHref } from '../../species-creator/species-creator-bootstrap';

const SPECIES_GRID = '1.5fr 0.8fr 1fr';

const SPECIES_HEADER_COLUMNS = [
  { key: 'name', label: 'NAME', align: 'left' as const },
  { key: 'type', label: 'TYPE', align: 'center' as const },
  { key: 'sizes', label: 'SIZES', align: 'center' as const },
];

interface OfficialSpeciesRow {
  id: string;
  name: string;
  description: string;
  type: string;
  sizes: string;
  catalogListing: CatalogListing;
  raw: LibrarySpecies;
}

function formatSpeciesSizes(sizes: string[] | undefined): string {
  if (!sizes?.length) return '-';
  return sizes.map((size) => formatListCellLabel(size)).join(', ');
}

function buildOfficialSpeciesRows(items: LibrarySpecies[]): OfficialSpeciesRow[] {
  return items.map((species) => ({
    id: String(species.id ?? species.docId ?? ''),
    raw: species,
    name: String(species.name ?? ''),
    description: String(species.description ?? ''),
    type: String(species.type ?? ''),
    sizes: formatSpeciesSizes(species.sizes),
    catalogListing: parseCatalogListing(species.catalogListing),
  }));
}

function filterOfficialSpeciesRows(
  rows: OfficialSpeciesRow[],
  search: string,
  sortItems: (items: OfficialSpeciesRow[]) => OfficialSpeciesRow[],
): OfficialSpeciesRow[] {
  let result = rows;
  if (search) {
    const needle = search.toLowerCase();
    result = result.filter(
      (row) =>
        row.name.toLowerCase().includes(needle) ||
        row.type.toLowerCase().includes(needle) ||
        row.sizes.toLowerCase().includes(needle) ||
        row.description.toLowerCase().includes(needle),
    );
  }
  return sortItems(result);
}

export function AdminPublicSpeciesTab() {
  const { showToast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useOfficialLibrary('species', {
    includeUnlisted: true,
  });
  const patchListing = usePatchOfficialCatalogListing('species');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const handleDeleteFromList = async () => {
    if (!deleteConfirm) return;
    try {
      await apiFetch(`/api/official/species?id=${encodeURIComponent(deleteConfirm.id)}`, {
        method: 'DELETE',
      });
      queryClient.invalidateQueries({ queryKey: officialLibraryKeys.all, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: officialLibraryKeys.counts, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['codex'], refetchType: 'all' });
      await queryClient.refetchQueries({ queryKey: officialLibraryKeys.all });
      setDeleteConfirm(null);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to delete', 'error');
    }
  };

  return (
    <>
      <OfficialEntityList
        items={items}
        isLoading={isLoading}
        error={error}
        onRetry={() => {
          void refetch();
        }}
        buildRows={buildOfficialSpeciesRows}
        filterRows={filterOfficialSpeciesRows}
        gridColumns={SPECIES_GRID}
        headerColumns={SPECIES_HEADER_COLUMNS}
        getColumns={(row) => [
          { key: 'type', value: formatListCellLabel(row.type) || '-', align: 'center' },
          { key: 'sizes', value: row.sizes, align: 'center' },
        ]}
        getThumbnail={(row) =>
          resolveSpeciesListRowThumbnail({ name: row.name, image_url: row.raw.image_url }, row.raw)
        }
        errorMessage="Failed to load official species"
        sectionTitle="Official Species"
        searchPlaceholder="Search species..."
        emptyIcon={<User className="h-8 w-8" />}
        emptyTitle="No official species"
        emptyMessage="Add one from the header or publish from a creator."
        searchEmptyMessage="No species match your search."
        variant="admin"
        onEdit={(id) => router.push(speciesCreatorEditHref(id))}
        onDelete={(id, name) => setDeleteConfirm({ id, name })}
        onCatalogListingChange={patchListing}
      />

      {deleteConfirm && (
        <DeleteConfirmModal
          isOpen={true}
          itemName={deleteConfirm.name}
          itemType="species"
          deleteContext="Realms Library"
          isDeleting={false}
          onConfirm={handleDeleteFromList}
          onClose={() => setDeleteConfirm(null)}
        />
      )}
    </>
  );
}
