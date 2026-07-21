/**
 * Combat encounter view state + handlers (TASK-608)
 * =================================================
 * Co-located hook for CombatEncounterView — presentation lives in sibling panels.
 */

"use client";

import {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  DragEvent,
} from "react";
import { apiFetchOrNull } from "@/lib/api-client";
import type {
  Combatant,
  CombatantCondition,
  CombatantType,
  TrackedCombatant,
} from "@/types/encounter";
import type { Encounter } from "@/types/encounter";
import { CONDITION_OPTIONS } from "@/components/encounters/encounter-constants";
import { useAuth } from "@/hooks";
import { createClient } from "@/lib/supabase/client";
import { computeMaxHealthEnergy } from "@/lib/game/calculations";
import { useGameRules } from "@/hooks";
import {
  isOwnedLinkedCombatant,
  readResourcesFromCharacterData,
  scheduleCharacterResourceSyncFromCombatant,
} from "@/lib/encounter/character-resource-sync";
import type {
  Campaign,
  CampaignCharacterEncounterData,
} from "@/types/campaign";
import type { CombatEncounterViewProps } from "./combat-encounter-view-props";
import { generateId, rollInitiative } from "../encounter-view-helpers";
import {
  sortCombatantsForTurnOrder,
  remapTurnIndexAfterReorder,
  orderCombatantsByInitiative,
  createEmptyNewCombatantForm,
} from "./combat-encounter-helpers";

export function useCombatEncounterView({
  encounterId,
  encounter,
  setEncounter,
  campaignsFull,
  showRollLog = true,
}: CombatEncounterViewProps & { encounter: Encounter }) {
  const { user } = useAuth();
  const { rules } = useGameRules();
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingAllChars, setAddingAllChars] = useState(false);
  const [newCombatant, setNewCombatant] = useState(() =>
    createEmptyNewCombatantForm(),
  );
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
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
        } catch {
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
  // Poll linked character HP/energy every 90s only when tab is visible. When tab is hidden (inactive or minimized),
  // pause polling to avoid unnecessary API calls; when tab becomes visible again, refetch once then resume interval.
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

  const handleDragStart = useCallback(
    (e: DragEvent<HTMLDivElement>, id: string) => {
      setDraggedId(id);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", id);
    },
    [],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverId(null);
  }, []);

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>, id: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (id !== draggedId) setDragOverId(id);
    },
    [draggedId],
  );

  const handleDragLeave = useCallback(() => setDragOverId(null), []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>, targetId: string) => {
      e.preventDefault();
      if (!draggedId || draggedId === targetId) {
        setDraggedId(null);
        setDragOverId(null);
        return;
      }
      setEncounter((prev) => {
        if (!prev) return prev;
        const oldSorted = sortCombatantsForTurnOrder(
          prev.combatants,
          prev.round,
        );
        const combatants = [...prev.combatants];
        const draggedIndex = combatants.findIndex((c) => c.id === draggedId);
        const targetIndex = combatants.findIndex((c) => c.id === targetId);
        if (draggedIndex === -1 || targetIndex === -1) return prev;
        const [draggedItem] = combatants.splice(draggedIndex, 1);
        combatants.splice(targetIndex, 0, draggedItem);
        const newSorted = sortCombatantsForTurnOrder(combatants, prev.round);
        const newTurnIndex = remapTurnIndexAfterReorder(
          prev.currentTurnIndex,
          oldSorted,
          newSorted,
        );
        return { ...prev, combatants, currentTurnIndex: newTurnIndex };
      });
      setDraggedId(null);
      setDragOverId(null);
    },
    [draggedId, setEncounter],
  );

  const sortedCombatants = useMemo(() => {
    if (!encounter) return [];
    return sortCombatantsForTurnOrder(encounter.combatants, encounter.round);
  }, [encounter]);

  const addCombatant = () => {
    if (!newCombatant.name.trim()) return;
    const quantity = Math.max(1, Math.min(26, newCombatant.quantity || 1));
    const newCombatants: TrackedCombatant[] = [];
    for (let i = 0; i < quantity; i++) {
      const suffix = quantity > 1 ? ` ${String.fromCharCode(65 + i)}` : "";
      newCombatants.push({
        id: generateId(),
        name: newCombatant.name + suffix,
        initiative: newCombatant.initiative,
        acuity: newCombatant.acuity,
        maxHealth: newCombatant.maxHealth,
        maxEnergy: newCombatant.maxEnergy,
        armor: newCombatant.armor,
        evasion: newCombatant.evasion,
        currentHealth: newCombatant.maxHealth,
        currentEnergy: newCombatant.maxEnergy,
        ap: 4,
        conditions: [],
        notes: "",
        combatantType: newCombatant.combatantType,
        isAlly:
          newCombatant.combatantType === "ally" ||
          newCombatant.combatantType === "companion",
        isSurprised: newCombatant.isSurprised,
        sourceType: "manual",
      });
    }
    setEncounter((prev) =>
      prev
        ? { ...prev, combatants: [...prev.combatants, ...newCombatants] }
        : prev,
    );
    setNewCombatant(createEmptyNewCombatantForm());
  };

  const addCombatantsFromModal = (combatants: TrackedCombatant[]) => {
    setEncounter((prev) =>
      prev
        ? { ...prev, combatants: [...prev.combatants, ...combatants] }
        : prev,
    );
    setShowAddModal(false);
  };

  const linkedCampaign = encounter?.campaignId
    ? campaignsFull.find((c: Campaign) => c.id === encounter.campaignId)
    : undefined;

  const addAllCampaignCharacters = useCallback(async () => {
    if (!encounter?.campaignId || !linkedCampaign?.characters?.length) return;
    setAddingAllChars(true);
    try {
      const results = await Promise.all(
        linkedCampaign.characters.map(
          async (c: {
            userId: string;
            characterId: string;
            characterName: string;
          }) => {
            try {
              const data = await apiFetchOrNull<CampaignCharacterEncounterData>(
                `/api/campaigns/${encounter.campaignId}/characters/${c.userId}/${c.characterId}?scope=encounter`,
              );
              if (!data) return null;
              return { charMeta: c, data };
            } catch {
              return null;
            }
          },
        ),
      );
      const combatants: TrackedCombatant[] = results
        .filter((r): r is NonNullable<typeof r> => r !== null)
        .map((r) => {
          const d = r.data;
          const abilities = d.abilities || {};
          const acuity = abilities.acuity ?? 0;
          return {
            id: generateId(),
            name: r.charMeta.characterName,
            initiative: rollInitiative(acuity),
            acuity,
            maxHealth: d.health?.max ?? 20,
            currentHealth:
              ((d as Record<string, unknown>).currentHealth as number) ??
              d.health?.current ??
              d.health?.max ??
              20,
            maxEnergy: d.energy?.max ?? 10,
            currentEnergy:
              ((d as Record<string, unknown>).currentEnergy as number) ??
              d.energy?.current ??
              d.energy?.max ??
              10,
            armor: 0,
            evasion: d.evasion ?? 10 + (abilities.agility ?? 0),
            ap: ((d as Record<string, unknown>).actionPoints as number) ?? 4,
            conditions: [],
            notes: "",
            combatantType: "ally" as CombatantType,
            isAlly: true,
            isSurprised: false,
            sourceType: "campaign-character" as const,
            sourceId: r.charMeta.characterId,
            sourceUserId: r.charMeta.userId,
          };
        });
      setEncounter((prev) =>
        prev
          ? { ...prev, combatants: [...prev.combatants, ...combatants] }
          : prev,
      );
    } catch {
    } finally {
      setAddingAllChars(false);
    }
  }, [encounter, linkedCampaign, setEncounter]);

  const duplicateCombatant = (combatant: Combatant) => {
    const baseNameMatch = combatant.name.match(/^(.+?)\s*[A-Z]?$/);
    const baseName = baseNameMatch ? baseNameMatch[1].trim() : combatant.name;
    const existing = encounter?.combatants || [];
    const usedSuffixes = existing
      .map((c) => c.name)
      .filter((n) => n.startsWith(baseName))
      .map((n) => {
        const m = n.match(
          new RegExp(
            `^${baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*([A-Z])?$`,
          ),
        );
        return m ? m[1] || "" : "";
      })
      .filter(Boolean);
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let suffix = "";
    for (const letter of alphabet) {
      if (!usedSuffixes.includes(letter)) {
        suffix = ` ${letter}`;
        break;
      }
    }
    const duplicate: TrackedCombatant = {
      ...combatant,
      id: generateId(),
      name: baseName + suffix,
      currentHealth: combatant.maxHealth,
      currentEnergy: combatant.maxEnergy,
      conditions: [],
    };
    setEncounter((prev) =>
      prev ? { ...prev, combatants: [...prev.combatants, duplicate] } : prev,
    );
  };

  const removeCombatant = (id: string) => {
    setEncounter((prev) => {
      if (!prev) return prev;
      const combatants = prev.combatants.filter((c) => c.id !== id);
      const oldSorted = sortCombatantsForTurnOrder(prev.combatants, prev.round);
      const removedIndex = oldSorted.findIndex((c) => c.id === id);
      const newSorted = sortCombatantsForTurnOrder(combatants, prev.round);
      const newLen = newSorted.length;
      let newTurnIndex = prev.currentTurnIndex;
      if (removedIndex >= 0) {
        if (removedIndex < prev.currentTurnIndex)
          newTurnIndex = prev.currentTurnIndex - 1;
        else if (removedIndex === prev.currentTurnIndex)
          newTurnIndex = Math.min(
            prev.currentTurnIndex,
            Math.max(0, newLen - 1),
          );
      }
      return { ...prev, combatants, currentTurnIndex: newTurnIndex };
    });
  };

  const updateCombatant = (id: string, updates: Partial<Combatant>) => {
    setEncounter((prev) => {
      if (!prev) return prev;
      const combatant = prev.combatants.find((c) => c.id === id) as
        | TrackedCombatant
        | undefined;
      const owned = isOwnedLinkedCombatant(combatant, user?.uid);
      const isLinked = combatant?.sourceType === "campaign-character";
      const resourceKeys = [
        "currentHealth",
        "maxHealth",
        "currentEnergy",
        "maxEnergy",
        "ap",
      ] as const;
      let applied: Partial<Combatant> = updates;
      if (isLinked && !owned) {
        applied = Object.fromEntries(
          Object.entries(updates).filter(
            ([k]) => !resourceKeys.includes(k as (typeof resourceKeys)[number]),
          ),
        ) as Partial<Combatant>;
      } else if (isLinked && owned) {
        applied = Object.fromEntries(
          Object.entries(updates).filter(
            ([k]) => k !== "maxHealth" && k !== "maxEnergy",
          ),
        ) as Partial<Combatant>;
      }
      const next = prev.combatants.map((c) =>
        c.id === id ? { ...c, ...applied } : c,
      );
      const updated = next.find((c) => c.id === id) as
        | TrackedCombatant
        | undefined;
      if (owned && updated && resourceKeys.some((k) => k in updates)) {
        scheduleCharacterResourceSyncFromCombatant(updated);
      }
      return { ...prev, combatants: next };
    });
  };

  const addCondition = (id: string, conditionName: string) => {
    const condDef = CONDITION_OPTIONS.find((c) => c.name === conditionName);
    const isLeveled = condDef?.leveled ?? true;
    setEncounter((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        combatants: prev.combatants.map((c) => {
          if (c.id !== id) return c;
          if (c.conditions.some((cond) => cond.name === conditionName))
            return c;
          return {
            ...c,
            conditions: [
              ...c.conditions,
              { name: conditionName, level: isLeveled ? 1 : 0 },
            ],
          };
        }),
      };
    });
  };

  const removeCondition = (id: string, conditionName: string) => {
    setEncounter((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        combatants: prev.combatants.map((c) =>
          c.id !== id
            ? c
            : {
                ...c,
                conditions: c.conditions.filter(
                  (cond) => cond.name !== conditionName,
                ),
              },
        ),
      };
    });
  };

  const updateConditionLevel = (
    id: string,
    conditionName: string,
    delta: number,
  ) => {
    setEncounter((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        combatants: prev.combatants.map((c) => {
          if (c.id !== id) return c;
          return {
            ...c,
            conditions: c.conditions
              .map((cond) => {
                if (cond.name !== conditionName) return cond;
                const newLevel = cond.level + delta;
                if (newLevel <= 0) return null;
                return { ...cond, level: newLevel };
              })
              .filter((cond): cond is CombatantCondition => cond !== null),
          };
        }),
      };
    });
  };

  const updateAP = (id: string, delta: number) => {
    setEncounter((prev) => {
      if (!prev) return prev;
      const combatant = prev.combatants.find((c) => c.id === id) as
        | TrackedCombatant
        | undefined;
      const owned = isOwnedLinkedCombatant(combatant, user?.uid);
      if (combatant?.sourceType === "campaign-character" && !owned) return prev;
      const next = prev.combatants.map((c) =>
        c.id === id ? { ...c, ap: Math.max(0, Math.min(10, c.ap + delta)) } : c,
      );
      const updated = next.find((c) => c.id === id) as
        | TrackedCombatant
        | undefined;
      if (owned && updated) {
        scheduleCharacterResourceSyncFromCombatant(updated);
      }
      return { ...prev, combatants: next };
    });
  };

  const startCombat = () => {
    if (sortedCombatants.length === 0) return;
    setEncounter((prev) =>
      prev
        ? {
            ...prev,
            round: 1,
            currentTurnIndex: 0,
            isActive: true,
            status: "active",
          }
        : prev,
    );
  };

  const nextTurn = () => {
    setEncounter((prev) => {
      if (!prev) return prev;
      const nextIndex = prev.currentTurnIndex + 1;
      if (nextIndex >= sortedCombatants.length) {
        const autoSort = prev.autoSortInitiative !== false;
        if (autoSort) {
          return {
            ...prev,
            combatants: orderCombatantsByInitiative(prev.combatants),
            round: prev.round + 1,
            currentTurnIndex: 0,
          };
        }
        return { ...prev, round: prev.round + 1, currentTurnIndex: 0 };
      }
      return { ...prev, currentTurnIndex: nextIndex };
    });
  };

  const previousTurn = () => {
    setEncounter((prev) => {
      if (!prev) return prev;
      if (prev.currentTurnIndex === 0 && prev.round === 1) return prev;
      if (prev.currentTurnIndex === 0) {
        return {
          ...prev,
          round: prev.round - 1,
          currentTurnIndex: sortedCombatants.length - 1,
        };
      }
      return { ...prev, currentTurnIndex: prev.currentTurnIndex - 1 };
    });
  };

  const endCombat = () => {
    setEncounter((prev) =>
      prev
        ? {
            ...prev,
            round: 0,
            currentTurnIndex: -1,
            isActive: false,
            status: "paused",
          }
        : prev,
    );
  };

  const markCompleted = () => {
    setEncounter((prev) =>
      prev
        ? {
            ...prev,
            round: prev.round > 0 ? prev.round : 0,
            currentTurnIndex: -1,
            isActive: false,
            status: "completed",
          }
        : prev,
    );
  };

  const resetEncounter = () => {
    setEncounter((prev) =>
      prev
        ? {
            ...prev,
            combatants: prev.combatants.map((c) => ({
              ...c,
              currentHealth: c.maxHealth,
              currentEnergy: c.maxEnergy,
              ap: 4,
              conditions: [],
              isSurprised: false,
            })),
            round: 0,
            currentTurnIndex: -1,
            isActive: false,
            status: "preparing" as const,
          }
        : prev,
    );
  };

  const sortInitiative = () => {
    setEncounter((prev) => {
      if (!prev) return prev;
      return { ...prev, combatants: orderCombatantsByInitiative(prev.combatants) };
    });
  };

  return {
    encounter,
    setEncounter,
    campaignsFull,
    showRollLog,
    user,
    showAddModal,
    setShowAddModal,
    addingAllChars,
    newCombatant,
    setNewCombatant,
    draggedId,
    dragOverId,
    sortedCombatants,
    linkedCampaign,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    addCombatant,
    addCombatantsFromModal,
    addAllCampaignCharacters,
    duplicateCombatant,
    removeCombatant,
    updateCombatant,
    addCondition,
    removeCondition,
    updateConditionLevel,
    updateAP,
    startCombat,
    nextTurn,
    previousTurn,
    endCombat,
    markCompleted,
    resetEncounter,
    sortInitiative,
  };
}
