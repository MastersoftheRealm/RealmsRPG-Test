'use client';

/**
 * Admin Realms Image Library
 * ==========================
 * Browse, upload, rename, retag, replace, and delete shared bank images (TASK-493).
 */

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChipSelect,
  FilterSection,
  CodexBrowseListShell,
  GridListRow,
  ErrorDisplay,
} from '@/components/shared';
import { PageContainer, PageHeader } from '@/components/ui';
import { useSort } from '@/hooks/use-sort';
import {
  REALMS_IMAGE_CATEGORY_OPTIONS,
  formatRealmsImageCategoryLabels,
  deleteRealmsImage,
  listRealmsImages,
  type RealmsImage,
  type RealmsImageCategory,
  type RealmsImageUsageRef,
} from '@/lib/realms-images';
import { ImageIcon, Pencil } from 'lucide-react';
import { IconButton, useToast } from '@/components/ui';
import { AdminImageEditModal } from './admin-image-edit-modal';
import { AdminImageDeleteModal } from './admin-image-delete-modal';

const QUERY_KEY = ['realms-images', 'admin'] as const;

const CATEGORY_FILTER_OPTIONS = REALMS_IMAGE_CATEGORY_OPTIONS;

const LIST_GRID = '1.5fr 1fr 0.8fr 44px';

function formatUpdatedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function AdminImagesPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilters, setCategoryFilters] = useState<RealmsImageCategory[]>([]);
  const { sortState, handleSort } = useSort('name');

  const [editImage, setEditImage] = useState<RealmsImage | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<{
    image: RealmsImage;
    usages: RealmsImageUsageRef[];
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: images = [], isLoading, error, refetch } = useQuery({
    queryKey: [...QUERY_KEY, categoryFilters, search],
    queryFn: () =>
      listRealmsImages({
        category: categoryFilters.length > 0 ? categoryFilters : undefined,
        q: search.trim() || undefined,
      }),
  });

  const sortedImages = useMemo(() => {
    const items = [...images];
    const { col, dir } = sortState;
    return items.sort((a, b) => {
      let cmp = 0;
      if (col === 'name') {
        cmp = a.name.localeCompare(b.name, undefined, { numeric: true });
      } else if (col === 'categories') {
        cmp = formatRealmsImageCategoryLabels(a.categories).localeCompare(
          formatRealmsImageCategoryLabels(b.categories),
          undefined,
          { numeric: true }
        );
      } else if (col === 'updated') {
        cmp = a.updatedAt.localeCompare(b.updatedAt);
      }
      return dir === 1 ? cmp : -cmp;
    });
  }, [images, sortState]);

  const invalidateList = () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  };

  const handleSaved = (image: RealmsImage) => {
    invalidateList();
    if (editImage && editImage.id === image.id) {
      setEditImage(image);
    }
  };

  const openCreate = () => setEditImage(null);
  const openEdit = (image: RealmsImage) => setEditImage(image);
  const closeEdit = () => setEditImage(undefined);

  const handleRequestDelete = (image: RealmsImage, usages: RealmsImageUsageRef[]) => {
    setDeleteTarget({ image, usages });
    closeEdit();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteRealmsImage(deleteTarget.image.id);
      invalidateList();
      setDeleteTarget(null);
      showToast('Image deleted', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Delete failed', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const addCategoryFilter = (value: string) => {
    const cat = value as RealmsImageCategory;
    if (!categoryFilters.includes(cat)) {
      setCategoryFilters((prev) => [...prev, cat]);
    }
  };

  const removeCategoryFilter = (value: string) => {
    setCategoryFilters((prev) => prev.filter((c) => c !== value));
  };

  if (error) {
    return (
      <PageContainer size="xl">
        <PageHeader
          title="Realms Image Library"
          description="Manage shared card art for species, creatures, armaments, powers, and techniques. One image can be tagged with multiple categories and referenced by many entities."
        />
        <ErrorDisplay message="Failed to load images" onRetry={() => { void refetch(); }} />
      </PageContainer>
    );
  }

  return (
    <PageContainer size="xl">
      <PageHeader
        title="Realms Image Library"
        description="Manage shared card art for species, creatures, armaments, powers, and techniques. One image can be tagged with multiple categories and referenced by many entities."
      />

      <CodexBrowseListShell
        sectionTitle="Images"
        onAdd={openCreate}
        addLabel="Add image"
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name..."
        searchAriaLabel="Search images by name"
        filters={
          <FilterSection>
            <ChipSelect
              label="Filter by category"
              placeholder="Any category..."
              options={CATEGORY_FILTER_OPTIONS}
              selectedValues={categoryFilters}
              onSelect={addCategoryFilter}
              onRemove={removeCategoryFilter}
            />
          </FilterSection>
        }
        headerColumns={[
          { key: 'name', label: 'Name' },
          { key: 'categories', label: 'Categories' },
          { key: 'updated', label: 'Updated' },
          { key: '_actions', label: '', sortable: false },
        ]}
        gridColumns={LIST_GRID}
        sortState={sortState}
        onSort={handleSort}
        hasThumbnailColumn
        isLoading={isLoading}
        loadingMessage="Loading images..."
        isEmpty={sortedImages.length === 0}
        emptyIcon={<ImageIcon className="h-8 w-8" />}
        emptyTitle="No images yet"
        emptyMessage="Add an image to the shared bank, or adjust your search and filters."
      >
        {sortedImages.map((image) => (
          <GridListRow
            key={image.id}
            id={image.id}
            name={image.name}
            thumbnail={{ src: image.publicUrl, alt: `${image.name} preview` }}
            gridColumns={LIST_GRID}
            columns={[
              { key: 'categories', value: formatRealmsImageCategoryLabels(image.categories) },
              { key: 'updated', value: formatUpdatedAt(image.updatedAt) },
            ]}
            rightSlot={
              <IconButton
                variant="ghost"
                size="sm"
                onClick={() => openEdit(image)}
                label="Edit"
                aria-label={`Edit ${image.name}`}
              >
                <Pencil className="h-4 w-4" />
              </IconButton>
            }
          />
        ))}
      </CodexBrowseListShell>

      {editImage !== undefined && (
        <AdminImageEditModal
          key={editImage?.id ?? 'create'}
          isOpen
          image={editImage}
          onClose={closeEdit}
          onSaved={handleSaved}
          onRequestDelete={handleRequestDelete}
        />
      )}

      {deleteTarget && (
        <AdminImageDeleteModal
          isOpen={true}
          imageName={deleteTarget.image.name}
          usages={deleteTarget.usages}
          isDeleting={isDeleting}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </PageContainer>
  );
}
