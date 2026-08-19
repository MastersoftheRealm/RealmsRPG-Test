'use client';

import { mapLibraryCreatureToStatBlockData } from '@/lib/library/official-creature-list';
import type { LibraryCreature } from '@/types/library';
import { CreatureStatBlock } from './creature-stat-block';
import type { CreatureStatBlockProps } from './creature-stat-block-types';

export type CreatureLibraryStatBlockRowProps = Omit<CreatureStatBlockProps, 'creature'>;

/** Single creature row — shared by My Library list and Realms `OfficialEntityList.renderRow`. */
export function CreatureLibraryStatBlockRow({
  creature,
  ...rowProps
}: CreatureLibraryStatBlockRowProps & { creature: LibraryCreature }) {
  return <CreatureStatBlock creature={mapLibraryCreatureToStatBlockData(creature)} {...rowProps} />;
}

export interface CreatureLibraryStatBlockRowsProps {
  creatures: LibraryCreature[];
  /** Per-row props (badges, actions, rightSlot, etc.). Creature data is mapped internally. */
  getRowProps?: (creature: LibraryCreature) => CreatureLibraryStatBlockRowProps;
}

/**
 * My Library creature tab row list.
 * Uses `contents` so parent shell `gap-1` spaces rows (same as Powers/Techniques GridListRow children).
 * Realms browse uses `CreatureLibraryStatBlockRow` via `OfficialEntityList.renderRow`.
 */
export function CreatureLibraryStatBlockRows({
  creatures,
  getRowProps,
}: CreatureLibraryStatBlockRowsProps) {
  return (
    <div className="contents">
      {creatures.map((creature) => {
        const id = String(creature.id ?? creature.docId ?? creature.name);
        return (
          <CreatureLibraryStatBlockRow key={id} creature={creature} {...getRowProps?.(creature)} />
        );
      })}
    </div>
  );
}
