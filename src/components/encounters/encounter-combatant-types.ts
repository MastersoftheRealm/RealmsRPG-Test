/**
 * Encounter Tracker - Shared Types
 *
 * Domain combatant types now live in `@/types/encounter` (ARCH-01); this module
 * re-exports them for the encounter-tracker component and adds component-only
 * props that depend on React.
 */

import type { DragEvent } from 'react';
import type { Combatant, CombatantCondition, CombatantType, ConditionDef } from '@/types/encounter';

export type { Combatant, CombatantCondition, CombatantType, ConditionDef };

export interface EncounterState {
  name: string;
  combatants: Combatant[];
  round: number;
  currentTurnIndex: number;
  isActive: boolean;
  applySurprise: boolean;
}

export interface CombatantCardProps {
  combatant: Combatant;
  isCurrentTurn: boolean;
  isDragOver: boolean;
  isDragging: boolean;
  onUpdate: (updates: Partial<Combatant>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onAddCondition: (condition: string) => void;
  onRemoveCondition: (condition: string) => void;
  onUpdateConditionLevel: (condition: string, delta: number) => void;
  onUpdateAP: (delta: number) => void;
  /** Optional: when omitted, compact mode uses ValueStepper-only HP/EN (no damage/heal/use/rest) */
  onDamage?: (amount: number) => void;
  onHeal?: (amount: number) => void;
  onEnergyDrain?: (amount: number) => void;
  onEnergyRestore?: (amount: number) => void;
  onDragStart: (e: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  /** Compact/quick-reference mode: ResourceInput-style HP/EN, no damage/heal buttons, larger AP */
  variant?: 'full' | 'compact';
  /** When true, the logged-in user owns this linked character and may edit HP/EN/AP on the encounter card. */
  canEditLinkedResources?: boolean;
}
