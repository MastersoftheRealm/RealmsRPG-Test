/**
 * useCampaignRolls Hook
 * =====================
 * Real-time subscription to campaign roll log via Firestore onSnapshot.
 */

'use client';

import { useState, useEffect } from 'react';
import { subscribeToCampaignRolls } from '@/services/campaign-roll-service';
import type { CampaignRollEntry } from '@/types/campaign-roll';

export function useCampaignRolls(campaignId: string | undefined) {
  const [rolls, setRolls] = useState<CampaignRollEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!campaignId) {
      setRolls([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToCampaignRolls(campaignId, (newRolls) => {
      setRolls(newRolls);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [campaignId]);

  return { rolls, loading };
}
