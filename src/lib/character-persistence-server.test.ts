import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createRelationalCharacter,
  getRelationalCharacterDocument,
  patchRelationalCharacter,
} from './character-persistence-server';

function clientWithRpc(
  handler: (name: string, args: Record<string, unknown>) => { data: unknown; error: null },
) {
  const rpc = vi.fn(async (name: string, args: Record<string, unknown>) => handler(name, args));
  return { rpc };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('character relational persistence boundary', () => {
  it('returns assembled relational documents', async () => {
    const client = clientWithRpc(() => ({
      data: { id: 'char-1', name: 'Relational Name' },
      error: null,
    }));

    await expect(getRelationalCharacterDocument(client as never, 'char-1')).resolves.toEqual({
      id: 'char-1',
      name: 'Relational Name',
    });
  });

  it('maps create and patch RPC outcomes without changing the document contract', async () => {
    const client = clientWithRpc((name) => {
      if (name === 'create_character_relational') {
        return { data: { status: 'created', id: 'char-2' }, error: null };
      }
      return {
        data: { status: 'updated', updatedAt: '2026-10-14T12:00:00.000' },
        error: null,
      };
    });

    await expect(
      createRelationalCharacter(client as never, {
        characterId: 'char-2',
        document: { name: 'Hero' },
      }),
    ).resolves.toEqual({ id: 'char-2', replayed: false });
    await expect(
      patchRelationalCharacter(client as never, {
        characterId: 'char-2',
        patch: { notes: null },
        expectedUpdatedAt: '2026-10-14T11:00:00.000',
      }),
    ).resolves.toEqual({ status: 'updated', updatedAt: '2026-10-14T12:00:00.000' });
  });
});
