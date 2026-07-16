/**
 * Technique Creator Page
 * ======================
 * Tool for creating custom martial techniques using the technique parts system.
 * 
 * Features:
 * - Select technique parts from Codex API (Supabase)
 * - Configure option levels for each part
 * - Calculate energy and training point costs
 * - Save to user's library (Supabase)
 */

'use client';

import { useState, useMemo, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Swords, Zap, Target, Info } from 'lucide-react';
import {
  useTechniqueParts,
  useUserItems,
  useItemProperties,
  useAdmin,
  useCreatorSave,
  useLoadModalLibrary,
  useOfficialLibrary,
  useCreatorWeaponOptions,
  type TechniquePart,
  type CreatorWeaponOption,
  type UseLoadModalLibraryReturn,
} from '@/hooks';
import { useAuthStore } from '@/stores';
import { LoadingState, Checkbox, Button, Input, Textarea, Card } from '@/components/ui';
import {
  CreatorPageShell,
  CollapsibleSection,
  CreatorWeaponPicker,
  AdvancedCalculationsPanel,
  PowerPartCard,
  CreatorSummaryPanel,
} from '@/components/creator';
import { SourceFilter } from '@/components/shared/filters/source-filter';
import type { SourceFilterValue } from '@/components/shared/filters/source-filter';
import { ValueStepper, SectionCostBadge, ErrorDisplay } from '@/components/shared';
import {
  calculateTechniqueCosts,
  computeTechniqueActionTypeFromSelection,
  buildMechanicParts,
  formatTechniqueDamage,
  type TechniquePartPayload,
} from '@/lib/calculators';
import { shouldPersistCreatorWeaponId } from '@/lib/creator-weapon-persistence';

// =============================================================================
// Types
// =============================================================================

import {
  bootstrapTechniqueCreatorFormState,
  techniqueLibraryRecordToFormState,
  TECHNIQUE_CREATOR_CACHE_KEY,
  type TechniqueCreatorCache,
  type TechniqueCreatorFormState,
  type TechniqueSelectedPart as SelectedPart,
  type TechniqueDamageConfig as DamageConfig,
} from './technique-creator-bootstrap';
import { writeCreatorCache, clearCreatorCache } from '@/lib/game/creator-cache';

function toTechniquePartPayload(part: {
  id: string | number;
  name: string;
  op_1_lvl: number;
  op_2_lvl: number;
  op_3_lvl: number;
}): TechniquePartPayload {
  return {
    id: Number(part.id),
    name: part.name,
    op_1_lvl: part.op_1_lvl,
    op_2_lvl: part.op_2_lvl,
    op_3_lvl: part.op_3_lvl,
  };
}

// =============================================================================
// Shared Constants (imported from central location)
// =============================================================================

import {
  ACTION_OPTIONS,
  DIE_SIZES,
} from '@/lib/game/creator-constants';

// Default weapon options (always available)
const DEFAULT_WEAPON_OPTIONS: CreatorWeaponOption[] = [
  { id: 0, name: 'Unarmed Prowess', tp: 0, weaponLibrary: 'builtin' },
  { id: 'no-attack', name: 'No Attack', tp: 0, weaponLibrary: 'builtin' },
];

// =============================================================================
// Main Component
// =============================================================================

function TechniqueCreatorContent() {
  const { user } = useAuthStore();
  const { isAdmin } = useAdmin();
  const searchParams = useSearchParams();
  const editTechniqueId = searchParams.get('edit');
  const load = useLoadModalLibrary('technique');

  const { data: techniqueParts = [], isLoading, error, refetch } = useTechniqueParts();

  // Fetch user's saved items (weapons) and codex properties (for weapon TP calculation)
  const { data: userItems = [] } = useUserItems();
  const { data: itemPropertiesDb = [] } = useItemProperties();
  const { data: officialItems = [] } = useOfficialLibrary('items');

  const [weaponLibrarySource, setWeaponLibrarySource] = useState<SourceFilterValue>('my');

  const { fullOptions: allWeaponOptions, visibleOptions } = useCreatorWeaponOptions({
    defaults: DEFAULT_WEAPON_OPTIONS,
    userItems,
    officialWeaponItems: officialItems,
    itemPropertiesDb,
    librarySource: weaponLibrarySource,
  });

  const sessionKey = editTechniqueId ?? 'draft';
  // Ready once parts + weapon options exist; in ?edit= mode also wait for the
  // library fetch to settle (rawItems may legitimately stay empty — fall back to blank form).
  const bootstrapReady =
    techniqueParts.length > 0 &&
    allWeaponOptions.length > 0 &&
    (!editTechniqueId || !load.isLoading);

  // One-time render adjust per sessionKey: compute the initial form state exactly
  // once when data is ready (no hydrate effect, no recompute on later re-renders).
  const [bootstrapState, setBootstrapState] = useState<{
    key: string;
    form: TechniqueCreatorFormState;
  } | null>(null);
  if (bootstrapReady && bootstrapState?.key !== sessionKey) {
    setBootstrapState({
      key: sessionKey,
      form: bootstrapTechniqueCreatorFormState({
        editTechniqueId,
        techniqueParts,
        allWeaponOptions,
        defaultWeapon: DEFAULT_WEAPON_OPTIONS[0],
        rawItems: load.rawItems,
      }),
    });
  }
  const initialFormState = bootstrapState?.key === sessionKey ? bootstrapState.form : null;

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <ErrorDisplay
          message={`Failed to load technique parts: ${error.message}`}
          onRetry={() => {
            void refetch();
          }}
        />
      </div>
    );
  }

  if (!initialFormState) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingState message="Loading technique parts..." padding="lg" />
      </div>
    );
  }

  return (
    <TechniqueCreatorWorkspace
      key={sessionKey}
      initialFormState={initialFormState}
      editTechniqueId={editTechniqueId}
      user={user}
      isAdmin={isAdmin}
      techniqueParts={techniqueParts}
      allWeaponOptions={allWeaponOptions}
      visibleOptions={visibleOptions}
      weaponLibrarySource={weaponLibrarySource}
      setWeaponLibrarySource={setWeaponLibrarySource}
      load={load}
      isLoading={isLoading}
      error={error}
      refetch={refetch}
    />
  );
}

interface TechniqueCreatorWorkspaceProps {
  initialFormState: TechniqueCreatorFormState;
  editTechniqueId: string | null;
  user: ReturnType<typeof useAuthStore.getState>['user'];
  isAdmin: boolean;
  techniqueParts: TechniquePart[];
  allWeaponOptions: CreatorWeaponOption[];
  visibleOptions: CreatorWeaponOption[];
  weaponLibrarySource: SourceFilterValue;
  setWeaponLibrarySource: (value: SourceFilterValue) => void;
  load: UseLoadModalLibraryReturn;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

function TechniqueCreatorWorkspace({
  initialFormState,
  editTechniqueId,
  user,
  isAdmin,
  techniqueParts,
  allWeaponOptions,
  visibleOptions,
  weaponLibrarySource,
  setWeaponLibrarySource,
  load,
  isLoading,
  error,
  refetch,
}: TechniqueCreatorWorkspaceProps) {
  const [name, setName] = useState(initialFormState.name);
  const [description, setDescription] = useState(initialFormState.description);
  const [selectedParts, setSelectedParts] = useState<SelectedPart[]>(initialFormState.selectedParts);
  const [actionType, setActionType] = useState(initialFormState.actionType);
  const [isReaction, setIsReaction] = useState(initialFormState.isReaction);
  const [damage, setDamage] = useState<DamageConfig>(initialFormState.damage);
  const [weapon, setWeapon] = useState<CreatorWeaponOption>(initialFormState.weapon);

  // ?edit= mode: clear any stale draft once on mount (parity with the old hydrate
  // effect, which removed the cache after loading the edit target).
  useEffect(() => {
    if (editTechniqueId) clearCreatorCache(TECHNIQUE_CREATOR_CACHE_KEY);
  }, [editTechniqueId]);

  // Auto-save draft to localStorage (skip when editing an existing library row via ?edit=)
  useEffect(() => {
    if (editTechniqueId) return;

    const cache: TechniqueCreatorCache = {
      name,
      description,
      selectedParts: selectedParts.map(sp => ({
        partId: sp.part.id,
        op_1_lvl: sp.op_1_lvl,
        op_2_lvl: sp.op_2_lvl,
        op_3_lvl: sp.op_3_lvl,
        selectedCategory: sp.selectedCategory,
      })),
      actionType,
      isReaction,
      damage,
      weaponId: weapon.id,
      timestamp: Date.now(),
    };
    writeCreatorCache(TECHNIQUE_CREATOR_CACHE_KEY, cache);
  }, [editTechniqueId, name, description, selectedParts, actionType, isReaction, damage, weapon.id]);

  // Build mechanic parts from action type, damage, and weapon selections
  const weaponAttackMode = useMemo(
    () => (String(weapon.id) === 'no-attack' ? ('no_attack' as const) : ('attack' as const)),
    [weapon.id]
  );

  const weaponTPForMechanics = useMemo(() => {
    if (weaponAttackMode === 'no_attack') return 0;
    return weapon.tp ?? (weapon.id !== 0 ? 1 : 0); // Use weapon TP if available
  }, [weapon.id, weapon.tp, weaponAttackMode]);

  const shouldPersistSelectedWeapon = useMemo(
    () =>
      shouldPersistCreatorWeaponId({
        weaponId: weapon.id,
        allowNoAttack: false,
      }),
    [weapon.id]
  );

  const mechanicParts = useMemo(
    () => buildMechanicParts({
      creatorType: 'technique',
      partsDb: techniqueParts,
      action: { type: actionType, isReaction },
      techniqueDamage: { diceAmount: damage.amount, dieSize: damage.size },
      weapon: { tp: weaponTPForMechanics, attackMode: weaponAttackMode },
    }),
    [actionType, isReaction, damage.amount, damage.size, weaponAttackMode, weaponTPForMechanics, techniqueParts]
  );

  // Convert selected parts to payload format for calculator
  const partsPayload: TechniquePartPayload[] = useMemo(
    () => [
      ...selectedParts.map((sp) => ({
        id: Number(sp.part.id),
        name: sp.part.name,
        part: sp.part,
        op_1_lvl: sp.op_1_lvl,
        op_2_lvl: sp.op_2_lvl,
        op_3_lvl: sp.op_3_lvl,
      })),
      ...mechanicParts.map(toTechniquePartPayload),
    ],
    [selectedParts, mechanicParts]
  );

  // Calculate costs - using technique parts as the database
  const costs = useMemo(
    () => calculateTechniqueCosts(partsPayload, techniqueParts),
    [partsPayload, techniqueParts]
  );
  const advancedCalcRows = useMemo(
    () => [
      { label: 'Energy (raw)', value: costs.energyRaw.toFixed(2) },
      { label: 'Energy (final)', value: `ceil(${costs.energyRaw.toFixed(2)}) = ${costs.totalEnergy}` },
      { label: 'Training points (final)', value: String(costs.totalTP) },
    ],
    [costs.energyRaw, costs.totalEnergy, costs.totalTP]
  );

  // Derived display values
  const actionTypeDisplay = useMemo(
    () => computeTechniqueActionTypeFromSelection(actionType, isReaction),
    [actionType, isReaction]
  );

  const damageDisplay = useMemo(
    () => formatTechniqueDamage(damage.amount > 0 ? damage : undefined),
    [damage]
  );

  // Collapsed summaries for collapsible sections
  const combatConfigSummary = useMemo(
    () => `${weapon.name} • ${actionTypeDisplay}`,
    [weapon.name, actionTypeDisplay]
  );
  const techniquePartsSummary = useMemo(() => {
    if (selectedParts.length === 0) return 'No parts';
    const names = selectedParts.slice(0, 5).map((sp) => sp.part.name);
    const more = selectedParts.length > 5 ? ` +${selectedParts.length - 5} more` : '';
    return `${names.join(', ')}${more}`;
  }, [selectedParts]);
  const damageSummary = useMemo(
    () => (damage.amount > 0 ? `+${damage.amount}d${damage.size}` : 'None'),
    [damage.amount, damage.size]
  );

  // Section cost for Additional Damage
  const damageSectionCost = useMemo(() => {
    const damageParts = mechanicParts.filter(
      (mp) => mp.name === 'Additional Damage' || mp.name === 'Split Damage Dice'
    );
    return calculateTechniqueCosts(damageParts.map(toTechniquePartPayload), techniqueParts);
  }, [mechanicParts, techniqueParts]);

  // Section cost for Combat Configuration (weapon + action type + reaction)
  const combatConfigCost = useMemo(() => {
    const combatParts = mechanicParts.filter(
      (mp) => mp.name !== 'Additional Damage' && mp.name !== 'Split Damage Dice'
    );
    return calculateTechniqueCosts(combatParts.map(toTechniquePartPayload), techniqueParts);
  }, [mechanicParts, techniqueParts]);

  const weaponCost = useMemo(() => {
    const weaponParts = mechanicParts.filter((mp) => mp.name === 'Add Weapon Attack' || mp.name === 'No Attack');
    return calculateTechniqueCosts(weaponParts.map(toTechniquePartPayload), techniqueParts);
  }, [mechanicParts, techniqueParts]);

  const actionTypeCost = useMemo(() => {
    const actionParts = mechanicParts.filter(
      (mp) => mp.name === 'Quick or Free Action' || mp.name === 'Long Action'
    );
    return calculateTechniqueCosts(actionParts.map(toTechniquePartPayload), techniqueParts);
  }, [mechanicParts, techniqueParts]);

  const reactionCost = useMemo(() => {
    const reactionParts = mechanicParts.filter((mp) => mp.name === 'Reaction');
    return calculateTechniqueCosts(reactionParts.map(toTechniquePartPayload), techniqueParts);
  }, [mechanicParts, techniqueParts]);

  // Actions
  const addPart = useCallback(() => {
    // Seed from the first selectable (non-mechanic) part; mechanic parts are
    // auto-generated from action/damage/weapon and must not appear as editable rows.
    const firstSelectable = techniqueParts.find((p) => !p.mechanic);
    if (!firstSelectable) return;
    setSelectedParts((prev) => [
      ...prev,
      {
        part: firstSelectable,
        op_1_lvl: 0,
        op_2_lvl: 0,
        op_3_lvl: 0,
        selectedCategory: firstSelectable.category || 'any',
      },
    ]);
  }, [techniqueParts]);

  const removePart = useCallback((index: number) => {
    setSelectedParts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updatePart = useCallback((index: number, updates: Partial<SelectedPart>) => {
    setSelectedParts((prev) =>
      prev.map((sp, i) => (i === index ? { ...sp, ...updates } : sp))
    );
  }, []);

  const getPayload = useCallback(() => {
    const partsToSave = [
      ...selectedParts.map((sp) => ({
        id: Number(sp.part.id),
        name: sp.part.name,
        op_1_lvl: sp.op_1_lvl,
        op_2_lvl: sp.op_2_lvl,
        op_3_lvl: sp.op_3_lvl,
      })),
      ...mechanicParts.map((mp) => ({
        id: mp.id,
        name: mp.name,
        op_1_lvl: mp.op_1_lvl,
        op_2_lvl: mp.op_2_lvl,
        op_3_lvl: mp.op_3_lvl,
      })),
    ];
    const damageToSave = damage.amount > 0 ? [{ amount: damage.amount, size: damage.size }] : [];
    return {
      name: name.trim(),
      data: {
        name: name.trim(),
        description: description.trim(),
        parts: partsToSave,
        damage: damageToSave,
        weapon: shouldPersistSelectedWeapon ? weapon : null,
        actionType,
        isReaction,
      },
    };
  }, [name, description, selectedParts, mechanicParts, damage, shouldPersistSelectedWeapon, weapon, actionType, isReaction]);

  const save = useCreatorSave({
    type: 'techniques',
    getPayload,
    requirePublishConfirm: true,
    publishConfirmTitle: 'Publish to Realms Library',
    publishConfirmDescription: (n, { existingInPublic }) =>
      existingInPublic
        ? `Are you sure you want to override "${n}" (technique)? The existing public technique with this name will be replaced.`
        : `Are you sure you wish to publish this technique "${n}" to the Realms Library? All users will be able to see and use it.`,
    successMessage: 'Technique saved successfully!',
    publicSuccessMessage: 'Technique saved to Realms Library!',
    onSaveSuccess: () => {
      setName('');
      setDescription('');
      setSelectedParts([]);
      setActionType('basic');
      setIsReaction(false);
      setDamage({ amount: 0, size: 6, type: 'none' });
      setWeapon(DEFAULT_WEAPON_OPTIONS[0]);
    },
  });

  const handleReset = useCallback(() => {
    setName('');
    setDescription('');
    setSelectedParts([]);
    setActionType('basic');
    setIsReaction(false);
    setDamage({ amount: 0, size: 6, type: 'none' });
    setWeapon(DEFAULT_WEAPON_OPTIONS[0]);
    save.setSaveMessage(null);
    clearCreatorCache(TECHNIQUE_CREATOR_CACHE_KEY);
  }, [save]);

  const applyFormState = useCallback((next: TechniqueCreatorFormState) => {
    setName(next.name);
    setDescription(next.description);
    setSelectedParts(next.selectedParts);
    setActionType(next.actionType);
    setIsReaction(next.isReaction);
    setDamage(next.damage);
    setWeapon(next.weapon);
  }, []);

  // Load a technique from the library
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLoadTechnique = useCallback((technique: any) => {
    applyFormState(
      techniqueLibraryRecordToFormState(
        technique,
        techniqueParts,
        allWeaponOptions,
        DEFAULT_WEAPON_OPTIONS[0],
      ),
    );
    save.setSaveMessage({ type: 'success', text: 'Technique loaded successfully!' });
    setTimeout(() => save.setSaveMessage(null), 2000);
  }, [techniqueParts, allWeaponOptions, applyFormState, save]);

  return (
    <CreatorPageShell
      icon={<Swords className="w-8 h-8 text-energy-text" />}
      title="Technique Creator"
      description="Design custom martial techniques by combining technique parts. Each part contributes to the total energy cost and training point requirements."
      user={user}
      auth={{ returnPath: '/technique-creator', contentType: 'technique' }}
      showPublicPrivate={isAdmin}
      saveTarget={save.saveTarget}
      onSaveTargetChange={save.setSaveTarget}
      onSave={save.handleSave}
      onLoad={load.openLoadModal}
      onReset={handleReset}
      saving={save.saving}
      saveDisabled={!name.trim()}
      loading={{
        isLoading,
        loadingMessage: 'Loading technique parts...',
        error: error ?? null,
        onRetry: () => {
          void refetch();
        },
        errorMessage: error ? `Failed to load technique parts: ${error.message}` : undefined,
      }}
      publish={{
        isOpen: save.showPublishConfirm,
        onClose: () => save.setShowPublishConfirm(false),
        onConfirm: () => save.confirmPublish(),
        title: save.publishConfirmTitle,
        description:
          save.publishConfirmDescription?.(name.trim(), {
            existingInPublic: save.publishExistingInPublic,
          }) ?? '',
      }}
      loadModal={{
        isOpen: load.showLoadModal,
        onClose: load.closeLoadModal,
        selectableItems: load.selectableItems,
        columns: load.columns,
        gridColumns: load.gridColumns,
        headerExtra: <SourceFilter value={load.source} onChange={load.setSource} />,
        emptyMessage: load.emptyMessage,
        emptySubMessage: load.emptySubMessage,
        searchPlaceholder: 'Search techniques...',
        isLoading: load.isLoading,
        error: load.error,
        title: 'Load Technique from Library',
        onSelect: (selected) => handleLoadTechnique(selected.data),
      }}
      sidebar={
        <CreatorSummaryPanel
          title="Technique Summary"
          costStats={[
            { label: 'Energy Cost', value: costs.totalEnergy, icon: <Zap className="w-6 h-6" />, color: 'energy' },
            { label: 'Training Points', value: costs.totalTP, icon: <Target className="w-6 h-6" />, color: 'tp' },
          ]}
          statRows={[
            { label: 'Action', value: actionTypeDisplay },
            { label: 'Weapon', value: weapon.name },
            ...(damageDisplay ? [{ label: 'Damage', value: damageDisplay }] : []),
          ]}
          breakdowns={costs.tpSources.length > 0 ? [
            { title: 'TP Breakdown', items: costs.tpSources }
          ] : undefined}
        >
          <AdvancedCalculationsPanel
            rows={advancedCalcRows}
            ruleText="Rule: Mechanic parts are auto-generated from action, reaction, damage, and weapon; costs match standalone technique math."
          />
        </CreatorSummaryPanel>
      }
    >
      {/* Main Editor */}
          {/* Name & Description */}
          <Card className="shadow-md p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Technique Name *
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter technique name..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Description
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what your technique does..."
                  rows={3}
                />
              </div>
            </div>
          </Card>

          {/* Weapon & Action Type */}
          <CollapsibleSection
            title="Combat Configuration"
            collapsedSummary={combatConfigSummary}
            defaultExpanded={true}
            rightSlot={<SectionCostBadge en={combatConfigCost.energyRaw} tp={combatConfigCost.totalTP} />}
          >
            <div className="grid md:grid-cols-2 gap-4">
              <CreatorWeaponPicker
                librarySource={weaponLibrarySource}
                onLibrarySourceChange={setWeaponLibrarySource}
                fullOptions={allWeaponOptions}
                visibleOptions={visibleOptions}
                weapon={weapon}
                onWeaponChange={setWeapon}
                label="Weapon"
                ariaLabel="Weapon"
                badgeEn={weaponCost.energyRaw}
                badgeTp={weaponCost.totalTP}
              />
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="block text-sm font-medium text-text-secondary">
                    Action Type
                  </label>
                  <SectionCostBadge
                    en={actionTypeCost.energyRaw}
                    tp={actionTypeCost.totalTP}
                  />
                </div>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full px-4 py-2 border border-border-light rounded-lg text-text-primary bg-surface"
                  aria-label="Action type"
                >
                  {ACTION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between gap-3">
                <Checkbox
                  checked={isReaction}
                  onChange={(e) => setIsReaction(e.target.checked)}
                  label="Can be used as a Reaction"
                />
                {isReaction && (
                  <SectionCostBadge en={reactionCost.energyRaw} tp={reactionCost.totalTP} />
                )}
              </div>
            </div>
          </CollapsibleSection>

          {/* Technique Parts */}
          <CollapsibleSection
            title={`Technique Parts (${selectedParts.length})`}
            collapsedSummary={techniquePartsSummary}
            defaultExpanded={true}
            rightSlot={
              <Button type="button" variant="primary" size="sm" className="flex items-center gap-1" onClick={addPart}>
                <Plus className="w-4 h-4" />
                Add Part
              </Button>
            }
          >
            {selectedParts.length === 0 ? (
              <div className="text-center py-8 text-text-muted dark:text-text-secondary">
                <Info className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No parts added yet. Click &quot;Add Part&quot; to begin building your technique.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedParts.map((sp, idx) => (
                  <PowerPartCard
                    key={idx}
                    selectedPart={sp}
                    _index={idx}
                    onRemove={() => removePart(idx)}
                    onUpdate={(updates) => updatePart(idx, updates)}
                    allParts={techniqueParts}
                    showApplyDuration={false}
                  />
                ))}
              </div>
            )}
          </CollapsibleSection>

          {/* Additional Damage */}
          <CollapsibleSection
            title="Additional Damage"
            collapsedSummary={damageSummary}
            defaultExpanded={true}
            rightSlot={<SectionCostBadge en={damageSectionCost.energyRaw} tp={damageSectionCost.totalTP} />}
          >
            <p className="text-sm text-text-secondary mb-4">
              Add extra damage dice to your technique. The damage type matches the weapon&apos;s damage type.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <ValueStepper
                value={damage.amount}
                onChange={(v) => setDamage((d) => ({ ...d, amount: v }))}
                label="Dice:"
                min={0}
                max={20}
              />
              <div className="flex items-center gap-1">
                <span className="font-bold text-lg">d</span>
                <select
                  value={damage.size}
                  onChange={(e) => setDamage((d) => ({ ...d, size: parseInt(e.target.value) }))}
                  className="px-3 py-2 border border-border-light rounded-lg text-text-primary bg-surface"
                  aria-label="Damage die size"
                >
                  {DIE_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {damage.amount > 0 && (
              <p className="mt-2 text-sm text-text-secondary">
                Additional Damage: <strong>+{damage.amount}d{damage.size}</strong>
              </p>
            )}
          </CollapsibleSection>
    </CreatorPageShell>
  );
}

export default function TechniqueCreatorPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading..." padding="md" />}>
      <TechniqueCreatorContent />
    </Suspense>
  );
}
