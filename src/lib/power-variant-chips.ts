/**
 * Power variant chips (ADR-0029) â€” sibling of `buildFeatLevelChips` (`leveled-feats.ts`).
 * Same `ChipData` / `GridListChip` shape; labels are the variant names (Fire, Freeze), never "Level N".
 */

import type { ChipData } from '@/components/patterns/list/grid-list-row';
import type { MetadataDetailSection } from '@/lib/chip/list-row-metadata';
import { formatCost } from '@/lib/game/creator-constants';
import {
  composedPowerDamage,
  formatPowerDamage,
  POWER_COMPOSITION_STRUCTURE_LABELS,
  type PowerCompositionResolution,
  type ResolvedPowerVariant,
} from '@/lib/calculators';

type PowerVariantChipSelect = {
  powerName: string;
  onSelectVariant: (variantId: string) => void;
};

type PowerVariantDieRoll = {
  powerName: string;
  onRolled: (variantId: string, face: number, sides: number, label: string) => void;
};

type BuildPowerVariantChipsOptions = {
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
function powerVariantChipDescription(
  res: PowerCompositionResolution,
  v: ResolvedPowerVariant,
): string {
  const lines: string[] = [];
  if (res.structure === 'randomize') {
    const sign = v.polarity === 'negative' ? 'âˆ’' : '+';
    lines.push(
      `${formatFaces(v.faces)} Â· ${v.polarity === 'negative' ? 'Negative' : 'Positive'} (${sign}${v.energy} EN)`,
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
 * (expandable piece facts) â€” every piece happens on one cast.
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

/** Randomize die chip: rolls on the sheet, rule note elsewhere. */
function randomizeDieChips(
  res: PowerCompositionResolution,
  roll?: PowerVariantDieRoll,
): ChipData[] {
  if (res.structure !== 'randomize' || !res.die) return [];
  const sides = res.die.sides;
  const name = `Roll 1d${sides}`;
  const description =
    'Roll when you use this power; the face picks the outcome. If the power lasts longer than one round, you may re-roll at the start of each affected creatureâ€™s turn. A negative outcome cannot be resisted if used on an ally.';
  if (!roll) return [{ name, description }];
  return [
    {
      name,
      description,
      kind: 'descriptor',
      category: 'cost',
      onSelect: () => {
        const rolled = rollPowerRandomizeDie(res);
        if (rolled) roll.onRolled(rolled.variant.id, rolled.face, sides, rolled.variant.label);
      },
      selectAriaLabel: `Roll 1d${sides} for ${roll.powerName}`,
    },
  ];
}

/**
 * Row description with the Reverse drawbacks appended. Reverse always applies, so it is
 * body text, never a chip.
 */
export function withPowerReverseNote(
  description: string | undefined,
  res: PowerCompositionResolution | undefined,
): string {
  const base = description?.trim() ?? '';
  if (!res?.reverse) return base;
  const drawbacks = (res.reverse.doc.parts ?? [])
    .map((p) => p.name)
    .filter((n): n is string => !!n);
  const damage = formatPowerDamage(res.reverse.doc.damage);
  const list = [...new Set([...drawbacks, ...(damage ? [damage] : [])])].join(', ');
  const note = `Reverse Effects${list ? ` (${list})` : ''}: always applies and cannot be nullified or reduced by you or an ally; reduces the cost by ${formatCost(res.reverse.discount)} EN (50% of the drawbackâ€™s ${res.reverse.energy} EN).`;
  return base ? `${base} ${note}` : note;
}

/** Expanded-row section: variant chips (+ Randomize die). Undefined when there is nothing to show. */
export function powerVariantsDetailSection(
  res: PowerCompositionResolution | undefined,
  options?: BuildPowerVariantChipsOptions,
): MetadataDetailSection | undefined {
  if (!res || res.structure === 'none') return undefined;
  const chips = [...buildPowerVariantChips(res, options), ...randomizeDieChips(res, options?.roll)];
  if (chips.length === 0) return undefined;
  return {
    label: `${POWER_COMPOSITION_STRUCTURE_LABELS[res.structure]} Variants`,
    chips,
    ...(res.structureHelp ? { labelHelp: res.structureHelp } : {}),
  };
}

/** Damage string for the row's damage cell / button. */
export function composedPowerDamageLabel(res: PowerCompositionResolution): string {
  return formatPowerDamage(composedPowerDamage(res));
}
