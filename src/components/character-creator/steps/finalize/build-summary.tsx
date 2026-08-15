'use client';

import { statusPanel } from '@/lib/ui/status-surface-classes';
import { cn } from '@/lib/utils';
import { ABILITY_DISPLAY_NAMES } from '@/lib/game/constants';
import { derivePowerDisplay } from '@/lib/calculators/power-calc';
import type { PowerDocument } from '@/lib/calculators/power-calc';
import { deriveTechniqueDisplay } from '@/lib/calculators/technique-calc';
import type { TechniqueDocument } from '@/lib/calculators/technique-calc';
import type { CharacterDraft, CharacterPower, CharacterTechnique } from '@/types';
import type { PowerPart, TechniquePart } from '@/hooks';
import { StepEditLink } from './step-edit-link';

interface ProficiencyTpSummary {
  spent: number;
  limit: number;
  remaining: number;
}

interface BuildSummaryProps {
  draft: CharacterDraft;
  proficiencyTpSummary: ProficiencyTpSummary;
  powerPartsDb: PowerPart[];
  techniquePartsDb: TechniquePart[];
}

/** Character Summary — styled to match creator steps: clear hierarchy, ability cards, no grey-on-grey */
export function BuildSummary({
  draft,
  proficiencyTpSummary,
  powerPartsDb,
  techniquePartsDb,
}: BuildSummaryProps) {
  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-border-light bg-surface shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border-light bg-surface-alt px-5 py-4">
        <div>
          <h3 className="text-lg font-bold text-text-primary">Build Summary</h3>
          <p className="mt-0.5 text-sm text-text-secondary">
            Every choice at a glance. Jump back to edit any step.
          </p>
        </div>
      </div>

      <div className="space-y-5 p-5">
        {/* Top row: Level, Archetype, Species, Power/Martial only when archetype has that proficiency */}
        {(() => {
          const arch = draft.archetype;
          const hasPowerProf =
            arch?.type === 'power' ||
            arch?.type === 'powered-martial' ||
            (arch?.power_prof_start ?? 0) > 0;
          const hasMartialProf =
            arch?.type === 'martial' ||
            arch?.type === 'powered-martial' ||
            (arch?.martial_prof_start ?? 0) > 0;
          const showPowerAbility = draft.pow_abil && hasPowerProf;
          const showMartialAbility = draft.mart_abil && hasMartialProf;
          return (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium tracking-wide text-text-secondary uppercase">
                  Core choices
                </p>
                <div className="flex flex-wrap gap-1">
                  <StepEditLink step="archetype" label="archetype" />
                  <StepEditLink step="species" label="species" />
                  <StepEditLink step="ancestry" label="ancestry" />
                  <StepEditLink step="abilities" label="abilities" />
                  <StepEditLink step="skills" label="skills" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-border-light bg-surface-alt/50 p-3">
                  <p className="text-xs font-medium tracking-wide text-text-secondary uppercase">
                    Level
                  </p>
                  <p className="mt-0.5 text-lg font-bold text-text-primary">{draft.level || 1}</p>
                </div>
                <div className="rounded-lg border border-border-light bg-surface-alt/50 p-3">
                  <p className="text-xs font-medium tracking-wide text-text-secondary uppercase">
                    Archetype
                  </p>
                  <p className="mt-0.5 text-lg font-bold text-text-primary">
                    {arch?.name
                      ? arch.name
                      : arch?.type
                        ? arch.type.charAt(0).toUpperCase() + arch.type.slice(1)
                        : '-'}
                  </p>
                </div>
                <div className="rounded-lg border border-border-light bg-surface-alt/50 p-3">
                  <p className="text-xs font-medium tracking-wide text-text-secondary uppercase">
                    Species
                  </p>
                  <p className="mt-0.5 text-lg font-bold text-text-primary">
                    {draft.ancestry?.name || '-'}
                  </p>
                </div>
                {showPowerAbility && (
                  <div className="dark:bg-power-900/20 rounded-lg border border-power bg-power-light/40 p-3">
                    <p className="text-xs font-medium tracking-wide text-power-fg uppercase">
                      Power Ability
                    </p>
                    <p className="mt-0.5 text-lg font-bold text-power-fg capitalize">
                      {draft.pow_abil}
                    </p>
                  </div>
                )}
                {showMartialAbility && (
                  <div className="dark:bg-martial-900/20 rounded-lg border border-martial bg-martial-light/40 p-3">
                    <p className="text-xs font-medium tracking-wide text-martial-fg uppercase">
                      Martial Ability
                    </p>
                    <p className="mt-0.5 text-lg font-bold text-martial-fg capitalize">
                      {draft.mart_abil}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Proficiency TP — same token styling as elsewhere */}
        <div className="rounded-lg border border-border-light bg-surface-alt/50 p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium tracking-wide text-text-secondary uppercase">
              Proficiency TP
            </p>
            <StepEditLink step="equipment" label="equipment" />
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-lg border border-border-light bg-surface px-3 py-1.5 text-sm font-medium text-text-primary">
              Limit: {proficiencyTpSummary.limit}
            </span>
            <span className="rounded-lg border border-border-light bg-surface px-3 py-1.5 text-sm font-medium text-text-primary">
              Required: {proficiencyTpSummary.spent}
            </span>
            <span
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-bold',
                proficiencyTpSummary.remaining >= 0
                  ? 'border border-success-200 bg-success-100 text-success-fg dark:border-success-700/50 dark:bg-success-900/40'
                  : 'border border-danger-200 bg-danger-100 text-danger-fg dark:border-danger-700/50 dark:bg-danger-900/40',
              )}
            >
              Remaining: {proficiencyTpSummary.remaining}
            </span>
          </div>
          {proficiencyTpSummary.remaining < 0 && (
            <p className="mt-2 text-sm font-medium text-danger-fg">
              Over by {Math.abs(proficiencyTpSummary.remaining)} TP. You can still create and adjust
              later.
            </p>
          )}
        </div>

        {/* Abilities — name above value, mini ability cards matching creator (power/martial tint, +/- colors) */}
        {draft.abilities && (
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium tracking-wide text-text-secondary uppercase">
                Abilities
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {(Object.entries(draft.abilities) as [string, number][]).map(([key, value]) => {
                const isPower = draft.pow_abil === key;
                const isMartial = draft.mart_abil === key;
                const name = ABILITY_DISPLAY_NAMES[key] ?? key;
                return (
                  <div
                    key={key}
                    className={cn(
                      'rounded-lg border-2 p-2 text-center',
                      isPower && 'dark:bg-power-900/20 border-power bg-power-light/50',
                      isMartial && 'dark:bg-martial-900/20 border-martial bg-martial-light/50',
                      !isPower && !isMartial && 'border-border-light bg-surface-alt/50',
                    )}
                  >
                    <p className="text-[10px] leading-tight font-semibold tracking-wide text-text-secondary uppercase">
                      {name}
                    </p>
                    <p
                      className={cn(
                        'mt-0.5 text-lg font-bold',
                        value > 0 && 'text-success-fg',
                        value < 0 && 'text-danger-fg',
                        value === 0 && 'text-text-secondary',
                      )}
                    >
                      {value >= 0 ? `+${value}` : value}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Feats — chips with contrast */}
        {draft.feats && draft.feats.length > 0 && (
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium tracking-wide text-text-secondary uppercase">
                Feats
              </p>
              <StepEditLink step="feats" label="feats" />
            </div>
            <div className="flex flex-wrap gap-2">
              {draft.feats.map((feat) => (
                <span
                  key={feat.id}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-sm font-medium',
                    feat.type === 'archetype'
                      ? cn(statusPanel.warning, 'text-warning-fg')
                      : cn(statusPanel.info, 'text-info-fg'),
                  )}
                >
                  {feat.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Powers & Techniques — section headers with power/martial color, list with EN */}
        {((draft.powers && draft.powers.length > 0) ||
          (draft.techniques && draft.techniques.length > 0)) && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium tracking-wide text-text-secondary uppercase">
                Powers &amp; techniques
              </p>
              <StepEditLink step="powers" label="powers" />
            </div>
            {draft.powers && draft.powers.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium tracking-wide text-power-fg uppercase">
                  Powers
                </p>
                <div className="flex flex-wrap gap-2">
                  {draft.powers.map((p) => {
                    const doc: PowerDocument = {
                      name: String(p.name ?? ''),
                      description: String(p.description ?? ''),
                      parts: Array.isArray(p.parts) ? (p.parts as PowerDocument['parts']) : [],
                      damage: (p as CharacterPower & { damage?: PowerDocument['damage'] }).damage,
                      actionType: (p as CharacterPower & { actionType?: string }).actionType,
                      isReaction: (p as CharacterPower & { isReaction?: boolean }).isReaction,
                      range: (p as CharacterPower & { range?: PowerDocument['range'] }).range,
                      area: (p as CharacterPower & { area?: PowerDocument['area'] }).area,
                      duration: (p as CharacterPower & { duration?: PowerDocument['duration'] })
                        .duration,
                    };
                    const display = derivePowerDisplay(doc, powerPartsDb ?? []);
                    const en = typeof display.energy === 'number' ? display.energy : '-';
                    return (
                      <span
                        key={String(p.id)}
                        className="dark:bg-power-900/30 rounded-lg border border-power/30 bg-power-light/50 px-3 py-1.5 text-sm font-medium text-power-fg"
                      >
                        {p.name} <span className="opacity-90">({en} EN)</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            {draft.techniques && draft.techniques.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium tracking-wide text-martial-fg uppercase">
                  Techniques
                </p>
                <div className="flex flex-wrap gap-2">
                  {draft.techniques.map((t) => {
                    const doc: TechniqueDocument = {
                      name: String(t.name ?? ''),
                      description: String(t.description ?? ''),
                      parts: Array.isArray(t.parts) ? (t.parts as TechniqueDocument['parts']) : [],
                      damage:
                        Array.isArray((t as CharacterTechnique & { damage?: unknown }).damage) &&
                        (t as CharacterTechnique & { damage: unknown[] }).damage[0]
                          ? ((t as CharacterTechnique & { damage: unknown[] })
                              .damage[0] as TechniqueDocument['damage'])
                          : (t as CharacterTechnique & { damage?: TechniqueDocument['damage'] })
                              .damage,
                      weapon: (t as CharacterTechnique & { weapon?: TechniqueDocument['weapon'] })
                        .weapon,
                    };
                    const display = deriveTechniqueDisplay(doc, techniquePartsDb ?? []);
                    const en = typeof display.energy === 'number' ? display.energy : '-';
                    return (
                      <span
                        key={String(t.id)}
                        className="dark:bg-martial-900/30 rounded-lg border border-martial/30 bg-martial-light/50 px-3 py-1.5 text-sm font-medium text-martial-fg"
                      >
                        {t.name} <span className="opacity-90">({en} EN)</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Equipment */}
        {draft.equipment?.inventory && draft.equipment.inventory.length > 0 && (
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium tracking-wide text-text-secondary uppercase">
                Equipment
              </p>
              <StepEditLink step="equipment" label="equipment" />
            </div>
            <p className="text-sm text-text-primary">
              {draft.equipment.inventory
                .map((i) => ((i.quantity ?? 1) > 1 ? `${i.name} ×${i.quantity ?? 1}` : i.name))
                .join(', ')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
