/**
 * Campaign roster character chip (TASK-666c)
 */

'use client';

import Link from 'next/link';
import { ExternalLink, Trash2 } from 'lucide-react';
import { Button, IconButton } from '@/components/ui';
import { ExpandableImage } from '@/components/patterns';
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
  onViewSheet?: string | undefined;
}) {
  const portraitSrc = useEffectivePortrait(character.portrait);
  const portraitFallbackUrl = usePortraitFallbackUrl();
  const isFallbackPortrait = isPortraitFallbackSrc(portraitSrc);

  return (
    <div className="flex min-w-[200px] items-center gap-3 rounded-lg border border-border-light bg-surface-alt p-3">
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
        <p className="truncate font-semibold text-text-primary">{character.characterName}</p>
        <p className="text-sm text-text-muted">
          Lvl {character.level}
          {character.species && ` • ${character.species}`}
          {character.archetype && ` • ${character.archetype}`}
        </p>
        {!isOwner && character.ownerUsername && (
          <p className="text-xs text-text-muted">@{character.ownerUsername}</p>
        )}
      </div>
      <div className="flex flex-shrink-0 items-center gap-1">
        {onViewSheet && (
          <Button asChild variant="ghost" size="icon">
            <Link
              href={onViewSheet}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View ${character.characterName} sheet`}
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        )}
        {canRemove && (
          <IconButton label="Remove" variant="danger" size="sm" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </IconButton>
        )}
      </div>
    </div>
  );
}
