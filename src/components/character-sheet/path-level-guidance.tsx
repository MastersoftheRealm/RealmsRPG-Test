'use client';

import { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { useCodexFeats, useCodexSkills, useEquipment, useOfficialLibrary } from '@/hooks';
import { getPathRecommendationsForLevel } from '@/lib/game/archetype-path';
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

function buildLookupMaps(
  items: Array<{ id?: string | number; name?: string; docId?: string }>
): { byId: Map<string, string>; byName: Map<string, string> } {
  const byId = new Map<string, string>();
  const byName = new Map<string, string>();
  for (const item of items) {
    const name = String(item.name ?? '').trim();
    if (!name) continue;
    const ids = [item.id, item.docId].filter(Boolean).map(String);
    for (const id of ids) {
      byId.set(id, name);
      byId.set(id.toLowerCase(), name);
    }
    byName.set(name.toLowerCase(), name);
  }
  return { byId, byName };
}

function resolveRefLabel(
  ref: string,
  byId: Map<string, string>,
  byName: Map<string, string>
): string {
  const trimmed = ref.trim();
  const colon = trimmed.indexOf(':');
  const idPart = colon >= 0 ? trimmed.slice(0, colon).trim() : trimmed;
  const qtyPart = colon >= 0 ? trimmed.slice(colon + 1).trim() : '';
  const label =
    byId.get(idPart) ??
    byId.get(idPart.toLowerCase()) ??
    byName.get(idPart.toLowerCase()) ??
    idPart;
  if (qtyPart && Number.parseInt(qtyPart, 10) > 1) {
    return `${label} ×${qtyPart}`;
  }
  return label;
}

function resolveRefList(
  refs: string[] | undefined,
  byId: Map<string, string>,
  byName: Map<string, string>
): string[] {
  if (!refs?.length) return [];
  return refs.map((ref) => resolveRefLabel(ref, byId, byName));
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
            ? 'text-xs font-semibold uppercase tracking-wide text-danger-fg mb-1'
            : 'text-xs font-semibold uppercase tracking-wide text-text-secondary mb-1'
        }
      >
        {title}
      </p>
      <ul className="text-sm text-text-primary space-y-0.5 list-disc list-inside">
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
    [archetype, targetLevel]
  );

  const { data: feats = [] } = useCodexFeats();
  const { data: equipment = [] } = useEquipment();
  const { data: publicPowers = [] } = useOfficialLibrary('powers');
  const { data: publicTechniques = [] } = useOfficialLibrary('techniques');
  const { data: publicItems = [] } = useOfficialLibrary('items');

  const resolved = useMemo(() => {
    if (!recommendations) return null;
    const featLookup = buildLookupMaps(feats);
    const equipLookup = buildLookupMaps([...equipment, ...publicItems]);
    const powerLookup = buildLookupMaps(publicPowers);
    const techniqueLookup = buildLookupMaps(publicTechniques);

    return {
      removeFeats: resolveRefList(recommendations.removeFeats, featLookup.byId, featLookup.byName),
      removePowers: resolveRefList(recommendations.removePowers, powerLookup.byId, powerLookup.byName),
      removeTechniques: resolveRefList(
        recommendations.removeTechniques,
        techniqueLookup.byId,
        techniqueLookup.byName
      ),
      removeArmaments: resolveRefList(recommendations.removeArmaments, equipLookup.byId, equipLookup.byName),
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
        Optional guidance — nothing is removed automatically.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        className="rounded-lg border border-danger-200 dark:border-danger-800/50 bg-danger-50/50 dark:bg-danger-900/10 px-4 py-3 space-y-2"
        role="region"
        aria-label={`Consider replacing or removing for ${displayName} at level ${targetLevel}`}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-danger-fg">
          Consider replacing or removing
        </p>
        {content}
      </div>
    );
  }

  return (
    <div className="pt-2 border-t border-border-light space-y-2">
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
    [archetype, targetLevel]
  );

  const { data: feats = [] } = useCodexFeats();
  const { data: skills = [] } = useCodexSkills();
  const { data: equipment = [] } = useEquipment();
  const { data: publicPowers = [] } = useOfficialLibrary('powers');
  const { data: publicTechniques = [] } = useOfficialLibrary('techniques');
  const { data: publicItems = [] } = useOfficialLibrary('items');

  const resolved = useMemo(() => {
    if (!recommendations) return null;
    const featLookup = buildLookupMaps(feats);
    const skillLookup = buildLookupMaps(skills);
    const equipLookup = buildLookupMaps([...equipment, ...publicItems]);
    const powerLookup = buildLookupMaps(publicPowers);
    const techniqueLookup = buildLookupMaps(publicTechniques);

    return {
      feats: resolveRefList(recommendations.feats, featLookup.byId, featLookup.byName),
      skills: resolveRefList(recommendations.skills, skillLookup.byId, skillLookup.byName),
      powers: resolveRefList(recommendations.powers, powerLookup.byId, powerLookup.byName),
      techniques: resolveRefList(recommendations.techniques, techniqueLookup.byId, techniqueLookup.byName),
      armaments: resolveRefList(recommendations.armaments, equipLookup.byId, equipLookup.byName),
      equipment: resolveRefList(recommendations.equipment, equipLookup.byId, equipLookup.byName),
      removeFeats: resolveRefList(recommendations.removeFeats, featLookup.byId, featLookup.byName),
      removePowers: resolveRefList(recommendations.removePowers, powerLookup.byId, powerLookup.byName),
      removeTechniques: resolveRefList(
        recommendations.removeTechniques,
        techniqueLookup.byId,
        techniqueLookup.byName
      ),
      removeArmaments: resolveRefList(recommendations.removeArmaments, equipLookup.byId, equipLookup.byName),
      notes: recommendations.notes?.trim(),
    };
  }, [recommendations, feats, skills, equipment, publicPowers, publicTechniques, publicItems]);

  if (!pathRecommendationsHasContent(recommendations) || !resolved) {
    return (
      <div
        className="rounded-lg border border-border-light bg-surface-alt px-4 py-3 text-sm text-text-muted dark:text-text-secondary"
        role="status"
      >
        No path progression entries for level {targetLevel} in the codex.
      </div>
    );
  }

  const displayName = pathName || archetype?.name || 'Archetype path';

  return (
    <div
      className="rounded-lg border-2 border-primary-subtle-border bg-primary-subtle-bg px-4 py-4 space-y-3"
      role="region"
      aria-label={`Path guidance for ${displayName} at level ${targetLevel}`}
    >
      <div className="flex items-start gap-2">
        <MapPin className="w-5 h-5 text-primary-fg flex-shrink-0 mt-0.5" aria-hidden />
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            {displayName} — Level {targetLevel} guidance
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Suggested picks from your archetype path (optional — add manually on your sheet).
          </p>
        </div>
      </div>

      {resolved.notes ? (
        <p className="text-sm text-text-primary whitespace-pre-wrap border-l-2 border-primary-subtle-border pl-3">
          {resolved.notes}
        </p>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <GuidanceSection title="Recommended feats" items={resolved.feats} />
        <GuidanceSection title="Recommended skills" items={resolved.skills} />
        <GuidanceSection title="Recommended powers" items={resolved.powers} />
        <GuidanceSection title="Recommended techniques" items={resolved.techniques} />
        <GuidanceSection title="Recommended armaments" items={resolved.armaments} />
        <GuidanceSection title="Recommended equipment" items={resolved.equipment} />
      </div>

      {(resolved.removeFeats.length > 0 ||
        resolved.removePowers.length > 0 ||
        resolved.removeTechniques.length > 0 ||
        resolved.removeArmaments.length > 0) && (
        <PathRemoveGuidance
          archetype={archetype}
          targetLevel={targetLevel}
          pathName={pathName}
        />
      )}
    </div>
  );
}
