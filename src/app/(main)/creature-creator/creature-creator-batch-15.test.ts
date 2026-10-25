import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { compactLine } from '@/components/patterns/list/creature-stat-block-helpers';
import { abilityNextCostVisible } from '@/components/creator/ability-score-editor';
import { formatProficiencyPointTotal } from '@/components/patterns/select/powered-martial-slider';
import { selectionAddBlocked } from '@/components/patterns/select/unified-selection-modal';
import { rawRecordToCreatureState } from './creature-skill-utils';
import {
  appendCreatureLanguage,
  creatureFeatRowsShowLevel,
  creatureMovementDescription,
  creatureMovementLabel,
  creaturePickerMaxSelections,
  creatureSenseLabel,
  creatureSizeDisplayLabel,
  formatCreatureGroupedNumber,
  uniqueCreatureLanguages,
} from './creature-trait-labels';

describe('creature sense and movement labels (86e3jx63g)', () => {
  it('labels Flying II, half-speed flight, and Darkvision range', () => {
    expect(creatureMovementLabel('Fly')).toBe('Flying II (Full Speed)');
    expect(creatureMovementLabel('Fly Half')).toBe('Flying (Half Speed)');
    expect(creatureSenseLabel('Darkvision')).toBe('Darkvision (6 spaces)');
    expect(creatureMovementDescription('Fly Half')).toContain('half');
    expect(creatureMovementDescription('Fly')).not.toBe('See movement rules for details.');
  });

  it('refuses a language that differs only by case and keeps the first spelling', () => {
    expect(appendCreatureLanguage(['Common', 'Elvish'], 'common')).toBeNull();
    expect(appendCreatureLanguage(['Common'], '  Dwarvish ')).toEqual(['Common', 'Dwarvish']);
    expect(uniqueCreatureLanguages(['Common', 'common', 'Elvish'])).toEqual(['Common', 'Elvish']);
    const loaded = rawRecordToCreatureState({
      languages: ['Common', 'Elvish', 'common', 'Dwarvish'],
    });
    expect(loaded.languages).toEqual(['Common', 'Elvish', 'Dwarvish']);
  });
});

describe('condition immunities and size label (86e3jx63f / 86e3jx4dt)', () => {
  it('builds a condition immunities line the same way as other trait lists', () => {
    expect(compactLine('Condition Immunities', ['Blinded', 'Charmed'])).toBe(
      'Condition Immunities Blinded, Charmed',
    );
    expect(compactLine('Condition Immunities', [])).toBeNull();
  });

  it('shows the size-table label without renaming the stored key', () => {
    expect(creatureSizeDisplayLabel('miniscule')).toBe('Minuscule');
    expect(creatureSizeDisplayLabel('medium')).toBe('Medium');
  });
});

describe('creature creator state labels (86e3jx63k / 86e3jx4dt)', () => {
  it('groups currency and uses 1 point when the proficiency total is 1', () => {
    expect(formatCreatureGroupedNumber(9565376)).toBe('9,565,376');
    expect(formatCreatureGroupedNumber(-5667)).toBe('-5,667');
    expect(formatProficiencyPointTotal(1)).toBe('Total: 1 point');
    expect(formatProficiencyPointTotal(3)).toBe('Total: 3 points');
  });

  it('stops a picker at 0 once that budget is spent out, and at 10 otherwise', () => {
    expect(creaturePickerMaxSelections(-20)).toBe(0);
    expect(creaturePickerMaxSelections(0)).toBe(0);
    expect(creaturePickerMaxSelections(4)).toBe(10);
    expect(selectionAddBlocked(0, 0)).toBe(true);
    expect(selectionAddBlocked(2, 0)).toBe(true);
    expect(selectionAddBlocked(10, 10)).toBe(true);
    expect(selectionAddBlocked(9, 10)).toBe(false);
    expect(selectionAddBlocked(3, undefined)).toBe(false);
  });

  it('keeps the next ability cost visible when points block another step', () => {
    expect(abilityNextCostVisible(2, 4, 10)).toBe(true);
    expect(abilityNextCostVisible(2, 10, 10)).toBe(false);
    expect(abilityNextCostVisible(1, 2, 10)).toBe(false);
  });

  it('hides the feat level column when every row is empty', () => {
    expect(creatureFeatRowsShowLevel([{ levelMeta: undefined }, {}])).toBe(false);
    expect(creatureFeatRowsShowLevel([{ levelMeta: { currentLevel: 2 } }])).toBe(true);
  });
});

describe('creature creator batch 15 wiring', () => {
  const page = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
  const confirm = readFileSync(
    new URL('../../../components/patterns/chrome/confirm-action-modal.tsx', import.meta.url),
    'utf8',
  );
  const shell = readFileSync(
    new URL('../../../components/creator/CreatorPageShell.tsx', import.meta.url),
    'utf8',
  );
  const section = readFileSync(
    new URL('../../../components/creator/collapsible-section.tsx', import.meta.url),
    'utf8',
  );
  const tippy = readFileSync(
    new URL('../../../components/patterns/help/info-tippy.tsx', import.meta.url),
    'utf8',
  );
  const statBlock = readFileSync(
    new URL('../../../components/patterns/list/creature-stat-block.tsx', import.meta.url),
    'utf8',
  );

  it('shows condition immunities, restarts with a close control, and expands enabled sections', () => {
    expect(page).toContain("label: 'Condition Immunities'");
    expect(page).toContain("confirmLabel: 'Restart'");
    expect(statBlock).toContain(
      "compactLine('Condition Immunities', creature.conditionImmunities)",
    );
    expect(confirm).not.toContain('showCloseButton={false}');
    expect(shell).toContain('confirmVariant="danger"');
    expect(section).toContain('setIsExpanded(true)');
    expect(tippy).toContain('setBlockHover(true)');
  });
});
