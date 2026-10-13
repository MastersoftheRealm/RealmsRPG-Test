import { describe, expect, it } from 'vitest';
import {
  buildCodexChangelogPersistPayload,
  diffCodexChangedFields,
  formatCodexChangeValue,
  formatCodexChangelogHeadline,
  parseChangedFields,
  parseChangedFieldsForOperation,
  summarizeChangedFieldNames,
} from './codex-changelog-display';

describe('codex-changelog-display (TASK-874)', () => {
  it('formats primitives and truncates long strings', () => {
    expect(formatCodexChangeValue(null)).toBe('—');
    expect(formatCodexChangeValue('')).toBe('—');
    expect(formatCodexChangeValue([])).toBe('—');
    expect(formatCodexChangeValue('Fireball')).toBe('Fireball');
    expect(formatCodexChangeValue(3)).toBe('3');
    expect(formatCodexChangeValue('x'.repeat(200)).endsWith('…')).toBe(true);
  });

  it('parses changed_fields rows and drops empty-equivalent clutter', () => {
    expect(
      parseChangedFields([
        { field: 'name', before: 'Find the Chink', after: 'Find the Gap' },
        { field: 'ability_req', before: null, after: '' },
        { field: 'abil_req_val', before: '', after: null },
        { field: 'skill_req', before: [], after: null },
        { field: 'skill_req_val', before: {}, after: '' },
        { field: 'updated_at', before: '2026-08-13T21:27:50Z', after: '2026-08-21T19:18:20Z' },
        { field: 'description', before: null, after: 'Text' },
      ]),
    ).toEqual([
      { field: 'name', before: 'Find the Chink', after: 'Find the Gap' },
      { field: 'description', before: null, after: 'Text' },
    ]);
  });

  it('summarizes field names for list rows', () => {
    const changes = parseChangedFields([
      { field: 'name', before: 'A', after: 'B' },
      { field: 'category', before: 'X', after: 'Y' },
    ]);
    expect(summarizeChangedFieldNames(changes)).toBe('name, category');
    expect(
      summarizeChangedFieldNames(
        parseChangedFields([
          { field: 'a', before: 1, after: 2 },
          { field: 'b', before: 1, after: 2 },
          { field: 'c', before: 1, after: 2 },
          { field: 'd', before: 1, after: 2 },
          { field: 'e', before: 1, after: 2 },
        ]),
      ),
    ).toBe('a, b, c +2 more');
  });

  it('summarizes creates as name + kind and skips field dumps', () => {
    expect(
      formatCodexChangelogHeadline({
        operation: 'create',
        entityType: 'codex_feats',
        entityName: 'Find the Gap',
        fieldChanges: [{ field: 'description', before: null, after: 'lots' }],
      }),
    ).toBe('Created “Find the Gap” (Feat)');
    expect(
      parseChangedFieldsForOperation('create', [
        { field: 'name', before: null, after: 'Find the Gap' },
        { field: 'description', before: null, after: 'lots' },
      ]),
    ).toEqual([]);
    expect(
      buildCodexChangelogPersistPayload('create', null, {
        name: 'Find the Gap',
        description: 'lots',
        ability_req: '',
        updated_at: 'now',
      }),
    ).toEqual({
      before_data: null,
      after_data: { name: 'Find the Gap' },
      changed_fields: [],
    });
  });

  it('keeps delete field diffs so the prior state is visible', () => {
    expect(
      formatCodexChangelogHeadline({
        operation: 'delete',
        entityType: 'codex_feats',
        entityName: 'Find the Gap',
        fieldChanges: [],
      }),
    ).toBe('Deleted “Find the Gap” (Feat)');
    const deleted = buildCodexChangelogPersistPayload(
      'delete',
      { name: 'Find the Gap', description: 'A feat' },
      null,
    );
    expect(deleted.before_data).toEqual({ name: 'Find the Gap', description: 'A feat' });
    expect(deleted.after_data).toBeNull();
    expect(deleted.changed_fields.some((row) => row.field === 'name')).toBe(true);
  });

  it('diffs only content fields that actually changed', () => {
    expect(
      diffCodexChangedFields(
        {
          name: 'Find the Chink',
          ability_req: null,
          abil_req_val: '',
          updated_at: '2026-08-13T21:27:50.717982+00:00',
        },
        {
          name: 'Find the Gap',
          ability_req: '',
          abil_req_val: null,
          updated_at: '2026-08-21T19:18:20.241711+00:00',
        },
      ),
    ).toEqual([{ field: 'name', before: 'Find the Chink', after: 'Find the Gap' }]);
  });
});
