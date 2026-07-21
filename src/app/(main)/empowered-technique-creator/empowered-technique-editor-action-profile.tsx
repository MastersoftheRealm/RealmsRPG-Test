'use client';

import { SectionCostBadge } from '@/components/shared';
import { CollapsibleSection } from '@/components/creator';
import { Checkbox } from '@/components/ui';
import { ACTION_OPTIONS } from '@/lib/game/creator-constants';
import { ATTACK_MODE_SELECT_OPTIONS, attackModeColumnLabel, type AttackMode } from '@/lib/attack-mode';
import type { EmpoweredTechniqueCreatorEditorProps } from './empowered-technique-editor-config';

export type EmpoweredTechniqueEditorActionProfileProps = Pick<
  EmpoweredTechniqueCreatorEditorProps,
  | 'actionDisplay'
  | 'actionType'
  | 'onActionTypeChange'
  | 'isReaction'
  | 'onIsReactionChange'
  | 'attackMode'
  | 'onAttackModeChange'
  | 'sectionCosts'
>;

export function EmpoweredTechniqueEditorActionProfile({
  actionDisplay,
  actionType,
  onActionTypeChange,
  isReaction,
  onIsReactionChange,
  attackMode,
  onAttackModeChange,
  sectionCosts,
}: EmpoweredTechniqueEditorActionProfileProps) {
  return (
    <CollapsibleSection
      title="Shared Action Profile"
      collapsedSummary={`${actionDisplay} • ${attackModeColumnLabel(attackMode)}`}
      defaultExpanded={true}
      rightSlot={
        <>
          <SectionCostBadge en={sectionCosts.action.energyRaw} tp={sectionCosts.action.totalTP} />
          <SectionCostBadge en={sectionCosts.weapon.energyRaw} tp={sectionCosts.weapon.totalTP} />
        </>
      }
    >
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Action Type</label>
          <select
            value={actionType}
            onChange={(event) => onActionTypeChange(event.target.value)}
            className="w-full px-4 py-2 border border-border-light rounded-lg text-text-primary bg-surface min-h-[44px]"
            aria-label="Empowered technique action type"
          >
            {ACTION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="empowered-attack-mode"
            className="block text-sm font-medium text-text-secondary mb-1"
          >
            Attack
          </label>
          <select
            id="empowered-attack-mode"
            value={attackMode}
            onChange={(event) => onAttackModeChange(event.target.value as AttackMode)}
            className="w-full px-4 py-2 border border-border-light rounded-lg text-text-primary bg-surface min-h-[44px]"
            aria-label="Empowered technique attack mode"
          >
            {ATTACK_MODE_SELECT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4">
        <Checkbox
          checked={isReaction}
          onChange={(event) => onIsReactionChange(event.target.checked)}
          label="Can be used as a Reaction"
        />
      </div>
    </CollapsibleSection>
  );
}
