/**
 * Armament Creator Page
 * =====================
 * Tool for creating custom items (weapons, armor, shields) using the property system.
 *
 * Features:
 * - Select item properties from the Codex
 * - Configure option levels for each property
 * - Calculate IP, TP, and currency costs
 * - Automatic rarity calculation
 * - Save to user's library via the library API
 *
 * Structure (TASK-381): bootstrap gate in Content → workspace shell here →
 * state in use-item-creator-workspace → editor islands in item-creator-editor.
 */

'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sword, Target, Coins } from 'lucide-react';
import {
  useItemProperties,
  useAdmin,
  useLoadModalLibrary,
  type ItemProperty,
  type LoadModalArmamentKind,
  type UseLoadModalLibraryReturn,
} from '@/hooks';
import { LoadingState } from '@/components/ui';
import {
  CreatorPageShell,
  AdvancedCalculationsPanel,
  CreatorSummaryPanel,
} from '@/components/creator';
import { SourceFilter, sourceFilterSummary } from '@/components/patterns/filters/source-filter';
import { SegmentedControl } from '@/components/patterns';
import { useAuthStore } from '@/stores';
import {
  bootstrapItemCreatorFormState,
  type ItemCreatorFormState,
  type ItemLibraryRecord,
} from './item-creator-bootstrap';
import { ItemCreatorEditor } from './item-creator-editor';
import { RarityReferenceTable } from './item-creator-helpers';
import { useItemCreatorWorkspace } from './use-item-creator-workspace';
import { formatCost } from '@/lib/game/creator-constants';
import { rarityChipVariant } from '@/lib/chip/rarity-chip-variant';

function ItemCreatorContent() {
  const { user } = useAuthStore();
  const { isAdmin } = useAdmin();
  const searchParams = useSearchParams();
  const editItemId = searchParams.get('edit');
  const [loadKind, setLoadKind] = useState<LoadModalArmamentKind>('weapon');
  const load = useLoadModalLibrary('item', { itemKind: loadKind });

  const { data: itemProperties = [], isLoading, error, refetch } = useItemProperties();

  const sessionKey = editItemId ?? 'draft';
  // Settle when the properties query finishes (empty/error OK — shell chrome must
  // still render for chrome audits / secret-less CI). In ?edit= mode also wait for library.
  const bootstrapReady = !isLoading && (!editItemId || !load.isLoading);

  // One-time render adjust per sessionKey: compute the initial form state exactly
  // once when data is ready (no hydrate effect, no recompute on later re-renders).
  const [bootstrapState, setBootstrapState] = useState<{
    key: string;
    form: ItemCreatorFormState;
  } | null>(null);
  if (bootstrapReady && bootstrapState?.key !== sessionKey) {
    setBootstrapState({
      key: sessionKey,
      form: bootstrapItemCreatorFormState({
        editItemId,
        itemProperties,
        rawItems: load.rawItems,
      }),
    });
  }
  const initialFormState = bootstrapState?.key === sessionKey ? bootstrapState.form : null;

  if (!initialFormState) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingState message="Loading item properties..." padding="lg" />
      </div>
    );
  }

  return (
    <ItemCreatorWorkspace
      key={sessionKey}
      initialFormState={initialFormState}
      editItemId={editItemId}
      user={user}
      isAdmin={isAdmin}
      itemProperties={itemProperties}
      load={load}
      loadKind={loadKind}
      setLoadKind={setLoadKind}
      isLoading={isLoading}
      error={error}
      refetch={refetch}
    />
  );
}

interface ItemCreatorWorkspaceProps {
  initialFormState: ItemCreatorFormState;
  editItemId: string | null;
  user: ReturnType<typeof useAuthStore.getState>['user'];
  isAdmin: boolean;
  itemProperties: ItemProperty[];
  load: UseLoadModalLibraryReturn;
  loadKind: LoadModalArmamentKind;
  setLoadKind: (kind: LoadModalArmamentKind) => void;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

function ItemCreatorWorkspace({
  initialFormState,
  editItemId,
  user,
  isAdmin,
  itemProperties,
  load,
  loadKind,
  setLoadKind,
  isLoading,
  error,
  refetch,
}: ItemCreatorWorkspaceProps) {
  const ws = useItemCreatorWorkspace({
    initialFormState,
    editItemId,
    itemProperties,
    closeLoadModal: load.closeLoadModal,
  });

  return (
    <CreatorPageShell
      icon={<Sword className="h-8 w-8 text-tp-text" />}
      title="Armament Creator"
      description="Design custom weapons, armor, and shields by combining item properties. Properties determine the item's rarity and cost."
      user={user}
      auth={{ returnPath: '/item-creator', contentType: 'armament' }}
      showPublicPrivate={isAdmin}
      saveTarget={ws.save.saveTarget}
      onSaveTargetChange={ws.save.setSaveTarget}
      onSave={ws.save.handleSave}
      onLoad={load.openLoadModal}
      onReset={ws.handleReset}
      saving={ws.save.saving}
      saveDisabled={!ws.name.trim()}
      loading={{
        isLoading,
        loadingMessage: 'Loading item properties...',
        error: error ?? null,
        onRetry: () => {
          void refetch();
        },
        errorMessage: error ? `Failed to load item properties: ${error.message}` : undefined,
      }}
      publish={{
        isOpen: ws.save.showPublishConfirm,
        onClose: () => ws.save.setShowPublishConfirm(false),
        onConfirm: () => ws.save.confirmPublish(),
        title: ws.save.publishConfirmTitle,
        description:
          ws.save.publishConfirmDescription?.(ws.name.trim(), {
            existingInPublic: ws.save.publishExistingInPublic,
          }) ?? '',
      }}
      loadModal={{
        isOpen: load.showLoadModal,
        onClose: load.closeLoadModal,
        selectableItems: load.selectableItems,
        columns: load.columns,
        gridColumns: load.gridColumns,
        headerExtra: <SourceFilter value={load.source} onChange={load.setSource} />,
        scopeExtra: (
          <SegmentedControl
            value={loadKind}
            onChange={setLoadKind}
            aria-label="Armament type"
            tabs
            options={[
              { value: 'weapon', label: 'Weapons' },
              { value: 'armor', label: 'Armor' },
              { value: 'shield', label: 'Shields' },
            ]}
          />
        ),
        optionsSummary: sourceFilterSummary(load.source),
        optionsActiveCount: load.source !== 'all' ? 1 : 0,
        emptyMessage: load.emptyMessage,
        emptySubMessage: load.emptySubMessage,
        searchPlaceholder: `Search ${loadKind === 'armor' ? 'armor' : `${loadKind}s`}...`,
        isLoading: load.isLoading,
        error: load.error,
        title: 'Load Armament from Library',
        onSelect: (selected) => ws.handleLoadItem(selected.data as ItemLibraryRecord),
      }}
      sidebar={
        <>
          <CreatorSummaryPanel
            title="Item Summary"
            badge={{
              label: ws.rarity,
              variant: rarityChipVariant(ws.rarity),
            }}
            costStats={[
              {
                label: 'Currency Cost',
                value: ws.currencyCost,
                icon: <Coins className="h-6 w-6" />,
                color: 'currency',
              },
              {
                label: 'Training Points',
                value: ws.costs.totalTP,
                icon: <Target className="h-6 w-6" />,
                color: 'tp',
              },
            ]}
            statRows={[
              { label: 'Type', value: ws.armamentType },
              { label: 'Item Points', value: `${formatCost(ws.costs.totalIP)} IP` },
              ...(ws.armamentType === 'Weapon'
                ? [
                    { label: 'Handedness', value: ws.isTwoHanded ? 'Two-Handed' : 'One-Handed' },
                    { label: 'Range', value: ws.rangeDisplay },
                  ]
                : []),
              ...(ws.armamentType === 'Armor'
                ? [
                    { label: 'Damage Reduction', value: String(ws.damageReduction) },
                    ...(ws.agilityReduction > 0
                      ? [
                          {
                            label: 'Agility Reduction',
                            value: `-${ws.agilityReduction}`,
                            valueColor: 'text-danger-fg',
                          },
                        ]
                      : []),
                  ]
                : []),
              ...(ws.armamentType === 'Shield'
                ? [
                    { label: 'Handedness', value: ws.isTwoHanded ? 'Two-Handed' : 'One-Handed' },
                    { label: 'Shield Block', value: `${ws.shieldDR.amount}d${ws.shieldDR.size}` },
                    ...(ws.hasShieldDamage
                      ? [
                          {
                            label: 'Shield Damage',
                            value: `${ws.shieldDamage.amount}d${ws.shieldDamage.size}`,
                          },
                        ]
                      : []),
                  ]
                : []),
              ...(ws.damageDisplay ? [{ label: 'Damage', value: ws.damageDisplay }] : []),
            ]}
            breakdowns={
              ws.selectedProperties.length > 0
                ? [
                    {
                      title: 'Properties',
                      items: ws.selectedProperties.map((sp) => ({
                        label: sp.property.name,
                        detail: sp.op_1_lvl > 0 ? `Lvl ${sp.op_1_lvl}` : undefined,
                      })),
                    },
                  ]
                : undefined
            }
          >
            <AdvancedCalculationsPanel
              groups={ws.advancedCalcGroups}
              ruleText="Rule: Final currency = base cost for rarity × (1 + 0.125 × C), then rounded down. Training Points are not shown in this panel."
            />
          </CreatorSummaryPanel>
          <RarityReferenceTable currentIP={ws.costs.totalIP} />
        </>
      }
    >
      <ItemCreatorEditor
        isAdmin={isAdmin}
        name={ws.name}
        onNameChange={ws.setName}
        description={ws.description}
        onDescriptionChange={ws.setDescription}
        imageId={ws.imageId}
        imageUrl={ws.imageUrl}
        onImageChange={(selection) => {
          ws.setImageId(selection.imageId);
          ws.setImageUrl(selection.imageUrl);
        }}
        imageCategory={ws.imageCategory}
        armamentType={ws.armamentType}
        onArmamentTypeChange={ws.changeArmamentType}
        isTwoHanded={ws.isTwoHanded}
        onIsTwoHandedChange={ws.setIsTwoHanded}
        rangeType={ws.rangeType}
        onRangeTypeChange={ws.changeRangeType}
        rangeSpaces={ws.rangeSpaces}
        onRangeSpacesChange={ws.setRangeSpaces}
        attackAbility={ws.attackAbility}
        onAttackAbilityChange={ws.changeAttackAbility}
        weaponShieldConfigSummary={ws.weaponShieldConfigSummary}
        damage={ws.damage}
        onDamageChange={ws.setDamage}
        baseDamageSummary={ws.baseDamageSummary}
        damageReduction={ws.damageReduction}
        onDamageReductionChange={ws.setDamageReduction}
        agilityReduction={ws.agilityReduction}
        onAgilityReductionChange={ws.setAgilityReduction}
        criticalRangeIncrease={ws.criticalRangeIncrease}
        onCriticalRangeIncreaseChange={ws.setCriticalRangeIncrease}
        armorConfigSummary={ws.armorConfigSummary}
        shieldDR={ws.shieldDR}
        onShieldDRChange={ws.setShieldDR}
        shieldBlockSummary={ws.shieldBlockSummary}
        hasShieldDamage={ws.hasShieldDamage}
        onHasShieldDamageChange={ws.setHasShieldDamage}
        shieldDamage={ws.shieldDamage}
        onShieldDamageChange={ws.setShieldDamage}
        shieldDamageSummary={ws.shieldDamageSummary}
        abilityRequirement={ws.abilityRequirement}
        onAbilityRequirementChange={ws.setAbilityRequirement}
        abilityReqSummary={ws.abilityReqSummary}
        selectedProperties={ws.selectedProperties}
        itemProperties={itemProperties}
        propertiesSummary={ws.propertiesSummary}
        onAddProperty={ws.addProperty}
        onRemoveProperty={ws.removeProperty}
        onUpdateProperty={ws.updateProperty}
        itemSectionCosts={ws.itemSectionCosts}
      />
    </CreatorPageShell>
  );
}

export default function ItemCreatorPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading..." padding="md" />}>
      <ItemCreatorContent />
    </Suspense>
  );
}
