'use client';

import { useMemo } from 'react';
import { Chip } from '@/components/ui';
import { PathHelpCard } from '@/components/character-creator/PathHelpCard';
import { getPathRecommendationsForLevel } from '@/lib/game/archetype-path';
import { PathRemoveGuidance } from '@/components/character-sheet/path-level-guidance';
import { resolveArchetypeDisplayName } from '@/lib/game/archetype-display';
import type { Character } from '@/types';

export function isPathCharacter(character: Character): boolean {
  return character.creationMode === 'path' || Boolean(character.archetypePathId?.trim());
}

export function showArchetypeCreationBadge(character: Character): boolean {
  return Boolean(character.creationMode) || Boolean(character.archetypePathId?.trim());
}

export function ArchetypeCreationBadge({ character }: { character: Character }) {
  if (!showArchetypeCreationBadge(character)) return null;

  const label = isPathCharacter(character) ? 'Archetype Path' : 'Forge Your Own Path';

  return (
    <Chip variant="primary" size="sm" aria-label={`Creation style: ${label}`}>
      {label}
    </Chip>
  );
}

export function ArchetypePathGuidance({ character }: { character: Character }) {
  const isPath = isPathCharacter(character);

  const pathName = useMemo(
    () => resolveArchetypeDisplayName(character) ?? character.archetype?.name ?? 'Archetype path',
    [character]
  );

  const { description, level1Notes, levelNotes, level, hasRemoveLists } = useMemo(() => {
    const lvl = character.level ?? 1;
    const levelRec = getPathRecommendationsForLevel(character.archetype, lvl);
    return {
      description: character.archetype?.description?.trim(),
      level1Notes: character.archetype?.path_data?.level1?.notes?.trim(),
      levelNotes: levelRec?.notes?.trim(),
      level: lvl,
      hasRemoveLists: Boolean(
        levelRec?.removeFeats?.length ||
          levelRec?.removePowers?.length ||
          levelRec?.removeTechniques?.length ||
          levelRec?.removeArmaments?.length
      ),
    };
  }, [character]);

  if (!isPath) return null;

  const showLevel1Notes = Boolean(level1Notes);
  const showLevelNotes = Boolean(levelNotes) && level > 1 && levelNotes !== level1Notes;
  const hasContent = Boolean(description) || showLevel1Notes || showLevelNotes || hasRemoveLists;

  if (!hasContent) return null;

  return (
    <div
      className="mt-2 space-y-2 max-w-xl"
      role="region"
      aria-label={`Path information for ${pathName}`}
    >
      {description ? (
        <p className="text-sm text-text-secondary dark:text-text-secondary">{description}</p>
      ) : null}

      {showLevel1Notes && level <= 1 ? (
        <PathHelpCard pathName={pathName}>
          <span className="block whitespace-pre-wrap font-normal">{level1Notes}</span>
        </PathHelpCard>
      ) : null}

      {showLevel1Notes && level > 1 ? (
        <div
          className="rounded-lg border border-border-light bg-surface-alt px-4 py-3"
          role="region"
          aria-label={`Level 1 path guidance for ${pathName}`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-1">
            Level 1 guidance
          </p>
          <p className="text-sm text-text-primary whitespace-pre-wrap">{level1Notes}</p>
        </div>
      ) : null}

      {showLevelNotes ? (
        <div
          className="rounded-xl border-2 border-primary-200 dark:border-primary-800 bg-primary-50/80 dark:bg-primary-900/20 px-4 py-3"
          role="region"
          aria-label={`Level ${level} path guidance for ${pathName}`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-300 mb-1">
            Level {level} guidance
          </p>
          <p className="text-sm text-text-primary whitespace-pre-wrap">{levelNotes}</p>
          <p className="text-xs text-text-muted dark:text-text-secondary mt-2">
            Admin path notes — not your personal archetype description.
          </p>
        </div>
      ) : null}

      {character.archetype ? (
        <PathRemoveGuidance
          archetype={character.archetype}
          targetLevel={level}
          pathName={pathName}
          compact
        />
      ) : null}
    </div>
  );
}
