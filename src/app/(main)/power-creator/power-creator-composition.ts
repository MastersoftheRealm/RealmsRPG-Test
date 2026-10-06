/**
 * Power Creator — built-in variants (ADR-0029), pure helpers.
 * The editor always edits one tab's fields; these convert between that form shape and
 * the saved `payload.composition` spec.
 */

import type { PowerPart } from '@/hooks';
import type {
  PowerComposition,
  PowerCompositionStructure,
  PowerVariantPolarity,
  PowerVariantSpec,
} from '@/lib/calculators';
import { powerSpecHasContent } from '@/lib/calculators';
import { dedupeSavedParts } from '@/lib/game/dedupe-saved-parts';
import {
  emptyPowerCreatorFormState,
  powerLibraryRecordToFormState,
  type PowerCreatorFormState,
  type PowerLibraryRecord,
} from './power-creator-bootstrap';

/** Fields a tab owns (name, description, image, and targets stay power-level). */
export type PowerTabForm = Pick<
  PowerCreatorFormState,
  | 'selectedParts'
  | 'selectedAdvancedParts'
  | 'actionType'
  | 'isReaction'
  | 'damages'
  | 'range'
  | 'area'
  | 'duration'
  | 'attackMode'
>;

export interface PowerVariantTab {
  id: string;
  label: string;
  polarity: PowerVariantPolarity;
  /** Optional Choice / Alternate variant description (Modify pieces share the power's). */
  description: string;
  form: PowerTabForm;
}

export const SHARED_TAB_ID = 'shared';
export const REVERSE_TAB_ID = 'reverse';

export function pickTabForm(state: PowerCreatorFormState): PowerTabForm {
  return {
    selectedParts: state.selectedParts,
    selectedAdvancedParts: state.selectedAdvancedParts,
    actionType: state.actionType,
    isReaction: state.isReaction,
    damages: state.damages,
    range: state.range,
    area: state.area,
    duration: state.duration,
    attackMode: state.attackMode,
  };
}

export function emptyTabForm(): PowerTabForm {
  return pickTabForm(emptyPowerCreatorFormState());
}

function savedParts(form: PowerTabForm) {
  return dedupeSavedParts([
    ...form.selectedParts.map((sp) => ({
      id: Number(sp.part.id),
      name: sp.part.name,
      op_1_lvl: sp.op_1_lvl,
      op_2_lvl: sp.op_2_lvl,
      op_3_lvl: sp.op_3_lvl,
      applyDuration: sp.applyDuration,
    })),
    ...form.selectedAdvancedParts.map((ap) => ({
      id: Number(ap.part.id),
      name: ap.part.name,
      op_1_lvl: ap.op_1_lvl,
      op_2_lvl: ap.op_2_lvl,
      op_3_lvl: ap.op_3_lvl,
      applyDuration: ap.applyDuration,
      isAdvanced: true,
    })),
  ]);
}

function savedDamage(form: PowerTabForm) {
  return form.damages
    .filter((d) => d.type !== 'none' && d.amount > 0)
    .map((d) => ({
      amount: d.amount,
      size: d.size,
      type: d.type,
      applyDuration: d.applyDuration ?? false,
    }));
}

/** Full power spec (plain power top-level, Alternate variant, Shared chassis). */
export function tabFormToSpec(form: PowerTabForm): PowerVariantSpec {
  return {
    parts: savedParts(form),
    damage: savedDamage(form),
    actionType: form.actionType,
    isReaction: form.isReaction,
    range: form.range,
    area: form.area,
    duration: form.duration,
    attackMode: form.attackMode,
  };
}

/** Only the fields a portion / piece / outcome / drawback sets (overlay on the shared chassis). */
export function tabFormToOverlay(form: PowerTabForm): PowerVariantSpec {
  const spec: PowerVariantSpec = {};
  const empty = emptyTabForm();
  const parts = savedParts(form);
  if (parts.length > 0) spec.parts = parts;
  const damage = savedDamage(form);
  if (damage.length > 0) spec.damage = damage;
  if (form.range.steps > 0) spec.range = form.range;
  if (form.area.type !== 'none') spec.area = form.area;
  if (form.duration.type !== 'instant') spec.duration = form.duration;
  if (form.actionType !== empty.actionType) spec.actionType = form.actionType;
  if (form.isReaction !== empty.isReaction) spec.isReaction = form.isReaction;
  if (form.attackMode !== empty.attackMode) spec.attackMode = form.attackMode;
  return spec;
}

export function specToTabForm(spec: PowerVariantSpec, powerParts: PowerPart[]): PowerTabForm {
  return pickTabForm(powerLibraryRecordToFormState(spec as PowerLibraryRecord, powerParts));
}

/** Alternate from overlays: fill unset variant fields from the shared chassis. */
export function mergeOverlayIntoShared(shared: PowerTabForm, v: PowerTabForm): PowerTabForm {
  const hasDamage = v.damages.some((d) => d.type !== 'none' && d.amount > 0);
  return {
    ...shared,
    selectedParts: [...shared.selectedParts, ...v.selectedParts],
    selectedAdvancedParts: [...shared.selectedAdvancedParts, ...v.selectedAdvancedParts],
    damages: hasDamage ? v.damages : shared.damages,
    range: v.range.steps > 0 ? v.range : shared.range,
    area: v.area.type !== 'none' ? v.area : shared.area,
    duration: v.duration.type !== 'instant' ? v.duration : shared.duration,
  };
}

/** Overlay from a full power: drop what the shared chassis already has. */
export function diffAgainstShared(shared: PowerTabForm, v: PowerTabForm): PowerTabForm {
  const sameJson = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  const sharedPartKeys = new Set(
    [...shared.selectedParts, ...shared.selectedAdvancedParts].map(
      (p) => `${p.part.id}:${p.op_1_lvl}:${p.op_2_lvl}:${p.op_3_lvl}`,
    ),
  );
  const keep = <
    T extends { part: { id: string }; op_1_lvl: number; op_2_lvl: number; op_3_lvl: number },
  >(
    list: T[],
  ) =>
    list.filter(
      (p) => !sharedPartKeys.has(`${p.part.id}:${p.op_1_lvl}:${p.op_2_lvl}:${p.op_3_lvl}`),
    );
  const empty = emptyTabForm();
  return {
    ...v,
    selectedParts: keep(v.selectedParts),
    selectedAdvancedParts: keep(v.selectedAdvancedParts),
    damages: sameJson(v.damages, shared.damages) ? empty.damages : v.damages,
    range: sameJson(v.range, shared.range) ? empty.range : v.range,
    area: sameJson(v.area, shared.area) ? empty.area : v.area,
    duration: sameJson(v.duration, shared.duration) ? empty.duration : v.duration,
    actionType: v.actionType === shared.actionType ? empty.actionType : v.actionType,
    isReaction: v.isReaction === shared.isReaction ? empty.isReaction : v.isReaction,
    attackMode: v.attackMode === shared.attackMode ? empty.attackMode : v.attackMode,
  };
}

export function nextVariantId(existing: PowerVariantTab[]): string {
  const used = new Set(existing.map((v) => v.id));
  let n = existing.length + 1;
  while (used.has(`v${n}`)) n += 1;
  return `v${n}`;
}

export function nextVariantLabel(existing: PowerVariantTab[]): string {
  const used = new Set(existing.map((v) => v.label));
  let n = existing.length + 1;
  while (used.has(`Variant ${n}`)) n += 1;
  return `Variant ${n}`;
}

/** Choice / Modify / Randomize / Alternate open with two tabs (DEV-V-061-T001). */
export function defaultVariantTabs(shared: PowerTabForm, copyShared: boolean): PowerVariantTab[] {
  return [
    {
      id: 'v1',
      label: 'Variant 1',
      polarity: 'positive',
      description: '',
      form: copyShared ? shared : emptyTabForm(),
    },
    {
      id: 'v2',
      label: 'Variant 2',
      polarity: 'positive',
      description: '',
      form: copyShared ? shared : emptyTabForm(),
    },
  ];
}

/** Evenly spread variants across the die faces in order (1, 2, 1, 2, …). */
export function spreadDieFaces(sides: number, variants: PowerVariantTab[]): string[] {
  if (variants.length === 0) return Array.from({ length: sides }, () => '');
  return Array.from({ length: sides }, (_, i) => variants[i % variants.length]!.id);
}

export interface CollectedCompositionForms {
  structure: PowerCompositionStructure;
  reverseEnabled: boolean;
  shared: PowerTabForm;
  variants: PowerVariantTab[];
  reverse: PowerTabForm;
  dieSides: number;
  dieFaces: string[];
}

/** Saved `composition` (or undefined for a plain power). */
export function buildCompositionPayload(
  c: CollectedCompositionForms,
): PowerComposition | undefined {
  if (c.structure === 'none' && !c.reverseEnabled) return undefined;
  const isAlternate = c.structure === 'alternate';
  const variants =
    c.structure === 'none'
      ? []
      : c.variants.map((v) => ({
          id: v.id,
          label: v.label.trim() || v.id,
          ...(isAlternate
            ? tabFormToSpec(v.form)
            : tabFormToOverlay(diffAgainstShared(c.shared, v.form))),
          ...(v.description.trim() && c.structure !== 'modify'
            ? { description: v.description.trim() }
            : {}),
          ...(c.structure === 'randomize' ? { polarity: v.polarity } : {}),
        }));
  const reverseOverlay = tabFormToOverlay(c.reverse);
  return {
    structure: c.structure,
    variants,
    ...(c.reverseEnabled && powerSpecHasContent(reverseOverlay) ? { reverse: reverseOverlay } : {}),
    ...(c.structure === 'randomize' ? { die: { sides: c.dieSides, faces: c.dieFaces } } : {}),
  };
}

/** Top-level payload form: Alternate mirrors variant 1 for legacy readers. */
export function topLevelForm(c: CollectedCompositionForms): PowerTabForm {
  if (c.structure === 'alternate' && c.variants[0]) return c.variants[0].form;
  return c.shared;
}
