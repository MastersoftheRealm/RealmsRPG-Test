/**
 * Power Creator — InfoTippy wrappers (TASK-408)
 */

'use client';

import { InfoTippy, type InfoTippyTone } from '@/components/shared';
import {
  powerCreatorActionTypeHelp,
  powerCreatorAreaHelp,
  powerCreatorAttackHelp,
  powerCreatorDamageHelp,
  powerCreatorDescriptionHelp,
  powerCreatorDurationHelp,
  powerCreatorEnergyHelp,
  powerCreatorInnateHelp,
  powerCreatorLoadHelp,
  powerCreatorMechanicsHelp,
  powerCreatorPartsHelp,
  powerCreatorReactionHelp,
  powerCreatorResetHelp,
  powerCreatorTrainingPointsHelp,
} from '../../../../public/tooltip-text';

const POWER_CREATOR_TIPS = {
  description: { content: powerCreatorDescriptionHelp, label: 'Description help' },
  actionType: { content: powerCreatorActionTypeHelp, label: 'Action Type help' },
  reaction: { content: powerCreatorReactionHelp, label: 'Reaction help' },
  attack: { content: powerCreatorAttackHelp, label: 'Attack help' },
  area: { content: powerCreatorAreaHelp, label: 'Area of Effect help' },
  duration: { content: powerCreatorDurationHelp, label: 'Duration help' },
  parts: { content: powerCreatorPartsHelp, label: 'Power Parts help' },
  mechanics: { content: powerCreatorMechanicsHelp, label: 'Power Mechanics help' },
  damage: { content: powerCreatorDamageHelp, label: 'Damage help' },
  energy: { content: powerCreatorEnergyHelp, label: 'Energy Cost help' },
  innate: { content: powerCreatorInnateHelp, label: 'Innate Power help' },
  tp: { content: powerCreatorTrainingPointsHelp, label: 'Training Points help' },
  load: { content: powerCreatorLoadHelp, label: 'Load help' },
  reset: { content: powerCreatorResetHelp, label: 'Reset help' },
} as const;

export type PowerCreatorHelpTopic = keyof typeof POWER_CREATOR_TIPS;

export function PowerCreatorHelp({
  topic,
  tone,
}: {
  topic: PowerCreatorHelpTopic;
  tone?: InfoTippyTone;
}) {
  const tip = POWER_CREATOR_TIPS[topic];
  return <InfoTippy content={tip.content} label={tip.label} tone={tone} />;
}
