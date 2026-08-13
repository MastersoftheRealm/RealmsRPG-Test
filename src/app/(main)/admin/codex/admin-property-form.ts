/**
 * Admin Codex properties — form state + serializers (TASK-619).
 */

import type { ItemProperty } from '@/hooks';

export const COPY_NAME_SUFFIX = ' copy';

export type PropertyFormState = {
  name: string;
  description: string;
  type: string;
  base_ip: number | undefined;
  base_tp: number | undefined;
  base_c: number | undefined;
  op_1_desc: string;
  op_1_ip: number | undefined;
  op_1_tp: number | undefined;
  op_1_c: number | undefined;
  mechanic: boolean;
};

export const EMPTY_PROPERTY_FORM: PropertyFormState = {
  name: '',
  description: '',
  type: 'Armor',
  base_ip: undefined,
  base_tp: undefined,
  base_c: undefined,
  op_1_desc: '',
  op_1_ip: undefined,
  op_1_tp: undefined,
  op_1_c: undefined,
  mechanic: false,
};

function rawOptNum(v: unknown): number | undefined {
  return v != null && v !== '' ? (v as number) : undefined;
}

/** Values `savedPropertyFromPayload` accepts; General properties apply to any armament. */
export const PROPERTY_TYPES = ['Armor', 'Shield', 'Weapon', 'General'] as const;

/**
 * Runs on load as well as save, so anything it does not recognise is rewritten in the DB.
 * It used to collapse every non-armor/shield/weapon value to Armor, which silently
 * reclassified General properties on any edit.
 */
export function normalizePropertyType(rawType: string | undefined): string {
  const lower = (rawType || '').trim().toLowerCase();
  return PROPERTY_TYPES.find((type) => type.toLowerCase() === lower) ?? 'General';
}

export function propertyToFormState(p: ItemProperty, copyName?: string): PropertyFormState {
  const op1 = p.op_1_desc?.trim();
  return {
    name: copyName ?? p.name,
    description: p.description || '',
    type: normalizePropertyType(p.type),
    base_ip: p.base_ip,
    base_tp: p.base_tp,
    base_c: p.base_c,
    op_1_desc: op1 || '',
    op_1_ip: op1 ? rawOptNum(p.op_1_ip) : undefined,
    op_1_tp: op1 ? rawOptNum(p.op_1_tp) : undefined,
    op_1_c: op1 ? rawOptNum(p.op_1_c) : undefined,
    mechanic: Boolean(p.mechanic),
  };
}

export function optionSlotCountFromPropertyForm(form: PropertyFormState): number {
  return form.op_1_desc.trim() ? 1 : 0;
}

export function propertyFormToSavePayload(form: PropertyFormState): Record<string, unknown> {
  const op1 = form.op_1_desc.trim();
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    type: form.type,
    base_ip: form.base_ip ?? undefined,
    base_tp: form.base_tp ?? undefined,
    base_c: form.base_c ?? undefined,
    op_1_desc: op1 || null,
    op_1_ip: op1 ? (form.op_1_ip ?? null) : null,
    op_1_tp: op1 ? (form.op_1_tp ?? null) : null,
    op_1_c: op1 ? (form.op_1_c ?? null) : null,
    mechanic: form.mechanic,
  };
}

export function savedPropertyFromPayload(id: string, data: Record<string, unknown>): ItemProperty {
  const rawType = String(data.type ?? '').toLowerCase();
  const savedType =
    rawType === 'general' || rawType === 'armor' || rawType === 'weapon' || rawType === 'shield'
      ? rawType
      : undefined;
  return {
    id,
    name: String(data.name ?? ''),
    description: String(data.description ?? ''),
    type: savedType,
    tp_cost: 0,
    gold_cost: 0,
    base_ip: (data.base_ip as number | undefined) ?? undefined,
    base_tp: (data.base_tp as number | undefined) ?? undefined,
    base_c: (data.base_c as number | undefined) ?? undefined,
    op_1_desc:
      data.op_1_desc == null || data.op_1_desc === '' ? undefined : String(data.op_1_desc),
    op_1_ip: data.op_1_ip == null ? undefined : (data.op_1_ip as number),
    op_1_tp: data.op_1_tp == null ? undefined : (data.op_1_tp as number),
    op_1_c: data.op_1_c == null ? undefined : (data.op_1_c as number),
    mechanic: Boolean(data.mechanic),
  };
}
