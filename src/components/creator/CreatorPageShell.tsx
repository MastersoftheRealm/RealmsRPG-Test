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
import {
  PageContainer,
  LoadingState,
  type ContainerSize,
} from '@/components/ui';
import {
  LoginPromptModal,
  ConfirmActionModal,
  ErrorDisplay,
  type LoginPromptReason,
} from '@/components/shared';
import { CreatorLayout } from './CreatorLayout';
import { CreatorSaveToolbar } from './CreatorSaveToolbar';
import {
  LoadFromLibraryModal,
  type LoadFromLibraryModalProps,
} from './LoadFromLibraryModal';

export type CreatorPageAuthConfig = {
  /** Path returned to after login (e.g. "/power-creator") */
  returnPath: string;
  /** LoginPromptModal content type label */
  contentType?: string;
  /**
   * When true (default), Load requires auth and opens LoginPromptModal if logged out.
   * Species creator keeps Load ungated — set false.
   */
  requireAuthToLoad?: boolean;
};

export type CreatorPageLoadingConfig = {
  isLoading: boolean;
  loadingMessage?: string;
  error?: Error | null;
  onRetry?: () => void;
  /** Full error message; if omitted, uses error.message with a generic prefix */
  errorMessage?: string;
};

export type CreatorPagePublishConfig = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
};

export type CreatorPageResetConfirmConfig = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
};

export type CreatorPageShellProps = {
  icon: ReactNode;
  title: string;
  description: string;
  size?: ContainerSize;
  headerClassName?: string;

  user: unknown;
  auth: CreatorPageAuthConfig;
  showPublicPrivate?: boolean;

  saveTarget: 'private' | 'public';
  onSaveTargetChange: (target: 'private' | 'public') => void;
  saving: boolean;
  saveDisabled?: boolean;
  /** Unauthenticated save handler — shell gates login */
  onSave: () => void | Promise<void>;
  onReset: () => void;
  /** Opens the load modal (or custom load flow) — shell may gate auth */
  onLoad: () => void;

  publish: CreatorPagePublishConfig;
  resetConfirm?: CreatorPageResetConfirmConfig;

  loading?: CreatorPageLoadingConfig;
  /** When set, shell renders LoadFromLibraryModal. Omit for fully custom load in extraModals. */
  loadModal?: LoadFromLibraryModalProps | null;

  stickySidebar?: boolean;
  sidebar: ReactNode;
  children: ReactNode;
  extraModals?: ReactNode;
};

export function CreatorPageShell({
  icon,
  title,
  description,
  size = 'xl',
  headerClassName,
  user,
  auth,
  showPublicPrivate = false,
  saveTarget,
  onSaveTargetChange,
  saving,
  saveDisabled = false,
  onSave,
  onReset,
  onLoad,
  publish,
  resetConfirm,
  loading,
  loadModal,
  stickySidebar = true,
  sidebar,
  children,
  extraModals,
}: CreatorPageShellProps) {
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginReason, setLoginReason] = useState<LoginPromptReason>('save');
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
    if (requireAuthToLoad && !user) {
      setLoginReason('load');
      setShowLoginPrompt(true);
      return;
    }
    onLoad();
  }, [requireAuthToLoad, user, onLoad]);

  if (loading?.isLoading) {
    return (
      <PageContainer size={size}>
        <LoadingState message={loading.loadingMessage ?? 'Loading...'} />
      </PageContainer>
    );
  }

  if (loading?.error) {
    return (
      <PageContainer size={size}>
        <ErrorDisplay
          message={
            loading.errorMessage ??
            `Failed to load: ${loading.error.message}`
          }
          onRetry={loading.onRetry}
        />
      </PageContainer>
    );
  }

  const sidebarNode = stickySidebar ? (
    <div className="self-start lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto space-y-6">
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
      actions={
        <CreatorSaveToolbar
          saveTarget={saveTarget}
          onSaveTargetChange={onSaveTargetChange}
          onSave={handleSave}
          onLoad={handleLoad}
          onReset={onReset}
          saving={saving}
          saveDisabled={saveDisabled}
          showPublicPrivate={showPublicPrivate}
          user={user}
          requireAuthToLoad={requireAuthToLoad}
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
            confirmLabel={publish.confirmLabel ?? 'Publish'}
            icon="publish"
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
      {children}
    </CreatorLayout>
  );
}
