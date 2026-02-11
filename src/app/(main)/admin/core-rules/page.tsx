/**
 * Admin Core Rules Editor
 * ========================
 * Edit game rules stored in the core_rules table.
 * Each tab edits one category (PROGRESSION_PLAYER, COMBAT, etc.).
 */

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { PageContainer, PageHeader, Button, TabNavigation, Alert, Spinner } from '@/components/ui';
import { useGameRules } from '@/hooks/use-game-rules';
import { updateCodexDoc, createCodexDoc } from '../codex/actions';
import type { CoreRulesMap, ProgressionCreatureRules } from '@/types/core-rules';

// =============================================================================
// Types
// =============================================================================

type CategoryId = keyof CoreRulesMap;

interface TabDef {
  id: string;
  label: string;
  category: CategoryId;
}

const TABS: TabDef[] = [
  { id: 'progression', label: 'Progression', category: 'PROGRESSION_PLAYER' },
  { id: 'combat', label: 'Combat', category: 'COMBAT' },
  { id: 'archetypes', label: 'Archetypes', category: 'ARCHETYPES' },
  { id: 'abilities', label: 'Ability Scores', category: 'ABILITY_RULES' },
  { id: 'skills', label: 'Skills & Defenses', category: 'SKILLS_AND_DEFENSES' },
  { id: 'conditions', label: 'Conditions', category: 'CONDITIONS' },
  { id: 'sizes', label: 'Sizes', category: 'SIZES' },
  { id: 'rarities', label: 'Rarities', category: 'RARITIES' },
  { id: 'damage', label: 'Damage Types', category: 'DAMAGE_TYPES' },
  { id: 'recovery', label: 'Recovery', category: 'RECOVERY' },
  { id: 'experience', label: 'Experience', category: 'EXPERIENCE' },
  { id: 'armament', label: 'Armament Prof.', category: 'ARMAMENT_PROFICIENCY' },
];

// =============================================================================
// Shared field editor components
// =============================================================================

function FieldRow({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-2 border-b border-border-subtle last:border-0">
      <label className="sm:w-64 text-sm font-medium text-text-secondary shrink-0">{label}</label>
      <div className="flex-1">{children}</div>
      {hint && <span className="text-xs text-text-muted ml-2 shrink-0">{hint}</span>}
    </div>
  );
}

function NumInput({ value, onChange, min, max, step }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
      className="w-28 px-3 py-1.5 rounded-lg border border-border-light bg-surface text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-200"
    />
  );
}

function TextInput({ value, onChange, wide, placeholder }: { value: string; onChange: (v: string) => void; wide?: boolean; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${wide ? 'w-full' : 'w-64'} px-3 py-1.5 rounded-lg border border-border-light bg-surface text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-200`}
    />
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-text-primary mt-4 mb-2 border-b border-border pb-1">{children}</h3>;
}

// =============================================================================
// Progression Preview Table
// =============================================================================

function ProgressionPreview({ data }: { data: Record<string, unknown> }) {
  const baseAbility = (data.baseAbilityPoints as number) ?? 7;
  const abilityInterval = (data.abilityPointsEveryNLevels as number) ?? 3;
  const abilityPerIncrease = (data.abilityPointsPerIncrease as number) ?? 1;
  const skillsPerLevel = (data.skillPointsPerLevel as number) ?? 3;
  const basePool = (data.baseHitEnergyPool as number) ?? 18;
  const poolPerLevel = (data.hitEnergyPerLevel as number) ?? 12;
  const baseProf = (data.baseProficiency as number) ?? 2;
  const profInterval = (data.proficiencyEveryNLevels as number) ?? 5;
  const profPerIncrease = (data.proficiencyPerIncrease as number) ?? 1;
  const baseTP = (data.baseTrainingPoints as number) ?? 22;
  const tpMult = (data.tpPerLevelMultiplier as number) ?? 2;

  const rows = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => {
      const level = i + 1;
      const abilityPts = level < abilityInterval ? baseAbility : baseAbility + Math.floor(level / abilityInterval) * abilityPerIncrease;
      const skillPts = skillsPerLevel * level;
      const pool = basePool + poolPerLevel * (level - 1);
      const prof = level < profInterval ? baseProf : baseProf + Math.floor(level / profInterval) * profPerIncrease;
      const tp = baseTP + (tpMult * (level - 1));
      return { level, abilityPts, skillPts, pool, prof, tp };
    });
  }, [baseAbility, abilityInterval, abilityPerIncrease, skillsPerLevel, basePool, poolPerLevel, baseProf, profInterval, profPerIncrease, baseTP, tpMult]);

  return (
    <div className="mt-4 overflow-x-auto">
      <SectionTitle>Level 1-10 Preview</SectionTitle>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-text-muted border-b">
            <th className="text-center py-1 px-2">Lvl</th>
            <th className="text-center py-1 px-2">Ability Pts</th>
            <th className="text-center py-1 px-2">Skill Pts</th>
            <th className="text-center py-1 px-2">HP/EN Pool</th>
            <th className="text-center py-1 px-2">Prof</th>
            <th className="text-center py-1 px-2">Training Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.level} className="border-b border-border-subtle text-center">
              <td className="py-1 px-2 font-medium">{r.level}</td>
              <td className="py-1 px-2">{r.abilityPts}</td>
              <td className="py-1 px-2">{r.skillPts}</td>
              <td className="py-1 px-2">{r.pool}</td>
              <td className="py-1 px-2">{r.prof}</td>
              <td className="py-1 px-2">{r.tp}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// =============================================================================
// Category editor — renders the fields for the active tab's data
// =============================================================================

function CategoryEditor({
  category,
  data,
  onChange,
  creatureData,
  onCreatureChange,
}: {
  category: CategoryId;
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  creatureData?: Record<string, unknown>;
  onCreatureChange?: (data: Record<string, unknown>) => void;
}) {
  const set = (key: string, value: unknown) => {
    onChange({ ...data, [key]: value });
  };

  const setNested = (parent: string, key: string, value: unknown) => {
    const parentObj = (data[parent] || {}) as Record<string, unknown>;
    onChange({ ...data, [parent]: { ...parentObj, [key]: value } });
  };

  const setCreature = (key: string, value: unknown) => {
    if (onCreatureChange && creatureData) {
      onCreatureChange({ ...creatureData, [key]: value });
    }
  };

  switch (category) {
    case 'PROGRESSION_PLAYER':
      return (
        <>
          <SectionTitle>Player Character Progression</SectionTitle>
          <FieldRow label="Base Ability Points"><NumInput value={data.baseAbilityPoints as number ?? 7} onChange={v => set('baseAbilityPoints', v)} /></FieldRow>
          <FieldRow label="Ability Points Every N Levels"><NumInput value={data.abilityPointsEveryNLevels as number ?? 3} onChange={v => set('abilityPointsEveryNLevels', v)} /></FieldRow>
          <FieldRow label="Ability Points Per Increase"><NumInput value={data.abilityPointsPerIncrease as number ?? 1} onChange={v => set('abilityPointsPerIncrease', v)} /></FieldRow>
          <FieldRow label="Skill Points / Level"><NumInput value={data.skillPointsPerLevel as number ?? 3} onChange={v => set('skillPointsPerLevel', v)} /></FieldRow>
          <FieldRow label="Base HP/EN Pool"><NumInput value={data.baseHitEnergyPool as number ?? 18} onChange={v => set('baseHitEnergyPool', v)} /></FieldRow>
          <FieldRow label="HP/EN Per Level"><NumInput value={data.hitEnergyPerLevel as number ?? 12} onChange={v => set('hitEnergyPerLevel', v)} /></FieldRow>
          <FieldRow label="Base Proficiency"><NumInput value={data.baseProficiency as number ?? 2} onChange={v => set('baseProficiency', v)} /></FieldRow>
          <FieldRow label="Proficiency Every N Levels"><NumInput value={data.proficiencyEveryNLevels as number ?? 5} onChange={v => set('proficiencyEveryNLevels', v)} /></FieldRow>
          <FieldRow label="Proficiency Per Increase"><NumInput value={data.proficiencyPerIncrease as number ?? 1} onChange={v => set('proficiencyPerIncrease', v)} /></FieldRow>
          <FieldRow label="Base Training Points"><NumInput value={data.baseTrainingPoints as number ?? 22} onChange={v => set('baseTrainingPoints', v)} /></FieldRow>
          <FieldRow label="TP Per Level Multiplier"><NumInput value={data.tpPerLevelMultiplier as number ?? 2} onChange={v => set('tpPerLevelMultiplier', v)} /></FieldRow>
          <FieldRow label="Base Health"><NumInput value={data.baseHealth as number ?? 8} onChange={v => set('baseHealth', v)} /></FieldRow>
          <FieldRow label="Starting Currency"><NumInput value={data.startingCurrency as number ?? 200} onChange={v => set('startingCurrency', v)} /></FieldRow>
          <FieldRow label="Character Feats / Level"><NumInput value={data.characterFeatsPerLevel as number ?? 1} onChange={v => set('characterFeatsPerLevel', v)} /></FieldRow>
          <FieldRow label="XP-to-Level Formula"><TextInput value={data.xpToLevelFormula as string ?? 'level * 4'} onChange={v => set('xpToLevelFormula', v)} /></FieldRow>

          <ProgressionPreview data={data} />

          {creatureData && onCreatureChange && (
            <>
              <SectionTitle>Creature Progression</SectionTitle>
              <FieldRow label="Base Ability Points"><NumInput value={creatureData.baseAbilityPoints as number ?? 7} onChange={v => setCreature('baseAbilityPoints', v)} /></FieldRow>
              <FieldRow label="Ability Points Every N Levels"><NumInput value={creatureData.abilityPointsEveryNLevels as number ?? 3} onChange={v => setCreature('abilityPointsEveryNLevels', v)} /></FieldRow>
              <FieldRow label="Skill Points at Level 1"><NumInput value={creatureData.skillPointsAtLevel1 as number ?? 5} onChange={v => setCreature('skillPointsAtLevel1', v)} /></FieldRow>
              <FieldRow label="Skill Points / Level"><NumInput value={creatureData.skillPointsPerLevel as number ?? 3} onChange={v => setCreature('skillPointsPerLevel', v)} /></FieldRow>
              <FieldRow label="Base HP/EN Pool"><NumInput value={creatureData.baseHitEnergyPool as number ?? 26} onChange={v => setCreature('baseHitEnergyPool', v)} /></FieldRow>
              <FieldRow label="HP/EN Per Level"><NumInput value={creatureData.hitEnergyPerLevel as number ?? 12} onChange={v => setCreature('hitEnergyPerLevel', v)} /></FieldRow>
              <FieldRow label="Base Proficiency"><NumInput value={creatureData.baseProficiency as number ?? 2} onChange={v => setCreature('baseProficiency', v)} /></FieldRow>
              <FieldRow label="Proficiency Every N Levels"><NumInput value={creatureData.proficiencyEveryNLevels as number ?? 5} onChange={v => setCreature('proficiencyEveryNLevels', v)} /></FieldRow>
              <FieldRow label="Base Training Points"><NumInput value={creatureData.baseTrainingPoints as number ?? 22} onChange={v => setCreature('baseTrainingPoints', v)} /></FieldRow>
              <FieldRow label="TP Per Level Multiplier"><NumInput value={creatureData.tpPerLevelMultiplier as number ?? 2} onChange={v => setCreature('tpPerLevelMultiplier', v)} /></FieldRow>
              <FieldRow label="Base Feat Points"><NumInput value={creatureData.baseFeatPoints as number ?? 4} onChange={v => setCreature('baseFeatPoints', v)} step={0.5} /></FieldRow>
              <FieldRow label="Feat Points / Level"><NumInput value={creatureData.featPointsPerLevel as number ?? 1} onChange={v => setCreature('featPointsPerLevel', v)} /></FieldRow>
              <FieldRow label="Base Currency"><NumInput value={creatureData.baseCurrency as number ?? 200} onChange={v => setCreature('baseCurrency', v)} /></FieldRow>
              <FieldRow label="Currency Growth Rate"><NumInput value={creatureData.currencyGrowthRate as number ?? 1.45} onChange={v => setCreature('currencyGrowthRate', v)} step={0.01} /></FieldRow>
            </>
          )}
        </>
      );

    case 'COMBAT':
      return (
        <>
          <SectionTitle>Base Combat Values</SectionTitle>
          <FieldRow label="Base Speed"><NumInput value={data.baseSpeed as number ?? 6} onChange={v => set('baseSpeed', v)} /></FieldRow>
          <FieldRow label="Base Evasion"><NumInput value={data.baseEvasion as number ?? 10} onChange={v => set('baseEvasion', v)} /></FieldRow>
          <FieldRow label="Base Defense"><NumInput value={data.baseDefense as number ?? 10} onChange={v => set('baseDefense', v)} /></FieldRow>
          <FieldRow label="AP Per Round"><NumInput value={data.apPerRound as number ?? 4} onChange={v => set('apPerRound', v)} /></FieldRow>
          <FieldRow label="Multiple Action Penalty"><NumInput value={data.multipleActionPenalty as number ?? -5} onChange={v => set('multipleActionPenalty', v)} /></FieldRow>

          <SectionTitle>Critical Hits &amp; Natural Rolls</SectionTitle>
          <FieldRow label="Critical Hit Threshold" hint="Roll exceeds defense by this much"><NumInput value={data.criticalHitThreshold as number ?? 10} onChange={v => set('criticalHitThreshold', v)} /></FieldRow>
          <FieldRow label="Natural 20 Bonus"><NumInput value={data.natural20Bonus as number ?? 2} onChange={v => set('natural20Bonus', v)} /></FieldRow>
          <FieldRow label="Natural 1 Penalty"><NumInput value={data.natural1Penalty as number ?? -2} onChange={v => set('natural1Penalty', v)} /></FieldRow>

          <SectionTitle>Range Penalties</SectionTitle>
          <FieldRow label="Ranged in Melee Penalty"><NumInput value={data.rangedMeleePenalty as number ?? -5} onChange={v => set('rangedMeleePenalty', v)} /></FieldRow>
          <FieldRow label="Long Range Penalty"><NumInput value={data.longRangePenalty as number ?? -5} onChange={v => set('longRangePenalty', v)} /></FieldRow>

          <SectionTitle>Action Costs (AP)</SectionTitle>
          {data.actionCosts && typeof data.actionCosts === 'object' && Object.entries(data.actionCosts as Record<string, number>).map(([key, val]) => (
            <FieldRow key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}>
              <NumInput value={val} onChange={v => setNested('actionCosts', key, v)} min={0} />
            </FieldRow>
          ))}
        </>
      );

    case 'ARCHETYPES': {
      const configs = (data.configs || {}) as Record<string, Record<string, unknown>>;
      return (
        <>
          <SectionTitle>Archetype Progression</SectionTitle>
          <FieldRow label="Martial Bonus Feats (base)"><NumInput value={data.martialBonusFeatsBase as number ?? 2} onChange={v => set('martialBonusFeatsBase', v)} /></FieldRow>
          <FieldRow label="Martial Bonus Feats Interval"><NumInput value={data.martialBonusFeatsInterval as number ?? 3} onChange={v => set('martialBonusFeatsInterval', v)} /></FieldRow>
          <FieldRow label="Martial Bonus Start Level"><NumInput value={data.martialBonusFeatsStartLevel as number ?? 4} onChange={v => set('martialBonusFeatsStartLevel', v)} /></FieldRow>
          <FieldRow label="P-M Milestone Interval"><NumInput value={data.poweredMartialMilestoneInterval as number ?? 3} onChange={v => set('poweredMartialMilestoneInterval', v)} /></FieldRow>
          <FieldRow label="P-M Milestone Start Level"><NumInput value={data.poweredMartialMilestoneStartLevel as number ?? 4} onChange={v => set('poweredMartialMilestoneStartLevel', v)} /></FieldRow>
          <FieldRow label="Proficiency Increase Interval"><NumInput value={data.proficiencyIncreaseInterval as number ?? 5} onChange={v => set('proficiencyIncreaseInterval', v)} /></FieldRow>

          {['power', 'powered-martial', 'martial'].map(archType => {
            const cfg = configs[archType] || {};
            const setArchField = (field: string, value: unknown) => {
              const updated = { ...configs, [archType]: { ...cfg, [field]: value } };
              set('configs', updated);
            };
            return (
              <div key={archType}>
                <SectionTitle>{archType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Config</SectionTitle>
                <FieldRow label="Feat Limit"><NumInput value={cfg.featLimit as number ?? 0} onChange={v => setArchField('featLimit', v)} /></FieldRow>
                <FieldRow label="Armament Max"><NumInput value={cfg.armamentMax as number ?? 3} onChange={v => setArchField('armamentMax', v)} /></FieldRow>
                <FieldRow label="Innate Energy"><NumInput value={cfg.innateEnergy as number ?? 0} onChange={v => setArchField('innateEnergy', v)} /></FieldRow>
                <FieldRow label="Innate Threshold"><NumInput value={cfg.innateThreshold as number ?? 0} onChange={v => setArchField('innateThreshold', v)} /></FieldRow>
                <FieldRow label="Innate Pools"><NumInput value={cfg.innatePools as number ?? 0} onChange={v => setArchField('innatePools', v)} /></FieldRow>
                <FieldRow label="Training Point Bonus"><NumInput value={cfg.trainingPointBonus as number ?? 0} onChange={v => setArchField('trainingPointBonus', v)} /></FieldRow>
              </div>
            );
          })}
        </>
      );
    }

    case 'ABILITY_RULES': {
      const arrays = (data.standardArrays || {}) as Record<string, number[]>;
      return (
        <>
          <SectionTitle>Ability Score Limits</SectionTitle>
          <FieldRow label="Minimum"><NumInput value={data.min as number ?? -2} onChange={v => set('min', v)} /></FieldRow>
          <FieldRow label="Max at Creation"><NumInput value={data.maxStarting as number ?? 3} onChange={v => set('maxStarting', v)} /></FieldRow>
          <FieldRow label="Max (Characters)"><NumInput value={data.maxAbsoluteCharacter as number ?? 10} onChange={v => set('maxAbsoluteCharacter', v)} /></FieldRow>
          <FieldRow label="Max (Creatures)"><NumInput value={data.maxAbsoluteCreature as number ?? 20} onChange={v => set('maxAbsoluteCreature', v)} /></FieldRow>
          <FieldRow label="Cost Increase Threshold" hint="Costs 2 at this value+"><NumInput value={data.costIncreaseThreshold as number ?? 4} onChange={v => set('costIncreaseThreshold', v)} /></FieldRow>
          <FieldRow label="Normal Cost"><NumInput value={data.normalCost as number ?? 1} onChange={v => set('normalCost', v)} /></FieldRow>
          <FieldRow label="Increased Cost"><NumInput value={data.increasedCost as number ?? 2} onChange={v => set('increasedCost', v)} /></FieldRow>
          <FieldRow label="Max Total Negative"><NumInput value={data.maxTotalNegative as number ?? -3} onChange={v => set('maxTotalNegative', v)} /></FieldRow>

          <SectionTitle>Standard Arrays</SectionTitle>
          {Object.entries(arrays).map(([name, values]) => (
            <div key={name} className="flex items-center gap-2 py-2 border-b border-border-subtle">
              <span className="w-24 text-sm font-medium text-text-secondary capitalize">{name}</span>
              <div className="flex gap-1">
                {values.map((v, i) => (
                  <input
                    key={i}
                    type="number"
                    value={v}
                    onChange={e => {
                      const updated = [...values];
                      updated[i] = parseInt(e.target.value) || 0;
                      set('standardArrays', { ...arrays, [name]: updated });
                    }}
                    className="w-14 px-2 py-1 text-center rounded border border-border-light bg-surface text-sm"
                  />
                ))}
              </div>
              <button
                onClick={() => {
                  const updated = { ...arrays };
                  delete updated[name];
                  set('standardArrays', updated);
                }}
                className="p-1 text-text-muted hover:text-red-500 transition-colors"
                title="Remove array"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              const newName = `custom_${Object.keys(arrays).length + 1}`;
              set('standardArrays', { ...arrays, [newName]: [2, 2, 1, 1, 0, -1] });
            }}
            className="mt-2 flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
          >
            <Plus className="w-3.5 h-3.5" /> Add Standard Array
          </button>
        </>
      );
    }

    case 'SKILLS_AND_DEFENSES':
      return (
        <>
          <SectionTitle>Skill Rules</SectionTitle>
          <FieldRow label="Max Skill Value"><NumInput value={data.maxSkillValue as number ?? 3} onChange={v => set('maxSkillValue', v)} /></FieldRow>
          <FieldRow label="Base Skill Past Cap Cost"><NumInput value={data.baseSkillPastCapCost as number ?? 3} onChange={v => set('baseSkillPastCapCost', v)} /></FieldRow>
          <FieldRow label="Sub-Skill Past Cap Cost"><NumInput value={data.subSkillPastCapCost as number ?? 2} onChange={v => set('subSkillPastCapCost', v)} /></FieldRow>
          <FieldRow label="Defense Increase Cost"><NumInput value={data.defenseIncreaseCost as number ?? 2} onChange={v => set('defenseIncreaseCost', v)} /></FieldRow>
          <FieldRow label="Species Skill Count"><NumInput value={data.speciesSkillCount as number ?? 2} onChange={v => set('speciesSkillCount', v)} /></FieldRow>
          <FieldRow label="Gain Proficiency Cost"><NumInput value={data.gainProficiencyCost as number ?? 1} onChange={v => set('gainProficiencyCost', v)} /></FieldRow>
        </>
      );

    case 'CONDITIONS': {
      const standard = (data.standard || []) as Array<{ name: string; leveled: boolean; description: string }>;
      const leveled = (data.leveled || []) as Array<{ name: string; leveled: boolean; description: string }>;
      return (
        <>
          <SectionTitle>Standard Conditions ({standard.length})</SectionTitle>
          <div className="space-y-2">
            {standard.map((c, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded bg-surface-alt">
                <input
                  value={c.name}
                  onChange={e => {
                    const updated = [...standard];
                    updated[i] = { ...c, name: e.target.value };
                    set('standard', updated);
                  }}
                  className="w-32 px-2 py-1 text-sm font-medium rounded border border-border-light bg-surface"
                />
                <input
                  value={c.description}
                  onChange={e => {
                    const updated = [...standard];
                    updated[i] = { ...c, description: e.target.value };
                    set('standard', updated);
                  }}
                  className="flex-1 px-2 py-1 text-sm rounded border border-border-light bg-surface"
                  placeholder="Description..."
                />
                <button
                  onClick={() => {
                    const updated = standard.filter((_, idx) => idx !== i);
                    set('standard', updated);
                  }}
                  className="p-1 text-text-muted hover:text-red-500 transition-colors shrink-0"
                  title="Remove condition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => set('standard', [...standard, { name: 'New Condition', leveled: false, description: '' }])}
            className="mt-2 flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
          >
            <Plus className="w-3.5 h-3.5" /> Add Standard Condition
          </button>

          <SectionTitle>Leveled Conditions ({leveled.length})</SectionTitle>
          <div className="space-y-2">
            {leveled.map((c, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded bg-surface-alt">
                <input
                  value={c.name}
                  onChange={e => {
                    const updated = [...leveled];
                    updated[i] = { ...c, name: e.target.value };
                    set('leveled', updated);
                  }}
                  className="w-32 px-2 py-1 text-sm font-medium rounded border border-border-light bg-surface"
                />
                <input
                  value={c.description}
                  onChange={e => {
                    const updated = [...leveled];
                    updated[i] = { ...c, description: e.target.value };
                    set('leveled', updated);
                  }}
                  className="flex-1 px-2 py-1 text-sm rounded border border-border-light bg-surface"
                  placeholder="Description..."
                />
                <button
                  onClick={() => {
                    const updated = leveled.filter((_, idx) => idx !== i);
                    set('leveled', updated);
                  }}
                  className="p-1 text-text-muted hover:text-red-500 transition-colors shrink-0"
                  title="Remove condition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => set('leveled', [...leveled, { name: 'New Condition', leveled: true, description: '' }])}
            className="mt-2 flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
          >
            <Plus className="w-3.5 h-3.5" /> Add Leveled Condition
          </button>

          <FieldRow label="Stacking Rules"><TextInput wide value={data.stackingRules as string ?? ''} onChange={v => set('stackingRules', v)} /></FieldRow>
        </>
      );
    }

    case 'SIZES': {
      const categories = (data.categories || []) as Array<Record<string, unknown>>;
      const setSizeField = (index: number, field: string, value: unknown) => {
        const updated = [...categories];
        updated[index] = { ...updated[index], [field]: value };
        set('categories', updated);
      };
      return (
        <>
          <SectionTitle>Size Categories ({categories.length})</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-text-muted border-b">
                  <th className="text-left py-1 px-2">Label</th>
                  <th className="text-left py-1 px-2">Height</th>
                  <th className="text-center py-1 px-2">Spaces</th>
                  <th className="text-center py-1 px-2">Base Carry</th>
                  <th className="text-center py-1 px-2">Per STR</th>
                  <th className="text-center py-1 px-2">Min Carry</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {categories.map((s, i) => (
                  <tr key={i} className="border-b border-border-subtle">
                    <td className="py-1 px-1">
                      <input value={s.label as string ?? ''} onChange={e => setSizeField(i, 'label', e.target.value)} className="w-full px-2 py-1 text-sm rounded border border-border-light bg-surface" />
                    </td>
                    <td className="py-1 px-1">
                      <input value={s.height as string ?? ''} onChange={e => setSizeField(i, 'height', e.target.value)} className="w-full px-2 py-1 text-sm rounded border border-border-light bg-surface" />
                    </td>
                    <td className="text-center py-1 px-1">
                      <NumInput value={s.spaces as number ?? 1} onChange={v => setSizeField(i, 'spaces', v)} min={0} />
                    </td>
                    <td className="text-center py-1 px-1">
                      <NumInput value={s.baseCarry as number ?? 0} onChange={v => setSizeField(i, 'baseCarry', v)} min={0} />
                    </td>
                    <td className="text-center py-1 px-1">
                      <NumInput value={s.perStrCarry as number ?? 0} onChange={v => setSizeField(i, 'perStrCarry', v)} min={0} />
                    </td>
                    <td className="text-center py-1 px-1">
                      <NumInput value={s.minCarry as number ?? 0} onChange={v => setSizeField(i, 'minCarry', v)} min={0} />
                    </td>
                    <td className="py-1 px-1">
                      <button onClick={() => set('categories', categories.filter((_, idx) => idx !== i))} className="p-1 text-text-muted hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={() => set('categories', [...categories, { value: 'custom', label: 'Custom', height: '-', spaces: 1, baseCarry: 0, perStrCarry: 0, minCarry: 0 }])}
            className="mt-2 flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
          >
            <Plus className="w-3.5 h-3.5" /> Add Size Category
          </button>
          <FieldRow label="Half-Capacity Penalty"><TextInput wide value={data.halfCapacitySpeedPenalty as string ?? ''} onChange={v => set('halfCapacitySpeedPenalty', v)} /></FieldRow>
        </>
      );
    }

    case 'RARITIES': {
      const tiers = (data.tiers || []) as Array<Record<string, unknown>>;
      const setTierField = (index: number, field: string, value: unknown) => {
        const updated = [...tiers];
        updated[index] = { ...updated[index], [field]: value };
        set('tiers', updated);
      };
      return (
        <>
          <SectionTitle>Rarity Tiers ({tiers.length})</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-text-muted border-b">
                  <th className="text-left py-1 px-2">Name</th>
                  <th className="text-center py-1 px-2">Level Min</th>
                  <th className="text-center py-1 px-2">Level Max</th>
                  <th className="text-center py-1 px-2">Currency Min</th>
                  <th className="text-center py-1 px-2">Currency Max</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((t, i) => (
                  <tr key={i} className="border-b border-border-subtle">
                    <td className="py-1 px-1">
                      <input value={t.name as string ?? ''} onChange={e => setTierField(i, 'name', e.target.value)} className="w-full px-2 py-1 text-sm rounded border border-border-light bg-surface" />
                    </td>
                    <td className="text-center py-1 px-1"><NumInput value={t.levelMin as number ?? 0} onChange={v => setTierField(i, 'levelMin', v)} min={0} /></td>
                    <td className="text-center py-1 px-1"><NumInput value={t.levelMax as number ?? 0} onChange={v => setTierField(i, 'levelMax', v || null)} min={0} /></td>
                    <td className="text-center py-1 px-1"><NumInput value={t.currencyMin as number ?? 0} onChange={v => setTierField(i, 'currencyMin', v)} min={0} /></td>
                    <td className="text-center py-1 px-1"><NumInput value={t.currencyMax as number ?? 0} onChange={v => setTierField(i, 'currencyMax', v || null)} min={0} /></td>
                    <td className="py-1 px-1">
                      <button onClick={() => set('tiers', tiers.filter((_, idx) => idx !== i))} className="p-1 text-text-muted hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={() => set('tiers', [...tiers, { name: 'New Tier', levelMin: 1, levelMax: null, currencyMin: 0, currencyMax: null }])}
            className="mt-2 flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
          >
            <Plus className="w-3.5 h-3.5" /> Add Rarity Tier
          </button>
        </>
      );
    }

    case 'DAMAGE_TYPES': {
      const all = (data.all || []) as string[];
      const exceptions = (data.armorExceptions || []) as string[];
      const [newType, setNewType] = useState('');
      return (
        <>
          <SectionTitle>All Damage Types ({all.length})</SectionTitle>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {all.map(t => (
              <span key={t} className={`group px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1 ${exceptions.includes(t) ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-surface-alt text-text-secondary'}`}>
                {t}{exceptions.includes(t) ? ' ⚡' : ''}
                <button onClick={() => {
                  set('all', all.filter(x => x !== t));
                  if (exceptions.includes(t)) set('armorExceptions', exceptions.filter(x => x !== t));
                }} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 ml-0.5"><Trash2 className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 mb-4">
            <input value={newType} onChange={e => setNewType(e.target.value)} placeholder="New damage type..." className="w-48 px-2 py-1 text-sm rounded border border-border-light bg-surface" />
            <button onClick={() => { if (newType.trim() && !all.includes(newType.trim())) { set('all', [...all, newType.trim()]); setNewType(''); } }} className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</button>
          </div>

          <SectionTitle>Armor Exception Types</SectionTitle>
          <p className="text-sm text-text-muted mb-2">These damage types bypass armor damage reduction. Click to toggle.</p>
          <div className="flex flex-wrap gap-1.5">
            {all.map(t => (
              <button
                key={t}
                onClick={() => {
                  if (exceptions.includes(t)) {
                    set('armorExceptions', exceptions.filter(x => x !== t));
                  } else {
                    set('armorExceptions', [...exceptions, t]);
                  }
                }}
                className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${exceptions.includes(t) ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 ring-1 ring-amber-300' : 'bg-surface-alt text-text-muted hover:bg-surface-alt/80'}`}
              >
                {t}{exceptions.includes(t) ? ' ⚡' : ''}
              </button>
            ))}
          </div>
          <FieldRow label="Note"><TextInput wide value={data.note as string ?? ''} onChange={v => set('note', v)} /></FieldRow>
        </>
      );
    }

    case 'RECOVERY': {
      const partial = (data.partial || {}) as Record<string, string>;
      const full = (data.full || {}) as Record<string, string>;
      return (
        <>
          <SectionTitle>Partial Recovery</SectionTitle>
          <FieldRow label="Duration"><TextInput wide value={partial.duration ?? ''} onChange={v => setNested('partial', 'duration', v)} /></FieldRow>
          <FieldRow label="Effect"><TextInput wide value={partial.effect ?? ''} onChange={v => setNested('partial', 'effect', v)} /></FieldRow>
          <FieldRow label="Interruption Grace"><TextInput wide value={partial.interruptionGrace ?? ''} onChange={v => setNested('partial', 'interruptionGrace', v)} /></FieldRow>
          <SectionTitle>Full Recovery</SectionTitle>
          <FieldRow label="Duration"><TextInput wide value={full.duration ?? ''} onChange={v => setNested('full', 'duration', v)} /></FieldRow>
          <FieldRow label="Effect"><TextInput wide value={full.effect ?? ''} onChange={v => setNested('full', 'effect', v)} /></FieldRow>
          <FieldRow label="Requirements"><TextInput wide value={data.requirements as string ?? ''} onChange={v => set('requirements', v)} /></FieldRow>
          <FieldRow label="Without Full Recovery"><TextInput wide value={data.withoutFullRecovery as string ?? ''} onChange={v => set('withoutFullRecovery', v)} /></FieldRow>
        </>
      );
    }

    case 'EXPERIENCE':
      return (
        <>
          <SectionTitle>Experience Rules</SectionTitle>
          <FieldRow label="XP to Level Up"><TextInput wide value={data.xpToLevelUp as string ?? ''} onChange={v => set('xpToLevelUp', v)} /></FieldRow>
          <FieldRow label="Combat XP"><TextInput wide value={data.combatXp as string ?? ''} onChange={v => set('combatXp', v)} /></FieldRow>
          <FieldRow label="Skill Encounter XP"><TextInput wide value={data.skillEncounterXp as string ?? ''} onChange={v => set('skillEncounterXp', v)} /></FieldRow>
          <FieldRow label="Skill Encounter DS"><TextInput wide value={data.skillEncounterDS as string ?? ''} onChange={v => set('skillEncounterDS', v)} /></FieldRow>
          <FieldRow label="Skill Encounter Successes"><TextInput wide value={data.skillEncounterSuccesses as string ?? ''} onChange={v => set('skillEncounterSuccesses', v)} /></FieldRow>
          <FieldRow label="Divide XP"><TextInput wide value={data.divideXp as string ?? ''} onChange={v => set('divideXp', v)} /></FieldRow>
        </>
      );

    case 'ARMAMENT_PROFICIENCY': {
      const table = (data.table || []) as Array<{ martialProf: number; armamentMax: number }>;
      return (
        <>
          <SectionTitle>Armament Proficiency Table</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-text-muted border-b">
                  <th className="text-center py-1 px-4">Martial Prof</th>
                  <th className="text-center py-1 px-4">Armament Max (TP)</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {table.map((row, i) => (
                  <tr key={i} className="border-b border-border-subtle">
                    <td className="text-center py-1 px-4">
                      <NumInput value={row.martialProf} onChange={v => { const u = [...table]; u[i] = { ...row, martialProf: v }; set('table', u); }} min={0} />
                    </td>
                    <td className="text-center py-1 px-4">
                      <NumInput value={row.armamentMax} onChange={v => { const u = [...table]; u[i] = { ...row, armamentMax: v }; set('table', u); }} min={0} />
                    </td>
                    <td className="py-1 px-1">
                      <button onClick={() => set('table', table.filter((_, idx) => idx !== i))} className="p-1 text-text-muted hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={() => {
              const nextProf = table.length > 0 ? Math.max(...table.map(r => r.martialProf)) + 1 : 0;
              const nextMax = table.length > 0 ? table[table.length - 1].armamentMax + 3 : 3;
              set('table', [...table, { martialProf: nextProf, armamentMax: nextMax }]);
            }}
            className="mt-2 flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
          >
            <Plus className="w-3.5 h-3.5" /> Add Row
          </button>
        </>
      );
    }

    default:
      return <p className="text-text-muted">No editor available for this category.</p>;
  }
}

// =============================================================================
// Main Page
// =============================================================================

export default function AdminCoreRulesPage() {
  const { rules, isLoading } = useGameRules();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [editData, setEditData] = useState<Record<string, unknown>>({});
  const [creatureEditData, setCreatureEditData] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const activeTabDef = TABS.find(t => t.id === activeTab)!;
  const categoryId = activeTabDef.category;

  // Load current data when tab changes
  useEffect(() => {
    if (rules) {
      const currentData = rules[categoryId];
      setEditData(currentData ? { ...(currentData as unknown as Record<string, unknown>) } : {});

      // For progression tab, also load creature data
      if (categoryId === 'PROGRESSION_PLAYER') {
        const creatureRules = rules.PROGRESSION_CREATURE;
        setCreatureEditData(creatureRules ? { ...(creatureRules as unknown as Record<string, unknown>) } : {});
      }

      setDirty(false);
      setError(null);
      setSuccess(null);
    }
  }, [categoryId, rules]);

  const handleDataChange = useCallback((data: Record<string, unknown>) => {
    setEditData(data);
    setDirty(true);
    setSuccess(null);
  }, []);

  const handleCreatureDataChange = useCallback((data: Record<string, unknown>) => {
    setCreatureEditData(data);
    setDirty(true);
    setSuccess(null);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Save main category
      const result = await updateCodexDoc('core_rules', categoryId, editData);
      if (!result.success) {
        const createResult = await createCodexDoc('core_rules', categoryId, editData);
        if (!createResult.success) {
          throw new Error(createResult.error || 'Failed to save');
        }
      }

      // Also save creature progression if on progression tab
      if (categoryId === 'PROGRESSION_PLAYER' && Object.keys(creatureEditData).length > 0) {
        const creatureResult = await updateCodexDoc('core_rules', 'PROGRESSION_CREATURE', creatureEditData);
        if (!creatureResult.success) {
          const createResult = await createCodexDoc('core_rules', 'PROGRESSION_CREATURE', creatureEditData);
          if (!createResult.success) {
            throw new Error(createResult.error || 'Failed to save creature progression');
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ['core-rules'] });
      queryClient.invalidateQueries({ queryKey: ['codex'] });

      setDirty(false);
      setSuccess(`${activeTabDef.label} saved successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [editData, creatureEditData, categoryId, activeTabDef.label, queryClient]);

  if (isLoading) {
    return (
      <PageContainer size="xl">
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="xl">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/admin" className="text-text-muted hover:text-text-primary transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <PageHeader
          title="Core Rules Editor"
          description="Edit game rules — changes take effect for all users after save."
        />
      </div>

      <TabNavigation
        variant="underline"
        tabs={TABS.map(t => ({ id: t.id, label: t.label }))}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="mt-4 rounded-lg border border-border bg-surface p-6">
        {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
        {success && <Alert variant="success" className="mb-4">{success}</Alert>}

        <CategoryEditor
          category={categoryId}
          data={editData}
          onChange={handleDataChange}
          creatureData={categoryId === 'PROGRESSION_PLAYER' ? creatureEditData : undefined}
          onCreatureChange={categoryId === 'PROGRESSION_PLAYER' ? handleCreatureDataChange : undefined}
        />

        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border">
          <Button
            onClick={handleSave}
            disabled={saving || !dirty}
          >
            {saving ? <><Spinner size="sm" /> Saving...</> : 'Save Changes'}
          </Button>
          {dirty && <span className="text-xs text-amber-600 dark:text-amber-400">Unsaved changes</span>}
        </div>
      </div>
    </PageContainer>
  );
}
