/**
 * Character Card Component
 * =========================
 * Displays a character summary with portrait and actions
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { X, Plus } from 'lucide-react';
import type { CharacterSummary } from '@/types';

const FALLBACK_AVATAR = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><rect width="100%" height="100%" fill="%23053357"/><text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" font-size="44" fill="white" font-family="Arial">?</text></svg>';

interface CharacterCardProps {
  character: CharacterSummary;
  onDelete?: (id: string, name: string) => void;
  isDeleting?: boolean;
}

export function CharacterCard({ character, onDelete, isDeleting }: CharacterCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(character.id, character.name);
  };

  return (
    <Link
      href={`/characters/${character.id}`}
      className={cn(
        'group relative block rounded-xl overflow-hidden bg-surface shadow-md',
        'hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5',
        isDeleting ? 'opacity-50 pointer-events-none' : ''
      )}
    >
      {/* Portrait */}
      <div className="relative aspect-[3/4] bg-primary-800">
        <Image
          src={character.portrait || FALLBACK_AVATAR}
          alt={character.name}
          fill
          className="object-cover"
          unoptimized
        />
        
        {/* Delete button */}
        {onDelete ? (
          <button
            onClick={handleDelete}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-danger/80 hover:bg-danger text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            title="Delete character"
          >
            <X className="w-5 h-5" />
          </button>
        ) : null}
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
  );
}

interface AddCharacterCardProps {
  onClick?: () => void;
}

export function AddCharacterCard({ onClick }: AddCharacterCardProps) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-surface-secondary hover:border-primary-400 hover:bg-primary-50 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 min-h-[280px] cursor-pointer"
    >
      <div className="w-16 h-16 rounded-full bg-neutral-200 group-hover:bg-primary-100 flex items-center justify-center transition-colors">
        <Plus className="w-8 h-8 text-text-muted group-hover:text-primary-600" />
      </div>
      <span className="mt-4 font-semibold text-text-muted group-hover:text-primary-600">
        Add Character
      </span>
    </button>
  );
}
