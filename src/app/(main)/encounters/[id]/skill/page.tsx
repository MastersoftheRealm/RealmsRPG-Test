/**
 * Skill Encounter Page
 * =====================
 * Skill encounter tracker: DS, participants, roll tracking, success/failure.
 * Per GAME_RULES: roll >= DS = 1 + floor((roll-DS)/5) successes; roll < DS = 1 + floor((DS-roll)/5) failures.
 * Successes and failures cancel; net = successes - failures.
 */

'use client';

import { useState, useCallback, useMemo, useEffect, use } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  Cloud,
  CloudOff,
  Brain,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Users,
  HandHelping,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/layout';
import {
  PageContainer,
  LoadingState,
  Alert,
  Button,
  Input,
} from '@/components/ui';
import { ValueStepper } from '@/components/shared';
import { useEncounter, useSaveEncounter, useAutoSave } from '@/hooks';
import { AddCombatantModal } from '@/components/shared/add-combatant-modal';
import { computeSkillRollResult } from '@/lib/game/encounter-utils';
import type { Encounter, SkillParticipant, SkillEncounterState, TrackedCombatant } from '@/types/encounter';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

interface PageParams {
  params: Promise<{ id: string }>;
}

export default function SkillEncounterPage({ params }: PageParams) {
  return (
    <ProtectedRoute>
      <SkillEncounterContent params={params} />
    </ProtectedRoute>
  );
}

function SkillEncounterContent({ params }: { params: Promise<{ id: string }> }) {
  const { id: encounterId } = use(params);
  const { data: encounterData, isLoading, error } = useEncounter(encounterId);
  const saveMutation = useSaveEncounter();

  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');

  // Initialize local state from Prisma (strip legacy requiredSuccesses/requiredFailures)
  useEffect(() => {
    if (encounterData && !isInitialized) {
      const enc = { ...encounterData };
      if (!enc.skillEncounter) {
        enc.skillEncounter = {
          difficultyScore: 10,
          participants: [],
          currentSuccesses: 0,
          currentFailures: 0,
        };
      } else {
        const sk = enc.skillEncounter as unknown as Record<string, unknown>;
        delete sk.requiredSuccesses;
        delete sk.requiredFailures;
        // Migrate legacy participants: compute successCount/failureCount from rollValue if missing
        const participants = (sk.participants as SkillParticipant[]) || [];
        const ds = (sk.difficultyScore as number) ?? 10;
        sk.participants = participants.map((p) => {
          if (p.hasRolled && p.rollValue != null && (p.successCount == null && p.failureCount == null)) {
            const { successes, failures } = computeSkillRollResult(p.rollValue, ds);
            return { ...p, successCount: successes, failureCount: failures };
          }
          return p;
        });
      }
      setNameInput(enc.name || '');
      setEncounter(enc);
      setIsInitialized(true);
    }
  }, [encounterData, isInitialized]);

  useEffect(() => {
    if (encounter?.name && !isEditingName) setNameInput(encounter.name);
  }, [encounter?.name, isEditingName]);

  // Auto-save
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

  const skill = encounter?.skillEncounter;

  // Net = successes - failures (they cancel)
  const netSuccesses = skill ? skill.currentSuccesses - skill.currentFailures : 0;

  const updateSkill = useCallback((updates: Partial<SkillEncounterState>) => {
    setEncounter((prev) => {
      if (!prev || !prev.skillEncounter) return prev;
      return { ...prev, skillEncounter: { ...prev.skillEncounter, ...updates } };
    });
  }, []);

  const addParticipant = () => {
    if (!newParticipantName.trim()) return;
    const participant: SkillParticipant = {
      id: generateId(),
      name: newParticipantName.trim(),
      hasRolled: false,
      sourceType: 'manual',
    };
    updateSkill({ participants: [...(skill?.participants || []), participant] });
    setNewParticipantName('');
  };

  const addParticipantsFromModal = (participants: SkillParticipant[]) => {
    updateSkill({ participants: [...(skill?.participants || []), ...participants] });
    setShowAddModal(false);
  };

  const addCombatantsAsParticipants = (combatants: TrackedCombatant[]) => {
    const participants: SkillParticipant[] = combatants.map((c) => ({
      id: c.id,
      name: c.name,
      hasRolled: false,
      sourceType: c.sourceType,
      sourceId: c.sourceId,
    }));
    updateSkill({ participants: [...(skill?.participants || []), ...participants] });
    setShowAddModal(false);
  };

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

  const updateParticipantRoll = (id: string, rollValue: number) => {
    if (!skill) return;
    const { successes, failures } = computeSkillRollResult(rollValue, skill.difficultyScore);
    const prev = skill.participants.find((p) => p.id === id);
    const prevSuccess = prev?.successCount ?? 0;
    const prevFail = prev?.failureCount ?? 0;
    const deltaSuccess = successes - prevSuccess;
    const deltaFail = failures - prevFail;
    const updatedParticipants = skill.participants.map((p) => {
      if (p.id !== id)
        return p;
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
        participants: skill.participants.map((x) =>
          x.id === id ? { ...x, isHelping: true } : x
        ),
        currentSuccesses: Math.max(0, skill.currentSuccesses - dSuccesses),
        currentFailures: Math.max(0, skill.currentFailures - dFailures),
      });
    } else {
      const { successes, failures } = computeSkillRollResult(p.rollValue ?? 0, skill.difficultyScore);
      updateSkill({
        participants: skill.participants.map((x) =>
          x.id === id ? { ...x, isHelping: false } : x
        ),
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

  const restartEncounter = () => {
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
    });
  };

  if (isLoading) {
    return (
      <PageContainer size="xl">
        <LoadingState message="Loading encounter..." size="lg" />
      </PageContainer>
    );
  }

  if (error || (!isLoading && !encounterData)) {
    return (
      <PageContainer size="xl">
        <Alert variant="danger" title="Encounter not found">
          This encounter may have been deleted or you may not have access.
        </Alert>
        <Link href="/encounters" className="mt-4 inline-block text-primary-600 hover:underline">
          Back to Encounters
        </Link>
      </PageContainer>
    );
  }

  if (!encounter || !skill) {
    return (
      <PageContainer size="xl">
        <LoadingState message="Initializing..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer size="xl">
      <div className="mb-6">
        <Link
          href="/encounters"
          className="inline-flex items-center gap-1 text-text-secondary hover:text-primary-600 mb-2 text-sm"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Encounters
        </Link>
        <div className="flex items-start justify-between">
          <div>
            {isEditingName ? (
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={() => {
                  const trimmed = nameInput.trim();
                  if (trimmed && trimmed !== encounter.name) {
                    setEncounter((prev) => (prev ? { ...prev, name: trimmed } : prev));
                  } else {
                    setNameInput(encounter.name || '');
                  }
                  setIsEditingName(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const trimmed = nameInput.trim();
                    if (trimmed && trimmed !== encounter.name) {
                      setEncounter((prev) => (prev ? { ...prev, name: trimmed } : prev));
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

            <p className="text-text-secondary">
              Skill Encounter{encounter.description ? ` \u2014 ${encounter.description}` : ''}
            </p>
            <p className="text-xs mt-1 flex items-center gap-1">
              {isSaving ? (
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <CloudOff className="w-3 h-3" /> Saving...
                </span>
              ) : hasUnsavedChanges ? (
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <CloudOff className="w-3 h-3" /> Unsaved changes
                </span>
              ) : (
                <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                  <Cloud className="w-3 h-3" /> Saved to cloud
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Success/Failure Tracker: failures left, neutral middle, successes right, bubbles */}
          <div className="bg-surface rounded-xl border border-border-light p-4">
            <h3 className="text-sm font-semibold text-text-secondary mb-3">Progress</h3>
            <SuccessFailureTracker
              successes={skill.currentSuccesses}
              failures={skill.currentFailures}
            />
          </div>

          {/* Action bar */}
          <div className="bg-surface rounded-xl border border-border-light p-4 flex flex-wrap items-center gap-3">
            <Button variant="ghost" onClick={restartEncounter}>
              <RotateCcw className="w-4 h-4" /> Restart Encounter
            </Button>
            <div className="ml-auto text-sm text-text-muted">
              {skill.participants.length} participant{skill.participants.length !== 1 ? 's' : ''}
              {' · '}
              {skill.participants.filter((p) => p.hasRolled || p.isHelping).length} acted
            </div>
          </div>

          {/* Participant Cards */}
          <div className="space-y-2">
            {skill.participants.length === 0 ? (
              <div className="bg-surface rounded-xl border border-border-light p-8 text-center text-text-muted">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No participants yet. Add characters using the panel on the right.</p>
              </div>
            ) : (
              skill.participants.map((p) => (
                <ParticipantCard
                  key={p.id}
                  participant={p}
                  ds={skill.difficultyScore}
                  onUpdateRoll={(val) => updateParticipantRoll(p.id, val)}
                  onUpdateSkill={(s) => updateParticipantSkill(p.id, s)}
                  onClearRoll={() => clearParticipantRoll(p.id)}
                  onSetHelping={(v) => setParticipantHelping(p.id, v)}
                  onRemove={() => removeParticipant(p.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-surface rounded-xl border border-border-light p-6">
            <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-500" /> Configuration
            </h3>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Difficulty Score (DS)
              </label>
              <ValueStepper
                value={skill.difficultyScore}
                onChange={(val) => updateSkill({ difficultyScore: val })}
                min={1}
                max={40}
                size="sm"
                enableHoldRepeat
              />
              <p className="text-xs text-text-muted mt-1">
                Roll ≥ DS = success. Each 5 over/under adds extra success/failure.
              </p>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border-light p-6">
            <h3 className="font-bold text-text-primary mb-4">Add Participants</h3>
            <Button
              variant="secondary"
              className="w-full mb-4"
              onClick={() => setShowAddModal(true)}
            >
              From Library / Campaign
            </Button>
            <div className="flex gap-2">
              <Input
                value={newParticipantName}
                onChange={(e) => setNewParticipantName(e.target.value)}
                placeholder="Character name..."
                onKeyDown={(e) => e.key === 'Enter' && addParticipant()}
              />
              <Button onClick={addParticipant} disabled={!newParticipantName.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border-light p-6">
            <h3 className="font-bold text-text-primary mb-3">Quick Reference</h3>
            <div className="space-y-2 text-xs text-text-muted">
              <p>
                <strong className="text-text-secondary">Success:</strong> roll ≥ DS; +1 per 5 over
              </p>
              <p>
                <strong className="text-text-secondary">Failure:</strong> roll &lt; DS; +1 per 5 under
              </p>
              <p>
                <strong className="text-text-secondary">Net:</strong> successes − failures
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
    </PageContainer>
  );
}

function SuccessFailureTracker({ successes, failures }: { successes: number; failures: number }) {
  const net = successes - failures;
  const maxBubbles = Math.max(10, successes + failures, Math.abs(net) + 4);
  const failBubbles = Math.min(failures, maxBubbles);
  const successBubbles = Math.min(successes, maxBubbles);

  return (
    <div className="flex items-center justify-center gap-2">
      {/* Failures (left) */}
      <div className="flex items-center gap-1">
        {Array.from({ length: failBubbles }).map((_, i) => (
          <div
            key={`f-${i}`}
            className="w-4 h-4 rounded-full bg-red-500 dark:bg-red-600"
            title="Failure"
          />
        ))}
        {failures > 0 && (
          <span className="text-xs font-medium text-red-700 dark:text-red-300 ml-1">{failures}</span>
        )}
      </div>

      {/* Neutral (middle) */}
      <div className="px-4 py-2 rounded-lg bg-surface-alt text-text-muted text-sm font-medium min-w-[4rem] text-center">
        {net === 0 ? '0' : net > 0 ? `+${net}` : net}
      </div>

      {/* Successes (right) */}
      <div className="flex items-center gap-1">
        {successes > 0 && (
          <span className="text-xs font-medium text-green-700 dark:text-green-300 mr-1">{successes}</span>
        )}
        {Array.from({ length: successBubbles }).map((_, i) => (
          <div
            key={`s-${i}`}
            className="w-4 h-4 rounded-full bg-green-500 dark:bg-green-600"
            title="Success"
          />
        ))}
      </div>
    </div>
  );
}

function ParticipantCard({
  participant,
  ds,
  onUpdateRoll,
  onUpdateSkill,
  onClearRoll,
  onSetHelping,
  onRemove,
}: {
  participant: SkillParticipant;
  ds: number;
  onUpdateRoll: (value: number) => void;
  onUpdateSkill: (skill: string) => void;
  onClearRoll: () => void;
  onSetHelping: (v: boolean) => void;
  onRemove: () => void;
}) {
  const [rollInput, setRollInput] = useState('');
  const hasActed = participant.hasRolled || participant.isHelping;
  const isSuccess = (participant.successCount ?? 0) > 0;

  const submitRoll = () => {
    const val = parseInt(rollInput, 10);
    if (isNaN(val)) return;
    onUpdateRoll(val);
    setRollInput('');
  };

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 bg-surface rounded-xl border transition-colors',
        participant.isHelping
          ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10'
          : hasActed
            ? isSuccess
              ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10'
              : 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10'
            : 'border-border-light'
      )}
    >
      <div className="flex-shrink-0">
        {participant.isHelping ? (
          <span title="Helping (doesn't count)"><HandHelping className="w-6 h-6 text-amber-600" /></span>
        ) : hasActed ? (
          isSuccess ? (
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          ) : (
            <XCircle className="w-6 h-6 text-red-600" />
          )
        ) : (
          <div className="w-6 h-6 rounded-full border-2 border-border-light" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-medium text-text-primary">{participant.name}</div>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="text"
            value={participant.skillUsed || ''}
            onChange={(e) => onUpdateSkill(e.target.value)}
            placeholder="Skill used..."
            className="text-xs bg-transparent border-b border-border-light text-text-secondary focus:border-primary-500 focus:outline-none px-0 py-0.5 w-32"
          />
          {participant.hasRolled && participant.rollValue != null && (
            <span className="text-xs text-text-muted">
              {(participant.successCount ?? 0) > 0
                ? `${participant.successCount}S`
                : (participant.failureCount ?? 0) > 0
                  ? `${participant.failureCount}F`
                  : ''}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {participant.isHelping ? (
          <Button size="sm" variant="ghost" onClick={() => onSetHelping(false)}>
            Undo Helping
          </Button>
        ) : participant.hasRolled ? (
          <>
            <div
              className={cn(
                'px-3 py-1 rounded-lg font-bold text-sm',
                isSuccess
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
              )}
            >
              {participant.rollValue}
              <span className="text-xs font-normal ml-1">vs {ds}</span>
            </div>
            <button
              onClick={onClearRoll}
              className="p-1 text-text-muted hover:text-text-secondary rounded"
              title="Clear roll"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <>
            <input
              type="number"
              value={rollInput}
              onChange={(e) => setRollInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitRoll()}
              placeholder="Total"
              className="w-16 px-2 py-1 text-sm border border-border-light rounded-lg bg-surface text-text-primary focus:border-primary-500 focus:outline-none"
            />
            <Button size="sm" onClick={submitRoll} disabled={!rollInput}>
              Submit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onSetHelping(true)}
              title="Mark as helping — doesn't count toward encounter"
            >
              <HandHelping className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>

      <button
        onClick={onRemove}
        className="p-1.5 text-text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
        title="Remove"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
