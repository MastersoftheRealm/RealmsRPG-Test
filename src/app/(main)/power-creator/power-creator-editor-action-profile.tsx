/**
 * Power Creator — action + attack sections (TASK-616)
 */

'use client';

import { SectionCostBadge } from '@/components/shared';
import { CollapsibleSection } from '@/components/creator';
import { Checkbox } from '@/components/ui';
import { ACTION_OPTIONS } from '@/lib/game/creator-constants';
import { ATTACK_MODE_SELECT_OPTIONS, attackModeColumnLabel, type AttackMode } from '@/lib/attack-mode';
import type { PowerSectionCosts } from './power-creator-cost-derivation';

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
        defaultExpanded={true}
        rightSlot={<SectionCostBadge en={sectionCosts.action.energyRaw} tp={sectionCosts.action.totalTP} />}
      >
        <div className="flex flex-wrap gap-4">
          <select
            aria-label="Action type"
            value={actionType}
            onChange={(e) => onActionTypeChange(e.target.value)}
            className="px-4 py-2 border border-border-light rounded-lg text-text-primary bg-surface"
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <Checkbox
            checked={isReaction}
            onChange={(e) => onIsReactionChange(e.target.checked)}
            label="Reaction"
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Attack"
        collapsedSummary={attackModeColumnLabel(attackMode)}
        defaultExpanded={true}
        rightSlot={<SectionCostBadge en={sectionCosts.weapon.energyRaw} tp={sectionCosts.weapon.totalTP} />}
      >
        <div>
          <label htmlFor="power-attack-mode" className="block text-sm font-medium text-text-secondary mb-1">
            Attack
          </label>
          <select
            id="power-attack-mode"
            value={attackMode}
            onChange={(e) => onAttackModeChange(e.target.value as AttackMode)}
            className="w-full px-4 py-2 border border-border-light rounded-lg text-text-primary bg-surface min-h-[44px]"
            aria-label="Power attack mode"
          >
            {ATTACK_MODE_SELECT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-2 text-sm text-text-secondary">
          Weapon Attack adds the Add Weapon to Power mechanic (flat cost). No Weapon/Attack and Unarmed Attack add
          nothing.
        </p>
      </CollapsibleSection>
    </>
  );
}
