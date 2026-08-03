/**
 * Linked campaign-character HP/EN/AP sync for combat encounters (TASK-666a)
 * ========================================================================
 * Initial refetch, visibility-aware polling, and Supabase Realtime merges.
 */

"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { apiFetchOrNull, logClientError } from "@/lib/api-client";
import type { Encounter, TrackedCombatant } from "@/types/encounter";
import type { CampaignCharacterEncounterData } from "@/types/campaign";
import { createClient } from "@/lib/supabase/client";
import { computeMaxHealthEnergy } from "@/lib/game/calculations";
import { useGameRules } from "@/hooks";
import { readResourcesFromCharacterData } from "@/lib/encounter/character-resource-sync";

type SetEncounter = React.Dispatch<React.SetStateAction<Encounter | null>>;

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
  const refetchedForEncounterIdRef = useRef<string | null>(null);

  const refetchCharacterResources = useCallback(async () => {
    if (!encounter?.campaignId || !encounter.combatants?.length) return;
    const linked = encounter.combatants.filter(
      (c): c is TrackedCombatant =>
        c.sourceType === "campaign-character" &&
        !!c.sourceId &&
        !!c.sourceUserId,
    );
    if (linked.length === 0) return;
    const results = await Promise.all(
      linked.map(async (c) => {
        try {
          const data = await apiFetchOrNull<CampaignCharacterEncounterData>(
            `/api/campaigns/${encounter!.campaignId}/characters/${c.sourceUserId}/${c.sourceId}?scope=encounter`,
          );
          if (!data) return null;
          return { combatantId: c.id, data };
        } catch (err) {
          logClientError(
            `combat-encounter: linked character sync failed (${c.sourceUserId}/${c.sourceId})`,
            err,
          );
          return null;
        }
      }),
    );
    setEncounter((prev) => {
      if (!prev) return prev;
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
        changed = true;
        return {
          ...c,
          ...(currentHp !== undefined && { currentHealth: currentHp }),
          ...(maxHp !== undefined && { maxHealth: maxHp }),
          ...(currentEn !== undefined && { currentEnergy: currentEn }),
          ...(maxEn !== undefined && { maxEnergy: maxEn }),
          ...(ap !== undefined && { ap }),
        };
      });
      if (!changed) return prev;
      return { ...prev, combatants: nextCombatants };
    });
  }, [encounter, setEncounter]);

  useEffect(() => {
    if (!encounter?.campaignId || !encounter?.id) return;
    const hasLinked = encounter.combatants?.some(
      (c) =>
        (c as TrackedCombatant).sourceType === "campaign-character" &&
        (c as TrackedCombatant).sourceId,
    );
    if (!hasLinked) return;
    if (refetchedForEncounterIdRef.current === encounter.id) return;
    refetchedForEncounterIdRef.current = encounter.id;
    refetchCharacterResources();
  }, [
    encounter?.id,
    encounter?.campaignId,
    encounter?.combatants,
    refetchCharacterResources,
  ]);

  const hasLinkedCombatants = encounter?.combatants?.some(
    (c) =>
      (c as TrackedCombatant).sourceType === "campaign-character" &&
      (c as TrackedCombatant).sourceId,
  );

  // Poll linked character HP/energy every 90s only when tab is visible. When tab is hidden
  // (inactive or minimized), pause polling; when tab becomes visible again, refetch once then resume.
  useEffect(() => {
    if (!hasLinkedCombatants || !refetchCharacterResources) return;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const startPolling = () => {
      if (intervalId) return;
      intervalId = setInterval(refetchCharacterResources, 90_000);
    };
    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refetchCharacterResources();
        startPolling();
      } else {
        stopPolling();
      }
    };
    if (document.visibilityState === "visible") startPolling();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      stopPolling();
    };
  }, [hasLinkedCombatants, refetchCharacterResources]);

  // Value-stable key: the combatants array is replaced on every HP/AP/condition edit, but the
  // realtime subscription should only restart when the set of linked character ids changes.
  const characterIdsKeyForSync = useMemo(() => {
    return encounter.combatants
      .filter(
        (c): c is TrackedCombatant =>
          c.sourceType === "campaign-character" && !!c.sourceId,
      )
      .map((c) => c.sourceId as string)
      .filter((id, i, arr) => arr.indexOf(id) === i)
      .join(",");
  }, [encounter.combatants]);

  useEffect(() => {
    if (!characterIdsKeyForSync) return;
    const supabase = createClient();
    const filter = `id=in.(${characterIdsKeyForSync})`;
    const channel = supabase
      .channel(`encounter-characters:${encounterId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "characters",
          filter,
        },
        (payload: { new: { id: string; data?: unknown } }) => {
          const row = payload.new;
          const charId = row.id;
          const raw = row.data;
          const data = (
            typeof raw === "object" && raw !== null ? raw : {}
          ) as Record<string, unknown>;
          const resources = readResourcesFromCharacterData(data);
          const { maxHealth: computedMaxHp, maxEnergy: computedMaxEn } =
            computeMaxHealthEnergy(data, rules);
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
