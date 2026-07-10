import type { Campaign } from '@/types/campaign';
import type { TrackedCombatant } from '@/types/encounter';
import type { VttGridConfig, VttToken, VttTokenMetadata } from '@/types/tabletop';
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
  return campaign.characters?.find(
    (c) => c.characterId === combatant.sourceId && c.userId === combatant.sourceUserId
  )?.portrait;
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
  const columns = 8;
  const point = snapPointToGrid(
    {
      x: grid.offsetX + cell * (1 + (index % columns)),
      y: grid.offsetY + cell * (1 + Math.floor(index / columns)),
    },
    grid
  );

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
