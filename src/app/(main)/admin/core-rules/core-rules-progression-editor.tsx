'use client';

import { FieldRow, NumInput, SectionTitle, TextInput } from './core-rules-field-editors';
import { ProgressionPreview } from './core-rules-progression-preview';

export function ProgressionEditor({
  data,
  set,
  creatureData,
  setCreature,
}: {
  data: Record<string, unknown>;
  set: (key: string, value: unknown) => void;
  creatureData?: Record<string, unknown> | undefined;
  setCreature?: ((key: string, value: unknown) => void) | undefined;
}) {
  return (
    <>
      <SectionTitle>Player Character Progression</SectionTitle>
      <FieldRow label="Base Ability Points">
        <NumInput
          value={(data.baseAbilityPoints as number) ?? 7}
          onChange={(v) => set('baseAbilityPoints', v)}
        />
      </FieldRow>
      <FieldRow label="Ability Points Every N Levels">
        <NumInput
          value={(data.abilityPointsEveryNLevels as number) ?? 3}
          onChange={(v) => set('abilityPointsEveryNLevels', v)}
        />
      </FieldRow>
      <FieldRow label="Ability Points Per Increase">
        <NumInput
          value={(data.abilityPointsPerIncrease as number) ?? 1}
          onChange={(v) => set('abilityPointsPerIncrease', v)}
        />
      </FieldRow>
      <FieldRow label="Skill Points / Level">
        <NumInput
          value={(data.skillPointsPerLevel as number) ?? 3}
          onChange={(v) => set('skillPointsPerLevel', v)}
        />
      </FieldRow>
      <FieldRow label="Base Health/Energy Pool">
        <NumInput
          value={(data.baseHitEnergyPool as number) ?? 18}
          onChange={(v) => set('baseHitEnergyPool', v)}
        />
      </FieldRow>
      <FieldRow label="Health/Energy Per Level">
        <NumInput
          value={(data.hitEnergyPerLevel as number) ?? 12}
          onChange={(v) => set('hitEnergyPerLevel', v)}
        />
      </FieldRow>
      <FieldRow label="Base Proficiency">
        <NumInput
          value={(data.baseProficiency as number) ?? 2}
          onChange={(v) => set('baseProficiency', v)}
        />
      </FieldRow>
      <FieldRow label="Proficiency Every N Levels">
        <NumInput
          value={(data.proficiencyEveryNLevels as number) ?? 5}
          onChange={(v) => set('proficiencyEveryNLevels', v)}
        />
      </FieldRow>
      <FieldRow label="Proficiency Per Increase">
        <NumInput
          value={(data.proficiencyPerIncrease as number) ?? 1}
          onChange={(v) => set('proficiencyPerIncrease', v)}
        />
      </FieldRow>
      <FieldRow label="Base Training Points">
        <NumInput
          value={(data.baseTrainingPoints as number) ?? 22}
          onChange={(v) => set('baseTrainingPoints', v)}
        />
      </FieldRow>
      <FieldRow label="TP Per Level Multiplier">
        <NumInput
          value={(data.tpPerLevelMultiplier as number) ?? 2}
          onChange={(v) => set('tpPerLevelMultiplier', v)}
        />
      </FieldRow>
      <FieldRow label="Base Health">
        <NumInput value={(data.baseHealth as number) ?? 8} onChange={(v) => set('baseHealth', v)} />
      </FieldRow>
      <FieldRow label="Starting Currency">
        <NumInput
          value={(data.startingCurrency as number) ?? 200}
          onChange={(v) => set('startingCurrency', v)}
        />
      </FieldRow>
      <FieldRow label="Character Feats / Level">
        <NumInput
          value={(data.characterFeatsPerLevel as number) ?? 1}
          onChange={(v) => set('characterFeatsPerLevel', v)}
        />
      </FieldRow>
      <FieldRow label="XP-to-Level Formula">
        <TextInput
          value={(data.xpToLevelFormula as string) ?? 'level * 4'}
          onChange={(v) => set('xpToLevelFormula', v)}
        />
      </FieldRow>

      <ProgressionPreview data={data} />

      {creatureData && setCreature && (
        <>
          <SectionTitle>Creature Progression</SectionTitle>
          <FieldRow label="Base Ability Points">
            <NumInput
              value={(creatureData.baseAbilityPoints as number) ?? 7}
              onChange={(v) => setCreature('baseAbilityPoints', v)}
            />
          </FieldRow>
          <FieldRow label="Ability Points Every N Levels">
            <NumInput
              value={(creatureData.abilityPointsEveryNLevels as number) ?? 3}
              onChange={(v) => setCreature('abilityPointsEveryNLevels', v)}
            />
          </FieldRow>
          <FieldRow label="Skill Points at Level 1">
            <NumInput
              value={(creatureData.skillPointsAtLevel1 as number) ?? 5}
              onChange={(v) => setCreature('skillPointsAtLevel1', v)}
            />
          </FieldRow>
          <FieldRow label="Skill Points / Level">
            <NumInput
              value={(creatureData.skillPointsPerLevel as number) ?? 3}
              onChange={(v) => setCreature('skillPointsPerLevel', v)}
            />
          </FieldRow>
          <FieldRow label="Base Health/Energy Pool">
            <NumInput
              value={(creatureData.baseHitEnergyPool as number) ?? 26}
              onChange={(v) => setCreature('baseHitEnergyPool', v)}
            />
          </FieldRow>
          <FieldRow label="Health/Energy Per Level">
            <NumInput
              value={(creatureData.hitEnergyPerLevel as number) ?? 12}
              onChange={(v) => setCreature('hitEnergyPerLevel', v)}
            />
          </FieldRow>
          <FieldRow label="Base Proficiency">
            <NumInput
              value={(creatureData.baseProficiency as number) ?? 2}
              onChange={(v) => setCreature('baseProficiency', v)}
            />
          </FieldRow>
          <FieldRow label="Proficiency Every N Levels">
            <NumInput
              value={(creatureData.proficiencyEveryNLevels as number) ?? 5}
              onChange={(v) => setCreature('proficiencyEveryNLevels', v)}
            />
          </FieldRow>
          <FieldRow label="Base Training Points">
            <NumInput
              value={(creatureData.baseTrainingPoints as number) ?? 22}
              onChange={(v) => setCreature('baseTrainingPoints', v)}
            />
          </FieldRow>
          <FieldRow label="TP Per Level Multiplier">
            <NumInput
              value={(creatureData.tpPerLevelMultiplier as number) ?? 2}
              onChange={(v) => setCreature('tpPerLevelMultiplier', v)}
            />
          </FieldRow>
          <FieldRow label="Base Feat Points">
            <NumInput
              value={(creatureData.baseFeatPoints as number) ?? 4}
              onChange={(v) => setCreature('baseFeatPoints', v)}
              step={0.5}
            />
          </FieldRow>
          <FieldRow label="Feat Points / Level">
            <NumInput
              value={(creatureData.featPointsPerLevel as number) ?? 1}
              onChange={(v) => setCreature('featPointsPerLevel', v)}
            />
          </FieldRow>
          <FieldRow label="Base Currency">
            <NumInput
              value={(creatureData.baseCurrency as number) ?? 200}
              onChange={(v) => setCreature('baseCurrency', v)}
            />
          </FieldRow>
          <FieldRow label="Currency Growth Rate">
            <NumInput
              value={(creatureData.currencyGrowthRate as number) ?? 1.45}
              onChange={(v) => setCreature('currencyGrowthRate', v)}
              step={0.01}
            />
          </FieldRow>
        </>
      )}
    </>
  );
}
