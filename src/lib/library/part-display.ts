/**
 * Shared part/property → PartData mapping for library rows and selection modals.
 * TP math aligns with power-calc / technique-calc chip formatters (SA-4-17).
 */

import type { PartData } from '@/components/shared';
import { trainingPointsForItemPropertyRef, type ItemPropertyTpRow } from '@/lib/calculators/item-calc';
import { PART_IDS, findByIdOrName } from '@/lib/id-constants';
import type { CharacterPower, CharacterTechnique, Item } from '@/types';

export interface CodexPartRow {
  id: string | number;
  name: string;
  description?: string;
  base_tp?: number;
  op_1_tp?: number;
  op_2_tp?: number;
  op_3_tp?: number;
  op_1_desc?: string;
  op_2_desc?: string;
  op_3_desc?: string;
}

export interface CodexPropertyRow {
  id: string | number;
  name: string;
  description?: string;
  base_tp?: number;
  tp_cost?: number;
}

type PartPayload = {
  id?: string | number;
  name?: string;
  op_1_lvl?: number;
  op_2_lvl?: number;
  op_3_lvl?: number;
};

type PropertyPayload = {
  id?: string | number;
  name?: string;
  op_1_lvl?: number;
  op_2_lvl?: number;
  op_3_lvl?: number;
};

export type PartTpVariant = 'power' | 'technique';

/** Shared TP calculation used by library PartData and calculator chip formatters. */
export function computePartTrainingPoints(
  def: Pick<CodexPartRow, 'id' | 'name' | 'base_tp' | 'op_1_tp' | 'op_2_tp' | 'op_3_tp'>,
  levels: Pick<PartPayload, 'op_1_lvl' | 'op_2_lvl' | 'op_3_lvl'>,
  variant: PartTpVariant = 'power'
): number {
  const l1 = levels.op_1_lvl ?? 0;
  const l2 = levels.op_2_lvl ?? 0;
  const l3 = levels.op_3_lvl ?? 0;

  let opt1Contribution = (def.op_1_tp || 0) * l1;
  if (variant === 'technique') {
    const defId = typeof def.id === 'string' ? parseInt(def.id, 10) : def.id;
    if (defId === PART_IDS.ADDITIONAL_DAMAGE || def.name === 'Additional Damage') {
      opt1Contribution = Math.floor(opt1Contribution);
    }
  }

  const rawTP =
    (def.base_tp || 0) + opt1Contribution + (def.op_2_tp || 0) * l2 + (def.op_3_tp || 0) * l3;

  return Math.floor(rawTP);
}

function buildOptionEntries(
  def: CodexPartRow,
  levels: Pick<PartPayload, 'op_1_lvl' | 'op_2_lvl' | 'op_3_lvl'>
): PartData['options'] {
  const opt1 = levels.op_1_lvl ?? 0;
  const opt2 = levels.op_2_lvl ?? 0;
  const opt3 = levels.op_3_lvl ?? 0;
  const options: NonNullable<PartData['options']> = [];
  if (opt1 > 0) options.push({ label: 'Option 1', description: def.op_1_desc, level: opt1 });
  if (opt2 > 0) options.push({ label: 'Option 2', description: def.op_2_desc, level: opt2 });
  if (opt3 > 0) options.push({ label: 'Option 3', description: def.op_3_desc, level: opt3 });
  return options.length > 0 ? options : undefined;
}

export function partPayloadToPartData(
  payload: string | PartPayload,
  codexParts: CodexPartRow[],
  variant: PartTpVariant
): PartData {
  if (typeof payload === 'string') {
    const codexPart = codexParts.find((p) => p.name?.toLowerCase() === payload.toLowerCase());
    return {
      name: payload,
      description: codexPart?.description,
      tpCost: codexPart?.base_tp,
    };
  }

  const partName = String(payload.name || payload.id || 'Unknown Part');
  const def =
    findByIdOrName(codexParts, { id: payload.id, name: payload.name ?? partName }) ??
    codexParts.find((p) => p.name?.toLowerCase() === String(partName).toLowerCase());

  const codexPart = def ?? ({ name: partName } as CodexPartRow);
  const tpCost = computePartTrainingPoints(codexPart, payload, variant);

  return {
    name: codexPart.name || partName,
    description: codexPart.description,
    tpCost: tpCost > 0 ? tpCost : undefined,
    optionLevels: {
      opt1: payload.op_1_lvl,
      opt2: payload.op_2_lvl,
      opt3: payload.op_3_lvl,
    },
    options: def ? buildOptionEntries(codexPart, payload) : undefined,
  };
}

export function characterPartsToPartData(
  parts?: CharacterPower['parts'] | CharacterTechnique['parts'],
  codexParts: CodexPartRow[] = [],
  variant: PartTpVariant = 'power'
): PartData[] {
  if (!parts || parts.length === 0) return [];
  return parts.map((part) => partPayloadToPartData(part as string | PartPayload, codexParts, variant));
}

export function itemPropertiesToPartData(
  properties?: Item['properties'],
  codexProperties: CodexPropertyRow[] = []
): PartData[] {
  if (!properties || properties.length === 0) return [];
  const db = codexProperties as unknown as ItemPropertyTpRow[];

  return properties.map((prop) => {
    if (typeof prop === 'string') {
      const codexProp = codexProperties.find((p) => p.name?.toLowerCase() === prop.toLowerCase());
      const tp = trainingPointsForItemPropertyRef(prop, db);
      return {
        name: prop,
        description: codexProp?.description,
        tpCost: tp > 0 ? tp : undefined,
        category: 'property',
      };
    }

    const propObj = prop as PropertyPayload;
    const propId = propObj.id;
    const propName = propObj.name || 'Unknown Property';

    let codexProp = codexProperties.find((p) => propId && String(p.id) === String(propId));
    if (!codexProp) {
      codexProp = codexProperties.find((p) => p.name?.toLowerCase() === propName.toLowerCase());
    }

    const tp = trainingPointsForItemPropertyRef(propObj, db);

    return {
      name: codexProp?.name || propName,
      description: codexProp?.description,
      tpCost: tp > 0 ? tp : undefined,
      category: 'property',
      optionLevels:
        (propObj.op_1_lvl ?? propObj.op_2_lvl ?? propObj.op_3_lvl) != null
          ? { opt1: propObj.op_1_lvl, opt2: propObj.op_2_lvl, opt3: propObj.op_3_lvl }
          : undefined,
    };
  });
}
