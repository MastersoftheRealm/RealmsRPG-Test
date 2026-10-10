/**
 * Power Creator — built-in variants (ADR-0029), pure helpers.
 * The editor always edits one tab's fields; these convert between that form shape and
 * the saved `payload.composition` spec.
 */

import type { PowerPart } from '@/hooks';
import {
  powerSpecHasContent,
  type PowerComposition,
  type PowerCompositionStructure,
  type PowerVariantOverrideField,
  type PowerVariantPolarity,
  type PowerVariantSpec,
} from '@/lib/calculators';
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

/** Randomize Shared is the action type plus range, area, and duration defaults. */
export function randomizeSharedDefaults(shared: PowerTabForm): PowerTabForm {
  const empty = emptyTabForm();
  return {
    ...shared,
    selectedParts: empty.selectedParts,
    selectedAdvancedParts: empty.selectedAdvancedParts,
    damages: empty.damages,
  };
}

/**
 * Every user-added copy is written. Identical parts are allowed (86e3jx8wv).
 * Auto mechanics are not stored here; they are rebuilt from action, damage, and footprint.
 */
function savedParts(form: PowerTabForm) {
  return [
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
  ];
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
export function tabFormToOverlay(
  form: PowerTabForm,
  keep: ReadonlySet<OverlayFieldKey> = new Set(),
): PowerVariantSpec {
  const spec: PowerVariantSpec = {};
  const empty = emptyTabForm();
  const parts = savedParts(form);
  if (parts.length > 0) spec.parts = parts;
  const damage = savedDamage(form);
  if (damage.length > 0 || keep.has('damage')) spec.damage = damage;
  if (form.range.steps > 0 || keep.has('range')) spec.range = form.range;
  if (form.area.type !== 'none' || keep.has('area')) spec.area = form.area;
  if (form.duration.type !== 'instant' || keep.has('duration')) spec.duration = form.duration;
  if (
    form.actionType !== empty.actionType ||
    form.isReaction !== empty.isReaction ||
    keep.has('action')
  ) {
    spec.actionType = form.actionType;
    spec.isReaction = form.isReaction;
  }
  if (form.attackMode !== empty.attackMode || keep.has('attack')) spec.attackMode = form.attackMode;
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

/** Overlay from a full power: drop what the shared chassis already has. Kept overrides stay, even at the empty default. */
export function diffAgainstShared(
  shared: PowerTabForm,
  v: PowerTabForm,
  keep: ReadonlySet<OverlayFieldKey> = new Set(),
): PowerTabForm {
  const sameJson = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  const sharedPartKeys = new Set(
    [...shared.selectedParts, ...shared.selectedAdvancedParts].map(
      (p) => `${p.part.id}:${p.op_1_lvl}:${p.op_2_lvl}:${p.op_3_lvl}`,
    ),
  );
  const withoutSharedParts = <
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
    selectedParts: withoutSharedParts(v.selectedParts),
    selectedAdvancedParts: withoutSharedParts(v.selectedAdvancedParts),
    damages: !keep.has('damage') && sameJson(v.damages, shared.damages) ? empty.damages : v.damages,
    range: !keep.has('range') && sameJson(v.range, shared.range) ? empty.range : v.range,
    area: !keep.has('area') && sameJson(v.area, shared.area) ? empty.area : v.area,
    duration:
      !keep.has('duration') && sameJson(v.duration, shared.duration) ? empty.duration : v.duration,
    actionType:
      !keep.has('action') && v.actionType === shared.actionType ? empty.actionType : v.actionType,
    isReaction:
      !keep.has('action') && v.isReaction === shared.isReaction ? empty.isReaction : v.isReaction,
    attackMode:
      !keep.has('attack') && v.attackMode === shared.attackMode ? empty.attackMode : v.attackMode,
  };
}

/** Highest `vN` already issued. New tabs start above this so a removed tab's id is not reused. */
export function variantHighWater(existing: { id: string }[]): number {
  return existing.reduce((max, v) => {
    const match = /^v(\d+)$/.exec(v.id);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
}

export function nextVariantId(existing: { id: string }[], highWater = 0): string {
  return `v${Math.max(highWater, variantHighWater(existing)) + 1}`;
}

export function nextVariantLabel(existing: PowerVariantTab[]): string {
  const used = new Set(existing.map((v) => v.label));
  let n = existing.length + 1;
  while (used.has(`Variant ${n}`)) n += 1;
  return `Variant ${n}`;
}

export type OverlayFieldKey = PowerVariantOverrideField;
export type OverlayFlagMap = Record<string, Partial<Record<OverlayFieldKey, boolean>>>;

/** Sticky Override. Copying Shared onto a tab can still equal the empty tab, so form comparison alone is not enough. */
export function setOverlayField(
  flags: OverlayFlagMap,
  tabId: string,
  field: OverlayFieldKey,
  forced: boolean,
): OverlayFlagMap {
  return { ...flags, [tabId]: { ...flags[tabId], [field]: forced } };
}

export function isOverlayFieldForced(
  flags: OverlayFlagMap,
  tabId: string,
  field: OverlayFieldKey,
): boolean {
  return flags[tabId]?.[field] === true;
}

/** True when the field editor should show, including a sticky Override that copied an empty Shared value. */
export function showsFieldOverride(
  formDiffersFromEmpty: boolean,
  stickyOverride: boolean,
): boolean {
  return formDiffersFromEmpty || stickyOverride;
}

/** Drop flags for tabs that no longer exist so a later id cannot inherit them. */
export function pruneOverlayFlags(
  flags: OverlayFlagMap,
  tabIds: readonly string[],
): OverlayFlagMap {
  const keep = new Set(tabIds);
  return Object.fromEntries(Object.entries(flags).filter(([id]) => keep.has(id)));
}

export function overlayFlagsFromVariants(
  variants: { id: string; overrides?: PowerVariantOverrideField[] | undefined }[],
): OverlayFlagMap {
  const flags: OverlayFlagMap = {};
  for (const variant of variants) {
    if (!variant.overrides?.length) continue;
    flags[variant.id] = {};
    for (const field of variant.overrides) flags[variant.id]![field] = true;
  }
  return flags;
}

/** Variant flags plus the Reverse tab. A removed tab's id is not in this map. */
export function overlayFlagsFromComposition(composition: {
  variants: { id: string; overrides?: PowerVariantOverrideField[] | undefined }[];
  reverse?: { overrides?: PowerVariantOverrideField[] | undefined } | null | undefined;
}): OverlayFlagMap {
  const flags = overlayFlagsFromVariants(composition.variants);
  const overrides = composition.reverse?.overrides;
  if (!overrides?.length) return flags;
  flags[REVERSE_TAB_ID] = {};
  for (const field of overrides) flags[REVERSE_TAB_ID]![field] = true;
  return flags;
}

export function overlayFlagsForTab(flags: OverlayFlagMap, tabId: string): Set<OverlayFieldKey> {
  const row = flags[tabId];
  const keep = new Set<OverlayFieldKey>();
  if (!row) return keep;
  for (const [field, on] of Object.entries(row)) {
    if (on) keep.add(field as OverlayFieldKey);
  }
  return keep;
}

/** Choice / Modify / Randomize / Alternate open with two tabs (DEV-V-061-T001). */
export function defaultVariantTabs(
  shared: PowerTabForm,
  copyShared: boolean,
  firstNumber = 1,
): PowerVariantTab[] {
  return [0, 1].map((offset) => ({
    id: `v${firstNumber + offset}`,
    label: `Variant ${firstNumber + offset}`,
    polarity: 'positive' as const,
    description: '',
    form: copyShared ? shared : emptyTabForm(),
  }));
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
  overlayFlags?: OverlayFlagMap | undefined;
}

/** Modify, Choice, Reverse, and every Randomize face keep Shared’s action type. Drop a stored action override. */
function withoutLockedAction<T extends PowerVariantSpec>(
  spec: T,
  overrides: PowerVariantOverrideField[],
): { spec: T; overrides: PowerVariantOverrideField[] } {
  const next = { ...spec };
  delete next.actionType;
  delete next.isReaction;
  return { spec: next, overrides: overrides.filter((field) => field !== 'action') };
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
      : c.variants.map((v) => {
          const keep = overlayFlagsForTab(c.overlayFlags ?? {}, v.id);
          let overrides = [...keep];
          let spec: PowerVariantSpec;
          if (c.structure === 'randomize') {
            const locked = withoutLockedAction(tabFormToSpec(v.form), []);
            spec = locked.spec;
            overrides = [];
          } else {
            spec = isAlternate
              ? tabFormToSpec(v.form)
              : tabFormToOverlay(diffAgainstShared(c.shared, v.form, keep), keep);
            const lockVariantAction = c.structure === 'modify' || c.structure === 'choice';
            if (lockVariantAction) {
              const locked = withoutLockedAction(spec, overrides);
              spec = locked.spec;
              overrides = locked.overrides;
            }
          }
          return {
            id: v.id,
            label: v.label.trim() || v.id,
            ...spec,
            ...(v.description.trim() && c.structure !== 'modify'
              ? { description: v.description.trim() }
              : {}),
            ...(c.structure === 'randomize' ? { polarity: v.polarity } : {}),
            ...(overrides.length > 0 ? { overrides } : {}),
          };
        });
  const reverseKeep = overlayFlagsForTab(c.overlayFlags ?? {}, REVERSE_TAB_ID);
  const reverseBuilt = withoutLockedAction(tabFormToOverlay(c.reverse, reverseKeep), [
    ...reverseKeep,
  ]);
  const reverseOverlay = reverseBuilt.spec;
  const reverseOverrides = reverseBuilt.overrides;
  return {
    structure: c.structure,
    variants,
    ...(c.reverseEnabled && powerSpecHasContent(reverseOverlay)
      ? {
          reverse: {
            ...reverseOverlay,
            ...(reverseOverrides.length > 0 ? { overrides: reverseOverrides } : {}),
          },
        }
      : {}),
    ...(c.structure === 'randomize' ? { die: { sides: c.dieSides, faces: c.dieFaces } } : {}),
  };
}

/** Top-level payload form: Alternate mirrors variant 1 for legacy readers. */
export function topLevelForm(c: CollectedCompositionForms): PowerTabForm {
  if (c.structure === 'alternate' && c.variants[0]) return c.variants[0].form;
  if (c.structure === 'randomize') return randomizeSharedDefaults(c.shared);
  return c.shared;
}
