/**
 * useCreatorSave — Unified save state and handlers for all creators
 * ==================================================================
 * Single source of truth for save message, save target, saving state,
 * and save/publish flow. Used by power, technique, item, creature, and species creators.
 * Success/error feedback is shown via the global toast (fixed), not inline in the summary panel.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui';
import {
  saveToLibrary,
  saveToOfficialLibrary,
  findLibraryItemByName,
  findOfficialLibraryItemByName,
} from '@/services/library-service';
import { officialLibraryKeys } from '@/hooks/use-official-library';
import { userLibraryKeys } from '@/hooks/use-user-library';
import {
  isOfficialSaveTarget,
  resolveCreatorSaveTargetFromItem,
  saveTargetToCatalogListing,
  type CreatorSaveTarget,
} from '@/lib/library/catalog-listing';

export type { CreatorSaveTarget };

/** Partial query keys for user library; invalidating these refreshes load-modal lists after save */
const USER_LIBRARY_QUERY_KEYS: Record<CreatorLibraryType, readonly string[]> = {
  powers: ['user-powers'],
  techniques: ['user-techniques'],
  'empowered-techniques': ['user-empowered-techniques'],
  items: ['user-items'],
  creatures: ['user-creatures'],
  species: ['user-species'],
};

export type CreatorLibraryType =
  | 'powers'
  | 'techniques'
  | 'empowered-techniques'
  | 'items'
  | 'creatures'
  | 'species';

export interface CreatorSavePayload {
  name: string;
  data: Record<string, unknown>;
}

export interface UseCreatorSaveOptions {
  type: CreatorLibraryType;
  /** Returns current name and payload for save. Called at save time. */
  getPayload: () => CreatorSavePayload;
  /** Require confirmation modal before saving to public or admin library */
  requirePublishConfirm?: boolean | undefined;
  publishConfirmTitle?: string | undefined;
  /** Receives name and whether an official row with that name already exists (override case). */
  publishConfirmDescription?:
    | ((name: string, opts: { existingInPublic: boolean }) => string)
    | undefined;
  /** Called after successful save (e.g. reset form). Optional. */
  onSaveSuccess?: (() => void) | undefined;
  /** Success message for private save. Default: "Saved successfully!" */
  successMessage?: string | undefined;
  /** Success message for public save. Default: "Saved to Realms Library!" */
  publicSuccessMessage?: string | undefined;
  /** Success message for admin-library save. */
  adminSuccessMessage?: string | undefined;
  /** When loading ?edit= of an official row, start on Public/Admin library. */
  initialSaveTarget?: CreatorSaveTarget | undefined;
}

export interface UseCreatorSaveReturn {
  saveMessage: { type: 'success' | 'error'; text: string } | null;
  setSaveMessage: (msg: { type: 'success' | 'error'; text: string } | null) => void;
  saveTarget: CreatorSaveTarget;
  setSaveTarget: (target: CreatorSaveTarget) => void;
  applyLoadedLibraryItem: (item: unknown) => void;
  saving: boolean;
  handleSave: () => Promise<void>;
  showPublishConfirm: boolean;
  setShowPublishConfirm: (show: boolean) => void;
  /** Call when user confirms publish in modal */
  confirmPublish: () => Promise<void>;
  publishConfirmTitle: string;
  publishConfirmDescription:
    | ((name: string, opts: { existingInPublic: boolean }) => string)
    | undefined;
  /** True when publishing would replace an existing official item with the same name. */
  publishExistingInPublic: boolean;
}

const DEFAULT_SUCCESS = 'Saved successfully!';
const DEFAULT_PUBLIC_SUCCESS = 'Saved to Realms Library!';
const DEFAULT_ADMIN_SUCCESS = 'Saved to Admin library!';

function adminPublishDescription(name: string, existing: boolean): string {
  return existing
    ? `Replace “${name}” in the Admin library? It stays hidden from player catalogs.`
    : `Save “${name}” to the Admin library? Players will not see it in Libraries or pickers; it can still appear on published creatures that use it.`;
}

export function useCreatorSave(options: UseCreatorSaveOptions): UseCreatorSaveReturn {
  const {
    type,
    getPayload,
    requirePublishConfirm = true,
    publishConfirmTitle = 'Publish to Realms Library',
    publishConfirmDescription,
    onSaveSuccess,
    successMessage = DEFAULT_SUCCESS,
    publicSuccessMessage = DEFAULT_PUBLIC_SUCCESS,
    adminSuccessMessage = DEFAULT_ADMIN_SUCCESS,
    initialSaveTarget = 'private',
  } = options;

  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!saveMessage) return;
    showToast(
      saveMessage.text,
      saveMessage.type === 'success' ? 'success' : 'error',
      saveMessage.type === 'error' ? 6000 : undefined,
    );
  }, [saveMessage, showToast]);
  const [saveTarget, setSaveTarget] = useState<CreatorSaveTarget>(initialSaveTarget);
  const [saving, setSaving] = useState(false);
  const [showPublishConfirm, setShowPublishConfirmState] = useState(false);
  const [publishExistingId, setPublishExistingId] = useState<string | null>(null);

  const setShowPublishConfirm = useCallback((show: boolean) => {
    setShowPublishConfirmState(show);
    if (!show) setPublishExistingId(null);
  }, []);

  const applyLoadedLibraryItem = useCallback((item: unknown) => {
    setSaveTarget(resolveCreatorSaveTargetFromItem(item));
  }, []);

  const executeSave = useCallback(
    async (target: CreatorSaveTarget, existingOfficialId?: string) => {
      const { name, data } = getPayload();
      const payload = { ...data, createdAt: new Date().toISOString(), updatedAt: new Date() };
      setSaving(true);
      setSaveMessage(null);
      try {
        if (isOfficialSaveTarget(target)) {
          const listing = saveTargetToCatalogListing(target);
          await saveToOfficialLibrary(type, payload, {
            ...(existingOfficialId ? { existingId: existingOfficialId } : {}),
            ...(listing ? { catalogListing: listing } : {}),
          });
          await queryClient.invalidateQueries({
            queryKey: officialLibraryKeys.all,
            refetchType: 'all',
          });
          await queryClient.invalidateQueries({
            queryKey: officialLibraryKeys.counts,
            refetchType: 'all',
          });
          if (type === 'species') {
            await queryClient.invalidateQueries({ queryKey: ['codex'], refetchType: 'all' });
          }
          setSaveMessage({
            type: 'success',
            text: target === 'admin' ? adminSuccessMessage : publicSuccessMessage,
          });
        } else {
          const existing = await findLibraryItemByName(type, name.trim());
          await saveToLibrary(type, payload, existing ? { existingId: existing.id } : undefined);
          await queryClient.invalidateQueries({
            queryKey: [...USER_LIBRARY_QUERY_KEYS[type]],
            refetchType: 'all',
          });
          await queryClient.invalidateQueries({
            queryKey: userLibraryKeys.countsRoot,
            refetchType: 'all',
          });
          setSaveMessage({ type: 'success', text: successMessage });
        }
        setTimeout(() => {
          setSaveMessage(null);
          onSaveSuccess?.();
        }, 2000);
      } catch (err) {
        setSaveMessage({
          type: 'error',
          text: `Failed to save: ${(err as Error).message}`,
        });
      } finally {
        setSaving(false);
      }
    },
    [
      type,
      getPayload,
      successMessage,
      publicSuccessMessage,
      adminSuccessMessage,
      onSaveSuccess,
      queryClient,
    ],
  );

  const handleSave = useCallback(async () => {
    const { name } = getPayload();
    if (!name?.trim()) {
      setSaveMessage({
        type: 'error',
        text: `Please enter a ${type === 'species' ? 'species' : type.slice(0, -1)} name`,
      });
      return;
    }
    if (isOfficialSaveTarget(saveTarget) && requirePublishConfirm) {
      const existing = await findOfficialLibraryItemByName(type, name.trim(), {
        includeUnlisted: true,
      });
      setPublishExistingId(existing?.id ?? null);
      setShowPublishConfirmState(true);
      return;
    }
    await executeSave(saveTarget);
  }, [getPayload, type, saveTarget, requirePublishConfirm, executeSave]);

  const confirmPublish = useCallback(async () => {
    const existingId = publishExistingId;
    const target = saveTarget;
    setShowPublishConfirm(false);
    await executeSave(target, existingId ?? undefined);
  }, [executeSave, publishExistingId, saveTarget, setShowPublishConfirm]);

  const wrappedPublishDescription = useCallback(
    (itemName: string, opts: { existingInPublic: boolean }) => {
      if (saveTarget === 'admin') return adminPublishDescription(itemName, opts.existingInPublic);
      return (
        publishConfirmDescription?.(itemName, opts) ??
        (opts.existingInPublic
          ? `Replace the existing Realms Library entry named “${itemName}”?`
          : `Publish “${itemName}” to the Realms Library? All users will be able to see and use it.`)
      );
    },
    [publishConfirmDescription, saveTarget],
  );

  return {
    saveMessage,
    setSaveMessage,
    saveTarget,
    setSaveTarget,
    applyLoadedLibraryItem,
    saving,
    handleSave,
    showPublishConfirm,
    setShowPublishConfirm,
    confirmPublish,
    publishConfirmTitle: saveTarget === 'admin' ? 'Save to Admin library' : publishConfirmTitle,
    publishConfirmDescription: wrappedPublishDescription,
    publishExistingInPublic: !!publishExistingId,
  };
}
