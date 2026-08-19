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
import { Button, IconButton, useToast } from '@/components/ui';
import { useCodexFeats, useCodexSkills, usePathListFilter, type Feat, type Skill } from '@/hooks';
import { useSort } from '@/hooks/use-sort';
import { useQueryClient } from '@tanstack/react-query';
import { createCodexDoc, updateCodexDoc } from './actions';
import { AdminCodexDeleteReferenceModal, useAdminCodexDelete } from './use-admin-codex-delete';
import { Pencil, Copy, X, Layers } from 'lucide-react';
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
import {
  COPY_NAME_SUFFIX,
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
  const queryClient = useQueryClient();
  const maxLevelFilterId = useId();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Feat | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [copySourceName, setCopySourceName] = useState<string | null>(null);
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

  const openAdd = () => {
    setEditing(null);
    setCopySourceName(null);
    setModalInitialForm(EMPTY_FEAT_FORM);
    setModalInitialEditId(null);
    setModalLevelFeats([]);
    setModalSessionKey((k) => k + 1);
    setModalOpen(true);
  };

  const openDuplicate = (feat: Feat) => {
    setEditing(null);
    setCopySourceName(feat.name);
    setModalInitialForm({
      ...featToFormState(feat),
      name: (feat.name || '').trim() + COPY_NAME_SUFFIX,
    });
    setModalInitialEditId(null);
    setModalLevelFeats([]);
    setModalSessionKey((k) => k + 1);
    setModalOpen(true);
  };

  const openEdit = (feat: Feat) => {
    setEditing(feat);
    setCopySourceName(null);
    setModalInitialForm(featToFormState(feat));
    setModalInitialEditId(String(feat.id));
    const familyId = getFeatFamilyId(feat);
    const familyFeats = (feats ?? []).filter((f) => getFeatFamilyId(f) === familyId);
    familyFeats.sort((a, b) => getFeatLevel(a) - getFeatLevel(b));
    setModalLevelFeats(familyFeats);
    setModalSessionKey((k) => k + 1);
    setModalOpen(true);
  };

  const openAddLevel = (sourceFeat: Feat) => {
    setEditing(null);
    setCopySourceName(null);
    setModalInitialForm(
      computeNextLevelFormState(featToFormState(sourceFeat), String(sourceFeat.id)),
    );
    setModalInitialEditId(null);
    setModalLevelFeats([]);
    setModalSessionKey((k) => k + 1);
    setModalOpen(true);
  };

  const openAddLevelFromEditModal = useCallback(
    (sourceForm: FeatFormState, sourceDbFeatId: string) => {
      setEditing(null);
      setCopySourceName(null);
      setModalInitialForm(computeNextLevelFormState(sourceForm, sourceDbFeatId));
      setModalInitialEditId(null);
      setModalLevelFeats([]);
      setModalSessionKey((k) => k + 1);
    },
    [],
  );

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setCopySourceName(null);
    setDeleteConfirm(null);
  };

  const handleSave = async (editId: string | null, form: FeatFormState) => {
    if (!form.name.trim()) return;
    setSaving(true);
    const data = featFormToSavePayload(form);

    const savingId = editId ?? editing?.id;
    const result = editing
      ? await updateCodexDoc('codex_feats', savingId ?? editing.id, data, {
          expectedUpdatedAt: (feats ?? []).find((f) => String(f.id) === String(savingId))
            ?.updated_at,
        })
      : await createCodexDoc('codex_feats', undefined, data);

    setSaving(false);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['codex'] });
      await queryClient.refetchQueries({ queryKey: ['codex'] });
      closeModal();
    } else {
      showToast(result.error ?? 'Operation failed', 'error');
    }
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

    queryClient.invalidateQueries({ queryKey: ['codex'] });
    await queryClient.refetchQueries({ queryKey: ['codex'] });
    closeModal();
  };

  const codexDelete = useAdminCodexDelete({
    collection: 'codex_feats',
    onDeleted: async () => {
      queryClient.invalidateQueries({ queryKey: ['codex'] });
      await queryClient.refetchQueries({ queryKey: ['codex'] });
      setPendingDeleteId(null);
      closeModal();
    },
    onError: (message) => {
      setPendingDeleteId(null);
      showToast(message, 'error');
    },
  });

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      return;
    }
    await codexDelete.requestDelete(id);
  };

  const handleInlineDelete = async (id: string) => {
    if (pendingDeleteId !== id) {
      setPendingDeleteId(id);
      return;
    }
    await codexDelete.requestDelete(id);
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
              <div className="flex items-center gap-1 pr-2">
                {pendingDeleteId === feat.id ? (
                  <div className="flex items-center gap-1 text-xs">
                    <span className="font-medium whitespace-nowrap text-danger-700 dark:text-danger-400">
                      Remove?
                    </span>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleInlineDelete(feat.id)}
                      className="h-6 px-2 py-0.5 text-xs"
                    >
                      Yes
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setPendingDeleteId(null)}
                      className="h-6 px-2 py-0.5 text-xs"
                    >
                      No
                    </Button>
                  </div>
                ) : (
                  <>
                    {!(feat as Feat & { base_feat_id?: string | undefined }).base_feat_id &&
                      (feat.feat_lvl == null || feat.feat_lvl === 1) && (
                        <IconButton
                          variant="ghost"
                          size="sm"
                          onClick={() => openAddLevel(feat)}
                          label="Add level"
                          aria-label="Add level"
                        >
                          <Layers className="h-4 w-4" />
                        </IconButton>
                      )}
                    <IconButton
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(feat)}
                      label="Edit"
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      onClick={() => openDuplicate(feat)}
                      label="Duplicate"
                      aria-label="Duplicate"
                    >
                      <Copy className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setPendingDeleteId(feat.id)}
                      label="Delete"
                      className="text-danger-fg hover:bg-transparent hover:opacity-80"
                    >
                      <X className="h-4 w-4" />
                    </IconButton>
                  </>
                )}
              </div>
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
          deleteConfirm={deleteConfirm}
          onRequestDelete={() => editing && handleDelete(editing.id)}
          onSave={handleSave}
          onSaveAll={handleSaveAllLevels}
          initialForm={modalInitialForm}
          initialEditId={modalInitialEditId}
          enableAddLevel
          onAddLevel={openAddLevelFromEditModal}
        />
      ) : null}

      <AdminCodexDeleteReferenceModal state={codexDelete} entityLabel="feat" />
    </div>
  );
}
