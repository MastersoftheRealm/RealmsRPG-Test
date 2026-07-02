/**
 * Combatant Card - Single combatant display with HP, energy, conditions, actions
 */

'use client';

import { useState, useRef, useEffect, memo } from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, Card } from '@/components/ui';
import { ValueStepper } from '@/components/shared';
import { CONDITION_OPTIONS } from './encounter-constants';
import type { CombatantCardProps } from './encounter-combatant-types';
import type { TrackedCombatant } from '@/types/encounter';

function getHealthBarColor(current: number, max: number): string {
  if (max <= 0) return 'bg-danger-500';
  const pct = (current / max) * 100;
  if (pct > 50) return 'bg-success-500';
  if (pct > 25) return 'bg-warning-500';
  return 'bg-danger-700';
}

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
  const [damageInput, setDamageInput] = useState('');
  const [healInput, setHealInput] = useState('');
  const [energyDrainInput, setEnergyDrainInput] = useState('');
  const [energyRestoreInput, setEnergyRestoreInput] = useState('');
  const [showConditions, setShowConditions] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState('');
  const [customCondition, setCustomCondition] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingInitiative, setIsEditingInitiative] = useState(false);
  const initiativeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingInitiative && initiativeInputRef.current) {
      initiativeInputRef.current.select();
    }
  }, [isEditingInitiative]);

  const isLinkedToCharacter = (combatant as TrackedCombatant).sourceType === 'campaign-character';
  const linkedResourcesReadOnly = isLinkedToCharacter && !canEditLinkedResources;
  const linkedResourcesTitle = canEditLinkedResources
    ? 'Synced with your character sheet'
    : 'Synced from character sheet';
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
      case 'ally': return 'border-l-ally';
      case 'enemy': return 'border-l-enemy';
      case 'companion': return 'border-l-companion';
      default: return combatant.isAlly ? 'border-l-ally' : 'border-l-enemy';
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
          <div className="text-text-muted dark:text-text-secondary hover:text-text-primary dark:hover:text-text-primary p-1 rounded hover:bg-surface-alt touch-target-md-compact flex items-center justify-center">
            <GripVertical className="w-5 h-5" />
          </div>
          <div
            className={cn(
              'w-11 h-11 md:w-10 md:h-10 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors',
              isCurrentTurn ? 'bg-primary-button text-white' : 'bg-surface-alt text-text-secondary hover:bg-surface'
            )}
            onClick={() => setIsEditingInitiative(true)}
            title="Click to edit initiative"
          >
            {isEditingInitiative ? (
              <input
                ref={initiativeInputRef}
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
                  <span className="text-[10px] text-text-muted dark:text-text-secondary leading-none">+{combatant.acuity}</span>
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
                className="text-base font-bold border-b-2 border-primary-outline-border outline-none bg-transparent"
                autoFocus
              />
            ) : (
              <div
                role="button"
                tabIndex={0}
                className={cn('text-base font-bold cursor-pointer hover:text-primary-fg-hover', isDead && 'line-through text-text-muted dark:text-text-secondary')}
                onClick={() => setIsEditingName(true)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsEditingName(true); } }}
                title="Click to edit name"
                aria-label={`Combatant name: ${combatant.name}. Click to edit.`}
              >
                {combatant.name}
              </div>
            )}

            <select
              value={combatant.combatantType}
              onChange={(e) => {
                const t = e.target.value as 'ally' | 'enemy' | 'companion';
                onUpdate({ combatantType: t, isAlly: t !== 'enemy' });
              }}
              title="Change side"
              aria-label="Combatant side (Ally, Enemy, or Companion)"
              className={cn(
                'text-[10px] font-medium rounded px-1.5 py-0.5 border cursor-pointer min-h-[var(--touch-target-min,44px)] md:min-h-0',
                combatant.combatantType === 'ally' && 'bg-ally-light border-ally text-ally-text',
                combatant.combatantType === 'enemy' && 'bg-enemy-light border-enemy text-enemy-text',
                combatant.combatantType === 'companion' && 'bg-companion-light border-companion text-companion-text'
              )}
            >
              <option value="ally">Ally</option>
              <option value="enemy">Enemy</option>
              <option value="companion">Companion</option>
            </select>
            <label className="flex items-center gap-1 cursor-pointer select-none min-h-[var(--touch-target-min,44px)]" title="Surprised (goes last in round 1)">
              <input
                type="checkbox"
                checked={!!combatant.isSurprised}
                onChange={(e) => onUpdate({ isSurprised: e.target.checked })}
                className="rounded border-border-light w-4 h-4"
              />
              <span className="text-[10px] text-text-muted dark:text-text-secondary">Surprised</span>
            </label>
            {isCurrentTurn && (
              <span className="px-1.5 py-0.5 text-[10px] bg-primary-subtle-bg text-primary-fg rounded font-medium">
                Current
              </span>
            )}
            {isDead && (
              <span className="px-1.5 py-0.5 text-[10px] bg-enemy-light text-enemy-text rounded font-medium">
                Down
              </span>
            )}

            <div className={cn('flex items-center gap-1 ml-auto', variant === 'compact' && 'gap-2')}>
              <span className={cn('text-text-muted dark:text-text-secondary', variant === 'compact' ? 'text-sm font-medium' : 'text-xs')}>AP:</span>
              {linkedResourcesReadOnly ? (
                <span className={cn('font-medium', variant === 'compact' ? 'text-sm' : 'text-xs')} title={linkedResourcesTitle}>{combatant.ap}</span>
              ) : (
                <ValueStepper
                  value={combatant.ap}
                  onChange={(value) => onUpdateAP(value - combatant.ap)}
                  min={0}
                  max={10}
                  size={variant === 'compact' ? 'sm' : 'xs'}
                  enableHoldRepeat
                />
              )}
            </div>
          </div>

          {variant === 'compact' ? (
            <div className="flex items-center gap-3 mb-2">
              <div className={cn('flex flex-col flex-1 min-w-0 p-2 rounded-lg border', 'bg-health-light border-health-border')}>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-health-text mb-0.5">Health</span>
                <div className="flex items-center gap-1">
                  {linkedResourcesReadOnly ? (
                    <span className="text-sm font-bold text-health-text" title={linkedResourcesTitle}>{combatant.currentHealth} / {combatant.maxHealth}</span>
                  ) : (
                    <>
                      <input
                        type="number"
                        value={combatant.currentHealth}
                        onChange={(e) => onUpdate({ currentHealth: parseInt(e.target.value) || 0 })}
                        className={cn(
                          'w-10 px-0.5 py-0 text-sm font-bold rounded border text-center min-h-[var(--touch-target-min,44px)] md:min-h-0',
                          'border-health-border text-health-text'
                        )}
                      />
                      <span className="text-xs text-health-text">/ {combatant.maxHealth}</span>
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
                    </>
                  )}
                </div>
                <div className="relative h-1.5 mt-1 bg-surface rounded-full overflow-hidden">
                  <div
                    className={cn('absolute inset-y-0 left-0 transition-all rounded-full', getHealthBarColor(combatant.currentHealth, combatant.maxHealth))}
                    style={{ width: `${Math.max(0, Math.min(100, healthPercent))}%` }}
                  />
                </div>
              </div>
              <div className={cn('flex flex-col flex-1 min-w-0 p-2 rounded-lg border', 'bg-energy-light border-energy-border')}>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-energy-text mb-0.5">Energy</span>
                <div className="flex items-center gap-1">
                  {linkedResourcesReadOnly ? (
                    <span className="text-sm font-bold text-energy-text" title={linkedResourcesTitle}>{combatant.currentEnergy} / {combatant.maxEnergy}</span>
                  ) : (
                    <>
                      <input
                        type="number"
                        value={combatant.currentEnergy}
                        onChange={(e) => onUpdate({ currentEnergy: parseInt(e.target.value) || 0 })}
                        className="w-10 px-0.5 py-0 text-sm font-bold rounded border border-energy-border text-energy-text text-center min-h-[var(--touch-target-min,44px)] md:min-h-0"
                      />
                      <span className="text-xs text-energy-text">/ {combatant.maxEnergy}</span>
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
                    </>
                  )}
                </div>
                <div className="relative h-1.5 mt-1 bg-surface rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-energy transition-all rounded-full"
                    style={{ width: `${Math.max(0, Math.min(100, energyPercent))}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-1 flex-1">
                <span className="text-xs text-health-text font-medium w-6">HP</span>
                {linkedResourcesReadOnly ? (
                  <span className="text-xs font-medium" title={linkedResourcesTitle}>{combatant.currentHealth} / {combatant.maxHealth}</span>
                ) : (
                  <>
                    <input
                      type="number"
                      value={combatant.currentHealth}
                      onChange={(e) => onUpdate({ currentHealth: parseInt(e.target.value) || 0 })}
                      className={cn(
                        'w-12 px-1 py-0.5 text-xs border rounded text-center font-medium min-h-[var(--touch-target-min,44px)] md:min-h-0',
                        combatant.currentHealth <= 0 ? 'border-danger-300 bg-danger-light text-danger-fg' : 'border-border-light'
                      )}
                    />
                    <span className="text-text-muted dark:text-text-secondary text-xs">/</span>
                    <input
                      type="number"
                      value={combatant.maxHealth}
                      onChange={(e) => onUpdate({ maxHealth: parseInt(e.target.value) || 1 })}
                      className="w-12 px-1 py-0.5 text-xs border border-border-light rounded text-center min-h-[var(--touch-target-min,44px)] md:min-h-0"
                    />
                  </>
                )}
                <div className="flex-1 h-2 bg-surface-alt rounded-full overflow-hidden max-w-20">
                  <div
                    className={cn('h-full transition-all', getHealthBarColor(combatant.currentHealth, combatant.maxHealth))}
                    style={{ width: `${Math.max(0, Math.min(100, healthPercent))}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-1 flex-1">
                <span className="text-xs text-energy-text font-medium w-6">EN</span>
                {linkedResourcesReadOnly ? (
                  <span className="text-xs font-medium" title={linkedResourcesTitle}>{combatant.currentEnergy} / {combatant.maxEnergy}</span>
                ) : (
                  <>
                    <input
                      type="number"
                      value={combatant.currentEnergy}
                      onChange={(e) => onUpdate({ currentEnergy: parseInt(e.target.value) || 0 })}
                      className="w-12 px-1 py-0.5 text-xs border border-border-light rounded text-center font-medium min-h-[var(--touch-target-min,44px)] md:min-h-0"
                    />
                    <span className="text-text-muted dark:text-text-secondary text-xs">/</span>
                    <input
                      type="number"
                      value={combatant.maxEnergy}
                      onChange={(e) => onUpdate({ maxEnergy: parseInt(e.target.value) || 0 })}
                      className="w-12 px-1 py-0.5 text-xs border border-border-light rounded text-center min-h-[var(--touch-target-min,44px)] md:min-h-0"
                    />
                  </>
                )}
                <div className="flex-1 h-2 bg-surface-alt rounded-full overflow-hidden max-w-20">
                  <div
                    className="h-full bg-energy transition-all"
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
                      isCustom ? 'bg-info-light text-info-fg' :
                      isLeveled ? 'bg-companion-light text-companion-text' : 'bg-warning-light text-warning-fg'
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
                      className="hover:text-danger-fg font-bold touch-target-md-compact inline-flex items-center justify-center"
                      title={isLeveled ? 'Decrease level (removes at 0)' : 'Remove condition'}
                      aria-label={isLeveled ? `Decrease ${cond.name} level` : `Remove ${cond.name} condition`}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}

            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border-subtle">
            {variant === 'full' && !isLinkedToCharacter && onDamage && onHeal && onEnergyDrain && onEnergyRestore && (
            <>
            <div className="flex items-center gap-0.5 bg-danger-light rounded px-1.5 py-0.5">
              <input
                type="number"
                value={damageInput}
                onChange={(e) => setDamageInput(e.target.value)}
                placeholder="−"
                className="w-10 px-1 py-0.5 text-xs bg-surface border border-danger-300 rounded text-center min-h-[var(--touch-target-min,44px)] md:min-h-0"
                onKeyDown={(e) => e.key === 'Enter' && handleDamage()}
              />
              <button
                onClick={handleDamage}
                className="px-1.5 py-0.5 text-xs text-danger-fg hover:opacity-80 font-medium touch-target-md-compact inline-flex items-center justify-center"
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
                className="w-10 px-1 py-0.5 text-xs bg-surface border border-success-300 rounded text-center min-h-[var(--touch-target-min,44px)] md:min-h-0"
                onKeyDown={(e) => e.key === 'Enter' && handleHeal()}
              />
              <button
                onClick={handleHeal}
                className="px-1.5 py-0.5 text-xs text-success-fg hover:opacity-80 font-medium touch-target-md-compact inline-flex items-center justify-center"
                title="Apply healing"
              >
                Heal
              </button>
            </div>

            <div className="flex items-center gap-0.5 bg-energy-light rounded px-1.5 py-0.5">
              <input
                type="number"
                value={energyDrainInput}
                onChange={(e) => setEnergyDrainInput(e.target.value)}
                placeholder="−"
                className="w-10 px-1 py-0.5 text-xs bg-surface border border-energy-border rounded text-center min-h-[var(--touch-target-min,44px)] md:min-h-0"
                onKeyDown={(e) => e.key === 'Enter' && handleEnergyDrain()}
              />
              <button
                onClick={handleEnergyDrain}
                className="px-1.5 py-0.5 text-xs text-energy-text hover:opacity-80 font-medium touch-target-md-compact inline-flex items-center justify-center"
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
                className="w-10 px-1 py-0.5 text-xs bg-surface border border-info-border rounded text-center min-h-[var(--touch-target-min,44px)] md:min-h-0"
                onKeyDown={(e) => e.key === 'Enter' && handleEnergyRestore()}
              />
              <button
                onClick={handleEnergyRestore}
                className="px-1.5 py-0.5 text-xs text-info-fg hover:opacity-80 font-medium touch-target-md-compact inline-flex items-center justify-center"
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
                'px-2 py-0.5 text-xs rounded touch-target-md-compact inline-flex items-center justify-center',
                showConditions ? 'bg-warning-500 text-white' : 'bg-warning-light text-warning-fg hover:opacity-90'
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
            <div className="mt-3 pt-3 border-t border-border-subtle">
              <div className="flex items-center gap-2 mb-2">
                <select
                  value={selectedCondition}
                  onChange={(e) => setSelectedCondition(e.target.value)}
                  className="flex-1 px-3 py-1 text-sm border border-border-light rounded min-h-[var(--touch-target-min,44px)] md:min-h-0"
                  aria-label="Select condition to add"
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
                  aria-label="Custom condition name"
                  className="flex-1 px-3 py-1 text-sm border border-border-light rounded min-h-[var(--touch-target-min,44px)] md:min-h-0"
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
              <p className="text-xs text-text-muted dark:text-text-secondary">
                Left-click to increase level, right-click or × to decrease/remove. Custom conditions are leveled.
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
});
