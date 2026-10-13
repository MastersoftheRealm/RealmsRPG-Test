import { describe, expect, it } from 'vitest';
import type { PowerPart, TechniquePart } from '@/hooks/codex-types';
import {
  buildPowerPartsPayloadForCost,
  calculatePowerCosts,
  derivePowerDisplay,
} from './power-calc';
import { calculateTechniqueCosts, deriveTechniqueDisplay } from './technique-calc';
import { buildOfficialPowerRows } from '@/lib/library/official-power-list';
import type { LibraryPower } from '@/types/library';

describe('identical saved parts cost the same everywhere (86e3jpq2k)', () => {
  const summon: PowerPart = {
    id: '950',
    name: 'Weapon Summon',
    description: 'Summon',
    category: 'General',
    mechanic: false,
    base_en: 4,
    base_tp: 2,
    percentage: false,
    duration: false,
  };
  const partsDb = [summon];

  it('library derivePowerDisplay matches creator payload for duplicate power parts', () => {
    const doc = {
      name: 'Dual Summon',
      actionType: 'basic' as const,
      parts: [
        { id: 950, name: 'Weapon Summon', op_1_lvl: 0 },
        { id: 950, name: 'Weapon Summon', op_1_lvl: 0 },
      ],
    };
    const creatorPayload = buildPowerPartsPayloadForCost(doc, partsDb);
    expect(creatorPayload.filter((row) => row.name === 'Weapon Summon')).toHaveLength(2);

    const libraryEnergy = derivePowerDisplay(doc, partsDb).energy;
    const creatorEnergy = calculatePowerCosts(creatorPayload, partsDb).totalEnergy;
    expect(libraryEnergy).toBe(8);
    expect(creatorEnergy).toBe(libraryEnergy);

    const catalog: LibraryPower[] = [
      {
        id: 'dual-summon',
        docId: 'dual-summon',
        name: doc.name,
        actionType: 'basic',
        parts: doc.parts,
      },
    ];
    expect(buildOfficialPowerRows(catalog, partsDb)[0]?.energy).toBe(libraryEnergy);
  });

  it('library deriveTechniqueDisplay matches creator payload for duplicate technique parts', () => {
    const brace: TechniquePart = {
      id: '960',
      name: 'Brace',
      description: 'Brace',
      category: 'Actions',
      base_en: 3,
      base_tp: 1,
      percentage: false,
    };
    const techniqueDb = [brace];
    const doc = {
      name: 'Double Brace',
      parts: [
        { id: 960, name: 'Brace', op_1_lvl: 0 },
        { id: 960, name: 'Brace', op_1_lvl: 0 },
      ],
    };
    const creatorPayload = doc.parts.map((p) => ({
      id: p.id,
      name: p.name,
      op_1_lvl: p.op_1_lvl ?? 0,
    }));
    const libraryEnergy = deriveTechniqueDisplay(doc, techniqueDb).energy;
    const creatorEnergy = calculateTechniqueCosts(creatorPayload, techniqueDb).totalEnergy;
    expect(libraryEnergy).toBe(6);
    expect(creatorEnergy).toBe(libraryEnergy);
  });
});
