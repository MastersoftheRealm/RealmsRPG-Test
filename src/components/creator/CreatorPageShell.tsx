'use client';

/**
 * CreatorPageShell — Shared auth / load / save chrome for standalone creators
 * ==========================================================================
 * Composes CreatorLayout + CreatorSaveToolbar + standard modals (login, load,
 * publish). Domain editor sections stay in each page as children.
 *
 * Collapsible sections: use CollapsibleSection from this package only
 * (ui/Collapsible was removed; do not reintroduce).
 */

import { useCallback, useState, type ReactNode } from 'react';
import { LoadingState, type ContainerSize } from '@/components/ui';
import {
  LoginPromptModal,
  ConfirmActionModal,
  ErrorDisplay,
  type LoginPromptReason,
} from '@/components/patterns';
import { useCreatorLeaveBlocker } from '@/hooks/use-creator-unsaved-guard';
import { creatorToolbarLoadAction } from '@/lib/creator/creator-unsaved-guard';
import type { CreatorSaveTarget } from '@/lib/library/catalog-listing';
import { CreatorLayout } from './CreatorLayout';
import { CreatorSaveToolbar } from './CreatorSaveToolbar';
import { LoadFromLibraryModal, type LoadFromLibraryModalProps } from './LoadFromLibraryModal';

export type CreatorPageAuthConfig = {
  /** Path returned to after login (e.g. "/power-creator") */
  returnPath: string;
  /** LoginPromptModal content type label */
  contentType?: string | undefined;
  /**
   * When true (default), Load requires auth and opens LoginPromptModal if logged out.
   * Species creator keeps Load ungated — set false.
   */
  requireAuthToLoad?: boolean | undefined;
};

export type CreatorPageLoadingConfig = {
  isLoading: boolean;
  loadingMessage?: string | undefined;
  error?: Error | null | undefined;
  onRetry?: (() => void) | undefined;
  /** Full error message; if omitted, uses error.message with a generic prefix */
  errorMessage?: string | undefined;
};

export type CreatorPagePublishConfig = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string | undefined;
};

export type CreatorPageResetConfirmConfig = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string | undefined;
};

export type CreatorPageShellProps = {
  icon: ReactNode;
  title: string;
  description: string;
  size?: ContainerSize | undefined;
  headerClassName?: string | undefined;

  user: unknown;
  auth: CreatorPageAuthConfig;
  showSaveTarget?: boolean | undefined;

  saveTarget: CreatorSaveTarget;
  onSaveTargetChange: (target: CreatorSaveTarget) => void;
  saving: boolean;
  saveDisabled?: boolean | undefined;
  /** Shown beside Save and linked with aria-describedby while Save is disabled. */
  saveDisabledReason?: string | undefined;
  /** Unauthenticated save handler — shell gates login */
  onSave: () => void | Promise<void>;
  onReset: () => void;
  /** Opens the load modal (or custom load flow) — shell may gate auth */
  onLoad: () => void;
  /** When true, reload, leave, Back, Load, and Reset ask before discarding edits. */
  unsavedDirty?: boolean | undefined;

  publish: CreatorPagePublishConfig;
  resetConfirm?: CreatorPageResetConfirmConfig | undefined;

  loading?: CreatorPageLoadingConfig | undefined;
  /** When set, shell renders LoadFromLibraryModal. Omit for fully custom load in extraModals. */
  loadModal?: LoadFromLibraryModalProps | null | undefined;

  stickySidebar?: boolean | undefined;
  sidebar: ReactNode;
  children: ReactNode;
  /** Band above the editor/summary grid (CreatorLayout `aboveGrid`). */
  aboveGrid?: ReactNode | undefined;
  extraModals?: ReactNode | undefined;
  /** Optional InfoTippy beside toolbar Load / Reset (power creator). */
  toolbarHelp?: {
    load?: ReactNode | undefined;
    reset?: ReactNode | undefined;
  };
};

export function CreatorPageShell({
  icon,
  title,
  description,
  size = 'xl',
  headerClassName,
  user,
  auth,
  showSaveTarget = false,
  saveTarget,
  onSaveTargetChange,
  saving,
  saveDisabled = false,
  saveDisabledReason,
  onSave,
  onReset,
  onLoad,
  unsavedDirty = false,
  publish,
  resetConfirm,
  loading,
  loadModal,
  stickySidebar = true,
  sidebar,
  children,
  aboveGrid,
  extraModals,
  toolbarHelp,
}: CreatorPageShellProps) {
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginReason, setLoginReason] = useState<LoginPromptReason>('save');
  const [discardAction, setDiscardAction] = useState<'load' | 'reset' | null>(null);
  const leaveBlocker = useCreatorLeaveBlocker(unsavedDirty);
  const requireAuthToLoad = auth.requireAuthToLoad !== false;

  const handleSave = useCallback(() => {
    if (!user) {
      setLoginReason('save');
      setShowLoginPrompt(true);
      return;
    }
    void onSave();
  }, [user, onSave]);

  const handleLoad = useCallback(() => {
    const loadAction = creatorToolbarLoadAction({
      unsavedDirty,
      needsLogin: requireAuthToLoad && !user,
    });
    if (loadAction === 'login') {
      setLoginReason('load');
      setShowLoginPrompt(true);
      return;
    }
    if (loadAction === 'confirm-discard') {
      setDiscardAction('load');
      return;
    }
    onLoad();
  }, [requireAuthToLoad, user, onLoad, unsavedDirty]);

  const handleReset = useCallback(() => {
    if (unsavedDirty && !resetConfirm) {
      setDiscardAction('reset');
      return;
    }
    onReset();
  }, [onReset, resetConfirm, unsavedDirty]);

  const confirmDiscard = useCallback(() => {
    const action = discardAction;
    setDiscardAction(null);
    if (leaveBlocker.request) {
      leaveBlocker.confirm();
      return;
    }
    if (action === 'load') onLoad();
    if (action === 'reset') onReset();
  }, [discardAction, leaveBlocker, onLoad, onReset]);

  // Keep title / Load / Reset / Save chrome visible during load & error so
  // chrome audits and signed-out UX do not depend on codex data being present
  // (CI often has empty Supabase secrets; species/creature already settle without parts).
  // On error, keep children mounted so section chrome (h2 / expand) still audits.
  let body: ReactNode = children;
  if (loading?.isLoading) {
    body = <LoadingState message={loading.loadingMessage ?? 'Loading...'} />;
  } else if (loading?.error) {
    body = (
      <>
        <ErrorDisplay
          message={loading.errorMessage ?? `Failed to load: ${loading.error.message}`}
          onRetry={loading.onRetry}
        />
        {children}
      </>
    );
  }

  const sidebarNode = stickySidebar ? (
    <div className="space-y-6 self-start lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
      {sidebar}
    </div>
  ) : (
    sidebar
  );

  return (
    <CreatorLayout
      icon={icon}
      title={title}
      description={description}
      size={size}
      headerClassName={headerClassName}
      aboveGrid={loading?.isLoading ? undefined : aboveGrid}
      actions={
        <CreatorSaveToolbar
          saveTarget={saveTarget}
          onSaveTargetChange={onSaveTargetChange}
          onSave={handleSave}
          onLoad={handleLoad}
          onReset={handleReset}
          saving={saving}
          saveDisabled={saveDisabled || !!loading?.isLoading}
          saveDisabledReason={saveDisabledReason}
          showSaveTarget={showSaveTarget}
          user={user}
          requireAuthToLoad={requireAuthToLoad}
          loadHelp={toolbarHelp?.load}
          resetHelp={toolbarHelp?.reset}
        />
      }
      sidebar={sidebarNode}
      modals={
        <>
          {loadModal ? <LoadFromLibraryModal {...loadModal} /> : null}
          <LoginPromptModal
            isOpen={showLoginPrompt}
            onClose={() => setShowLoginPrompt(false)}
            returnPath={auth.returnPath}
            contentType={auth.contentType}
            reason={loginReason}
          />
          <ConfirmActionModal
            isOpen={publish.isOpen}
            onClose={publish.onClose}
            onConfirm={() => void publish.onConfirm()}
            title={publish.title}
            description={publish.description}
            confirmLabel={
              publish.confirmLabel ?? (publish.title.startsWith('Replace ') ? 'Replace' : 'Publish')
            }
            icon="publish"
          />
          <ConfirmActionModal
            isOpen={unsavedDirty && (discardAction !== null || leaveBlocker.request !== null)}
            onClose={() => {
              setDiscardAction(null);
              leaveBlocker.dismiss();
            }}
            onConfirm={confirmDiscard}
            title="Discard unsaved changes?"
            description="This creator has edits that are not saved. Continuing will discard them."
            confirmLabel="Discard"
            cancelLabel="Keep editing"
            confirmVariant="danger"
            icon="warning"
          />
          {resetConfirm ? (
            <ConfirmActionModal
              isOpen={resetConfirm.isOpen}
              onClose={resetConfirm.onClose}
              onConfirm={resetConfirm.onConfirm}
              title={resetConfirm.title}
              description={resetConfirm.description}
              confirmLabel={resetConfirm.confirmLabel ?? 'Reset'}
            />
          ) : null}
          {extraModals}
        </>
      }
    >
      {body}
    </CreatorLayout>
  );
}
