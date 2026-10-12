import {
  isPowerInnateEligible,
  snapshotOfficialPowerForInnate,
  type InnatePowerSnapshot,
} from '@/lib/game/innate-eligibility';
import type { PowerDocument } from '@/lib/calculators';
import type { PowerPart } from '@/hooks';

/** Summary row label for innate qualification in the power creator (86e3jzc58). */
export function innatePowerCreatorSummaryLabel(
  snapshot: InnatePowerSnapshot,
  innateThreshold?: number | null,
): string {
  if (innateThreshold != null && innateThreshold > 0) {
    return isPowerInnateEligible(snapshot, innateThreshold)
      ? 'Qualifies as innate'
      : 'Does not qualify as innate';
  }
  if (!isPowerInnateEligible(snapshot, null)) {
    return 'Does not qualify as innate';
  }
  return 'May qualify as innate';
}

export function innatePowerCreatorSummaryHelpLabel(heading: string): string {
  return `${heading} help`;
}

export function snapshotPowerCreatorForInnate(
  powerData: PowerDocument,
  powerParts: PowerPart[],
): InnatePowerSnapshot {
  return snapshotOfficialPowerForInnate({ id: 'draft', ...powerData }, powerParts);
}
