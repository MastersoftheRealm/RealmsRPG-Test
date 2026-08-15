/**
 * Skill encounter success / sequence trackers + reset chrome (TASK-608)
 */

'use client';

import { ListOrdered, RotateCcw } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { ValueStepper } from '@/components/shared';
import { SuccessFailureTracker } from './skill-success-failure-tracker';
import type { SkillEncounterState } from '@/types/encounter';

export interface SkillTrackersSectionProps {
  derivedRollSuccesses: number;
  derivedRollFailures: number;
  additionalSuccesses: number;
  additionalFailures: number;
  requiredSuccesses: number;
  maxFailures: number;
  encounterOutcome: 'success' | 'failure' | 'in-progress';
  sequenceSuccesses: number;
  sequenceFailures: number;
  participantCount: number;
  actedCount: number;
  updateSkill: (updates: Partial<SkillEncounterState>) => void;
  onResetEncounter: () => void;
}

export function SkillTrackersSection({
  derivedRollSuccesses,
  derivedRollFailures,
  additionalSuccesses,
  additionalFailures,
  requiredSuccesses,
  maxFailures,
  encounterOutcome,
  sequenceSuccesses,
  sequenceFailures,
  participantCount,
  actedCount,
  updateSkill,
  onResetEncounter,
}: SkillTrackersSectionProps) {
  return (
    <>
      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold text-text-secondary">Successes</h2>
        <SuccessFailureTracker
          rollSuccesses={derivedRollSuccesses}
          rollFailures={derivedRollFailures}
          additionalSuccesses={additionalSuccesses}
          additionalFailures={additionalFailures}
          requiredSuccesses={requiredSuccesses}
          maxFailures={maxFailures}
          outcome={encounterOutcome}
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-2 rounded-lg border border-border-light px-3 py-2">
            <span className="text-sm text-text-secondary">Additional Successes</span>
            <ValueStepper
              value={additionalSuccesses}
              onChange={(v) => updateSkill({ additionalSuccesses: Math.max(0, v) })}
              min={0}
              max={99}
              size="sm"
              enableHoldRepeat
            />
          </div>
          <div className="flex items-center justify-between gap-2 rounded-lg border border-border-light px-3 py-2">
            <span className="text-sm text-text-secondary">Additional Failures</span>
            <ValueStepper
              value={additionalFailures}
              onChange={(v) => updateSkill({ additionalFailures: Math.max(0, v) })}
              min={0}
              max={99}
              size="sm"
              enableHoldRepeat
            />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-secondary">
          <ListOrdered className="h-4 w-4" /> Sequence
        </h2>
        <p className="mb-2 text-xs text-text-muted">
          Track total successes/failures across multiple skill encounters in a sequence.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">Successes:</span>
            <ValueStepper
              value={sequenceSuccesses}
              onChange={(v) => updateSkill({ sequenceSuccesses: Math.max(0, v) })}
              min={0}
              max={99}
              size="sm"
              enableHoldRepeat
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">Failures:</span>
            <ValueStepper
              value={sequenceFailures}
              onChange={(v) => updateSkill({ sequenceFailures: Math.max(0, v) })}
              min={0}
              max={99}
              size="sm"
              enableHoldRepeat
            />
          </div>
        </div>
      </Card>

      <Card className="flex flex-wrap items-center gap-3 p-4">
        <Button
          variant="secondary"
          onClick={onResetEncounter}
          aria-label="Reset skill encounter (clear all rolls and totals)"
        >
          <RotateCcw className="h-4 w-4" /> Reset
        </Button>
        <div className="ml-auto text-sm text-text-muted">
          {participantCount} participant
          {participantCount !== 1 ? 's' : ''}
          {' · '}
          {actedCount} acted
        </div>
      </Card>
    </>
  );
}
