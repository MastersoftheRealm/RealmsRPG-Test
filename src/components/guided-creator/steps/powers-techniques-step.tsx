/**
 * Powers OR Techniques — step title depends on archetype (never both).
 * Shows individual technique/power cards from path recommendations (like archetype feats).
 */

'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { Spinner, EmptyState } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useOfficialLibrary, usePowerParts, useTechniqueParts } from '@/hooks';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';
import { useGuidedPathData } from '../use-guided-path-data';
import { GuidedChoiceCard } from '../guided-choice-card';
import { GUIDED_CHOICE_COMPACT_GRID_CLASS } from '../guided-choice-styles';
import { GuidedStepLayout } from '../guided-step-layout';
import type { ArchetypeCategory } from '@/types';
import type { PathGuidanceGroup } from '@/types/archetype';
import { derivePowerDisplay } from '@/lib/calculators/power-calc';
import type { PowerDocument } from '@/lib/calculators/power-calc';
import { deriveTechniqueDisplay } from '@/lib/calculators/technique-calc';
import type { TechniqueDocument } from '@/lib/calculators/technique-calc';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const ptCopy = GUIDED_CREATOR_COPY.steps.powersTechniques;

type ItemKind = 'powers' | 'techniques';

function stepCopy(type: ArchetypeCategory | null): {
  title: string;
  description: string;
  kind: ItemKind;
} {
  if (type === 'martial') {
    return { ...ptCopy.martial, kind: 'techniques' as const };
  }
  if (type === 'powered-martial') {
    return { ...ptCopy.poweredMartial, kind: 'powers' as const };
  }
  return { ...ptCopy.power, kind: 'powers' as const };
}

type LibraryItem = Record<string, unknown> & { id?: string | number; name?: string; description?: string };

function buildLookup(items: LibraryItem[]): Map<string, LibraryItem> {
  const map = new Map<string, LibraryItem>();
  items.forEach((item) => {
    const id = item.id != null ? String(item.id) : '';
    const name = item.name != null ? String(item.name) : '';
    if (id) map.set(id.toLowerCase(), item);
    if (name) map.set(name.toLowerCase(), item);
  });
  return map;
}

function resolveLibraryItem(id: string, lookup: Map<string, LibraryItem>): LibraryItem | undefined {
  return lookup.get(String(id).toLowerCase());
}

export function PowersTechniquesStep() {
  const { draft, updateDraft } = useGuidedCreatorStore();
  const { pathData } = useGuidedPathData();
  const copy = stepCopy(draft.archetypeType);
  const isTechniques = copy.kind === 'techniques';

  const { data: officialPowers = [], isLoading: powersLoading } = useOfficialLibrary('powers', {
    enabled: !isTechniques,
  });
  const { data: officialTechniques = [], isLoading: techniquesLoading } = useOfficialLibrary(
    'techniques',
    { enabled: isTechniques }
  );
  const { data: powerPartsDb = [] } = usePowerParts();
  const { data: techniquePartsDb = [] } = useTechniqueParts();

  const isLoading = isTechniques ? techniquesLoading : powersLoading;
  const libraryItems = (isTechniques ? officialTechniques : officialPowers) as LibraryItem[];
  const lookup = useMemo(() => buildLookup(libraryItems), [libraryItems]);

  const recommendedIds = useMemo(() => {
    const fromPath = isTechniques
      ? (pathData?.level1?.techniques ?? [])
      : (pathData?.level1?.powers ?? []);
    return fromPath.map(String);
  }, [isTechniques, pathData]);

  const groups = useMemo(
    () =>
      pathData?.level1?.guidance_groups?.filter((g) =>
        isTechniques ? g.techniques?.length : g.powers?.length
      ) ?? [],
    [pathData, isTechniques]
  );

  const allOptionIds = useMemo(() => {
    const ids = new Set<string>();
    recommendedIds.forEach((id) => ids.add(String(id)));
    groups.forEach((group) => {
      const list = isTechniques ? group.techniques : group.powers;
      list?.forEach((id) => ids.add(String(id)));
    });
    return Array.from(ids);
  }, [recommendedIds, groups, isTechniques]);

  const selectedIds = isTechniques ? draft.techniqueIds : draft.powerIds;

  useEffect(() => {
    if (selectedIds.length > 0 || allOptionIds.length === 0) return;
    if (isTechniques) {
      updateDraft({ techniqueIds: allOptionIds });
    } else {
      updateDraft({ powerIds: allOptionIds });
    }
  }, [allOptionIds, isTechniques, selectedIds.length, updateDraft]);

  const toggleId = useCallback(
    (id: string) => {
      const key = String(id);
      if (isTechniques) {
        const next = draft.techniqueIds.includes(key)
          ? draft.techniqueIds.filter((x) => x !== key)
          : [...draft.techniqueIds, key];
        updateDraft({ techniqueIds: next });
      } else {
        const next = draft.powerIds.includes(key)
          ? draft.powerIds.filter((x) => x !== key)
          : [...draft.powerIds, key];
        updateDraft({ powerIds: next });
      }
    },
    [draft.techniqueIds, draft.powerIds, isTechniques, updateDraft]
  );

  const resolveDisplay = useCallback(
    (id: string) => {
      const raw = resolveLibraryItem(id, lookup);
      const name = raw?.name ? String(raw.name) : id;
      const description = raw?.description ? String(raw.description) : undefined;

      let tagline: string | undefined;
      if (raw) {
        try {
          if (isTechniques) {
            const doc: TechniqueDocument = {
              name: String(raw.name ?? ''),
              description: String(raw.description ?? ''),
              parts: Array.isArray(raw.parts) ? (raw.parts as TechniqueDocument['parts']) : [],
              actionType: raw.action_type
                ? String(raw.action_type)
                : raw.actionType
                  ? String(raw.actionType)
                  : undefined,
              weapon:
                raw.weapon_name || raw.weapon
                  ? {
                      name: raw.weapon_name
                        ? String(raw.weapon_name)
                        : typeof raw.weapon === 'object' && raw.weapon && 'name' in raw.weapon
                          ? String((raw.weapon as { name?: string }).name ?? '')
                          : undefined,
                    }
                  : undefined,
            };
            const disp = deriveTechniqueDisplay(doc, techniquePartsDb);
            const parts: string[] = [];
            if (typeof disp.energy === 'number') parts.push(ptCopy.energyTag(disp.energy));
            if (disp.actionType) parts.push(disp.actionType);
            tagline = parts.length > 0 ? parts.join(' · ') : undefined;
          } else {
            const doc: PowerDocument = {
              name: String(raw.name ?? ''),
              description: String(raw.description ?? ''),
              parts: Array.isArray(raw.parts) ? (raw.parts as PowerDocument['parts']) : [],
            };
            const disp = derivePowerDisplay(doc, powerPartsDb);
            if (typeof disp.energy === 'number') tagline = ptCopy.energyTag(disp.energy);
          }
        } catch {
          // ignore invalid doc
        }
      }

      return { id: String(id), name, description, tagline };
    },
    [lookup, isTechniques, techniquePartsDb, powerPartsDb]
  );

  const renderItemCard = (id: string) => {
    const item = resolveDisplay(id);
    const selected = selectedIds.includes(item.id);
    return (
      <GuidedChoiceCard
        key={item.id}
        density="compact"
        title={item.name}
        description={item.description}
        tagline={item.tagline}
        selected={selected}
        onSelect={() => toggleId(item.id)}
        selectAriaLabel={`${selected ? 'Deselect' : 'Select'} ${item.name}`}
      />
    );
  };

  const renderGroupSection = (group: PathGuidanceGroup) => {
    const ids = (isTechniques ? group.techniques : group.powers) ?? [];
    if (ids.length === 0) return null;
    return (
      <section key={group.id}>
        <h3 className="font-display text-lg font-semibold text-text-primary">{group.title}</h3>
        {group.why ? (
          <p className="mt-1 font-nunito text-sm text-text-secondary">{group.why}</p>
        ) : null}
        <div className={cn(GUIDED_CHOICE_COMPACT_GRID_CLASS, 'mt-3')}>
          {ids.map((id) => renderItemCard(String(id)))}
        </div>
      </section>
    );
  };

  const canContinue = selectedIds.length > 0 || allOptionIds.length === 0;

  return (
    <GuidedStepLayout
      subStep="powers-techniques"
      title={copy.title}
      description={copy.description}
      canContinue={canContinue}
      continueLabel={GUIDED_CREATOR_COPY.steps.skills.continueLabel}
      completionHint={
        allOptionIds.length > 0 ? (
          <span className="font-nunito">
            {selectedIds.length} / {allOptionIds.length}
          </span>
        ) : undefined
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : allOptionIds.length === 0 ? (
        <EmptyState
          title={ptCopy.emptyTitle(copy.kind)}
          description={ptCopy.emptyDescription(copy.kind)}
        />
      ) : groups.length > 0 ? (
        <div className="space-y-8">
          <p className="font-nunito text-sm text-text-secondary">
            {ptCopy.groupIntro(copy.kind)}
          </p>
          {groups.map(renderGroupSection)}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="font-nunito text-sm text-text-secondary">
            {ptCopy.groupIntro(copy.kind)}
          </p>
          <div className={GUIDED_CHOICE_COMPACT_GRID_CLASS}>
            {allOptionIds.map((id) => renderItemCard(id))}
          </div>
        </div>
      )}
    </GuidedStepLayout>
  );
}
