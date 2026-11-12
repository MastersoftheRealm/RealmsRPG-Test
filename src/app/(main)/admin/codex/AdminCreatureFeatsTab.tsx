'use client';

import { useCallback, useMemo, useState } from 'react';
import { CodexRulesSourceFilter } from '@/components/patterns/filters';
import {
  countActiveCodexRulesSourceFilters,
  rowMatchesCodexRulesSourceFilter,
} from '@/lib/codex/list-rules-source-filter';
import {
  CodexBrowseListShell,
  ErrorDisplay as ErrorState,
  GridListRow,
} from '@/components/patterns';
import { IconButton, useToast } from '@/components/ui';
import { ADMIN_CODEX_QUERY_OPTIONS, useCreatureFeats, type CreatureFeat } from '@/hooks';
import { useSort } from '@/hooks/use-sort';
import { collectStoredCategoryLabels } from '@/lib/codex/feat-list';
import {
  buildFeatLevelChips,
  formatFeatName,
  groupFeatFamilies,
  isFeatFamilyBase,
  peakFeatInFamily,
  sortedFeatFamily,
} from '@/lib/leveled-feats';
import { formatCreatureLevel } from '@/lib/game';
import { Layers } from 'lucide-react';
import { COPY_NAME_SUFFIX } from './admin-codex-copy-suffix';
import { useAdminCodexEntity } from './use-admin-codex-entity';
import { AdminCodexRowActions, ADMIN_CODEX_ROW_ACTIONS_WIDTH } from './admin-codex-row-actions';
import { persistCodexLevelEdits } from './admin-codex-level-save';
import {
  AdminCreatureFeatEditModal,
  EMPTY_CREATURE_FEAT_FORM,
} from './admin-creature-feat-edit-modal';
import {
  computeNextCreatureFeatFormState,
  creatureFeatFormToSavePayload,
  creatureFeatToFormState,
  type CreatureFeatFormState,
} from './admin-creature-feat-form';

export function AdminCreatureFeatsTab() {
  const { showToast } = useToast();
  const {
    data: creatureFeats,
    isLoading,
    error,
    refetch,
  } = useCreatureFeats(ADMIN_CODEX_QUERY_OPTIONS);
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
    queryClient,
    setSaving,
    askDelete,
    deleteModals,
  } = useAdminCodexEntity<CreatureFeat>({
    collection: 'codex_creature_feats',
    entityLabel: 'creature feat',
  });
  const [search, setSearch] = useState('');
  const [rulesSources, setRulesSources] = useState<string[]>([]);
  const { sortState, handleSort, sortItems } = useSort('name');
  const [modalInitialForm, setModalInitialForm] =
    useState<CreatureFeatFormState>(EMPTY_CREATURE_FEAT_FORM);
  const [modalInitialEditId, setModalInitialEditId] = useState<string | null>(null);
  const [modalLevelFeats, setModalLevelFeats] = useState<CreatureFeat[]>([]);
  const [modalSessionKey, setModalSessionKey] = useState(0);

  const bumpModal = () => setModalSessionKey((key) => key + 1);

  const categories = useMemo(
    () => collectStoredCategoryLabels((creatureFeats ?? []).map((feat) => feat.category)),
    [creatureFeats],
  );

  const filtered = useMemo(
    () =>
      sortItems<CreatureFeat>(
        (creatureFeats || []).filter((feat: CreatureFeat) => {
          if (
            search &&
            !feat.name.toLowerCase().includes(search.toLowerCase()) &&
            !feat.description?.toLowerCase().includes(search.toLowerCase()) &&
            !(feat.category ?? '').toLowerCase().includes(search.toLowerCase())
          ) {
            return false;
          }
          return rowMatchesCodexRulesSourceFilter(feat.sources, rulesSources);
        }),
      ),
    [creatureFeats, rulesSources, search, sortItems],
  );
  const groupedFeats = useMemo(() => groupFeatFamilies(filtered), [filtered]);

  const openAdd = () =>
    beginAdd(() => {
      setModalInitialForm(EMPTY_CREATURE_FEAT_FORM);
      setModalInitialEditId(null);
      setModalLevelFeats([]);
      bumpModal();
    });

  const openDuplicate = (feat: CreatureFeat) =>
    beginDuplicate(feat, () => {
      setModalInitialForm({
        ...creatureFeatToFormState(feat),
        name: (feat.name || '').trim() + COPY_NAME_SUFFIX,
      });
      setModalInitialEditId(null);
      setModalLevelFeats([]);
      bumpModal();
    });

  const openEdit = (feat: CreatureFeat) =>
    beginEdit(feat, () => {
      setModalInitialForm(creatureFeatToFormState(feat));
      setModalInitialEditId(String(feat.id));
      setModalLevelFeats(sortedFeatFamily(creatureFeats ?? [], feat));
      bumpModal();
    });

  const openAddLevel = (sourceFeat: CreatureFeat, familyLevels?: readonly CreatureFeat[]) =>
    beginAdd(() => {
      setModalInitialForm(
        computeNextCreatureFeatFormState(
          creatureFeatToFormState(sourceFeat),
          String(sourceFeat.id),
          familyLevels,
        ),
      );
      setModalInitialEditId(null);
      setModalLevelFeats([]);
      bumpModal();
    });

  const openAddLevelFromEditModal = useCallback(
    (sourceForm: CreatureFeatFormState, sourceDbFeatId: string) => {
      beginAdd(() => {
        setModalInitialForm(computeNextCreatureFeatFormState(sourceForm, sourceDbFeatId));
        setModalInitialEditId(null);
        setModalLevelFeats([]);
        bumpModal();
      });
    },
    [beginAdd],
  );

  const handleSave = async (editId: string | null, form: CreatureFeatFormState) => {
    if (!form.name.trim()) return;
    const savingId = editing ? (editId ?? editing.id) : null;
    await save({
      payload: creatureFeatFormToSavePayload(form),
      editId: savingId,
      expectedUpdatedAt: (creatureFeats ?? []).find((feat) => String(feat.id) === String(savingId))
        ?.updated_at,
    });
  };

  const handleSaveAllLevels = async (editsById: Record<string, CreatureFeatFormState>) => {
    if (Object.keys(editsById).length === 0) return;
    setSaving(true);
    const errorMessage = await persistCodexLevelEdits({
      collection: 'codex_creature_feats',
      editsById,
      updatedAtForId: (id) =>
        (creatureFeats ?? []).find((feat) => String(feat.id) === id)?.updated_at,
      toPayload: creatureFeatFormToSavePayload,
      invalidMessage: (id, form) => (form?.name?.trim() ? null : `Level ${id}: name is required`),
      queryClient,
    });
    setSaving(false);
    if (errorMessage) {
      showToast(errorMessage, 'error');
      return;
    }
    await refreshCodex();
    closeModal();
  };

  if (error)
    return (
      <ErrorState
        message="Failed to load creature feats"
        onRetry={() => {
          void refetch();
        }}
      />
    );

  return (
    <div>
      <CodexBrowseListShell
        sectionTitle="Creature Feats"
        onAdd={openAdd}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search creature feats..."
        filterActiveCount={countActiveCodexRulesSourceFilters(rulesSources)}
        filters={
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <CodexRulesSourceFilter selectedValues={rulesSources} onChange={setRulesSources} />
          </div>
        }
        headerColumns={[
          { key: 'name', label: 'NAME' },
          { key: 'category', label: 'CATEGORY' },
          { key: 'points', label: 'PTS' },
          { key: 'feat_lvl', label: 'FEAT LVL' },
          { key: 'lvl_req', label: 'REQ. LVL' },
        ]}
        gridColumns="1.4fr 0.8fr 0.45fr 0.5fr 0.5fr"
        rowChrome={{ rightSlot: true }}
        rightSlotWidth={ADMIN_CODEX_ROW_ACTIONS_WIDTH}
        sortState={sortState}
        onSort={handleSort}
        isLoading={isLoading}
        isEmpty={groupedFeats.length === 0}
        emptyTitle="No creature feats found"
        emptyMessage="Add one to get started."
        emptyAction={{ label: 'Add Creature Feat', onClick: openAdd }}
      >
        {groupedFeats.map(({ main: feat, levels: familyLevels }) => {
          const levelChips = buildFeatLevelChips(familyLevels, feat.id);
          const detailSections =
            levelChips.length > 0 ? [{ label: 'Feat Levels', chips: levelChips }] : undefined;
          return (
            <GridListRow
              key={feat.id}
              id={feat.id}
              name={formatFeatName(feat)}
              description={feat.description || ''}
              gridColumns="1.4fr 0.8fr 0.45fr 0.5fr 0.5fr"
              columns={[
                { key: 'Category', value: feat.category || '-' },
                { key: 'Pts', value: String(feat.points ?? '-') },
                { key: 'Feat Lvl', value: feat.feat_lvl != null ? String(feat.feat_lvl) : '-' },
                {
                  key: 'Req. Lvl',
                  value: feat.lvl_req != null ? formatCreatureLevel(feat.lvl_req) : '-',
                },
              ]}
              detailSections={detailSections}
              rightSlotWidth={ADMIN_CODEX_ROW_ACTIONS_WIDTH}
              rightSlot={
                <AdminCodexRowActions
                  entity={feat}
                  onEdit={openEdit}
                  onDuplicate={openDuplicate}
                  onDelete={askDelete}
                  extraBefore={
                    isFeatFamilyBase(feat) ? (
                      <IconButton
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          openAddLevel(peakFeatInFamily(familyLevels) ?? feat, familyLevels)
                        }
                        label="Add level"
                      >
                        <Layers className="h-4 w-4" />
                      </IconButton>
                    ) : null
                  }
                />
              }
            />
          );
        })}
      </CodexBrowseListShell>

      {modalOpen ? (
        <AdminCreatureFeatEditModal
          key={modalSessionKey}
          isOpen
          onClose={closeModal}
          title={editing ? 'Edit Creature Feat' : 'Add Creature Feat'}
          copySourceName={copySourceName}
          creatureFeats={creatureFeats ?? []}
          levelFeats={editing ? modalLevelFeats : []}
          categories={categories}
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
