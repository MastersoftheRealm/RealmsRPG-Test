import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ADMIN_CODEX_ROW_ACTIONS_WIDTH,
  ADMIN_CODEX_SPECIES_ACTIONS_WIDTH,
} from './admin-codex-row-actions';

const feats = readFileSync(path.join(import.meta.dirname, 'AdminFeatsTab.tsx'), 'utf8');
const species = readFileSync(path.join(import.meta.dirname, 'AdminSpeciesTab.tsx'), 'utf8');
const archetypes = readFileSync(path.join(import.meta.dirname, 'AdminArchetypesTab.tsx'), 'utf8');
const shell = readFileSync(
  path.join(
    import.meta.dirname,
    '../../../../components/patterns/list/codex-browse-list-shell.tsx',
  ),
  'utf8',
);

describe('Admin codex row actions (86e3jzu5m)', () => {
  it('keeps the fourth feat action inside a slot wide enough for four icon buttons', () => {
    expect(ADMIN_CODEX_ROW_ACTIONS_WIDTH).toBe('8.5rem');
    expect(feats.match(/rightSlotWidth=\{ADMIN_CODEX_ROW_ACTIONS_WIDTH\}/g)).toHaveLength(2);
    expect(shell).toContain('rightSlotWidth={rightSlotWidth}');
    expect(species).toContain('rightSlotWidth={ADMIN_CODEX_SPECIES_ACTIONS_WIDTH}');
    expect(ADMIN_CODEX_SPECIES_ACTIONS_WIDTH).toBe('15rem');
    expect(archetypes).toContain('className="shrink-0"');
  });
});
