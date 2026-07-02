/**
 * Crafting Service
 * =================
 * Client-side API calls for crafting sessions. Uses /api/crafting (Supabase).
 */

import type {
  CraftingSession,
  CraftingSessionSummary,
  CraftingSessionData,
} from '@/types/crafting';
import { createResourceClient } from './resource-client';

const client = createResourceClient<
  CraftingSession,
  CraftingSessionSummary,
  CraftingSessionData,
  Partial<CraftingSessionData>
>('/api/crafting');

export const getCraftingSessions = (): Promise<CraftingSessionSummary[]> => client.list();

export const getCraftingSession = (sessionId: string): Promise<CraftingSession | null> =>
  client.get(sessionId);

export const createCraftingSession = (data: CraftingSessionData): Promise<string> =>
  client.create(data);

export const saveCraftingSession = (
  sessionId: string,
  data: Partial<CraftingSessionData>
): Promise<void> => client.save(sessionId, data);

export const deleteCraftingSession = (sessionId: string): Promise<void> =>
  client.remove(sessionId);
