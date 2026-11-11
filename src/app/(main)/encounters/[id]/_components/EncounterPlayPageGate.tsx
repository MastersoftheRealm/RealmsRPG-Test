'use client';

import Link from 'next/link';
import { PageContainer, LoadingState, Alert, PAGE_FILLS_VIEWPORT_CLASSNAME } from '@/components/ui';
import type { Encounter } from '@/types/encounter';

export type EncounterPlayPageGatePhase = 'loading' | 'error' | 'initializing';

export interface EncounterPlayPageGateProps {
  phase: EncounterPlayPageGatePhase;
  fillsViewport?: boolean;
  isSkillEncounter?: boolean;
}

export function encounterPlayPageGatePhase({
  isLoading,
  error,
  encounterData,
  encounter,
  requireSkillEncounter,
}: {
  isLoading: boolean;
  error: unknown;
  encounterData: Encounter | null | undefined;
  encounter: Encounter | null;
  requireSkillEncounter?: boolean;
}): 'ready' | EncounterPlayPageGatePhase {
  if (isLoading) return 'loading';
  if (error || (!isLoading && !encounterData)) return 'error';
  if (!encounter) return 'initializing';
  if (requireSkillEncounter && !encounter.skillEncounter) return 'initializing';
  return 'ready';
}

export function EncounterPlayPageGate({
  phase,
  fillsViewport = false,
}: EncounterPlayPageGateProps) {
  const className = fillsViewport ? PAGE_FILLS_VIEWPORT_CLASSNAME : undefined;

  if (phase === 'loading') {
    return (
      <PageContainer size="full" className={className}>
        <LoadingState
          message="Loading encounter..."
          size="lg"
          padding={fillsViewport ? 'lg' : undefined}
        />
      </PageContainer>
    );
  }

  if (phase === 'error') {
    return (
      <PageContainer size="full" className={className}>
        <Alert variant="danger" title="Encounter not found">
          This encounter may have been deleted or you may not have access.
        </Alert>
        <Link href="/encounters" className="mt-4 inline-block text-primary-link-fg hover:underline">
          Back to Encounters
        </Link>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="full" className={className}>
      <LoadingState message="Initializing..." />
    </PageContainer>
  );
}
