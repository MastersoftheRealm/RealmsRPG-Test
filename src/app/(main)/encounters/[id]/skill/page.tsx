/**
 * Skill Encounter Page
 * =====================
 * Skill encounter tracker: DS, participants, roll tracking, success/failure.
 * Based on GAME_RULES.md skill encounter mechanics.
 */

'use client';

import { useState, useCallback, useMemo, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const { data: encounterData, isLoading, error } = useEncounter(encounterId);
  const saveMutation = useSaveEncounter();

  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState('');

  // Initialize local state from Firestore
  useEffect(() => {
    if (encounterData && !isInitialized) {
      // Ensure skillEncounter state exists
      const enc = { ...encounterData };
      if (!enc.skillEncounter) {
        enc.skillEncounter = {
          difficultyScore: 10,
          requiredSuccesses: 2,
          requiredFailures: 3,
          participants: [],
          currentSuccesses: 0,
          currentFailures: 0,
        };
      }
      setEncounter(enc);
      setIsInitialized(true);
    }
  }, [encounterData, isInitialized]);

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

  // Computed outcome
  const outcome = useMemo(() => {
    if (!skill) return 'in-progress';
    if (skill.currentSuccesses >= skill.requiredSuccesses) return 'success';
    if (skill.currentFailures >= skill.requiredFailures) return 'failure';
    return 'in-progress';
  }, [skill]);

  const successPercent = skill ? Math.min(100, (skill.currentSuccesses / skill.requiredSuccesses) * 100) : 0;
  const failurePercent = skill ? Math.min(100, (skill.currentFailures / skill.requiredFailures) * 100) : 0;

  // Update skill encounter state
  const updateSkill = useCallback((updates: Partial<SkillEncounterState>) => {
    setEncounter((prev) => {
      if (!prev || !prev.skillEncounter) return prev;
      return { ...prev, skillEncounter: { ...prev.skillEncounter, ...updates } };
    });
  }, []);

  // Add participant manually
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

  // Add participants from modal
  const addParticipantsFromModal = (participants: SkillParticipant[]) => {
    updateSkill({ participants: [...(skill?.participants || []), ...participants] });
    setShowAddModal(false);
  };

  // Also handle onAdd for combatant-shaped data (from combat tab of modal)
  const addCombatantsAsParticipants = (combatants: TrackedCombatant[]) => {
    const participants: SkillParticipant[] = combatants.map(c => ({
      id: c.id,
      name: c.name,
      hasRolled: false,
      sourceType: c.sourceType,
      sourceId: c.sourceId,
    }));
    updateSkill({ participants: [...(skill?.participants || []), ...participants] });
    setShowAddModal(false);
  };

  // Remove participant
  const removeParticipant = (id: string) => {
    if (!skill) return;
    updateSkill({ participants: skill.participants.filter((p) => p.id !== id) });
  };

  // Update participant roll
  const updateParticipantRoll = (id: string, rollValue: number) => {
    if (!skill) return;
    const isSuccess = rollValue >= skill.difficultyScore;
    const updatedParticipants = skill.participants.map((p) => {
      if (p.id !== id) return p;
      return { ...p, rollValue, isSuccess, hasRolled: true };
    });
    // Recompute totals
    const currentSuccesses = updatedParticipants.filter((p) => p.hasRolled && p.isSuccess).length;
    const currentFailures = updatedParticipants.filter((p) => p.hasRolled && !p.isSuccess).length;
    updateSkill({ participants: updatedParticipants, currentSuccesses, currentFailures });
  };

  // Update participant skill used
  const updateParticipantSkill = (id: string, skillUsed: string) => {
    if (!skill) return;
    updateSkill({
      participants: skill.participants.map((p) => (p.id === id ? { ...p, skillUsed } : p)),
    });
  };

  // Clear a participant's roll
  const clearParticipantRoll = (id: string) => {
    if (!skill) return;
    const updatedParticipants = skill.participants.map((p) => {
      if (p.id !== id) return p;
      return { ...p, rollValue: undefined, isSuccess: undefined, hasRolled: false };
    });
    const currentSuccesses = updatedParticipants.filter((p) => p.hasRolled && p.isSuccess).length;
    const currentFailures = updatedParticipants.filter((p) => p.hasRolled && !p.isSuccess).length;
    updateSkill({ participants: updatedParticipants, currentSuccesses, currentFailures });
  };

  // Reset all rolls
  const resetAllRolls = () => {
    if (!skill) return;
    updateSkill({
      participants: skill.participants.map((p) => ({
        ...p,
        rollValue: undefined,
        isSuccess: undefined,
        hasRolled: false,
        skillUsed: undefined,
      })),
      currentSuccesses: 0,
      currentFailures: 0,
    });
    setEncounter((prev) => prev ? { ...prev, status: 'active' } : prev);
  };

  // Start encounter
  const startEncounter = () => {
    setEncounter((prev) => prev ? { ...prev, status: 'active' } : prev);
  };

  // Mark complete
  const completeEncounter = () => {
    setEncounter((prev) => prev ? { ...prev, status: 'completed' } : prev);
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
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/encounters"
          className="inline-flex items-center gap-1 text-text-secondary hover:text-primary-600 mb-2 text-sm"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Encounters
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">{encounter.name}</h1>
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

          {/* Outcome badge */}
          {outcome !== 'in-progress' && (
            <div
              className={cn(
                'px-4 py-2 rounded-lg text-lg font-bold',
                outcome === 'success'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
              )}
            >
              {outcome === 'success' ? 'Success!' : 'Failure!'}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Area - Participants */}
        <div className="lg:col-span-2 space-y-4">
          {/* Progress Bars */}
          <div className="bg-surface rounded-xl border border-border-light p-4 space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-green-700 dark:text-green-300">
                  Successes: {skill.currentSuccesses} / {skill.requiredSuccesses}
                </span>
                <span className="text-text-muted">{Math.round(successPercent)}%</span>
              </div>
              <div className="h-3 bg-surface-alt rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${successPercent}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-red-700 dark:text-red-300">
                  Failures: {skill.currentFailures} / {skill.requiredFailures}
                </span>
                <span className="text-text-muted">{Math.round(failurePercent)}%</span>
              </div>
              <div className="h-3 bg-surface-alt rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all"
                  style={{ width: `${failurePercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Action bar */}
          <div className="bg-surface rounded-xl border border-border-light p-4 flex flex-wrap items-center gap-3">
            {encounter.status === 'preparing' && (
              <Button onClick={startEncounter} disabled={skill.participants.length === 0}>
                Start Encounter
              </Button>
            )}
            {encounter.status === 'active' && (
              <>
                <Button variant="ghost" onClick={resetAllRolls}>
                  <RotateCcw className="w-4 h-4" /> New Round
                </Button>
                {outcome !== 'in-progress' && (
                  <Button onClick={completeEncounter}>Mark Complete</Button>
                )}
              </>
            )}
            <div className="ml-auto text-sm text-text-muted">
              {skill.participants.length} participant{skill.participants.length !== 1 ? 's' : ''}
              {' \u00b7 '}
              {skill.participants.filter((p) => p.hasRolled).length} rolled
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
                  onRemove={() => removeParticipant(p.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Sidebar - Configuration & Add */}
        <div className="space-y-6">
          {/* DS Configuration */}
          <div className="bg-surface rounded-xl border border-border-light p-6">
            <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-500" /> Configuration
            </h3>

            <div className="space-y-4">
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
                  Default: 10 + half party level. Roll &ge; DS = success.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Required Successes
                </label>
                <ValueStepper
                  value={skill.requiredSuccesses}
                  onChange={(val) => updateSkill({ requiredSuccesses: val })}
                  min={1}
                  max={50}
                  size="sm"
                  enableHoldRepeat
                />
                <p className="text-xs text-text-muted mt-1">
                  Default: # participants + 1
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Required Failures
                </label>
                <ValueStepper
                  value={skill.requiredFailures}
                  onChange={(val) => updateSkill({ requiredFailures: val })}
                  min={1}
                  max={50}
                  size="sm"
                  enableHoldRepeat
                />
              </div>
            </div>
          </div>

          {/* Add Participants */}
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

          {/* Game Rules Reference */}
          <div className="bg-surface rounded-xl border border-border-light p-6">
            <h3 className="font-bold text-text-primary mb-3">Quick Reference</h3>
            <div className="space-y-2 text-xs text-text-muted">
              <p>
                <strong className="text-text-secondary">Skill Encounter Action:</strong> Costs 2 AP
              </p>
              <p>
                <strong className="text-text-secondary">Average DS:</strong> 10 + half party level
              </p>
              <p>
                <strong className="text-text-secondary">Required Successes:</strong> # characters + 1
              </p>
              <p>
                <strong className="text-text-secondary">Power/Technique Bonus:</strong> +1 per 5
                Energy cost
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
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

// ---------------------------------------------------------------------------
// Participant Card
// ---------------------------------------------------------------------------

function ParticipantCard({
  participant,
  ds,
  onUpdateRoll,
  onUpdateSkill,
  onClearRoll,
  onRemove,
}: {
  participant: SkillParticipant;
  ds: number;
  onUpdateRoll: (value: number) => void;
  onUpdateSkill: (skill: string) => void;
  onClearRoll: () => void;
  onRemove: () => void;
}) {
  const [rollInput, setRollInput] = useState('');

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
        participant.hasRolled
          ? participant.isSuccess
            ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10'
            : 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10'
          : 'border-border-light'
      )}
    >
      {/* Status icon */}
      <div className="flex-shrink-0">
        {participant.hasRolled ? (
          participant.isSuccess ? (
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          ) : (
            <XCircle className="w-6 h-6 text-red-600" />
          )
        ) : (
          <div className="w-6 h-6 rounded-full border-2 border-border-light" />
        )}
      </div>

      {/* Name & skill */}
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
          {participant.notes && (
            <span className="text-xs text-text-muted truncate">{participant.notes}</span>
          )}
        </div>
      </div>

      {/* Roll input or result */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {participant.hasRolled ? (
          <>
            <div
              className={cn(
                'px-3 py-1 rounded-lg font-bold text-sm',
                participant.isSuccess
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
              )}
            >
              {participant.rollValue}
              <span className="text-xs font-normal ml-1">
                vs {ds}
              </span>
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
              placeholder="Roll"
              className="w-16 px-2 py-1 text-sm border border-border-light rounded-lg bg-surface text-text-primary focus:border-primary-500 focus:outline-none"
            />
            <Button size="sm" onClick={submitRoll} disabled={!rollInput}>
              Roll
            </Button>
          </>
        )}
      </div>

      {/* Remove */}
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
