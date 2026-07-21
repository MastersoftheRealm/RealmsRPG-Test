/**
 * Skill encounter participant card (TASK-608)
 */

"use client";

import { useState, type DragEvent } from "react";
import { cn } from "@/lib/utils";
import {
  Trash2,
  RotateCcw,
  HandHelping,
  GripVertical,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import type {
  SkillParticipant,
  SkillParticipantType,
} from "@/types/encounter";

export interface CodexSkillOption {
  id: string;
  name: string;
}

function getParticipantBorderColor(
  participant: SkillParticipant,
  useInitiative: boolean,
): string {
  if (useInitiative && participant.participantType === "enemy")
    return "border-l-enemy";
  if (useInitiative && participant.participantType === "ally")
    return "border-l-ally";
  if (participant.isHelping) return "border-l-warning-500";
  const hasActed = participant.hasRolled || participant.isHelping;
  const isSuccess = (participant.successCount ?? 0) > 0;
  if (hasActed && isSuccess) return "border-l-success-500";
  if (hasActed && !isSuccess) return "border-l-danger-500";
  return "border-l-border-light";
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
  onUpdateInitiative?: (value: number) => void;
  onUpdateParticipantType?: (t: SkillParticipantType) => void;
  onRollInitiative?: () => void;
  onDragStart?: (e: DragEvent<HTMLDivElement>) => void;
  onDragEnd?: () => void;
  onDragOver?: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave?: () => void;
  onDrop?: (e: DragEvent<HTMLDivElement>) => void;
}) {
  const [rollInput, setRollInput] = useState("");
  const [rmBonusInput, setRmBonusInput] = useState(
    participant.rmBonus == null ? "" : String(participant.rmBonus),
  );
  const [syncedRmBonus, setSyncedRmBonus] = useState(participant.rmBonus);
  if (participant.rmBonus !== syncedRmBonus) {
    setSyncedRmBonus(participant.rmBonus);
    setRmBonusInput(
      participant.rmBonus == null ? "" : String(participant.rmBonus),
    );
  }
  const hasActed = participant.hasRolled || participant.isHelping;
  const isSuccess = (participant.successCount ?? 0) > 0;
  const successCount = participant.successCount ?? 0;
  const failureCount = participant.failureCount ?? 0;
  const effectiveRoll =
    participant.hasRolled &&
    participant.rollValue != null &&
    (participant.rmBonus ?? 0) !== 0
      ? participant.rollValue + (participant.rmBonus ?? 0)
      : null;

  const submitRoll = () => {
    const val = parseInt(rollInput, 10);
    if (isNaN(val)) return;
    const bonusParsed = rmBonusInput.trim();
    const rmBonus =
      bonusParsed === "" || bonusParsed === "-"
        ? undefined
        : parseInt(bonusParsed, 10);
    onUpdateRmBonus(Number.isNaN(rmBonus as number) ? undefined : rmBonus);
    onUpdateRoll(val);
    setRollInput("");
  };

  const handleRmBonusChange = (value: string) => {
    setRmBonusInput(value);
    const v = value.trim();
    if (v === "" || v === "-") {
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
        "shadow-md p-3 transition-all border-l-4",
        getParticipantBorderColor(participant, useInitiative),
        participant.isHelping && "bg-warning-light/50",
        hasActed &&
          !participant.isHelping &&
          isSuccess &&
          "bg-success-light/50",
        hasActed &&
          !participant.isHelping &&
          !isSuccess &&
          "bg-danger-light/50",
        isDragOver && "ring-2 ring-warning-500 bg-warning-light",
        isDragging && "opacity-50",
      )}
    >
      <div className="flex items-start gap-3">
        {useInitiative && (
          <div
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            className="flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing select-none"
          >
            <div className="text-text-muted dark:text-text-secondary hover:text-text-primary p-1 rounded hover:bg-surface-alt">
              <GripVertical className="w-5 h-5" aria-hidden />
            </div>
            <div
              className="w-10 h-10 rounded-lg flex flex-col items-center justify-center bg-surface-alt text-text-secondary text-sm font-bold cursor-pointer hover:bg-surface transition-colors min-w-[44px] min-h-[44px]"
              onClick={onRollInitiative}
              title="Roll initiative (d20)"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onRollInitiative?.()}
              aria-label={`Initiative: ${participant.initiative ?? "not set"}. Click to roll.`}
            >
              {participant.initiative ?? "-"}
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <div className="font-bold text-text-primary">
              {participant.name}
            </div>
            {useInitiative && onUpdateParticipantType && (
              <select
                value={participant.participantType ?? "ally"}
                onChange={(e) =>
                  onUpdateParticipantType(
                    e.target.value as SkillParticipantType,
                  )
                }
                aria-label="Participant side"
                className={cn(
                  "text-[10px] font-medium rounded px-1.5 py-0.5 border cursor-pointer",
                  (participant.participantType ?? "ally") === "ally" &&
                    "bg-ally-light border-ally text-ally-text",
                  participant.participantType === "enemy" &&
                    "bg-enemy-light border-enemy text-enemy-text",
                )}
              >
                <option value="ally">Ally</option>
                <option value="enemy">Enemy</option>
              </select>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              aria-label="Skill for participant"
              value={participant.skillUsed || ""}
              onChange={(e) => onUpdateSkill(e.target.value)}
              className="text-xs bg-transparent border border-border-light rounded px-1 py-0.5 text-text-secondary focus:border-primary-outline-border focus:outline-none min-w-0 max-w-[140px]"
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

        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
          {participant.isHelping ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onSetHelping(false)}
            >
              Undo Helping
            </Button>
          ) : participant.hasRolled ? (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <div
                  className={cn(
                    "px-3 py-1 rounded-lg font-bold text-sm",
                    isSuccess
                      ? "bg-success-light text-success-fg"
                      : "bg-danger-light text-danger-fg",
                  )}
                >
                  {participant.rollValue}
                  {(participant.rmBonus ?? 0) !== 0 && (
                    <span className="text-xs font-normal ml-1">
                      ({participant.rmBonus! > 0 ? "+" : ""}
                      {participant.rmBonus}) = {effectiveRoll}
                    </span>
                  )}
                  <span className="text-xs font-normal ml-1">vs {ds}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-text-muted dark:text-text-secondary">
                    RM
                  </span>
                  <input
                    type="number"
                    value={rmBonusInput}
                    onChange={(e) => handleRmBonusChange(e.target.value)}
                    placeholder="+0"
                    className="w-14 px-2 py-1 text-xs border border-border-light rounded bg-surface text-text-primary focus:border-primary-outline-border focus:outline-none min-h-[44px]"
                    aria-label="RM bonus"
                  />
                </div>
                <span
                  className={cn(
                    "px-2 py-1 rounded-lg text-sm font-bold min-h-[44px] flex items-center",
                    successCount > 0
                      ? "bg-success-light text-success-fg"
                      : "bg-danger-light text-danger-fg",
                  )}
                  aria-live="polite"
                >
                  {successCount > 0
                    ? `${successCount} Success${successCount !== 1 ? "es" : ""}!`
                    : failureCount > 0
                      ? `${failureCount} Failure${failureCount !== 1 ? "s" : ""}!`
                      : ""}
                </span>
                <button
                  onClick={onClearRoll}
                  className="p-2 min-w-[44px] min-h-[44px] text-text-muted dark:text-text-secondary hover:text-text-secondary rounded hover:bg-surface-alt"
                  title="Clear roll"
                  aria-label="Clear roll"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <input
                type="number"
                value={rollInput}
                onChange={(e) => setRollInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitRoll()}
                placeholder="Total"
                className="w-16 px-2 py-1.5 text-sm border border-border-light rounded-lg bg-surface text-text-primary focus:border-primary-outline-border focus:outline-none min-h-[44px]"
                aria-label="Roll total"
              />
              <div className="flex items-center gap-1">
                <span className="text-xs text-text-muted dark:text-text-secondary">
                  RM
                </span>
                <input
                  type="number"
                  value={rmBonusInput}
                  onChange={(e) => handleRmBonusChange(e.target.value)}
                  placeholder="+0"
                  className="w-14 px-2 py-1.5 text-sm border border-border-light rounded-lg bg-surface text-text-primary focus:border-primary-outline-border focus:outline-none min-h-[44px]"
                  aria-label="RM bonus"
                />
              </div>
              <Button
                size="sm"
                onClick={submitRoll}
                disabled={!rollInput}
                className="min-h-[44px]"
              >
                Submit
              </Button>
              <span
                className={cn(
                  "px-2 py-1 rounded-lg text-sm font-bold min-h-[44px] flex items-center empty:invisible",
                  successCount > 0
                    ? "bg-success-light text-success-fg"
                    : failureCount > 0
                      ? "bg-danger-light text-danger-fg"
                      : "",
                )}
                aria-live="polite"
              >
                {successCount > 0
                  ? `${successCount} Success${successCount !== 1 ? "es" : ""}!`
                  : failureCount > 0
                    ? `${failureCount} Failure${failureCount !== 1 ? "s" : ""}!`
                    : ""}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onSetHelping(true)}
                title="Mark as helping (doesn't count toward encounter)"
                aria-label="Mark as helping"
                className="min-h-[44px]"
              >
                <HandHelping className="w-4 h-4" />
              </Button>
            </>
          )}

          <button
            onClick={onRemove}
            className="p-2 min-w-[44px] min-h-[44px] text-text-muted dark:text-text-secondary hover:text-danger-fg hover:bg-danger-light rounded-lg transition-colors flex-shrink-0"
            title="Remove participant"
            aria-label="Remove participant"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}
