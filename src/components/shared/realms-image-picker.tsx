'use client';

/**
 * RealmsImagePicker — shared bank browse + select (TASK-495 / ADR-0003).
 * Guests and signed-in users pick from the public bank; admins may upload into the bank
 * (crop via ImageUploadModal, create row, auto-return selection).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ImageIcon, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChipSelect, ImageUploadModal, SearchInput } from '@/components/shared';
import { Alert, Button, Input, Modal } from '@/components/ui';
import { useAdmin } from '@/hooks';
import {
  REALMS_IMAGE_CATEGORY_OPTIONS,
  createRealmsImage,
  formatRealmsImageCategoryLabels,
  listRealmsImages,
  parseRealmsImageCategories,
  resolveRealmsImagePickerCategories,
  type RealmsImage,
  type RealmsImageCategory,
  type RealmsImagePickerFilter,
} from '@/lib/realms-images';

export interface RealmsImagePickerSelection {
  imageId: string;
  image: RealmsImage;
}

export interface RealmsImagePickerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called when the user confirms a bank image (browse pick or admin upload). */
  onSelect: (selection: RealmsImagePickerSelection) => void;
  /**
   * Category filter for the bank (OR semantics). Multi-tagged assets appear in every
   * matching filter. Use `'empowered-technique'` for power|technique; `'portrait'` for
   * species|creature (TASK-499).
   */
  categories: RealmsImagePickerFilter;
  /** Highlights the current selection when the modal opens. */
  selectedImageId?: string | null;
  title?: string;
  description?: string;
  /**
   * Admin upload-into-bank defaults. `name` pre-fills the upload form; `extraCategories`
   * are merged with resolved `categories` (deduped) as initial tags.
   */
  uploadDefaults?: {
    name?: string;
    extraCategories?: RealmsImageCategory[];
  };
}

export function RealmsImagePicker({
  isOpen,
  onClose,
  onSelect,
  categories,
  selectedImageId,
  title = 'Choose image',
  description = 'Pick shared card art from the Realms Image Library.',
  uploadDefaults,
}: RealmsImagePickerProps) {
  const { isAdmin } = useAdmin();
  const filterCategories = useMemo(
    () => resolveRealmsImagePickerCategories(categories),
    [categories]
  );

  const [search, setSearch] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(selectedImageId ?? null);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadCategories, setUploadCategories] = useState<RealmsImageCategory[]>([]);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetUploadDraft = useCallback(() => {
    setUploadName(uploadDefaults?.name?.trim() ?? '');
    // parseRealmsImageCategories is the shared validate+dedupe helper (never null for typed input).
    const initial =
      parseRealmsImageCategories([
        ...filterCategories,
        ...(uploadDefaults?.extraCategories ?? []),
      ]) ?? [];
    setUploadCategories(initial);
    setPendingBlob(null);
    setUploadPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setError(null);
  }, [filterCategories, uploadDefaults?.extraCategories, uploadDefaults?.name]);

  const resetAll = useCallback(() => {
    setSearch('');
    setPendingId(selectedImageId ?? null);
    resetUploadDraft();
    setShowUploadModal(false);
    setIsUploading(false);
    setError(null);
  }, [resetUploadDraft, selectedImageId]);

  useEffect(() => {
    if (!isOpen) return;
    setPendingId(selectedImageId ?? null);
    resetUploadDraft();
    setError(null);
  }, [isOpen, selectedImageId, resetUploadDraft]);

  const { data: images = [], isLoading, error: loadError, refetch } = useQuery({
    queryKey: ['realms-images', 'picker', filterCategories, search],
    queryFn: () =>
      listRealmsImages({
        category: filterCategories,
        q: search.trim() || undefined,
      }),
    enabled: isOpen,
  });

  const filterLabel = formatRealmsImageCategoryLabels(filterCategories);

  const handleClose = () => {
    resetAll();
    onClose();
  };

  const handleConfirmSelect = () => {
    if (!pendingId) return;
    const image = images.find((img) => img.id === pendingId);
    if (!image) {
      setError('Selected image is no longer available. Refresh and try again.');
      return;
    }
    onSelect({ imageId: image.id, image });
    resetAll();
    onClose();
  };

  const handleCropped = (blob: Blob) => {
    setError(null);
    if (uploadPreview) URL.revokeObjectURL(uploadPreview);
    setPendingBlob(blob);
    setUploadPreview(URL.createObjectURL(blob));
    setShowUploadModal(false);
  };

  const handleUploadAndSelect = async () => {
    const trimmedName = uploadName.trim();
    if (!pendingBlob) {
      setError('Crop an image before uploading to the library.');
      return;
    }
    if (!trimmedName) {
      setError('Name is required for new library images.');
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      const created = await createRealmsImage({
        file: pendingBlob,
        name: trimmedName,
        categories: uploadCategories,
      });
      onSelect({ imageId: created.id, image: created });
      resetAll();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const addUploadCategory = (value: string) => {
    const cat = value as RealmsImageCategory;
    if (!uploadCategories.includes(cat)) {
      setUploadCategories((prev) => [...prev, cat]);
    }
  };

  const removeUploadCategory = (value: string) => {
    setUploadCategories((prev) => prev.filter((c) => c !== value));
  };

  const showUploadPanel = Boolean(pendingBlob);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={title}
        description={description}
        size="2xl"
        fullScreenOnMobile
        flexLayout
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-text-secondary">
              {filterCategories.length > 0 ? (
                <span>
                  Showing: <span className="font-medium text-text-primary">{filterLabel}</span>
                </span>
              ) : (
                <span>All categories</span>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={handleClose} disabled={isUploading} className="min-h-11">
                Cancel
              </Button>
              {!showUploadPanel && (
                <Button
                  onClick={handleConfirmSelect}
                  disabled={!pendingId || isLoading}
                  className="min-h-11"
                >
                  Select image
                </Button>
              )}
              {showUploadPanel && isAdmin && (
                <Button
                  onClick={() => { void handleUploadAndSelect(); }}
                  disabled={isUploading || !uploadName.trim()}
                  isLoading={isUploading}
                  className="min-h-11"
                >
                  Upload &amp; select
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          {error && <Alert variant="danger">{error}</Alert>}
          {loadError && (
            <Alert variant="danger">
              Failed to load images.{' '}
              <button
                type="button"
                className="underline"
                onClick={() => { void refetch(); }}
              >
                Retry
              </button>
            </Alert>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by name..."
              aria-label="Search library images by name"
              className="sm:max-w-xs"
            />
            {isAdmin && !showUploadPanel && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  resetUploadDraft();
                  setShowUploadModal(true);
                }}
                className="min-h-11 shrink-0"
              >
                <Upload className="mr-2 h-4 w-4" aria-hidden />
                Upload to library
              </Button>
            )}
          </div>

          {showUploadPanel && isAdmin && (
            <div className="space-y-3 rounded-card border border-border-light bg-surface-alt p-4">
              <p className="text-sm font-medium text-text-primary">New library image</p>
              <div className="flex flex-wrap items-start gap-4">
                {uploadPreview && (
                  <div className="h-20 w-20 min-h-[44px] min-w-[44px] shrink-0 overflow-hidden rounded-card border border-border-light bg-surface">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={uploadPreview} alt="" className="h-full w-full object-contain" />
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <label htmlFor="realms-picker-upload-name" className="mb-1 block text-sm font-medium text-text-secondary">
                      Name *
                    </label>
                    <Input
                      id="realms-picker-upload-name"
                      value={uploadName}
                      onChange={(e) => setUploadName(e.target.value)}
                      placeholder="Image name"
                    />
                  </div>
                  <ChipSelect
                    label="Category tags"
                    placeholder="Add category..."
                    options={REALMS_IMAGE_CATEGORY_OPTIONS}
                    selectedValues={uploadCategories}
                    onSelect={addUploadCategory}
                    onRemove={removeUploadCategory}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="min-h-11"
                      onClick={() => setShowUploadModal(true)}
                      disabled={isUploading}
                    >
                      Re-crop
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="min-h-11 text-text-secondary"
                      onClick={resetUploadDraft}
                      disabled={isUploading}
                    >
                      Cancel upload
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoading ? (
              <p className="py-8 text-center font-nunito text-sm text-text-secondary">Loading images…</p>
            ) : images.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <ImageIcon className="h-10 w-10 text-text-muted dark:text-text-secondary" aria-hidden />
                <p className="font-nunito text-sm font-medium text-text-primary">No images found</p>
                <p className="max-w-sm font-nunito text-xs text-text-secondary">
                  {isAdmin
                    ? 'Upload a new image to the library or adjust your search.'
                    : 'Try a different search, or ask an admin to add art to the library.'}
                </p>
              </div>
            ) : (
              <ul
                className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
                role="listbox"
                aria-label="Library images"
              >
                {images.map((image) => {
                  const isSelected = pendingId === image.id;
                  return (
                    <li key={image.id} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        aria-label={`${image.name}${isSelected ? ', selected' : ''}`}
                        onClick={() => {
                          setPendingId(image.id);
                          setError(null);
                        }}
                        className={cn(
                          'group relative flex w-full min-h-[44px] flex-col overflow-hidden rounded-card border bg-surface text-left transition-colors',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                          isSelected
                            ? 'border-primary-500 ring-2 ring-primary-500/30'
                            : 'border-border-light hover:border-primary-outline-border hover:bg-primary-subtle-bg-hover/40'
                        )}
                      >
                        <div className="relative aspect-square w-full bg-surface-alt">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={image.publicUrl}
                            alt=""
                            className="absolute inset-0 h-full w-full object-contain"
                            loading="lazy"
                            decoding="async"
                          />
                          {isSelected && (
                            <span
                              className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-white shadow-sm"
                              aria-hidden
                            >
                              <Check className="h-4 w-4" />
                            </span>
                          )}
                        </div>
                        <span className="line-clamp-2 px-2 py-2 font-nunito text-xs font-medium text-text-primary">
                          {image.name}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </Modal>

      {isAdmin && (
        <ImageUploadModal
          isOpen={showUploadModal}
          onClose={() => !isUploading && setShowUploadModal(false)}
          onConfirm={handleCropped}
          cropShape="rect"
          aspect={1}
          title="Upload to library"
        />
      )}
    </>
  );
}
