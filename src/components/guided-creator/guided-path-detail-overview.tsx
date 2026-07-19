/**
 * Read-only path overview for GuidedPathDetailModal.
 */

'use client';

import { useMemo } from 'react';
import { DescriptorChip } from '@/components/ui';
import { SummaryChipList } from '@/components/shared';
import { useCodexSkills } from '@/hooks';
import { formatAbilityLabel } from '@/lib/constants/ability-effect-blurbs';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { speciesSkillToSummaryChipItem } from '@/lib/chip/species-skill-chips';
import { resolvePathAbilityLabels } from '@/lib/guided-creator/path-ability-labels';
import { cn } from '@/lib/utils';
import type { AbilityName } from '@/types';
import type { Archetype, ArchetypePathData } from '@/types/archetype';
import { GUIDED_CHOICE_STYLES, GUIDED_OVERVIEW_STYLES as o } from './guided-choice-styles';
import { GuidedOverviewSection } from './guided-overview-section';

const copy = GUIDED_CREATOR_COPY.steps.path.detail;

export interface GuidedPathDetailOverviewProps {
  path: Archetype;
  pathData: ArchetypePathData | undefined;
}

function relevantProficiencyLines(
  pathType: Archetype['type'],
  power: number | null,
  martial: number | null
): string[] {
  const parts: string[] = [];
  const showPower = pathType === 'power' || pathType === 'powered-martial';
  const showMartial = pathType === 'martial' || pathType === 'powered-martial';
  if (showPower && power != null && Number.isFinite(power) && power > 0) {
    parts.push(copy.proficiencyPower(power));
  }
  if (showMartial && martial != null && Number.isFinite(martial) && martial > 0) {
    parts.push(copy.proficiencyMartial(martial));
  }
  return parts;
}

export function GuidedPathDetailOverview({ path, pathData }: GuidedPathDetailOverviewProps) {
  const { data: allSkills = [] } = useCodexSkills();
  const level1 = pathData?.level1;
  const pathType = (path.type || 'power') as Archetype['type'];

  const proficiency = useMemo(() => {
    const power = level1?.proficiency?.power ?? path.power_prof_start ?? null;
    const martial = level1?.proficiency?.martial ?? path.martial_prof_start ?? null;
    return relevantProficiencyLines(
      pathType,
      power != null ? Number(power) : null,
      martial != null ? Number(martial) : null
    );
  }, [level1?.proficiency, path.martial_prof_start, path.power_prof_start, pathType]);

  const abilityChips = useMemo(() => {
    const { primaryAbilities, secondaryAbility } = resolvePathAbilityLabels(path);
    const chips: Array<{ key: string; label: string; variant?: 'primary' }> = [];

    for (const ability of primaryAbilities) {
      chips.push({
        key: `primary-${ability}`,
        label: copy.primaryAbility(formatAbilityLabel(ability)),
        variant: 'primary',
      });
    }

    if (secondaryAbility) {
      chips.push({
        key: 'secondary',
        label: copy.secondaryAbility(formatAbilityLabel(secondaryAbility)),
      });
    }

    return chips;
  }, [path]);

  const recommendedAbilities = level1?.recommended_abilities;

  const skillChips = useMemo(() => {
    const ids = level1?.skills ?? [];
    if (!ids.length) return [];
    return ids
      .map((id) => {
        const key = String(id).toLowerCase();
        const skill = allSkills.find(
          (s) => String(s.id).toLowerCase() === key || String(s.name).toLowerCase() === key
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

      {proficiency.length > 0 ? (
        <GuidedOverviewSection title={copy.proficiencyTitle}>
          <ul className="m-0 list-none space-y-1 p-0">
            {proficiency.map((line) => (
              <li key={line} className={o.body}>
                {line}
              </li>
            ))}
          </ul>
        </GuidedOverviewSection>
      ) : null}

      {abilityChips.length > 0 ? (
        <GuidedOverviewSection title={copy.pathAbilitiesTitle}>
          <div className="flex flex-wrap gap-2">
            {abilityChips.map((chip) => (
              <DescriptorChip key={chip.key} variant={chip.variant} size="sm">
                {chip.label}
              </DescriptorChip>
            ))}
          </div>
        </GuidedOverviewSection>
      ) : null}

      {recommendedAbilities && Object.keys(recommendedAbilities).length > 0 ? (
        <GuidedOverviewSection title={copy.recommendedAbilitiesTitle}>
          <div className="flex flex-wrap gap-2">
            {Object.entries(recommendedAbilities).map(([ability, value]) => (
              <DescriptorChip key={ability} variant="primary" size="sm">
                {formatAbilityLabel(ability as AbilityName)} {Number(value) >= 0 ? '+' : ''}
                {value}
              </DescriptorChip>
            ))}
          </div>
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
