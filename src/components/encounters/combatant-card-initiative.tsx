'use client';

import { useRef, useEffect } from 'react';
import type { DragEvent } from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Combatant } from '@/types/encounter';

export interface CombatantCardInitiativeProps {
  combatant: Combatant;
  isCurrentTurn: boolean;
  isEditingInitiative: boolean;
  onStartEditInitiative: () => void;
  onStopEditInitiative: () => void;
  onUpdate: (updates: Partial<Combatant>) => void;
  onDragStart: (e: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
}

export function CombatantCardInitiative({
  combatant,
  isCurrentTurn,
  isEditingInitiative,
  onStartEditInitiative,
  onStopEditInitiative,
  onUpdate,
  onDragStart,
  onDragEnd,
}: CombatantCardInitiativeProps) {
  const initiativeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingInitiative && initiativeInputRef.current) {
      initiativeInputRef.current.select();
    }
  }, [isEditingInitiative]);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="flex cursor-grab flex-col items-center gap-1 select-none active:cursor-grabbing"
    >
      <div className="hit-area-dense-square flex items-center justify-center rounded p-1 text-text-muted hover:bg-surface-alt hover:text-text-primary dark:hover:text-text-primary">
        <GripVertical className="h-5 w-5" />
      </div>
      <div
        className={cn(
          'flex h-11 w-11 cursor-pointer flex-col items-center justify-center rounded-lg transition-colors md:h-10 md:w-10',
          isCurrentTurn
            ? 'bg-primary-button text-text-on-dark'
            : 'bg-surface-alt text-text-secondary hover:bg-surface',
        )}
        onClick={onStartEditInitiative}
        title="Click to edit initiative"
      >
        {isEditingInitiative ? (
          <input
            ref={initiativeInputRef}
            type="number"
            value={combatant.initiative}
            onChange={(e) => onUpdate({ initiative: parseInt(e.target.value) || 0 })}
            onBlur={onStopEditInitiative}
            onKeyDown={(e) => e.key === 'Enter' && onStopEditInitiative()}
            className="h-8 w-8 border-none bg-transparent text-center text-sm font-bold outline-none"
            autoFocus
          />
        ) : (
          <>
            <span className="text-lg leading-none font-bold">{combatant.initiative}</span>
            {combatant.acuity !== 0 && (
              <span className="text-[10px] leading-none text-text-muted">+{combatant.acuity}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
