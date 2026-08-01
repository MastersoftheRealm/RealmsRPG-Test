/**
 * Pure predicates for custom-chooser deep entry landing (tested without React).
 */

import { prefersDeepCatalogEntry } from '@/lib/guided-creator/creator-entry-mode';
import {
  landsOnFirstInnerScreen,
  type GuidedNavigationIntent,
} from '@/lib/guided-creator/guided-substep-nav';
import type { GuidedDraft } from '@/stores/guided-creator-store';

export function shouldApplyGuidedDeepEntryOnArrival(args: {
  draft: Pick<GuidedDraft, 'creatorEntryMode' | 'archetypePathId'>;
  navigationIntent: GuidedNavigationIntent;
  entryNonce: number;
  lastAppliedEntryNonce: number | null;
  enabled?: boolean;
}): boolean {
  if (args.enabled === false) return false;
  if (!prefersDeepCatalogEntry(args.draft)) return false;
  if (!landsOnFirstInnerScreen(args.navigationIntent)) return false;
  return args.lastAppliedEntryNonce !== args.entryNonce;
}
