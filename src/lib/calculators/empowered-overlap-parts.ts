/**
 * Empowered technique — cheaper-EN overlap picker (TASK-683)
 * ==========================================================
 * Guiding rule: when a hard-tied creator control maps to similar power and
 * technique parts, attach the candidate with the lower live `base_en`.
 * Ties prefer the technique-side part (empowered techniques are technique-family;
 * No Attack and most shared combat reductions live there).
 */

export type EmpoweredPartSide = 'power' | 'technique';

export type EmpoweredPartCostCandidate = {
  side: EmpoweredPartSide;
  part: {
    id: string | number;
    name: string;
    base_en?: number | null;
    mechanic?: boolean | null;
  };
};

/** Lower `base_en` wins; equal EN prefers technique side. */
export function pickCheaperEnPart(
  candidates: Array<EmpoweredPartCostCandidate | null | undefined>,
): EmpoweredPartCostCandidate | null {
  const present = candidates.filter((c): c is EmpoweredPartCostCandidate => Boolean(c?.part));
  if (present.length === 0) return null;

  return present.reduce((best, cur) => {
    const bestEn = Number(best.part.base_en ?? 0);
    const curEn = Number(cur.part.base_en ?? 0);
    if (curEn < bestEn) return cur;
    if (curEn > bestEn) return best;
    return cur.side === 'technique' ? cur : best;
  });
}

/** Flat auto-mechanic payload row for either power or technique side. */
export function toEmpoweredAutoMechanicPart(part: {
  id: string | number;
  name: string;
}): {
  id: string | number;
  name: string;
  op_1_lvl: number;
  op_2_lvl: number;
  op_3_lvl: number;
  applyDuration: boolean;
} {
  return {
    id: part.id,
    name: part.name,
    op_1_lvl: 0,
    op_2_lvl: 0,
    op_3_lvl: 0,
    applyDuration: false,
  };
}
