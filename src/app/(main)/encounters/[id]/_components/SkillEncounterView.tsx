/**
 * Skill Encounter View
 * =====================
 * Shared view containing all skill encounter logic and UI.
 * Used by skill/page.tsx and mixed/page.tsx (tab). No PageContainer, header, or loading—parent provides those.
 * Per GAME_RULES: roll >= DS = 1 + floor((roll-DS)/5) successes; roll < DS = 1 + floor((DS-roll)/5) failures.
 */

'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  Brain,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Users,
  HandHelping,
} from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { ValueStepper } from '@/components/shared';
import { useCodexSkills } from '@/hooks';
import { AddCombatantModal } from '@/components/shared/add-combatant-modal';
import { RollLog } from '@/components/character-sheet';
import { computeSkillRollResult } from '@/lib/game/encounter-utils';
import type { Encounter, SkillParticipant, SkillEncounterState, TrackedCombatant } from '@/types/encounter';
import type { Campaign } from '@/types/campaign';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export interface SkillEncounterViewProps {
  encounterId: string;
  encounter: Encounter | null;
  setEncounter: React.Dispatch<React.SetStateAction<Encounter | null>>;
  campaignsFull: Campaign[];
  showRollLog?: boolean;
}

export default function SkillEncounterView({
  encounter,
  setEncounter,
  campaignsFull,
  showRollLog = true,
}: SkillEncounterViewProps) {
  if (encounter === null || encounter.skillEncounter === undefined) return null;

  const [showAddModal, setShowAddModal] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [addingAllChars, setAddingAllChars] = useState(false);
  const { data: codexSkills = [] } = useCodexSkills();

  const skill = encounter.skillEncounter;
  const additionalSuccesses = skill?.additionalSuccesses ?? 0;
  const additionalFailures = skill?.additionalFailures ?? 0;
  const netSuccesses = skill
    ? skill.currentSuccesses + additionalSuccesses - (skill.currentFailures + additionalFailures)
    : 0;

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

  const linkedCampaign = encounter?.campaignId
    ? campaignsFull.find((c: Campaign) => c.id === encounter.campaignId)
    : undefined;

  const addAllCampaignCharacters = useCallback(async () => {
    if (!encounter?.campaignId || !linkedCampaign?.characters?.length) return;
    setAddingAllChars(true);
    try {
      const participants: SkillParticipant[] = linkedCampaign.characters.map(
        (c: { userId: string; characterId: string; characterName: string }) => ({
          id: generateId(),
          name: c.characterName,
          hasRolled: false,
          sourceType: 'campaign-character' as const,
          sourceId: c.characterId,
        })
      );
      updateSkill({ participants: [...(skill?.participants || []), ...participants] });
    } finally {
      setAddingAllChars(false);
    }
  }, [encounter?.campaignId, linkedCampaign, skill?.participants, updateSkill]);

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

  const addAdditionalSuccess = () => {
    updateSkill({ additionalSuccesses: (skill?.additionalSuccesses ?? 0) + 1 });
  };
  const addAdditionalFailure = () => {
    updateSkill({ additionalFailures: (skill?.additionalFailures ?? 0) + 1 });
  };
  const removeAdditionalSuccess = () => {
    const cur = skill?.additionalSuccesses ?? 0;
    if (cur > 0) updateSkill({ additionalSuccesses: cur - 1 });
  };
  const removeAdditionalFailure = () => {
    const cur = skill?.additionalFailures ?? 0;
    if (cur > 0) updateSkill({ additionalFailures: cur - 1 });
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
      const { successes, failures } = computeSkillRollResult(p.rollValue ?? 0, skill.difficultyScore);
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

  return (
    <>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-surface rounded-xl border border-border-light p-4">
            <h3 className="text-sm font-semibold text-text-secondary mb-3">Successes</h3>
            <SuccessFailureTracker
              rollSuccesses={skill.currentSuccesses}
              rollFailures={skill.currentFailures}
              additionalSuccesses={additionalSuccesses}
              additionalFailures={additionalFailures}
            />
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              <Button size="sm" variant="secondary" onClick={addAdditionalSuccess}>
                Additional Success
              </Button>
              <Button size="sm" variant="secondary" onClick={removeAdditionalSuccess} disabled={additionalSuccesses <= 0}>
                − Success
              </Button>
              <Button size="sm" variant="secondary" onClick={addAdditionalFailure}>
                Additional Failure
              </Button>
              <Button size="sm" variant="secondary" onClick={removeAdditionalFailure} disabled={additionalFailures <= 0}>
                − Failure
              </Button>
            </div>
          </div>

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
                  codexSkills={codexSkills}
                  onUpdateRoll={(val) => updateParticipantRollOnly(p.id, val)}
                  onUpdateSkill={(s) => updateParticipantSkill(p.id, s)}
                  onUpdateRmBonus={(v) => updateParticipantRmBonus(p.id, v)}
                  onClearRoll={() => clearParticipantRoll(p.id)}
                  onSetHelping={(v) => setParticipantHelping(p.id, v)}
                  onRemove={() => removeParticipant(p.id)}
                />
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface rounded-xl border border-border-light p-6">
            <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-500" /> Configuration
            </h3>
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
              <p className="text-xs text-text-muted mt-1">
                Roll ≥ DS = success. Each 5 over/under adds extra success/failure.
              </p>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border-light p-6">
            <h3 className="font-bold text-text-primary mb-4">Add Participants</h3>
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
              <Button onClick={addParticipant} disabled={!newParticipantName.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border-light p-6">
            <h3 className="font-bold text-text-primary mb-3">Quick Reference</h3>
            <div className="space-y-2 text-xs text-text-muted">
              <p>
                <strong className="text-text-secondary">Required Successes:</strong>{' '}
                {skill.participants.length + 1} (per GAME_RULES: # participants + 1)
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
}: {
  rollSuccesses: number;
  rollFailures: number;
  additionalSuccesses: number;
  additionalFailures: number;
}) {
  const totalSuccesses = rollSuccesses + additionalSuccesses;
  const totalFailures = rollFailures + additionalFailures;
  const net = totalSuccesses - totalFailures;
  const netAbs = Math.abs(net);
  const maxBubbles = Math.max(10, netAbs + 4);

  return (
    <div className="flex items-center justify-center gap-2">
      <div className="px-4 py-2 rounded-lg bg-surface-alt text-text-muted text-sm font-medium min-w-[4rem] text-center">
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
  );
}

interface CodexSkillOption {
  id: string;
  name: string;
}

function ParticipantCard({
  participant,
  ds,
  codexSkills,
  onUpdateRoll,
  onUpdateSkill,
  onUpdateRmBonus,
  onClearRoll,
  onSetHelping,
  onRemove,
}: {
  participant: SkillParticipant;
  ds: number;
  codexSkills: CodexSkillOption[];
  onUpdateRoll: (value: number) => void;
  onUpdateSkill: (skill: string) => void;
  onUpdateRmBonus: (value: number | undefined) => void;
  onClearRoll: () => void;
  onSetHelping: (v: boolean) => void;
  onRemove: () => void;
}) {
  const [rollInput, setRollInput] = useState('');
  const hasActed = participant.hasRolled || participant.isHelping;
  const isSuccess = (participant.successCount ?? 0) > 0;
  const effectiveRoll =
    participant.hasRolled && participant.rollValue != null && (participant.rmBonus ?? 0) !== 0
      ? participant.rollValue + (participant.rmBonus ?? 0)
      : null;

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
          <span title="Helping (doesn't count)">
            <HandHelping className="w-6 h-6 text-amber-600" />
          </span>
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
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <select
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
          <span className="text-xs text-text-muted">RM Bonus:</span>
          <input
            type="number"
            value={participant.rmBonus ?? ''}
            onChange={(e) => {
              const v = e.target.value.trim();
              onUpdateRmBonus(v === '' || v === '-' ? undefined : parseInt(v, 10));
            }}
            placeholder="+0"
            className="w-12 px-1 py-0.5 text-xs border border-border-light rounded bg-surface text-text-primary focus:border-primary-500 focus:outline-none"
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
              {(participant.rmBonus ?? 0) !== 0 && (
                <span className="text-xs font-normal ml-1">
                  ({participant.rmBonus! > 0 ? '+' : ''}{participant.rmBonus}) = {effectiveRoll}
                </span>
              )}
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
