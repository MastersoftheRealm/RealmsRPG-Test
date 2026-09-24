/**
 * Power Creator — Structure / Reverse / variant tabs band above the creator grid (ADR-0029).
 * Uses existing Select, Checkbox, TabNavigation; no new shared UI.
 */

'use client';

import { Plus, X } from 'lucide-react';
import type { PowerPart } from '@/hooks';
import {
  Button,
  Card,
  Checkbox,
  IconButton,
  Input,
  Select,
  TabNavigation,
  Textarea,
} from '@/components/ui';
import { findByIdOrName, PART_IDS } from '@/lib/id-constants';
import {
  POWER_ALTERNATE_HELP,
  POWER_COMPOSITION_CODEX_PART_IDS,
  POWER_COMPOSITION_STRUCTURES,
  POWER_COMPOSITION_STRUCTURE_LABELS,
  POWER_RANDOMIZE_DIE_SIDES,
  type PowerCompositionStructure,
} from '@/lib/calculators';
import { PowerCreatorHelp } from './power-creator-help';
import { REVERSE_TAB_ID, SHARED_TAB_ID } from './power-creator-composition';
import type { PowerCreatorCompositionState } from './use-power-creator-composition';

const STRUCTURE_OPTIONS = POWER_COMPOSITION_STRUCTURES.map((s) => ({
  value: s,
  label: POWER_COMPOSITION_STRUCTURE_LABELS[s],
}));

const DIE_OPTIONS = POWER_RANDOMIZE_DIE_SIDES.map((s) => ({ value: String(s), label: `1d${s}` }));

function codexDescription(powerParts: PowerPart[], id: number | undefined): string {
  if (id == null) return '';
  return findByIdOrName(powerParts, { id })?.description?.trim() ?? '';
}

function structureDescription(structure: PowerCompositionStructure, powerParts: PowerPart[]) {
  if (structure === 'none') return '';
  if (structure === 'alternate') return POWER_ALTERNATE_HELP;
  return codexDescription(powerParts, POWER_COMPOSITION_CODEX_PART_IDS[structure]);
}

function tabHint(structure: PowerCompositionStructure, activeTabId: string): string {
  if (activeTabId === REVERSE_TAB_ID) {
    return 'Reverse: add the drawback parts. Its duration defaults to the power’s. Summary shows the 50% discount.';
  }
  if (activeTabId === SHARED_TAB_ID) {
    return structure === 'none'
      ? 'Power: the benefit this drawback is attached to.'
      : 'Shared: fields every variant uses. A variant field replaces the shared one; variant parts are added.';
  }
  if (structure === 'alternate') {
    return 'Each variant is a complete power. New variants copy the tab you are on.';
  }
  if (structure === 'modify') {
    return 'This piece: set only what differs from Shared (its duration, damage, area, range, parts).';
  }
  return 'This variant: set only what differs from Shared (duration, damage, area, range, parts).';
}

type PowerCreatorCompositionBandProps = {
  state: PowerCreatorCompositionState;
  powerParts: PowerPart[];
  tabGroupId: string;
  sharedPanelId: string;
};

export function PowerCreatorCompositionBand({
  state,
  powerParts,
  tabGroupId,
  sharedPanelId,
}: PowerCreatorCompositionBandProps) {
  const { structure, reverseEnabled, variants, activeVariant, activeTabId } = state;
  const description = structureDescription(structure, powerParts);
  const reverseDescription = reverseEnabled
    ? codexDescription(powerParts, PART_IDS.POWER_REVERSE_EFFECTS)
    : '';

  const tabs = state.tabIds.map((id) => {
    if (id === SHARED_TAB_ID) {
      return { id, label: structure === 'none' ? 'Power' : 'Shared' };
    }
    if (id === REVERSE_TAB_ID) return { id, label: 'Reverse' };
    const v = variants.find((x) => x.id === id);
    const label = v?.label.trim() || id;
    return {
      id,
      label,
      suffix:
        variants.length > 1 ? (
          <IconButton
            size="sm"
            variant="danger"
            label={`Remove ${label}`}
            onClick={() => state.removeVariant(id)}
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </IconButton>
        ) : undefined,
    };
  });

  const showTabs = tabs.length > 1;
  const isVariantTab = !!activeVariant && structure !== 'none';

  return (
    <Card className="mb-6 p-4 shadow-md md:p-6">
      <h2 className="sr-only">Power variants</h2>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="min-w-0 sm:w-56">
          <div className="mb-1.5 flex items-center gap-1.5">
            <label
              htmlFor="power-creator-structure"
              className="text-sm font-medium text-text-primary"
            >
              Structure
            </label>
            <PowerCreatorHelp topic="structure" />
          </div>
          <Select
            id="power-creator-structure"
            value={structure}
            options={STRUCTURE_OPTIONS}
            onChange={(e) => state.setStructure(e.target.value as PowerCompositionStructure)}
          />
        </div>
        <div className="flex items-center gap-1.5 sm:pb-2.5">
          <Checkbox
            id="power-creator-reverse"
            label="Reverse effects"
            checked={reverseEnabled}
            onChange={(e) => state.setReverseEnabled(e.target.checked)}
          />
          <PowerCreatorHelp topic="reverse" />
        </div>
      </div>

      {description ? (
        <p className="mt-3 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">
            {POWER_COMPOSITION_STRUCTURE_LABELS[structure]}:
          </span>{' '}
          {description}
        </p>
      ) : null}
      {reverseDescription ? (
        <p className="mt-2 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Reverse effects:</span>{' '}
          {reverseDescription}
        </p>
      ) : null}

      {showTabs ? (
        <div className="mt-4 min-w-0">
          <TabNavigation
            tabs={tabs}
            activeTab={activeTabId}
            onTabChange={state.switchTab}
            tabGroupId={tabGroupId}
            sharedTabPanelId={sharedPanelId}
            size="sm"
            trailing={
              structure !== 'none' ? (
                <Button size="sm" variant="outline" onClick={state.addVariant}>
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                  Add variant
                </Button>
              ) : undefined
            }
          />
          <p className="mt-2 text-sm text-text-muted">{tabHint(structure, activeTabId)}</p>
        </div>
      ) : null}

      {isVariantTab && activeVariant ? (
        <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
          <Input
            label="Variant name"
            value={activeVariant.label}
            onChange={(e) => state.updateVariantMeta(activeVariant.id, { label: e.target.value })}
            placeholder="e.g. Fire, Freeze"
          />
          {structure === 'randomize' ? (
            <Select
              label="Outcome"
              value={activeVariant.polarity}
              options={[
                { value: 'positive', label: 'Positive (adds its energy)' },
                { value: 'negative', label: 'Negative (subtracts its energy)' },
              ]}
              onChange={(e) =>
                state.updateVariantMeta(activeVariant.id, {
                  polarity: e.target.value === 'negative' ? 'negative' : 'positive',
                })
              }
            />
          ) : null}
          {structure === 'choice' || structure === 'alternate' ? (
            <div className="min-w-0 sm:col-span-2">
              <Textarea
                label="Variant description (optional)"
                value={activeVariant.description}
                onChange={(e) =>
                  state.updateVariantMeta(activeVariant.id, { description: e.target.value })
                }
                rows={2}
                placeholder="Only when this variant reads differently from the power description."
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {structure === 'randomize' ? <RandomizeDieFields state={state} /> : null}
    </Card>
  );
}

function RandomizeDieFields({ state }: { state: PowerCreatorCompositionState }) {
  const faceOptions = [
    { value: '', label: 'Unassigned' },
    ...state.variants.map((v) => ({ value: v.id, label: v.label.trim() || v.id })),
  ];
  const unassigned = state.dieFaces.filter((f) => !state.variants.some((v) => v.id === f)).length;
  return (
    <fieldset className="mt-4 min-w-0 border-t border-border-light pt-4">
      <legend className="sr-only">Randomize die</legend>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 sm:w-40">
          <Select
            label="Die"
            value={String(state.dieSides)}
            options={DIE_OPTIONS}
            onChange={(e) => state.setDieSides(Number(e.target.value))}
          />
        </div>
        <Button size="sm" variant="secondary" onClick={state.spreadFaces}>
          Assign faces evenly
        </Button>
      </div>
      <div className="mt-3 grid max-h-72 min-w-0 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 lg:grid-cols-4">
        {state.dieFaces.map((face, i) => (
          <Select
            key={i}
            label={`Face ${i + 1}`}
            value={face}
            options={faceOptions}
            onChange={(e) => state.setDieFace(i, e.target.value)}
          />
        ))}
      </div>
      {unassigned > 0 ? (
        <p className="mt-2 text-sm text-warning-fg" role="status">
          {unassigned} {unassigned === 1 ? 'face has' : 'faces have'} no variant. Assign every face
          to save.
        </p>
      ) : null}
    </fieldset>
  );
}
