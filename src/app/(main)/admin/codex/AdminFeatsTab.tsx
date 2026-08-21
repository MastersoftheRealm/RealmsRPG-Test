'use client';

import { useState, useMemo, useCallback, useId } from 'react';
import {
  ArchetypePathFilter,
  ChipSelect,
  AbilityRequirementFilter,
  TagFilter,
  SelectFilter,
  FilterInput,
  FILTER_LABEL_ROW_CLASS,
} from '@/components/patterns/filters';
import { CodexFeatRow } from '@/components/codex';
import { CodexBrowseListShell, ErrorDisplay as ErrorState, InfoTippy } from '@/components/patterns';
import { IconButton, useToast } from '@/components/ui';
import { useCodexFeats, useCodexSkills, usePathListFilter, type Feat, type Skill } from '@/hooks';
import { useSort } from '@/hooks/use-sort';
import { useAdminCodexEntity } from './use-admin-codex-entity';
import { AdminCodexRowActions } from './admin-codex-row-actions';
import { updateCodexDoc } from './actions';
import { Layers } from 'lucide-react';
import {
  groupFeatFamilies,
  formatFeatName,
  getFeatFamilyId,
  getFeatLevel,
} from '@/lib/leveled-feats';
import {
  ADMIN_FEAT_HEADER_COLUMNS,
  FEAT_GRID_COLUMNS,
  buildFeatFilterOptions,
  featPathChipNames,
  filterFeats,
  type FeatListFilters,
} from '@/lib/codex/feat-list';
import { pathFilterEmptyTitle } from '@/lib/game/path-recommendation-index';
import { STATE_FEAT_RESTRICTION_NOTICE } from '@/lib/codex/feat-restriction-notice';
import { buildSkillIdToName } from '@/lib/codex/skill-list';
import { ABILITIES_AND_DEFENSES } from '@/lib/game/constants';
import { COPY_NAME_SUFFIX } from './admin-codex-copy-suffix';
import {
  EMPTY_FEAT_FORM,
  computeNextLevelFormState,
  featFormToSavePayload,
  featToFormState,
  type FeatFormState,
} from './admin-feat-form';
import { AdminFeatEditModal } from './admin-feat-edit-modal';

interface FeatFilters extends FeatListFilters {
  featTypeMode: '' | 'archetype' | 'character';
  stateFeatMode: '' | 'only' | 'hide';
}

export function AdminFeatsTab() {
  const { showToast } = useToast();
  const { data: feats, isLoading, error, refetch } = useCodexFeats();
  const { data: skills = [] } = useCodexSkills();
  const { sortState, handleSort, sortItems } = useSort('name');
  const maxLevelFilterId = useId();
  const {
    modalOpen,
    editing,
    saving,
    copySourceName,
    openAdd: beginAdd,
    openDuplicate: beginDuplicate,
    openEdit: beginEdit,
    closeModal,
    save,
    refreshCodex,
    setSaving,
    askDelete,
    deleteModals,
  } = useAdminCodexEntity<Feat>({
    collection: 'codex_feats',
    entityLabel: 'feat',
  });
  const [filters, setFilters] = useState<FeatFilters>({
    search: '',
    maxLevel: null,
    abilityRequirements: [],
    categories: [],
    abilities: [],
    tags: [],
    tagMode: 'all',
    featTypeMode: '',
    stateFeatMode: '',
  });

  const filterOptions = useMemo(() => buildFeatFilterOptions(feats), [feats]);

  const { selectedPathIds, setSelectedPathIds, pathIndex, pathRecommendedIds, pathFilterActive } =
    usePathListFilter({ entities: feats, kind: 'feats' });

  const filteredFeats = useMemo(() => {
    if (!feats) return [];
    const filtered = filterFeats(feats, filters, { pathRecommendedIds });
    return sortItems<Feat>(filtered);
  }, [feats, filters, sortItems, pathRecommendedIds]);

  const groupedFeats = useMemo(() => groupFeatFamilies(filteredFeats), [filteredFeats]);

  const ABILITY_OPTIONS = ABILITIES_AND_DEFENSES.map((a) => ({ value: a, label: a }));

  const [modalInitialForm, setModalInitialForm] = useState<FeatFormState>(EMPTY_FEAT_FORM);
  const [modalInitialEditId, setModalInitialEditId] = useState<string | null>(null);
  const [modalLevelFeats, setModalLevelFeats] = useState<Feat[]>([]);
  const [modalSessionKey, setModalSessionKey] = useState(0);

  const skillIdToName = useMemo(() => buildSkillIdToName(skills as Skill[]), [skills]);

  const bumpModal = () => setModalSessionKey((k) => k + 1);

  const openAdd = () =>
    beginAdd(() => {
      setModalInitialForm(EMPTY_FEAT_FORM);
      setModalInitialEditId(null);
      setModalLevelFeats([]);
      bumpModal();
    });

  const openDuplicate = (feat: Feat) =>
    beginDuplicate(feat, () => {
      setModalInitialForm({
        ...featToFormState(feat),
        name: (feat.name || '').trim() + COPY_NAME_SUFFIX,
      });
      setModalInitialEditId(null);
      setModalLevelFeats([]);
      bumpModal();
    });

  const openEdit = (feat: Feat) =>
    beginEdit(feat, () => {
      setModalInitialForm(featToFormState(feat));
      setModalInitialEditId(String(feat.id));
      const familyId = getFeatFamilyId(feat);
      const familyFeats = (feats ?? []).filter((f) => getFeatFamilyId(f) === familyId);
      familyFeats.sort((a, b) => getFeatLevel(a) - getFeatLevel(b));
      setModalLevelFeats(familyFeats);
      bumpModal();
    });

  const openAddLevel = (sourceFeat: Feat) =>
    beginAdd(() => {
      setModalInitialForm(
        computeNextLevelFormState(featToFormState(sourceFeat), String(sourceFeat.id)),
      );
      setModalInitialEditId(null);
      setModalLevelFeats([]);
      bumpModal();
    });

  const openAddLevelFromEditModal = useCallback(
    (sourceForm: FeatFormState, sourceDbFeatId: string) => {
      beginAdd(() => {
        setModalInitialForm(computeNextLevelFormState(sourceForm, sourceDbFeatId));
        setModalInitialEditId(null);
        setModalLevelFeats([]);
        bumpModal();
      });
    },
    [beginAdd],
  );

  const handleSave = async (editId: string | null, form: FeatFormState) => {
    if (!form.name.trim()) return;
    const savingId = editing ? (editId ?? editing.id) : null;
    await save({
      payload: featFormToSavePayload(form),
      editId: savingId,
      expectedUpdatedAt: (feats ?? []).find((f) => String(f.id) === String(savingId))?.updated_at,
    });
  };

  const handleSaveAllLevels = async (editsById: Record<string, FeatFormState>) => {
    const ids = Object.keys(editsById);
    if (ids.length === 0) return;
    setSaving(true);
    const errors: string[] = [];

    for (const id of ids) {
      const form = editsById[id];
      if (!form?.name?.trim()) {
        errors.push(`Level ${id}: name is required`);
        continue;
      }

      const result = await updateCodexDoc('codex_feats', id, featFormToSavePayload(form), {
        expectedUpdatedAt: (feats ?? []).find((f) => String(f.id) === id)?.updated_at,
      });
      if (!result.success) errors.push(`Update ${id}: ${result.error}`);
    }

    setSaving(false);
    if (errors.length > 0) {
      showToast(
        errors.slice(0, 6).join('; ') +
          (errors.length > 6 ? `; ... and ${errors.length - 6} more` : ''),
        'error',
      );
      return;
    }

    await refreshCodex();
    closeModal();
  };

  if (error)
    return (
      <ErrorState
        message="Failed to load feats"
        onRetry={() => {
          void refetch();
        }}
      />
    );

  return (
    <div>
      <CodexBrowseListShell
        sectionTitle="Feats"
        onAdd={openAdd}
        search={filters.search}
        onSearchChange={(v) => setFilters((f) => ({ ...f, search: v }))}
        searchPlaceholder="Search names, tags, descriptions..."
        filters={
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <div className="filter-group">
              <div className={FILTER_LABEL_ROW_CLASS}>
                <label
                  htmlFor={maxLevelFilterId}
                  className="text-sm leading-5 font-medium text-text-secondary"
                >
                  Max Required Level
                </label>
              </div>
              <FilterInput
                id={maxLevelFilterId}
                type="number"
                min={0}
                value={filters.maxLevel ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    maxLevel: e.target.value ? parseInt(e.target.value) : null,
                  }))
                }
                placeholder="No limit"
              />
            </div>
            <div className="md:col-span-2">
              <AbilityRequirementFilter
                label="Ability/Defense Requirement"
                abilities={filterOptions.abilReqAbilities}
                requirements={filters.abilityRequirements}
                onAdd={(req) =>
                  setFilters((f) => ({
                    ...f,
                    abilityRequirements: [...f.abilityRequirements, req],
                  }))
                }
                onRemove={(ability) =>
                  setFilters((f) => ({
                    ...f,
                    abilityRequirements: f.abilityRequirements.filter((r) => r.ability !== ability),
                  }))
                }
              />
            </div>
            <ChipSelect
              label="Category"
              placeholder="Choose category"
              options={filterOptions.categories.map((c) => ({ value: c, label: c }))}
              selectedValues={filters.categories}
              onSelect={(v) => setFilters((f) => ({ ...f, categories: [...f.categories, v] }))}
              onRemove={(v) =>
                setFilters((f) => ({ ...f, categories: f.categories.filter((c) => c !== v) }))
              }
            />
            <ChipSelect
              label="Ability"
              placeholder="Choose ability"
              options={filterOptions.abilities.map((a) => ({ value: a, label: a }))}
              selectedValues={filters.abilities}
              onSelect={(v) => setFilters((f) => ({ ...f, abilities: [...f.abilities, v] }))}
              onRemove={(v) =>
                setFilters((f) => ({ ...f, abilities: f.abilities.filter((a) => a !== v) }))
              }
            />
            <div className="md:col-span-2">
              <TagFilter
                tags={filterOptions.tags}
                selectedTags={filters.tags}
                tagMode={filters.tagMode}
                onSelect={(t) => setFilters((f) => ({ ...f, tags: [...f.tags, t] }))}
                onRemove={(t) =>
                  setFilters((f) => ({ ...f, tags: f.tags.filter((tag) => tag !== t) }))
                }
                onModeChange={(mode) => setFilters((f) => ({ ...f, tagMode: mode }))}
              />
            </div>
            <SelectFilter
              label="Feat Type"
              value={filters.featTypeMode}
              options={[
                { value: 'archetype', label: 'Archetype feats' },
                { value: 'character', label: 'Character feats' },
              ]}
              onChange={(v) =>
                setFilters((f) => ({
                  ...f,
                  featTypeMode: (v || '') as '' | 'archetype' | 'character',
                }))
              }
              placeholder="All types"
            />
            <SelectFilter
              label="State Feats"
              labelAccessory={
                <InfoTippy
                  content={STATE_FEAT_RESTRICTION_NOTICE}
                  label="State Feats filter help"
                />
              }
              value={filters.stateFeatMode}
              options={[
                { value: 'only', label: 'Only state feats' },
                { value: 'hide', label: 'Hide state feats' },
              ]}
              onChange={(v) =>
                setFilters((f) => ({ ...f, stateFeatMode: (v || '') as '' | 'only' | 'hide' }))
              }
              placeholder="All states"
            />
            <ArchetypePathFilter
              options={pathIndex.options}
              selectedPathIds={selectedPathIds}
              onChange={setSelectedPathIds}
            />
          </div>
        }
        headerColumns={ADMIN_FEAT_HEADER_COLUMNS}
        gridColumns={FEAT_GRID_COLUMNS}
        sortState={sortState}
        onSort={handleSort}
        rowChrome={{ rightSlot: true }}
        isLoading={isLoading}
        isEmpty={groupedFeats.length === 0}
        emptyTitle={
          pathFilterActive ? pathFilterEmptyTitle('feats') : 'No feats match your filters'
        }
        emptyMessage="Add one to get started."
        emptyAction={{ label: 'Add Feat', onClick: openAdd }}
      >
        {groupedFeats.map(({ main: feat, levels: familyLevels }) => (
          <CodexFeatRow
            key={feat.id}
            feat={feat}
            name={formatFeatName(feat)}
            skillIdToName={skillIdToName}
            familyLevels={familyLevels}
            variant="admin"
            nameChipLabels={
              pathFilterActive ? featPathChipNames(pathIndex, feat, selectedPathIds) : undefined
            }
            rightSlot={
              <AdminCodexRowActions
                entity={feat}
                onEdit={openEdit}
                onDuplicate={openDuplicate}
                onDelete={askDelete}
                extraBefore={
                  !(feat as Feat & { base_feat_id?: string | undefined }).base_feat_id &&
                  (feat.feat_lvl == null || feat.feat_lvl === 1) ? (
                    <IconButton
                      variant="ghost"
                      size="sm"
                      onClick={() => openAddLevel(feat)}
                      label="Add level"
                    >
                      <Layers className="h-4 w-4" />
                    </IconButton>
                  ) : null
                }
              />
            }
          />
        ))}
      </CodexBrowseListShell>

      {modalOpen ? (
        <AdminFeatEditModal
          key={modalSessionKey}
          isOpen
          onClose={closeModal}
          title={editing ? 'Edit Feat' : 'Add Feat'}
          copySourceName={copySourceName}
          feats={feats}
          levelFeats={editing ? modalLevelFeats : []}
          skills={skills as Skill[]}
          filterOptions={filterOptions}
          abilityOptions={ABILITY_OPTIONS}
          saving={saving}
          canDelete={Boolean(editing)}
          onDelete={editing ? () => askDelete(editing) : undefined}
          onSave={handleSave}
          onSaveAll={handleSaveAllLevels}
          initialForm={modalInitialForm}
          initialEditId={modalInitialEditId}
          enableAddLevel
          onAddLevel={openAddLevelFromEditModal}
        />
      ) : null}

      {deleteModals}
    </div>
  );
}
