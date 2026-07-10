import { describe, expect, it } from 'vitest';
import type { VttTabletopState } from '@/types/tabletop';
import { filterTabletopStateForRole } from './visibility';

const state: VttTabletopState = {
  role: 'player',
  scene: {
    id: 'scene-1',
    campaignId: 'campaign-1',
    name: 'Scene',
    isActive: true,
    grid: { enabled: true, cellSize: 70, offsetX: 0, offsetY: 0, color: '#fff', opacity: 0.5, snap: true },
    fog: { enabled: false, regions: [] },
    settings: { showEnemyResources: false },
  },
  tokens: [
    {
      id: 'ally',
      sceneId: 'scene-1',
      name: 'Ally',
      label: 'AL',
      x: 0,
      y: 0,
      size: 40,
      color: '#2563eb',
      visible: true,
      locked: false,
      combatantType: 'ally',
      metadata: { currentHealth: 9, maxHealth: 10, ap: 4 },
    },
    {
      id: 'hidden-enemy',
      sceneId: 'scene-1',
      name: 'Hidden enemy',
      label: 'HE',
      x: 0,
      y: 0,
      size: 40,
      color: '#dc2626',
      visible: false,
      locked: false,
      combatantType: 'enemy',
      metadata: { currentHealth: 12, maxHealth: 12, armor: 2, ap: 4 },
    },
    {
      id: 'visible-enemy',
      sceneId: 'scene-1',
      name: 'Visible enemy',
      label: 'VE',
      x: 0,
      y: 0,
      size: 40,
      color: '#dc2626',
      visible: true,
      locked: false,
      combatantType: 'enemy',
      metadata: { currentHealth: 12, maxHealth: 12, armor: 2, ap: 4 },
    },
  ],
  actions: [
    { id: 'own-move', sceneId: 'scene-1', userId: 'player-1', type: 'move-request', status: 'pending', toX: 1, toY: 1 },
    { id: 'other-move', sceneId: 'scene-1', userId: 'player-2', type: 'move-request', status: 'pending', toX: 2, toY: 2 },
    { id: 'ping', sceneId: 'scene-1', userId: 'player-2', type: 'ping', status: 'accepted', toX: 3, toY: 3 },
  ],
};

describe('tabletop visibility filtering', () => {
  it('filters hidden tokens, enemy resources, and other players move requests', () => {
    const filtered = filterTabletopStateForRole(state, 'player-1');
    expect(filtered.tokens.map((token) => token.id)).toEqual(['ally', 'visible-enemy']);
    expect(filtered.tokens.find((token) => token.id === 'visible-enemy')?.metadata).toEqual({ armor: 2 });
    expect(filtered.actions.map((action) => action.id)).toEqual(['own-move', 'ping']);
  });
});

