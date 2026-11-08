import { describe, expect, it } from 'vitest';
import { bodyToColumnar, rowToItem } from '@/lib/library-columnar';

describe('library metadata-only PATCH preserves creator loader legacy keys', () => {
  it('keeps technique reaction and actionTypeSelection when only the name changes', () => {
    const stored = {
      id: 'tech-1',
      docId: 'tech-1',
      user_id: 'u1',
      name: 'Riposte',
      description: '',
      action_type: 'basic',
      is_reaction: true,
      payload: {
        parts: [],
        reaction: true,
        actionTypeSelection: 'quick',
        actionType: 'basic',
        isReaction: true,
      },
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    };
    const currentItem = rowToItem('techniques', stored, 'user');
    const merged = { ...currentItem, name: 'Renamed riposte' };
    const { scalars, payload } = bodyToColumnar('techniques', merged);
    expect(scalars.name).toBe('Renamed riposte');
    expect(payload.reaction).toBe(true);
    expect(payload.actionTypeSelection).toBe('quick');
  });

  it('keeps power powerParts alias when rebuilding after a duplicate-style name patch', () => {
    const stored = {
      id: 'pow-1',
      docId: 'pow-1',
      user_id: 'u1',
      name: 'Arc',
      description: '',
      action_type: 'basic',
      is_reaction: false,
      payload: {
        powerParts: [{ id: 1, name: 'Bolt', op_1_lvl: 1 }],
        parts: [{ id: 1, name: 'Bolt', op_1_lvl: 1 }],
      },
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    };
    const currentItem = rowToItem('powers', stored, 'user');
    const merged = { ...currentItem, name: 'Renamed arc' };
    const { payload } = bodyToColumnar('powers', merged);
    expect(payload.powerParts).toHaveLength(1);
  });
});
