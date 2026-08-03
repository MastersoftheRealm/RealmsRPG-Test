/**
 * Campaign roster character chip (TASK-666c)
 */

'use client';

import Link from 'next/link';
import { ExternalLink, Trash2 } from 'lucide-react';
import { IconButton } from '@/components/ui';
import { ExpandableImage } from '@/components/shared';
import type { CampaignCharacter } from '@/types/campaign';
import { isPortraitFallbackSrc } from '@/lib/portrait';
import { useEffectivePortrait } from '@/hooks/use-effective-portrait';
import { usePortraitFallbackUrl } from '@/hooks/use-portrait-fallback-url';

export function CharacterChip({
  character,
  isOwner,
  canRemove,
  onRemove,
  onViewSheet,
}: {
  character: CampaignCharacter;
  isOwner: boolean;
  canRemove: boolean;
  onRemove: () => void;
  onViewSheet?: string;
}) {
  const portraitSrc = useEffectivePortrait(character.portrait);
  const portraitFallbackUrl = usePortraitFallbackUrl();
  const isFallbackPortrait = isPortraitFallbackSrc(portraitSrc);

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border-light bg-surface-alt min-w-[200px]">
      <ExpandableImage
        src={portraitSrc}
        alt={`${character.characterName} portrait`}
        disabled={isFallbackPortrait}
        isPlaceholder={isFallbackPortrait}
        className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-image-matte"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- dynamic portrait URL */}
        <img
          src={portraitSrc}
          alt=""
          className="h-full w-full object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).src = portraitFallbackUrl;
          }}
        />
      </ExpandableImage>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-text-primary truncate">{character.characterName}</p>
        <p className="text-sm text-text-muted dark:text-text-secondary">
          Lvl {character.level}
          {character.species && ` • ${character.species}`}
          {character.archetype && ` • ${character.archetype}`}
        </p>
        {!isOwner && character.ownerUsername && (
          <p className="text-xs text-text-muted dark:text-text-secondary">@{character.ownerUsername}</p>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {onViewSheet && (
          <Link
            href={onViewSheet}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View ${character.characterName} sheet`}
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-alt transition-colors focus:outline-none focus:ring-2 focus:ring-primary-outline-border focus:ring-offset-2"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        )}
        {canRemove && (
          <IconButton
            label="Remove"
            variant="danger"
            size="sm"
            onClick={onRemove}
            className="min-h-[44px] min-w-[44px]"
          >
            <Trash2 className="w-4 h-4" />
          </IconButton>
        )}
      </div>
    </div>
  );
}
