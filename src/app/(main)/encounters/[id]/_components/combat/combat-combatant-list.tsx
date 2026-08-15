/**
 * Combat encounter combatant list (TASK-608)
 */

'use client';

import type { DragEvent } from 'react';
import { Card, CardContent, EmptyState } from '@/components/ui';
import { CombatantCard } from '@/components/encounters/CombatantCard';
import { isOwnedLinkedCombatant } from '@/lib/encounter/character-resource-sync';
import type { Combatant, TrackedCombatant, Encounter } from '@/types/encounter';

export interface CombatCombatantListProps {
  encounter: Encounter;
  sortedCombatants: Combatant[];
  userId: string | undefined;
  draggedId: string | null;
  dragOverId: string | null;
  onUpdate: (id: string, updates: Partial<Combatant>) => void;
  onRemove: (id: string) => void;
  onDuplicate: (combatant: Combatant) => void;
  onAddCondition: (id: string, condition: string) => void;
  onRemoveCondition: (id: string, condition: string) => void;
  onUpdateConditionLevel: (id: string, condition: string, delta: number) => void;
  onUpdateAP: (id: string, delta: number) => void;
  onDragStart: (e: DragEvent<HTMLDivElement>, id: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: DragEvent<HTMLDivElement>, id: string) => void;
  onDragLeave: () => void;
  onDrop: (e: DragEvent<HTMLDivElement>, id: string) => void;
}

export function CombatCombatantList({
  encounter,
  sortedCombatants,
  userId,
  draggedId,
  dragOverId,
  onUpdate,
  onRemove,
  onDuplicate,
  onAddCondition,
  onRemoveCondition,
  onUpdateConditionLevel,
  onUpdateAP,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: CombatCombatantListProps) {
  return (
    <>
      {!encounter.isActive && sortedCombatants.length > 0 && (
        <div className="flex flex-shrink-0 items-center gap-4 px-2 text-xs text-text-muted">
          <span>
            Drag the grip handle to reorder. Surprised creatures go last in round 1. Companions
            always go last.
          </span>
        </div>
      )}

      <div className="min-h-[300px] flex-1 space-y-3 overflow-y-auto scroll-smooth pr-2">
        {sortedCombatants.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState
                title="No combatants added yet"
                description="Add some using the panel on the right."
                size="sm"
                className="py-4"
              />
            </CardContent>
          </Card>
        ) : (
          sortedCombatants.map((combatant, index) => (
            <CombatantCard
              key={combatant.id}
              combatant={combatant}
              canEditLinkedResources={isOwnedLinkedCombatant(combatant as TrackedCombatant, userId)}
              isCurrentTurn={encounter.isActive && index === encounter.currentTurnIndex}
              isDragOver={dragOverId === combatant.id}
              isDragging={draggedId === combatant.id}
              onUpdate={(updates) => onUpdate(combatant.id, updates)}
              onRemove={() => onRemove(combatant.id)}
              onDuplicate={() => onDuplicate(combatant)}
              onAddCondition={(condition) => onAddCondition(combatant.id, condition)}
              onRemoveCondition={(condition) => onRemoveCondition(combatant.id, condition)}
              onUpdateConditionLevel={(condition, delta) =>
                onUpdateConditionLevel(combatant.id, condition, delta)
              }
              onUpdateAP={(delta) => onUpdateAP(combatant.id, delta)}
              onDragStart={(e) => onDragStart(e, combatant.id)}
              onDragEnd={onDragEnd}
              onDragOver={(e) => onDragOver(e, combatant.id)}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDrop(e, combatant.id)}
              variant="compact"
            />
          ))
        )}
      </div>
    </>
  );
}
