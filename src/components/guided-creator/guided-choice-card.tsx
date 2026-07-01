/**
 * GuidedChoiceCard — shared selectable card for the guided creator.
 * Supports thumb or hero image layouts; inline Read more for long copy.
 */

'use client';

import { useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { truncateAtWord, COMPACT_PREVIEW_LEN } from './guided-text';
import {
  defaultImageLayoutForKind,
  resolveChoiceCardImage,
  type ChoiceCardImageKind,
  type ChoiceCardImageLayout,
} from './guided-choice-image';
import { GUIDED_CHOICE_STYLES as s } from './guided-choice-styles';

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
  selectAriaLabel?: string;
  className?: string;
  fullWidth?: boolean;
  /**
   * standard — min-heights for species/path grids (self-start, no row stretch).
   * compact — no forced min-heights; line-clamp cap; use with COMPACT_GRID + h-full.
   */
  density?: 'standard' | 'compact';
}

type BodyMode =
  | { kind: 'none' }
  | { kind: 'plain'; collapsed: string; expanded: string; canExpand: boolean }
  | { kind: 'rich'; collapsed: string; expanded: ReactNode; canExpand: true };

function resolveBody(
  description: string | null | undefined,
  tagline: string | undefined,
  fullDescription: ReactNode | undefined,
  previewLen?: number
): BodyMode {
  const desc = description?.trim() ?? '';
  const tag = tagline?.trim() ?? '';

  if (desc) {
    const { preview, isTruncated } = truncateAtWord(desc, previewLen);
    return { kind: 'plain', collapsed: preview, expanded: desc, canExpand: isTruncated };
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
        return { kind: 'plain', collapsed: tag, expanded, canExpand: true };
      }
      return { kind: 'rich', collapsed: tag, expanded: extra, canExpand: true };
    }

    const { preview, isTruncated } = truncateAtWord(tag, previewLen);
    return { kind: 'plain', collapsed: preview, expanded: tag, canExpand: isTruncated };
  }

  if (fullDescription != null && fullDescription !== '') {
    if (typeof fullDescription === 'string') {
      const { preview, isTruncated } = truncateAtWord(fullDescription, previewLen);
      return {
        kind: 'plain',
        collapsed: preview,
        expanded: fullDescription,
        canExpand: isTruncated,
      };
    }
    return { kind: 'rich', collapsed: '', expanded: fullDescription, canExpand: true };
  }

  return { kind: 'none' };
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
  selectAriaLabel,
  className,
  fullWidth = false,
  density = 'standard',
}: GuidedChoiceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasTags = tags && tags.length > 0;
  const isCompact = density === 'compact';
  const previewLen = isCompact ? COMPACT_PREVIEW_LEN : undefined;

  const layout =
    imageLayout ?? (imageKind ? defaultImageLayoutForKind(imageKind) : imageUrl ? 'thumb' : 'thumb');
  const isFeatured = layout === 'hero';

  const resolvedImage = useMemo(() => {
    if (imageUrl?.trim()) return { src: imageUrl.trim(), isPlaceholder: false };
    if (imageKind) return resolveChoiceCardImage(imageKind, imageRecord);
    return null;
  }, [imageUrl, imageKind, imageRecord]);

  const body = useMemo(
    () => resolveBody(description, tagline, fullDescription, previewLen),
    [description, tagline, fullDescription, previewLen]
  );

  const handleCardKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    }
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
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
        isCompact ? 'h-full' : 'self-start',
        !expanded && !isCompact && s.cardCollapsed,
        selected
          ? 'border-primary ring-2 ring-primary shadow-raised'
          : 'border-border-light dark:border-border hover:border-border hover:shadow-card',
        fullWidth && 'w-full',
        className
      )}
    >
      <div className={cn(s.selectButton, isCompact && 'h-full')}>
        <div className={s.headerRow}>
          {showMedia && resolvedImage ? (
            <span className={mediaClass}>
              <Image
                src={resolvedImage.src}
                alt=""
                fill
                sizes={imageSizes}
                className="object-cover"
              />
            </span>
          ) : showMedia && icon ? (
            <span className={s.iconWrap}>{icon}</span>
          ) : null}
          <div className={s.contentColumn}>
            <div className="flex flex-wrap items-start gap-2">
              <h3 className={s.title}>{title}</h3>
              {badge && <span className={s.badge}>{badge}</span>}
            </div>
            {body.kind !== 'none' ? (
              <div className={s.bodyWrap}>
                <p
                  className={cn(
                    s.body,
                    !expanded && !isCompact && s.bodyCollapsed,
                    !expanded && isCompact && 'line-clamp-4',
                    expanded && 'whitespace-pre-wrap'
                  )}
                >
                  {body.kind === 'plain' &&
                    (expanded || !body.canExpand
                      ? body.expanded
                      : isCompact
                        ? body.collapsed
                        : `${body.collapsed}…`)}
                  {body.kind === 'rich' &&
                    (expanded
                      ? body.expanded
                      : isCompact
                        ? body.collapsed || body.expanded
                        : body.collapsed
                          ? `${body.collapsed}…`
                          : body.expanded)}
                </p>
                {body.canExpand && (
                  <button
                    type="button"
                    onClick={toggleExpand}
                    aria-expanded={expanded}
                    className={s.readMore}
                  >
                    {expanded ? 'Read less' : 'Read more…'}
                  </button>
                )}
              </div>
            ) : null}
          </div>
          {selected && (
            <span className={s.selectedCheck}>
              <Check className="h-4 w-4" aria-hidden="true" />
            </span>
          )}
        </div>

        {hasTags && (
          <div className={s.tagsRow}>
            {tags.map((tag) => (
              <span key={tag} className={s.tag}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
