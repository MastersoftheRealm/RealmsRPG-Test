/**
 * Combat round / encounter chrome controls (TASK-608)
 */

"use client";

import { Button, Card } from "@/components/ui";
import type { Encounter } from "@/types/encounter";

export interface CombatRoundControlsProps {
  encounter: Encounter;
  setEncounter: React.Dispatch<React.SetStateAction<Encounter | null>>;
  onStartCombat: () => void;
  onPreviousTurn: () => void;
  onNextTurn: () => void;
  onSortInitiative: () => void;
  onEndCombat: () => void;
  onMarkCompleted: () => void;
  onResetEncounter: () => void;
}

export function CombatRoundControls({
  encounter,
  setEncounter,
  onStartCombat,
  onPreviousTurn,
  onNextTurn,
  onSortInitiative,
  onEndCombat,
  onMarkCompleted,
  onResetEncounter,
}: CombatRoundControlsProps) {
  return (
    <Card className="shadow-md p-4 flex flex-wrap items-center gap-4 flex-shrink-0">
      {!encounter.isActive ? (
        <>
          <Button
            onClick={onStartCombat}
            disabled={encounter.combatants.length === 0}
          >
            Start Encounter
          </Button>
          <Button onClick={onSortInitiative} title="Sort by initiative and acuity">
            Sort Initiative
          </Button>
        </>
      ) : (
        <>
          <Button variant="secondary" onClick={onPreviousTurn}>
            Previous
          </Button>
          <Button onClick={onNextTurn}>Next Turn</Button>
          <Button onClick={onSortInitiative} title="Sort by initiative and acuity">
            Sort Initiative
          </Button>
          <Button variant="danger" onClick={onEndCombat}>
            End Combat
          </Button>
          <Button variant="secondary" onClick={onMarkCompleted}>
            Mark Complete
          </Button>
        </>
      )}
      {!encounter.isActive && encounter.status !== "completed" && (
        <Button variant="secondary" onClick={onMarkCompleted}>
          Mark Complete
        </Button>
      )}
      <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
        <input
          type="checkbox"
          checked={encounter.autoSortInitiative !== false}
          onChange={(e) =>
            setEncounter((prev) =>
              prev ? { ...prev, autoSortInitiative: e.target.checked } : prev,
            )
          }
          className="rounded border-border-light"
        />
        Auto Sort Initiative
      </label>
      <Button variant="ghost" onClick={onResetEncounter} className="ml-auto">
        Reset All
      </Button>
      <Button
        variant="danger"
        onClick={() =>
          setEncounter((prev) => (prev ? { ...prev, combatants: [] } : prev))
        }
      >
        Clear All
      </Button>
    </Card>
  );
}
