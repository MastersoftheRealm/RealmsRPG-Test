'use client';

import { Alert, Button } from '@/components/ui';
import { useBrowserOffline } from '@/hooks/use-browser-offline';
import { cn } from '@/lib/utils/cn';

export const CLOUD_SYNC_SERVER_UNREACHABLE_TITLE = 'Could not reach the server';
export const CLOUD_SYNC_SERVER_UNREACHABLE_BODY =
  'Your latest changes are not saved to the cloud. Check your connection and try again.';

export interface CloudSyncOfflineBannerProps {
  /** When false, the banner never renders (e.g. guest / local-only persistence). */
  enabled: boolean;
  /** Last cloud save failed due to network; cleared on success. */
  syncBlocked?: boolean | undefined;
  onRetry?: (() => void) | undefined;
  className?: string | undefined;
}

/**
 * Warns when cloud autosave cannot run (offline or network failure).
 * Used on combat encounters and character sheets after warm load.
 */
export function CloudSyncOfflineBanner({
  enabled,
  syncBlocked = false,
  onRetry,
  className,
}: CloudSyncOfflineBannerProps) {
  const isOffline = useBrowserOffline();

  if (!enabled || (!isOffline && !syncBlocked)) {
    return null;
  }

  const title = isOffline ? 'You are offline' : CLOUD_SYNC_SERVER_UNREACHABLE_TITLE;
  const body = isOffline
    ? 'Changes stay on this device until you are back online. They are not saved to the cloud yet.'
    : CLOUD_SYNC_SERVER_UNREACHABLE_BODY;

  return (
    <Alert variant="warning" title={title} className={cn('mb-4', className)}>
      <span className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>{body}</span>
        {onRetry && !isOffline ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="shrink-0 self-start"
            onClick={onRetry}
          >
            Retry save
          </Button>
        ) : null}
      </span>
    </Alert>
  );
}
