/**
 * Read-only path overview for GuidedPathDetailModal.
 */

'use client';

import { useMemo } from 'react';
import { DescriptorChip } from '@/components/ui';
import {
  AbilityScoreGrid,
  ABILITY_DISPLAY_ORDER,
  InfoTippy,
  SummaryChipList,
} from '@/components/patterns';
import { useCodexSkills, useGameRules } from '@/hooks';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { speciesSkillToSummaryChipItem } from '@/lib/chip/species-skill-chips';
import { buildPathAbilityChipLabels } from '@/lib/guided-creator/path-ability-labels';
import { getArmamentMax } from '@/lib/game/formulas';
import { cn } from '@/lib/utils';
import { DEFAULT_ABILITIES, type Abilities } from '@/types';
import type { Archetype, ArchetypePathData } from '@/types/archetype';
import { armamentProficiencyHelp, guidedArchetypeAbilityHelp } from '../../../public/tooltip-text';
import { GUIDED_CHOICE_STYLES, GUIDED_OVERVIEW_STYLES as o } from './guided-choice-styles';
import { GuidedOverviewSection } from './guided-overview-section';

const copy = GUIDED_CREATOR_COPY.steps.path.detail;

export interface GuidedPathDetailOverviewProps {
  path: Archetype;
  pathData: ArchetypePathData | undefined;
}

export function GuidedPathDetailOverview({ path, pathData }: GuidedPathDetailOverviewProps) {
  const { data: allSkills = [] } = useCodexSkills();
  const { rules } = useGameRules();
  const level1 = pathData?.level1;
  const pathType = (path.type || 'power') as Archetype['type'];

  const abilityChips = useMemo(() => buildPathAbilityChipLabels(path), [path]);

  const recommendedAbilitiesGrid = useMemo(() => {
    const raw = level1?.recommended_abilities;
    if (!raw) return null;
    const onlyAbilities = ABILITY_DISPLAY_ORDER.filter((ability) => raw[ability] != null);
    if (onlyAbilities.length === 0) return null;
    const abilities: Abilities = { ...DEFAULT_ABILITIES };
    for (const ability of onlyAbilities) {
      abilities[ability] = Number(raw[ability]);
    }
    return { abilities, onlyAbilities };
  }, [level1?.recommended_abilities]);

  const armamentMax = getArmamentMax(pathType, rules);
  const weaponsAndArmorLine =
    copy.weaponsAndArmor[pathType]?.(armamentMax) ?? copy.weaponsAndArmor.power(armamentMax);

  const skillChips = useMemo(() => {
    const ids = level1?.skills ?? [];
    if (!ids.length) return [];
    return ids
      .map((id) => {
        const key = String(id).toLowerCase();
        const skill = allSkills.find(
          (s) => String(s.id).toLowerCase() === key || String(s.name).toLowerCase() === key,
        );
        if (!skill) return null;
        return speciesSkillToSummaryChipItem(String(skill.id), allSkills);
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [level1?.skills, allSkills]);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-card border border-border-light bg-surface shadow-card">
        <div className="p-4 sm:p-5">
          {path.description?.trim() ? (
            <p className={cn(GUIDED_CHOICE_STYLES.body, 'whitespace-pre-wrap')}>
              {path.description.trim()}
            </p>
          ) : (
            <p className={o.bodySecondary}>{copy.noDescription}</p>
          )}
        </div>
      </div>

      {abilityChips.length > 0 ? (
        <GuidedOverviewSection
          title={copy.pathAbilitiesTitle}
          titleAddon={
            <InfoTippy
              content={guidedArchetypeAbilityHelp}
              label="About Path Abilities"
              size="inline"
            />
          }
        >
          <div className="flex flex-wrap gap-2">
            {abilityChips.map((chip) => (
              <DescriptorChip
                key={chip.key}
                variant={chip.role === 'primary' ? 'primary' : undefined}
                size="md"
              >
                {chip.label}
              </DescriptorChip>
            ))}
          </div>
        </GuidedOverviewSection>
      ) : null}

      <GuidedOverviewSection
        title={copy.weaponsAndArmorTitle}
        titleAddon={
          <InfoTippy
            content={armamentProficiencyHelp}
            label="About Armament Proficiency"
            size="inline"
          />
        }
      >
        <p className={o.body}>{weaponsAndArmorLine}</p>
      </GuidedOverviewSection>

      {recommendedAbilitiesGrid ? (
        <GuidedOverviewSection title={copy.recommendedAbilitiesTitle}>
          <AbilityScoreGrid
            abilities={recommendedAbilitiesGrid.abilities}
            onlyAbilities={recommendedAbilitiesGrid.onlyAbilities}
            density="compact"
            mode="display"
          />
        </GuidedOverviewSection>
      ) : null}

      {skillChips.length > 0 ? (
        <GuidedOverviewSection title={copy.recommendedSkillsTitle}>
          <SummaryChipList items={skillChips} />
        </GuidedOverviewSection>
      ) : null}
    </div>
  );
}
