/**
 * Linked campaign-character HP/EN/AP sync for combat encounters (TASK-666a / TASK-762)
 * ========================================================================
 * React Query observers for `?scope=encounter`, visibility-aware polling, and
 * Supabase Realtime merges.
 */

'use client';

import { useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { campaignKeys, useCampaignCharacterEncounters, useGameRules } from '@/hooks';
import type { Encounter, TrackedCombatant } from '@/types/encounter';
import type { CampaignCharacterEncounterData } from '@/types/campaign';
import { createClient } from '@/lib/supabase/client';
import { computeMaxHealthEnergy } from '@/lib/game/calculations';
import { readResourcesFromCharacterData } from '@/lib/encounter/character-resource-sync';

type SetEncounter = React.Dispatch<React.SetStateAction<Encounter | null>>;

function applyLinkedEncounterResources(
  prev: Encounter,
  results: Array<{
    combatantId: string;
    data: CampaignCharacterEncounterData;
  } | null>,
): Encounter {
  let changed = false;
  const nextCombatants = prev.combatants.map((c) => {
    const result = results.find((r) => r && r.combatantId === c.id);
    if (!result?.data) return c;
    const d = result.data as Record<string, unknown>;
    const resources = readResourcesFromCharacterData(d);
    const currentHp = resources.currentHealth;
    const currentEn = resources.currentEnergy;
    const maxHp = resources.healthMax;
    const maxEn = resources.energyMax;
    const ap = resources.actionPoints;
    if (
      currentHp === undefined &&
      currentEn === undefined &&
      maxHp === undefined &&
      maxEn === undefined &&
      ap === undefined
    ) {
      return c;
    }
    const next = {
      ...c,
      ...(currentHp !== undefined && { currentHealth: currentHp }),
      ...(maxHp !== undefined && { maxHealth: maxHp }),
      ...(currentEn !== undefined && { currentEnergy: currentEn }),
      ...(maxEn !== undefined && { maxEnergy: maxEn }),
      ...(ap !== undefined && { ap }),
    };
    if (
      next.currentHealth === c.currentHealth &&
      next.maxHealth === c.maxHealth &&
      next.currentEnergy === c.currentEnergy &&
      next.maxEnergy === c.maxEnergy &&
      next.ap === c.ap
    ) {
      return c;
    }
    changed = true;
    return next;
  });
  if (!changed) return prev;
  return { ...prev, combatants: nextCombatants };
}

export function useCombatLinkedCharacterSync({
  encounterId,
  encounter,
  setEncounter,
}: {
  encounterId: string;
  encounter: Encounter;
  setEncounter: SetEncounter;
}) {
  const { rules } = useGameRules();
  const queryClient = useQueryClient();

  const linked = useMemo(
    () =>
      encounter.combatants.filter(
        (c): c is TrackedCombatant =>
          c.sourceType === 'campaign-character' && !!c.sourceId && !!c.sourceUserId,
      ),
    [encounter.combatants],
  );

  const targets = useMemo(
    () =>
      linked.map((c) => ({
        ownerId: c.sourceUserId as string,
        characterId: c.sourceId as string,
      })),
    [linked],
  );

  const queries = useCampaignCharacterEncounters(encounter.campaignId, targets);

  const resourceSyncStamp = JSON.stringify(
    linked.map((c, i) => ({
      combatantId: c.id,
      data: queries[i]?.data ?? null,
    })),
  );

  useEffect(() => {
    const snapshots = JSON.parse(resourceSyncStamp) as Array<{
      combatantId: string;
      data: CampaignCharacterEncounterData | null;
    }>;
    if (snapshots.length === 0) return;
    const results = snapshots.map((s) =>
      s.data ? { combatantId: s.combatantId, data: s.data } : null,
    );
    setEncounter((prev) => {
      if (!prev) return prev;
      return applyLinkedEncounterResources(prev, results);
    });
  }, [resourceSyncStamp, setEncounter]);

  const hasLinkedCombatants = linked.length > 0;
  const campaignId = encounter.campaignId;

  // Poll linked character HP/energy every 90s only when tab is visible. When tab is hidden
  // (inactive or minimized), pause polling; when tab becomes visible again, refetch once then resume.
  useEffect(() => {
    if (!hasLinkedCombatants || !campaignId) return;
    const key = campaignKeys.characterEncounters(campaignId);
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const refetchLinked = () => {
      void queryClient.refetchQueries({ queryKey: key, type: 'active' });
    };
    const startPolling = () => {
      if (intervalId) return;
      intervalId = setInterval(refetchLinked, 90_000);
    };
    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refetchLinked();
        startPolling();
      } else {
        stopPolling();
      }
    };
    if (document.visibilityState === 'visible') startPolling();
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      stopPolling();
    };
  }, [hasLinkedCombatants, campaignId, queryClient]);

  // Value-stable key: the combatants array is replaced on every HP/AP/condition edit, but the
  // realtime subscription should only restart when the set of linked character ids changes.
  const characterIdsKeyForSync = useMemo(() => {
    return encounter.combatants
      .filter((c): c is TrackedCombatant => c.sourceType === 'campaign-character' && !!c.sourceId)
      .map((c) => c.sourceId as string)
      .filter((id, i, arr) => arr.indexOf(id) === i)
      .join(',');
  }, [encounter.combatants]);

  useEffect(() => {
    if (!characterIdsKeyForSync) return;
    const supabase = createClient();
    const filter = `id=in.(${characterIdsKeyForSync})`;
    const channel = supabase
      .channel(`encounter-characters:${encounterId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'characters',
          filter,
        },
        (payload: { new: { id: string; data?: unknown } }) => {
          const row = payload.new;
          const charId = row.id;
          const raw = row.data;
          const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<
            string,
            unknown
          >;
          const resources = readResourcesFromCharacterData(data);
          const { maxHealth: computedMaxHp, maxEnergy: computedMaxEn } = computeMaxHealthEnergy(
            data,
            rules,
          );
          const currentHp = resources.currentHealth;
          const currentEn = resources.currentEnergy;
          const ap = resources.actionPoints;
          setEncounter((prev) => {
            if (!prev) return prev;
            const hasMatch = prev.combatants.some(
              (c) => (c as TrackedCombatant).sourceId === charId,
            );
            if (!hasMatch) return prev;
            return {
              ...prev,
              combatants: prev.combatants.map((c) => {
                if ((c as TrackedCombatant).sourceId !== charId) return c;
                const updates: Partial<TrackedCombatant> = { ...c };
                if (currentHp !== undefined) updates.currentHealth = currentHp;
                updates.maxHealth = resources.healthMax ?? computedMaxHp;
                if (currentEn !== undefined) updates.currentEnergy = currentEn;
                updates.maxEnergy = resources.energyMax ?? computedMaxEn;
                if (ap !== undefined) updates.ap = ap;
                return { ...c, ...updates };
              }),
            };
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [encounterId, characterIdsKeyForSync, setEncounter, rules]);
}
