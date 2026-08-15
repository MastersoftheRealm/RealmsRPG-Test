/**
 * Admin Codex parts — form state + energy/option serializers (TASK-609).
 */

import type { Part } from '@/hooks';

export const COPY_NAME_SUFFIX = ' copy';

export type PartFormState = {
  name: string;
  description: string;
  category: string;
  type: 'power' | 'technique';
  base_en: number | undefined;
  base_tp: number | undefined;
  mechanic: boolean;
  percentage: boolean;
  duration: boolean;
  defense: string[];
  op_1_desc: string;
  op_1_en: number | undefined;
  op_1_tp: number | undefined;
  op_2_desc: string;
  op_2_en: number | undefined;
  op_2_tp: number | undefined;
  op_3_desc: string;
  op_3_en: number | undefined;
  op_3_tp: number | undefined;
};

export const EMPTY_PART_FORM: PartFormState = {
  name: '',
  description: '',
  category: '',
  type: 'power',
  base_en: undefined,
  base_tp: undefined,
  mechanic: false,
  percentage: false,
  duration: false,
  defense: [],
  op_1_desc: '',
  op_1_en: undefined,
  op_1_tp: undefined,
  op_2_desc: '',
  op_2_en: undefined,
  op_2_tp: undefined,
  op_3_desc: '',
  op_3_en: undefined,
  op_3_tp: undefined,
};

export type PartOption = { desc: string; en?: number; tp?: number };

/** Format number preserving decimals (no rounding); strip trailing zeros. */
export function formatDecimalPreserve(n: number, maxDecimals = 10): string {
  if (n === 0) return '0';
  const s = n.toFixed(maxDecimals);
  return s.replace(/\.?0+$/, '') || '0';
}

export function formatEnergyCost(
  en: number | undefined,
  isPercentage: boolean | undefined,
): string {
  if (en === undefined || en === 0) return '-';
  if (isPercentage) {
    const percentChange = (en - 1) * 100;
    const sign = percentChange >= 0 ? '+' : '';
    return `${sign}${formatDecimalPreserve(percentChange)}%`;
  }
  return formatDecimalPreserve(en);
}

export function baseEnToPercent(backend: number | undefined): string {
  if (backend == null) return '';
  const p = (backend - 1) * 100;
  return formatDecimalPreserve(p);
}

export function percentToBaseEn(percentStr: string): number | undefined {
  if (percentStr === '') return undefined;
  const p = parseFloat(percentStr);
  if (Number.isNaN(p)) return undefined;
  return 1 + p / 100;
}

export function optionEnToPercent(backend: number | undefined): string {
  if (backend == null) return '';
  const p = (backend ?? 0) * 100;
  return formatDecimalPreserve(p);
}

export function percentToOptionEn(percentStr: string): number | undefined {
  if (percentStr === '') return undefined;
  const p = parseFloat(percentStr);
  if (Number.isNaN(p)) return undefined;
  return p / 100;
}

/** Normalize stored defense tags (e.g. legacy lowercase "evasion") for editor chips. */
export function normalizePartTargetedDefenses(defenses: string[] | undefined): string[] {
  if (!Array.isArray(defenses)) return [];
  return defenses.map((d) => (String(d).toLowerCase() === 'evasion' ? 'Evasion' : d));
}

function rawOptNum(v: unknown): number | undefined {
  return v != null && v !== '' ? (v as number) : undefined;
}

export function partToFormState(p: Part & { defense?: string[] }): PartFormState {
  const op1 = p.op_1_desc?.trim();
  const op2 = p.op_2_desc?.trim();
  const op3 = p.op_3_desc?.trim();
  return {
    name: p.name,
    description: p.description || '',
    category: p.category || '',
    type: ((p.type || 'power').toLowerCase() === 'technique' ? 'technique' : 'power') as
      | 'power'
      | 'technique',
    base_en: p.base_en,
    base_tp: p.base_tp,
    mechanic: Boolean(p.mechanic),
    percentage: Boolean(p.percentage),
    duration: Boolean(p.duration),
    defense: normalizePartTargetedDefenses(p.defense),
    op_1_desc: op1 || '',
    op_1_en: op1 ? rawOptNum(p.op_1_en) : undefined,
    op_1_tp: op1 ? rawOptNum(p.op_1_tp) : undefined,
    op_2_desc: op2 || '',
    op_2_en: op2 ? rawOptNum(p.op_2_en) : undefined,
    op_2_tp: op2 ? rawOptNum(p.op_2_tp) : undefined,
    op_3_desc: op3 || '',
    op_3_en: op3 ? rawOptNum(p.op_3_en) : undefined,
    op_3_tp: op3 ? rawOptNum(p.op_3_tp) : undefined,
  };
}

export function optionSlotCountFromForm(form: PartFormState): number {
  return [form.op_1_desc, form.op_2_desc, form.op_3_desc].map((s) => s.trim()).filter(Boolean)
    .length;
}

export function partFormToSavePayload(form: PartFormState): Record<string, unknown> {
  const op1 = form.op_1_desc.trim();
  const op2 = form.op_2_desc.trim();
  const op3 = form.op_3_desc.trim();
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    category: form.category.trim(),
    type: form.type,
    base_en: form.base_en ?? undefined,
    base_tp: form.base_tp ?? undefined,
    mechanic: form.mechanic,
    percentage: form.percentage,
    duration: form.duration,
    defense: form.defense.length > 0 ? form.defense : undefined,
    op_1_desc: op1 || null,
    op_1_en: op1 ? (form.op_1_en ?? null) : null,
    op_1_tp: op1 ? (form.op_1_tp ?? null) : null,
    op_2_desc: op2 || null,
    op_2_en: op2 ? (form.op_2_en ?? null) : null,
    op_2_tp: op2 ? (form.op_2_tp ?? null) : null,
    op_3_desc: op3 || null,
    op_3_en: op3 ? (form.op_3_en ?? null) : null,
    op_3_tp: op3 ? (form.op_3_tp ?? null) : null,
  };
}

export function savedPartFromPayload(id: string, data: Record<string, unknown>): Part {
  return {
    id,
    name: String(data.name ?? ''),
    description: String(data.description ?? ''),
    category: String(data.category ?? ''),
    type: (data.type === 'technique' ? 'technique' : 'power') as 'power' | 'technique',
    base_en: (data.base_en as number | undefined) ?? 0,
    base_tp: (data.base_tp as number | undefined) ?? 0,
    op_1_desc: data.op_1_desc == null || data.op_1_desc === '' ? undefined : String(data.op_1_desc),
    op_1_en: data.op_1_en == null ? undefined : (data.op_1_en as number),
    op_1_tp: data.op_1_tp == null ? undefined : (data.op_1_tp as number),
    op_2_desc: data.op_2_desc == null || data.op_2_desc === '' ? undefined : String(data.op_2_desc),
    op_2_en: data.op_2_en == null ? undefined : (data.op_2_en as number),
    op_2_tp: data.op_2_tp == null ? undefined : (data.op_2_tp as number),
    op_3_desc: data.op_3_desc == null || data.op_3_desc === '' ? undefined : String(data.op_3_desc),
    op_3_en: data.op_3_en == null ? undefined : (data.op_3_en as number),
    op_3_tp: data.op_3_tp == null ? undefined : (data.op_3_tp as number),
    duration: Boolean(data.duration),
    percentage: Boolean(data.percentage),
    mechanic: Boolean(data.mechanic),
    defense: Array.isArray(data.defense) ? (data.defense as string[]) : undefined,
  };
}
