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

  const initiativeName = `Edit initiative for ${combatant.name}: ${combatant.initiative}`;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        aria-hidden="true"
        className="flex cursor-grab flex-col items-center select-none active:cursor-grabbing"
      >
        <div className="hit-area-dense-square flex items-center justify-center rounded p-1 text-text-muted hover:bg-surface-alt hover:text-text-primary">
          <GripVertical className="h-5 w-5" />
        </div>
      </div>
      {isEditingInitiative ? (
        <input
          ref={initiativeInputRef}
          type="number"
          value={combatant.initiative}
          aria-label={`Initiative for ${combatant.name}`}
          onChange={(e) => onUpdate({ initiative: parseInt(e.target.value) || 0 })}
          onBlur={onStopEditInitiative}
          onKeyDown={(e) => e.key === 'Enter' && onStopEditInitiative()}
          className="h-10 w-10 rounded-lg border-none bg-surface-alt text-center text-sm font-bold text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-primary-outline-border [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:w-11"
          autoFocus
        />
      ) : (
        <button
          type="button"
          onClick={onStartEditInitiative}
          aria-label={initiativeName}
          title="Edit initiative"
          className={cn(
            'flex h-10 w-10 cursor-pointer flex-col items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-primary-outline-border focus-visible:ring-offset-2 focus-visible:outline-none [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:w-11',
            isCurrentTurn
              ? 'bg-primary-button text-text-on-dark'
              : 'bg-surface-alt text-text-secondary hover:bg-surface',
          )}
        >
          <span className="text-lg leading-none font-bold">{combatant.initiative}</span>
          {combatant.acuity !== 0 && (
            <span className="text-[10px] leading-none text-text-muted">+{combatant.acuity}</span>
          )}
        </button>
      )}
    </div>
  );
}
