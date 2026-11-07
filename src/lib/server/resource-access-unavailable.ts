/** Thrown when an access preflight cannot reach the API (network/5xx/429). */
export class ResourceAccessUnavailableError extends Error {
  readonly code = 'RESOURCE_ACCESS_UNAVAILABLE' as const;

  constructor(
    readonly reason: 'network' | number,
    readonly returnPath: string,
  ) {
    super('This page is temporarily unavailable. Please try again.');
    this.name = 'ResourceAccessUnavailableError';
  }
}

export function isResourceAccessUnavailableError(
  error: unknown,
): error is ResourceAccessUnavailableError {
  return error instanceof ResourceAccessUnavailableError;
}
