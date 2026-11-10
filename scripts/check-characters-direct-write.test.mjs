import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ALLOWED_CHARACTER_WRITE_RPCS,
  chainHasDirectCharacterTableWrite,
  directCharacterTableWriteChains,
  runCharactersDirectWriteGate,
} from './lib/characters-direct-write-gate.mjs';
import { stripComments as stripCommentsFromLegality } from './lib/character-legality-all-levels-gate.mjs';

describe('characters direct-write gate', () => {
  it('exports the relational RPC allowlist', () => {
    expect(ALLOWED_CHARACTER_WRITE_RPCS).toContain('create_character_relational');
    expect(ALLOWED_CHARACTER_WRITE_RPCS).toContain('patch_character_relational');
  });

  it.each([
    [`.from('characters').insert({ data: sheet });`, true],
    [`.from('characters').update({ name: 'x' });`, true],
    [`.from('characters').upsert({ id });`, true],
    [`.from('characters').select('id');`, false],
    [`.from('characters').delete();`, false],
    [`await rpc(client)('create_character_relational', { p_character_id: id });`, false],
  ])('chain detection: %s', (snippet, expectWrite) => {
    expect(chainHasDirectCharacterTableWrite(snippet)).toBe(expectWrite);
    expect(directCharacterTableWriteChains(stripCommentsFromLegality(snippet)).length > 0).toBe(
      expectWrite,
    );
  });

  it('passes on the current repository tree', () => {
    const root = path.join(import.meta.dirname, '..');
    const { ok, errors } = runCharactersDirectWriteGate(root);
    expect(errors, errors.join('\n')).toEqual([]);
    expect(ok).toBe(true);
  });

  it('fails when src contains a direct characters insert', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'char-direct-write-'));
    const file = path.join(tmp, 'src', 'bad.ts');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(
      file,
      `export async function bad() {
        await supabase.from('characters').insert({ data: {} });
      }`,
    );
    const { ok, errors } = runCharactersDirectWriteGate(tmp);
    expect(ok).toBe(false);
    expect(errors.some((e) => e.includes('src/bad.ts'))).toBe(true);
    fs.rmSync(tmp, { recursive: true, force: true });
  });
});
