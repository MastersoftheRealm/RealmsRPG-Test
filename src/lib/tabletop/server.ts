import { createServiceRoleClient } from '@/lib/supabase/server';
import { normalizeCampaignRosterCharacters } from '@/lib/campaign-roster';
import { DEFAULT_VTT_GRID, normalizeGridConfig } from '@/lib/tabletop/grid';
import {
  buildCampaignTokenImageUpdates,
  mergeLiveCharacterImagesIntoCampaign,
  type CampaignCharacterTokenImageRow,
} from '@/lib/tabletop/tokens';
import { filterTabletopStateForRole } from '@/lib/tabletop/visibility';
import type { Campaign } from '@/types/campaign';
import type { TrackedCombatant } from '@/types/encounter';
import type {
  VttAction,
  VttFogState,
  VttMapAsset,
  VttRole,
  VttScene,
  VttSceneSettings,
  VttTabletopState,
  VttToken,
} from '@/types/tabletop';

export const VTT_MAPS_BUCKET = 'vtt-maps';

type SupabaseServerClient = Awaited<
  ReturnType<typeof import('@/lib/supabase/server').createClient>
>;

export type VttSceneRow = {
  id: string;
  campaign_id: string;
  encounter_id?: string | null;
  name?: string | null;
  is_active?: boolean | null;
  map?: unknown;
  grid?: unknown;
  fog?: unknown;
  settings?: unknown;
  created_at?: string | null;
  updated_at?: string | null;
};

export type VttTokenRow = {
  id: string;
  scene_id: string;
  combatant_id?: string | null;
  name?: string | null;
  label?: string | null;
  x?: number | string | null;
  y?: number | string | null;
  size?: number | string | null;
  color?: string | null;
  image_url?: string | null;
  visible?: boolean | null;
  locked?: boolean | null;
  combatant_type?: string | null;
  source_type?: string | null;
  source_id?: string | null;
  source_user_id?: string | null;
  metadata?: unknown;
  created_at?: string | null;
  updated_at?: string | null;
};

export type VttActionRow = {
  id: string;
  scene_id: string;
  user_id: string;
  type: string;
  status?: string | null;
  token_id?: string | null;
  from_x?: number | string | null;
  from_y?: number | string | null;
  to_x?: number | string | null;
  to_y?: number | string | null;
  message?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function numberFrom(value: unknown, fallback: number): number {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function objectFrom<T extends object>(value: unknown, fallback: T): T {
  return typeof value === 'object' && value !== null ? ({ ...fallback, ...value } as T) : fallback;
}

export function sceneFromRow(row: VttSceneRow, signedUrl?: string): VttScene {
  const rawMap =
    typeof row.map === 'object' && row.map !== null
      ? (row.map as Record<string, unknown>)
      : undefined;
  const map = rawMap?.storagePath
    ? ({
        storagePath: String(rawMap.storagePath),
        signedUrl,
        width: numberFrom(rawMap.width, 1200),
        height: numberFrom(rawMap.height, 800),
        fileName: typeof rawMap.fileName === 'string' ? rawMap.fileName : undefined,
        contentType: typeof rawMap.contentType === 'string' ? rawMap.contentType : undefined,
        uploadedAt: typeof rawMap.uploadedAt === 'string' ? rawMap.uploadedAt : undefined,
      } satisfies VttMapAsset)
    : undefined;

  const fog = objectFrom<VttFogState>(row.fog, { enabled: false, regions: [] });
  const settings = objectFrom<VttSceneSettings>(row.settings, { showEnemyResources: false });

  return {
    id: row.id,
    campaignId: row.campaign_id,
    encounterId: row.encounter_id ?? undefined,
    name: row.name ?? 'Tabletop Scene',
    isActive: row.is_active ?? true,
    map,
    grid: normalizeGridConfig(row.grid as Partial<VttScene['grid']> | null),
    fog: {
      enabled: Boolean(fog.enabled),
      regions: Array.isArray(fog.regions) ? fog.regions : [],
    },
    settings: {
      showEnemyResources: Boolean(settings.showEnemyResources),
    },
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

export function tokenFromRow(row: VttTokenRow): VttToken {
  return {
    id: row.id,
    sceneId: row.scene_id,
    combatantId: row.combatant_id ?? undefined,
    name: row.name ?? 'Token',
    label: row.label ?? '?',
    x: numberFrom(row.x, 0),
    y: numberFrom(row.y, 0),
    size: numberFrom(row.size, DEFAULT_VTT_GRID.cellSize * 0.82),
    color: row.color ?? '#64748b',
    imageUrl: row.image_url ?? undefined,
    visible: row.visible ?? true,
    locked: row.locked ?? false,
    combatantType:
      row.combatant_type === 'ally' || row.combatant_type === 'companion'
        ? row.combatant_type
        : 'enemy',
    sourceType:
      row.source_type === 'campaign-character' ||
      row.source_type === 'creature-library' ||
      row.source_type === 'manual'
        ? row.source_type
        : undefined,
    sourceId: row.source_id ?? undefined,
    sourceUserId: row.source_user_id ?? undefined,
    metadata: objectFrom(row.metadata, {}),
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

export function actionFromRow(row: VttActionRow): VttAction {
  return {
    id: row.id,
    sceneId: row.scene_id,
    userId: row.user_id,
    type: row.type === 'move-request' ? 'move-request' : 'ping',
    status:
      row.status === 'accepted' || row.status === 'dismissed' || row.status === 'pending'
        ? row.status
        : 'pending',
    tokenId: row.token_id ?? undefined,
    fromX: row.from_x == null ? undefined : numberFrom(row.from_x, 0),
    fromY: row.from_y == null ? undefined : numberFrom(row.from_y, 0),
    toX: numberFrom(row.to_x, 0),
    toY: numberFrom(row.to_y, 0),
    message: row.message ?? undefined,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

export function tokenToInsertRow(
  token: Omit<VttToken, 'createdAt' | 'updatedAt'>,
): Record<string, unknown> {
  return {
    id: token.id,
    scene_id: token.sceneId,
    combatant_id: token.combatantId ?? null,
    name: token.name,
    label: token.label,
    x: token.x,
    y: token.y,
    size: token.size,
    color: token.color,
    image_url: token.imageUrl ?? null,
    visible: token.visible,
    locked: token.locked,
    combatant_type: token.combatantType,
    source_type: token.sourceType ?? null,
    source_id: token.sourceId ?? null,
    source_user_id: token.sourceUserId ?? null,
    metadata: token.metadata,
  };
}

export async function updateCampaignTokenImages(
  supabase: SupabaseServerClient,
  sceneId: string,
  tokens: VttToken[],
  campaign: Campaign,
  combatants: TrackedCombatant[] = [],
): Promise<void> {
  console.log('UPDATING IMAGES');
  const updates = buildCampaignTokenImageUpdates({ campaign, existingTokens: tokens, combatants });
  console.log('updates length: ' + updates.length);
  if (updates.length === 0) return;

  const updatedAt = new Date().toISOString();
  const results = await Promise.all(
    updates.map((update) =>
      supabase
        .from('vtt_tokens')
        .update({ image_url: update.imageUrl, updated_at: updatedAt })
        .eq('scene_id', sceneId)
        .eq('id', update.id),
    ),
  );
  const failed = results.find((result) => result.error);
  console.log('SHOULD HAVE UPDATED IMAGES');
  if (failed?.error) throw failed.error;
}

export async function createMapSignedUrl(
  map: VttMapAsset | undefined,
): Promise<string | undefined> {
  if (!map?.storagePath) return undefined;
  const service = createServiceRoleClient();
  const { data, error } = await service.storage
    .from(VTT_MAPS_BUCKET)
    .createSignedUrl(map.storagePath, 60 * 60);
  if (error) {
    console.error('[VTT] signed map URL failed:', error.message);
    return undefined;
  }
  return data.signedUrl;
}

async function enrichCampaignCharacterImages(campaign: Campaign): Promise<Campaign> {
  const characterIds = [
    ...new Set(campaign.characters.map((character) => character.characterId).filter(Boolean)),
  ];
  if (characterIds.length === 0) return campaign;

  try {
    const service = createServiceRoleClient();
    const { data, error } = await service
      .from('characters')
      .select('id, user_id, data')
      .in('id', characterIds);
    if (error) {
      console.warn('[VTT] Could not load character images for token defaults:', error.message);
      return campaign;
    }
    return mergeLiveCharacterImagesIntoCampaign(
      campaign,
      (data ?? []) as CampaignCharacterTokenImageRow[],
    );
  } catch (err) {
    console.warn('[VTT] Could not load character images for token defaults:', err);
    return campaign;
  }
}

export async function getCampaignForAccess(
  supabase: SupabaseServerClient,
  campaignId: string,
  userId: string,
): Promise<{ campaign: Campaign; role: VttRole } | null> {
  const { data } = await supabase
    .from('campaigns')
    .select('id, name, owner_id, owner_username, invite_code, characters, created_at, updated_at')
    .eq('id', campaignId)
    .maybeSingle();

  if (!data) return null;
  const campaign: Campaign = {
    id: data.id,
    name: data.name ?? 'Campaign',
    ownerId: data.owner_id,
    ownerUsername: data.owner_username ?? undefined,
    inviteCode: data.invite_code ?? '',
    characters: normalizeCampaignRosterCharacters(data.characters),
    memberIds: [],
    createdAt: data.created_at ?? undefined,
    updatedAt: data.updated_at ?? undefined,
  };
  const campaignWithCurrentImages = await enrichCampaignCharacterImages(campaign);

  return {
    campaign: campaignWithCurrentImages,
    role: data.owner_id === userId ? 'realm-master' : 'player',
  };
}

export async function getSceneAccess(
  supabase: SupabaseServerClient,
  sceneId: string,
  userId: string,
): Promise<{ sceneRow: VttSceneRow; scene: VttScene; campaign: Campaign; role: VttRole } | null> {
  const { data: row } = await supabase
    .from('vtt_scenes')
    .select('*')
    .eq('id', sceneId)
    .maybeSingle();
  if (!row) return null;

  const access = await getCampaignForAccess(supabase, (row as VttSceneRow).campaign_id, userId);
  if (!access) return null;

  const sceneWithoutUrl = sceneFromRow(row as VttSceneRow);
  const signedUrl = await createMapSignedUrl(sceneWithoutUrl.map);
  return {
    sceneRow: row as VttSceneRow,
    scene: sceneFromRow(row as VttSceneRow, signedUrl),
    campaign: access.campaign,
    role: access.role,
  };
}

export async function getTabletopState(
  supabase: SupabaseServerClient,
  sceneId: string,
  userId: string,
): Promise<VttTabletopState | null> {
  const access = await getSceneAccess(supabase, sceneId, userId);
  if (!access) return null;

  const [{ data: tokenRows }, { data: actionRows }] = await Promise.all([
    supabase
      .from('vtt_tokens')
      .select('*')
      .eq('scene_id', sceneId)
      .order('created_at', { ascending: true }),
    supabase
      .from('vtt_actions')
      .select('*')
      .eq('scene_id', sceneId)
      .order('created_at', { ascending: false })
      .limit(80),
  ]);

  return filterTabletopStateForRole(
    {
      scene: access.scene,
      role: access.role,
      tokens: (tokenRows ?? []).map((row) => tokenFromRow(row as VttTokenRow)),
      actions: (actionRows ?? []).map((row) => actionFromRow(row as VttActionRow)),
    },
    userId,
  );
}
