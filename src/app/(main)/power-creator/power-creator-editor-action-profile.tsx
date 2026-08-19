/**
 * Power Creator — action + attack sections (TASK-616)
 */

'use client';

import { SectionCostBadge } from '@/components/patterns';
import { CollapsibleSection } from '@/components/creator';
import { Checkbox } from '@/components/ui';
import { ACTION_OPTIONS } from '@/lib/game/creator-constants';
import {
  ATTACK_MODE_SELECT_OPTIONS,
  attackModeColumnLabel,
  type AttackMode,
} from '@/lib/attack-mode';
import type { PowerSectionCosts } from './power-creator-cost-derivation';
import { PowerCreatorHelp } from './power-creator-help';

type PowerCreatorEditorActionProfileProps = {
  actionType: string;
  onActionTypeChange: (value: string) => void;
  isReaction: boolean;
  onIsReactionChange: (value: boolean) => void;
  actionTypeDisplay: string;
  attackMode: AttackMode;
  onAttackModeChange: (mode: AttackMode) => void;
  sectionCosts: PowerSectionCosts;
};

export function PowerCreatorEditorActionProfile({
  actionType,
  onActionTypeChange,
  isReaction,
  onIsReactionChange,
  actionTypeDisplay,
  attackMode,
  onAttackModeChange,
  sectionCosts,
}: PowerCreatorEditorActionProfileProps) {
  return (
    <>
      <CollapsibleSection
        title="Action Type"
        collapsedSummary={actionTypeDisplay}
        titleAddon={<PowerCreatorHelp topic="actionType" />}
        rightSlot={
          <SectionCostBadge en={sectionCosts.action.energyRaw} tp={sectionCosts.action.totalTP} />
        }
      >
        <div className="flex flex-wrap items-center gap-4">
          <select
            aria-label="Action type"
            value={actionType}
            onChange={(e) => onActionTypeChange(e.target.value)}
            className="rounded-lg border border-border-light bg-surface px-4 py-2 text-text-primary"
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1.5">
            <Checkbox
              checked={isReaction}
              onChange={(e) => onIsReactionChange(e.target.checked)}
              label="Reaction"
            />
            <PowerCreatorHelp topic="reaction" />
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Attack"
        collapsedSummary={attackModeColumnLabel(attackMode)}
        titleAddon={<PowerCreatorHelp topic="attack" />}
        rightSlot={
          <SectionCostBadge en={sectionCosts.weapon.energyRaw} tp={sectionCosts.weapon.totalTP} />
        }
      >
        <select
          value={attackMode}
          onChange={(e) => onAttackModeChange(e.target.value as AttackMode)}
          className="min-h-[44px] w-full rounded-lg border border-border-light bg-surface px-4 py-2 text-text-primary"
          aria-label="Attack"
        >
          {ATTACK_MODE_SELECT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="mt-2 text-sm text-text-secondary">
          Weapon Attack adds the Add Weapon to Power mechanic (flat cost). No Weapon/Attack and
          Unarmed Attack add nothing.
        </p>
      </CollapsibleSection>
    </>
  );
}
