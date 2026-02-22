/**
 * useCreatorSave — Unified save state and handlers for all creators
 * ==================================================================
 * Single source of truth for save message, save target, saving state,
 * and save/publish flow. Used by power, technique, item, and creature creators.
 */

'use client';

import { useState, useCallback } from 'react';
import { saveToLibrary, saveToPublicLibrary, findLibraryItemByName, findPublicLibraryItemByName } from '@/services/library-service';

export type CreatorLibraryType = 'powers' | 'techniques' | 'items' | 'creatures';

export interface CreatorSavePayload {
  name: string;
  data: Record<string, unknown>;
}

export interface UseCreatorSaveOptions {
  type: CreatorLibraryType;
  /** Returns current name and payload for save. Called at save time. */
  getPayload: () => CreatorSavePayload;
  /** Require confirmation modal before saving to public library */
  requirePublishConfirm?: boolean;
  publishConfirmTitle?: string;
  /** Receives name and whether an item with that name already exists in the public library (override case). */
  publishConfirmDescription?: (name: string, opts: { existingInPublic: boolean }) => string;
  /** Called after successful save (e.g. reset form). Optional. */
  onSaveSuccess?: () => void;
  /** Success message for private save. Default: "Saved successfully!" */
  successMessage?: string;
  /** Success message for public save. Default: "Saved to public library!" */
  publicSuccessMessage?: string;
}

export interface UseCreatorSaveReturn {
  saveMessage: { type: 'success' | 'error'; text: string } | null;
  setSaveMessage: (msg: { type: 'success' | 'error'; text: string } | null) => void;
  saveTarget: 'private' | 'public';
  setSaveTarget: (target: 'private' | 'public') => void;
  saving: boolean;
  handleSave: () => Promise<void>;
  showPublishConfirm: boolean;
  setShowPublishConfirm: (show: boolean) => void;
  /** Call when user confirms publish in modal */
  confirmPublish: () => Promise<void>;
  publishConfirmTitle: string;
  publishConfirmDescription: ((name: string, opts: { existingInPublic: boolean }) => string) | undefined;
  /** True when publishing would replace an existing public item with the same name. */
  publishExistingInPublic: boolean;
}

const DEFAULT_SUCCESS = 'Saved successfully!';
const DEFAULT_PUBLIC_SUCCESS = 'Saved to public library!';

export function useCreatorSave(options: UseCreatorSaveOptions): UseCreatorSaveReturn {
  const {
    type,
    getPayload,
    requirePublishConfirm = true,
    publishConfirmTitle = 'Publish to Public Library',
    publishConfirmDescription,
    onSaveSuccess,
    successMessage = DEFAULT_SUCCESS,
    publicSuccessMessage = DEFAULT_PUBLIC_SUCCESS,
  } = options;

  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saveTarget, setSaveTarget] = useState<'private' | 'public'>('private');
  const [saving, setSaving] = useState(false);
  const [showPublishConfirm, setShowPublishConfirmState] = useState(false);
  const [publishExistingId, setPublishExistingId] = useState<string | null>(null);

  const setShowPublishConfirm = useCallback((show: boolean) => {
    setShowPublishConfirmState(show);
    if (!show) setPublishExistingId(null);
  }, []);

  const executeSave = useCallback(
    async (target: 'private' | 'public', existingPublicId?: string) => {
      const { name, data } = getPayload();
      const payload = { ...data, createdAt: new Date().toISOString(), updatedAt: new Date() };
      setSaving(true);
      setSaveMessage(null);
      try {
        if (target === 'public') {
          await saveToPublicLibrary(type, payload, existingPublicId ? { existingId: existingPublicId } : undefined);
          setSaveMessage({ type: 'success', text: publicSuccessMessage });
        } else {
          const existing = await findLibraryItemByName(type, name.trim());
          await saveToLibrary(type, payload, existing ? { existingId: existing.id } : undefined);
          setSaveMessage({ type: 'success', text: successMessage });
        }
        setTimeout(() => {
          setSaveMessage(null);
          onSaveSuccess?.();
        }, 2000);
      } catch (err) {
        console.error(`Error saving ${type}:`, err);
        setSaveMessage({
          type: 'error',
          text: `Failed to save: ${(err as Error).message}`,
        });
      } finally {
        setSaving(false);
      }
    },
    [type, getPayload, successMessage, publicSuccessMessage, onSaveSuccess]
  );

  const handleSave = useCallback(async () => {
    const { name } = getPayload();
    if (!name?.trim()) {
      setSaveMessage({ type: 'error', text: `Please enter a ${type.slice(0, -1)} name` });
      return;
    }
    if (saveTarget === 'public' && requirePublishConfirm) {
      const existing = await findPublicLibraryItemByName(type, name.trim());
      setPublishExistingId(existing?.id ?? null);
      setShowPublishConfirmState(true);
      return;
    }
    await executeSave(saveTarget);
  }, [getPayload, type, saveTarget, requirePublishConfirm, executeSave]);

  const confirmPublish = useCallback(async () => {
    const existingId = publishExistingId;
    setShowPublishConfirm(false);
    await executeSave('public', existingId ?? undefined);
  }, [executeSave, publishExistingId]);

  return {
    saveMessage,
    setSaveMessage,
    saveTarget,
    setSaveTarget,
    saving,
    handleSave,
    showPublishConfirm,
    setShowPublishConfirm,
    confirmPublish,
    publishConfirmTitle,
    publishConfirmDescription,
    publishExistingInPublic: !!publishExistingId,
  };
}
