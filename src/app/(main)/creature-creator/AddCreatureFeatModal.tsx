/**
 * Add Creature Feat Modal — creature codex feats, character/archetype feats, and species traits
 * in one modal with tabs. Feat point costs follow creature builder rules; requirements mirror
 * character sheet add-feat (level, abilities, skills, feat chains).
 */

'use client';

import { useState, useEffect, useMemo, useCallback, useId, type ReactNode } from 'react';
import {
  useCreatureFeats,
  useCodexFeats,
  useCodexSkills,
  useTraits,
  type Feat,
  type Skill,
  type Trait,
  type CreatureFeat as CodexCreatureFeatRow,
} from '@/hooks';
import {
  checkFeatRequirements,
} from '@/lib/game/feat-requirements';
import { buildFeatLevelChips, getFeatLevel, groupFeatFamilies, formatFeatName } from '@/lib/leveled-feats';
import {
  creatureToFeatRequirementCharacter,
  creaturePointsForPlayerFeat,
} from './creature-feat-utils';
import { Alert } from '@/components/ui';
import { SegmentedControl } from '@/components/shared';
import { UnifiedSelectionModal, type SelectableItem } from '@/components/shared/unified-selection-modal';
import type { ChipData } from '@/components/shared/grid-list-row';
import { MECHANICAL_CREATURE_FEAT_IDS } from '@/lib/id-constants';
import {
  displayItemToCreatureFeat,
  transformCreatureFeatToDisplayItem,
  type CreatureFeat,
  type CreatureFeatSourceType,
} from './transformers';
import { displayItemToSelectableItem } from './CreatureCreatorHelpers';
import type { DisplayItem } from '@/types/items';
import type { CreatureState } from './creature-creator-types';

type FeatSourceTab = 'creature' | 'library' | 'species';

interface FeatModal extends Feat {
  effect?: string;
  max_uses?: number;
}

type ModalRowData =
  | { tab: 'creature'; displayItem: DisplayItem }
  | { tab: 'library'; feat: FeatModal; familyLevels: FeatModal[] }
  | { tab: 'species'; trait: Trait };

function formatFeatPointCost(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return String(n);
}

function creaturePointsForTrait(trait: Trait): number {
  if (trait.flaw) return -0.5;
  if (trait.characteristic) return 0;
  return 1;
}

function featToSelectableItem(
  feat: FeatModal,
  familyLevels: FeatModal[],
  disabled: boolean,
  warningMessage: string | undefined,
  skillIdToName: Map<string, string>,
  featPoints: number
): SelectableItem {
  const detailSections: Array<{ label: string; chips: ChipData[]; hideLabelIfSingle?: boolean }> = [];
  const typeChips: ChipData[] = [];
  if (feat.char_feat) typeChips.push({ name: 'Character feat', category: 'skill' });
  else typeChips.push({ name: 'Archetype feat', category: 'archetype' });
  if (feat.state_feat) typeChips.push({ name: 'State feat', category: 'archetype' });
  if (typeChips.length > 0) detailSections.push({ label: 'Type', chips: typeChips, hideLabelIfSingle: true });
  if (feat.category) {
    detailSections.push({ label: 'Category', chips: [{ name: feat.category, category: 'default' }], hideLabelIfSingle: true });
  }
  const tagChips: ChipData[] = feat.tags?.map((tag) => ({ name: tag, category: 'tag' as const })) || [];
  if (tagChips.length > 0) detailSections.push({ label: 'Tags', chips: tagChips, hideLabelIfSingle: true });
  const abilityReqChips: ChipData[] = (feat.ability_req || []).map((a, i) => {
    const val = feat.abil_req_val?.[i];
    return { name: `${a}${typeof val === 'number' ? ` ${val}+` : ''}`, category: 'default' as const };
  });
  if (abilityReqChips.length > 0) detailSections.push({ label: 'Ability requirements', chips: abilityReqChips });
  const skillReqChips: ChipData[] = (feat.skill_req || []).map((id, i) => {
    const label = skillIdToName.get(String(id)) || String(id);
    const val = feat.skill_req_val?.[i];
    return { name: `${label}${typeof val === 'number' ? ` ${val}+` : ''}`, category: 'skill' as const };
  });
  if (skillReqChips.length > 0) detailSections.push({ label: 'Skill requirements', chips: skillReqChips });
  const levelChips = buildFeatLevelChips(familyLevels, feat.id);
  if (levelChips.length > 0) detailSections.push({ label: 'Feat levels', chips: levelChips });

  const usesVal = feat.uses_per_rec ?? feat.max_uses;
  const usesDisplay = usesVal === 0 || usesVal === undefined ? '-' : String(usesVal);

  const usesChips: ChipData[] = [];
  if (usesDisplay !== '-') usesChips.push({ name: `Uses / recovery: ${usesDisplay}${feat.rec_period ? ` / ${feat.rec_period}` : ''}`, category: 'default' });
  else if (feat.rec_period) usesChips.push({ name: `Recovery: ${feat.rec_period}`, category: 'default' });
  if (usesChips.length > 0) detailSections.unshift({ label: 'Uses', chips: usesChips, hideLabelIfSingle: true });

  const sourceTypeLabel: string = feat.char_feat ? 'Character' : 'Archetype';
  return {
    id: `cxf:${feat.id}`,
    name: formatFeatName(feat),
    description: feat.description || feat.effect,
    columns: [
      { key: 'Type', value: sourceTypeLabel, align: 'center' as const },
      { key: 'Points', value: formatFeatPointCost(featPoints), align: 'center' as const },
    ],
    detailSections: detailSections.length > 0 ? detailSections : undefined,
    disabled,
    warningMessage: warningMessage || undefined,
    data: { tab: 'library', feat, familyLevels } as ModalRowData,
  };
}

export interface AddCreatureFeatModalProps {
  isOpen: boolean;
  onClose: () => void;
  creature: CreatureState;
  onAdd: (feats: CreatureFeat[]) => void;
}

export function AddCreatureFeatModal({ isOpen, onClose, creature, onAdd }: AddCreatureFeatModalProps) {
  const categorySelectId = useId();
  const abilitySelectId = useId();
  const creatureTabId = useId();
  const libraryTabId = useId();
  const speciesTabId = useId();

  const { data: creatureFeatsData = [], isLoading: loadingCreatureFeats } = useCreatureFeats();
  const { data: codexFeats = [], isLoading: loadingCodexFeats, error: queryError } = useCodexFeats();
  const { data: codexSkills = [] } = useCodexSkills();
  const { data: codexTraits = [], isLoading: loadingTraits } = useTraits();

  const [activeTab, setActiveTab] = useState<FeatSourceTab>('creature');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAbility, setSelectedAbility] = useState('');
  const [showStateFeats, setShowStateFeats] = useState(false);
  const [showBlocked, setShowBlocked] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('creature');
      setSelectedCategory('');
      setSelectedAbility('');
      setShowStateFeats(false);
      setShowBlocked(false);
    }
  }, [isOpen]);

  const creatureLevel = Number(creature.level) || 1;
  const existingFeatIdSet = useMemo(
    () => new Set(creature.feats.map((f) => String(f.id)).filter((id) => id.length > 0)),
    [creature.feats]
  );

  const skillIdToName = useMemo(() => {
    const map = new Map<string, string>();
    (codexSkills as Skill[]).forEach((s) => map.set(String(s.id), s.name));
    return map;
  }, [codexSkills]);

  const feats = useMemo((): FeatModal[] => {
    if (!codexFeats || !Array.isArray(codexFeats)) return [];
    return codexFeats.map((f) => ({
      ...f,
      id: String(f.id),
      effect: f.description,
      max_uses: f.uses_per_rec,
    }));
  }, [codexFeats]);

  const featRequirementCharacter = useMemo(
    () => creatureToFeatRequirementCharacter(creature),
    [creature]
  );

  const checkPlayerFeatRequirements = useCallback(
    (feat: FeatModal): { meets: boolean; warning?: string } => {
      const { met, reason } = checkFeatRequirements(feat, featRequirementCharacter, codexSkills, feats);
      return { meets: met, warning: reason };
    },
    [featRequirementCharacter, codexSkills, feats]
  );

  const { categories, abilities } = useMemo(() => {
    const cats = new Set<string>();
    const abils = new Set<string>();
    feats.forEach((f) => {
      if (f.state_feat) return;
      cats.add(f.category);
      if (f.ability) {
        if (Array.isArray(f.ability)) f.ability.forEach((a) => abils.add(a));
        else abils.add(f.ability);
      }
    });
    return { categories: Array.from(cats).filter(Boolean).sort(), abilities: Array.from(abils).sort() };
  }, [feats]);

  const creatureTabItems = useMemo((): SelectableItem[] => {
    const items: SelectableItem[] = [];
    (creatureFeatsData as CodexCreatureFeatRow[]).forEach((feat) => {
      if (existingFeatIdSet.has(String(feat.id))) return;
      const numId = parseInt(String(feat.id), 10);
      if (!isNaN(numId) && MECHANICAL_CREATURE_FEAT_IDS.has(numId)) return;

      const lr = feat.lvl_req;
      const meetsLvl = !(lr != null && lr > 0 && creatureLevel < lr);
      if (!meetsLvl && !showBlocked) return;

      const di = transformCreatureFeatToDisplayItem(feat, existingFeatIdSet, MECHANICAL_CREATURE_FEAT_IDS);
      if (!di) return;

      const base = displayItemToSelectableItem(di);
      const warning = !meetsLvl && lr != null ? `Requires creature level ${lr}` : undefined;
      items.push({
        ...base,
        id: `ccf:${feat.id}`,
        columns: [
          { key: 'Type', value: 'Creature', align: 'center' },
          ...(base.columns ?? []),
        ],
        disabled: !meetsLvl && !showBlocked,
        warningMessage: warning,
        data: { tab: 'creature', displayItem: di } as ModalRowData,
      });
    });
    return items;
  }, [creatureFeatsData, existingFeatIdSet, creatureLevel, showBlocked]);

  const libraryTabItems = useMemo((): SelectableItem[] => {
    const baseFiltered = feats.filter((feat) => {
      if (existingFeatIdSet.has(String(feat.id))) return false;
      if (!showStateFeats && feat.state_feat) return false;
      const { meets } = checkPlayerFeatRequirements(feat);
      if (!meets && !showBlocked) return false;
      if (selectedCategory && feat.category !== selectedCategory) return false;
      if (selectedAbility) {
        const ab = feat.ability;
        if (Array.isArray(ab)) {
          if (!ab.includes(selectedAbility)) return false;
        } else if (ab !== selectedAbility) return false;
      }
      return true;
    });

    const families = groupFeatFamilies(baseFiltered);

    return families
      .map(({ levels }) => {
        const selectableLevels = levels
          .filter((levelFeat) => !existingFeatIdSet.has(String(levelFeat.id)))
          .slice()
          .sort((a, b) => getFeatLevel(b) - getFeatLevel(a));
        if (selectableLevels.length === 0) return null;
        const displayFeat = selectableLevels[0];
        const { meets, warning } = checkPlayerFeatRequirements(displayFeat);
        const pts = creaturePointsForPlayerFeat(displayFeat);
        return featToSelectableItem(
          displayFeat,
          levels,
          !meets && !showBlocked,
          warning,
          skillIdToName,
          pts
        );
      })
      .filter((item): item is SelectableItem => item !== null);
  }, [
    feats,
    existingFeatIdSet,
    showStateFeats,
    showBlocked,
    selectedCategory,
    selectedAbility,
    checkPlayerFeatRequirements,
    skillIdToName,
  ]);

  const speciesTabItems = useMemo((): SelectableItem[] => {
    const items: SelectableItem[] = [];
    (codexTraits as Trait[]).forEach((trait) => {
      const id = String(trait.id);
      if (existingFeatIdSet.has(id)) return;
      const optIds = trait.option_trait_ids;
      if (optIds && optIds.length > 0) return;

      const pts = creaturePointsForTrait(trait);
      const speciesTypeLabel = trait.flaw ? 'Flaw' : trait.characteristic ? 'Characteristic' : 'Trait';
      const detailSections: Array<{ label: string; chips: ChipData[]; hideLabelIfSingle?: boolean }> = [];
      if (trait.flaw) {
        detailSections.push({ label: 'Type', chips: [{ name: 'Species flaw', category: 'warning' }], hideLabelIfSingle: true });
      } else if (trait.characteristic) {
        detailSections.push({
          label: 'Type',
          chips: [{ name: 'Species characteristic', category: 'default' }],
          hideLabelIfSingle: true,
        });
      } else {
        detailSections.push({ label: 'Type', chips: [{ name: 'Species trait', category: 'skill' }], hideLabelIfSingle: true });
      }
      const usesVal = trait.uses_per_rec;
      const usesDisplay = usesVal === 0 || usesVal === undefined ? '-' : String(usesVal);
      if (usesDisplay !== '-' || trait.rec_period) {
        const line =
          usesDisplay !== '-'
            ? `Uses / recovery: ${usesDisplay}${trait.rec_period ? ` / ${trait.rec_period}` : ''}`
            : `Recovery: ${trait.rec_period ?? ''}`;
        detailSections.push({ label: 'Uses', chips: [{ name: line, category: 'default' }], hideLabelIfSingle: true });
      }

      items.push({
        id: `trt:${id}`,
        name: trait.name,
        description: trait.description,
        columns: [
          { key: 'Type', value: speciesTypeLabel, align: 'center' },
          { key: 'Points', value: formatFeatPointCost(pts), align: 'center' },
        ],
        detailSections,
        data: { tab: 'species', trait } as ModalRowData,
      });
    });
    return items;
  }, [codexTraits, existingFeatIdSet]);

  const allItems = useMemo(
    () => [...creatureTabItems, ...libraryTabItems, ...speciesTabItems],
    [creatureTabItems, libraryTabItems, speciesTabItems]
  );

  const displayFilter = useCallback(
    (item: SelectableItem) => {
      const d = item.data as ModalRowData | undefined;
      return d?.tab === activeTab;
    },
    [activeTab]
  );

  const handleConfirm = useCallback(
    (selected: SelectableItem[]) => {
      const out: CreatureFeat[] = selected.map((item) => {
        const d = item.data as ModalRowData;
        if (d.tab === 'creature') return displayItemToCreatureFeat(d.displayItem);
        if (d.tab === 'library') {
          const f = d.feat;
          const featSourceType: CreatureFeatSourceType = f.char_feat ? 'character' : 'archetype';
          return {
            id: String(f.id),
            name: formatFeatName(f),
            description: f.description,
            points: creaturePointsForPlayerFeat(f),
            featSourceType,
          };
        }
        const t = d.trait;
        const featSourceType: CreatureFeatSourceType = t.flaw
          ? 'flaw'
          : t.characteristic
            ? 'characteristic'
            : 'trait';
        return {
          id: String(t.id),
          name: t.name,
          description: t.description,
          points: creaturePointsForTrait(t),
          featSourceType,
        };
      });
      onAdd(out);
    },
    [onAdd]
  );

  let filterRow: ReactNode = null;
  if (activeTab === 'library') {
    filterRow = (
      <div className="flex flex-wrap items-center gap-3 border-t border-border-light pt-3 mt-3">
        <div className="flex items-center gap-2">
          <label htmlFor={categorySelectId} className="text-sm text-text-muted dark:text-text-secondary">
            Category:
          </label>
          <select
            id={categorySelectId}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="min-h-[44px] rounded-lg border border-border-light bg-surface px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor={abilitySelectId} className="text-sm text-text-muted dark:text-text-secondary">
            Ability:
          </label>
          <select
            id={abilitySelectId}
            value={selectedAbility}
            onChange={(e) => setSelectedAbility(e.target.value)}
            className="min-h-[44px] rounded-lg border border-border-light bg-surface px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All</option>
            {abilities.map((abil) => (
              <option key={abil} value={abil}>
                {abil}
              </option>
            ))}
          </select>
        </div>
        <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-text-muted dark:text-text-secondary">
          <input
            type="checkbox"
            checked={showStateFeats}
            onChange={(e) => setShowStateFeats(e.target.checked)}
            className="h-4 w-4 rounded border-border-light"
          />
          Show state feats
        </label>
        <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-text-muted dark:text-text-secondary">
          <input
            type="checkbox"
            checked={showBlocked}
            onChange={(e) => setShowBlocked(e.target.checked)}
            className="h-4 w-4 rounded border-border-light"
          />
          Show unavailable feats
        </label>
      </div>
    );
  } else if (activeTab === 'creature') {
    filterRow = (
      <div className="flex flex-wrap items-center gap-3 border-t border-border-light pt-3 mt-3">
        <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-text-muted dark:text-text-secondary">
          <input
            type="checkbox"
            checked={showBlocked}
            onChange={(e) => setShowBlocked(e.target.checked)}
            className="h-4 w-4 rounded border-border-light"
          />
          Show unavailable feats
        </label>
      </div>
    );
  }

  const error = queryError ? `Failed to load feats: ${queryError.message}` : null;
  const isLoading = loadingCreatureFeats || loadingCodexFeats || loadingTraits;

  const description =
    activeTab === 'creature'
      ? 'Creature feats from the codex (positive, zero, or negative feat point cost).'
      : activeTab === 'library'
        ? 'Character feats cost 0.5× feat level; archetype feats cost 1× feat level. Requirements match the character sheet.'
        : 'Species flaws cost −0.5, characteristics 0, other traits 1 feat point.';

  return (
    <>
      {error && isOpen && (
        <Alert variant="danger" className="fixed top-4 left-1/2 z-[100] max-w-md -translate-x-1/2">
          {error}
        </Alert>
      )}
      <UnifiedSelectionModal
        isOpen={isOpen}
        onClose={onClose}
        title="Add feat"
        description={description}
        items={allItems}
        isLoading={isLoading}
        onConfirm={handleConfirm}
        maxSelections={10}
        displayFilter={displayFilter}
        columns={[
          { key: 'name', label: 'Name', sortable: true },
          { key: 'Type', label: 'Type', sortable: true },
          { key: 'Points', label: 'Feat points', sortable: true },
        ]}
        gridColumns="1.35fr 0.55fr 0.5fr"
        itemLabel="feat"
        emptyMessage={
          activeTab === 'creature'
            ? 'No creature feats match (or all are already added).'
            : activeTab === 'library'
              ? 'No feats match your filters or requirements.'
              : 'No species traits to add (or all are already added).'
        }
        searchPlaceholder="Search by name or description..."
        headerExtra={
          <div
            id="creature-feat-panel"
            role="tabpanel"
            aria-labelledby={
              activeTab === 'creature' ? creatureTabId : activeTab === 'library' ? libraryTabId : speciesTabId
            }
          >
            <SegmentedControl
              value={activeTab}
              onChange={setActiveTab}
              options={[
                { value: 'creature', label: 'Creature feats', id: creatureTabId },
                { value: 'library', label: 'Character & archetype', id: libraryTabId },
                { value: 'species', label: 'Species traits', id: speciesTabId },
              ]}
              aria-label="Feat source"
              tabs
              tabPanelId="creature-feat-panel"
            />
            {filterRow}
          </div>
        }
        size="xl"
        className="max-h-[85vh]"
      />
    </>
  );
}
