import type { TypedSupabaseClient } from '@/lib/supabase/database';
import { asDbJson } from '@/lib/supabase/database';

type CharacterDocument = Record<string, unknown>;
type SupabaseError = { message: string; code?: string | undefined };
type RpcResult = PromiseLike<{ data: unknown; error: SupabaseError | null }>;
type RpcCall = (name: string, args: Record<string, unknown>) => RpcResult;

export type CharacterPatchResult =
  | { status: 'updated'; updatedAt: string }
  | { status: 'conflict'; updatedAt?: string | undefined }
  | { status: 'not_found' };

type CampaignCharacterReadResult =
  | { status: 'ok'; character: CharacterDocument }
  | {
      status:
        | 'unauthorized'
        | 'campaign_not_found'
        | 'not_member'
        | 'character_not_rostered'
        | 'character_not_found'
        | 'private';
    };

function rpc(client: TypedSupabaseClient): RpcCall {
  return client.rpc.bind(client) as unknown as RpcCall;
}

function objectResult(value: unknown, label: string): CharacterDocument {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} returned an invalid payload`);
  }
  return value as CharacterDocument;
}

export async function getRelationalCharacterDocument(
  client: TypedSupabaseClient,
  characterId: string,
): Promise<CharacterDocument | null> {
  const { data, error } = await rpc(client)('get_character_relational_document', {
    p_character_id: characterId,
  });
  if (error) throw error;
  if (data === null) return null;
  return objectResult(data, 'get_character_relational_document');
}

export async function getCampaignRelationalCharacterDocument(
  client: TypedSupabaseClient,
  input: { campaignId: string; characterOwnerId: string; characterId: string },
): Promise<CampaignCharacterReadResult> {
  const { data, error } = await rpc(client)('get_campaign_character_relational_document', {
    p_campaign_id: input.campaignId,
    p_character_owner_id: input.characterOwnerId,
    p_character_id: input.characterId,
  });
  if (error) throw error;
  const result = objectResult(data, 'get_campaign_character_relational_document');
  if (result.status === 'ok') {
    return {
      status: 'ok',
      character: objectResult(result.character, 'get_campaign_character_relational_document'),
    };
  }
  if (
    result.status === 'unauthorized' ||
    result.status === 'campaign_not_found' ||
    result.status === 'not_member' ||
    result.status === 'character_not_rostered' ||
    result.status === 'character_not_found' ||
    result.status === 'private'
  ) {
    return { status: result.status };
  }
  throw new Error('get_campaign_character_relational_document returned an invalid status');
}

export async function createRelationalCharacter(
  client: TypedSupabaseClient,
  input: {
    characterId: string;
    document: CharacterDocument;
    clientRequestId?: string | undefined;
  },
): Promise<{ id: string; replayed: boolean }> {
  const { data, error } = await rpc(client)('create_character_relational', {
    p_character_id: input.characterId,
    p_document: asDbJson(input.document),
    p_client_request_id: input.clientRequestId ?? null,
  });
  if (error) throw error;
  const result = objectResult(data, 'create_character_relational');
  if (typeof result.id !== 'string') {
    throw new Error('create_character_relational returned no character id');
  }
  return { id: result.id, replayed: result.status === 'replayed' };
}

export async function patchRelationalCharacter(
  client: TypedSupabaseClient,
  input: {
    characterId: string;
    patch: CharacterDocument;
    expectedUpdatedAt?: string | undefined;
  },
): Promise<CharacterPatchResult> {
  const { data, error } = await rpc(client)('patch_character_relational', {
    p_character_id: input.characterId,
    p_patch: asDbJson(input.patch),
    p_expected_updated_at: input.expectedUpdatedAt ?? null,
  });
  if (error) throw error;
  const result = objectResult(data, 'patch_character_relational');
  if (result.status === 'not_found') return { status: 'not_found' };
  const updatedAt = typeof result.updatedAt === 'string' ? result.updatedAt : undefined;
  if (result.status === 'conflict') return { status: 'conflict', updatedAt };
  if (result.status !== 'updated' || !updatedAt) {
    throw new Error('patch_character_relational returned an invalid outcome');
  }
  return { status: 'updated', updatedAt };
}
