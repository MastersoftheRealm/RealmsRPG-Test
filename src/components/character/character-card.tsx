/**
 * Character Card Component
 * =========================
 * Displays a character summary with portrait and actions.
 * Portrait frame is 1:1 to match ImageUploadModal crop (aspect={1}).
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { X, Plus, Copy } from 'lucide-react';
import { IconButton } from '@/components/ui';
import type { CharacterSummary } from '@/types';
import { useEffectivePortrait } from '@/hooks/use-effective-portrait';
import { usePortraitFallbackUrl } from '@/hooks/use-portrait-fallback-url';

/** Responsive sizes for the characters grid (1 / 2 / 3 cols). */
const PORTRAIT_SIZES = '(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw';

/**
 * Shared footer band so CharacterCard and AddCharacterCard share the same
 * baseline size (square portrait + this band). min-height keeps 3-line copy
 * from clipping; grid stretch equalizes Add with taller neighbors in-row.
 */
const CARD_FOOTER_CLASS = 'flex min-h-[5.75rem] shrink-0 flex-col justify-center p-4';

interface CharacterCardProps {
  character: CharacterSummary;
  onDelete?: (id: string, name: string) => void;
  onDuplicate?: (id: string, name: string) => void;
  isDeleting?: boolean;
  isDuplicating?: boolean;
}

export function CharacterCard({
  character,
  onDelete,
  onDuplicate,
  isDeleting,
  isDuplicating,
}: CharacterCardProps) {
  const portraitSrc = useEffectivePortrait(character.portrait);
  const portraitFallbackUrl = usePortraitFallbackUrl();

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(character.id, character.name);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDuplicate?.(character.id, character.name);
  };

  return (
    <div
      className={cn(
        'group relative flex h-full w-full flex-col overflow-hidden rounded-xl bg-surface shadow-md',
        'duration-base transition-all ease-standard hover:-translate-y-0.5 hover:shadow-lg',
        isDeleting || isDuplicating ? 'pointer-events-none opacity-50' : '',
      )}
    >
      <Link
        href={`/characters/${character.id}`}
        className={cn(
          'flex min-h-0 flex-1 flex-col',
          'focus-visible:ring-2 focus-visible:ring-primary-outline-border focus-visible:outline-none focus-visible:ring-inset',
        )}
      >
        {/* Portrait — 1:1 matches ImageUploadModal crop (aspect={1}) */}
        {/* DESIGN_INTENT: No ExpandableImage — portrait lives inside a Link; primary action is open sheet (invalid nested button). */}
        <div className="relative aspect-square shrink-0 bg-image-matte">
          <Image
            src={portraitSrc}
            alt={character.name}
            fill
            className="object-contain"
            unoptimized
            sizes={PORTRAIT_SIZES}
            onError={(e) => {
              (e.target as HTMLImageElement).src = portraitFallbackUrl;
            }}
          />
        </div>

        <div className={CARD_FOOTER_CLASS}>
          <h2 className="truncate text-lg font-bold text-text-primary uppercase">
            {character.name}
          </h2>
          <div className="mt-1 flex items-center gap-2 text-sm text-text-secondary">
            <span>Level {character.level}</span>
            {character.archetypeName ? (
              <>
                <span aria-hidden="true">•</span>
                <span className="truncate">{character.archetypeName}</span>
              </>
            ) : null}
          </div>
          {character.ancestryName ? (
            <p className="mt-1 truncate text-sm text-text-muted">{character.ancestryName}</p>
          ) : null}
        </div>
      </Link>

      {/* Action buttons — siblings of the Link (not nested interactive content).
          Always visible on touch/small screens; hover-revealed on desktop. */}
      {onDuplicate ? (
        <IconButton
          onClick={handleDuplicate}
          className="absolute top-2 left-2 z-10 bg-surface/90 text-text-primary opacity-100 transition-opacity hover:bg-surface md:opacity-0 md:group-hover:opacity-100"
          label={`Duplicate ${character.name}`}
          variant="ghost"
        >
          <Copy className="h-5 w-5" />
        </IconButton>
      ) : null}
      {onDelete ? (
        <IconButton
          onClick={handleDelete}
          className="absolute top-2 right-2 z-10 bg-danger/80 text-text-on-dark opacity-100 transition-opacity hover:bg-danger md:opacity-0 md:group-hover:opacity-100"
          label={`Delete ${character.name}`}
          variant="danger"
        >
          <X className="h-5 w-5" />
        </IconButton>
      ) : null}
    </div>
  );
}

interface AddCharacterCardProps {
  onClick?: () => void;
}

/** Same outer size as CharacterCard: square portrait slot + fixed footer band. */
export function AddCharacterCard({ onClick }: AddCharacterCardProps) {
  return (
    // Wrapper so the grid cell stretches; native <button> min-size quirks won't shrink the tile.
    <div className="h-full min-h-0 w-full">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'group flex h-full w-full flex-col overflow-hidden rounded-xl border-2 border-dashed border-border-light',
          'duration-base bg-surface-secondary transition-all ease-standard',
          'hover:-translate-y-0.5 hover:border-primary-outline-border hover:bg-primary-subtle-bg hover:shadow-md',
          'active:translate-y-0',
          'focus-visible:ring-2 focus-visible:ring-primary-outline-border focus-visible:ring-offset-2 focus-visible:outline-none',
        )}
      >
        <div className="relative flex aspect-square shrink-0 items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface transition-colors group-hover:bg-primary-subtle-bg-hover">
            <Plus
              className="h-8 w-8 text-text-muted group-hover:text-primary-fg-hover"
              aria-hidden
            />
          </div>
        </div>
        <div className={cn(CARD_FOOTER_CLASS, 'items-center text-center')}>
          <span className="font-semibold text-text-muted group-hover:text-primary-fg-hover">
            Add Character
          </span>
        </div>
      </button>
    </div>
  );
}
