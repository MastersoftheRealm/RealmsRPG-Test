/**
 * Encounter Tracker Redirect
 * ============================
 * Redirects old /encounter-tracker to /encounters with optional localStorage import.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer, Button, Alert, useToast } from '@/components/ui';
import { LoadingState } from '@/components/ui';
import { STORAGE_KEY } from './encounter-tracker-constants';
import { useCreateEncounter } from '@/hooks';
import { createDefaultEncounter } from '@/types/encounter';
import type { EncounterState } from './encounter-tracker-types';

export function EncounterTrackerRedirect() {
  const router = useRouter();
  const { showToast } = useToast();
  const createEncounter = useCreateEncounter();
  const [hasLocalData, setHasLocalData] = useState(false);
  const [localEncounter, setLocalEncounter] = useState<EncounterState | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as EncounterState;
        if (parsed.combatants && parsed.combatants.length > 0) {
          setHasLocalData(true);
          setLocalEncounter(parsed);
          return;
        }
      }
    } catch {
      // ignore
    }
    // No local data, redirect immediately
    router.replace('/encounters');
  }, [router]);

  const handleImport = async () => {
    if (!localEncounter) return;
    setImporting(true);
    try {
      const data = createDefaultEncounter('combat', localEncounter.name || 'Imported Encounter');
      data.combatants = localEncounter.combatants.map((c) => ({
        ...c,
        sourceType: 'manual' as const,
      }));
      data.round = localEncounter.round;
      data.currentTurnIndex = localEncounter.currentTurnIndex;
      data.isActive = localEncounter.isActive;
      data.applySurprise = localEncounter.applySurprise;
      data.status = localEncounter.isActive ? 'active' : 'preparing';

      const id = await createEncounter.mutateAsync(data);
      // Clear old localStorage
      localStorage.removeItem(STORAGE_KEY);
      router.replace(`/encounters/${id}/combat`);
    } catch (err) {
      console.error('Failed to import encounter:', err);
      showToast((err as Error)?.message ?? 'Failed to import encounter', 'error');
      router.replace('/encounters');
    }
  };

  const handleSkip = () => {
    router.replace('/encounters');
  };

  if (!hasLocalData) {
    return (
      <PageContainer size="md">
        <LoadingState message="Redirecting to Encounters..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer size="md">
      <div className="max-w-lg mx-auto mt-20">
        <Alert variant="info" title="Encounter Tracker has moved!">
          The Encounter Tracker is now <strong>Encounters</strong> with cloud-saved combat, skill, and mixed encounters.
        </Alert>
        <div className="mt-6 bg-surface rounded-xl border border-border-light p-6">
          <h2 className="font-bold text-text-primary mb-2">Import existing encounter?</h2>
          <p className="text-sm text-text-secondary mb-4">
            You have a saved encounter (&ldquo;{localEncounter?.name}&rdquo; with{' '}
            {localEncounter?.combatants.length} combatants) in your browser. Would you like to
            import it to the cloud?
          </p>
          <div className="flex gap-3">
            <Button onClick={handleImport} disabled={importing}>
              {importing ? 'Importing...' : 'Import & Open'}
            </Button>
            <Button variant="ghost" onClick={handleSkip}>
              Skip
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
