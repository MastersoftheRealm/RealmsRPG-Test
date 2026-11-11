/**
 * Skill encounter view state + handlers (TASK-608)
 * ================================================
 * Co-located hook for SkillEncounterView — presentation lives in sibling panels.
 */

'use client';

import { useState, useCallback, useMemo, DragEvent } from 'react';
import { useCodexSkills } from '@/hooks';
import { computeSkillRollResult } from '@/lib/game/encounter-utils';
import {
  filterDuplicateCampaignCharacterEntries,
  getCampaignCharacterIds,
} from '@/lib/encounter/unique-campaign-characters';
import type {
  Encounter,
  SkillParticipant,
  SkillEncounterState,
  TrackedCombatant,
  SkillParticipantType,
} from '@/types/encounter';
import type { Campaign } from '@/types/campaign';
import { generateId, rollInitiative } from '../encounter-view-helpers';
import type { SkillEncounterViewProps } from './skill-encounter-view-props';

type EncounterWithSkillEncounter = Encounter & {
  skillEncounter: SkillEncounterState;
};

export function useSkillEncounterView({
  encounter,
  setEncounter,
  campaignsFull,
  showRollLog = true,
  isMixedEncounter = false,
}: SkillEncounterViewProps & { encounter: EncounterWithSkillEncounter }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [addingAllChars, setAddingAllChars] = useState(false);
  const { data: codexSkills = [] } = useCodexSkills();

  const skill = encounter.skillEncounter;
  const additionalSuccesses = skill.additionalSuccesses ?? 0;
  const additionalFailures = skill.additionalFailures ?? 0;

  // Derive roll totals from participants so display never drifts from actual rolls
  const { derivedRollSuccesses, derivedRollFailures } = useMemo(() => {
    let s = 0;
    let f = 0;
    for (const p of skill.participants) {
      if (p.hasRolled && !p.isHelping) {
        s += p.successCount ?? 0;
        f += p.failureCount ?? 0;
      }
    }
    return { derivedRollSuccesses: s, derivedRollFailures: f };
  }, [skill.participants]);
  const totalSuccesses = derivedRollSuccesses + additionalSuccesses;
  const totalFailures = derivedRollFailures + additionalFailures;
  const requiredSuccesses = Math.max(1, skill.requiredSuccesses ?? skill.participants.length + 1);
  const maxFailures = Math.max(1, skill.maxFailures ?? 3);
  const encounterOutcome: 'success' | 'failure' | 'in-progress' =
    totalSuccesses >= requiredSuccesses
      ? 'success'
      : totalFailures >= maxFailures
        ? 'failure'
        : 'in-progress';

  const sequenceSuccesses = skill.sequenceSuccesses ?? 0;
  const sequenceFailures = skill.sequenceFailures ?? 0;

  const updateSkill = useCallback(
    (updates: Partial<SkillEncounterState>) => {
      setEncounter((prev) => {
        if (!prev || !prev.skillEncounter) return prev;
        return {
          ...prev,
          skillEncounter: { ...prev.skillEncounter, ...updates },
        };
      });
    },
    [setEncounter],
  );

  const addParticipant = () => {
    if (!newParticipantName.trim()) return;
    const useInit = skill.useInitiative ?? false;
    const participant: SkillParticipant = {
      id: generateId(),
      name: newParticipantName.trim(),
      hasRolled: false,
      sourceType: 'manual',
      ...(useInit && {
        initiative: rollInitiative(0),
        participantType: 'ally' as const,
      }),
    };
    updateSkill({ participants: [...skill.participants, participant] });
    setNewParticipantName('');
  };

  const addParticipantsFromModal = (newParticipants: SkillParticipant[]) => {
    const useInit = skill.useInitiative ?? false;
    const withInit = useInit
      ? newParticipants.map((p) => ({
          ...p,
          initiative: p.initiative ?? rollInitiative(0),
          participantType: p.participantType ?? ('ally' as const),
        }))
      : newParticipants;
    const participants = filterDuplicateCampaignCharacterEntries(withInit, skill.participants);
    if (participants.length > 0) {
      updateSkill({ participants: [...skill.participants, ...participants] });
    }
    setShowAddModal(false);
  };

  const linkedCampaign = encounter.campaignId
    ? campaignsFull.find((c: Campaign) => c.id === encounter.campaignId)
    : undefined;
  const existingCampaignCharacterIds = useMemo(
    () => getCampaignCharacterIds(skill.participants),
    [skill.participants],
  );
  const availableCampaignCharacters = useMemo(
    () =>
      (linkedCampaign?.characters ?? []).filter(
        (c) => !existingCampaignCharacterIds.has(c.characterId),
      ),
    [existingCampaignCharacterIds, linkedCampaign?.characters],
  );

  const addAllCampaignCharacters = useCallback(async () => {
    if (!encounter.campaignId || availableCampaignCharacters.length === 0) return;
    setAddingAllChars(true);
    try {
      const useInit = skill.useInitiative ?? false;
      const participants: SkillParticipant[] = availableCampaignCharacters.map(
        (c: { userId: string; characterId: string; characterName: string }) => ({
          id: generateId(),
          name: c.characterName,
          hasRolled: false,
          sourceType: 'campaign-character' as const,
          sourceId: c.characterId,
          sourceUserId: c.userId,
          ...(useInit && {
            initiative: rollInitiative(0),
            participantType: 'ally' as const,
          }),
        }),
      );
      const newParticipants = filterDuplicateCampaignCharacterEntries(
        participants,
        skill.participants,
      );
      if (newParticipants.length > 0) {
        updateSkill({ participants: [...skill.participants, ...newParticipants] });
      }
    } finally {
      setAddingAllChars(false);
    }
  }, [
    availableCampaignCharacters,
    encounter.campaignId,
    skill.participants,
    skill.useInitiative,
    updateSkill,
  ]);

  const addCombatantsAsParticipants = (combatants: TrackedCombatant[]) => {
    const useInit = skill.useInitiative ?? false;
    const participants: SkillParticipant[] = combatants.map((c) => ({
      id: c.id,
      name: c.name,
      hasRolled: false,
      sourceType: c.sourceType,
      sourceId: c.sourceId,
      ...(useInit && {
        initiative: rollInitiative(c.acuity ?? 0),
        participantType: c.isAlly ? ('ally' as const) : ('enemy' as const),
      }),
    }));
    const newParticipants = filterDuplicateCampaignCharacterEntries(
      participants,
      skill.participants,
    );
    if (newParticipants.length > 0) {
      updateSkill({ participants: [...skill.participants, ...newParticipants] });
    }
    setShowAddModal(false);
  };

  /** In mixed encounter: copy all combat encounter combatants into skill participants, keeping initiative and ally/enemy. */
  const copyCombatantsToSkill = useCallback(() => {
    if (!encounter.combatants.length) return;
    const existingIds = new Set(skill.participants.map((p) => p.id));
    const combatants = encounter.combatants as TrackedCombatant[];
    const toAdd = filterDuplicateCampaignCharacterEntries(
      combatants.filter((c) => !existingIds.has(c.id)),
      skill.participants,
    );
    if (toAdd.length === 0) return;
    const participants: SkillParticipant[] = toAdd.map((c) => ({
      id: c.id,
      name: c.name,
      hasRolled: false,
      sourceType: c.sourceType,
      sourceId: c.sourceId,
      sourceUserId: c.sourceUserId,
      initiative: c.initiative,
      participantType: c.isAlly ? ('ally' as const) : ('enemy' as const),
    }));
    updateSkill({
      useInitiative: skill.useInitiative ?? true,
      participants: [...skill.participants, ...participants],
    });
  }, [encounter.combatants, skill, updateSkill]);

  const removeParticipant = (id: string) => {
    const p = skill.participants.find((x) => x.id === id);
    let dSuccesses = 0;
    let dFailures = 0;
    if (p && p.hasRolled && !p.isHelping) {
      dSuccesses = p.successCount ?? 0;
      dFailures = p.failureCount ?? 0;
    }
    updateSkill({
      participants: skill.participants.filter((x) => x.id !== id),
      currentSuccesses: Math.max(0, skill.currentSuccesses - dSuccesses),
      currentFailures: Math.max(0, skill.currentFailures - dFailures),
    });
  };

  const updateParticipantRoll = (id: string, rollValue: number, rmBonus?: number) => {
    const effectiveRoll = rollValue + (rmBonus ?? 0);
    const { successes, failures } = computeSkillRollResult(effectiveRoll, skill.difficultyScore);
    const prev = skill.participants.find((p) => p.id === id);
    const prevSuccess = prev?.successCount ?? 0;
    const prevFail = prev?.failureCount ?? 0;
    const deltaSuccess = successes - prevSuccess;
    const deltaFail = failures - prevFail;
    const updatedParticipants = skill.participants.map((p) => {
      if (p.id !== id) return p;
      return {
        ...p,
        rollValue,
        successCount: successes,
        failureCount: failures,
        isSuccess: successes > 0,
        hasRolled: true,
      };
    });
    updateSkill({
      participants: updatedParticipants,
      currentSuccesses: Math.max(0, skill.currentSuccesses + deltaSuccess),
      currentFailures: Math.max(0, skill.currentFailures + deltaFail),
    });
  };

  const updateParticipantRmBonus = (id: string, rmBonus: number | undefined) => {
    const p = skill.participants.find((x) => x.id === id);
    if (!p) return;
    const updatedParticipants = skill.participants.map((x) =>
      x.id !== id ? x : { ...x, rmBonus },
    );
    if (p.hasRolled && p.rollValue != null) {
      const effectiveRoll = p.rollValue + (rmBonus ?? 0);
      const { successes, failures } = computeSkillRollResult(effectiveRoll, skill.difficultyScore);
      const prevSuccess = p.successCount ?? 0;
      const prevFail = p.failureCount ?? 0;
      const deltaSuccess = successes - prevSuccess;
      const deltaFail = failures - prevFail;
      const finalParticipants = updatedParticipants.map((x) =>
        x.id !== id
          ? x
          : {
              ...x,
              successCount: successes,
              failureCount: failures,
              isSuccess: successes > 0,
            },
      );
      updateSkill({
        participants: finalParticipants,
        currentSuccesses: Math.max(0, skill.currentSuccesses + deltaSuccess),
        currentFailures: Math.max(0, skill.currentFailures + deltaFail),
      });
    } else {
      updateSkill({ participants: updatedParticipants });
    }
  };

  const recomputeParticipantRollsFromDs = (newDs?: number) => {
    const ds = newDs ?? skill.difficultyScore;
    const updated = skill.participants.map((p) => {
      if (!p.hasRolled || p.rollValue == null || p.isHelping) return p;
      const effectiveRoll = p.rollValue + (p.rmBonus ?? 0);
      const { successes, failures } = computeSkillRollResult(effectiveRoll, ds);
      return {
        ...p,
        successCount: successes,
        failureCount: failures,
        isSuccess: successes > 0,
      };
    });
    const newSuccesses = updated.reduce((s, p) => s + (p.isHelping ? 0 : (p.successCount ?? 0)), 0);
    const newFailures = updated.reduce((s, p) => s + (p.isHelping ? 0 : (p.failureCount ?? 0)), 0);
    updateSkill({
      participants: updated,
      currentSuccesses: newSuccesses,
      currentFailures: newFailures,
    });
  };

  const updateParticipantRollOnly = (id: string, rollValue: number) => {
    const p = skill.participants.find((x) => x.id === id);
    if (!p) return;
    updateParticipantRoll(id, rollValue, p.rmBonus);
  };

  const updateParticipantSkill = (id: string, skillUsed: string) => {
    updateSkill({
      participants: skill.participants.map((p) => (p.id === id ? { ...p, skillUsed } : p)),
    });
  };

  const setParticipantHelping = (id: string, isHelping: boolean) => {
    const p = skill.participants.find((x) => x.id === id);
    if (!p) return;
    let dSuccesses = 0;
    let dFailures = 0;
    if (p.hasRolled && !p.isHelping) {
      dSuccesses = p.successCount ?? 0;
      dFailures = p.failureCount ?? 0;
    }
    if (isHelping) {
      updateSkill({
        participants: skill.participants.map((x) => (x.id === id ? { ...x, isHelping: true } : x)),
        currentSuccesses: Math.max(0, skill.currentSuccesses - dSuccesses),
        currentFailures: Math.max(0, skill.currentFailures - dFailures),
      });
    } else {
      const effectiveRoll = (p.rollValue ?? 0) + (p.rmBonus ?? 0);
      const { successes, failures } = computeSkillRollResult(effectiveRoll, skill.difficultyScore);
      updateSkill({
        participants: skill.participants.map((x) => (x.id === id ? { ...x, isHelping: false } : x)),
        currentSuccesses: skill.currentSuccesses + successes,
        currentFailures: skill.currentFailures + failures,
      });
    }
  };

  const clearParticipantRoll = (id: string) => {
    const p = skill.participants.find((x) => x.id === id);
    const dSuccesses = p?.hasRolled && !p?.isHelping ? (p.successCount ?? 0) : 0;
    const dFailures = p?.hasRolled && !p?.isHelping ? (p.failureCount ?? 0) : 0;
    const updatedParticipants = skill.participants.map((x) => {
      if (x.id !== id) return x;
      return {
        ...x,
        rollValue: undefined,
        successCount: undefined,
        failureCount: undefined,
        isSuccess: undefined,
        hasRolled: false,
      };
    });
    updateSkill({
      participants: updatedParticipants,
      currentSuccesses: Math.max(0, skill.currentSuccesses - dSuccesses),
      currentFailures: Math.max(0, skill.currentFailures - dFailures),
    });
  };

  const resetEncounter = () => {
    updateSkill({
      participants: skill.participants.map((p) => ({
        ...p,
        rollValue: undefined,
        successCount: undefined,
        failureCount: undefined,
        isSuccess: undefined,
        hasRolled: false,
        isHelping: false,
      })),
      currentSuccesses: 0,
      currentFailures: 0,
      additionalSuccesses: 0,
      additionalFailures: 0,
    });
  };

  const useInitiative = skill.useInitiative ?? false;
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
  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>, id: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
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
        if (!prev?.skillEncounter) return prev;
        const participants = [...prev.skillEncounter.participants];
        const draggedIndex = participants.findIndex((p) => p.id === draggedId);
        const targetIndex = participants.findIndex((p) => p.id === targetId);
        if (draggedIndex === -1 || targetIndex === -1) return prev;
        const dragged = participants.splice(draggedIndex, 1)[0];
        if (!dragged) return prev;
        participants.splice(targetIndex, 0, dragged);
        return {
          ...prev,
          skillEncounter: { ...prev.skillEncounter, participants },
        };
      });
      setDraggedId(null);
      setDragOverId(null);
    },
    [draggedId, setEncounter],
  );

  const sortedParticipants = useMemo(() => {
    if (!skill.participants.length) return [];
    if (!useInitiative) return skill.participants;
    const list = [...skill.participants];
    list.sort((a, b) => (b.initiative ?? 0) - (a.initiative ?? 0));
    return list;
  }, [skill.participants, useInitiative]);

  const updateParticipantInitiative = (id: string, initiative: number) => {
    updateSkill({
      participants: skill.participants.map((p) => (p.id === id ? { ...p, initiative } : p)),
    });
  };
  const updateParticipantType = (id: string, participantType: SkillParticipantType) => {
    updateSkill({
      participants: skill.participants.map((p) => (p.id === id ? { ...p, participantType } : p)),
    });
  };
  const rollInitiativeForParticipant = (id: string) => {
    const initiative = rollInitiative(0);
    updateParticipantInitiative(id, initiative);
  };
  const sortByInitiative = () => {
    const list = [...skill.participants];
    list.sort((a, b) => (b.initiative ?? 0) - (a.initiative ?? 0));
    updateSkill({ participants: list });
  };

  // Combat turn order (same logic as CombatEncounterView) for "Sync with combat order" in mixed mode
  const combatTurnOrder = useMemo(() => {
    if (!isMixedEncounter || !encounter.combatants.length) return [];
    const combatants = encounter.combatants as TrackedCombatant[];
    const sortFn = (a: TrackedCombatant, b: TrackedCombatant) => {
      if (b.initiative !== a.initiative) return b.initiative - a.initiative;
      return (b.acuity ?? 0) - (a.acuity ?? 0);
    };
    const companions = combatants.filter((c) => c.combatantType === 'companion').sort(sortFn);
    const nonCompanions = combatants.filter((c) => c.combatantType !== 'companion');
    if (encounter.round === 1) {
      const notSurprised = nonCompanions.filter((c) => !c.isSurprised).sort(sortFn);
      const surprised = nonCompanions.filter((c) => c.isSurprised).sort(sortFn);
      return [...notSurprised, ...surprised, ...companions];
    }
    return [...nonCompanions.sort(sortFn), ...companions];
  }, [isMixedEncounter, encounter.combatants, encounter.round]);

  const syncWithCombatOrder = useCallback(() => {
    if (combatTurnOrder.length === 0) return;
    const used = new Set<string>();
    const ordered: SkillParticipant[] = [];
    for (const combatant of combatTurnOrder) {
      const c = combatant as TrackedCombatant;
      const match = skill.participants.find(
        (p) =>
          !used.has(p.id) &&
          (p.id === c.id || // same id when copied from combat
            p.name === c.name ||
            (p.sourceId && c.sourceId && p.sourceId === c.sourceId)),
      );
      if (match) {
        ordered.push(match);
        used.add(match.id);
      }
    }
    const rest = skill.participants.filter((p) => !used.has(p.id));
    updateSkill({ participants: [...ordered, ...rest] });
  }, [skill, combatTurnOrder, updateSkill]);

  return {
    encounter,
    setEncounter,
    campaignsFull,
    showRollLog,
    isMixedEncounter,
    showAddModal,
    setShowAddModal,
    newParticipantName,
    setNewParticipantName,
    addingAllChars,
    codexSkills,
    skill,
    additionalSuccesses,
    additionalFailures,
    derivedRollSuccesses,
    derivedRollFailures,
    requiredSuccesses,
    maxFailures,
    encounterOutcome,
    sequenceSuccesses,
    sequenceFailures,
    updateSkill,
    addParticipant,
    addParticipantsFromModal,
    linkedCampaign,
    existingCampaignCharacterIds,
    availableCampaignCharacters,
    addAllCampaignCharacters,
    addCombatantsAsParticipants,
    copyCombatantsToSkill,
    removeParticipant,
    updateParticipantRmBonus,
    recomputeParticipantRollsFromDs,
    updateParticipantRollOnly,
    updateParticipantSkill,
    setParticipantHelping,
    clearParticipantRoll,
    resetEncounter,
    useInitiative,
    draggedId,
    dragOverId,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    sortedParticipants,
    updateParticipantType,
    rollInitiativeForParticipant,
    sortByInitiative,
    combatTurnOrder,
    syncWithCombatOrder,
  };
}
