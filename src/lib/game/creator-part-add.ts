/**
 * Creator Add Part — always append the first list row (duplicate ids allowed).
 */

import type { PowerPart, TechniquePart } from '@/hooks/codex-types';

export type CreatorSelectedPowerPart = {
  part: PowerPart;
  op_1_lvl: number;
  op_2_lvl: number;
  op_3_lvl: number;
  applyDuration: boolean;
  selectedCategory: string;
};

export type CreatorSelectedTechniquePart = {
  part: TechniquePart;
  op_1_lvl: number;
  op_2_lvl: number;
  op_3_lvl: number;
  selectedCategory: string;
};

export function nextPowerPartToAdd(parts: PowerPart[]): PowerPart | undefined {
  return parts[0];
}

export function nextTechniquePartToAdd(parts: TechniquePart[]): TechniquePart | undefined {
  return parts[0];
}

export function emptyPowerPartSelection(part: PowerPart): CreatorSelectedPowerPart {
  return {
    part,
    op_1_lvl: 0,
    op_2_lvl: 0,
    op_3_lvl: 0,
    applyDuration: false,
    selectedCategory: 'any',
  };
}

export function emptyTechniquePartSelection(part: TechniquePart): CreatorSelectedTechniquePart {
  return {
    part,
    op_1_lvl: 0,
    op_2_lvl: 0,
    op_3_lvl: 0,
    selectedCategory: part.category || 'any',
  };
}
