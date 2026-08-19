/**
 * SkillEncounterView public props (TASK-608)
 */

import type { Encounter } from '@/types/encounter';
import type { Campaign } from '@/types/campaign';

export interface SkillEncounterViewProps {
  encounterId: string;
  encounter: Encounter | null;
  setEncounter: React.Dispatch<React.SetStateAction<Encounter | null>>;
  campaignsFull: Campaign[];
  showRollLog?: boolean | undefined;
  /** When true (mixed encounter), initiative defaults on and "Sync with combat order" is shown */
  isMixedEncounter?: boolean | undefined;
}
