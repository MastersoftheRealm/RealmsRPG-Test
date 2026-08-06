/**
 * Species Creator — presentational editor islands (TASK-601)
 */

'use client';

import { useMemo } from 'react';
import { Plus } from 'lucide-react';
import type { Trait } from '@/hooks';
import { CREATURE_TYPES } from '@/lib/game/creator-constants';
import { CollapsibleSection } from '@/components/creator';
import {
  UnifiedSelectionModal,
  type SelectableItem,
} from '@/components/shared/unified-selection-modal';
import { RealmsImageField } from '@/components/shared';
import { Button, Input, Textarea } from '@/components/ui';
import { ChipList } from '../creature-creator/CreatureCreatorHelpers';
import { formatListCellLabel } from '@/lib/utils';
import {
  MAX_SPECIES_TRAITS,
  MAX_ANCESTRY_TRAITS,
  MAX_CHARACTERISTICS,
  MAX_FLAWS,
  MAX_SIZES,
  MAX_LANGUAGES,
  SIZE_OPTIONS,
  type SpeciesFormState,
  type TraitCategory,
} from './species-creator-bootstrap';

type SpeciesCreatorEditorProps = {
  isAdmin: boolean;
  form: SpeciesFormState;
  onFormChange: (updater: (prev: SpeciesFormState) => SpeciesFormState) => void;
  skillOptions: { value: string; label: string }[];
  traitIdToName: Map<string, string>;
  newLanguage: string;
  onNewLanguageChange: (value: string) => void;
  onAddLanguage: () => void;
  onRemoveLanguage: (lang: string) => void;
  onSetSkill: (index: 0 | 1, skillId: string) => void;
  onAddSize: (size: string) => void;
  onRemoveSize: (size: string) => void;
  onRemoveTrait: (category: TraitCategory, traitId: string) => void;
  onOpenSpeciesAncestryModal: () => void;
  onOpenFlawModal: () => void;
  onOpenCharacteristicModal: () => void;
  basicsSummary: string;
  sizesSummary: string;
  baseSkillsSummary: string;
  languagesSummary: string;
  traitsSummary: string;
  heightWeightLifespanSummary: string;
};

export function SpeciesCreatorEditor({
  isAdmin,
  form,
  onFormChange,
  skillOptions,
  traitIdToName,
  newLanguage,
  onNewLanguageChange,
  onAddLanguage,
  onRemoveLanguage,
  onSetSkill,
  onAddSize,
  onRemoveSize,
  onRemoveTrait,
  onOpenSpeciesAncestryModal,
  onOpenFlawModal,
  onOpenCharacteristicModal,
  basicsSummary,
  sizesSummary,
  baseSkillsSummary,
  languagesSummary,
  traitsSummary,
  heightWeightLifespanSummary,
}: SpeciesCreatorEditorProps) {
  return (
    <div className="space-y-6">
      <CollapsibleSection title="Basics" collapsedSummary={basicsSummary}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              label="Name *"
              value={form.name}
              onChange={(e) => onFormChange((p) => ({ ...p, name: e.target.value }))}
              placeholder="Species name"
              aria-label="Species name"
            />
          </div>
          <div>
            <label htmlFor="species-type" className="block text-sm font-medium text-text-secondary mb-1">Type</label>
            <select
              id="species-type"
              className="w-full px-3 py-2 rounded-lg border border-border-light bg-surface text-text-primary"
              value={form.type}
              onChange={(e) => onFormChange((p) => ({ ...p, type: e.target.value }))}
              aria-label="Creature type"
            >
              <option value="">Select type</option>
              {CREATURE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => onFormChange((p) => ({ ...p, description: e.target.value }))}
            placeholder="Species description"
            rows={3}
            className="w-full"
            aria-label="Species description"
          />
        </div>
        {isAdmin && (
          <div className="mt-4">
            <RealmsImageField
              categories="species"
              imageId={form.imageId}
              imageUrl={form.imageUrl}
              onChange={({ imageId, imageUrl }) =>
                onFormChange((previous) => ({ ...previous, imageId, imageUrl }))
              }
              entityName={form.name}
              label="Species card art"
              hint="Uploads are saved to the shared image bank."
            />
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title={`Sizes (up to ${MAX_SIZES})`} collapsedSummary={sizesSummary}>
        <p className="text-sm text-text-muted dark:text-text-secondary mb-4">Choose up to two size options for this species.</p>
        <ChipList items={form.sizes} onRemove={onRemoveSize} color="bg-primary-subtle-bg text-primary-subtle-fg" />
        <div className="flex flex-wrap gap-2 mt-2">
          {SIZE_OPTIONS.filter((s) => !form.sizes.includes(s)).slice(0, SIZE_OPTIONS.length - form.sizes.length).map((size) => (
            <Button key={size} variant="outline" size="sm" onClick={() => onAddSize(size)} disabled={form.sizes.length >= MAX_SIZES}>
              + {size}
            </Button>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Base skills (2)" collapsedSummary={baseSkillsSummary}>
        <p className="text-sm text-text-muted dark:text-text-secondary mb-4">Select two base skills; one may be &quot;Any&quot; (id 0). You cannot pick the same skill twice.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {([0, 1] as const).map((i) => (
            <div key={i}>
              <label htmlFor={i === 0 ? 'base-skill-0' : 'base-skill-1'} className="block text-sm font-medium text-text-secondary mb-1">Skill {i + 1}</label>
              <select
                id={i === 0 ? 'base-skill-0' : 'base-skill-1'}
                className="w-full px-3 py-2 rounded-lg border border-border-light bg-surface text-text-primary"
                value={form.skillIds[i] ?? ''}
                onChange={(e) => onSetSkill(i, e.target.value)}
                aria-label={i === 0 ? 'First base skill' : 'Second base skill'}
              >
                <option value="">Select</option>
                {skillOptions.filter((opt) => opt.value !== form.skillIds[1 - i]).map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title={`Languages (up to ${MAX_LANGUAGES})`} collapsedSummary={languagesSummary}>
        <p className="text-sm text-text-muted dark:text-text-secondary mb-4">Universal can be included by default; add or remove as desired.</p>
        <ChipList items={form.languages} onRemove={onRemoveLanguage} color="bg-info-100 dark:bg-info-900/30 text-info-800 dark:text-info-300" />
        <div className="flex gap-2 mt-2">
          <Input
            label="New language"
            value={newLanguage}
            onChange={(e) => onNewLanguageChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onAddLanguage()}
            placeholder="Enter language..."
            className="flex-1"
            aria-label="New language to add"
          />
          <Button onClick={onAddLanguage} disabled={!newLanguage.trim() || form.languages.length >= MAX_LANGUAGES} size="sm">Add</Button>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Traits"
        collapsedSummary={traitsSummary}
        rightSlot={
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={onOpenSpeciesAncestryModal}
              disabled={form.species_traits.length >= MAX_SPECIES_TRAITS && form.ancestry_traits.length >= MAX_ANCESTRY_TRAITS}
            >
              <Plus className="w-4 h-4 mr-1" aria-hidden />
              Species/ancestry
            </Button>
            <Button size="sm" variant="secondary" onClick={onOpenFlawModal} disabled={form.flaws.length >= MAX_FLAWS}>
              <Plus className="w-4 h-4 mr-1" aria-hidden />
              Flaw
            </Button>
            <Button size="sm" variant="secondary" onClick={onOpenCharacteristicModal} disabled={form.characteristics.length >= MAX_CHARACTERISTICS}>
              <Plus className="w-4 h-4 mr-1" aria-hidden />
              Characteristic
            </Button>
          </div>
        }
      >
        <p className="text-sm text-text-muted dark:text-text-secondary mb-4">
          Species traits ({MAX_SPECIES_TRAITS} max), ancestry traits ({MAX_ANCESTRY_TRAITS} max), characteristics ({MAX_CHARACTERISTICS} max), flaws ({MAX_FLAWS} max). Add from the matching list; species/ancestry traits are classified after you add.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TraitBlock title="Species traits" limit={MAX_SPECIES_TRAITS} ids={form.species_traits} traitIdToName={traitIdToName} onRemove={(id) => onRemoveTrait('species_traits', id)} />
          <TraitBlock title="Ancestry traits" limit={MAX_ANCESTRY_TRAITS} ids={form.ancestry_traits} traitIdToName={traitIdToName} onRemove={(id) => onRemoveTrait('ancestry_traits', id)} />
          <TraitBlock title="Characteristics" limit={MAX_CHARACTERISTICS} ids={form.characteristics} traitIdToName={traitIdToName} onRemove={(id) => onRemoveTrait('characteristics', id)} />
          <TraitBlock title="Flaws" limit={MAX_FLAWS} ids={form.flaws} traitIdToName={traitIdToName} onRemove={(id) => onRemoveTrait('flaws', id)} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Height, weight & lifespan *" collapsedSummary={heightWeightLifespanSummary}>
        <p className="text-sm text-text-muted dark:text-text-secondary mb-4">Required. Average height (cm), average weight (kg), adulthood age, and lifespan (years).</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              label="Average height (cm) *"
              type="number"
              min={0}
              value={form.ave_height}
              onChange={(e) => onFormChange((p) => ({ ...p, ave_height: e.target.value === '' ? '' : Number(e.target.value) }))}
              aria-label="Average height in centimeters"
            />
          </div>
          <div>
            <Input
              label="Average weight (kg) *"
              type="number"
              min={0}
              value={form.ave_weight}
              onChange={(e) => onFormChange((p) => ({ ...p, ave_weight: e.target.value === '' ? '' : Number(e.target.value) }))}
              aria-label="Average weight in kilograms"
            />
          </div>
          <div>
            <Input
              label="Adulthood age *"
              type="number"
              min={0}
              value={form.adulthood_lifespan[0]}
              onChange={(e) => onFormChange((p) => ({ ...p, adulthood_lifespan: [e.target.value === '' ? '' : Number(e.target.value), p.adulthood_lifespan[1]] }))}
              aria-label="Adulthood age"
            />
          </div>
          <div>
            <Input
              label="Lifespan (years) *"
              type="number"
              min={0}
              value={form.adulthood_lifespan[1]}
              onChange={(e) => onFormChange((p) => ({ ...p, adulthood_lifespan: [p.adulthood_lifespan[0], e.target.value === '' ? '' : Number(e.target.value)] }))}
              aria-label="Lifespan in years"
            />
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}

function TraitBlock({
  title,
  limit,
  ids,
  traitIdToName,
  onRemove,
}: {
  title: string;
  limit: number;
  ids: string[];
  traitIdToName: Map<string, string>;
  onRemove: (id: string) => void;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-text-secondary mb-2">{title} ({ids.length} / {limit})</h3>
      {ids.length === 0 ? (
        <p className="text-sm text-text-muted italic">None</p>
      ) : (
        <ul className="space-y-1">
          {ids.map((id) => (
            <li key={id} className="flex items-center justify-between gap-2 py-1">
              <span className="text-text-primary">{traitIdToName.get(id) ?? id}</span>
              <button type="button" onClick={() => onRemove(id)} className="text-text-muted hover:text-danger-fg">×</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const TRAIT_GRID_COLUMNS = '1.5fr 0.6fr 0.6fr';
const TRAIT_LIST_COLUMNS = [
  { key: 'name', label: 'NAME' },
  { key: 'uses_per_rec', label: 'USES' },
  { key: 'rec_period', label: 'RECOVERY' },
];

interface TraitListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  traits: Trait[];
  filter: (t: Trait) => boolean;
  form: SpeciesFormState;
  traitLimits: Record<TraitCategory, number>;
  mode: 'species_ancestry' | 'flaw' | 'characteristic';
  onAddBatch: (traitIds: string[], category: TraitCategory) => void;
  onThirdSpeciesTrait?: (traitId: string) => void;
}

export function TraitListModal({
  isOpen,
  onClose,
  title,
  traits,
  filter,
  form,
  traitLimits,
  mode,
  onAddBatch,
  onThirdSpeciesTrait,
}: TraitListModalProps) {
  const alreadyUsed = useMemo(
    () => new Set([...form.species_traits, ...form.ancestry_traits, ...form.characteristics, ...form.flaws]),
    [form]
  );

  const items: SelectableItem[] = useMemo(() => {
    return traits
      .filter((t) => filter(t) && !alreadyUsed.has(String(t.id)))
      .map((t) => ({
        id: String(t.id),
        name: t.name,
        description: t.description ?? '',
        columns: [
          {
            key: 'uses_per_rec',
            value: t.uses_per_rec != null && t.uses_per_rec > 0 ? String(t.uses_per_rec) : '-',
            align: 'center' as const,
          },
          {
            key: 'rec_period',
            value: t.rec_period ? formatListCellLabel(t.rec_period) : '-',
            align: 'center' as const,
          },
        ],
        data: t,
      }));
  }, [traits, filter, alreadyUsed]);

  const canAddSpecies = form.species_traits.length < traitLimits.species_traits;
  const canAddAncestry = form.ancestry_traits.length < traitLimits.ancestry_traits;
  const canAddFlaw = form.flaws.length < traitLimits.flaws;
  const canAddCharacteristic = form.characteristics.length < traitLimits.characteristics;

  const description =
    mode === 'species_ancestry'
      ? 'Add as species traits or ancestry traits.'
      : undefined;

  const addIds = (selected: SelectableItem[], category: TraitCategory) => {
    const ids = selected.map((s) => String(s.id));
    if (!ids.length) return;
    if (category === 'species_traits' && ids.length === 1 && form.species_traits.length === 2) {
      onThirdSpeciesTrait?.(ids[0]);
      onClose();
      return;
    }
    onAddBatch(ids, category);
    onClose();
  };

  return (
    <UnifiedSelectionModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      items={items}
      onConfirm={(selected) => {
        if (mode === 'flaw') addIds(selected, 'flaws');
        else if (mode === 'characteristic') addIds(selected, 'characteristics');
      }}
      columns={TRAIT_LIST_COLUMNS}
      gridColumns={TRAIT_GRID_COLUMNS}
      itemLabel={mode === 'flaw' ? 'flaw' : mode === 'characteristic' ? 'characteristic' : 'trait'}
      emptyMessage="No traits found"
      emptySubMessage="Try adjusting your search or check limits."
      searchPlaceholder="Search traits..."
      confirmLabel={
        mode === 'flaw'
          ? 'Add selected'
          : mode === 'characteristic'
            ? 'Add selected'
            : 'Add Selected'
      }
      confirmDisabled={
        mode === 'flaw'
          ? () => !canAddFlaw
          : mode === 'characteristic'
            ? () => !canAddCharacteristic
            : undefined
      }
      primaryActions={
        mode === 'species_ancestry'
          ? (selected) => (
              <>
                <Button
                  onClick={() => addIds(selected, 'species_traits')}
                  disabled={selected.length === 0 || !canAddSpecies}
                >
                  Add selected as species trait{selected.length !== 1 ? 's' : ''}
                </Button>
                <Button
                  onClick={() => addIds(selected, 'ancestry_traits')}
                  disabled={selected.length === 0 || !canAddAncestry}
                >
                  Add selected as ancestry trait{selected.length !== 1 ? 's' : ''}
                </Button>
              </>
            )
          : undefined
      }
      size="lg"
      className="max-h-[60vh]"
    />
  );
}
