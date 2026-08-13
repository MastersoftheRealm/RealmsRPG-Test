/**
 * Species Creator Page
 * ====================
 * User-facing species creator: traits (species/ancestry/characteristic/flaw), base skills,
 * sizes, languages. Load from Realms Codex or My Codex; save to private codex (user species).
 *
 * Structure (TASK-601): thin page shell → use-species-creator-workspace →
 * species-creator-editor (+ TraitListModal).
 */

'use client';

import { Users } from 'lucide-react';
import { useAuthStore } from '@/stores';
import {
  useCodexSkills,
  useTraits,
  useAdmin,
  useLoadModalLibrary,
  type Species,
  type Trait,
  type Skill,
} from '@/hooks';
import { CreatorPageShell, CreatorSummaryPanel } from '@/components/creator';
import { SourceFilter, sourceFilterSummary } from '@/components/shared/filters/source-filter';
import { ConfirmActionModal } from '@/components/shared';
import {
  SPECIES_TRAIT_WARNING,
  TRAIT_LIMITS,
} from './species-creator-bootstrap';
import { SpeciesCreatorEditor, TraitListModal } from './species-creator-editor';
import { useSpeciesCreatorWorkspace } from './use-species-creator-workspace';

export default function SpeciesCreatorPage() {
  const { user } = useAuthStore();
  const load = useLoadModalLibrary('species');
  const { data: skills = [], isLoading: skillsLoading } = useCodexSkills();
  const { data: traits = [], isLoading: traitsLoading } = useTraits();
  const { isAdmin } = useAdmin();

  const ws = useSpeciesCreatorWorkspace({
    traits: traits as Trait[],
    skills: skills as Skill[],
    skillsLoading,
    traitsLoading,
    closeLoadModal: load.closeLoadModal,
  });

  return (
    <CreatorPageShell
      icon={<Users className="w-8 h-8 text-primary-link-fg" />}
      title="Species Creator"
      description="Create custom species. Add traits (species, ancestry, characteristic, flaw), choose base skills and sizes, and set languages. Load from Realms Codex or My Codex; save to My Codex."
      user={user}
      auth={{ returnPath: '/species-creator', contentType: 'species', requireAuthToLoad: false }}
      showPublicPrivate={isAdmin}
      saveTarget={ws.save.saveTarget}
      onSaveTargetChange={ws.save.setSaveTarget}
      onSave={ws.handleSave}
      onLoad={load.openLoadModal}
      onReset={ws.handleReset}
      saving={ws.save.saving}
      saveDisabled={!ws.isSaveReady}
      stickySidebar={false}
      loading={{
        isLoading: skillsLoading || traitsLoading,
        loadingMessage: 'Loading species creator...',
      }}
      publish={{
        isOpen: ws.save.showPublishConfirm,
        onClose: () => ws.save.setShowPublishConfirm(false),
        onConfirm: () => void ws.save.confirmPublish(),
        title: ws.save.publishConfirmTitle,
        description:
          ws.save.publishConfirmDescription?.(ws.form.name.trim(), {
            existingInPublic: ws.save.publishExistingInPublic,
          }) ?? '',
      }}
      loadModal={{
        isOpen: load.showLoadModal,
        onClose: load.closeLoadModal,
        title: 'Load species',
        selectableItems: load.selectableItems,
        columns: load.columns,
        gridColumns: load.gridColumns,
        isLoading: load.isLoading,
        error: load.error,
        headerExtra: <SourceFilter value={load.source} onChange={load.setSource} />,
        optionsSummary: sourceFilterSummary(load.source),
        optionsActiveCount: load.source !== 'all' ? 1 : 0,
        emptyMessage: load.emptyMessage,
        emptySubMessage: load.emptySubMessage,
        searchPlaceholder: 'Search species...',
        onSelect: (item) => {
          const raw = (item.data as { raw?: Species | Record<string, unknown> })?.raw;
          if (raw) ws.loadSpeciesIntoForm(raw as Species);
        },
      }}
      sidebar={
        <CreatorSummaryPanel
          title="Summary"
          statRows={ws.summaryStatRows}
          lineItems={[
            { label: 'Sizes', items: ws.form.sizes },
            { label: 'Skills', items: ws.form.skillIds.map((id) => ws.skillLabel(id)).filter(Boolean) },
            { label: 'Languages', items: ws.form.languages },
          ]}
        />
      }
      extraModals={
        <>
          <ConfirmActionModal
            isOpen={ws.showThirdSpeciesTraitConfirm}
            onClose={() => {
              ws.setShowThirdSpeciesTraitConfirm(false);
              ws.setPendingTraitAdd(null);
              ws.setPendingBatch(null);
            }}
            onConfirm={ws.confirmThirdSpeciesTrait}
            title="Third species trait"
            description={SPECIES_TRAIT_WARNING}
            confirmLabel="Add anyway"
          />
          <TraitListModal
            isOpen={ws.showAddSpeciesAncestryModal}
            onClose={() => ws.setShowAddSpeciesAncestryModal(false)}
            title="Add species or ancestry trait"
            traits={traits as Trait[]}
            filter={(t) => !t.flaw && !t.characteristic}
            form={ws.form}
            traitLimits={TRAIT_LIMITS}
            mode="species_ancestry"
            onAddBatch={ws.addTraitBatchToCategory}
            onThirdSpeciesTrait={(traitId) => {
              ws.setPendingTraitAdd({ traitId, category: 'species_traits' });
              ws.setShowThirdSpeciesTraitConfirm(true);
            }}
          />
          <TraitListModal
            isOpen={ws.showAddFlawModal}
            onClose={() => ws.setShowAddFlawModal(false)}
            title="Add flaw"
            traits={traits as Trait[]}
            filter={(t) => t.flaw === true}
            form={ws.form}
            traitLimits={TRAIT_LIMITS}
            mode="flaw"
            onAddBatch={ws.addTraitBatchToCategory}
          />
          <TraitListModal
            isOpen={ws.showAddCharacteristicModal}
            onClose={() => ws.setShowAddCharacteristicModal(false)}
            title="Add characteristic"
            traits={traits as Trait[]}
            filter={(t) => t.characteristic === true}
            form={ws.form}
            traitLimits={TRAIT_LIMITS}
            mode="characteristic"
            onAddBatch={ws.addTraitBatchToCategory}
          />
        </>
      }
    >
      <SpeciesCreatorEditor
        isAdmin={isAdmin}
        form={ws.form}
        onFormChange={ws.setForm}
        skillOptions={ws.skillOptions}
        traitIdToName={ws.traitIdToName}
        newLanguage={ws.newLanguage}
        onNewLanguageChange={ws.setNewLanguage}
        onAddLanguage={ws.addLanguage}
        onRemoveLanguage={ws.removeLanguage}
        onSetSkill={ws.setSkill}
        onAddSize={ws.addSize}
        onRemoveSize={ws.removeSize}
        onRemoveTrait={ws.removeTrait}
        onOpenSpeciesAncestryModal={() => ws.setShowAddSpeciesAncestryModal(true)}
        onOpenFlawModal={() => ws.setShowAddFlawModal(true)}
        onOpenCharacteristicModal={() => ws.setShowAddCharacteristicModal(true)}
        basicsSummary={ws.basicsSummary}
        sizesSummary={ws.sizesSummary}
        baseSkillsSummary={ws.baseSkillsSummary}
        languagesSummary={ws.languagesSummary}
        traitsSummary={ws.traitsSummary}
        heightWeightLifespanSummary={ws.heightWeightLifespanSummary}
      />
    </CreatorPageShell>
  );
}
