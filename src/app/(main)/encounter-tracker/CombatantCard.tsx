/**
 * Combatant Card - Single combatant display with HP, energy, conditions, actions
 */

'use client';

import { useState } from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { ValueStepper } from '@/components/shared';
import { CONDITION_OPTIONS } from './encounter-tracker-constants';
import type { CombatantCardProps } from './encounter-tracker-types';

function getHealthBarColor(current: number, max: number): string {
  if (max <= 0) return 'bg-red-500';
  const pct = (current / max) * 100;
  if (pct > 50) return 'bg-green-500';
  if (pct > 25) return 'bg-amber-500';
  return 'bg-red-700';
}

export function CombatantCard({
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
}: CombatantCardProps) {
  const [damageInput, setDamageInput] = useState('');
  const [healInput, setHealInput] = useState('');
  const [energyDrainInput, setEnergyDrainInput] = useState('');
  const [energyRestoreInput, setEnergyRestoreInput] = useState('');
  const [showConditions, setShowConditions] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState('');
  const [customCondition, setCustomCondition] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingInitiative, setIsEditingInitiative] = useState(false);

  const healthPercent = combatant.maxHealth > 0 ? (combatant.currentHealth / combatant.maxHealth) * 100 : 0;
  const energyPercent = combatant.maxEnergy > 0 ? (combatant.currentEnergy / combatant.maxEnergy) * 100 : 0;
  const isDead = combatant.currentHealth <= 0 && combatant.combatantType === 'enemy';

  const handleDamage = () => {
    const amount = parseInt(damageInput);
    if (amount > 0 && onDamage) {
      onDamage(amount);
      setDamageInput('');
    }
  };

  const handleHeal = () => {
    const amount = parseInt(healInput);
    if (amount > 0 && onHeal) {
      onHeal(amount);
      setHealInput('');
    }
  };

  const handleEnergyDrain = () => {
    const amount = parseInt(energyDrainInput);
    if (amount > 0 && onEnergyDrain) {
      onEnergyDrain(amount);
      setEnergyDrainInput('');
    }
  };

  const handleEnergyRestore = () => {
    const amount = parseInt(energyRestoreInput);
    if (amount > 0 && onEnergyRestore) {
      onEnergyRestore(amount);
      setEnergyRestoreInput('');
    }
  };

  const getBorderColor = () => {
    switch (combatant.combatantType) {
      case 'ally': return 'border-l-blue-500';
      case 'enemy': return 'border-l-red-500';
      case 'companion': return 'border-l-purple-500';
      default: return combatant.isAlly ? 'border-l-blue-500' : 'border-l-red-500';
    }
  };

  const handleAddCondition = () => {
    if (selectedCondition) {
      onAddCondition(selectedCondition);
      setSelectedCondition('');
    }
  };

  const handleAddCustomCondition = () => {
    const name = customCondition.trim();
    if (name && !combatant.conditions.some(c => c.name === name)) {
      onAddCondition(name);
      setCustomCondition('');
    }
  };

  return (
    <div
      id={`combatant-${combatant.id}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        'bg-surface rounded-xl shadow-md p-3 transition-all',
        isCurrentTurn && 'ring-2 ring-primary-500 shadow-lg',
        isDead && 'bg-red-50 dark:bg-red-900/30 opacity-75',
        isDragOver && 'ring-2 ring-amber-400 bg-amber-50 dark:bg-amber-900/30',
        isDragging && 'opacity-50',
        'border-l-4',
        getBorderColor()
      )}
    >
      <div className="flex items-start gap-3">
        <div
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          className="flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing select-none"
        >
          <div className="text-text-muted hover:text-text-secondary p-1 rounded hover:bg-surface-alt">
            <GripVertical className="w-5 h-5" />
          </div>
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors',
              isCurrentTurn ? 'bg-primary-600 text-white' : 'bg-surface-alt text-text-secondary hover:bg-surface'
            )}
            onClick={() => setIsEditingInitiative(true)}
            title="Click to edit initiative"
          >
            {isEditingInitiative ? (
              <input
                type="number"
                value={combatant.initiative}
                onChange={(e) => onUpdate({ initiative: parseInt(e.target.value) || 0 })}
                onBlur={() => setIsEditingInitiative(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingInitiative(false)}
                className="w-8 h-8 text-center text-sm font-bold bg-transparent border-none outline-none"
                autoFocus
              />
            ) : (
              <>
                <span className="text-lg font-bold leading-none">{combatant.initiative}</span>
                {combatant.acuity !== 0 && (
                  <span className="text-[10px] opacity-75 leading-none">+{combatant.acuity}</span>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {isEditingName ? (
              <input
                type="text"
                value={combatant.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                className="text-base font-bold border-b-2 border-primary-500 outline-none bg-transparent"
                autoFocus
              />
            ) : (
              <h3
                className={cn('text-base font-bold cursor-pointer hover:text-primary-600', isDead && 'line-through text-text-muted')}
                onClick={() => setIsEditingName(true)}
                title="Click to edit name"
              >
                {combatant.name}
              </h3>
            )}

            {combatant.combatantType === 'companion' && (
              <span className="px-1.5 py-0.5 text-[10px] bg-companion-light text-companion-text rounded font-medium">
                Companion
              </span>
            )}
            {combatant.isSurprised && (
              <span
                className="px-1.5 py-0.5 text-[10px] bg-warning-light dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 rounded font-medium cursor-pointer hover:bg-warning-200 dark:hover:bg-warning-800/40"
                onClick={() => onUpdate({ isSurprised: false })}
                title="Click to remove surprised"
              >
                Surprised ×
              </span>
            )}
            {isCurrentTurn && (
              <span className="px-1.5 py-0.5 text-[10px] bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded font-medium">
                Current
              </span>
            )}
            {isDead && (
              <span className="px-1.5 py-0.5 text-[10px] bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded font-medium">
                Down
              </span>
            )}

            <div className={cn('flex items-center gap-1 ml-auto', variant === 'compact' && 'gap-2')}>
              <span className={cn('text-text-muted', variant === 'compact' ? 'text-sm font-medium' : 'text-xs')}>AP:</span>
              <ValueStepper
                value={combatant.ap}
                onChange={(value) => onUpdateAP(value - combatant.ap)}
                min={0}
                max={10}
                size={variant === 'compact' ? 'sm' : 'xs'}
                enableHoldRepeat
              />
            </div>
          </div>

          {variant === 'compact' ? (
            <div className="flex items-center gap-3 mb-2">
              <div className={cn('flex flex-col flex-1 min-w-0 p-2 rounded-lg border', 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/50')}>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-red-700 dark:text-red-400 mb-0.5">Health</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={combatant.currentHealth}
                    onChange={(e) => onUpdate({ currentHealth: parseInt(e.target.value) || 0 })}
                    className={cn(
                      'w-10 px-0.5 py-0 text-sm font-bold rounded border text-center',
                      'border-red-300 dark:border-red-800 text-red-800 dark:text-red-300'
                    )}
                  />
                  <span className="text-xs text-red-700 dark:text-red-400">/ {combatant.maxHealth}</span>
                  <ValueStepper
                    value={combatant.currentHealth}
                    onChange={(v) => onUpdate({ currentHealth: Math.max(0, v) })}
                    min={0}
                    colorVariant="health"
                    size="xs"
                    variant="compact"
                    hideValue
                    enableHoldRepeat
                  />
                </div>
                <div className="relative h-1.5 mt-1 bg-surface rounded-full overflow-hidden">
                  <div
                    className={cn('absolute inset-y-0 left-0 transition-all rounded-full', getHealthBarColor(combatant.currentHealth, combatant.maxHealth))}
                    style={{ width: `${Math.max(0, Math.min(100, healthPercent))}%` }}
                  />
                </div>
              </div>
              <div className={cn('flex flex-col flex-1 min-w-0 p-2 rounded-lg border', 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50')}>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400 mb-0.5">Energy</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={combatant.currentEnergy}
                    onChange={(e) => onUpdate({ currentEnergy: parseInt(e.target.value) || 0 })}
                    className="w-10 px-0.5 py-0 text-sm font-bold rounded border border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-center"
                  />
                  <span className="text-xs text-blue-700 dark:text-blue-400">/ {combatant.maxEnergy}</span>
                  <ValueStepper
                    value={combatant.currentEnergy}
                    onChange={(v) => onUpdate({ currentEnergy: Math.max(0, v) })}
                    min={0}
                    colorVariant="energy"
                    size="xs"
                    variant="compact"
                    hideValue
                    enableHoldRepeat
                  />
                </div>
                <div className="relative h-1.5 mt-1 bg-surface rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-blue-500 transition-all rounded-full"
                    style={{ width: `${Math.max(0, Math.min(100, energyPercent))}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-1 flex-1">
                <span className="text-xs text-red-600 dark:text-red-400 font-medium w-6">HP</span>
                <input
                  type="number"
                  value={combatant.currentHealth}
                  onChange={(e) => onUpdate({ currentHealth: parseInt(e.target.value) || 0 })}
                  className={cn(
                    'w-12 px-1 py-0.5 text-xs border rounded text-center font-medium',
                    combatant.currentHealth <= 0 ? 'border-red-300 dark:border-red-600/50 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 'border-border-light'
                  )}
                />
                <span className="text-text-muted text-xs">/</span>
                <input
                  type="number"
                  value={combatant.maxHealth}
                  onChange={(e) => onUpdate({ maxHealth: parseInt(e.target.value) || 1 })}
                  className="w-12 px-1 py-0.5 text-xs border border-border-light rounded text-center"
                />
                <div className="flex-1 h-2 bg-surface-alt rounded-full overflow-hidden max-w-20">
                  <div
                    className={cn('h-full transition-all', getHealthBarColor(combatant.currentHealth, combatant.maxHealth))}
                    style={{ width: `${Math.max(0, Math.min(100, healthPercent))}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-1 flex-1">
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium w-6">EN</span>
                <input
                  type="number"
                  value={combatant.currentEnergy}
                  onChange={(e) => onUpdate({ currentEnergy: parseInt(e.target.value) || 0 })}
                  className="w-12 px-1 py-0.5 text-xs border border-border-light rounded text-center font-medium"
                />
                <span className="text-text-muted text-xs">/</span>
                <input
                  type="number"
                  value={combatant.maxEnergy}
                  onChange={(e) => onUpdate({ maxEnergy: parseInt(e.target.value) || 0 })}
                  className="w-12 px-1 py-0.5 text-xs border border-border-light rounded text-center"
                />
                <div className="flex-1 h-2 bg-surface-alt rounded-full overflow-hidden max-w-20">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${Math.max(0, Math.min(100, energyPercent))}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {combatant.conditions.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {combatant.conditions.map(cond => {
                const condDef = CONDITION_OPTIONS.find(c => c.name === cond.name);
                const isLeveled = condDef?.leveled ?? (cond.level > 0);
                const isCustom = !condDef;
                return (
                  <div
                    key={cond.name}
                    className={cn(
                      'px-2 py-0.5 text-xs rounded-full flex items-center gap-1 select-none',
                      isCustom ? 'bg-info-100 dark:bg-info-900/40 text-info-700 dark:text-info-300' :
                      isLeveled ? 'bg-companion-light dark:bg-violet-900/40 text-companion-text dark:text-violet-300' : 'bg-warning-light dark:bg-warning-900/30 text-warning-700 dark:text-warning-300'
                    )}
                    title={condDef?.description ?? 'Custom condition (leveled). Left-click to increase, right-click to decrease level.'}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      if (isLeveled) {
                        onUpdateConditionLevel(cond.name, -1);
                      } else {
                        onRemoveCondition(cond.name);
                      }
                    }}
                  >
                    <span
                      onClick={() => isLeveled && onUpdateConditionLevel(cond.name, 1)}
                      className={cn(isLeveled && 'cursor-pointer hover:underline')}
                    >
                      {cond.name}{isLeveled && ` (${cond.level})`}
                    </span>
                    <button
                      onClick={() => isLeveled ? onUpdateConditionLevel(cond.name, -1) : onRemoveCondition(cond.name)}
                      className="hover:text-red-600 dark:hover:text-red-400 font-bold"
                      title={isLeveled ? 'Decrease level (removes at 0)' : 'Remove condition'}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}

            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border-subtle">
            {variant === 'full' && onDamage && onHeal && onEnergyDrain && onEnergyRestore && (
            <>
            <div className="flex items-center gap-0.5 bg-red-50 dark:bg-red-900/30 rounded px-1.5 py-0.5">
              <input
                type="number"
                value={damageInput}
                onChange={(e) => setDamageInput(e.target.value)}
                placeholder="−"
                className="w-10 px-1 py-0.5 text-xs bg-white dark:bg-surface border border-red-200 dark:border-red-600/50 rounded text-center"
                onKeyDown={(e) => e.key === 'Enter' && handleDamage()}
              />
              <button
                onClick={handleDamage}
                className="px-1.5 py-0.5 text-xs text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-200 font-medium"
                title="Apply damage"
              >
                Dmg
              </button>
              <span className="text-border-light">|</span>
              <input
                type="number"
                value={healInput}
                onChange={(e) => setHealInput(e.target.value)}
                placeholder="+"
                className="w-10 px-1 py-0.5 text-xs bg-white dark:bg-surface border border-green-200 dark:border-green-600/50 rounded text-center"
                onKeyDown={(e) => e.key === 'Enter' && handleHeal()}
              />
              <button
                onClick={handleHeal}
                className="px-1.5 py-0.5 text-xs text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-200 font-medium"
                title="Apply healing"
              >
                Heal
              </button>
            </div>

            <div className="flex items-center gap-0.5 bg-blue-50 dark:bg-blue-900/30 rounded px-1.5 py-0.5">
              <input
                type="number"
                value={energyDrainInput}
                onChange={(e) => setEnergyDrainInput(e.target.value)}
                placeholder="−"
                className="w-10 px-1 py-0.5 text-xs bg-white dark:bg-surface border border-blue-200 dark:border-blue-600/50 rounded text-center"
                onKeyDown={(e) => e.key === 'Enter' && handleEnergyDrain()}
              />
              <button
                onClick={handleEnergyDrain}
                className="px-1.5 py-0.5 text-xs text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-200 font-medium"
                title="Drain energy"
              >
                Use
              </button>
              <span className="text-border-light">|</span>
              <input
                type="number"
                value={energyRestoreInput}
                onChange={(e) => setEnergyRestoreInput(e.target.value)}
                placeholder="+"
                className="w-10 px-1 py-0.5 text-xs bg-white dark:bg-surface border border-cyan-200 dark:border-cyan-600/50 rounded text-center"
                onKeyDown={(e) => e.key === 'Enter' && handleEnergyRestore()}
              />
              <button
                onClick={handleEnergyRestore}
                className="px-1.5 py-0.5 text-xs text-cyan-700 dark:text-cyan-300 hover:text-cyan-900 dark:hover:text-cyan-200 font-medium"
                title="Restore energy"
              >
                Rest
              </button>
            </div>
            </>
            )}

            <button
              onClick={() => setShowConditions(!showConditions)}
              className={cn(
                'px-2 py-0.5 text-xs rounded',
                showConditions ? 'bg-amber-500 text-white' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800/50'
              )}
            >
              {showConditions ? '▲' : '▼'} Conditions
            </button>

            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={onDuplicate}
                className="px-2 py-0.5 text-xs bg-surface-alt text-text-secondary rounded hover:bg-surface"
                title="Duplicate this combatant"
              >
                📋
              </button>
              <button
                onClick={onRemove}
                className="px-2 py-0.5 text-xs bg-surface-alt text-text-secondary rounded hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-700 dark:hover:text-red-300"
                title="Remove combatant"
              >
                ✕
              </button>
            </div>
          </div>

          {showConditions && (
            <div className="mt-3 pt-3 border-t border-border-subtle">
              <div className="flex items-center gap-2 mb-2">
                <select
                  value={selectedCondition}
                  onChange={(e) => setSelectedCondition(e.target.value)}
                  className="flex-1 px-3 py-1 text-sm border border-border-light rounded"
                >
                  <option value="">Select Condition...</option>
                  {CONDITION_OPTIONS.map(cond => (
                    <option
                      key={cond.name}
                      value={cond.name}
                      disabled={combatant.conditions.some(c => c.name === cond.name)}
                    >
                      {cond.name}{cond.leveled ? ' ⬇' : ''}
                    </option>
                  ))}
                </select>
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700"
                  onClick={handleAddCondition}
                  disabled={!selectedCondition}
                >
                  Add
                </Button>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={customCondition}
                  onChange={(e) => setCustomCondition(e.target.value)}
                  placeholder="Custom condition..."
                  className="flex-1 px-3 py-1 text-sm border border-border-light rounded"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustomCondition()}
                  maxLength={30}
                />
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-companion hover:bg-companion-dark"
                  onClick={handleAddCustomCondition}
                  disabled={!customCondition.trim()}
                >
                  Add Custom
                </Button>
              </div>
              <p className="text-xs text-text-muted">
                Left-click to increase level, right-click or × to decrease/remove. Custom conditions are leveled.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
