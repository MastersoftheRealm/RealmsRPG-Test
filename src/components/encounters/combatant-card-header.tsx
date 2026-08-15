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
    <div className="mb-2 flex flex-wrap items-center gap-2">
      {isEditingName ? (
        <input
          type="text"
          value={combatant.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          onBlur={onStopEditName}
          onKeyDown={(e) => e.key === 'Enter' && onStopEditName()}
          className="border-b-2 border-primary-outline-border bg-transparent text-base font-bold outline-none"
          autoFocus
        />
      ) : (
        <div
          role="button"
          tabIndex={0}
          className={cn(
            'cursor-pointer text-base font-bold hover:text-primary-fg-hover',
            isDead && 'text-text-muted line-through',
          )}
          onClick={onStartEditName}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onStartEditName();
            }
          }}
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
          'min-h-[var(--touch-target-min,44px)] cursor-pointer rounded border px-1.5 py-0.5 text-[10px] font-medium md:min-h-0',
          combatant.combatantType === 'ally' && 'border-ally bg-ally-light text-ally-text',
          combatant.combatantType === 'enemy' && 'border-enemy bg-enemy-light text-enemy-text',
          combatant.combatantType === 'companion' &&
            'border-companion bg-companion-light text-companion-text',
        )}
      >
        <option value="ally">Ally</option>
        <option value="enemy">Enemy</option>
        <option value="companion">Companion</option>
      </select>
      <label
        className="flex min-h-[var(--touch-target-min,44px)] cursor-pointer items-center gap-1 select-none"
        title="Surprised (goes last in round 1)"
      >
        <input
          type="checkbox"
          checked={!!combatant.isSurprised}
          onChange={(e) => onUpdate({ isSurprised: e.target.checked })}
          className="h-4 w-4 rounded border-border-light"
        />
        <span className="text-[10px] text-text-muted">Surprised</span>
      </label>
      {isCurrentTurn && (
        <span className="rounded bg-primary-subtle-bg px-1.5 py-0.5 text-[10px] font-medium text-primary-fg">
          Current
        </span>
      )}
      {isDead && (
        <span className="rounded bg-enemy-light px-1.5 py-0.5 text-[10px] font-medium text-enemy-text">
          Down
        </span>
      )}

      <div className={cn('ml-auto flex items-center gap-1', variant === 'compact' && 'gap-2')}>
        <span
          className={cn(
            'text-text-muted',
            variant === 'compact' ? 'text-sm font-medium' : 'text-xs',
          )}
        >
          AP:
        </span>
        {linkedResourcesReadOnly ? (
          <span
            className={cn('font-medium', variant === 'compact' ? 'text-sm' : 'text-xs')}
            title={linkedResourcesTitle}
          >
            {combatant.ap}
          </span>
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
