'use client';

import { cn } from '@/lib/utils';
import { ValueStepper } from '@/components/shared';
import type { Combatant } from '@/types/encounter';

export interface CombatantCardHeaderProps {
  combatant: Combatant;
  isCurrentTurn: boolean;
  isDead: boolean;
  variant: 'full' | 'compact';
  linkedResourcesReadOnly: boolean;
  linkedResourcesTitle: string;
  isEditingName: boolean;
  onStartEditName: () => void;
  onStopEditName: () => void;
  onUpdate: (updates: Partial<Combatant>) => void;
  onUpdateAP: (delta: number) => void;
}

export function CombatantCardHeader({
  combatant,
  isCurrentTurn,
  isDead,
  variant,
  linkedResourcesReadOnly,
  linkedResourcesTitle,
  isEditingName,
  onStartEditName,
  onStopEditName,
  onUpdate,
  onUpdateAP,
}: CombatantCardHeaderProps) {
  return (
    <div className="flex items-center gap-2 mb-2 flex-wrap">
      {isEditingName ? (
        <input
          type="text"
          value={combatant.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          onBlur={onStopEditName}
          onKeyDown={(e) => e.key === 'Enter' && onStopEditName()}
          className="text-base font-bold border-b-2 border-primary-outline-border outline-none bg-transparent"
          autoFocus
        />
      ) : (
        <div
          role="button"
          tabIndex={0}
          className={cn('text-base font-bold cursor-pointer hover:text-primary-fg-hover', isDead && 'line-through text-text-muted dark:text-text-secondary')}
          onClick={onStartEditName}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onStartEditName(); } }}
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
  );
}
