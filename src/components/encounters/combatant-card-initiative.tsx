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
      className="flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing select-none"
    >
      <div className="text-text-muted dark:text-text-secondary hover:text-text-primary dark:hover:text-text-primary p-1 rounded hover:bg-surface-alt touch-target-md-compact flex items-center justify-center">
        <GripVertical className="w-5 h-5" />
      </div>
      <div
        className={cn(
          'w-11 h-11 md:w-10 md:h-10 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors',
          isCurrentTurn ? 'bg-primary-button text-text-on-dark' : 'bg-surface-alt text-text-secondary hover:bg-surface'
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
            className="w-8 h-8 text-center text-sm font-bold bg-transparent border-none outline-none"
            autoFocus
          />
        ) : (
          <>
            <span className="text-lg font-bold leading-none">{combatant.initiative}</span>
            {combatant.acuity !== 0 && (
              <span className="text-[10px] text-text-muted dark:text-text-secondary leading-none">+{combatant.acuity}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
