/**
 * Character Card Component
 * =========================
 * Displays a character summary with portrait and actions
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { X, Plus, Copy } from 'lucide-react';
import { IconButton } from '@/components/ui';
import type { CharacterSummary } from '@/types';
import { getEffectivePortrait } from '@/lib/portrait';

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
        'group relative rounded-xl overflow-hidden bg-surface shadow-md',
        'hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5',
        isDeleting || isDuplicating ? 'opacity-50 pointer-events-none' : ''
      )}
    >
      <Link href={`/characters/${character.id}`} className="block">
        {/* Portrait */}
        <div className="relative aspect-[3/4] bg-primary-800">
          <Image
            src={getEffectivePortrait(character.portrait)}
            alt={character.name}
            fill
            className="object-cover"
            unoptimized
          />
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-bold text-lg text-text-primary uppercase truncate">
            {character.name}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-text-secondary">
            <span>Level {character.level}</span>
            {character.archetypeName ? (
              <>
                <span>•</span>
                <span className="truncate">{character.archetypeName}</span>
              </>
            ) : null}
          </div>
          {character.ancestryName ? (
            <p className="text-sm text-text-muted mt-1 truncate">
              {character.ancestryName}
            </p>
          ) : null}
        </div>
      </Link>

      {/* Action buttons — siblings of the Link (not nested interactive content).
          Always visible on touch/small screens; hover-revealed on desktop. */}
      {onDuplicate ? (
        <IconButton
          onClick={handleDuplicate}
          className="absolute top-2 left-2 z-10 bg-surface/90 hover:bg-surface text-text-primary opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
          label="Duplicate character"
          variant="ghost"
        >
          <Copy className="w-5 h-5" />
        </IconButton>
      ) : null}
      {onDelete ? (
        <IconButton
          onClick={handleDelete}
          className="absolute top-2 right-2 z-10 bg-danger/80 hover:bg-danger text-white opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
          label="Delete character"
          variant="danger"
        >
          <X className="w-5 h-5" />
        </IconButton>
      ) : null}
    </div>
  );
}

interface AddCharacterCardProps {
  onClick?: () => void;
}

export function AddCharacterCard({ onClick }: AddCharacterCardProps) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-light bg-surface-secondary hover:border-primary-400 hover:bg-primary-50 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 min-h-[280px] cursor-pointer"
    >
      <div className="w-16 h-16 rounded-full bg-surface group-hover:bg-primary-100 flex items-center justify-center transition-colors">
        <Plus className="w-8 h-8 text-text-muted group-hover:text-primary-600" />
      </div>
      <span className="mt-4 font-semibold text-text-muted group-hover:text-primary-600">
        Add Character
      </span>
    </button>
  );
}
