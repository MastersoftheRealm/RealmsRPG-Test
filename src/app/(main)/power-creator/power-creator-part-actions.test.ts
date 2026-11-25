import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { PowerPart } from '@/hooks';
import { nextPowerPartToAdd } from '@/lib/game/creator-part-add';
import type { AdvancedPart } from './power-creator-types';

function part(id: string, name: string): PowerPart {
  return {
    id,
    name,
    description: name,
    category: 'Test',
    mechanic: true,
    base_en: 0,
    base_tp: 0,
    percentage: false,
    duration: false,
  };
}

describe('Power Mechanics Add Part', () => {
  it('always offers the first mechanic entry, even when already selected', () => {
    const mechanicPartsForList = [part('1', 'Range'), part('2', 'Area'), part('3', 'Duration')];
    const range = mechanicPartsForList[0]!;
    const selected: AdvancedPart[] = [
      {
        part: range,
        op_1_lvl: 0,
        op_2_lvl: 0,
        op_3_lvl: 0,
        applyDuration: false,
        selectedCategory: 'any',
      },
    ];

    expect(nextPowerPartToAdd(mechanicPartsForList)?.id).toBe('1');
    selected.push({
      part: range,
      op_1_lvl: 0,
      op_2_lvl: 0,
      op_3_lvl: 0,
      applyDuration: false,
      selectedCategory: 'any',
    });
    expect(nextPowerPartToAdd(mechanicPartsForList)?.id).toBe('1');
  });
});

describe('86e3jwt6d area Apply duration accessible name', () => {
  const configSrc = readFileSync(
    new URL('./power-creator-editor-power-config.tsx', import.meta.url),
    'utf8',
  );

  it('exposes an accessible name on the area Apply duration control', () => {
    const areaBlock = configSrc.slice(
      configSrc.indexOf("area.type !== 'none' &&"),
      configSrc.indexOf('areaPartInfo &&'),
    );
    expect(areaBlock).toContain('label="Apply duration"');
    expect(areaBlock).toContain('aria-label="Apply duration"');
  });
});

describe('86e3jwt6a damage row delete control layout', () => {
  const damageSrc = readFileSync(
    new URL('./power-creator-editor-power-damage.tsx', import.meta.url),
    'utf8',
  );

  it('keeps the remove control on the row header line via shrink-0 sibling layout', () => {
    expect(damageSrc).toContain('className="shrink-0"');
    expect(damageSrc).toMatch(
      /flex items-start gap-3[\s\S]*flex min-w-0 flex-1 flex-wrap[\s\S]*Remove damage type row/,
    );
  });
});
