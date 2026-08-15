'use client';

import { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { useCodexFeats, useCodexSkills, useEquipment, useOfficialLibrary } from '@/hooks';
import { getPathRecommendationsForLevel } from '@/lib/game/archetype-path';
import { indexDisplayNamesByNormalizedIds, resolveNormalizedRefList } from '@/lib/utils';
import type { ArchetypePathRecommendations, CharacterArchetype } from '@/types/archetype';

function pathRecommendationsHasContent(rec: ArchetypePathRecommendations | undefined): boolean {
  if (!rec) return false;
  const lists = [
    rec.feats,
    rec.skills,
    rec.powers,
    rec.techniques,
    rec.armaments,
    rec.equipment,
    rec.removeFeats,
    rec.removePowers,
    rec.removeTechniques,
    rec.removeArmaments,
  ];
  if (lists.some((list) => list && list.length > 0)) return true;
  return Boolean(rec.notes?.trim());
}

function GuidanceSection({
  title,
  items,
  variant = 'add',
}: {
  title: string;
  items: string[];
  variant?: 'add' | 'remove';
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p
        className={
          variant === 'remove'
            ? 'mb-1 text-xs font-semibold tracking-wide text-danger-fg uppercase'
            : 'mb-1 text-xs font-semibold tracking-wide text-text-secondary uppercase'
        }
      >
        {title}
      </p>
      <ul className="list-inside list-disc space-y-0.5 text-sm text-text-primary">
        {items.map((item) => (
          <li key={`${title}-${item}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export interface PathRemoveGuidanceProps {
  archetype: CharacterArchetype | undefined;
  targetLevel: number;
  pathName?: string;
  /** Compact layout for sheet header (no outer card chrome). */
  compact?: boolean;
}

export function PathRemoveGuidance({
  archetype,
  targetLevel,
  pathName,
  compact = false,
}: PathRemoveGuidanceProps) {
  const recommendations = useMemo(
    () => getPathRecommendationsForLevel(archetype, targetLevel),
    [archetype, targetLevel],
  );

  const { data: feats = [] } = useCodexFeats();
  const { data: equipment = [] } = useEquipment();
  const { data: publicPowers = [] } = useOfficialLibrary('powers');
  const { data: publicTechniques = [] } = useOfficialLibrary('techniques');
  const { data: publicItems = [] } = useOfficialLibrary('items');

  const resolved = useMemo(() => {
    if (!recommendations) return null;
    const featLookup = indexDisplayNamesByNormalizedIds(feats);
    const equipLookup = indexDisplayNamesByNormalizedIds([...equipment, ...publicItems]);
    const powerLookup = indexDisplayNamesByNormalizedIds(publicPowers);
    const techniqueLookup = indexDisplayNamesByNormalizedIds(publicTechniques);

    return {
      removeFeats: resolveNormalizedRefList(
        recommendations.removeFeats,
        featLookup.byId,
        featLookup.byName,
      ),
      removePowers: resolveNormalizedRefList(
        recommendations.removePowers,
        powerLookup.byId,
        powerLookup.byName,
      ),
      removeTechniques: resolveNormalizedRefList(
        recommendations.removeTechniques,
        techniqueLookup.byId,
        techniqueLookup.byName,
      ),
      removeArmaments: resolveNormalizedRefList(
        recommendations.removeArmaments,
        equipLookup.byId,
        equipLookup.byName,
      ),
    };
  }, [recommendations, feats, equipment, publicPowers, publicTechniques, publicItems]);

  if (!resolved) return null;

  const hasRemoveLists =
    resolved.removeFeats.length > 0 ||
    resolved.removePowers.length > 0 ||
    resolved.removeTechniques.length > 0 ||
    resolved.removeArmaments.length > 0;

  if (!hasRemoveLists) return null;

  const displayName = pathName || archetype?.name || 'Archetype path';

  const content = (
    <>
      <p className="text-xs font-medium text-text-secondary">
        Optional guidance. Nothing is removed automatically.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <GuidanceSection title="Feats" items={resolved.removeFeats} variant="remove" />
        <GuidanceSection title="Powers" items={resolved.removePowers} variant="remove" />
        <GuidanceSection title="Techniques" items={resolved.removeTechniques} variant="remove" />
        <GuidanceSection title="Armaments" items={resolved.removeArmaments} variant="remove" />
      </div>
    </>
  );

  if (compact) {
    return (
      <div
        className="space-y-2 rounded-lg border border-danger-200 bg-danger-50/50 px-4 py-3 dark:border-danger-800/50 dark:bg-danger-900/10"
        role="region"
        aria-label={`Consider replacing or removing for ${displayName} at level ${targetLevel}`}
      >
        <p className="text-xs font-semibold tracking-wide text-danger-fg uppercase">
          Consider replacing or removing
        </p>
        {content}
      </div>
    );
  }

  return (
    <div className="space-y-2 border-t border-border-light pt-2">
      <p className="text-xs font-medium text-text-secondary">Consider replacing or removing</p>
      {content}
    </div>
  );
}

export interface PathLevelGuidanceProps {
  archetype: CharacterArchetype | undefined;
  pathName?: string;
  targetLevel: number;
}

export function PathLevelGuidance({ archetype, pathName, targetLevel }: PathLevelGuidanceProps) {
  const recommendations = useMemo(
    () => getPathRecommendationsForLevel(archetype, targetLevel),
    [archetype, targetLevel],
  );

  const { data: feats = [] } = useCodexFeats();
  const { data: skills = [] } = useCodexSkills();
  const { data: equipment = [] } = useEquipment();
  const { data: publicPowers = [] } = useOfficialLibrary('powers');
  const { data: publicTechniques = [] } = useOfficialLibrary('techniques');
  const { data: publicItems = [] } = useOfficialLibrary('items');

  const resolved = useMemo(() => {
    if (!recommendations) return null;
    const featLookup = indexDisplayNamesByNormalizedIds(feats);
    const skillLookup = indexDisplayNamesByNormalizedIds(skills);
    const equipLookup = indexDisplayNamesByNormalizedIds([...equipment, ...publicItems]);
    const powerLookup = indexDisplayNamesByNormalizedIds(publicPowers);
    const techniqueLookup = indexDisplayNamesByNormalizedIds(publicTechniques);

    return {
      feats: resolveNormalizedRefList(recommendations.feats, featLookup.byId, featLookup.byName),
      skills: resolveNormalizedRefList(
        recommendations.skills,
        skillLookup.byId,
        skillLookup.byName,
      ),
      powers: resolveNormalizedRefList(
        recommendations.powers,
        powerLookup.byId,
        powerLookup.byName,
      ),
      techniques: resolveNormalizedRefList(
        recommendations.techniques,
        techniqueLookup.byId,
        techniqueLookup.byName,
      ),
      armaments: resolveNormalizedRefList(
        recommendations.armaments,
        equipLookup.byId,
        equipLookup.byName,
      ),
      equipment: resolveNormalizedRefList(
        recommendations.equipment,
        equipLookup.byId,
        equipLookup.byName,
      ),
      removeFeats: resolveNormalizedRefList(
        recommendations.removeFeats,
        featLookup.byId,
        featLookup.byName,
      ),
      removePowers: resolveNormalizedRefList(
        recommendations.removePowers,
        powerLookup.byId,
        powerLookup.byName,
      ),
      removeTechniques: resolveNormalizedRefList(
        recommendations.removeTechniques,
        techniqueLookup.byId,
        techniqueLookup.byName,
      ),
      removeArmaments: resolveNormalizedRefList(
        recommendations.removeArmaments,
        equipLookup.byId,
        equipLookup.byName,
      ),
      notes: recommendations.notes?.trim(),
    };
  }, [recommendations, feats, skills, equipment, publicPowers, publicTechniques, publicItems]);

  if (!pathRecommendationsHasContent(recommendations) || !resolved) {
    return (
      <div
        className="rounded-lg border border-border-light bg-surface-alt px-4 py-3 text-sm text-text-muted"
        role="status"
      >
        No path progression entries for level {targetLevel} in the codex.
      </div>
    );
  }

  const displayName = pathName || archetype?.name || 'Archetype path';

  return (
    <div
      className="space-y-3 rounded-lg border-2 border-primary-subtle-border bg-primary-subtle-bg px-4 py-4"
      role="region"
      aria-label={`Path guidance for ${displayName} at level ${targetLevel}`}
    >
      <div className="flex items-start gap-2">
        <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-fg" aria-hidden />
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            {displayName}: Level {targetLevel} guidance
          </h3>
          <p className="mt-0.5 text-xs text-text-secondary">
            Suggested picks from your archetype path (optional; add manually on your sheet).
          </p>
        </div>
      </div>

      {resolved.notes ? (
        <p className="border-l-2 border-primary-subtle-border pl-3 text-sm whitespace-pre-wrap text-text-primary">
          {resolved.notes}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <GuidanceSection title="Recommended Feats" items={resolved.feats} />
        <GuidanceSection title="Recommended Skills" items={resolved.skills} />
        <GuidanceSection title="Recommended Powers" items={resolved.powers} />
        <GuidanceSection title="Recommended Techniques" items={resolved.techniques} />
        <GuidanceSection title="Recommended armaments" items={resolved.armaments} />
        <GuidanceSection title="Recommended equipment" items={resolved.equipment} />
      </div>

      {(resolved.removeFeats.length > 0 ||
        resolved.removePowers.length > 0 ||
        resolved.removeTechniques.length > 0 ||
        resolved.removeArmaments.length > 0) && (
        <PathRemoveGuidance archetype={archetype} targetLevel={targetLevel} pathName={pathName} />
      )}
    </div>
  );
}
