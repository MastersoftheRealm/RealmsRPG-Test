/**
 * Powers Step
 * ===========
 * Allow users to select powers and techniques for their character.
 * Uses powers from user's library with ItemSelectionModal.
 */

'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Plus, Wand2, Swords, X, ExternalLink } from 'lucide-react';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { UnifiedSelectionModal, type SelectableItem } from '@/components/shared/unified-selection-modal';
import { GridListRow, ListHeader } from '@/components/shared';
import { Button, IconButton, Spinner } from '@/components/ui';
import { useUserPowers, useUserTechniques, usePowerParts, useTechniqueParts, usePublicLibrary, type PowerPart, type TechniquePart } from '@/hooks';
import type { UserPower, UserTechnique } from '@/hooks/use-user-library';
import { SourceFilter, type SourceFilterValue } from '@/components/shared';
import type { ChipData } from '@/components/shared/grid-list-row';
import { derivePowerDisplay } from '@/lib/calculators/power-calc';
import type { PowerDocument } from '@/lib/calculators/power-calc';
import { deriveTechniqueDisplay } from '@/lib/calculators/technique-calc';
import type { TechniqueDocument } from '@/lib/calculators/technique-calc';
import { parseArchetypePathData } from '@/lib/game/archetype-path';
import { PathHelpCard } from '@/components/character-creator/PathHelpCard';

/** Capitalize first letter of each word for display */
function capitalize(s: string | undefined): string {
  if (!s) return '-';
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

// Select powers modal: name, action, en, tp, damage only for legibility
const POWER_MODAL_COLUMNS = [
  { key: 'name', label: 'NAME', sortable: true },
  { key: 'Action', label: 'ACTION', sortable: false, align: 'center' as const },
  { key: 'Energy', label: 'EN', sortable: false, align: 'center' as const },
  { key: 'TP', label: 'TP', sortable: false, align: 'center' as const },
  { key: 'Damage', label: 'DAMAGE', sortable: false, align: 'center' as const },
];
const POWER_GRID_COLUMNS = '1.4fr 0.8fr 0.5fr 0.5fr 0.7fr';

const TECHNIQUE_MODAL_COLUMNS = [
  { key: 'name', label: 'NAME', sortable: true },
  { key: 'Energy', label: 'ENERGY', sortable: false, align: 'center' as const },
  { key: 'Weapon', label: 'WEAPON', sortable: false, align: 'center' as const },
  { key: 'Training Pts', label: 'TRAINING PTS', sortable: false, align: 'center' as const },
];
const TECHNIQUE_GRID_COLUMNS = '1.4fr 0.7fr 1fr 0.8fr';

export function PowersStep() {
  const { draft, updateDraft, nextStep, prevStep } = useCharacterCreatorStore();
  const [showPowerModal, setShowPowerModal] = useState(false);
  const [showTechniqueModal, setShowTechniqueModal] = useState(false);
  const [source, setSource] = useState<SourceFilterValue>('public');
  
  // Fetch user's library and public library
  const { data: userPowers = [], isLoading: powersLoading } = useUserPowers();
  const { data: userTechniques = [], isLoading: techniquesLoading } = useUserTechniques();
  const { data: publicPowers = [], isLoading: publicPowersLoading } = usePublicLibrary('powers');
  const { data: publicTechniques = [], isLoading: publicTechniquesLoading } = usePublicLibrary('techniques');
  const { data: powerParts } = usePowerParts();
  const { data: techniqueParts } = useTechniqueParts();
  
  const normalizedPublicPowers = useMemo(() => 
    (publicPowers as Record<string, unknown>[]).map((p) => ({
      id: String(p.id ?? p.docId ?? ''),
      docId: String(p.id ?? p.docId ?? ''),
      name: String(p.name ?? ''),
      description: String(p.description ?? ''),
      parts: p.parts ?? [],
      actionType: p.actionType,
      isReaction: !!p.isReaction,
      range: p.range,
      area: p.area,
      duration: p.duration,
      damage: p.damage,
    })) as UserPower[],
    [publicPowers]
  );
  const normalizedPublicTechniques = useMemo(() => 
    (publicTechniques as Record<string, unknown>[]).map((t) => ({
      id: String(t.id ?? t.docId ?? ''),
      docId: String(t.id ?? t.docId ?? ''),
      name: String(t.name ?? ''),
      description: String(t.description ?? ''),
      parts: t.parts ?? [],
      weapon: t.weapon,
      damage: t.damage,
    })) as UserTechnique[],
    [publicTechniques]
  );
  
  // Get selected powers and techniques from character draft
  const selectedPowers = draft.powers || [];
  const selectedTechniques = draft.techniques || [];
  
  const selectedPowerIds = useMemo(
    () => new Set(selectedPowers.map((p: { id: string | number }) => String(p.id))), 
    [selectedPowers]
  );
  const selectedTechniqueIds = useMemo(
    () => new Set(selectedTechniques.map((t: { id: string | number }) => String(t.id))), 
    [selectedTechniques]
  );
  const pathData = useMemo(() => parseArchetypePathData(draft.archetype?.path_data), [draft.archetype?.path_data]);
  const recommendedPowerRefs = useMemo(() => new Set((pathData?.level1?.powers || []).map((v: string) => String(v).toLowerCase())), [pathData?.level1?.powers]);
  const recommendedTechniqueRefs = useMemo(() => new Set((pathData?.level1?.techniques || []).map((v: string) => String(v).toLowerCase())), [pathData?.level1?.techniques]);
  const pathName = draft.archetype?.name ?? 'Path';
  const hasPathPowerRecs = recommendedPowerRefs.size > 0;
  const hasPathTechniqueRecs = recommendedTechniqueRefs.size > 0;
  const pathMergeKey = draft.creationMode === 'path' ? draft.archetype?.id ?? 'path' : '';
  const hasMergedPathRef = useRef<string | null>(null);

  const powersForList = useMemo(() => {
    const my = (source === 'my' || source === 'all') ? userPowers : [];
    const pub = (source === 'public' || source === 'all') ? normalizedPublicPowers : [];
    return [...my, ...pub];
  }, [source, userPowers, normalizedPublicPowers]);
  const techniquesForList = useMemo(() => {
    const my = (source === 'my' || source === 'all') ? userTechniques : [];
    const pub = (source === 'public' || source === 'all') ? normalizedPublicTechniques : [];
    return [...my, ...pub];
  }, [source, userTechniques, normalizedPublicTechniques]);

  // Merged pool (user + public, deduped) for looking up selected items so they persist when switching tabs/source
  const allPowersForLookup = useMemo(() => {
    const seen = new Set<string>();
    return [...userPowers, ...normalizedPublicPowers].filter((p: UserPower) => {
      const id = String(p.docId ?? p.id ?? '');
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [userPowers, normalizedPublicPowers]);
  const allTechniquesForLookup = useMemo(() => {
    const seen = new Set<string>();
    return [...userTechniques, ...normalizedPublicTechniques].filter((t: UserTechnique) => {
      const id = String(t.docId ?? t.id ?? '');
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [userTechniques, normalizedPublicTechniques]);

  // Path mode: waiting for public library so we can resolve and auto-add recommended powers/techniques
  const pathRecommendationsLoading =
    draft.creationMode === 'path' &&
    ((hasPathPowerRecs && allPowersForLookup.length === 0 && publicPowersLoading) ||
      (hasPathTechniqueRecs && allTechniquesForLookup.length === 0 && publicTechniquesLoading));

  // Path mode: auto-add recommended powers and techniques once per path (wait for lookup data so we don't mark merged before data loads)
  useEffect(() => {
    if (!pathMergeKey || (!hasPathPowerRecs && !hasPathTechniqueRecs)) return;
    if (hasMergedPathRef.current === pathMergeKey) return;
    // Wait for lookup pools so we can resolve recommended ids; otherwise we'd set the ref and never run again when data loads
    if (hasPathPowerRecs && allPowersForLookup.length === 0) return;
    if (hasPathTechniqueRecs && allTechniquesForLookup.length === 0) return;
    const currentPowerIds = new Set((draft.powers || []).map((p: { id: string | number }) => String(p.id)));
    const currentTechniqueIds = new Set((draft.techniques || []).map((t: { id: string | number }) => String(t.id)));
    let powersUpdated = false;
    let techniquesUpdated = false;
    const newPowers = [...(draft.powers || [])];
    const newTechniques = [...(draft.techniques || [])];
    if (hasPathPowerRecs && allPowersForLookup.length > 0) {
      for (const power of allPowersForLookup) {
        const id = String(power.docId ?? power.id ?? '');
        if (!currentPowerIds.has(id) && (recommendedPowerRefs.has(id.toLowerCase()) || recommendedPowerRefs.has(String(power.name ?? '').toLowerCase()))) {
          newPowers.push({
            id: power.docId ?? power.id,
            name: power.name,
            description: power.description,
            parts: power.parts ?? [],
          });
          currentPowerIds.add(id);
          powersUpdated = true;
        }
      }
    }
    if (hasPathTechniqueRecs && allTechniquesForLookup.length > 0) {
      for (const tech of allTechniquesForLookup) {
        const id = String(tech.docId ?? tech.id ?? '');
        if (!currentTechniqueIds.has(id) && (recommendedTechniqueRefs.has(id.toLowerCase()) || recommendedTechniqueRefs.has(String(tech.name ?? '').toLowerCase()))) {
          newTechniques.push({
            id: tech.docId ?? tech.id,
            name: tech.name,
            description: tech.description,
            parts: tech.parts ?? [],
          });
          currentTechniqueIds.add(id);
          techniquesUpdated = true;
        }
      }
    }
    if (powersUpdated || techniquesUpdated) {
      updateDraft({ powers: newPowers, techniques: newTechniques });
    }
    hasMergedPathRef.current = pathMergeKey;
  }, [pathMergeKey, hasPathPowerRecs, hasPathTechniqueRecs, draft.powers, draft.techniques, recommendedPowerRefs, recommendedTechniqueRefs, allPowersForLookup, allTechniquesForLookup, updateDraft]);

  // Transform powers to SelectableItems — match add-library-item: columns, detailSections, totalCost for expanded view
  // options.selectedIds + pathName: show (PathName) badge in modal only for selected path-recommended items
  const powerListToSelectable = useCallback(
    (list: UserPower[], options?: { selectedIds?: Set<string>; pathName?: string }): SelectableItem[] => {
      return list.map((power: UserPower) => {
        const doc: PowerDocument = {
          name: String(power.name ?? ''),
          description: String(power.description ?? ''),
          parts: Array.isArray(power.parts) ? (power.parts as PowerDocument['parts']) : [],
          damage: power.damage as PowerDocument['damage'],
          actionType: power.actionType,
          isReaction: power.isReaction,
          range: power.range as PowerDocument['range'],
          area: power.area as PowerDocument['area'],
          duration: power.duration as PowerDocument['duration'],
        };
        const display = derivePowerDisplay(doc, powerParts ?? []);
        const partChips: ChipData[] = display.partChips.map((chip) => ({
          name: chip.text.split(' | TP:')[0].trim(),
          description: chip.description,
          cost: chip.finalTP,
          costLabel: 'TP',
        }));
        const damageStr = power.damage?.length
          ? power.damage.map((d: { type?: string }) => capitalize(d.type)).join(', ')
          : '-';
        const isRecommended =
          recommendedPowerRefs.has(String(power.docId).toLowerCase()) ||
          recommendedPowerRefs.has(String(power.name).toLowerCase());
        const showPathBadge =
          isRecommended &&
          options?.pathName &&
          options?.selectedIds &&
          options.selectedIds.has(String(power.docId));
        return {
          id: power.docId,
          name: power.name,
          description: power.description,
          columns: [
            { key: 'Action', value: display.actionType ?? '-', align: 'center' as const },
            { key: 'Energy', value: String(display.energy ?? '-'), align: 'center' as const },
            { key: 'TP', value: String(display.tp ?? '-'), align: 'center' as const },
            { key: 'Damage', value: damageStr, align: 'center' as const },
          ],
          detailSections: partChips.length > 0 ? [{ label: 'Parts & Proficiencies', chips: partChips }] : undefined,
          totalCost: display.tp > 0 ? display.tp : undefined,
          costLabel: display.tp > 0 ? 'TP' : undefined,
          badges: showPathBadge ? [{ label: `(${options!.pathName})`, color: 'gray' as const }] : undefined,
          data: power,
        };
      });
    },
    [powerParts, recommendedPowerRefs]
  );

  const selectedPowerIdsSet = useMemo(() => new Set(selectedPowers.map((p) => String(p.id))), [selectedPowers]);
  const powerSelectableOpts = useMemo(
    () => (pathName ? { selectedIds: selectedPowerIdsSet, pathName } : undefined),
    [pathName, selectedPowerIdsSet]
  );
  const availablePowers = useMemo(
    () => powerListToSelectable(powersForList, powerSelectableOpts),
    [powersForList, powerListToSelectable, powerSelectableOpts]
  );
  const allPowersSelectable = useMemo(
    () => powerListToSelectable(allPowersForLookup, powerSelectableOpts),
    [allPowersForLookup, powerListToSelectable, powerSelectableOpts]
  );

  // Transform techniques to SelectableItems — match add-library-item: detailSections, totalCost for expanded view
  // options.selectedIds + pathName: show (PathName) badge in modal only for selected path-recommended items
  const techniqueListToSelectable = useCallback(
    (list: UserTechnique[], options?: { selectedIds?: Set<string>; pathName?: string }): SelectableItem[] => {
      return list.map((tech: UserTechnique) => {
        const doc: TechniqueDocument = {
          name: String(tech.name ?? ''),
          description: String(tech.description ?? ''),
          parts: Array.isArray(tech.parts) ? (tech.parts as TechniqueDocument['parts']) : [],
          damage: Array.isArray(tech.damage) && tech.damage[0] ? tech.damage[0] : (tech.damage as TechniqueDocument['damage']),
          weapon: tech.weapon as TechniqueDocument['weapon'],
        };
        const display = deriveTechniqueDisplay(doc, techniqueParts ?? []);
        const partChips: ChipData[] = display.partChips.map((chip) => ({
          name: chip.text.split(' | TP:')[0].trim(),
          description: chip.description,
          cost: chip.finalTP,
          costLabel: 'TP',
        }));
        const isRecommended =
          recommendedTechniqueRefs.has(String(tech.docId).toLowerCase()) ||
          recommendedTechniqueRefs.has(String(tech.name).toLowerCase());
        const showPathBadge =
          isRecommended &&
          options?.pathName &&
          options?.selectedIds &&
          options.selectedIds.has(String(tech.docId));
        return {
          id: tech.docId,
          name: tech.name,
          description: tech.description,
          columns: [
            { key: 'Energy', value: String(display.energy), align: 'center' as const },
            { key: 'Weapon', value: display.weaponName || '-', align: 'center' as const },
            { key: 'Training Pts', value: String(display.tp), align: 'center' as const },
          ],
          detailSections: partChips.length > 0 ? [{ label: 'Parts & Proficiencies', chips: partChips }] : undefined,
          totalCost: typeof display.tp === 'number' && display.tp > 0 ? display.tp : undefined,
          costLabel: typeof display.tp === 'number' && display.tp > 0 ? 'TP' : undefined,
          badges: showPathBadge ? [{ label: `(${options!.pathName})`, color: 'gray' as const }] : undefined,
          data: tech,
        };
      });
    },
    [techniqueParts, recommendedTechniqueRefs]
  );

  const selectedTechniqueIdsSet = useMemo(() => new Set(selectedTechniques.map((t) => String(t.id))), [selectedTechniques]);
  const techniqueSelectableOpts = useMemo(
    () => (pathName ? { selectedIds: selectedTechniqueIdsSet, pathName } : undefined),
    [pathName, selectedTechniqueIdsSet]
  );
  const availableTechniques = useMemo(
    () => techniqueListToSelectable(techniquesForList, techniqueSelectableOpts),
    [techniquesForList, techniqueListToSelectable, techniqueSelectableOpts]
  );
  const allTechniquesSelectable = useMemo(
    () => techniqueListToSelectable(allTechniquesForLookup, techniqueSelectableOpts),
    [allTechniquesForLookup, techniqueListToSelectable, techniqueSelectableOpts]
  );
  
  // Display items for selected powers/techniques — lookup from full pool so selection persists when switching tabs/source
  const selectedPowerItems = useMemo((): SelectableItem[] => {
    return selectedPowers.map((p: { id: string | number; name?: string; description?: string }) => {
      const id = String(p.id);
      const found = allPowersSelectable.find((x) => x.id === id);
      if (found) return found;
      return {
        id,
        name: p.name ?? 'Unknown',
        description: p.description ?? '',
        columns: [],
        data: p,
      };
    });
  }, [selectedPowers, allPowersSelectable]);
  
  const selectedTechniqueItems = useMemo((): SelectableItem[] => {
    return selectedTechniques.map((t: { id: string | number; name?: string; description?: string }) => {
      const id = String(t.id);
      const found = allTechniquesSelectable.find((x) => x.id === id);
      if (found) return found;
      return {
        id,
        name: t.name ?? 'Unknown',
        description: t.description ?? '',
        columns: [],
        data: t,
      };
    });
  }, [selectedTechniques, allTechniquesSelectable]);
  
  // Ids of items currently in the modal list (depends on source filter: my/public/all)
  const availablePowerIds = useMemo(() => new Set(availablePowers.map((p) => p.id)), [availablePowers]);
  const availableTechniqueIds = useMemo(() => new Set(availableTechniques.map((t) => t.id)), [availableTechniques]);

  // Handle power selection - merge: keep draft powers not in current list, replace with modal selection for those in list
  const handlePowerSelect = useCallback((selectedItems: SelectableItem[]) => {
    const keptFromDraft = (draft.powers || []).filter(
      (p: { id: string | number }) => !availablePowerIds.has(String(p.id))
    );
    const fromModal = selectedItems.map(item => {
      const userPower = (item.data as UserPower | undefined) ?? userPowers.find((p: UserPower) => p.docId === item.id) ?? normalizedPublicPowers.find((p: UserPower) => p.docId === item.id);
      const partsWithTP = (userPower?.parts || []).map((savedPart: { id?: string | number; name?: string; op_1_lvl?: number; op_2_lvl?: number; op_3_lvl?: number }) => {
        const codexPart = powerParts?.find((rp: PowerPart) =>
          String(rp.id) === String(savedPart.id) ||
          rp.name?.toLowerCase() === savedPart.name?.toLowerCase()
        );
        return {
          id: savedPart.id !== undefined ? String(savedPart.id) : undefined,
          name: savedPart.name || codexPart?.name,
          base_tp: codexPart?.base_tp || 0,
          op_1_lvl: savedPart.op_1_lvl || 0,
          op_1_tp: codexPart?.op_1_tp || 0,
          op_2_lvl: savedPart.op_2_lvl || 0,
          op_2_tp: codexPart?.op_2_tp || 0,
          op_3_lvl: savedPart.op_3_lvl || 0,
          op_3_tp: codexPart?.op_3_tp || 0,
        };
      });
      return {
        id: item.id,
        name: item.name,
        description: userPower?.description,
        parts: partsWithTP,
      };
    });
    updateDraft({ powers: [...keptFromDraft, ...fromModal] });
    setShowPowerModal(false);
  }, [draft.powers, availablePowerIds, updateDraft, userPowers, normalizedPublicPowers, powerParts]);
  
  // Handle technique selection - merge: keep draft techniques not in current list, replace with modal selection for those in list
  const handleTechniqueSelect = useCallback((selectedItems: SelectableItem[]) => {
    const keptFromDraft = (draft.techniques || []).filter(
      (t: { id: string | number }) => !availableTechniqueIds.has(String(t.id))
    );
    const fromModal = selectedItems.map(item => {
      const userTech = (item.data as UserTechnique | undefined) ?? userTechniques.find((t: UserTechnique) => t.docId === item.id) ?? normalizedPublicTechniques.find((t: UserTechnique) => t.docId === item.id);
      const partsWithTP = (userTech?.parts || []).map((savedPart: { id?: string | number; name?: string; op_1_lvl?: number; op_2_lvl?: number; op_3_lvl?: number }) => {
        const codexPart = techniqueParts?.find((rp: TechniquePart) =>
          String(rp.id) === String(savedPart.id) ||
          rp.name?.toLowerCase() === savedPart.name?.toLowerCase()
        );
        return {
          id: savedPart.id !== undefined ? String(savedPart.id) : undefined,
          name: savedPart.name || codexPart?.name,
          base_tp: codexPart?.base_tp || 0,
          op_1_lvl: savedPart.op_1_lvl || 0,
          op_1_tp: codexPart?.op_1_tp || 0,
          op_2_lvl: savedPart.op_2_lvl || 0,
          op_2_tp: codexPart?.op_2_tp || 0,
          op_3_lvl: savedPart.op_3_lvl || 0,
          op_3_tp: codexPart?.op_3_tp || 0,
        };
      });
      return {
        id: item.id,
        name: item.name,
        description: userTech?.description,
        parts: partsWithTP,
      };
    });
    updateDraft({ techniques: [...keptFromDraft, ...fromModal] });
    setShowTechniqueModal(false);
  }, [draft.techniques, availableTechniqueIds, updateDraft, userTechniques, normalizedPublicTechniques, techniqueParts]);
  
  // Remove a power
  const removePower = useCallback((powerId: string) => {
    const newPowers = selectedPowers.filter((p: { id: string | number }) => String(p.id) !== powerId);
    updateDraft({ powers: newPowers });
  }, [selectedPowers, updateDraft]);
  
  // Remove a technique
  const removeTechnique = useCallback((techniqueId: string) => {
    const newTechniques = selectedTechniques.filter((t: { id: string | number }) => String(t.id) !== techniqueId);
    updateDraft({ techniques: newTechniques });
  }, [selectedTechniques, updateDraft]);
  
  const hasContent = powersForList.length > 0 || techniquesForList.length > 0;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              Powers & Techniques
            </h2>
        <p className="text-text-muted dark:text-text-secondary">
          Select powers and techniques from your library for your character to know.
        </p>
      </div>

      {pathRecommendationsLoading && (
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700 rounded-xl p-6 flex items-center gap-4 mb-8">
          <Spinner className="w-6 h-6 flex-shrink-0 text-primary-600 dark:text-primary-400" aria-hidden />
          <div>
            <p className="text-text-primary font-medium">
              Loading recommended powers and techniques from the library…
            </p>
            <p className="text-sm text-text-muted dark:text-text-secondary mt-0.5">
              Your path&apos;s recommendations will appear here in a moment.
            </p>
          </div>
        </div>
      )}
      {!pathRecommendationsLoading && draft.creationMode === 'path' && draft.archetype?.name && (hasPathPowerRecs || hasPathTechniqueRecs) && (
        <PathHelpCard pathName={draft.archetype.name}>
          {(() => {
            const name = draft.archetype?.name ?? 'Path';
            const hasPowers = hasPathPowerRecs;
            const hasTechniques = hasPathTechniqueRecs;
            const phrase = hasPowers && hasTechniques
              ? 'recommended powers and techniques'
              : hasPowers
                ? 'recommended powers'
                : 'recommended techniques';
            return (
              <>
                As a {name}, some {phrase} have been added to your list. Look through them and keep the ones you&apos;d like.
              </>
            );
          })()}
        </PathHelpCard>
      )}
      
      {/* Path mode but no recommendations: nothing to show in this step */}
      {!powersLoading && !techniquesLoading && draft.creationMode === 'path' && !hasPathPowerRecs && !hasPathTechniqueRecs && (
        <div className="bg-muted/30 border border-border rounded-xl p-6 text-center mb-8">
          <p className="text-text-muted dark:text-text-secondary">
            This path doesn&apos;t recommend specific powers or techniques. You can add them from your library later if you like.
          </p>
        </div>
      )}

      {/* Empty state if no content (skip when path mode has no recs — we show that message above) */}
      {!powersLoading && !techniquesLoading && !hasContent && !(draft.creationMode === 'path' && !hasPathPowerRecs && !hasPathTechniqueRecs) && (
        <div className="bg-muted/30 border border-border rounded-xl p-8 text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Wand2 className="w-8 h-8 text-text-muted dark:text-text-secondary" />
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-2">
            No Powers or Techniques Yet
          </h3>
          <p className="text-text-muted dark:text-text-secondary mb-6 max-w-md mx-auto">
            Create powers and techniques in your library first, then come back to add them to your character.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/power-creator"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-400 text-white hover:bg-primary-500 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create Power
              <ExternalLink className="w-3 h-3" />
            </Link>
            <Link
              href="/technique-creator"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Technique
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
      
      {/* Powers Section — hidden in path mode when path has no power recommendations */}
      {(hasContent || powersLoading) && (draft.creationMode !== 'path' || hasPathPowerRecs) && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wand2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Powers</h3>
                <p className="text-sm text-text-muted dark:text-text-secondary">
                  {selectedPowers.length} power{selectedPowers.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowPowerModal(true)}
              disabled={powersForList.length === 0}
            >
              <Plus className="w-4 h-4" />
              Add Powers
            </Button>
          </div>
          
          {selectedPowerItems.length > 0 ? (
            <div className="border border-border-light rounded-lg overflow-hidden">
              <ListHeader
                columns={POWER_MODAL_COLUMNS.map(({ key, label }) => ({ key, label, width: key === 'name' ? '1.4fr' : '0.7fr', align: (key === 'name' ? 'left' : 'center') as 'left' | 'center' | 'right' }))}
                gridColumns={POWER_GRID_COLUMNS}
                compact
              />
              <div className="space-y-1">
                {selectedPowerItems.map(power => {
                  const idStr = String(power.id);
                  const isPathRec =
                    recommendedPowerRefs.has(idStr.toLowerCase()) ||
                    recommendedPowerRefs.has(String(power.name).toLowerCase());
                  const displayName = isPathRec ? `${power.name} (${pathName})` : power.name;
                  return (
                  <GridListRow
                    key={power.id}
                    id={power.id}
                    name={displayName}
                    description={power.description}
                    columns={power.columns}
                    gridColumns={POWER_GRID_COLUMNS}
                    detailSections={power.detailSections}
                    totalCost={power.totalCost}
                    costLabel={power.costLabel}
                    badges={isPathRec ? undefined : power.badges}
                    rightSlot={
                      <IconButton
                        variant="danger"
                        size="sm"
                        onClick={() => removePower(power.id)}
                        label="Remove power"
                      >
                        <X className="w-4 h-4" />
                      </IconButton>
                    }
                    compact
                  />
                  );
                })}
              </div>
            </div>
          ) : userPowers.length > 0 ? (
            <div className="p-4 rounded-lg border border-dashed border-border text-center text-text-muted dark:text-text-secondary">
              No powers selected. Click &quot;Add Powers&quot; to choose from your library.
            </div>
          ) : (
            <div className="p-4 rounded-lg border border-dashed border-border text-center">
              <span className="text-text-muted dark:text-text-secondary">No powers in your library. </span>
              <Link href="/power-creator" className="text-primary hover:underline inline-flex items-center gap-1">
                Create one <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}
        </section>
      )}
      
      {/* Techniques Section — hidden in path mode when path has no technique recommendations */}
      {(hasContent || techniquesLoading) && (draft.creationMode !== 'path' || hasPathTechniqueRecs) && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-martial-light flex items-center justify-center">
                <Swords className="w-5 h-5 text-martial-dark dark:text-martial-300" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Techniques</h3>
                <p className="text-sm text-text-muted dark:text-text-secondary">
                  {selectedTechniques.length} technique{selectedTechniques.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowTechniqueModal(true)}
              disabled={techniquesForList.length === 0}
              className="bg-martial-dark hover:bg-martial-text"
            >
              <Plus className="w-4 h-4" />
              Add Techniques
            </Button>
          </div>
          
          {selectedTechniqueItems.length > 0 ? (
            <div className="border border-border-light rounded-lg overflow-hidden">
              <ListHeader
                columns={TECHNIQUE_MODAL_COLUMNS.map(({ key, label }) => ({ key, label, width: key === 'name' ? '1.4fr' : key === 'Energy' ? '0.7fr' : key === 'Weapon' ? '1fr' : '0.8fr', align: (key === 'name' ? 'left' : 'center') as 'left' | 'center' | 'right' }))}
                gridColumns={TECHNIQUE_GRID_COLUMNS}
                compact
              />
              <div className="space-y-1">
                {selectedTechniqueItems.map(tech => {
                  const idStr = String(tech.id);
                  const isPathRec =
                    recommendedTechniqueRefs.has(idStr.toLowerCase()) ||
                    recommendedTechniqueRefs.has(String(tech.name).toLowerCase());
                  const displayName = isPathRec ? `${tech.name} (${pathName})` : tech.name;
                  return (
                  <GridListRow
                    key={tech.id}
                    id={tech.id}
                    name={displayName}
                    description={tech.description}
                    columns={tech.columns}
                    gridColumns={TECHNIQUE_GRID_COLUMNS}
                    detailSections={tech.detailSections}
                    totalCost={tech.totalCost}
                    costLabel={tech.costLabel}
                    badges={isPathRec ? undefined : tech.badges}
                    rightSlot={
                      <IconButton
                        variant="danger"
                        size="sm"
                        onClick={() => removeTechnique(tech.id)}
                        label="Remove technique"
                      >
                        <X className="w-4 h-4" />
                      </IconButton>
                    }
                    compact
                  />
                  );
                })}
              </div>
            </div>
          ) : userTechniques.length > 0 ? (
            <div className="p-4 rounded-lg border border-dashed border-border text-center text-text-muted dark:text-text-secondary">
              No techniques selected. Click &quot;Add Techniques&quot; to choose from your library.
            </div>
          ) : (
            <div className="p-4 rounded-lg border border-dashed border-border text-center">
              <span className="text-text-muted dark:text-text-secondary">No techniques in your library. </span>
              <Link href="/technique-creator" className="text-primary hover:underline inline-flex items-center gap-1">
                Create one <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}
        </section>
      )}
      
      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-border">
        <Button
          variant="secondary"
          onClick={prevStep}
        >
          ← Back
        </Button>
        <Button
          onClick={nextStep}
        >
          Continue →
        </Button>
      </div>
      
      {/* Power Selection Modal — same column headers/layout as character sheet add-library-item */}
      <UnifiedSelectionModal
        isOpen={showPowerModal}
        onClose={() => setShowPowerModal(false)}
        headerExtra={<SourceFilter value={source} onChange={setSource} />}
        onConfirm={handlePowerSelect}
        items={availablePowers}
        title="Select Powers"
        description="Choose from Realms Library or your library. Use the source filter to switch. You can also create your own in the Power or Technique Creator."
        initialSelectedIds={selectedPowerIds}
        searchPlaceholder="Search powers..."
        itemLabel="power"
        isLoading={powersLoading}
        columns={POWER_MODAL_COLUMNS}
        gridColumns={POWER_GRID_COLUMNS}
      />

      {/* Technique Selection Modal — same column headers/layout as character sheet add-library-item */}
      <UnifiedSelectionModal
        isOpen={showTechniqueModal}
        onClose={() => setShowTechniqueModal(false)}
        headerExtra={<SourceFilter value={source} onChange={setSource} />}
        onConfirm={handleTechniqueSelect}
        items={availableTechniques}
        title="Select Techniques"
        description="Choose from Realms Library or your library. Use the source filter to switch. You can also create your own in the Technique Creator."
        initialSelectedIds={selectedTechniqueIds}
        searchPlaceholder="Search techniques..."
        itemLabel="technique"
        isLoading={techniquesLoading}
        columns={TECHNIQUE_MODAL_COLUMNS}
        gridColumns={TECHNIQUE_GRID_COLUMNS}
      />
    </div>
  );
}

export default PowersStep;
