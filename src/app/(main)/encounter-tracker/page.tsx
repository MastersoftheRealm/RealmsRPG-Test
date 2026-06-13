/**
 * Encounter Tracker (legacy route)
 * ================================
 * Redirects to the Encounters hub. Shared modules in this folder remain in use
 * by CombatEncounterView and related components.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer, LoadingState } from '@/components/ui';

export default function EncounterTrackerPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/encounters');
  }, [router]);

  return (
    <PageContainer size="xl">
      <LoadingState message="Redirecting to Encounters..." />
    </PageContainer>
  );
}
