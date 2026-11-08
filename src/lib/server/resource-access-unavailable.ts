/** Stable digest for client error boundaries (survives RSC serialization). */
export const RESOURCE_ACCESS_UNAVAILABLE_DIGEST = 'RESOURCE_ACCESS_UNAVAILABLE';

/** Thrown when an access preflight cannot reach the API (network/5xx/429). */
export class ResourceAccessUnavailableError extends Error {
  readonly code = 'RESOURCE_ACCESS_UNAVAILABLE' as const;
  declare readonly digest: string;

  constructor(
    readonly reason: 'network' | number,
    readonly returnPath: string,
  ) {
    super('This page is temporarily unavailable. Please try again.');
    this.name = 'ResourceAccessUnavailableError';
    (this as Error & { digest?: string }).digest = RESOURCE_ACCESS_UNAVAILABLE_DIGEST;
  }
}

export function isRecoverableResourceAccessError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const record = error as { digest?: unknown; name?: unknown; message?: unknown };
  if (record.digest === RESOURCE_ACCESS_UNAVAILABLE_DIGEST) return true;
  if (record.name === 'ResourceAccessUnavailableError') return true;
  return record.message === 'This page is temporarily unavailable. Please try again.';
}
