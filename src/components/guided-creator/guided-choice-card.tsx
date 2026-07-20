/**
 * GuidedChoiceCard — shared selectable card for the guided creator.
 * Supports thumb or hero image layouts; inline See more for long copy;
 * optional More details opens a read-only deep-dive modal (not card select)
 * or expands lots of chip/fact disclosure.
 * When both expand and modal More details exist: More details only after expand/select.
 */

'use client';

import { useMemo, useState, useRef, useEffect, type KeyboardEvent, type ReactNode } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { DescriptorChip, type ChipProps } from '@/components/ui';
import { ExpandableImage } from '@/components/shared';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { shouldExpandTaglineBody } from './guided-text';
import {
  defaultImageLayoutForKind,
  resolveChoiceCardImage,
  type ChoiceCardImageKind,
  type ChoiceCardImageLayout,
} from './guided-choice-image';
import {
  GUIDED_CHOICE_STYLES as s,
  GUIDED_CHOICE_CARD_PRESETS,
  type GuidedChoiceCardDensity,
} from './guided-choice-styles';

/** Card footer metadata chips — string shorthand or styled DescriptorChip config. */
export type GuidedChoiceTag =
  | string
  | {
      label: string;
      variant?: ChipProps['variant'];
      size?: ChipProps['size'];
    };

function normalizeChoiceTag(tag: GuidedChoiceTag): {
  key: string;
  label: string;
  variant: ChipProps['variant'];
  size: NonNullable<ChipProps['size']>;
} {
  if (typeof tag === 'string') {
    return { key: tag, label: tag, variant: 'descriptor', size: 'sm' };
  }
  return {
    key: tag.label,
    label: tag.label,
    variant: tag.variant ?? 'descriptor',
    size: tag.size ?? 'sm',
  };
}

export interface GuidedChoiceCardProps {
  title: string;
  description?: string | null;
  tagline?: string;
  fullDescription?: ReactNode;
  tags?: GuidedChoiceTag[];
  /**
   * Title-adjacent metadata (e.g. Currency / Training Points chips).
   * Renders beside the title — never under the disclosure row.
   */
  titleMeta?: ReactNode;
  /** Explicit image URL (overrides imageKind/imageRecord resolution). */
  imageUrl?: string | null;
  /** Codex record to read image_url from when imageUrl is omitted. */
  imageRecord?: unknown;
  /** Placeholder + default layout family (species, equipment, power, etc.). */
  imageKind?: ChoiceCardImageKind;
  imageLayout?: ChoiceCardImageLayout;
  icon?: ReactNode;
  badge?: string;
  selected?: boolean;
  onSelect: () => void;
  children?: ReactNode;
  /**
   * Content above See more / See less / More details (e.g. quantity stepper).
   * Prefer this over `children` so nothing sits under the disclosure boundary.
   */
  beforeDisclosure?: ReactNode;
  /** Shown only when expanded (See more) — e.g. feat restriction notices. */
  expandedExtra?: ReactNode;
  /**
   * When true, string `tags` are hidden while the card is expanded (use expandable
   * chips in `expandedExtra` instead to avoid duplicating the same facts).
   */
  hideTagsWhenExpanded?: boolean;
  /** Label for the in-card expand control (default: “See more…”). */
  expandLabel?: string;
  /** Label for the in-card collapse control when not selected (default: “See less”). */
  collapseLabel?: string;
  /**
   * Opens choice-card deep-dive (GuidedEntityDetailModal). Does not select the card.
   * Distinct from catalog Layer 2 (`GuidedLayerNav` “See more options”).
   * When the card also offers inline See more, this control appears only once expanded
   * (or selected, which auto-expands).
   */
  onDetails?: () => void;
  /** Visible label for the details control (default: guided copy “More details”). */
  detailsLabel?: string;
  selectAriaLabel?: string;
  className?: string;
  fullWidth?: boolean;
  /**
   * Per-step preview sizing (uniform within the step, not globally):
   * - species — 5 lines (longer species flavor)
   * - path — 4 lines (path cards)
   * - compact — 3 lines (feats, traits, loadouts)
   */
  density?: GuidedChoiceCardDensity;
}

type BodyMode =
  | { kind: 'none' }
  | { kind: 'plain'; text: string }
  | { kind: 'rich'; collapsed: string; expanded: ReactNode; canExpand: boolean };

function resolveBody(
  description: string | null | undefined,
  tagline: string | undefined,
  fullDescription: ReactNode | undefined
): BodyMode {
  const desc = description?.trim() ?? '';
  const tag = tagline?.trim() ?? '';

  if (desc) {
    return { kind: 'plain', text: desc };
  }

  if (tag) {
    const extra =
      typeof fullDescription === 'string'
        ? fullDescription.trim()
        : fullDescription != null && fullDescription !== ''
          ? fullDescription
          : null;

    if (extra != null && extra !== '' && extra !== tag) {
      if (typeof extra === 'string') {
        const expanded = extra.startsWith(tag) ? extra : `${tag}\n\n${extra}`;
        if (shouldExpandTaglineBody(tag, extra)) {
          return { kind: 'plain', text: expanded };
        }
        return { kind: 'plain', text: tag };
      }
      return { kind: 'rich', collapsed: tag, expanded: extra, canExpand: true };
    }

    return { kind: 'plain', text: tag };
  }

  if (fullDescription != null && fullDescription !== '') {
    if (typeof fullDescription === 'string') {
      return { kind: 'plain', text: fullDescription.trim() };
    }
    return { kind: 'rich', collapsed: '', expanded: fullDescription, canExpand: true };
  }

  return { kind: 'none' };
}

/**
 * Detect whether clamped body copy overflows its fixed preview area.
 * Keeps the last measurement while expanded so callers can still know
 * whether inline See more was (or would be) offered.
 */
function useClampedOverflow(active: boolean, textKey: string) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [measuredOverflows, setMeasuredOverflows] = useState(false);

  useEffect(() => {
    if (!active) return;

    const el = ref.current;
    if (!el) return;

    const measure = () => {
      setMeasuredOverflows(el.scrollHeight > el.clientHeight + 1);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [active, textKey]);

  return { ref, overflows: measuredOverflows };
}

export function GuidedChoiceCard({
  title,
  description,
  tagline,
  fullDescription,
  tags,
  titleMeta,
  imageUrl,
  imageRecord,
  imageKind,
  imageLayout,
  icon,
  badge,
  selected = false,
  onSelect,
  children,
  beforeDisclosure,
  expandedExtra,
  hideTagsWhenExpanded = false,
  expandLabel,
  collapseLabel,
  onDetails,
  detailsLabel,
  selectAriaLabel,
  className,
  fullWidth = false,
  density = 'path',
}: GuidedChoiceCardProps) {
  const [expanded, setExpanded] = useState(selected);
  const [prevSelected, setPrevSelected] = useState(selected);
  // Sync expand when selection changes (adjust state during render — no effect).
  if (selected !== prevSelected) {
    setPrevSelected(selected);
    setExpanded(selected);
  }
  const hasTags = tags && tags.length > 0;
  const showTags = hasTags && !(hideTagsWhenExpanded && expanded);
  const preset = GUIDED_CHOICE_CARD_PRESETS[density];
  const hasExpandedExtra = Boolean(expandedExtra);

  const layout =
    imageLayout ?? (imageKind ? defaultImageLayoutForKind(imageKind) : imageUrl ? 'thumb' : 'thumb');
  const isFeatured = layout === 'hero';

  const resolvedImage = useMemo(() => {
    if (imageUrl?.trim()) return { src: imageUrl.trim(), isPlaceholder: false };
    if (imageKind) return resolveChoiceCardImage(imageKind, imageRecord);
    return null;
  }, [imageUrl, imageKind, imageRecord]);

  const body = useMemo(
    () => resolveBody(description, tagline, fullDescription),
    [description, tagline, fullDescription]
  );

  const clampKey =
    body.kind === 'plain'
      ? body.text
      : body.kind === 'rich'
        ? body.collapsed
        : '';

  const { ref: bodyRef, overflows: textOverflows } = useClampedOverflow(
    body.kind !== 'none' && !expanded,
    clampKey
  );

  /** Card has (or had) an inline expand control — distinct from More details. */
  const canInlineExpand =
    hasExpandedExtra ||
    (body.kind === 'rich'
      ? body.canExpand || textOverflows
      : body.kind === 'plain' && textOverflows);

  const showBodySection = body.kind !== 'none' || hasExpandedExtra || Boolean(beforeDisclosure);
  const showReadMore = !expanded && canInlineExpand;
  const showCollapse = expanded && showBodySection && !selected;

  /**
   * Progressive disclosure: truncated → See more → More details.
   * When both exist, hide More details until the card is expanded (or selected).
   * Cards with only More details (no overflow) still show it collapsed.
   */
  const showDetails = Boolean(onDetails) && (expanded || !canInlineExpand);
  const hasVisibleActions = showReadMore || showCollapse || showDetails;
  /**
   * Keep the collapsed body floor unless the card is expanded with an info notice and no
   * More details control — that combination was the sparse gap under restriction callouts.
   * Path/species (More details) and short cards like No Flaw keep the floor.
   */
  const keepBodyFloor = !expanded || showDetails || !hasExpandedExtra;
  /**
   * Reserve action-row height while collapsed, and for selected/expanded cards that keep
   * the body floor (e.g. No Flaw). Dropping the empty min-h-11 only when expanded with an
   * info notice — otherwise short selected cards shrink when alone on a grid row.
   */
  const showActionRow = showBodySection && (hasVisibleActions || keepBodyFloor);

  const handleCardKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    }
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selected) return;
    setExpanded((o) => !o);
  };

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDetails?.();
  };

  const handleDetailsKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      onDetails?.();
    }
  };

  const resolvedDetailsLabel =
    detailsLabel ?? GUIDED_CREATOR_COPY.choiceCard.moreDetails;
  /** Visible text is the control name; aria-label adds which entity (screen readers). */
  const detailsAriaLabel = `${resolvedDetailsLabel} for ${title}`;
  const resolvedExpandLabel =
    expandLabel ?? GUIDED_CREATOR_COPY.choiceCard.seeMore;
  const resolvedCollapseLabel =
    collapseLabel ?? GUIDED_CREATOR_COPY.choiceCard.seeLess;

  const showMedia = Boolean(resolvedImage || icon);
  const mediaClass = isFeatured && resolvedImage ? s.mediaFeatured : s.media;
  const imageSizes = isFeatured ? '80px' : '48px';

  return (
    <div
      tabIndex={0}
      aria-label={selectAriaLabel ?? `Choose ${title}`}
      aria-selected={selected}
      onClick={onSelect}
      onKeyDown={handleCardKeyDown}
      className={cn(
        'flex w-full cursor-pointer flex-col overflow-hidden rounded-card border bg-surface-alt/40 transition-shadow duration-base',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        'h-full',
        // Always keep density min-height — selected/expanded cards auto-expand and
        // previously dropped this class, so short options (e.g. Skip — no flaw) shrank.
        preset.cardCollapsed,
        selected
          ? 'border-primary ring-2 ring-primary shadow-raised'
          : 'border-border-light dark:border-border hover:border-border hover:shadow-card',
        fullWidth && 'w-full',
        className
      )}
    >
      <div className={cn(s.selectButton, 'h-full')}>
        <div className={s.headerRow}>
          {showMedia && resolvedImage ? (
            <ExpandableImage
              src={resolvedImage.src}
              alt={title}
              isPlaceholder={resolvedImage.isPlaceholder}
              stopPropagation
              className={mediaClass}
            >
              <Image
                src={resolvedImage.src}
                alt=""
                fill
                sizes={imageSizes}
                className="object-cover"
              />
            </ExpandableImage>
          ) : showMedia && icon ? (
            <span className={s.iconWrap}>{icon}</span>
          ) : null}
          <div className={s.contentColumn}>
            <div className="flex flex-wrap items-start gap-2">
              <h3 className={s.title}>{title}</h3>
              {badge && <DescriptorChip size="sm">{badge}</DescriptorChip>}
              {titleMeta ? (
                <div
                  className="flex min-w-0 flex-wrap items-center gap-1.5"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  {titleMeta}
                </div>
              ) : null}
            </div>
            {showBodySection ? (
              <div className={s.bodyWrap}>
                {body.kind !== 'none' ? (
                  <p
                    ref={bodyRef}
                    className={cn(
                      s.body,
                      keepBodyFloor && preset.bodyMinHeight,
                      !expanded && preset.bodyClamp,
                      expanded && 'whitespace-pre-wrap'
                    )}
                  >
                    {body.kind === 'plain' && body.text}
                    {body.kind === 'rich' &&
                      (expanded ? body.expanded : body.collapsed || body.expanded)}
                  </p>
                ) : null}
                {expanded && expandedExtra ? (
                  <div className="mt-2">{expandedExtra}</div>
                ) : null}
                {beforeDisclosure ? <div className="mt-2">{beforeDisclosure}</div> : null}
                {/*
                  See more / See less / More details stay below body copy (product
                  placement). Shared min-h-11 row so deep-dive does not add a second strip.
                */}
                {showActionRow ? (
                  <div className={s.actionRow}>
                    {showReadMore ? (
                      <button
                        type="button"
                        onClick={toggleExpand}
                        aria-expanded={false}
                        className={s.readMore}
                      >
                        {resolvedExpandLabel}
                      </button>
                    ) : null}
                    {showCollapse ? (
                      <button
                        type="button"
                        onClick={toggleExpand}
                        aria-expanded={expanded}
                        className={s.readMore}
                      >
                        {resolvedCollapseLabel}
                      </button>
                    ) : null}
                    {showDetails ? (
                      <button
                        type="button"
                        onClick={handleDetailsClick}
                        onKeyDown={handleDetailsKeyDown}
                        aria-label={detailsAriaLabel}
                        className={s.detailsLink}
                      >
                        {resolvedDetailsLabel}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
          <span
            className={cn(s.selectedCheck, !selected && 'invisible')}
            aria-hidden={!selected}
          >
            <Check className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>

        {showTags ? (
          <div className={s.tagsRow}>
            {tags!.map((tag) => {
              const chip = normalizeChoiceTag(tag);
              return (
                <DescriptorChip key={chip.key} variant={chip.variant} size={chip.size}>
                  {chip.label}
                </DescriptorChip>
              );
            })}
          </div>
        ) : null}

        {children}
      </div>
    </div>
  );
}
