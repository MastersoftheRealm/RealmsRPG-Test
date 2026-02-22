/**
 * Combat Encounter View
 * ======================
 * Shared view containing all combat encounter logic and UI.
 * Used by combat/page.tsx and mixed/page.tsx (tab). No PageContainer, header, or loading—parent provides those.
 */

'use client';

import { useState, useCallback, useMemo, useEffect, useRef, DragEvent } from 'react';
import { cn } from '@/lib/utils';
import { Button, Checkbox, Input } from '@/components/ui';
import { ValueStepper } from '@/components/shared';
import type { Combatant, CombatantCondition, CombatantType, TrackedCombatant } from '@/types/encounter';
import type { Encounter } from '@/types/encounter';
import { CombatantCard } from '@/app/(main)/encounter-tracker/CombatantCard';
import { CONDITION_OPTIONS } from '@/app/(main)/encounter-tracker/encounter-tracker-constants';
import { AddCombatantModal } from '@/components/shared/add-combatant-modal';
import { RollLog } from '@/components/character-sheet';
import { createClient } from '@/lib/supabase/client';
import { computeMaxHealthEnergy } from '@/lib/game/calculations';
import type { Campaign } from '@/types/campaign';

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function rollInitiative(acuity: number): number {
  return Math.floor(Math.random() * 20) + 1 + acuity;
}

export interface CombatEncounterViewProps {
  encounterId: string;
  encounter: Encounter | null;
  setEncounter: React.Dispatch<React.SetStateAction<Encounter | null>>;
  campaignsFull: Campaign[];
  showRollLog?: boolean;
}

export default function CombatEncounterView({
  encounterId,
  encounter,
  setEncounter,
  campaignsFull,
  showRollLog = true,
}: CombatEncounterViewProps) {
  if (encounter === null) return null;

  const [showAddModal, setShowAddModal] = useState(false);
  const [addingAllChars, setAddingAllChars] = useState(false);
  const [newCombatant, setNewCombatant] = useState(() => ({
    name: '',
    initiative: rollInitiative(0),
    acuity: 0,
    maxHealth: 20,
    maxEnergy: 10,
    armor: 0,
    evasion: 10,
    combatantType: 'ally' as CombatantType,
    isAlly: true,
    isSurprised: false,
    quantity: 1,
  }));
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const refetchedForEncounterIdRef = useRef<string | null>(null);

  const refetchCharacterResources = useCallback(async () => {
    if (!encounter?.campaignId || !encounter.combatants?.length) return;
    const linked = encounter.combatants.filter(
      (c): c is TrackedCombatant => c.sourceType === 'campaign-character' && !!c.sourceId && !!c.sourceUserId
    );
    if (linked.length === 0) return;
    const results = await Promise.all(
      linked.map(async (c) => {
        try {
          const res = await fetch(
            `/api/campaigns/${encounter!.campaignId}/characters/${c.sourceUserId}/${c.sourceId}?scope=encounter`
          );
          if (!res.ok) return null;
          return { combatantId: c.id, data: await res.json() };
        } catch {
          return null;
        }
      })
    );
    setEncounter((prev) => {
      if (!prev) return prev;
      let changed = false;
      const nextCombatants = prev.combatants.map((c) => {
        const result = results.find((r) => r && r.combatantId === c.id);
        if (!result?.data) return c;
        const d = result.data as {
          currentHealth?: number;
          currentEnergy?: number;
          actionPoints?: number;
          health?: { current?: number; max?: number };
          energy?: { current?: number; max?: number };
        };
        const currentHp = d.currentHealth ?? d.health?.current;
        const currentEn = d.currentEnergy ?? d.energy?.current;
        const maxHp = d.health?.max;
        const maxEn = d.energy?.max;
        const ap = d.actionPoints;
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
      (c) => (c as TrackedCombatant).sourceType === 'campaign-character' && (c as TrackedCombatant).sourceId
    );
    if (!hasLinked) return;
    if (refetchedForEncounterIdRef.current === encounter.id) return;
    refetchedForEncounterIdRef.current = encounter.id;
    refetchCharacterResources();
  }, [encounter?.id, encounter?.campaignId, encounter?.combatants, refetchCharacterResources]);

  useEffect(() => {
    const onFocus = () => refetchCharacterResources();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refetchCharacterResources]);

  const hasLinkedCombatants = encounter?.combatants?.some(
    (c) => (c as TrackedCombatant).sourceType === 'campaign-character' && (c as TrackedCombatant).sourceId
  );
  useEffect(() => {
    if (!hasLinkedCombatants || !refetchCharacterResources) return;
    const interval = setInterval(refetchCharacterResources, 30_000);
    return () => clearInterval(interval);
  }, [hasLinkedCombatants, refetchCharacterResources]);

  const characterIdsForSync = useMemo(() => {
    if (!encounter?.combatants?.length) return [];
    return encounter.combatants
      .filter((c): c is TrackedCombatant => c.sourceType === 'campaign-character' && !!c.sourceId)
      .map((c) => c.sourceId as string)
      .filter((id, i, arr) => arr.indexOf(id) === i);
  }, [encounter?.combatants]);

  useEffect(() => {
    if (characterIdsForSync.length === 0) return;
    const supabase = createClient();
    const filter = `id=in.(${characterIdsForSync.join(',')})`;
    const channel = supabase
      .channel(`encounter-characters:${encounterId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'users',
          table: 'characters',
          filter,
        },
        (payload: { new: { id: string; data?: unknown } }) => {
          const row = payload.new;
          const charId = row.id;
          const raw = row.data;
          const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
          const health = data.health as { current?: number; max?: number } | undefined;
          const energy = data.energy as { current?: number; max?: number } | undefined;
          const currentHp = (data.currentHealth as number) ?? health?.current;
          const currentEn = (data.currentEnergy as number) ?? energy?.current;
          const ap = data.actionPoints as number | undefined;
          const { maxHealth: computedMaxHp, maxEnergy: computedMaxEn } = computeMaxHealthEnergy(data);
          setEncounter((prev) => {
            if (!prev) return prev;
            const hasMatch = prev.combatants.some((c) => (c as TrackedCombatant).sourceId === charId);
            if (!hasMatch) return prev;
            return {
              ...prev,
              combatants: prev.combatants.map((c) => {
                if ((c as TrackedCombatant).sourceId !== charId) return c;
                const updates: Partial<TrackedCombatant> = { ...c };
                if (currentHp !== undefined) updates.currentHealth = currentHp;
                updates.maxHealth = computedMaxHp;
                if (currentEn !== undefined) updates.currentEnergy = currentEn;
                updates.maxEnergy = computedMaxEn;
                if (ap !== undefined) updates.ap = ap;
                return { ...c, ...updates };
              }),
            };
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [encounterId, characterIdsForSync.join(','), setEncounter]);

  const handleDragStart = useCallback((e: DragEvent<HTMLDivElement>, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverId(null);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== draggedId) setDragOverId(id);
  }, [draggedId]);

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
        const combatants = [...prev.combatants];
        const draggedIndex = combatants.findIndex((c) => c.id === draggedId);
        const targetIndex = combatants.findIndex((c) => c.id === targetId);
        if (draggedIndex === -1 || targetIndex === -1) return prev;
        const [draggedItem] = combatants.splice(draggedIndex, 1);
        combatants.splice(targetIndex, 0, draggedItem);
        return { ...prev, combatants };
      });
      setDraggedId(null);
      setDragOverId(null);
    },
    [draggedId, setEncounter]
  );

  const sortedCombatants = useMemo(() => {
    if (!encounter) return [];
    const combatants = [...encounter.combatants];
    const companions = combatants.filter((c) => c.combatantType === 'companion');
    const nonCompanions = combatants.filter((c) => c.combatantType !== 'companion');
    if (encounter.round === 1) {
      const notSurprised = nonCompanions.filter((c) => !c.isSurprised);
      const surprised = nonCompanions.filter((c) => c.isSurprised);
      return [...notSurprised, ...surprised, ...companions];
    }
    return [...nonCompanions, ...companions];
  }, [encounter]);

  const addCombatant = () => {
    if (!newCombatant.name.trim()) return;
    const quantity = Math.max(1, Math.min(26, newCombatant.quantity || 1));
    const newCombatants: TrackedCombatant[] = [];
    for (let i = 0; i < quantity; i++) {
      const suffix = quantity > 1 ? ` ${String.fromCharCode(65 + i)}` : '';
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
        notes: '',
        combatantType: newCombatant.combatantType,
        isAlly: newCombatant.combatantType === 'ally' || newCombatant.combatantType === 'companion',
        isSurprised: newCombatant.isSurprised,
        sourceType: 'manual',
      });
    }
    setEncounter((prev) => (prev ? { ...prev, combatants: [...prev.combatants, ...newCombatants] } : prev));
    setNewCombatant({
      name: '',
      initiative: rollInitiative(0),
      acuity: 0,
      maxHealth: 20,
      maxEnergy: 10,
      armor: 0,
      evasion: 10,
      combatantType: 'ally',
      isAlly: true,
      isSurprised: false,
      quantity: 1,
    });
  };

  const addCombatantsFromModal = (combatants: TrackedCombatant[]) => {
    setEncounter((prev) => (prev ? { ...prev, combatants: [...prev.combatants, ...combatants] } : prev));
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
          async (c: { userId: string; characterId: string; characterName: string }) => {
            try {
              const res = await fetch(
                `/api/campaigns/${encounter.campaignId}/characters/${c.userId}/${c.characterId}?scope=encounter`
              );
              if (!res.ok) return null;
              return { charMeta: c, data: await res.json() };
            } catch {
              return null;
            }
          }
        )
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
              (d as Record<string, unknown>).currentHealth as number ?? d.health?.current ?? d.health?.max ?? 20,
            maxEnergy: d.energy?.max ?? 10,
            currentEnergy:
              (d as Record<string, unknown>).currentEnergy as number ?? d.energy?.current ?? d.energy?.max ?? 10,
            armor: 0,
            evasion: d.evasion ?? 10 + (abilities.agility ?? 0),
            ap: (d as Record<string, unknown>).actionPoints as number ?? 4,
            conditions: [],
            notes: '',
            combatantType: 'ally' as CombatantType,
            isAlly: true,
            isSurprised: false,
            sourceType: 'campaign-character' as const,
            sourceId: r.charMeta.characterId,
            sourceUserId: r.charMeta.userId,
          };
        });
      setEncounter((prev) => (prev ? { ...prev, combatants: [...prev.combatants, ...combatants] } : prev));
    } catch (err) {
      console.error('Failed to add campaign characters:', err);
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
          new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*([A-Z])?$`)
        );
        return m ? m[1] || '' : '';
      })
      .filter(Boolean);
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let suffix = '';
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
    setEncounter((prev) => (prev ? { ...prev, combatants: [...prev.combatants, duplicate] } : prev));
  };

  const removeCombatant = (id: string) => {
    setEncounter((prev) => {
      if (!prev) return prev;
      const combatants = prev.combatants.filter((c) => c.id !== id);
      const sortFn = (a: Combatant, b: Combatant) => {
        if (b.initiative !== a.initiative) return b.initiative - a.initiative;
        return b.acuity - a.acuity;
      };
      const buildSorted = (list: Combatant[]) => {
        const companions = list.filter((c) => c.combatantType === 'companion').sort(sortFn);
        const nonCompanions = list.filter((c) => c.combatantType !== 'companion');
        if (prev.round === 1) {
          const notSurprised = nonCompanions.filter((c) => !c.isSurprised);
          const surprised = nonCompanions.filter((c) => c.isSurprised);
          return [...notSurprised, ...surprised, ...companions];
        }
        return [...nonCompanions, ...companions];
      };
      const oldSorted = buildSorted(prev.combatants);
      const removedIndex = oldSorted.findIndex((c) => c.id === id);
      const newSorted = buildSorted(combatants);
      const newLen = newSorted.length;
      let newTurnIndex = prev.currentTurnIndex;
      if (removedIndex >= 0) {
        if (removedIndex < prev.currentTurnIndex) newTurnIndex = prev.currentTurnIndex - 1;
        else if (removedIndex === prev.currentTurnIndex)
          newTurnIndex = Math.min(prev.currentTurnIndex, Math.max(0, newLen - 1));
      }
      return { ...prev, combatants, currentTurnIndex: newTurnIndex };
    });
  };

  const updateCombatant = (id: string, updates: Partial<Combatant>) => {
    setEncounter((prev) => {
      if (!prev) return prev;
      const combatant = prev.combatants.find((c) => c.id === id) as TrackedCombatant | undefined;
      const isLinked = combatant?.sourceType === 'campaign-character';
      const resourceKeys = ['currentHealth', 'maxHealth', 'currentEnergy', 'maxEnergy', 'ap'] as const;
      const applied: Partial<Combatant> = isLinked
        ? Object.fromEntries(
            Object.entries(updates).filter(([k]) => !resourceKeys.includes(k as (typeof resourceKeys)[number]))
          )
        : updates;
      const next = prev.combatants.map((c) => (c.id === id ? { ...c, ...applied } : c));
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
          if (c.conditions.some((cond) => cond.name === conditionName)) return c;
          return { ...c, conditions: [...c.conditions, { name: conditionName, level: isLeveled ? 1 : 0 }] };
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
          c.id !== id ? c : { ...c, conditions: c.conditions.filter((cond) => cond.name !== conditionName) }
        ),
      };
    });
  };

  const updateConditionLevel = (id: string, conditionName: string, delta: number) => {
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
      const combatant = prev.combatants.find((c) => c.id === id) as TrackedCombatant | undefined;
      if (combatant?.sourceType === 'campaign-character') return prev;
      const next = prev.combatants.map((c) =>
        c.id === id ? { ...c, ap: Math.max(0, Math.min(10, c.ap + delta)) } : c
      );
      return { ...prev, combatants: next };
    });
  };

  const startCombat = () => {
    if (sortedCombatants.length === 0) return;
    setEncounter((prev) =>
      prev ? { ...prev, round: 1, currentTurnIndex: 0, isActive: true, status: 'active' } : prev
    );
  };

  const nextTurn = () => {
    setEncounter((prev) => {
      if (!prev) return prev;
      const nextIndex = prev.currentTurnIndex + 1;
      if (nextIndex >= sortedCombatants.length) {
        const autoSort = prev.autoSortInitiative !== false;
        if (autoSort) {
          const sortByRollAndAcuity = (a: Combatant, b: Combatant) => {
            if (b.initiative !== a.initiative) return b.initiative - a.initiative;
            return b.acuity - a.acuity;
          };
          const companions = prev.combatants.filter((c) => c.combatantType === 'companion').sort(sortByRollAndAcuity);
          const allies = prev.combatants.filter((c) => c.combatantType === 'ally').sort(sortByRollAndAcuity);
          const enemies = prev.combatants.filter((c) => c.combatantType === 'enemy').sort(sortByRollAndAcuity);
          let startWithAlly = true;
          if (allies[0] && enemies[0]) {
            startWithAlly = sortByRollAndAcuity(allies[0], enemies[0]) <= 0;
          } else if (!allies[0]) {
            startWithAlly = false;
          }
          const sorted: Combatant[] = [];
          const alliesCopy = [...allies];
          const enemiesCopy = [...enemies];
          let useAlly = startWithAlly;
          while (alliesCopy.length > 0 || enemiesCopy.length > 0) {
            if (useAlly && alliesCopy.length > 0) sorted.push(alliesCopy.shift()!);
            else if (!useAlly && enemiesCopy.length > 0) sorted.push(enemiesCopy.shift()!);
            else if (alliesCopy.length > 0) sorted.push(alliesCopy.shift()!);
            else if (enemiesCopy.length > 0) sorted.push(enemiesCopy.shift()!);
            useAlly = !useAlly;
          }
          return { ...prev, combatants: [...sorted, ...companions], round: prev.round + 1, currentTurnIndex: 0 };
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
        return { ...prev, round: prev.round - 1, currentTurnIndex: sortedCombatants.length - 1 };
      }
      return { ...prev, currentTurnIndex: prev.currentTurnIndex - 1 };
    });
  };

  const endCombat = () => {
    setEncounter((prev) =>
      prev ? { ...prev, round: 0, currentTurnIndex: -1, isActive: false, status: 'paused' } : prev
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
            status: 'preparing' as const,
          }
        : prev
    );
  };

  const sortInitiative = () => {
    setEncounter((prev) => {
      if (!prev) return prev;
      const sortByRollAndAcuity = (a: Combatant, b: Combatant) => {
        if (b.initiative !== a.initiative) return b.initiative - a.initiative;
        return b.acuity - a.acuity;
      };
      const companions = prev.combatants.filter((c) => c.combatantType === 'companion').sort(sortByRollAndAcuity);
      const allies = prev.combatants.filter((c) => c.combatantType === 'ally').sort(sortByRollAndAcuity);
      const enemies = prev.combatants.filter((c) => c.combatantType === 'enemy').sort(sortByRollAndAcuity);
      let startWithAlly = true;
      if (allies[0] && enemies[0]) {
        startWithAlly = sortByRollAndAcuity(allies[0], enemies[0]) <= 0;
      } else if (!allies[0]) {
        startWithAlly = false;
      }
      const sorted: Combatant[] = [];
      const alliesCopy = [...allies];
      const enemiesCopy = [...enemies];
      let useAlly = startWithAlly;
      while (alliesCopy.length > 0 || enemiesCopy.length > 0) {
        if (useAlly && alliesCopy.length > 0) sorted.push(alliesCopy.shift()!);
        else if (!useAlly && enemiesCopy.length > 0) sorted.push(enemiesCopy.shift()!);
        else if (alliesCopy.length > 0) sorted.push(alliesCopy.shift()!);
        else if (enemiesCopy.length > 0) sorted.push(enemiesCopy.shift()!);
        useAlly = !useAlly;
      }
      return { ...prev, combatants: [...sorted, ...companions] };
    });
  };

  return (
    <>
      <div className="grid lg:grid-cols-4 gap-6 lg:items-stretch">
        <div className="lg:col-span-3 flex flex-col gap-4 min-h-0">
          <div className="bg-surface rounded-xl shadow-md p-4 flex flex-wrap items-center gap-4 flex-shrink-0">
            {!encounter.isActive ? (
              <>
                <Button onClick={startCombat} disabled={encounter.combatants.length === 0}>
                  Start Encounter
                </Button>
                <Button onClick={sortInitiative} title="Sort by initiative and acuity">
                  Sort Initiative
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" onClick={previousTurn}>
                  Previous
                </Button>
                <Button onClick={nextTurn}>Next Turn</Button>
                <Button onClick={sortInitiative} title="Sort by initiative and acuity">
                  Sort Initiative
                </Button>
                <Button variant="danger" onClick={endCombat}>
                  End Combat
                </Button>
              </>
            )}
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={encounter.autoSortInitiative !== false}
                onChange={(e) => setEncounter((prev) => (prev ? { ...prev, autoSortInitiative: e.target.checked } : prev))}
                className="rounded border-border-light"
              />
              Auto Sort Initiative
            </label>
            <Button variant="ghost" onClick={resetEncounter} className="ml-auto">
              Reset All
            </Button>
            <Button
              variant="danger"
              onClick={() => setEncounter((prev) => (prev ? { ...prev, combatants: [] } : prev))}
            >
              Clear All
            </Button>
          </div>

          {!encounter.isActive && sortedCombatants.length > 0 && (
            <div className="text-xs text-text-muted flex items-center gap-4 px-2 flex-shrink-0">
              <span>
                Drag the grip handle to reorder. Surprised creatures go last in round 1. Companions always go last.
              </span>
            </div>
          )}

          <div className="space-y-3 overflow-y-auto pr-2 scroll-smooth flex-1 min-h-[300px]">
            {sortedCombatants.length === 0 ? (
              <div className="bg-surface rounded-xl shadow-md p-8 text-center text-text-muted">
                No combatants added yet. Add some using the panel on the right.
              </div>
            ) : (
              sortedCombatants.map((combatant, index) => (
                <CombatantCard
                  key={combatant.id}
                  combatant={combatant}
                  isCurrentTurn={encounter.isActive && index === encounter.currentTurnIndex}
                  isDragOver={dragOverId === combatant.id}
                  isDragging={draggedId === combatant.id}
                  onUpdate={(updates) => updateCombatant(combatant.id, updates)}
                  onRemove={() => removeCombatant(combatant.id)}
                  onDuplicate={() => duplicateCombatant(combatant)}
                  onAddCondition={(condition) => addCondition(combatant.id, condition)}
                  onRemoveCondition={(condition) => removeCondition(combatant.id, condition)}
                  onUpdateConditionLevel={(condition, delta) => updateConditionLevel(combatant.id, condition, delta)}
                  onUpdateAP={(delta) => updateAP(combatant.id, delta)}
                  onDragStart={(e) => handleDragStart(e, combatant.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, combatant.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, combatant.id)}
                  variant="compact"
                />
              ))
            )}
          </div>
        </div>

        <div className="space-y-6 flex flex-col min-h-0">
          <div className="bg-surface rounded-xl shadow-md p-6 flex-shrink-0">
            <h3 className="text-lg font-bold text-text-primary mb-4">Add Combatant</h3>
            <div className="mb-4 space-y-2">
              <label className="block text-sm font-medium text-text-secondary">Campaign</label>
              <select
                value={encounter.campaignId ?? ''}
                onChange={(e) => {
                  const id = e.target.value || undefined;
                  setEncounter((prev) => (prev ? { ...prev, campaignId: id } : prev));
                }}
                className="w-full px-3 py-2 rounded-lg border border-border-light bg-background text-text-primary text-sm"
              >
                <option value="">No campaign</option>
                {campaignsFull.map((c: Campaign) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {linkedCampaign && (linkedCampaign.characters?.length ?? 0) > 0 && (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={addAllCampaignCharacters}
                  disabled={addingAllChars || encounter.isActive}
                >
                  {addingAllChars ? 'Adding…' : `Add all Characters (${linkedCampaign.characters?.length ?? 0})`}
                </Button>
              )}
            </div>
            <Button variant="secondary" className="w-full mb-4" onClick={() => setShowAddModal(true)}>
              From Library / Campaign
            </Button>
            <div className="space-y-4">
              <Input
                label="Name"
                type="text"
                value={newCombatant.name}
                onChange={(e) => setNewCombatant((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Creature name..."
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Roll"
                  type="number"
                  value={newCombatant.initiative || ''}
                  onChange={(e) =>
                    setNewCombatant((prev) => ({ ...prev, initiative: parseInt(e.target.value) || 0 }))
                  }
                  placeholder="Init"
                />
                <Input
                  label="Acuity"
                  type="number"
                  value={newCombatant.acuity || ''}
                  onChange={(e) =>
                    setNewCombatant((prev) => ({ ...prev, acuity: parseInt(e.target.value) || 0 }))
                  }
                  placeholder="Acuity"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Max HP"
                  type="number"
                  value={newCombatant.maxHealth}
                  onChange={(e) => setNewCombatant((prev) => ({ ...prev, maxHealth: parseInt(e.target.value) || 1 }))}
                />
                <Input
                  label="Max EN"
                  type="number"
                  value={newCombatant.maxEnergy}
                  onChange={(e) => setNewCombatant((prev) => ({ ...prev, maxEnergy: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Quantity</label>
                <div className="flex items-center gap-2">
                  <ValueStepper
                    value={newCombatant.quantity || 1}
                    onChange={(value) => setNewCombatant((prev) => ({ ...prev, quantity: value }))}
                    min={1}
                    max={26}
                    size="sm"
                    enableHoldRepeat
                  />
                  <span className="text-xs text-text-muted ml-2">A, B, C... suffixes</span>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {(['ally', 'enemy', 'companion'] as const).map((t) => (
                  <label key={t} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="combatantType"
                      checked={newCombatant.combatantType === t}
                      onChange={() =>
                        setNewCombatant((prev) => ({
                          ...prev,
                          combatantType: t,
                          isAlly: t !== 'enemy',
                        }))
                      }
                      className="w-4 h-4"
                    />
                    <span
                      className={cn(
                        'text-sm font-medium',
                        t === 'ally'
                          ? 'text-blue-700 dark:text-blue-300'
                          : t === 'enemy'
                            ? 'text-red-700 dark:text-red-300'
                            : 'text-violet-700 dark:text-violet-300'
                      )}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </span>
                  </label>
                ))}
              </div>
              <Checkbox
                checked={newCombatant.isSurprised}
                onChange={(e) => setNewCombatant((prev) => ({ ...prev, isSurprised: e.target.checked }))}
                label="Surprised (goes last in round 1)"
              />
              <Button onClick={addCombatant} disabled={!newCombatant.name.trim()} className="w-full font-bold">
                Add Creature
              </Button>
            </div>
          </div>
          <div className="bg-surface rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Conditions Reference</h3>
            <div className="flex flex-wrap gap-1">
              {CONDITION_OPTIONS.map((condition) => (
                <span
                  key={condition.name}
                  title={condition.description}
                  className={cn(
                    'px-2 py-1 text-xs rounded-full cursor-help',
                    condition.leveled ? 'bg-companion-light text-companion-text' : 'bg-surface-alt text-text-secondary'
                  )}
                >
                  {condition.name}
                  {condition.leveled && ' \u2B07'}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddCombatantModal onClose={() => setShowAddModal(false)} onAdd={addCombatantsFromModal} mode="combat" />
      )}

      {showRollLog && <RollLog viewOnlyCampaignId={encounter.campaignId} />}
    </>
  );
}
