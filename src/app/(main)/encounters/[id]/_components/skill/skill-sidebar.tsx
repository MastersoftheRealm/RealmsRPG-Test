/**
 * Skill encounter configuration + add-participants sidebar (TASK-608)
 */

"use client";

import { Brain, Plus, GripVertical, Swords } from "lucide-react";
import { Button, Input, Card } from "@/components/ui";
import { ValueStepper } from "@/components/shared";
import type {
  Encounter,
  SkillEncounterState,
  TrackedCombatant,
} from "@/types/encounter";
import type { Campaign } from "@/types/campaign";

export interface SkillSidebarProps {
  encounter: Encounter & { skillEncounter: SkillEncounterState };
  setEncounter: React.Dispatch<React.SetStateAction<Encounter | null>>;
  campaignsFull: Campaign[];
  linkedCampaign: Campaign | undefined;
  skill: SkillEncounterState;
  requiredSuccesses: number;
  maxFailures: number;
  encounterOutcome: "success" | "failure" | "in-progress";
  useInitiative: boolean;
  isMixedEncounter: boolean;
  combatTurnOrderLength: number;
  addingAllChars: boolean;
  newParticipantName: string;
  setNewParticipantName: (v: string) => void;
  updateSkill: (updates: Partial<SkillEncounterState>) => void;
  recomputeParticipantRollsFromDs: (newDs?: number) => void;
  onSortByInitiative: () => void;
  onSyncWithCombatOrder: () => void;
  onCopyCombatantsToSkill: () => void;
  onAddAllCampaignCharacters: () => void;
  onOpenAddModal: () => void;
  onAddParticipant: () => void;
}

export function SkillSidebar({
  encounter,
  setEncounter,
  campaignsFull,
  linkedCampaign,
  skill,
  requiredSuccesses,
  maxFailures,
  encounterOutcome,
  useInitiative,
  isMixedEncounter,
  combatTurnOrderLength,
  addingAllChars,
  newParticipantName,
  setNewParticipantName,
  updateSkill,
  recomputeParticipantRollsFromDs,
  onSortByInitiative,
  onSyncWithCombatOrder,
  onCopyCombatantsToSkill,
  onAddAllCampaignCharacters,
  onOpenAddModal,
  onAddParticipant,
}: SkillSidebarProps) {
  const combatants = encounter.combatants as TrackedCombatant[];
  const existingIds = new Set(skill.participants.map((p) => p.id));
  const notYetAdded = combatants.filter((c) => !existingIds.has(c.id)).length;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="font-bold text-text-primary mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-info-fg" /> Configuration
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Difficulty Score (DS)
            </label>
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
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Required Successes
            </label>
            <ValueStepper
              value={requiredSuccesses}
              onChange={(val) =>
                updateSkill({ requiredSuccesses: Math.max(1, val) })
              }
              min={1}
              max={99}
              size="sm"
              enableHoldRepeat
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Maximum Failures
            </label>
            <ValueStepper
              value={maxFailures}
              onChange={(val) =>
                updateSkill({ maxFailures: Math.max(1, val) })
              }
              min={1}
              max={99}
              size="sm"
              enableHoldRepeat
            />
          </div>
          <div>
            <label
              htmlFor="encounter-description"
              className="block text-sm font-medium text-text-secondary mb-1"
            >
              Encounter Description
            </label>
            <textarea
              id="encounter-description"
              value={encounter.description ?? ""}
              onChange={(e) =>
                setEncounter((prev) =>
                  prev ? { ...prev, description: e.target.value } : prev,
                )
              }
              placeholder="Rewards, penalties, context, and skill bonus notes..."
              className="w-full rounded-lg border border-border-light bg-background px-3 py-2 text-sm text-text-primary focus:border-primary-outline-border focus:outline-none min-h-[96px]"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useInitiative}
              onChange={(e) =>
                updateSkill({ useInitiative: e.target.checked })
              }
              className="rounded border-border-light"
              aria-label="Track turns / use initiative"
            />
            <span className="text-sm font-medium text-text-secondary">
              Track turns / use initiative
            </span>
          </label>
          {useInitiative && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onSortByInitiative}
              aria-label="Sort participants by initiative"
            >
              <GripVertical className="w-4 h-4" /> Sort Initiative
            </Button>
          )}
          {isMixedEncounter && useInitiative && combatTurnOrderLength > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onSyncWithCombatOrder}
              aria-label="Sync participant order with combat turn order"
              title="Reorder skill participants to match combat turn order (by name or character)"
            >
              <Swords className="w-4 h-4" /> Sync with combat order
            </Button>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-bold text-text-primary mb-4">Add Participants</h2>
        {isMixedEncounter && encounter.combatants.length ? (
          <Button
            variant="secondary"
            className="w-full mb-4"
            onClick={onCopyCombatantsToSkill}
            disabled={notYetAdded === 0}
            aria-label="Copy combat encounter combatants to skill participants (keeps initiative and ally/enemy)"
            title={
              notYetAdded === 0
                ? "All combatants are already in the skill encounter."
                : "Add everyone from the combat tab as skill participants, with their initiative and side (ally/enemy) preserved."
            }
          >
            <Swords className="w-4 h-4" /> Copy combatants from combat encounter
            {notYetAdded > 0 && ` (${notYetAdded})`}
          </Button>
        ) : null}
        <div className="mb-4 space-y-2">
          <label
            htmlFor="skill-encounter-campaign"
            className="block text-sm font-medium text-text-secondary"
          >
            Campaign
          </label>
          <select
            id="skill-encounter-campaign"
            value={encounter.campaignId ?? ""}
            onChange={(e) => {
              const id = e.target.value || undefined;
              setEncounter((prev) =>
                prev ? { ...prev, campaignId: id } : prev,
              );
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
              onClick={onAddAllCampaignCharacters}
              disabled={addingAllChars}
            >
              {addingAllChars
                ? "Adding…"
                : `Add all Characters (${linkedCampaign.characters?.length ?? 0})`}
            </Button>
          )}
        </div>
        <Button
          variant="secondary"
          className="w-full mb-4"
          onClick={onOpenAddModal}
        >
          From Library / Campaign
        </Button>
        <div className="flex gap-2">
          <Input
            value={newParticipantName}
            onChange={(e) => setNewParticipantName(e.target.value)}
            placeholder="Character name..."
            onKeyDown={(e) => e.key === "Enter" && onAddParticipant()}
          />
          <Button
            onClick={onAddParticipant}
            disabled={!newParticipantName.trim()}
            aria-label="Add participant"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-bold text-text-primary mb-3">Quick Reference</h2>
        <div className="space-y-2 text-xs text-text-muted dark:text-text-secondary">
          <p>
            <strong className="text-text-secondary">Required Successes:</strong>{" "}
            {requiredSuccesses}
          </p>
          <p>
            <strong className="text-text-secondary">Maximum Failures:</strong>{" "}
            {maxFailures}
          </p>
          <p>
            <strong className="text-text-secondary">Success:</strong> roll ≥ DS;
            +1 per 5 over
          </p>
          <p>
            <strong className="text-text-secondary">Failure:</strong> roll &lt;
            DS; +1 per 5 under
          </p>
          <p>
            <strong className="text-text-secondary">Net:</strong> successes −
            failures
          </p>
          <p>
            <strong className="text-text-secondary">Outcome:</strong>{" "}
            {encounterOutcome === "success"
              ? "Encounter Overcome"
              : encounterOutcome === "failure"
                ? "Encounter Failed"
                : "In Progress"}
          </p>
        </div>
      </Card>
    </div>
  );
}
