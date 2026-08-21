import { describe, expect, it } from 'vitest';
import { codexKeys } from './use-codex';
import { selectPowerParts, selectTechniqueParts } from '@/lib/codex/part-type';
import { CODEX_PAYLOAD_KEYS } from '@/types/codex';

describe('codex query keys (TASK-775)', () => {
  it('keeps the full payload on ["codex"] and each slice under that prefix', () => {
    expect(codexKeys.all).toEqual(['codex']);
    for (const collection of CODEX_PAYLOAD_KEYS) {
      expect(codexKeys.collection(collection)).toEqual(['codex', collection]);
    }
  });

  it('lets admin ["codex"] invalidation reach every slice by prefix', () => {
    const prefix = codexKeys.all;
    const featsKey = codexKeys.collection('feats');
    expect(featsKey.slice(0, prefix.length)).toEqual([...prefix]);
  });
});

describe('codex parts split (TASK-775)', () => {
  const parts = [
    { id: 'a', type: 'power' },
    { id: 'b', type: 'technique' },
    { id: 'c', type: '' },
  ];

  it('routes power and technique rows to their own hooks from one parts fetch', () => {
    expect(selectPowerParts(parts).map((p) => p.id)).toEqual(['a', 'c']);
    expect(selectTechniqueParts(parts).map((p) => p.id)).toEqual(['b', 'c']);
  });
});
