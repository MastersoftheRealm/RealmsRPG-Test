/**
 * createResourceClient — generic client-side CRUD over a REST resource.
 *
 * Several services (encounters, crafting sessions, …) shared the exact same
 * list/get/create/save/delete shape against `/api/<resource>`. This factory
 * holds that shape once; each service binds its types and exposes named
 * functions for call-site clarity. (DUP-07)
 */

import { apiFetch, apiFetchOrNull } from '@/lib/api-client';

export interface ResourceClient<TFull, TSummary, TCreate, TUpdate> {
  list: () => Promise<TSummary[]>;
  get: (id: string) => Promise<TFull | null>;
  create: (data: TCreate) => Promise<string>;
  save: (id: string, data: TUpdate) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export function createResourceClient<
  TFull,
  TSummary = TFull,
  TCreate = Partial<TFull>,
  TUpdate = Partial<TFull>,
>(basePath: string): ResourceClient<TFull, TSummary, TCreate, TUpdate> {
  const itemPath = (id: string) => `${basePath}/${encodeURIComponent(id)}`;

  return {
    list: () => apiFetch<TSummary[]>(basePath),
    get: (id: string) => apiFetchOrNull<TFull>(itemPath(id)),
    create: async (data: TCreate) => {
      const result = await apiFetch<{ id: string }>(basePath, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return result.id;
    },
    save: (id: string, data: TUpdate) =>
      apiFetch<void>(itemPath(id), { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => apiFetch<void>(itemPath(id), { method: 'DELETE' }),
  };
}
