'use client';

/**
 * Maps character sheet feats/traits to FeatsTraitsListSection row shapes.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { DecrementButton, IncrementButton, type ColumnValue } from '@/components/shared';
import type { ChipData } from '@/components/shared/grid-list-row';
import type { EntityFeatRow } from '@/components/shared/entity-library-sections';
import { FEAT_GRID } from '@/components/shared/entity-library-sections';
import { Input, Textarea } from '@/components/ui';
import type { FeatTraitCustomization } from '@/types/feats';
import { descriptorChipData } from '@/lib/chip/chip-data-helpers';
import { glrSurfaceDetailSections, metadataDetailSection } from '@/lib/chip/list-row-metadata';
import { capitalize, formatAbilityList, truncateText } from '@/lib/utils';

const DESCRIPTION_EXTENDED_TRUNCATE = 220;

function formatRecoveryAbbrev(recovery: string | undefined): string {
  if (!recovery) return '';
  const lower = recovery.toLowerCase();
  if (lower.includes('partial')) return 'PR';
  if (lower.includes('full')) return 'FR';
  if (lower.includes('short')) return 'SR';
  if (lower.includes('long')) return 'LR';
  return '';
}

/** Stable trait id for customization lookup (prefers codex id). */
export function resolveTraitCustomizationKey(
  traitNameOrId: string,
  traitsDb: Array<{ id: string; name?: string }>,
): string {
  const byId = traitsDb.find((t) => t.id === traitNameOrId);
  if (byId) return byId.id;
  const byName = traitsDb.find(
    (t) => String(t.name ?? '').toLowerCase() === String(traitNameOrId ?? '').toLowerCase(),
  );
  return byName?.id ?? traitNameOrId;
}

function buildDisplayNameContent(codexName: string, customName?: string): ReactNode | undefined {
  const trimmed = customName?.trim();
  if (!trimmed) return undefined;
  // pe absorbs italic overhang so GLR `lg:truncate` / row overflow-hidden does not clip.
  return (
    <span className="pe-[0.35em] italic" title={`Codex name: ${codexName}`}>
      {trimmed}
    </span>
  );
}

/** True when the in-progress Customize draft differs from the last committed value. */
export function customizationDraftDiffers(draft: string, committed: string | undefined): boolean {
  return draft !== (committed ?? '');
}

/** Stable GLR id so name-sort cannot swap Customize fields between trait rows. */
export function traitRowId(category: string | undefined, traitKey: string): string {
  return `${category ?? 'trait'}-${traitKey}`;
}

/** Edit-only Customize fields. Play view uses GridListRow `descriptionAfter` for the note. */
function FeatTraitCustomizationBlock({
  fieldId,
  codexName,
  customName,
  note,
  onCustomNameChange,
  onNoteChange,
}: {
  fieldId: string;
  codexName: string;
  customName?: string;
  note?: string;
  onCustomNameChange?: (value: string) => void;
  onNoteChange?: (value: string) => void;
}) {
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const [draftName, setDraftName] = useState(customName ?? '');
  const [draftNote, setDraftNote] = useState(note ?? '');
  const draftNameRef = useRef(draftName);
  const draftNoteRef = useRef(draftNote);
  const customNameRef = useRef(customName);
  const noteRef = useRef(note);
  const onCustomNameChangeRef = useRef(onCustomNameChange);
  const onNoteChangeRef = useRef(onNoteChange);
  const nameFocusedRef = useRef(false);
  const noteFocusedRef = useRef(false);

  useEffect(() => {
    draftNameRef.current = draftName;
    draftNoteRef.current = draftNote;
    customNameRef.current = customName;
    noteRef.current = note;
    onCustomNameChangeRef.current = onCustomNameChange;
    onNoteChangeRef.current = onNoteChange;
  });

  useEffect(() => {
    if (!nameFocusedRef.current) setDraftName(customName ?? '');
  }, [customName]);
  useEffect(() => {
    if (!noteFocusedRef.current) setDraftNote(note ?? '');
  }, [note]);

  const flushName = () => {
    if (onCustomNameChange && customizationDraftDiffers(draftName, customName)) {
      onCustomNameChange(draftName);
    }
  };
  const flushNote = () => {
    if (onNoteChange && customizationDraftDiffers(draftNote, note)) {
      onNoteChange(draftNote);
    }
  };

  useEffect(
    () => () => {
      if (
        nameFocusedRef.current &&
        onCustomNameChangeRef.current &&
        customizationDraftDiffers(draftNameRef.current, customNameRef.current)
      ) {
        onCustomNameChangeRef.current(draftNameRef.current);
      }
      if (
        noteFocusedRef.current &&
        onNoteChangeRef.current &&
        customizationDraftDiffers(draftNoteRef.current, noteRef.current)
      ) {
        onNoteChangeRef.current(draftNoteRef.current);
      }
    },
    [],
  );

  if (!onCustomNameChange && !onNoteChange) return null;

  return (
    <div
      className="space-y-3 border-t border-border-light pt-3"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsCustomizationOpen((prev) => !prev);
        }}
        className="inline-flex min-h-[44px] items-center rounded-md border border-border-light bg-surface px-3 py-2 text-xs font-medium text-text-secondary hover:bg-surface-alt"
        aria-expanded={isCustomizationOpen}
      >
        {isCustomizationOpen ? 'Hide customization' : 'Customize'}
      </button>

      {isCustomizationOpen && (
        <>
          {onCustomNameChange && (
            <Input
              id={`${fieldId}-custom-name`}
              label="Custom name"
              value={draftName}
              onChange={(e) => {
                const value = e.target.value;
                draftNameRef.current = value;
                setDraftName(value);
              }}
              onFocus={() => {
                nameFocusedRef.current = true;
              }}
              onBlur={() => {
                nameFocusedRef.current = false;
                flushName();
              }}
              placeholder={codexName}
              helperText="Optional flavor name. Shown in italics; codex name stays unchanged."
            />
          )}
          {onNoteChange && (
            <Textarea
              id={`${fieldId}-player-note`}
              label="Player note"
              value={draftNote}
              onChange={(e) => {
                const value = e.target.value;
                draftNoteRef.current = value;
                setDraftNote(value);
              }}
              onFocus={() => {
                noteFocusedRef.current = true;
              }}
              onBlur={() => {
                noteFocusedRef.current = false;
                flushNote();
              }}
              placeholder="Record choices, reminders, or flavor (e.g. chosen power)…"
              className="min-h-[72px]"
            />
          )}
        </>
      )}
    </div>
  );
}

export type TraitRowInput = {
  name: string;
  codexName?: string;
  traitKey?: string;
  customName?: string;
  note?: string;
  description?: string;
  maxUses?: number;
  recoveryPeriod?: string;
  category?: string;
};

export type FeatRowInput = {
  id?: string | number;
  name: string;
  codexName?: string;
  customName?: string;
  note?: string;
  description?: string;
  maxUses?: number;
  currentUses?: number;
  recovery?: string;
  category?: string;
  ability?: string | string[];
  reqLevel?: number;
  /** For state feats — which list to update when customizing. */
  listType?: 'archetype' | 'character';
};

export type FeatRowContext = {
  showEditControls: boolean;
  traitUses: Record<string, number>;
  onTraitUsesChange?: (traitName: string, delta: number) => void;
  onFeatUsesChange?: (featId: string, delta: number) => void;
  onRemoveFeat?: (featId: string, featName?: string) => void;
  getFeatLevelDetailSections?: (
    featId: string | number,
    listType: 'archetype' | 'character',
  ) => Array<{ label: string; chips: ChipData[]; hideLabelIfSingle?: boolean }> | undefined;
  featListType?: 'archetype' | 'character';
  onFeatCustomizationChange?: (
    featId: string,
    listType: 'archetype' | 'character',
    updates: Partial<FeatTraitCustomization>,
  ) => void;
  onTraitCustomizationChange?: (traitKey: string, updates: Partial<FeatTraitCustomization>) => void;
};

function buildUsesStepper(
  uses: { current: number; max: number } | undefined,
  onDecrement: (() => void) | undefined,
  onIncrement: (() => void) | undefined,
): ReactNode {
  if (uses && onDecrement && onIncrement) {
    return (
      <div className="flex items-center justify-center gap-1">
        <DecrementButton onClick={onDecrement} disabled={uses.current <= 0} size="sm" />
        <span className="min-w-[2.5rem] text-center text-sm font-medium tabular-nums">
          {uses.current}/{uses.max}
        </span>
        <IncrementButton onClick={onIncrement} disabled={uses.current >= uses.max} size="sm" />
      </div>
    );
  }
  if (uses) {
    return (
      <span className="text-sm text-text-secondary">
        {uses.current}/{uses.max}
      </span>
    );
  }
  return '-';
}

function buildFeatTraitColumns(
  description: string | undefined,
  uses: { current: number; max: number } | undefined,
  recovery: string | undefined,
  usesStepper: ReactNode,
): { columns: ColumnValue[]; columnSpans?: (number | undefined)[] } {
  const recoveryDisplay = formatRecoveryAbbrev(recovery) || '-';
  const noUsesOrRecovery = !uses && recoveryDisplay === '-';
  if (noUsesOrRecovery) {
    return {
      columns: [
        {
          key: 'description',
          value: truncateText(description, DESCRIPTION_EXTENDED_TRUNCATE),
          hideOnMobile: true,
        },
      ],
      columnSpans: [3],
    };
  }
  return {
    columns: [
      { key: 'description', value: truncateText(description, uses ? 60 : 100), hideOnMobile: true },
      { key: 'uses', value: usesStepper, align: 'center' },
      { key: 'recovery', value: recoveryDisplay, align: 'center' },
    ],
  };
}

/** Expanded-only kind chip. Compact GLR would also paint `badges` on the name. */
function traitKindDetailSection(category: string | undefined) {
  if (!category || category === 'species') return undefined;
  return metadataDetailSection([descriptorChipData(capitalize(category))], 'Type');
}

function buildCustomizationExtras(
  fieldId: string,
  showEditControls: boolean,
  codexName: string,
  customName: string | undefined,
  note: string | undefined,
  handlers: {
    onCustomName?: (value: string) => void;
    onNote?: (value: string) => void;
  },
): Pick<EntityFeatRow, 'nameContent' | 'descriptionAfter' | 'supplementalExpandedContent'> {
  const noteTrimmed = note?.trim();
  return {
    nameContent: buildDisplayNameContent(codexName, customName),
    descriptionAfter: !showEditControls && noteTrimmed ? noteTrimmed : undefined,
    supplementalExpandedContent: showEditControls ? (
      <FeatTraitCustomizationBlock
        key={fieldId}
        fieldId={fieldId}
        codexName={codexName}
        customName={customName}
        note={note}
        onCustomNameChange={handlers.onCustomName}
        onNoteChange={handlers.onNote}
      />
    ) : undefined,
  };
}

export function mapTraitRows(traits: TraitRowInput[], ctx: FeatRowContext): EntityFeatRow[] {
  return traits.map((trait) => {
    const codexName = trait.codexName ?? trait.name;
    const uses =
      (trait.maxUses ?? 0) > 0
        ? {
            current: ctx.traitUses[trait.name] ?? trait.maxUses ?? 0,
            max: trait.maxUses ?? 0,
          }
        : undefined;
    const usesStepper = buildUsesStepper(
      uses,
      uses && ctx.onTraitUsesChange ? () => ctx.onTraitUsesChange!(trait.name, -1) : undefined,
      uses && ctx.onTraitUsesChange ? () => ctx.onTraitUsesChange!(trait.name, 1) : undefined,
    );
    const { columns, columnSpans } = buildFeatTraitColumns(
      trait.description,
      uses,
      trait.recoveryPeriod,
      usesStepper,
    );
    const kindSection = traitKindDetailSection(trait.category);

    const traitKey = trait.traitKey ?? trait.name;
    const rowId = traitRowId(trait.category, traitKey);
    const customizationExtras = buildCustomizationExtras(
      rowId,
      ctx.showEditControls,
      codexName,
      trait.customName,
      trait.note,
      {
        onCustomName: ctx.onTraitCustomizationChange
          ? (value) => ctx.onTraitCustomizationChange!(traitKey, { customName: value })
          : undefined,
        onNote: ctx.onTraitCustomizationChange
          ? (value) => ctx.onTraitCustomizationChange!(traitKey, { note: value })
          : undefined,
      },
    );

    return {
      id: rowId,
      name: trait.customName?.trim() || codexName,
      description: trait.description,
      gridColumns: FEAT_GRID,
      columns,
      columnSpans,
      detailSections: kindSection ? [kindSection] : undefined,
      uses,
      hideUsesInName: !!(uses && ctx.onTraitUsesChange),
      ...customizationExtras,
    };
  });
}

export function mapFeatRows(
  feats: FeatRowInput[],
  ctx: FeatRowContext,
  options?: {
    badge?: { label: string; color?: 'blue' | 'purple' | 'green' | 'amber' | 'gray' | 'red' };
  },
): EntityFeatRow[] {
  return feats.map((feat, index) => {
    const featId = String(feat.id ?? index);
    const codexName = feat.codexName ?? feat.name;
    const listType = feat.listType ?? ctx.featListType ?? 'character';
    const uses =
      (feat.maxUses ?? 0) > 0
        ? {
            current: feat.currentUses ?? feat.maxUses ?? 0,
            max: feat.maxUses ?? 0,
          }
        : undefined;
    const usesStepper = buildUsesStepper(
      uses,
      uses && ctx.onFeatUsesChange ? () => ctx.onFeatUsesChange!(featId, -1) : undefined,
      uses && ctx.onFeatUsesChange ? () => ctx.onFeatUsesChange!(featId, 1) : undefined,
    );
    const { columns, columnSpans } = buildFeatTraitColumns(
      feat.description,
      uses,
      feat.recovery,
      usesStepper,
    );
    const extraSections = ctx.getFeatLevelDetailSections?.(featId, listType);
    const detailSections = glrSurfaceDetailSections(
      'character-sheet-feat',
      {
        reqLevel: feat.reqLevel,
        category: feat.category,
        ability: formatAbilityList(feat.ability),
      },
      extraSections,
    );

    const customizationExtras = buildCustomizationExtras(
      `feat-${featId}`,
      ctx.showEditControls,
      codexName,
      feat.customName,
      feat.note,
      {
        onCustomName: ctx.onFeatCustomizationChange
          ? (value) => ctx.onFeatCustomizationChange!(featId, listType, { customName: value })
          : undefined,
        onNote: ctx.onFeatCustomizationChange
          ? (value) => ctx.onFeatCustomizationChange!(featId, listType, { note: value })
          : undefined,
      },
    );

    return {
      id: featId,
      name: feat.customName?.trim() || codexName,
      description: feat.description,
      gridColumns: FEAT_GRID,
      columns,
      columnSpans,
      badges: options?.badge ? [options.badge] : undefined,
      detailSections: detailSections.length > 0 ? detailSections : undefined,
      uses,
      hideUsesInName: !!(uses && ctx.onFeatUsesChange),
      onDelete:
        ctx.showEditControls && ctx.onRemoveFeat
          ? () => ctx.onRemoveFeat!(featId, codexName)
          : undefined,
      ...customizationExtras,
    };
  });
}
