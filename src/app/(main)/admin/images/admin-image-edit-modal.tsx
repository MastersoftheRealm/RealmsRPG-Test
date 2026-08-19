'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChipSelect, ImageUploadModal, ListRowThumbnail } from '@/components/patterns';
import { Modal, Button, Input, Alert, useToast } from '@/components/ui';
import {
  REALMS_IMAGE_CATEGORY_OPTIONS,
  createRealmsImage,
  getRealmsImageUsage,
  replaceRealmsImageFile,
  updateRealmsImage,
  type RealmsImage,
  type RealmsImageCategory,
  type RealmsImageUsageRef,
} from '@/lib/realms-images';

const CATEGORY_OPTIONS = REALMS_IMAGE_CATEGORY_OPTIONS;

export interface AdminImageEditModalProps {
  isOpen: boolean;
  image: RealmsImage | null;
  onClose: () => void;
  onSaved: (image: RealmsImage) => void;
  onRequestDelete: (image: RealmsImage, usages: RealmsImageUsageRef[]) => void;
}

export function AdminImageEditModal({
  isOpen,
  image,
  onClose,
  onSaved,
  onRequestDelete,
}: AdminImageEditModalProps) {
  const { showToast } = useToast();
  const isCreate = !image;

  // Parent remounts via key={image?.id ?? 'create'} when opening (TASK-430).
  const [name, setName] = useState(image?.name ?? '');
  const [categories, setCategories] = useState<RealmsImageCategory[]>(image?.categories ?? []);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(image?.publicUrl ?? null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMode, setUploadMode] = useState<'create' | 'replace'>('create');
  const [saving, setSaving] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [usages, setUsages] = useState<RealmsImageUsageRef[]>([]);
  const [usageWarningError, setUsageWarningError] = useState<string | null>(null);
  const [deletePrepError, setDeletePrepError] = useState<string | null>(null);
  const [preparingDelete, setPreparingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !image?.id) return;
    let cancelled = false;
    void getRealmsImageUsage(image.id)
      .then((report) => {
        if (!cancelled) {
          setUsages(report.usages);
          setUsageWarningError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setUsages([]);
          setUsageWarningError(e instanceof Error ? e.message : 'Could not load usage count');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, image?.id]);

  const displayPreview = useMemo(() => {
    if (localPreview) return localPreview;
    if (previewUrl) return previewUrl;
    return null;
  }, [localPreview, previewUrl]);

  const openUpload = (mode: 'create' | 'replace') => {
    setUploadMode(mode);
    setShowUploadModal(true);
  };

  const handleCropped = async (blob: Blob) => {
    setError(null);
    if (uploadMode === 'replace' && image) {
      setReplacing(true);
      try {
        const updated = await replaceRealmsImageFile(image.id, blob);
        setPreviewUrl(updated.publicUrl);
        onSaved(updated);
        setShowUploadModal(false);
        showToast('Image replaced — all references updated', 'success');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Replace failed');
      } finally {
        setReplacing(false);
      }
      return;
    }

    if (localPreview) URL.revokeObjectURL(localPreview);
    const objectUrl = URL.createObjectURL(blob);
    setLocalPreview(objectUrl);
    setPendingBlob(blob);
    setShowUploadModal(false);
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Name is required');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (isCreate) {
        if (!pendingBlob) {
          setError('Upload an image before saving');
          setSaving(false);
          return;
        }
        const created = await createRealmsImage({
          file: pendingBlob,
          name: trimmedName,
          categories,
        });
        onSaved(created);
        onClose();
        showToast('Image added to library', 'success');
        return;
      }

      const updated = await updateRealmsImage(image.id, {
        name: trimmedName,
        categories,
      });
      onSaved(updated);
      onClose();
      showToast('Image updated', 'success');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!image) return;
    setDeletePrepError(null);
    setPreparingDelete(true);
    try {
      const report = await getRealmsImageUsage(image.id);
      setUsages(report.usages);
      onRequestDelete(image, report.usages);
    } catch (e) {
      setDeletePrepError(e instanceof Error ? e.message : 'Could not load image usages');
    } finally {
      setPreparingDelete(false);
    }
  };

  const addCategory = (value: string) => {
    const cat = value as RealmsImageCategory;
    if (!categories.includes(cat)) {
      setCategories((prev) => [...prev, cat]);
    }
  };

  const removeCategory = (value: string) => {
    setCategories((prev) => prev.filter((c) => c !== value));
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={isCreate ? 'Add image' : `Edit ${image.name}`}
        size="full"
        fullScreenOnMobile
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <div>
              {!isCreate && (
                <Button
                  variant="outline"
                  onClick={() => {
                    void handleDeleteClick();
                  }}
                  disabled={saving || replacing || preparingDelete}
                  isLoading={preparingDelete}
                  className="border-danger-300 text-danger-fg hover:bg-danger-light"
                >
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={saving || replacing}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || replacing || !name.trim()}
                isLoading={saving}
              >
                {saving ? 'Saving...' : isCreate ? 'Add image' : 'Save changes'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {error && <Alert variant="danger">{error}</Alert>}
          {deletePrepError && <Alert variant="danger">{deletePrepError}</Alert>}

          <div>
            <label
              htmlFor="admin-image-name"
              className="mb-1 block text-sm font-medium text-text-secondary"
            >
              Name *
            </label>
            <Input
              id="admin-image-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Image name"
            />
          </div>

          <ChipSelect
            label="Category tags"
            placeholder="Add category..."
            options={CATEGORY_OPTIONS}
            selectedValues={categories}
            onSelect={addCategory}
            onRemove={removeCategory}
          />

          <div className="space-y-2">
            <p className="text-sm font-medium text-text-secondary">Preview</p>
            <div className="flex flex-wrap items-center gap-4">
              {displayPreview ? (
                <ListRowThumbnail
                  src={displayPreview}
                  alt={name.trim() || 'Image preview'}
                  className="h-24 min-h-[44px] w-24 min-w-[44px]"
                />
              ) : (
                <div className="flex h-24 min-h-[44px] w-24 min-w-[44px] items-center justify-center rounded-md border border-dashed border-border-light bg-surface-alt text-xs text-text-muted">
                  No image
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => openUpload(isCreate ? 'create' : 'replace')}
                  disabled={replacing}
                  className="min-h-11"
                >
                  {isCreate ? 'Upload & crop' : replacing ? 'Replacing...' : 'Replace image'}
                </Button>
                {!isCreate && usages.length > 0 && (
                  <p className="max-w-xs text-xs text-text-secondary">
                    Used by {usages.length} {usages.length === 1 ? 'entity' : 'entities'}. Replacing
                    updates all references.
                  </p>
                )}
                {!isCreate && usageWarningError && (
                  <p className="max-w-xs text-xs text-warning-fg">{usageWarningError}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <ImageUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onConfirm={handleCropped}
        cropShape="rect"
        aspect={1}
        title={uploadMode === 'replace' ? 'Replace image' : 'Upload image'}
      />
    </>
  );
}
