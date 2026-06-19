/**
 * Shared API Client
 * =================
 * Centralized fetch wrapper for all client-side API calls.
 * Handles JSON headers, error parsing, and 204 responses.
 *
 * Usage:
 *   import { apiFetch } from '@/lib/api-client';
 *   const data = await apiFetch<MyType>('/api/endpoint', { method: 'POST', body: JSON.stringify(payload) });
 */

function parseApiErrorBody(err: unknown, fallback: string): string {
  const payload = err as { error?: string; details?: string };
  if (payload.details) {
    return `${payload.error ?? fallback}: ${payload.details}`;
  }
  return payload.error ?? fallback;
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
    throw new Error(parseApiErrorBody(err, 'Request failed'));
  }

  if (res.status === 204) return undefined as T;
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
    throw new Error(parseApiErrorBody(err, 'Request failed'));
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

/**
 * Fetch full codex data from `/api/codex`.
 * Shared between React Query hooks and non-hook service code.
 *
 * Returns a loosely-typed record — individual hooks narrow the type
 * via `select` and the caller's generic parameter.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchCodex(): Promise<Record<string, any[]>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return apiFetch<Record<string, any[]>>('/api/codex', { cache: 'no-store' });
}
