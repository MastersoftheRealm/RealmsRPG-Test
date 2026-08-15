/**
 * Skill encounter participant card (TASK-608)
 */

'use client';

import { useState, type DragEvent } from 'react';
import { cn } from '@/lib/utils';
import { Trash2, RotateCcw, HandHelping, GripVertical } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import type { SkillParticipant, SkillParticipantType } from '@/types/encounter';

export interface CodexSkillOption {
  id: string;
  name: string;
}

function getParticipantBorderColor(participant: SkillParticipant, useInitiative: boolean): string {
  if (useInitiative && participant.participantType === 'enemy') return 'border-l-enemy';
  if (useInitiative && participant.participantType === 'ally') return 'border-l-ally';
  if (participant.isHelping) return 'border-l-warning-500';
  const hasActed = participant.hasRolled || participant.isHelping;
  const isSuccess = (participant.successCount ?? 0) > 0;
  if (hasActed && isSuccess) return 'border-l-success-500';
  if (hasActed && !isSuccess) return 'border-l-danger-500';
  return 'border-l-border-light';
}

export function ParticipantCard({
  participant,
  ds,
  codexSkills,
  useInitiative,
  isDragOver,
  isDragging,
  onUpdateRoll,
  onUpdateSkill,
  onUpdateRmBonus,
  onClearRoll,
  onSetHelping,
  onRemove,
  onUpdateParticipantType,
  onRollInitiative,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  participant: SkillParticipant;
  ds: number;
  codexSkills: CodexSkillOption[];
  useInitiative: boolean;
  isDragOver?: boolean;
  isDragging?: boolean;
  onUpdateRoll: (value: number) => void;
  onUpdateSkill: (skill: string) => void;
  onUpdateRmBonus: (value: number | undefined) => void;
  onClearRoll: () => void;
  onSetHelping: (v: boolean) => void;
  onRemove: () => void;
  onUpdateParticipantType?: (t: SkillParticipantType) => void;
  onRollInitiative?: () => void;
  onDragStart?: (e: DragEvent<HTMLDivElement>) => void;
  onDragEnd?: () => void;
  onDragOver?: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave?: () => void;
  onDrop?: (e: DragEvent<HTMLDivElement>) => void;
}) {
  const [rollInput, setRollInput] = useState('');
  const [rmBonusInput, setRmBonusInput] = useState(
    participant.rmBonus == null ? '' : String(participant.rmBonus),
  );
  const [syncedRmBonus, setSyncedRmBonus] = useState(participant.rmBonus);
  if (participant.rmBonus !== syncedRmBonus) {
    setSyncedRmBonus(participant.rmBonus);
    setRmBonusInput(participant.rmBonus == null ? '' : String(participant.rmBonus));
  }
  const hasActed = participant.hasRolled || participant.isHelping;
  const isSuccess = (participant.successCount ?? 0) > 0;
  const successCount = participant.successCount ?? 0;
  const failureCount = participant.failureCount ?? 0;
  const effectiveRoll =
    participant.hasRolled && participant.rollValue != null && (participant.rmBonus ?? 0) !== 0
      ? participant.rollValue + (participant.rmBonus ?? 0)
      : null;

  const submitRoll = () => {
    const val = parseInt(rollInput, 10);
    if (isNaN(val)) return;
    const bonusParsed = rmBonusInput.trim();
    const rmBonus =
      bonusParsed === '' || bonusParsed === '-' ? undefined : parseInt(bonusParsed, 10);
    onUpdateRmBonus(Number.isNaN(rmBonus as number) ? undefined : rmBonus);
    onUpdateRoll(val);
    setRollInput('');
  };

  const handleRmBonusChange = (value: string) => {
    setRmBonusInput(value);
    const v = value.trim();
    if (v === '' || v === '-') {
      onUpdateRmBonus(undefined);
      return;
    }
    const parsed = parseInt(v, 10);
    if (!Number.isNaN(parsed)) onUpdateRmBonus(parsed);
  };

  return (
    <Card
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        'border-l-4 p-3 shadow-md transition-all',
        getParticipantBorderColor(participant, useInitiative),
        participant.isHelping && 'bg-warning-light/50',
        hasActed && !participant.isHelping && isSuccess && 'bg-success-light/50',
        hasActed && !participant.isHelping && !isSuccess && 'bg-danger-light/50',
        isDragOver && 'bg-warning-light ring-2 ring-warning-500',
        isDragging && 'opacity-50',
      )}
    >
      <div className="flex items-start gap-3">
        {useInitiative && (
          <div
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            className="flex cursor-grab flex-col items-center gap-1 select-none active:cursor-grabbing"
          >
            <div className="rounded p-1 text-text-muted hover:bg-surface-alt hover:text-text-primary">
              <GripVertical className="h-5 w-5" aria-hidden />
            </div>
            <div
              className="flex h-10 min-h-[44px] w-10 min-w-[44px] cursor-pointer flex-col items-center justify-center rounded-lg bg-surface-alt text-sm font-bold text-text-secondary transition-colors hover:bg-surface"
              onClick={onRollInitiative}
              title="Roll initiative (d20)"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onRollInitiative?.()}
              aria-label={`Initiative: ${participant.initiative ?? 'not set'}. Click to roll.`}
            >
              {participant.initiative ?? '-'}
            </div>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <div className="font-bold text-text-primary">{participant.name}</div>
            {useInitiative && onUpdateParticipantType && (
              <select
                value={participant.participantType ?? 'ally'}
                onChange={(e) => onUpdateParticipantType(e.target.value as SkillParticipantType)}
                aria-label="Participant side"
                className={cn(
                  'cursor-pointer rounded border px-1.5 py-0.5 text-[10px] font-medium',
                  (participant.participantType ?? 'ally') === 'ally' &&
                    'border-ally bg-ally-light text-ally-text',
                  participant.participantType === 'enemy' &&
                    'border-enemy bg-enemy-light text-enemy-text',
                )}
              >
                <option value="ally">Ally</option>
                <option value="enemy">Enemy</option>
              </select>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Skill for participant"
              value={participant.skillUsed || ''}
              onChange={(e) => onUpdateSkill(e.target.value)}
              className="max-w-[140px] min-w-0 rounded border border-border-light bg-transparent px-1 py-0.5 text-xs text-text-secondary focus:border-primary-outline-border focus:outline-none"
            >
              <option value="">Skill...</option>
              {codexSkills.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-2">
          {participant.isHelping ? (
            <Button size="sm" variant="ghost" onClick={() => onSetHelping(false)}>
              Undo Helping
            </Button>
          ) : participant.hasRolled ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <div
                  className={cn(
                    'rounded-lg px-3 py-1 text-sm font-bold',
                    isSuccess
                      ? 'bg-success-light text-success-fg'
                      : 'bg-danger-light text-danger-fg',
                  )}
                >
                  {participant.rollValue}
                  {(participant.rmBonus ?? 0) !== 0 && (
                    <span className="ml-1 text-xs font-normal">
                      ({participant.rmBonus! > 0 ? '+' : ''}
                      {participant.rmBonus}) = {effectiveRoll}
                    </span>
                  )}
                  <span className="ml-1 text-xs font-normal">vs {ds}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-text-muted">RM</span>
                  <input
                    type="number"
                    value={rmBonusInput}
                    onChange={(e) => handleRmBonusChange(e.target.value)}
                    placeholder="+0"
                    className="min-h-[44px] w-14 rounded border border-border-light bg-surface px-2 py-1 text-xs text-text-primary focus:border-primary-outline-border focus:outline-none"
                    aria-label="RM bonus"
                  />
                </div>
                <span
                  className={cn(
                    'flex min-h-[44px] items-center rounded-lg px-2 py-1 text-sm font-bold',
                    successCount > 0
                      ? 'bg-success-light text-success-fg'
                      : 'bg-danger-light text-danger-fg',
                  )}
                  aria-live="polite"
                >
                  {successCount > 0
                    ? `${successCount} Success${successCount !== 1 ? 'es' : ''}!`
                    : failureCount > 0
                      ? `${failureCount} Failure${failureCount !== 1 ? 's' : ''}!`
                      : ''}
                </span>
                <button
                  onClick={onClearRoll}
                  className="min-h-[44px] min-w-[44px] rounded p-2 text-text-muted hover:bg-surface-alt hover:text-text-secondary"
                  title="Clear roll"
                  aria-label="Clear roll"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <input
                type="number"
                value={rollInput}
                onChange={(e) => setRollInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitRoll()}
                placeholder="Total"
                className="min-h-[44px] w-16 rounded-lg border border-border-light bg-surface px-2 py-1.5 text-sm text-text-primary focus:border-primary-outline-border focus:outline-none"
                aria-label="Roll total"
              />
              <div className="flex items-center gap-1">
                <span className="text-xs text-text-muted">RM</span>
                <input
                  type="number"
                  value={rmBonusInput}
                  onChange={(e) => handleRmBonusChange(e.target.value)}
                  placeholder="+0"
                  className="min-h-[44px] w-14 rounded-lg border border-border-light bg-surface px-2 py-1.5 text-sm text-text-primary focus:border-primary-outline-border focus:outline-none"
                  aria-label="RM bonus"
                />
              </div>
              <Button size="sm" onClick={submitRoll} disabled={!rollInput} className="min-h-[44px]">
                Submit
              </Button>
              <span
                className={cn(
                  'flex min-h-[44px] items-center rounded-lg px-2 py-1 text-sm font-bold empty:invisible',
                  successCount > 0
                    ? 'bg-success-light text-success-fg'
                    : failureCount > 0
                      ? 'bg-danger-light text-danger-fg'
                      : '',
                )}
                aria-live="polite"
              >
                {successCount > 0
                  ? `${successCount} Success${successCount !== 1 ? 'es' : ''}!`
                  : failureCount > 0
                    ? `${failureCount} Failure${failureCount !== 1 ? 's' : ''}!`
                    : ''}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onSetHelping(true)}
                title="Mark as helping (doesn't count toward encounter)"
                aria-label="Mark as helping"
                className="min-h-[44px]"
              >
                <HandHelping className="h-4 w-4" />
              </Button>
            </>
          )}

          <button
            onClick={onRemove}
            className="min-h-[44px] min-w-[44px] flex-shrink-0 rounded-lg p-2 text-text-muted transition-colors hover:bg-danger-light hover:text-danger-fg"
            title="Remove participant"
            aria-label="Remove participant"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}
