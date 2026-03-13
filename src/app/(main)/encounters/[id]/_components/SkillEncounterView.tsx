/**
 * Skill Encounter View
 * =====================
 * Shared view containing all skill encounter logic and UI.
 * Used by skill/page.tsx and mixed/page.tsx (tab). No PageContainer, header, or loading—parent provides those.
 * Per GAME_RULES: roll >= DS = 1 + floor((roll-DS)/5) successes; roll < DS = 1 + floor((DS-roll)/5) failures.
 */

'use client';

import { useState, useCallback, useMemo, DragEvent, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Brain,
  Plus,
  Trash2,
  RotateCcw,
  Users,
  HandHelping,
  GripVertical,
  ListOrdered,
  Swords,
} from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { ValueStepper } from '@/components/shared';
import { useCodexSkills } from '@/hooks';
import { AddCombatantModal } from '@/components/shared/add-combatant-modal';
import { RollLog } from '@/components/character-sheet';
import { computeSkillRollResult } from '@/lib/game/encounter-utils';
import type { Encounter, SkillParticipant, SkillEncounterState, TrackedCombatant, SkillParticipantType } from '@/types/encounter';
import type { Campaign } from '@/types/campaign';

function rollInitiative(acuity: number = 0): number {
  return Math.floor(Math.random() * 20) + 1 + acuity;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export interface SkillEncounterViewProps {
  encounterId: string;
  encounter: Encounter | null;
  setEncounter: React.Dispatch<React.SetStateAction<Encounter | null>>;
  campaignsFull: Campaign[];
  showRollLog?: boolean;
  /** When true (mixed encounter), initiative defaults on and "Sync with combat order" is shown */
  isMixedEncounter?: boolean;
}

export default function SkillEncounterView({
  encounter,
  setEncounter,
  campaignsFull,
  showRollLog = true,
  isMixedEncounter = false,
}: SkillEncounterViewProps) {
  if (encounter === null || encounter.skillEncounter === undefined) return null;

  const [showAddModal, setShowAddModal] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [addingAllChars, setAddingAllChars] = useState(false);
  const { data: codexSkills = [] } = useCodexSkills();

  const skill = encounter.skillEncounter;
  const additionalSuccesses = skill?.additionalSuccesses ?? 0;
  const additionalFailures = skill?.additionalFailures ?? 0;

  // Derive roll totals from participants so display never drifts from actual rolls
  const { derivedRollSuccesses, derivedRollFailures } = useMemo(() => {
    if (!skill) return { derivedRollSuccesses: 0, derivedRollFailures: 0 };
    let s = 0;
    let f = 0;
    for (const p of skill.participants) {
      if (p.hasRolled && !p.isHelping) {
        s += p.successCount ?? 0;
        f += p.failureCount ?? 0;
      }
    }
    return { derivedRollSuccesses: s, derivedRollFailures: f };
  }, [skill?.participants]);
  const totalSuccesses = derivedRollSuccesses + additionalSuccesses;
  const totalFailures = derivedRollFailures + additionalFailures;
  const requiredSuccesses = Math.max(1, skill?.requiredSuccesses ?? (skill?.participants.length ?? 0) + 1);
  const maxFailures = Math.max(1, skill?.maxFailures ?? 3);
  const encounterOutcome =
    totalSuccesses >= requiredSuccesses
      ? 'success'
      : totalFailures >= maxFailures
        ? 'failure'
        : 'in-progress';

  const sequenceSuccesses = skill?.sequenceSuccesses ?? 0;
  const sequenceFailures = skill?.sequenceFailures ?? 0;

  const updateSkill = useCallback(
    (updates: Partial<SkillEncounterState>) => {
      setEncounter((prev) => {
        if (!prev || !prev.skillEncounter) return prev;
        return { ...prev, skillEncounter: { ...prev.skillEncounter, ...updates } };
      });
    },
    [setEncounter]
  );

  const addParticipant = () => {
    if (!newParticipantName.trim()) return;
    const useInit = skill?.useInitiative ?? false;
    const participant: SkillParticipant = {
      id: generateId(),
      name: newParticipantName.trim(),
      hasRolled: false,
      sourceType: 'manual',
      ...(useInit && { initiative: rollInitiative(0), participantType: 'ally' as const }),
    };
    updateSkill({ participants: [...(skill?.participants || []), participant] });
    setNewParticipantName('');
  };

  const addParticipantsFromModal = (newParticipants: SkillParticipant[]) => {
    const useInit = skill?.useInitiative ?? false;
    const withInit = useInit
      ? newParticipants.map((p) => ({ ...p, initiative: p.initiative ?? rollInitiative(0), participantType: p.participantType ?? ('ally' as const) }))
      : newParticipants;
    updateSkill({ participants: [...(skill?.participants || []), ...withInit] });
    setShowAddModal(false);
  };

  const linkedCampaign = encounter?.campaignId
    ? campaignsFull.find((c: Campaign) => c.id === encounter.campaignId)
    : undefined;

  const addAllCampaignCharacters = useCallback(async () => {
    if (!encounter?.campaignId || !linkedCampaign?.characters?.length) return;
    setAddingAllChars(true);
    try {
      const useInit = skill?.useInitiative ?? false;
      const participants: SkillParticipant[] = linkedCampaign.characters.map(
        (c: { userId: string; characterId: string; characterName: string }) => ({
          id: generateId(),
          name: c.characterName,
          hasRolled: false,
          sourceType: 'campaign-character' as const,
          sourceId: c.characterId,
          ...(useInit && { initiative: rollInitiative(0), participantType: 'ally' as const }),
        })
      );
      updateSkill({ participants: [...(skill?.participants || []), ...participants] });
    } finally {
      setAddingAllChars(false);
    }
  }, [encounter?.campaignId, linkedCampaign, skill?.participants, skill?.useInitiative, updateSkill]);

  const addCombatantsAsParticipants = (combatants: TrackedCombatant[]) => {
    const useInit = skill?.useInitiative ?? false;
    const participants: SkillParticipant[] = combatants.map((c) => ({
      id: c.id,
      name: c.name,
      hasRolled: false,
      sourceType: c.sourceType,
      sourceId: c.sourceId,
      ...(useInit && { initiative: rollInitiative(c.acuity ?? 0), participantType: c.isAlly ? ('ally' as const) : ('enemy' as const) }),
    }));
    updateSkill({ participants: [...(skill?.participants || []), ...participants] });
    setShowAddModal(false);
  };

  /** In mixed encounter: copy all combat encounter combatants into skill participants, keeping initiative and ally/enemy. */
  const copyCombatantsToSkill = useCallback(() => {
    if (!encounter?.combatants?.length || !skill) return;
    const existingIds = new Set(skill.participants.map((p) => p.id));
    const combatants = encounter.combatants as TrackedCombatant[];
    const toAdd = combatants.filter((c) => !existingIds.has(c.id));
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
  }, [encounter?.combatants, skill, updateSkill]);

  const removeParticipant = (id: string) => {
    if (!skill) return;
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
    if (!skill) return;
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
    if (!skill) return;
    const p = skill.participants.find((x) => x.id === id);
    if (!p) return;
    const updatedParticipants = skill.participants.map((x) =>
      x.id !== id ? x : { ...x, rmBonus }
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
            }
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
    if (!skill) return;
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
    const newSuccesses = updated.reduce((s, p) => s + (p.isHelping ? 0 : p.successCount ?? 0), 0);
    const newFailures = updated.reduce((s, p) => s + (p.isHelping ? 0 : p.failureCount ?? 0), 0);
    updateSkill({ participants: updated, currentSuccesses: newSuccesses, currentFailures: newFailures });
  };

  const updateParticipantRollOnly = (id: string, rollValue: number) => {
    const p = skill?.participants.find((x) => x.id === id);
    if (!skill || !p) return;
    updateParticipantRoll(id, rollValue, p.rmBonus);
  };

  const updateParticipantSkill = (id: string, skillUsed: string) => {
    if (!skill) return;
    updateSkill({
      participants: skill.participants.map((p) => (p.id === id ? { ...p, skillUsed } : p)),
    });
  };

  const setParticipantHelping = (id: string, isHelping: boolean) => {
    if (!skill) return;
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
    if (!skill) return;
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
    if (!skill) return;
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

  const useInitiative = skill?.useInitiative ?? false;
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
        const [dragged] = participants.splice(draggedIndex, 1);
        participants.splice(targetIndex, 0, dragged);
        return { ...prev, skillEncounter: { ...prev.skillEncounter, participants } };
      });
      setDraggedId(null);
      setDragOverId(null);
    },
    [draggedId, setEncounter]
  );

  const sortedParticipants = useMemo(() => {
    if (!skill?.participants.length) return [];
    if (!useInitiative) return skill.participants;
    const list = [...skill.participants];
    list.sort((a, b) => (b.initiative ?? 0) - (a.initiative ?? 0));
    return list;
  }, [skill?.participants, useInitiative]);

  const updateParticipantInitiative = (id: string, initiative: number) => {
    if (!skill) return;
    updateSkill({
      participants: skill.participants.map((p) => (p.id === id ? { ...p, initiative } : p)),
    });
  };
  const updateParticipantType = (id: string, participantType: SkillParticipantType) => {
    if (!skill) return;
    updateSkill({
      participants: skill.participants.map((p) => (p.id === id ? { ...p, participantType } : p)),
    });
  };
  const rollInitiativeForParticipant = (id: string) => {
    if (!skill) return;
    const p = skill.participants.find((x) => x.id === id);
    const initiative = rollInitiative(0);
    updateParticipantInitiative(id, initiative);
  };
  const sortByInitiative = () => {
    if (!skill) return;
    const list = [...skill.participants];
    list.sort((a, b) => (b.initiative ?? 0) - (a.initiative ?? 0));
    updateSkill({ participants: list });
  };

  // Combat turn order (same logic as CombatEncounterView) for "Sync with combat order" in mixed mode
  const combatTurnOrder = useMemo(() => {
    if (!isMixedEncounter || !encounter?.combatants?.length) return [];
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
  }, [isMixedEncounter, encounter?.combatants, encounter?.round]);

  const syncWithCombatOrder = useCallback(() => {
    if (!skill || combatTurnOrder.length === 0) return;
    const used = new Set<string>();
    const ordered: SkillParticipant[] = [];
    for (const combatant of combatTurnOrder) {
      const c = combatant as TrackedCombatant;
      const match = skill.participants.find(
        (p) =>
          !used.has(p.id) &&
          (p.id === c.id || // same id when copied from combat
            p.name === c.name ||
            (p.sourceId && c.sourceId && p.sourceId === c.sourceId))
      );
      if (match) {
        ordered.push(match);
        used.add(match.id);
      }
    }
    const rest = skill.participants.filter((p) => !used.has(p.id));
    updateSkill({ participants: [...ordered, ...rest] });
  }, [skill, combatTurnOrder, updateSkill]);

  return (
    <>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-surface rounded-xl border border-border-light p-4">
            <h2 className="text-sm font-semibold text-text-secondary mb-3">Successes</h2>
            <SuccessFailureTracker
              rollSuccesses={derivedRollSuccesses}
              rollFailures={derivedRollFailures}
              additionalSuccesses={additionalSuccesses}
              additionalFailures={additionalFailures}
              requiredSuccesses={requiredSuccesses}
              maxFailures={maxFailures}
              outcome={encounterOutcome}
            />
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              <div className="flex items-center justify-between gap-2 rounded-lg border border-border-light px-3 py-2">
                <span className="text-sm text-text-secondary">Additional Successes</span>
                <ValueStepper
                  value={additionalSuccesses}
                  onChange={(v) => updateSkill({ additionalSuccesses: Math.max(0, v) })}
                  min={0}
                  max={99}
                  size="sm"
                  enableHoldRepeat
                />
              </div>
              <div className="flex items-center justify-between gap-2 rounded-lg border border-border-light px-3 py-2">
                <span className="text-sm text-text-secondary">Additional Failures</span>
                <ValueStepper
                  value={additionalFailures}
                  onChange={(v) => updateSkill({ additionalFailures: Math.max(0, v) })}
                  min={0}
                  max={99}
                  size="sm"
                  enableHoldRepeat
                />
              </div>
            </div>
          </div>

          {/* Sequence tracker: manual S/F across multiple skill encounters */}
          <div className="bg-surface rounded-xl border border-border-light p-4">
            <h2 className="text-sm font-semibold text-text-secondary mb-2 flex items-center gap-2">
              <ListOrdered className="w-4 h-4" /> Sequence
            </h2>
            <p className="text-xs text-text-muted dark:text-text-secondary mb-2">
              Track total successes/failures across multiple skill encounters in a sequence.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-secondary">Successes:</span>
                <ValueStepper
                  value={sequenceSuccesses}
                  onChange={(v) => updateSkill({ sequenceSuccesses: Math.max(0, v) })}
                  min={0}
                  max={99}
                  size="sm"
                  enableHoldRepeat
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-secondary">Failures:</span>
                <ValueStepper
                  value={sequenceFailures}
                  onChange={(v) => updateSkill({ sequenceFailures: Math.max(0, v) })}
                  min={0}
                  max={99}
                  size="sm"
                  enableHoldRepeat
                />
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border-light p-4 flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={resetEncounter} aria-label="Reset skill encounter (clear all rolls and totals)">
              <RotateCcw className="w-4 h-4" /> Reset
            </Button>
            <div className="ml-auto text-sm text-text-muted dark:text-text-secondary">
              {skill.participants.length} participant{skill.participants.length !== 1 ? 's' : ''}
              {' · '}
              {skill.participants.filter((p) => p.hasRolled || p.isHelping).length} acted
            </div>
          </div>

          <div className="space-y-3">
            {sortedParticipants.length === 0 ? (
              <div className="bg-surface rounded-xl border border-border-light p-8 text-center text-text-muted dark:text-text-secondary">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No participants yet. Add characters using the panel on the right.</p>
              </div>
            ) : (
              sortedParticipants.map((p) => (
                <ParticipantCard
                  key={p.id}
                  participant={p}
                  ds={skill.difficultyScore}
                  codexSkills={codexSkills}
                  useInitiative={useInitiative}
                  isDragOver={dragOverId === p.id}
                  isDragging={draggedId === p.id}
                  onUpdateRoll={(val) => updateParticipantRollOnly(p.id, val)}
                  onUpdateSkill={(s) => updateParticipantSkill(p.id, s)}
                  onUpdateRmBonus={(v) => updateParticipantRmBonus(p.id, v)}
                  onClearRoll={() => clearParticipantRoll(p.id)}
                  onSetHelping={(v) => setParticipantHelping(p.id, v)}
                  onRemove={() => removeParticipant(p.id)}
                  onUpdateInitiative={(v) => updateParticipantInitiative(p.id, v)}
                  onUpdateParticipantType={(t) => updateParticipantType(p.id, t)}
                  onRollInitiative={() => rollInitiativeForParticipant(p.id)}
                  onDragStart={(e) => handleDragStart(e, p.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, p.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, p.id)}
                />
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface rounded-xl border border-border-light p-6">
            <h2 className="font-bold text-text-primary mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-500" /> Configuration
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Difficulty Score (DS)</label>
                <ValueStepper
                  value={skill.difficultyScore}
                  onChange={(val) => {
                    updateSkill({ difficultyScore: val });
                    recomputeParticipantRollsFromDs(val);
                  }}
                  min={1}
                  max={40}
                  size="sm"
                  enableHoldRepeat
                />
                <p className="text-xs text-text-muted dark:text-text-secondary mt-1">
                  Roll ≥ DS = success. Each 5 over/under adds extra success/failure.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Required Successes</label>
                <ValueStepper
                  value={requiredSuccesses}
                  onChange={(val) => updateSkill({ requiredSuccesses: Math.max(1, val) })}
                  min={1}
                  max={99}
                  size="sm"
                  enableHoldRepeat
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Maximum Failures</label>
                <ValueStepper
                  value={maxFailures}
                  onChange={(val) => updateSkill({ maxFailures: Math.max(1, val) })}
                  min={1}
                  max={99}
                  size="sm"
                  enableHoldRepeat
                />
              </div>
              <div>
                <label htmlFor="encounter-description" className="block text-sm font-medium text-text-secondary mb-1">
                  Encounter Description
                </label>
                <textarea
                  id="encounter-description"
                  value={encounter.description ?? ''}
                  onChange={(e) => setEncounter((prev) => (prev ? { ...prev, description: e.target.value } : prev))}
                  placeholder="Rewards, penalties, context, and skill bonus notes..."
                  className="w-full rounded-lg border border-border-light bg-background px-3 py-2 text-sm text-text-primary focus:border-primary-500 focus:outline-none min-h-[96px]"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useInitiative}
                  onChange={(e) => updateSkill({ useInitiative: e.target.checked })}
                  className="rounded border-border-light"
                  aria-label="Track turns / use initiative"
                />
                <span className="text-sm font-medium text-text-secondary">Track turns / use initiative</span>
              </label>
              {useInitiative && (
                <Button variant="secondary" size="sm" onClick={sortByInitiative} aria-label="Sort participants by initiative">
                  <GripVertical className="w-4 h-4" /> Sort Initiative
                </Button>
              )}
              {isMixedEncounter && useInitiative && combatTurnOrder.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={syncWithCombatOrder}
                  aria-label="Sync participant order with combat turn order"
                  title="Reorder skill participants to match combat turn order (by name or character)"
                >
                  <Swords className="w-4 h-4" /> Sync with combat order
                </Button>
              )}
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border-light p-6">
            <h2 className="font-bold text-text-primary mb-4">Add Participants</h2>
            {isMixedEncounter && encounter?.combatants?.length ? (() => {
              const combatants = encounter.combatants as TrackedCombatant[];
              const existingIds = new Set(skill?.participants.map((p) => p.id) ?? []);
              const notYetAdded = combatants.filter((c) => !existingIds.has(c.id)).length;
              return (
                <Button
                  variant="secondary"
                  className="w-full mb-4"
                  onClick={copyCombatantsToSkill}
                  disabled={notYetAdded === 0}
                  aria-label="Copy combat encounter combatants to skill participants (keeps initiative and ally/enemy)"
                  title={notYetAdded === 0 ? 'All combatants are already in the skill encounter.' : 'Add everyone from the combat tab as skill participants, with their initiative and side (ally/enemy) preserved.'}
                >
                  <Swords className="w-4 h-4" /> Copy combatants from combat encounter
                  {notYetAdded > 0 && ` (${notYetAdded})`}
                </Button>
              );
            })() : null}
            <div className="mb-4 space-y-2">
              <label htmlFor="skill-encounter-campaign" className="block text-sm font-medium text-text-secondary">Campaign</label>
              <select
                id="skill-encounter-campaign"
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
                  disabled={addingAllChars}
                >
                  {addingAllChars ? 'Adding…' : `Add all Characters (${linkedCampaign.characters?.length ?? 0})`}
                </Button>
              )}
            </div>
            <Button variant="secondary" className="w-full mb-4" onClick={() => setShowAddModal(true)}>
              From Library / Campaign
            </Button>
            <div className="flex gap-2">
              <Input
                value={newParticipantName}
                onChange={(e) => setNewParticipantName(e.target.value)}
                placeholder="Character name..."
                onKeyDown={(e) => e.key === 'Enter' && addParticipant()}
              />
              <Button onClick={addParticipant} disabled={!newParticipantName.trim()} aria-label="Add participant">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border-light p-6">
            <h2 className="font-bold text-text-primary mb-3">Quick Reference</h2>
            <div className="space-y-2 text-xs text-text-muted dark:text-text-secondary">
              <p>
                <strong className="text-text-secondary">Required Successes:</strong>{' '}
                {requiredSuccesses}
              </p>
              <p>
                <strong className="text-text-secondary">Maximum Failures:</strong>{' '}
                {maxFailures}
              </p>
              <p>
                <strong className="text-text-secondary">Success:</strong> roll ≥ DS; +1 per 5 over
              </p>
              <p>
                <strong className="text-text-secondary">Failure:</strong> roll &lt; DS; +1 per 5 under
              </p>
              <p>
                <strong className="text-text-secondary">Net:</strong> successes − failures
              </p>
              <p>
                <strong className="text-text-secondary">Outcome:</strong>{' '}
                {encounterOutcome === 'success'
                  ? 'Encounter Overcome'
                  : encounterOutcome === 'failure'
                    ? 'Encounter Failed'
                    : 'In Progress'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddCombatantModal
          onClose={() => setShowAddModal(false)}
          onAdd={addCombatantsAsParticipants}
          onAddParticipants={addParticipantsFromModal}
          mode="skill"
        />
      )}

      {showRollLog && <RollLog viewOnlyCampaignId={encounter.campaignId} />}
    </>
  );
}

function SuccessFailureTracker({
  rollSuccesses,
  rollFailures,
  additionalSuccesses,
  additionalFailures,
  requiredSuccesses,
  maxFailures,
  outcome,
}: {
  rollSuccesses: number;
  rollFailures: number;
  additionalSuccesses: number;
  additionalFailures: number;
  requiredSuccesses: number;
  maxFailures: number;
  outcome: 'success' | 'failure' | 'in-progress';
}) {
  const totalSuccesses = rollSuccesses + additionalSuccesses;
  const totalFailures = rollFailures + additionalFailures;
  const net = totalSuccesses - totalFailures;
  const netAbs = Math.abs(net);
  const maxBubbles = Math.max(10, netAbs + 4);

  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg border border-border-light bg-surface-alt px-3 py-2">
          <div className="text-text-muted dark:text-text-secondary">Total Successes</div>
          <div className="text-sm font-semibold text-success-700 dark:text-success-400">
            {totalSuccesses} / {requiredSuccesses}
          </div>
        </div>
        <div className="rounded-lg border border-border-light bg-surface-alt px-3 py-2">
          <div className="text-text-muted dark:text-text-secondary">Total Failures</div>
          <div className="text-sm font-semibold text-danger-700 dark:text-danger-400">
            {totalFailures} / {maxFailures}
          </div>
        </div>
        <div className="rounded-lg border border-border-light bg-surface-alt px-3 py-2">
          <div className="text-text-muted dark:text-text-secondary">Status</div>
          <div
            className={cn(
              'text-sm font-semibold',
              outcome === 'success' && 'text-success-700 dark:text-success-400',
              outcome === 'failure' && 'text-danger-700 dark:text-danger-400',
              outcome === 'in-progress' && 'text-text-primary'
            )}
          >
            {outcome === 'success' ? 'Overcome' : outcome === 'failure' ? 'Failed' : 'In Progress'}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2">
        <div className="px-4 py-2 rounded-lg bg-surface-alt text-text-muted dark:text-text-secondary text-sm font-medium min-w-[4rem] text-center">
          {net === 0 ? '0' : net > 0 ? `+${net}` : net}
        </div>
        <div className="flex items-center gap-1">
          {net > 0 &&
            Array.from({ length: Math.min(netAbs, maxBubbles) }).map((_, i) => (
              <div key={`g-${i}`} className="w-4 h-4 rounded-full bg-green-500 dark:bg-green-600" title="Success" />
            ))}
          {net < 0 &&
            Array.from({ length: Math.min(netAbs, maxBubbles) }).map((_, i) => (
              <div key={`r-${i}`} className="w-4 h-4 rounded-full bg-red-500 dark:bg-red-600" title="Failure" />
            ))}
          {(net > 0 || net < 0) && (
            <span
              className={cn(
                'text-xs font-medium ml-1',
                net > 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
              )}
            >
              {net > 0 ? `+${net}` : net}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface CodexSkillOption {
  id: string;
  name: string;
}

function getParticipantBorderColor(participant: SkillParticipant, useInitiative: boolean): string {
  if (useInitiative && participant.participantType === 'enemy') return 'border-l-red-500';
  if (useInitiative && participant.participantType === 'ally') return 'border-l-blue-500';
  if (participant.isHelping) return 'border-l-amber-500';
  const hasActed = participant.hasRolled || participant.isHelping;
  const isSuccess = (participant.successCount ?? 0) > 0;
  if (hasActed && isSuccess) return 'border-l-green-500';
  if (hasActed && !isSuccess) return 'border-l-red-500';
  return 'border-l-border-light';
}

function ParticipantCard({
  participant,
  ds,
  codexSkills,
  useInitiative,
  isDragOver,
  isDragging,
  onUpdateRoll,
  onUpdateSkill,
  onUpdateRmBonus,
  onClearRoll,
  onSetHelping,
  onRemove,
  onUpdateInitiative,
  onUpdateParticipantType,
  onRollInitiative,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  participant: SkillParticipant;
  ds: number;
  codexSkills: CodexSkillOption[];
  useInitiative: boolean;
  isDragOver?: boolean;
  isDragging?: boolean;
  onUpdateRoll: (value: number) => void;
  onUpdateSkill: (skill: string) => void;
  onUpdateRmBonus: (value: number | undefined) => void;
  onClearRoll: () => void;
  onSetHelping: (v: boolean) => void;
  onRemove: () => void;
  onUpdateInitiative?: (value: number) => void;
  onUpdateParticipantType?: (t: SkillParticipantType) => void;
  onRollInitiative?: () => void;
  onDragStart?: (e: DragEvent<HTMLDivElement>) => void;
  onDragEnd?: () => void;
  onDragOver?: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave?: () => void;
  onDrop?: (e: DragEvent<HTMLDivElement>) => void;
}) {
  const [rollInput, setRollInput] = useState('');
  const [rmBonusInput, setRmBonusInput] = useState(
    participant.rmBonus == null ? '' : String(participant.rmBonus)
  );
  useEffect(() => {
    setRmBonusInput(participant.rmBonus == null ? '' : String(participant.rmBonus));
  }, [participant.rmBonus]);
  const hasActed = participant.hasRolled || participant.isHelping;
  const isSuccess = (participant.successCount ?? 0) > 0;
  const successCount = participant.successCount ?? 0;
  const failureCount = participant.failureCount ?? 0;
  const effectiveRoll =
    participant.hasRolled && participant.rollValue != null && (participant.rmBonus ?? 0) !== 0
      ? participant.rollValue + (participant.rmBonus ?? 0)
      : null;

  const submitRoll = () => {
    const val = parseInt(rollInput, 10);
    if (isNaN(val)) return;
    const bonusParsed = rmBonusInput.trim();
    const rmBonus = bonusParsed === '' || bonusParsed === '-' ? undefined : parseInt(bonusParsed, 10);
    onUpdateRmBonus(Number.isNaN(rmBonus as number) ? undefined : rmBonus);
    onUpdateRoll(val);
    setRollInput('');
  };

  const handleRmBonusChange = (value: string) => {
    setRmBonusInput(value);
    const v = value.trim();
    if (v === '' || v === '-') {
      onUpdateRmBonus(undefined);
      return;
    }
    const parsed = parseInt(v, 10);
    if (!Number.isNaN(parsed)) onUpdateRmBonus(parsed);
  };

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        'bg-surface rounded-xl shadow-md p-3 transition-all border-l-4',
        getParticipantBorderColor(participant, useInitiative),
        participant.isHelping && 'bg-amber-50/50 dark:bg-amber-900/10',
        hasActed && !participant.isHelping && isSuccess && 'bg-green-50/50 dark:bg-green-900/10',
        hasActed && !participant.isHelping && !isSuccess && 'bg-red-50/50 dark:bg-red-900/10',
        isDragOver && 'ring-2 ring-amber-400 bg-amber-50 dark:bg-amber-900/30',
        isDragging && 'opacity-50'
      )}
    >
      <div className="flex items-start gap-3">
        {useInitiative && (
          <div
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            className="flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing select-none"
          >
            <div className="text-text-muted dark:text-text-secondary hover:text-text-primary p-1 rounded hover:bg-surface-alt">
              <GripVertical className="w-5 h-5" aria-hidden />
            </div>
            <div
              className="w-10 h-10 rounded-lg flex flex-col items-center justify-center bg-surface-alt text-text-secondary text-sm font-bold cursor-pointer hover:bg-surface transition-colors min-w-[44px] min-h-[44px]"
              onClick={onRollInitiative}
              title="Roll initiative (d20)"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onRollInitiative?.()}
              aria-label={`Initiative: ${participant.initiative ?? '—'}. Click to roll.`}
            >
              {participant.initiative ?? '—'}
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <div className="font-bold text-text-primary">{participant.name}</div>
            {useInitiative && onUpdateParticipantType && (
              <select
                value={participant.participantType ?? 'ally'}
                onChange={(e) => onUpdateParticipantType(e.target.value as SkillParticipantType)}
                aria-label="Participant side"
                className={cn(
                  'text-[10px] font-medium rounded px-1.5 py-0.5 border cursor-pointer',
                  (participant.participantType ?? 'ally') === 'ally' && 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300',
                  participant.participantType === 'enemy' && 'bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300'
                )}
              >
                <option value="ally">Ally</option>
                <option value="enemy">Enemy</option>
              </select>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              aria-label="Skill for participant"
              value={participant.skillUsed || ''}
              onChange={(e) => onUpdateSkill(e.target.value)}
              className="text-xs bg-transparent border border-border-light rounded px-1 py-0.5 text-text-secondary focus:border-primary-500 focus:outline-none min-w-0 max-w-[140px]"
            >
              <option value="">Skill...</option>
              {codexSkills.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
          {participant.isHelping ? (
            <Button size="sm" variant="ghost" onClick={() => onSetHelping(false)}>
              Undo Helping
            </Button>
          ) : participant.hasRolled ? (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <div
                  className={cn(
                    'px-3 py-1 rounded-lg font-bold text-sm',
                    isSuccess
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  )}
                >
                  {participant.rollValue}
                  {(participant.rmBonus ?? 0) !== 0 && (
                    <span className="text-xs font-normal ml-1">
                      ({participant.rmBonus! > 0 ? '+' : ''}{participant.rmBonus}) = {effectiveRoll}
                    </span>
                  )}
                  <span className="text-xs font-normal ml-1">vs {ds}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-text-muted dark:text-text-secondary">RM</span>
                  <input
                    type="number"
                    value={rmBonusInput}
                    onChange={(e) => handleRmBonusChange(e.target.value)}
                    placeholder="+0"
                    className="w-14 px-2 py-1 text-xs border border-border-light rounded bg-surface text-text-primary focus:border-primary-500 focus:outline-none min-h-[44px]"
                    aria-label="RM bonus"
                  />
                </div>
                <span
                  className={cn(
                    'px-2 py-1 rounded-lg text-sm font-bold min-h-[44px] flex items-center',
                    successCount > 0
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  )}
                  aria-live="polite"
                >
                  {successCount > 0
                    ? `${successCount} Success${successCount !== 1 ? 'es' : ''}!`
                    : failureCount > 0
                      ? `${failureCount} Failure${failureCount !== 1 ? 's' : ''}!`
                      : ''}
                </span>
                <button
                  onClick={onClearRoll}
                  className="p-2 min-w-[44px] min-h-[44px] text-text-muted dark:text-text-secondary hover:text-text-secondary rounded hover:bg-surface-alt"
                  title="Clear roll"
                  aria-label="Clear roll"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <input
                type="number"
                value={rollInput}
                onChange={(e) => setRollInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitRoll()}
                placeholder="Total"
                className="w-16 px-2 py-1.5 text-sm border border-border-light rounded-lg bg-surface text-text-primary focus:border-primary-500 focus:outline-none min-h-[44px]"
                aria-label="Roll total"
              />
              <div className="flex items-center gap-1">
                <span className="text-xs text-text-muted dark:text-text-secondary">RM</span>
                <input
                  type="number"
                  value={rmBonusInput}
                  onChange={(e) => handleRmBonusChange(e.target.value)}
                  placeholder="+0"
                  className="w-14 px-2 py-1.5 text-sm border border-border-light rounded-lg bg-surface text-text-primary focus:border-primary-500 focus:outline-none min-h-[44px]"
                  aria-label="RM bonus"
                />
              </div>
              <Button size="sm" onClick={submitRoll} disabled={!rollInput} className="min-h-[44px]">
                Submit
              </Button>
              <span
                className={cn(
                  'px-2 py-1 rounded-lg text-sm font-bold min-h-[44px] flex items-center empty:invisible',
                  successCount > 0
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : failureCount > 0
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      : ''
                )}
                aria-live="polite"
              >
                {successCount > 0
                  ? `${successCount} Success${successCount !== 1 ? 'es' : ''}!`
                  : failureCount > 0
                    ? `${failureCount} Failure${failureCount !== 1 ? 's' : ''}!`
                    : ''}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onSetHelping(true)}
                title="Mark as helping — doesn't count toward encounter"
                aria-label="Mark as helping"
                className="min-h-[44px]"
              >
                <HandHelping className="w-4 h-4" />
              </Button>
            </>
          )}

          <button
            onClick={onRemove}
            className="p-2 min-w-[44px] min-h-[44px] text-text-muted dark:text-text-secondary hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
            title="Remove participant"
            aria-label="Remove participant"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
