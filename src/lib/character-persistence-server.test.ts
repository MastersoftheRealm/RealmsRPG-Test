import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createRelationalCharacter,
  getRelationalCharacterDocument,
  patchRelationalCharacter,
} from './character-persistence-server';

function clientWithRpc(
  handler: (name: string, args: Record<string, unknown>) => { data: unknown; error: null },
  mirror: Record<string, unknown> | null = null,
) {
  const rpc = vi.fn(async (name: string, args: Record<string, unknown>) => handler(name, args));
  const maybeSingle = vi.fn(async () => ({
    data: mirror ? { data: mirror } : null,
    error: null,
  }));
  const query = { eq: vi.fn(() => ({ maybeSingle })), maybeSingle };
  return {
    rpc,
    from: vi.fn(() => ({ select: vi.fn(() => query) })),
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('character relational persistence boundary', () => {
  it('returns assembled documents and shadow logs only differing key names', async () => {
    vi.stubEnv('CHARACTER_RELATIONAL_SHADOW_COMPARE', 'true');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const client = clientWithRpc(
      () => ({ data: { id: 'char-1', name: 'Relational Name' }, error: null }),
      { id: 'char-1', name: 'Legacy Secret Value' },
    );

    await expect(getRelationalCharacterDocument(client as never, 'char-1')).resolves.toEqual({
      id: 'char-1',
      name: 'Relational Name',
    });
    expect(warn).toHaveBeenCalledWith('[character relational shadow] document mismatch', {
      characterId: 'char-1',
      differingKeys: ['name'],
    });
    expect(JSON.stringify(warn.mock.calls)).not.toContain('Legacy Secret Value');
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
