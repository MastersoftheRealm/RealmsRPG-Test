/**
 * Shared API Client
 * =================
 * Centralized fetch wrapper for all client-side API calls.
 * Handles JSON headers, error parsing, and 204 responses.
 *
 * Error boundary convention: see `src/docs/ARCHITECTURE.md` § Client error handling.
 *
 * Usage:
 *   import { apiFetch, getErrorMessage } from '@/lib/api-client';
 *   const data = await apiFetch<MyType>('/api/endpoint', { method: 'POST', body: JSON.stringify(payload) });
 */

function parseApiErrorBody(err: unknown, fallback: string): string {
  const payload = err as { error?: string; details?: string };
  if (payload.details) {
    return `${payload.error ?? fallback}: ${payload.details}`;
  }
  return payload.error ?? fallback;
}

/** Thrown by `apiFetch` / `apiUpload` / `apiFetchOrNull` when the response is not ok. */
export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

export function isConflictError(err: unknown): boolean {
  return isApiError(err) && err.status === 409;
}

/** Log client-side failures for dev tools / diagnostics (best-effort paths). */
export function logClientError(context: string, err: unknown): void {
  console.error(`[Client Error] ${context}:`, err);
}

/** Normalize unknown catch values for toasts / inline Alerts. */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  if (typeof err === 'string' && err.trim()) return err;
  if (err && typeof err === 'object' && 'message' in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(parseApiErrorBody(err, 'Request failed'), res.status, err);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

/** Multipart upload (FormData) — does not set Content-Type (browser sets boundary). */
export async function apiUpload<T>(url: string, formData: FormData): Promise<T> {
  const res = await fetch(url, { method: 'POST', body: formData });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(parseApiErrorBody(err, 'Upload failed'), res.status, err);
  }

  return res.json();
}

/** Like apiFetch but returns null on 404 instead of throwing. */
export async function apiFetchOrNull<T>(url: string, options?: RequestInit): Promise<T | null> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(parseApiErrorBody(err, 'Request failed'), res.status, err);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

import type { CodexPayload } from '@/types/codex';

/**
 * Fetch full codex data from `/api/codex`.
 * Shared between React Query hooks and non-hook service code.
 *
 * Returns the canonical `CodexPayload` — individual hooks narrow via `select`.
 */
export async function fetchCodex(): Promise<CodexPayload> {
  return apiFetch<CodexPayload>('/api/codex', { cache: 'no-store' });
}
