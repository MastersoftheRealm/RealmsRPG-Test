/**
 * Skill encounter participant list (TASK-608)
 */

"use client";

import type { DragEvent } from "react";
import { Users } from "lucide-react";
import { Card, CardContent, EmptyState } from "@/components/ui";
import type {
  SkillParticipant,
  SkillParticipantType,
} from "@/types/encounter";
import {
  ParticipantCard,
  type CodexSkillOption,
} from "./skill-participant-card";

export interface SkillParticipantListProps {
  sortedParticipants: SkillParticipant[];
  difficultyScore: number;
  codexSkills: CodexSkillOption[];
  useInitiative: boolean;
  draggedId: string | null;
  dragOverId: string | null;
  onUpdateRoll: (id: string, value: number) => void;
  onUpdateSkill: (id: string, skill: string) => void;
  onUpdateRmBonus: (id: string, value: number | undefined) => void;
  onClearRoll: (id: string) => void;
  onSetHelping: (id: string, v: boolean) => void;
  onRemove: (id: string) => void;
  onUpdateInitiative: (id: string, value: number) => void;
  onUpdateParticipantType: (id: string, t: SkillParticipantType) => void;
  onRollInitiative: (id: string) => void;
  onDragStart: (e: DragEvent<HTMLDivElement>, id: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: DragEvent<HTMLDivElement>, id: string) => void;
  onDragLeave: () => void;
  onDrop: (e: DragEvent<HTMLDivElement>, id: string) => void;
}

export function SkillParticipantList({
  sortedParticipants,
  difficultyScore,
  codexSkills,
  useInitiative,
  draggedId,
  dragOverId,
  onUpdateRoll,
  onUpdateSkill,
  onUpdateRmBonus,
  onClearRoll,
  onSetHelping,
  onRemove,
  onUpdateInitiative,
  onUpdateParticipantType,
  onRollInitiative,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: SkillParticipantListProps) {
  return (
    <div className="space-y-3">
      {sortedParticipants.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              title="No participants yet"
              description="Add characters using the panel on the right."
              icon={<Users className="w-6 h-6" />}
              size="sm"
              className="py-4"
            />
          </CardContent>
        </Card>
      ) : (
        sortedParticipants.map((p) => (
          <ParticipantCard
            key={p.id}
            participant={p}
            ds={difficultyScore}
            codexSkills={codexSkills}
            useInitiative={useInitiative}
            isDragOver={dragOverId === p.id}
            isDragging={draggedId === p.id}
            onUpdateRoll={(val) => onUpdateRoll(p.id, val)}
            onUpdateSkill={(s) => onUpdateSkill(p.id, s)}
            onUpdateRmBonus={(v) => onUpdateRmBonus(p.id, v)}
            onClearRoll={() => onClearRoll(p.id)}
            onSetHelping={(v) => onSetHelping(p.id, v)}
            onRemove={() => onRemove(p.id)}
            onUpdateInitiative={(v) => onUpdateInitiative(p.id, v)}
            onUpdateParticipantType={(t) => onUpdateParticipantType(p.id, t)}
            onRollInitiative={() => onRollInitiative(p.id)}
            onDragStart={(e) => onDragStart(e, p.id)}
            onDragEnd={onDragEnd}
            onDragOver={(e) => onDragOver(e, p.id)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, p.id)}
          />
        ))
      )}
    </div>
  );
}
