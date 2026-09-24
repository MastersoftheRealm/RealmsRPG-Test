/**
 * Power variant chips (ADR-0029) — sibling of `buildFeatLevelChips` (`leveled-feats.ts`).
 * Same `ChipData` / `GridListChip` shape; labels are the variant names (Fire, Freeze), never "Level N".
 */

import type { ChipData } from '@/components/patterns/list/grid-list-row';
import type { MetadataDetailSection } from '@/lib/chip/list-row-metadata';
import {
  composedPowerDamage,
  formatPowerDamage,
  POWER_COMPOSITION_STRUCTURE_LABELS,
  type PowerCompositionResolution,
  type ResolvedPowerVariant,
} from '@/lib/calculators';

export type PowerVariantChipSelect = {
  powerName: string;
  onSelectVariant: (variantId: string) => void;
};

export type PowerVariantDieRoll = {
  powerName: string;
  onRolled: (variantId: string, face: number, sides: number, label: string) => void;
};

export type BuildPowerVariantChipsOptions = {
  /** Sheet play pick. Omit on browse surfaces (Library, add-modal, creature). */
  select?: PowerVariantChipSelect | undefined;
  /** Randomize play: the die chip rolls and marks the face's variant. */
  roll?: PowerVariantDieRoll | undefined;
};

/** Roll the Randomize die; returns the face (1-based) and the variant it names. */
export function rollPowerRandomizeDie(
  res: PowerCompositionResolution,
  random: () => number = Math.random,
): { face: number; variant: ResolvedPowerVariant } | null {
  if (!res.die) return null;
  const face = Math.floor(random() * res.die.sides) + 1;
  const variantId = res.die.faces[face - 1];
  const variant = res.variants.find((v) => v.id === variantId);
  return variant ? { face, variant } : null;
}

function formatFaces(faces: number[]): string {
  if (faces.length === 0) return 'No faces';
  return `${faces.length === 1 ? 'Face' : 'Faces'} ${faces.join(', ')}`;
}

/** Plain facts for one variant (energy, damage, duration, area, parts). */
export function powerVariantChipDescription(
  res: PowerCompositionResolution,
  v: ResolvedPowerVariant,
): string {
  const lines: string[] = [];
  if (res.structure === 'randomize') {
    const sign = v.polarity === 'negative' ? '−' : '+';
    lines.push(
      `${formatFaces(v.faces)} · ${v.polarity === 'negative' ? 'Negative' : 'Positive'} (${sign}${v.energy} EN)`,
    );
  } else {
    lines.push(`${v.energy} Energy`);
  }
  const damage = formatPowerDamage(v.doc.damage);
  if (damage) lines.push(`Damage: ${damage}`);
  if (v.display.duration) lines.push(`Duration: ${v.display.duration}`);
  if (v.display.area && v.display.area !== '1 target') lines.push(`Area: ${v.display.area}`);
  const partNames = (v.doc.parts ?? []).map((p) => p.name).filter((n): n is string => !!n);
  if (partNames.length > 0) lines.push(`Parts: ${[...new Set(partNames)].join(', ')}`);
  if (v.description) lines.push(v.description);
  return lines.join('\n');
}

/**
 * One chip per variant. Current = marked descriptor. With `select`, other chips call
 * `onSelectVariant` (Choice / Alternate / Randomize). Modify chips stay browse-only
 * (expandable piece facts) — every piece happens on one cast.
 */
export function buildPowerVariantChips(
  res: PowerCompositionResolution,
  options?: BuildPowerVariantChipsOptions,
): ChipData[] {
  if (res.variants.length <= 1) return [];
  const select = res.structure === 'modify' ? undefined : options?.select;
  return res.variants.map((v) => {
    const description = powerVariantChipDescription(res, v);
    const isCurrent = res.structure !== 'modify' && v.id === res.selectedVariantId;
    if (res.structure === 'modify') {
      return { name: v.label, description } satisfies ChipData;
    }
    if (isCurrent) {
      return {
        name: v.label,
        description,
        category: 'success',
        kind: 'descriptor',
        current: true,
      } satisfies ChipData;
    }
    if (!select) {
      return { name: v.label, description, kind: 'descriptor' } satisfies ChipData;
    }
    return {
      name: v.label,
      description,
      kind: 'descriptor',
      onSelect: () => select.onSelectVariant(v.id),
      selectAriaLabel: `Use ${v.label} for ${select.powerName}`,
    } satisfies ChipData;
  });
}

/** Rule notes shown with the chips (Reverse drawbacks, Randomize re-roll). */
export function powerCompositionNoteChips(
  res: PowerCompositionResolution,
  roll?: PowerVariantDieRoll,
): ChipData[] {
  const chips: ChipData[] = [];
  if (res.structure === 'randomize' && res.die) {
    const description =
      'Roll when you use this power; the face picks the outcome. If the power lasts longer than one round, you may re-roll at the start of each affected creature’s turn. A negative outcome cannot be resisted if used on an ally.';
    const name = `Roll 1d${res.die.sides}`;
    if (roll) {
      const sides = res.die.sides;
      chips.push({
        name,
        description,
        kind: 'descriptor',
        category: 'cost',
        onSelect: () => {
          const rolled = rollPowerRandomizeDie(res);
          if (rolled) roll.onRolled(rolled.variant.id, rolled.face, sides, rolled.variant.label);
        },
        selectAriaLabel: `Roll 1d${sides} for ${roll.powerName}`,
      });
    } else {
      chips.push({ name, description });
    }
  }
  if (res.reverse) {
    const drawbacks = (res.reverse.doc.parts ?? [])
      .map((p) => p.name)
      .filter((n): n is string => !!n);
    const damage = formatPowerDamage(res.reverse.doc.damage);
    const list = [...drawbacks, ...(damage ? [damage] : [])].join(', ');
    chips.push({
      name: `Reverse −${formatDiscount(res.reverse.discount)} EN`,
      description: `${list ? `Drawbacks: ${list}. ` : ''}Always applies; it cannot be nullified or reduced by you or an ally. Reduces the cost by 50% of the drawback’s energy (${res.reverse.energy}).`,
      category: 'warning',
    });
  }
  return chips;
}

function formatDiscount(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/** Section label, e.g. "Choice" / "Modify". Plain power + Reverse → "Reverse Effects". */
export function powerCompositionSectionLabel(res: PowerCompositionResolution): string {
  return res.structure === 'none'
    ? 'Reverse Effects'
    : `${POWER_COMPOSITION_STRUCTURE_LABELS[res.structure]} Variants`;
}

/** Expanded-row section: variant chips + rule notes. Undefined when there is nothing to show. */
export function powerVariantsDetailSection(
  res: PowerCompositionResolution | undefined,
  options?: BuildPowerVariantChipsOptions,
): MetadataDetailSection | undefined {
  if (!res) return undefined;
  const chips = [
    ...buildPowerVariantChips(res, options),
    ...powerCompositionNoteChips(res, options?.roll),
  ];
  if (chips.length === 0) return undefined;
  return { label: powerCompositionSectionLabel(res), chips };
}

/** Damage string for the row's damage cell / button. */
export function composedPowerDamageLabel(res: PowerCompositionResolution): string {
  return formatPowerDamage(composedPowerDamage(res));
}
