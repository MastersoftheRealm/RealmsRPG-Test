'use client';

import { useState, memo } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui';
import type { CombatantCardProps } from './encounter-combatant-types';
import type { TrackedCombatant } from '@/types/encounter';
import { getCombatantBorderColor } from './combatant-card-helpers';
import { CombatantCardInitiative } from './combatant-card-initiative';
import { CombatantCardHeader } from './combatant-card-header';
import { CombatantCardResources } from './combatant-card-resources';
import {
  CombatantCardConditionChips,
  CombatantCardConditionsPanel,
} from './combatant-card-conditions';
import { CombatantCardResourceQuickActions } from './combatant-card-quick-actions';

export const CombatantCard = memo(function CombatantCard({
  combatant,
  isCurrentTurn,
  isDragOver,
  isDragging,
  onUpdate,
  onRemove,
  onDuplicate,
  onAddCondition,
  onRemoveCondition,
  onUpdateConditionLevel,
  onUpdateAP,
  onDamage,
  onHeal,
  onEnergyDrain,
  onEnergyRestore,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  variant = 'full',
  canEditLinkedResources = false,
}: CombatantCardProps) {
  const [showConditions, setShowConditions] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingInitiative, setIsEditingInitiative] = useState(false);

  const isLinkedToCharacter = (combatant as TrackedCombatant).sourceType === 'campaign-character';
  const linkedResourcesReadOnly = isLinkedToCharacter && !canEditLinkedResources;
  const linkedResourcesTitle = canEditLinkedResources
    ? 'Synced with your character sheet'
    : 'Synced from character sheet';
  const isDead = combatant.currentHealth <= 0 && combatant.combatantType === 'enemy';

  return (
    <Card
      id={`combatant-${combatant.id}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        'shadow-md p-3 transition-all',
        isCurrentTurn && 'ring-2 ring-primary-subtle-border shadow-lg',
        isDead && 'bg-enemy-light opacity-90',
        isDragOver && 'ring-2 ring-warning-500 bg-warning-light',
        isDragging && 'opacity-50',
        'border-l-4',
        getCombatantBorderColor(combatant)
      )}
    >
      <div className="flex items-start gap-3">
        <CombatantCardInitiative
          combatant={combatant}
          isCurrentTurn={isCurrentTurn}
          isEditingInitiative={isEditingInitiative}
          onStartEditInitiative={() => setIsEditingInitiative(true)}
          onStopEditInitiative={() => setIsEditingInitiative(false)}
          onUpdate={onUpdate}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        />

        <div className="flex-1 min-w-0">
          <CombatantCardHeader
            combatant={combatant}
            isCurrentTurn={isCurrentTurn}
            isDead={isDead}
            variant={variant}
            linkedResourcesReadOnly={linkedResourcesReadOnly}
            linkedResourcesTitle={linkedResourcesTitle}
            isEditingName={isEditingName}
            onStartEditName={() => setIsEditingName(true)}
            onStopEditName={() => setIsEditingName(false)}
            onUpdate={onUpdate}
            onUpdateAP={onUpdateAP}
          />

          <CombatantCardResources
            combatant={combatant}
            variant={variant}
            linkedResourcesReadOnly={linkedResourcesReadOnly}
            linkedResourcesTitle={linkedResourcesTitle}
            onUpdate={onUpdate}
          />

          <CombatantCardConditionChips
            combatant={combatant}
            onRemoveCondition={onRemoveCondition}
            onUpdateConditionLevel={onUpdateConditionLevel}
          />

          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border-subtle">
            <CombatantCardResourceQuickActions
              variant={variant}
              isLinkedToCharacter={isLinkedToCharacter}
              onDamage={onDamage}
              onHeal={onHeal}
              onEnergyDrain={onEnergyDrain}
              onEnergyRestore={onEnergyRestore}
            />

            <button
              onClick={() => setShowConditions(!showConditions)}
              className={cn(
                'px-2 py-0.5 text-xs rounded touch-target-md-compact inline-flex items-center justify-center',
                showConditions ? 'bg-warning-500 text-text-on-dark' : 'bg-warning-light text-warning-fg hover:opacity-90'
              )}
            >
              {showConditions ? '▲' : '▼'} Conditions
            </button>

            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={onDuplicate}
                className="px-2 py-0.5 text-xs bg-surface-alt text-text-secondary rounded hover:bg-surface touch-target-md-compact inline-flex items-center justify-center"
                title="Duplicate this combatant"
                aria-label={`Duplicate ${combatant.name}`}
              >
                📋
              </button>
              <button
                onClick={onRemove}
                className="px-2 py-0.5 text-xs bg-surface-alt text-text-secondary rounded hover:bg-danger-light hover:text-danger-fg touch-target-md-compact inline-flex items-center justify-center"
                title="Remove combatant"
                aria-label={`Remove ${combatant.name}`}
              >
                ✕
              </button>
            </div>
          </div>

          {showConditions && (
            <CombatantCardConditionsPanel
              combatant={combatant}
              onAddCondition={onAddCondition}
            />
          )}
        </div>
      </div>
    </Card>
  );
});
