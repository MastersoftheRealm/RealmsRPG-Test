/**
 * Skill encounter success/failure tracker (TASK-608)
 */

'use client';

import { cn } from '@/lib/utils';

export function SuccessFailureTracker({
  rollSuccesses,
  rollFailures,
  additionalSuccesses,
  additionalFailures,
  requiredSuccesses,
  maxFailures,
  outcome,
}: {
  rollSuccesses: number;
  rollFailures: number;
  additionalSuccesses: number;
  additionalFailures: number;
  requiredSuccesses: number;
  maxFailures: number;
  outcome: 'success' | 'failure' | 'in-progress';
}) {
  const totalSuccesses = rollSuccesses + additionalSuccesses;
  const totalFailures = rollFailures + additionalFailures;
  const net = totalSuccesses - totalFailures;
  const netAbs = Math.abs(net);
  const maxBubbles = Math.max(10, netAbs + 4);

  return (
    <div className="space-y-3">
      <div className="grid gap-2 text-xs sm:grid-cols-3">
        <div className="rounded-lg border border-border-light bg-surface-alt px-3 py-2">
          <div className="text-text-muted">Total Successes</div>
          <div className="text-sm font-semibold text-success-fg">
            {totalSuccesses} / {requiredSuccesses}
          </div>
        </div>
        <div className="rounded-lg border border-border-light bg-surface-alt px-3 py-2">
          <div className="text-text-muted">Total Failures</div>
          <div className="text-sm font-semibold text-danger-fg">
            {totalFailures} / {maxFailures}
          </div>
        </div>
        <div className="rounded-lg border border-border-light bg-surface-alt px-3 py-2">
          <div className="text-text-muted">Status</div>
          <div
            className={cn(
              'text-sm font-semibold',
              outcome === 'success' && 'text-success-fg',
              outcome === 'failure' && 'text-danger-fg',
              outcome === 'in-progress' && 'text-text-primary',
            )}
          >
            {outcome === 'success' ? 'Overcome' : outcome === 'failure' ? 'Failed' : 'In Progress'}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2">
        <div className="min-w-[4rem] rounded-lg bg-surface-alt px-4 py-2 text-center text-sm font-medium text-text-muted">
          {net === 0 ? '0' : net > 0 ? `+${net}` : net}
        </div>
        <div className="flex items-center gap-1">
          {net > 0 &&
            Array.from({ length: Math.min(netAbs, maxBubbles) }).map((_, i) => (
              <div key={`g-${i}`} className="h-4 w-4 rounded-full bg-success-500" title="Success" />
            ))}
          {net < 0 &&
            Array.from({ length: Math.min(netAbs, maxBubbles) }).map((_, i) => (
              <div key={`r-${i}`} className="h-4 w-4 rounded-full bg-danger-500" title="Failure" />
            ))}
          {(net > 0 || net < 0) && (
            <span
              className={cn(
                'ml-1 text-xs font-medium',
                net > 0 ? 'text-success-fg' : 'text-danger-fg',
              )}
            >
              {net > 0 ? `+${net}` : net}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
