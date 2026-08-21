import type { Campaign } from '@/types/campaign';
import type { TrackedCombatant } from '@/types/encounter';
import type { LibraryCreature } from '@/types/library';
import type { VttGridConfig, VttToken, VttTokenMetadata } from '@/types/tabletop';
import { calculateCreatureMaxEnergy, calculateCreatureMaxHealth, getCreatureAbilityScore } from '@/lib/game/encounter-utils';
import { snapPointToGrid } from './grid';

const TOKEN_COLORS: Record<TrackedCombatant['combatantType'], string> = {
  ally: '#2563eb',
  enemy: '#dc2626',
  companion: '#7c3aed',
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function readRosterPortrait(campaign: Campaign | undefined, combatant: TrackedCombatant): string | undefined {
  if (!campaign || combatant.sourceType !== 'campaign-character' || !combatant.sourceId || !combatant.sourceUserId) {
    return undefined;
  }
  return readCampaignCharacterTokenImageUrl(campaign, {
    sourceType: combatant.sourceType,
    sourceId: combatant.sourceId,
    sourceUserId: combatant.sourceUserId,
  });
}

export function readCampaignCharacterTokenImageUrl(
  campaign: Campaign | undefined,
  ref: Pick<VttToken, 'sourceType' | 'sourceId' | 'sourceUserId'>
): string | undefined {
  if (!campaign || ref.sourceType !== 'campaign-character' || !ref.sourceId || !ref.sourceUserId) {
    return undefined;
  }
  return campaign.characters?.find(
    (c) => c.characterId === ref.sourceId && c.userId === ref.sourceUserId
  )?.portrait;
}

export function buildCampaignTokenImageUpdates(params: {
  campaign?: Campaign;
  existingTokens: Array<Pick<VttToken, 'id' | 'sourceType' | 'sourceId' | 'sourceUserId' | 'imageUrl'>>;
}): Array<{ id: string; imageUrl: string }> {
  return params.existingTokens.flatMap((token) => {
    const imageUrl = readCampaignCharacterTokenImageUrl(params.campaign, token);

    if (!imageUrl || token.imageUrl === imageUrl) return [];
    return [{ id: token.id, imageUrl }];
  });
}

function readCreatureImageUrl(creature: LibraryCreature): string | undefined {
  const record = creature as LibraryCreature & { image_url?: string | null; imageUrl?: string | null };
  return record.image_url ?? record.imageUrl ?? undefined;
}

function creatureSizeMultiplier(size: string | undefined): number {
  switch (size?.trim().toLowerCase()) {
    case 'large':
      return 2;
    case 'huge':
      return 3;
    case 'gargantuan':
      return 4;
    default:
      return 1;
  }
}

function tokenPointForIndex(index: number, grid: VttGridConfig): { x: number; y: number } {
  const cell = Math.max(32, grid.cellSize);
  const columns = 8;
  return snapPointToGrid(
    {
      x: grid.offsetX + cell * (1 + (index % columns)),
      y: grid.offsetY + cell * (1 + Math.floor(index / columns)),
    },
    grid
  );
}

export function metadataFromCombatant(combatant: TrackedCombatant): VttTokenMetadata {
  return {
    currentHealth: combatant.currentHealth,
    maxHealth: combatant.maxHealth,
    currentEnergy: combatant.currentEnergy,
    maxEnergy: combatant.maxEnergy,
    armor: combatant.armor,
    evasion: combatant.evasion,
    ap: combatant.ap,
    notes: combatant.notes || undefined,
  };
}

export function buildTokenFromCombatant(params: {
  sceneId: string;
  combatant: TrackedCombatant;
  index: number;
  grid: VttGridConfig;
  campaign?: Campaign;
}): Omit<VttToken, 'createdAt' | 'updatedAt'> {
  const { sceneId, combatant, index, grid, campaign } = params;
  const cell = Math.max(32, grid.cellSize);
  const point = tokenPointForIndex(index, grid);

  return {
    id: crypto.randomUUID(),
    sceneId,
    combatantId: combatant.id,
    name: combatant.name,
    label: initials(combatant.name),
    x: point.x,
    y: point.y,
    size: Math.max(36, Math.round(cell * 0.82)),
    color: TOKEN_COLORS[combatant.combatantType] ?? TOKEN_COLORS.enemy,
    imageUrl: readRosterPortrait(campaign, combatant),
    visible: combatant.combatantType !== 'enemy',
    locked: false,
    combatantType: combatant.combatantType,
    sourceType: combatant.sourceType,
    sourceId: combatant.sourceId,
    sourceUserId: combatant.sourceUserId,
    metadata: metadataFromCombatant(combatant),
  };
}

export function buildTokenFromCreature(params: {
  sceneId: string;
  creature: LibraryCreature;
  sourceId: string;
  index: number;
  grid: VttGridConfig;
  visible?: boolean;
}): Omit<VttToken, 'createdAt' | 'updatedAt'> {
  const { sceneId, creature, sourceId, index, grid } = params;
  const level = Number(creature.level || 1);
  const safeLevel = Number.isFinite(level) ? level : 1;
  const abilities = creature.abilities || {};
  const agility = getCreatureAbilityScore(abilities, 'agility');
  const maxHealth = calculateCreatureMaxHealth(safeLevel, abilities, creature.hitPoints ?? creature.hp ?? 0);
  const maxEnergy = calculateCreatureMaxEnergy(safeLevel, abilities, creature.energyPoints ?? 0);
  const evasion = Number(creature.defenses?.evasion ?? 10 + agility);
  const armor = Number(creature.defenses?.armor ?? 0);
  const cell = Math.max(32, grid.cellSize);
  const point = tokenPointForIndex(index, grid);
  const multiplier = creatureSizeMultiplier(creature.size);

  return {
    id: crypto.randomUUID(),
    sceneId,
    name: creature.name,
    label: initials(creature.name),
    x: point.x,
    y: point.y,
    size: Math.max(36, Math.round(cell * 0.82 * multiplier)),
    color: TOKEN_COLORS.enemy,
    imageUrl: readCreatureImageUrl(creature),
    visible: params.visible ?? false,
    locked: false,
    combatantType: 'enemy',
    sourceType: 'creature-library',
    sourceId,
    metadata: {
      currentHealth: maxHealth,
      maxHealth,
      currentEnergy: maxEnergy,
      maxEnergy,
      armor: Number.isFinite(armor) ? armor : 0,
      evasion: Number.isFinite(evasion) ? evasion : 10,
      ap: 4,
      notes: creature.description || undefined,
      creatureLevel: safeLevel,
      creatureType: creature.type,
      creatureSize: creature.size,
    },
  };
}

export function buildMissingTokensFromCombatants(params: {
  sceneId: string;
  combatants: TrackedCombatant[];
  existingTokens: Pick<VttToken, 'combatantId'>[];
  grid: VttGridConfig;
  campaign?: Campaign;
}): Omit<VttToken, 'createdAt' | 'updatedAt'>[] {
  const existingIds = new Set(params.existingTokens.map((token) => token.combatantId).filter(Boolean));
  return params.combatants
    .filter((combatant) => !existingIds.has(combatant.id))
    .map((combatant, index) =>
      buildTokenFromCombatant({
        sceneId: params.sceneId,
        combatant,
        index: params.existingTokens.length + index,
        grid: params.grid,
        campaign: params.campaign,
      })
    );
}
