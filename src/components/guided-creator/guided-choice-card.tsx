/**
 * GuidedChoiceCard — shared selectable card for the guided creator.
 * Supports thumb or hero image layouts; inline Read more for long copy.
 */

'use client';

import { useMemo, useState, useRef, useEffect, type KeyboardEvent, type ReactNode } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { DescriptorChip } from '@/components/ui';
import { ExpandableImage } from '@/components/shared';
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

export interface GuidedChoiceCardProps {
  title: string;
  description?: string | null;
  tagline?: string;
  fullDescription?: ReactNode;
  tags?: string[];
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
  /** Shown only when expanded (Read more) — e.g. feat restriction notices. */
  expandedExtra?: ReactNode;
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

/** Detect whether clamped body copy overflows its fixed preview area. */
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

  // Derive false when inactive so we never sync that case through setState-in-effect.
  return { ref, overflows: active && measuredOverflows };
}

export function GuidedChoiceCard({
  title,
  description,
  tagline,
  fullDescription,
  tags,
  imageUrl,
  imageRecord,
  imageKind,
  imageLayout,
  icon,
  badge,
  selected = false,
  onSelect,
  children,
  expandedExtra,
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

  const showReadMore =
    !expanded &&
    (hasExpandedExtra ||
      (body.kind === 'rich'
        ? body.canExpand || textOverflows
        : body.kind === 'plain' && textOverflows));

  const showBodySection = body.kind !== 'none' || hasExpandedExtra;

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
        !expanded && preset.cardCollapsed,
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
            </div>
            {showBodySection ? (
              <div className={s.bodyWrap}>
                {body.kind !== 'none' ? (
                  <p
                    ref={bodyRef}
                    className={cn(
                      s.body,
                      !expanded && preset.bodyCollapsed,
                      expanded && 'whitespace-pre-wrap'
                    )}
                  >
                    {body.kind === 'plain' && body.text}
                    {body.kind === 'rich' &&
                      (expanded ? body.expanded : body.collapsed || body.expanded)}
                  </p>
                ) : null}
                {expanded && expandedExtra ? (
                  <div className="mt-3">{expandedExtra}</div>
                ) : null}
                {!expanded && (
                  <div className={s.readMoreSlot}>
                    {showReadMore ? (
                      <button
                        type="button"
                        onClick={toggleExpand}
                        aria-expanded={false}
                        className={s.readMore}
                      >
                        Read more…
                      </button>
                    ) : null}
                  </div>
                )}
                {expanded && showBodySection && !selected ? (
                  <button
                    type="button"
                    onClick={toggleExpand}
                    aria-expanded={expanded}
                    className={s.readMore}
                  >
                    Read less
                  </button>
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

        {hasTags && (
          <div className={s.tagsRow}>
            {tags.map((tag) => (
              <DescriptorChip key={tag} size="sm">
                {tag}
              </DescriptorChip>
            ))}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
