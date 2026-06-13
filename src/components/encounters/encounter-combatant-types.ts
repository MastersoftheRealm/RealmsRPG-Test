/**
 * Encounter Tracker - Shared Types
 */

import type { DragEvent } from 'react';

export type CombatantType = 'ally' | 'enemy' | 'companion';

export interface CombatantCondition {
  name: string;
  level: number;
}

export interface Combatant {
  id: string;
  name: string;
  initiative: number;
  acuity: number;
  maxHealth: number;
  currentHealth: number;
  maxEnergy: number;
  currentEnergy: number;
  armor: number;
  evasion: number;
  ap: number;
  conditions: CombatantCondition[];
  notes: string;
  combatantType: CombatantType;
  isAlly: boolean;
  isSurprised: boolean;
}

export interface ConditionDef {
  name: string;
  leveled: boolean;
  description: string;
}

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
}
