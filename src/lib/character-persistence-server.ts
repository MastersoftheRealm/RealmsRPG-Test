import type { TypedSupabaseClient } from '@/lib/supabase/database';
import { asDbJson } from '@/lib/supabase/database';

type CharacterDocument = Record<string, unknown>;
type SupabaseError = { message: string; code?: string | undefined };
type RpcResult = PromiseLike<{ data: unknown; error: SupabaseError | null }>;
type RpcCall = (name: string, args: Record<string, unknown>) => RpcResult;

export type InventoryPatchApplyResult = {
  createdRows?: Array<{
    inventoryRowId: string;
    bucket: string;
    position: number;
  }>;
};

export type CharacterPatchResult =
  | { status: 'updated'; updatedAt: string; inventoryPatchResult?: InventoryPatchApplyResult }
  | {
      status: 'conflict';
      updatedAt?: string | undefined;
      code?: string | undefined;
      inventoryPatchResult?: InventoryPatchApplyResult;
    }
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
  const rawPatchResult = result.inventoryPatchResult;
  const inventoryPatchResult =
    rawPatchResult && typeof rawPatchResult === 'object' && !Array.isArray(rawPatchResult)
      ? parseInventoryPatchResult(rawPatchResult as Record<string, unknown>)
      : undefined;

  if (result.status === 'conflict') {
    const code = typeof result.code === 'string' ? result.code : undefined;
    return {
      status: 'conflict',
      updatedAt,
      code,
      ...(inventoryPatchResult ? { inventoryPatchResult } : {}),
    };
  }
  if (result.status !== 'updated' || !updatedAt) {
    throw new Error('patch_character_relational returned an invalid outcome');
  }
  return {
    status: 'updated',
    updatedAt,
    ...(inventoryPatchResult ? { inventoryPatchResult } : {}),
  };
}

function parseInventoryPatchResult(
  value: Record<string, unknown>,
): InventoryPatchApplyResult | undefined {
  const created = value.createdRows;
  if (!Array.isArray(created) || created.length === 0) return undefined;
  const rows: InventoryPatchApplyResult['createdRows'] = [];
  for (const entry of created) {
    if (!entry || typeof entry !== 'object') continue;
    const row = entry as Record<string, unknown>;
    const inventoryRowId = typeof row.inventoryRowId === 'string' ? row.inventoryRowId : '';
    const bucket = typeof row.bucket === 'string' ? row.bucket : '';
    const position =
      typeof row.position === 'number'
        ? row.position
        : Number.parseInt(String(row.position ?? ''), 10);
    if (!inventoryRowId || !bucket || !Number.isFinite(position)) continue;
    rows.push({ inventoryRowId, bucket, position });
  }
  return rows.length > 0 ? { createdRows: rows } : undefined;
}
