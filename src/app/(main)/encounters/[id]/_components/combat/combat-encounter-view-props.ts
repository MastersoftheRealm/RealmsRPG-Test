/**
 * CombatEncounterView public props (TASK-608)
 */

import type { Encounter } from "@/types/encounter";
import type { Campaign } from "@/types/campaign";

export interface CombatEncounterViewProps {
  encounterId: string;
  encounter: Encounter | null;
  setEncounter: React.Dispatch<React.SetStateAction<Encounter | null>>;
  campaignsFull: Campaign[];
  showRollLog?: boolean;
}
