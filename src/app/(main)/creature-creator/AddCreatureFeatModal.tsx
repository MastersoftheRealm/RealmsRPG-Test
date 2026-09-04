/**
 * Add Creature Feat Modal — creature codex feats, character/archetype feats, and species traits
 * in one modal with tabs. Feat point costs follow creature builder rules; requirements mirror
 * character sheet add-feat (level, abilities, skills, feat chains).
 */

'use client';

import { useState, useMemo, useCallback, useId, type ReactNode } from 'react';
import {
  useCreatureFeats,
  useCodexFeats,
  useCodexSkills,
  useTraits,
  type Feat,
  type Trait,
  type CreatureFeat as CodexCreatureFeatRow,
} from '@/hooks';
import { checkFeatRequirements } from '@/lib/game/feat-requirements';
import { buildFeatDetailSections } from '@/lib/codex/feat-list';
import { buildSkillIdToName } from '@/lib/codex/skill-list';
import { normalizeFeatAbilities } from '@/lib/codex/feat-ability';
import { descriptorChipData } from '@/lib/chip/chip-data-helpers';
import { glrSurfaceDetailSections } from '@/lib/chip/list-row-metadata';
import { formatAbilityList, formatListCellLabel } from '@/lib/utils';
import { formatCreatureLevelLabel } from '@/lib/game';
import { getFeatLevel, groupFeatFamilies, formatFeatName } from '@/lib/leveled-feats';
import {
  creatureToFeatRequirementCharacter,
  creaturePointsForPlayerFeat,
} from './creature-feat-utils';
import { Alert } from '@/components/ui';
import { SegmentedControl } from '@/components/patterns';
import {
  UnifiedSelectionModal,
  type SelectableItem,
} from '@/components/patterns/select/unified-selection-modal';
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
  effect?: string | undefined;
  max_uses?: number | undefined;
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
  featPoints: number,
): SelectableItem {
  const extra = buildFeatDetailSections(feat, skillIdToName, familyLevels, {
    isCharacterFeat: feat.char_feat,
    hideTypeSection: true,
  });
  const usesVal = feat.uses_per_rec ?? feat.max_uses;
  const detailSections = glrSurfaceDetailSections(
    'creature-feat-picker',
    {
      category: feat.category,
      ability: formatAbilityList(feat.ability),
      uses: usesVal != null && usesVal > 0 ? usesVal : undefined,
      recovery: formatListCellLabel(feat.rec_period),
      reqLevel: feat.lvl_req,
    },
    extra,
  );

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

export function AddCreatureFeatModal({
  isOpen,
  onClose,
  creature,
  onAdd,
}: AddCreatureFeatModalProps) {
  const categorySelectId = useId();
  const abilitySelectId = useId();
  const creatureTabId = useId();
  const libraryTabId = useId();
  const speciesTabId = useId();

  const { data: creatureFeatsData = [], isLoading: loadingCreatureFeats } = useCreatureFeats();
  const {
    data: codexFeats = [],
    isLoading: loadingCodexFeats,
    error: queryError,
  } = useCodexFeats();
  const { data: codexSkills = [] } = useCodexSkills();
  const { data: codexTraits = [], isLoading: loadingTraits } = useTraits();

  const [activeTab, setActiveTab] = useState<FeatSourceTab>('creature');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAbility, setSelectedAbility] = useState('');
  const [showStateFeats, setShowStateFeats] = useState(false);
  const [showBlocked, setShowBlocked] = useState(false);

  // Filter state seeds defaults; parent remounts while showFeatModal is true.

  const creatureLevel = Number(creature.level) || 1;
  const existingFeatIdSet = useMemo(
    () => new Set(creature.feats.map((f) => String(f.id)).filter((id) => id.length > 0)),
    [creature.feats],
  );

  const skillIdToName = useMemo(() => buildSkillIdToName(codexSkills), [codexSkills]);

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
    [creature],
  );

  const checkPlayerFeatRequirements = useCallback(
    (feat: FeatModal): { meets: boolean; warning?: string | undefined } => {
      const { met, reason } = checkFeatRequirements(
        feat,
        featRequirementCharacter,
        codexSkills,
        feats,
      );
      return { meets: met, warning: reason };
    },
    [featRequirementCharacter, codexSkills, feats],
  );

  const { categories, abilities } = useMemo(() => {
    const cats = new Set<string>();
    const abils = new Set<string>();
    feats.forEach((f) => {
      if (f.state_feat) return;
      cats.add(f.category);
      normalizeFeatAbilities(f.ability).forEach((a) => abils.add(a));
    });
    return {
      categories: Array.from(cats).filter(Boolean).sort(),
      abilities: Array.from(abils).sort(),
    };
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

      const di = transformCreatureFeatToDisplayItem(
        feat,
        existingFeatIdSet,
        MECHANICAL_CREATURE_FEAT_IDS,
      );
      if (!di) return;

      const base = displayItemToSelectableItem(di);
      const warning =
        !meetsLvl && lr != null ? `Requires ${formatCreatureLevelLabel(lr)}` : undefined;
      items.push({
        ...base,
        id: `ccf:${feat.id}`,
        columns: [{ key: 'Type', value: 'Creature', align: 'center' }, ...(base.columns ?? [])],
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
      if (selectedAbility && !normalizeFeatAbilities(feat.ability).includes(selectedAbility))
        return false;
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
        if (!displayFeat) return null;
        const { meets, warning } = checkPlayerFeatRequirements(displayFeat);
        const pts = creaturePointsForPlayerFeat(displayFeat);
        return featToSelectableItem(
          displayFeat,
          levels,
          !meets && !showBlocked,
          warning,
          skillIdToName,
          pts,
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
      const speciesTypeLabel = trait.flaw
        ? 'Flaw'
        : trait.characteristic
          ? 'Characteristic'
          : 'Trait';
      const typeSection = {
        label: 'Type',
        chips: [
          trait.flaw
            ? descriptorChipData('Species flaw', 'warning')
            : trait.characteristic
              ? descriptorChipData('Species characteristic', 'default')
              : descriptorChipData('Species trait', 'skill'),
        ],
        hideLabelIfSingle: true,
      };
      const usesVal = trait.uses_per_rec;
      const detailSections = glrSurfaceDetailSections(
        'creature-feat-picker',
        {
          uses: usesVal != null && usesVal > 0 ? usesVal : undefined,
          recovery: formatListCellLabel(trait.rec_period),
        },
        [typeSection],
      );

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
    [creatureTabItems, libraryTabItems, speciesTabItems],
  );

  const displayFilter = useCallback(
    (item: SelectableItem) => {
      const d = item.data as ModalRowData | undefined;
      return d?.tab === activeTab;
    },
    [activeTab],
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
    [onAdd],
  );

  let filterRow: ReactNode = null;
  if (activeTab === 'library') {
    filterRow = (
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor={categorySelectId} className="text-sm text-text-muted">
            Category:
          </label>
          <select
            id={categorySelectId}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="touch-tier-standard rounded-lg border border-border-light bg-surface px-2 py-1 text-sm text-text-primary focus:ring-2 focus:ring-primary-outline-border focus:outline-none"
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
          <label htmlFor={abilitySelectId} className="text-sm text-text-muted">
            Ability:
          </label>
          <select
            id={abilitySelectId}
            value={selectedAbility}
            onChange={(e) => setSelectedAbility(e.target.value)}
            className="touch-tier-standard rounded-lg border border-border-light bg-surface px-2 py-1 text-sm text-text-primary focus:ring-2 focus:ring-primary-outline-border focus:outline-none"
          >
            <option value="">All</option>
            {abilities.map((abil) => (
              <option key={abil} value={abil}>
                {abil}
              </option>
            ))}
          </select>
        </div>
        <label className="touch-tier-standard flex cursor-pointer items-center gap-2 text-sm text-text-muted">
          <input
            type="checkbox"
            checked={showStateFeats}
            onChange={(e) => setShowStateFeats(e.target.checked)}
            className="h-4 w-4 rounded border-border-light"
          />
          Show state feats
        </label>
        <label className="touch-tier-standard flex cursor-pointer items-center gap-2 text-sm text-text-muted">
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
      <div className="flex flex-wrap items-center gap-3">
        <label className="touch-tier-standard flex cursor-pointer items-center gap-2 text-sm text-text-muted">
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

  const creatureFeatOptionsActive =
    activeTab === 'library'
      ? (selectedCategory ? 1 : 0) +
        (selectedAbility ? 1 : 0) +
        (showStateFeats ? 1 : 0) +
        (showBlocked ? 1 : 0)
      : activeTab === 'creature' && showBlocked
        ? 1
        : 0;

  const error = queryError ? `Failed to load feats: ${queryError.message}` : null;
  const isLoading = loadingCreatureFeats || loadingCodexFeats || loadingTraits;

  const description =
    activeTab === 'creature'
      ? 'Codex creature feats (any feat point cost).'
      : activeTab === 'library'
        ? 'Character feats 0.5× level; archetype feats 1× level.'
        : 'Flaws −0.5, characteristics 0, other traits 1 feat point.';

  return (
    <>
      {error && isOpen && (
        <Alert variant="danger" className="fixed top-4 left-1/2 z-toast max-w-md -translate-x-1/2">
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
        scopeExtra={
          <div
            id="creature-feat-panel"
            role="tabpanel"
            aria-labelledby={
              activeTab === 'creature'
                ? creatureTabId
                : activeTab === 'library'
                  ? libraryTabId
                  : speciesTabId
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
          </div>
        }
        headerExtra={filterRow ?? undefined}
        optionsActiveCount={creatureFeatOptionsActive}
        optionsSummary={
          activeTab === 'species'
            ? undefined
            : [
                activeTab === 'library' && selectedCategory && `Category: ${selectedCategory}`,
                activeTab === 'library' && selectedAbility && `Ability: ${selectedAbility}`,
                showBlocked && 'Showing unavailable',
              ]
                .filter(Boolean)
                .join(' · ') || undefined
        }
        size="xl"
        className="md:max-h-[85vh]"
      />
    </>
  );
}
