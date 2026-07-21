/**
 * Crafting Rolls section (TASK-607)
 */

'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui';
import { CollapsibleSection } from '@/components/creator';
import type {
  CraftingSession as CraftingSessionType,
  CraftingRollSession,
} from '@/types/crafting';
import type { RequirementsBreakdown } from './crafting-tool-helpers';

type CraftSubSkill = { id: string; name: string };

type Props = {
  id: string;
  isCompleted: boolean;
  sessions: CraftingRollSession[];
  session: CraftingSessionType;
  effectiveDS: number;
  netDelta: number;
  totalEnhSuccesses: number;
  totalEnhFailures: number;
  isEnhanced: boolean;
  requirementsBreakdown: RequirementsBreakdown | null;
  craftSubSkills: CraftSubSkill[];
  updateData: (updates: Partial<CraftingSessionType['data']>) => void;
  updateSessionRoll: (index: number, roll: number | null) => void;
};

export function CraftingRollsSection({
  id,
  isCompleted,
  sessions,
  session,
  effectiveDS,
  netDelta,
  totalEnhSuccesses,
  totalEnhFailures,
  isEnhanced,
  requirementsBreakdown,
  craftSubSkills,
  updateData,
  updateSessionRoll,
}: Props) {
  if (isCompleted || sessions.length === 0) return null;
  return (
    <CollapsibleSection
      title="Crafting Rolls"
      defaultExpanded
      collapsedSummary={`Net ${netDelta >= 0 ? `+${netDelta}` : netDelta}, enhancement ${totalEnhSuccesses} S / ${totalEnhFailures} F`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-sm text-text-muted dark:text-text-secondary">
          Enter each roll total (d20 + Bonuses). Results auto-calculate against Difficulty Score{' '}
          {effectiveDS}.
        </p>
        {craftSubSkills.length > 0 && (
          <div className="flex items-center gap-2">
            <label
              htmlFor="craft-subskill"
              className="block text-xs font-medium text-text-secondary"
            >
              Skill used
            </label>
            <select
              id="craft-subskill"
              value={session.data.item?.subSkillId ?? ''}
              onChange={(e) => {
                if (!session.data.item) return;
                updateData({
                  item: { ...session.data.item, subSkillId: e.target.value || null },
                });
              }}
              className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-text-primary min-h-[36px] max-w-xs"
              aria-label="Craft skill used for this project"
            >
              <option value="">None</option>
              {craftSubSkills.map((s: { id: string; name: string }) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="space-y-3">
        {sessions.map((s, i) => {
          const hasRoll = s.roll != null;
          const isSuccess = hasRoll && s.successes > 0;
          const isFailure = hasRoll && s.failures > 0;
          let dsForSession = effectiveDS;
          if (
            isEnhanced &&
            session.data.craftBaseItemAlso &&
            requirementsBreakdown
          ) {
            const baseCount = requirementsBreakdown.baseItemReq.requiredSuccesses;
            const baseDs = requirementsBreakdown.baseItemReq.difficultyScore;
            const enhDs = requirementsBreakdown.enhancementReq.difficultyScore;
            const baseOrEnhDs = i < baseCount ? baseDs : enhDs;
            dsForSession = baseOrEnhDs + (session.data.dsModifier ?? 0);
          }
          return (
            <div
              key={s.label}
              className={cn(
                'flex flex-wrap items-center gap-4 p-3 sm:p-4 rounded-xl border transition-colors',
                hasRoll &&
                  isSuccess &&
                  'bg-success-light/50 border-l-4 border-l-success-500 border-border-light',
                hasRoll &&
                  isFailure &&
                  'bg-danger-light/50 border-l-4 border-l-danger-500 border-border-light',
                !hasRoll && 'border-border-light'
              )}
            >
              <span className="font-medium text-text-primary w-28 shrink-0">
                {s.label}
              </span>
              <span className="text-xs text-text-muted dark:text-text-secondary w-20">
                DS {dsForSession}
              </span>
              <div className="flex items-center gap-2">
                <label className="sr-only" htmlFor={`roll-${id}-${i}`}>
                  Roll for {s.label}
                </label>
                <Input
                  id={`roll-${id}-${i}`}
                  type="number"
                  min={1}
                  max={100}
                  value={s.roll ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    updateSessionRoll(i, v === '' ? null : parseInt(v, 10));
                  }}
                  placeholder="Roll"
                  className="w-20 min-h-[44px]"
                />
              </div>
              {hasRoll && (
                <span className="text-sm flex items-center gap-1">
                  {isSuccess && (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-success-fg" />
                      <span className="text-success-fg font-medium">
                        {s.successes} success{s.successes !== 1 ? 'es' : ''}
                      </span>
                    </>
                  )}
                  {isFailure && (
                    <>
                      <XCircle className="w-4 h-4 text-danger-fg" />
                      <span className="text-danger-fg font-medium">
                        {s.failures} failure{s.failures !== 1 ? 's' : ''}
                      </span>
                    </>
                  )}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </CollapsibleSection>
  );
}
