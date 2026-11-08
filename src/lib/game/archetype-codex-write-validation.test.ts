import { describe, expect, it } from 'vitest';
import {
  codexWriteLevel1LoadoutsError,
  codexWriteRecommendedAbilitiesError,
  serializeLevel1LoadoutsField,
} from '@/lib/game/archetype-path';
import { serializeRecommendedAbilities } from '@/app/(main)/admin/codex/admin-archetype-path-form';
import {
  assertCodexAdminPayloadKeys,
  toColumnarPayload,
} from '@/app/(main)/admin/codex/codex-column-map';

describe('codexWriteRecommendedAbilitiesError', () => {
  it.each([{ strength: [] }, { strength: [3] }, { strength: {} }])(
    'rejects coercible non-scalar ability values %j',
    (value) => {
      expect(codexWriteRecommendedAbilitiesError(value)).toMatch(/finite number/i);
      expect(codexWriteRecommendedAbilitiesError(JSON.parse(JSON.stringify(value)))).toMatch(
        /finite number/i,
      );
    },
  );

  it('accepts serializer output and numeric legacy strings', () => {
    const serialized = serializeRecommendedAbilities({ strength: 3, agility: 0, vitality: 2 });
    expect(codexWriteRecommendedAbilitiesError(serialized)).toBeNull();
    expect(codexWriteRecommendedAbilitiesError({ strength: '3' })).toBeNull();
    const payload = { name: 'Fighter', level1_recommended_abilities: serialized };
    expect(() => assertCodexAdminPayloadKeys('codex_archetypes', payload)).not.toThrow();
    const asJson = {
      name: 'Fighter',
      level1_recommended_abilities: JSON.stringify(serialized),
    };
    expect(() => assertCodexAdminPayloadKeys('codex_archetypes', asJson)).not.toThrow();
  });
});

describe('codexWriteLevel1LoadoutsError', () => {
  it.each([
    { sharedEquipment: [{ id: {}, quantity: 1 }] },
    { sharedEquipment: [{ id: 'gear', quantity: [1] }] },
  ])('rejects coercible non-scalar equipment values %j', (value) => {
    expect(codexWriteLevel1LoadoutsError(value)).toMatch(/string or number|finite number/i);
    expect(codexWriteLevel1LoadoutsError(JSON.parse(JSON.stringify(value)))).toMatch(
      /string or number|finite number/i,
    );
  });

  it('accepts serializer metadata and stringified JSON spreadsheet cells', () => {
    const serialized = serializeLevel1LoadoutsField({
      armorStep: 'optional',
      sharedEquipment: [{ id: '3', quantity: 4 }],
    });
    expect(codexWriteLevel1LoadoutsError(serialized)).toBeNull();
    const native = {
      name: 'Fighter',
      level1_loadouts: serialized,
    };
    expect(() => assertCodexAdminPayloadKeys('codex_archetypes', native)).not.toThrow();
    const stringJson = {
      name: 'Fighter',
      level1_loadouts: JSON.stringify(serialized),
    };
    expect(() => assertCodexAdminPayloadKeys('codex_archetypes', stringJson)).not.toThrow();
    const columnar = toColumnarPayload('codex_archetypes', native);
    expect(columnar.level1Loadouts).toEqual(serialized);
  });
});
