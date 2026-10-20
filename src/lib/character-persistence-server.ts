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

function rpc(client: TypedSupabaseClient): RpcCall {
  return client.rpc.bind(client) as unknown as RpcCall;
}

function objectResult(value: unknown, label: string): CharacterDocument {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} returned an invalid payload`);
  }
  return value as CharacterDocument;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'undefined';
}

function differingTopLevelKeys(left: CharacterDocument, right: CharacterDocument): string[] {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  return [...keys].filter((key) => stableJson(left[key]) !== stableJson(right[key])).sort();
}

async function shadowCompare(
  client: TypedSupabaseClient,
  characterId: string,
  relational: CharacterDocument,
): Promise<void> {
  if (process.env.CHARACTER_RELATIONAL_SHADOW_COMPARE !== 'true') return;
  const { data, error } = await client
    .from('characters')
    .select('data')
    .eq('id', characterId)
    .maybeSingle();
  if (error) {
    console.warn('[character relational shadow] mirror read failed', {
      characterId,
      code: error.code,
    });
    return;
  }
  const mirror = data?.data;
  if (!mirror || typeof mirror !== 'object' || Array.isArray(mirror)) return;
  const differingKeys = differingTopLevelKeys(relational, mirror as CharacterDocument);
  if (differingKeys.length > 0) {
    console.warn('[character relational shadow] document mismatch', {
      characterId,
      differingKeys,
    });
  }
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
  const document = objectResult(data, 'get_character_relational_document');
  await shadowCompare(client, characterId, document);
  return document;
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

export async function provisionRelationalCharacter(
  client: TypedSupabaseClient,
  input: { characterId: string; ownerId: string; document: CharacterDocument },
): Promise<void> {
  const { error } = await rpc(client)('provision_character_relational', {
    p_character_id: input.characterId,
    p_owner_id: input.ownerId,
    p_document: asDbJson(input.document),
  });
  if (error) throw error;
}
