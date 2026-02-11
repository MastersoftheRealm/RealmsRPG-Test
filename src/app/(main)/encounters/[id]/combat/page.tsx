/**
 * Combat Encounter Page
 * ======================
 * Prisma-backed combat tracker for a specific encounter.
 * Ported from encounter-tracker with persistence via encounter-service.
 */

'use client';

import { useState, useCallback, useMemo, useEffect, useRef, DragEvent, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Save, ChevronLeft, Cloud, CloudOff } from 'lucide-react';
import { ProtectedRoute } from '@/components/layout';
import { LoadingState, Button, Checkbox, Input, PageContainer, Alert } from '@/components/ui';
import { ValueStepper } from '@/components/shared';
import type { Combatant, CombatantCondition, CombatantType, TrackedCombatant } from '@/types/encounter';
import type { Encounter } from '@/types/encounter';
import { CombatantCard } from '@/app/(main)/encounter-tracker/CombatantCard';
import { CONDITION_OPTIONS } from '@/app/(main)/encounter-tracker/encounter-tracker-constants';
import { useEncounter, useSaveEncounter, useAutoSave, useCampaignsFull, useAuth } from '@/hooks';
import { AddCombatantModal } from '@/components/shared/add-combatant-modal';
import { RollProvider, RollLog } from '@/components/character-sheet';
import { createClient } from '@/lib/supabase/client';
import type { Campaign } from '@/types/campaign';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

interface PageParams {
  params: Promise<{ id: string }>;
}

export default function CombatEncounterPage({ params }: PageParams) {
  return (
    <ProtectedRoute>
      <CombatEncounterContent params={params} />
    </ProtectedRoute>
  );
}

function CombatEncounterContent({ params }: { params: Promise<{ id: string }> }) {
  const { id: encounterId } = use(params);
  const router = useRouter();
  const { data: encounterData, isLoading, error } = useEncounter(encounterId);
  const saveMutation = useSaveEncounter();

  // Local encounter state (synced from API on load)
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [addingAllChars, setAddingAllChars] = useState(false);
  const { user } = useAuth();
  const { data: campaignsFull = [] } = useCampaignsFull();
  const syncTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const syncCharacterHealthEnergy = useCallback(
    (characterId: string, payload: { health: { current: number; max: number }; energy: { current: number; max: number } }) => {
      const key = characterId;
      if (syncTimeoutsRef.current[key]) clearTimeout(syncTimeoutsRef.current[key]);
      syncTimeoutsRef.current[key] = setTimeout(async () => {
        delete syncTimeoutsRef.current[key];
        try {
          await fetch(`/api/characters/${encodeURIComponent(characterId)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              health: { current: payload.health.current, max: payload.health.max },
              energy: { current: payload.energy.current, max: payload.energy.max },
            }),
          });
        } catch (err) {
          console.error('Failed to sync character HP/EN:', err);
        }
      }, 400);
    },
    []
  );

  // Initialize local state from API
  useEffect(() => {
    if (encounterData && !isInitialized) {
      setEncounter(encounterData);
      setNameInput(encounterData.name || '');
      setIsInitialized(true);
    }
  }, [encounterData, isInitialized]);

  // Realtime: when character HP/EN is updated (e.g. from character sheet), sync to encounter combatants
  const characterIdsForSync = useMemo(() => {
    if (!encounter?.combatants?.length) return [];
    return encounter.combatants
      .filter((c): c is TrackedCombatant => c.sourceType === 'campaign-character' && !!c.sourceId)
      .map(c => c.sourceId as string)
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
        (payload: { new: { id: string; data?: { health?: { current?: number; max?: number }; energy?: { current?: number; max?: number } } } }) => {
          const row = payload.new;
          const charId = row.id;
          const data = row.data;
          if (!data?.health && !data?.energy) return;
          setEncounter(prev => {
            if (!prev) return prev;
            const hasMatch = prev.combatants.some(c => (c as TrackedCombatant).sourceId === charId);
            if (!hasMatch) return prev;
            return {
              ...prev,
              combatants: prev.combatants.map(c => {
                if ((c as TrackedCombatant).sourceId !== charId) return c;
                const health = data.health;
                const energy = data.energy;
                return {
                  ...c,
                  ...(health && { currentHealth: health.current ?? c.currentHealth, maxHealth: health.max ?? c.maxHealth }),
                  ...(energy && { currentEnergy: energy.current ?? c.currentEnergy, maxEnergy: energy.max ?? c.maxEnergy }),
                };
              }),
            };
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [encounterId, characterIdsForSync.join(',')]);

  useEffect(() => {
    if (encounter?.name && !isEditingName) setNameInput(encounter.name);
  }, [encounter?.name, isEditingName]);

  // Auto-save to API
  const { isSaving, hasUnsavedChanges } = useAutoSave({
    data: encounter,
    onSave: async (data) => {
      if (!data || !encounterId) return;
      const { id: _id, createdAt: _ca, ...rest } = data;
      await saveMutation.mutateAsync({ id: encounterId, data: rest });
    },
    delay: 1500,
    enabled: isInitialized && !!encounter,
  });

  // New combatant form state
  const [newCombatant, setNewCombatant] = useState({
    name: '',
    initiative: 0,
    acuity: 0,
    maxHealth: 20,
    maxEnergy: 10,
    armor: 0,
    evasion: 10,
    combatantType: 'ally' as CombatantType,
    isAlly: true,
    isSurprised: false,
    quantity: 1,
  });

  // Drag-and-drop state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

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

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }
    setEncounter(prev => {
      if (!prev) return prev;
      const combatants = [...prev.combatants];
      const draggedIndex = combatants.findIndex(c => c.id === draggedId);
      const targetIndex = combatants.findIndex(c => c.id === targetId);
      if (draggedIndex === -1 || targetIndex === -1) return prev;
      const [draggedItem] = combatants.splice(draggedIndex, 1);
      combatants.splice(targetIndex, 0, draggedItem);
      return { ...prev, combatants };
    });
    setDraggedId(null);
    setDragOverId(null);
  }, [draggedId]);

  const sortedCombatants = useMemo(() => {
    if (!encounter) return [];
    let combatants = [...encounter.combatants];
    const companions = combatants.filter(c => c.combatantType === 'companion');
    const nonCompanions = combatants.filter(c => c.combatantType !== 'companion');
    if (encounter.round === 1) {
      const notSurprised = nonCompanions.filter(c => !c.isSurprised);
      const surprised = nonCompanions.filter(c => c.isSurprised);
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
    setEncounter(prev => prev ? { ...prev, combatants: [...prev.combatants, ...newCombatants] } : prev);
    setNewCombatant({ name: '', initiative: 0, acuity: 0, maxHealth: 20, maxEnergy: 10, armor: 0, evasion: 10, combatantType: 'ally', isAlly: true, isSurprised: false, quantity: 1 });
  };

  const addCombatantsFromModal = (combatants: TrackedCombatant[]) => {
    setEncounter(prev => prev ? { ...prev, combatants: [...prev.combatants, ...combatants] } : prev);
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
        linkedCampaign.characters.map(async (c: { userId: string; characterId: string; characterName: string }) => {
          try {
            const res = await fetch(
              `/api/campaigns/${encounter.campaignId}/characters/${c.userId}/${c.characterId}?scope=encounter`
            );
            if (!res.ok) return null;
            return { charMeta: c, data: await res.json() };
          } catch {
            return null;
          }
        })
      );
      const combatants: TrackedCombatant[] = results
        .filter((r): r is NonNullable<typeof r> => r !== null)
        .map((r) => {
          const d = r.data;
          const abilities = d.abilities || {};
          return {
            id: generateId(),
            name: r.charMeta.characterName,
            initiative: 0,
            acuity: abilities.acuity ?? 0,
            maxHealth: d.health?.max ?? 20,
            currentHealth: (d as Record<string, unknown>).currentHealth as number ?? d.health?.current ?? d.health?.max ?? 20,
            maxEnergy: d.energy?.max ?? 10,
            currentEnergy: (d as Record<string, unknown>).currentEnergy as number ?? d.energy?.current ?? d.energy?.max ?? 10,
            armor: 0,
            evasion: d.evasion ?? 10 + (abilities.agility ?? 0),
            ap: 4,
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
      setEncounter(prev => prev ? { ...prev, combatants: [...prev.combatants, ...combatants] } : prev);
    } catch (err) {
      console.error('Failed to add campaign characters:', err);
    } finally {
      setAddingAllChars(false);
    }
  }, [encounter, linkedCampaign]);

  const duplicateCombatant = (combatant: Combatant) => {
    const baseNameMatch = combatant.name.match(/^(.+?)\s*[A-Z]?$/);
    const baseName = baseNameMatch ? baseNameMatch[1].trim() : combatant.name;
    const existing = encounter?.combatants || [];
    const usedSuffixes = existing
      .map(c => c.name)
      .filter(n => n.startsWith(baseName))
      .map(n => { const m = n.match(new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*([A-Z])?$`)); return m ? m[1] || '' : ''; })
      .filter(Boolean);
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let suffix = '';
    for (const letter of alphabet) { if (!usedSuffixes.includes(letter)) { suffix = ` ${letter}`; break; } }
    const duplicate: TrackedCombatant = { ...combatant, id: generateId(), name: baseName + suffix, currentHealth: combatant.maxHealth, currentEnergy: combatant.maxEnergy, conditions: [] };
    setEncounter(prev => prev ? { ...prev, combatants: [...prev.combatants, duplicate] } : prev);
  };

  const removeCombatant = (id: string) => {
    setEncounter(prev => {
      if (!prev) return prev;
      const combatants = prev.combatants.filter(c => c.id !== id);
      const sortFn = (a: Combatant, b: Combatant) => {
        if (b.initiative !== a.initiative) return b.initiative - a.initiative;
        return b.acuity - a.acuity;
      };
      const buildSorted = (list: Combatant[]) => {
        const companions = list.filter(c => c.combatantType === 'companion').sort(sortFn);
        const nonCompanions = list.filter(c => c.combatantType !== 'companion');
        if (prev.round === 1) {
          const notSurprised = nonCompanions.filter(c => !c.isSurprised);
          const surprised = nonCompanions.filter(c => c.isSurprised);
          return [...notSurprised, ...surprised, ...companions];
        }
        return [...nonCompanions, ...companions];
      };
      const oldSorted = buildSorted(prev.combatants);
      const removedIndex = oldSorted.findIndex(c => c.id === id);
      const newSorted = buildSorted(combatants);
      const newLen = newSorted.length;
      let newTurnIndex = prev.currentTurnIndex;
      if (removedIndex >= 0) {
        if (removedIndex < prev.currentTurnIndex) newTurnIndex = prev.currentTurnIndex - 1;
        else if (removedIndex === prev.currentTurnIndex) newTurnIndex = Math.min(prev.currentTurnIndex, Math.max(0, newLen - 1));
      }
      return { ...prev, combatants, currentTurnIndex: newTurnIndex };
    });
  };

  const updateCombatant = (id: string, updates: Partial<Combatant>) => {
    setEncounter(prev => {
      if (!prev) return prev;
      const next = prev.combatants.map(c => c.id === id ? { ...c, ...updates } : c);
      const updated = next.find(c => c.id === id) as TrackedCombatant | undefined;
      if (updated?.sourceType === 'campaign-character' && updated.sourceUserId === user?.uid && updated.sourceId && (updates.currentHealth !== undefined || updates.currentEnergy !== undefined || updates.maxHealth !== undefined || updates.maxEnergy !== undefined)) {
        syncCharacterHealthEnergy(updated.sourceId, {
          health: { current: updated.currentHealth, max: updated.maxHealth },
          energy: { current: updated.currentEnergy, max: updated.maxEnergy },
        });
      }
      return { ...prev, combatants: next };
    });
  };

  const addCondition = (id: string, conditionName: string) => {
    const condDef = CONDITION_OPTIONS.find(c => c.name === conditionName);
    const isLeveled = condDef?.leveled ?? true;
    setEncounter(prev => {
      if (!prev) return prev;
      return { ...prev, combatants: prev.combatants.map(c => {
        if (c.id !== id) return c;
        if (c.conditions.some(cond => cond.name === conditionName)) return c;
        return { ...c, conditions: [...c.conditions, { name: conditionName, level: isLeveled ? 1 : 0 }] };
      })};
    });
  };

  const removeCondition = (id: string, conditionName: string) => {
    setEncounter(prev => {
      if (!prev) return prev;
      return { ...prev, combatants: prev.combatants.map(c => c.id !== id ? c : { ...c, conditions: c.conditions.filter(cond => cond.name !== conditionName) }) };
    });
  };

  const updateConditionLevel = (id: string, conditionName: string, delta: number) => {
    setEncounter(prev => {
      if (!prev) return prev;
      return { ...prev, combatants: prev.combatants.map(c => {
        if (c.id !== id) return c;
        return { ...c, conditions: c.conditions.map(cond => {
          if (cond.name !== conditionName) return cond;
          const newLevel = cond.level + delta;
          if (newLevel <= 0) return null;
          return { ...cond, level: newLevel };
        }).filter((cond): cond is CombatantCondition => cond !== null) };
      })};
    });
  };

  const updateAP = (id: string, delta: number) => {
    setEncounter(prev => {
      if (!prev) return prev;
      return { ...prev, combatants: prev.combatants.map(c => c.id !== id ? c : { ...c, ap: Math.max(0, Math.min(10, c.ap + delta)) }) };
    });
  };

  const startCombat = () => {
    if (sortedCombatants.length === 0) return;
    setEncounter(prev => prev ? { ...prev, round: 1, currentTurnIndex: 0, isActive: true, status: 'active' } : prev);
  };

  const nextTurn = () => {
    setEncounter(prev => {
      if (!prev) return prev;
      const nextIndex = prev.currentTurnIndex + 1;
      if (nextIndex >= sortedCombatants.length) {
        const autoSort = prev.autoSortInitiative !== false;
        if (autoSort) {
          const sortByRollAndAcuity = (a: Combatant, b: Combatant) => {
            if (b.initiative !== a.initiative) return b.initiative - a.initiative;
            return b.acuity - a.acuity;
          };
          const companions = prev.combatants.filter(c => c.combatantType === 'companion').sort(sortByRollAndAcuity);
          const allies = prev.combatants.filter(c => c.combatantType === 'ally').sort(sortByRollAndAcuity);
          const enemies = prev.combatants.filter(c => c.combatantType === 'enemy').sort(sortByRollAndAcuity);
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
    setEncounter(prev => {
      if (!prev) return prev;
      if (prev.currentTurnIndex === 0 && prev.round === 1) return prev;
      if (prev.currentTurnIndex === 0) {
        return { ...prev, round: prev.round - 1, currentTurnIndex: sortedCombatants.length - 1 };
      }
      return { ...prev, currentTurnIndex: prev.currentTurnIndex - 1 };
    });
  };

  const endCombat = () => {
    setEncounter(prev => prev ? { ...prev, round: 0, currentTurnIndex: -1, isActive: false, status: 'paused' } : prev);
  };

  const resetEncounter = () => {
    setEncounter(prev => prev ? {
      ...prev,
      combatants: prev.combatants.map(c => ({ ...c, currentHealth: c.maxHealth, currentEnergy: c.maxEnergy, ap: 4, conditions: [], isSurprised: false })),
      round: 0, currentTurnIndex: -1, isActive: false, status: 'preparing' as const,
    } : prev);
  };

  const sortInitiative = () => {
    setEncounter(prev => {
      if (!prev) return prev;
      const sortByRollAndAcuity = (a: Combatant, b: Combatant) => {
        if (b.initiative !== a.initiative) return b.initiative - a.initiative;
        return b.acuity - a.acuity;
      };
      const companions = prev.combatants.filter(c => c.combatantType === 'companion').sort(sortByRollAndAcuity);
      const allies = prev.combatants.filter(c => c.combatantType === 'ally').sort(sortByRollAndAcuity);
      const enemies = prev.combatants.filter(c => c.combatantType === 'enemy').sort(sortByRollAndAcuity);
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

  if (isLoading) {
    return <PageContainer size="full"><div className="flex items-center justify-center py-20"><LoadingState message="Loading encounter..." size="lg" /></div></PageContainer>;
  }

  if (error || (!isLoading && !encounterData)) {
    return (
      <PageContainer size="full">
        <Alert variant="danger" title="Encounter not found">
          This encounter may have been deleted or you may not have access.
        </Alert>
        <Link href="/encounters" className="mt-4 inline-block text-primary-600 hover:underline">Back to Encounters</Link>
      </PageContainer>
    );
  }

  if (!encounter) {
    return <PageContainer size="full"><LoadingState message="Initializing..." /></PageContainer>;
  }

  return (
    <RollProvider>
    <PageContainer size="full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/encounters" className="inline-flex items-center gap-1 text-text-secondary hover:text-primary-600 mb-2 text-sm">
            <ChevronLeft className="w-4 h-4" /> Back to Encounters
          </Link>
          {isEditingName ? (
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={() => {
                const trimmed = nameInput.trim();
                if (trimmed && trimmed !== encounter.name) {
                  setEncounter(prev => prev ? { ...prev, name: trimmed } : prev);
                } else {
                  setNameInput(encounter.name || '');
                }
                setIsEditingName(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const trimmed = nameInput.trim();
                  if (trimmed && trimmed !== encounter.name) {
                    setEncounter(prev => prev ? { ...prev, name: trimmed } : prev);
                  }
                  setIsEditingName(false);
                } else if (e.key === 'Escape') {
                  setNameInput(encounter.name || '');
                  setIsEditingName(false);
                }
              }}
              className="text-3xl font-bold text-text-primary bg-transparent border-b-2 border-primary-500 outline-none w-full max-w-md"
              autoFocus
            />
          ) : (
            <h1
              className="text-3xl font-bold text-text-primary cursor-pointer hover:text-primary-600 hover:underline"
              onClick={() => setIsEditingName(true)}
              title="Click to edit encounter name"
            >
              {encounter.name}
            </h1>
          )}
          <p className="text-text-secondary">Combat Encounter{encounter.description ? ` \u2014 ${encounter.description}` : ''}</p>
          <p className="text-xs mt-1 flex items-center gap-1">
            {isSaving ? (
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1"><CloudOff className="w-3 h-3" /> Saving...</span>
            ) : hasUnsavedChanges ? (
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1"><CloudOff className="w-3 h-3" /> Unsaved changes</span>
            ) : (
              <span className="text-green-600 dark:text-green-400 flex items-center gap-1"><Cloud className="w-3 h-3" /> Saved to cloud</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 text-lg">
          {encounter.isActive && (
            <div className="px-4 py-2 bg-surface-alt text-text-primary rounded-lg font-bold">
              Round {encounter.round} &bull; Turn {encounter.currentTurnIndex + 1}/{sortedCombatants.length}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6 lg:items-stretch">
        {/* Combatant List */}
        <div className="lg:col-span-3 flex flex-col gap-4 min-h-0">
          {/* Combat Controls */}
          <div className="bg-surface rounded-xl shadow-md p-4 flex flex-wrap items-center gap-4 flex-shrink-0">
            {!encounter.isActive ? (
              <>
                <Button onClick={startCombat} disabled={encounter.combatants.length === 0}>Start Encounter</Button>
                <Button onClick={sortInitiative} title="Sort by initiative and acuity">Sort Initiative</Button>
              </>
            ) : (
              <>
                <Button variant="secondary" onClick={previousTurn}>Previous</Button>
                <Button onClick={nextTurn}>Next Turn</Button>
                <Button onClick={sortInitiative} title="Sort by initiative and acuity">Sort Initiative</Button>
                <Button variant="danger" onClick={endCombat}>End Combat</Button>
              </>
            )}
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={encounter.autoSortInitiative !== false}
                onChange={(e) => setEncounter(prev => prev ? { ...prev, autoSortInitiative: e.target.checked } : prev)}
                className="rounded border-border-light"
              />
              Auto Sort Initiative
            </label>
            <Button variant="ghost" onClick={resetEncounter} className="ml-auto">Reset All</Button>
            <Button variant="danger" onClick={() => setEncounter(prev => prev ? { ...prev, combatants: [] } : prev)}>Clear All</Button>
          </div>

          {!encounter.isActive && sortedCombatants.length > 0 && (
            <div className="text-xs text-text-muted flex items-center gap-4 px-2 flex-shrink-0">
              <span>Drag the grip handle to reorder. Surprised creatures go last in round 1. Companions always go last.</span>
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

        {/* Add Combatant Panel */}
        <div className="space-y-6 flex flex-col min-h-0">
          <div className="bg-surface rounded-xl shadow-md p-6 flex-shrink-0">
            <h3 className="text-lg font-bold text-text-primary mb-4">Add Combatant</h3>

            {/* Campaign link + Add all Characters */}
            <div className="mb-4 space-y-2">
              <label className="block text-sm font-medium text-text-secondary">Campaign</label>
              <select
                value={encounter.campaignId ?? ''}
                onChange={(e) => {
                  const id = e.target.value || undefined;
                  setEncounter(prev => prev ? { ...prev, campaignId: id } : prev);
                }}
                className="w-full px-3 py-2 rounded-lg border border-border-light bg-background text-text-primary text-sm"
              >
                <option value="">No campaign</option>
                {campaignsFull.map((c: Campaign) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
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

            {/* Quick add buttons */}
            <Button variant="secondary" className="w-full mb-4" onClick={() => setShowAddModal(true)}>
              From Library / Campaign
            </Button>

            <div className="space-y-4">
              <Input label="Name" type="text" value={newCombatant.name} onChange={(e) => setNewCombatant(prev => ({ ...prev, name: e.target.value }))} placeholder="Creature name..." />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Roll" type="number" value={newCombatant.initiative || ''} onChange={(e) => setNewCombatant(prev => ({ ...prev, initiative: parseInt(e.target.value) || 0 }))} placeholder="Init" />
                <Input label="Acuity" type="number" value={newCombatant.acuity || ''} onChange={(e) => setNewCombatant(prev => ({ ...prev, acuity: parseInt(e.target.value) || 0 }))} placeholder="Acuity" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Max HP" type="number" value={newCombatant.maxHealth} onChange={(e) => setNewCombatant(prev => ({ ...prev, maxHealth: parseInt(e.target.value) || 1 }))} />
                <Input label="Max EN" type="number" value={newCombatant.maxEnergy} onChange={(e) => setNewCombatant(prev => ({ ...prev, maxEnergy: parseInt(e.target.value) || 0 }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Quantity</label>
                <div className="flex items-center gap-2">
                  <ValueStepper value={newCombatant.quantity || 1} onChange={(value) => setNewCombatant(prev => ({ ...prev, quantity: value }))} min={1} max={26} size="sm" enableHoldRepeat />
                  <span className="text-xs text-text-muted ml-2">A, B, C... suffixes</span>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {(['ally', 'enemy', 'companion'] as const).map((t) => (
                  <label key={t} className="flex items-center gap-2">
                    <input type="radio" name="combatantType" checked={newCombatant.combatantType === t} onChange={() => setNewCombatant(prev => ({ ...prev, combatantType: t, isAlly: t !== 'enemy' }))} className="w-4 h-4" />
                    <span className={cn('text-sm font-medium', t === 'ally' ? 'text-blue-700 dark:text-blue-300' : t === 'enemy' ? 'text-red-700 dark:text-red-300' : 'text-violet-700 dark:text-violet-300')}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </span>
                  </label>
                ))}
              </div>
              <Checkbox checked={newCombatant.isSurprised} onChange={(e) => setNewCombatant(prev => ({ ...prev, isSurprised: e.target.checked }))} label="Surprised (goes last in round 1)" />
              <Button onClick={addCombatant} disabled={!newCombatant.name.trim()} className="w-full font-bold">Add Creature</Button>
            </div>
          </div>

          {/* Conditions Reference */}
          <div className="bg-surface rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Conditions Reference</h3>
            <div className="flex flex-wrap gap-1">
              {CONDITION_OPTIONS.map(condition => (
                <span key={condition.name} title={condition.description} className={cn('px-2 py-1 text-xs rounded-full cursor-help', condition.leveled ? 'bg-companion-light text-companion-text' : 'bg-surface-alt text-text-secondary')}>
                  {condition.name}{condition.leveled && ' \u2B07'}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add From Library/Campaign Modal */}
      {showAddModal && (
        <AddCombatantModal
          onClose={() => setShowAddModal(false)}
          onAdd={addCombatantsFromModal}
          mode="combat"
        />
      )}

      <RollLog viewOnlyCampaignId={encounter.campaignId} />
    </PageContainer>
    </RollProvider>
  );
}
