/**
 * Power Creator Page
 * ==================
 * Tool for creating custom powers using the power parts system.
 * 
 * Features:
 * - Select power parts from Codex API (Prisma/Supabase)
 * - Configure option levels for each part
 * - Calculate energy and training point costs
 * - Save to user's library (Prisma)
 */

'use client';

import { useState, useMemo, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Wand2, Zap, Target, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePowerParts, useAdmin, useCreatorSave, useLoadModalLibrary, type PowerPart } from '@/hooks';
import { useAuthStore } from '@/stores';
import { LoginPromptModal, ConfirmActionModal } from '@/components/shared';
import { CreatorSaveToolbar, CreatorLayout } from '@/components/creator';
import { LoadingState, Checkbox, Button, Input, Textarea, Alert, PageContainer } from '@/components/ui';
import { LoadFromLibraryModal } from '@/components/creator/LoadFromLibraryModal';
import { SourceFilter } from '@/components/shared/filters/source-filter';
import { ValueStepper } from '@/components/shared';
import { CreatorSummaryPanel } from '@/components/creator';
import {
  calculatePowerCosts,
  computePowerActionTypeFromSelection,
  buildPowerMechanicParts,
  deriveRange,
  deriveArea,
  deriveDuration,
  type PowerPartPayload,
  type AreaConfig,
  type DurationConfig,
} from '@/lib/calculators';
import {
  ACTION_OPTIONS,
  POWER_DAMAGE_TYPES as DAMAGE_TYPES,
  DIE_SIZES,
  AREA_TYPES,
  DURATION_TYPES,
  DURATION_VALUES,
} from '@/lib/game/creator-constants';
import type { SelectedPart, AdvancedPart, DamageConfig, RangeConfig } from './power-creator-types';
import { POWER_CREATOR_CACHE_KEY, ADVANCED_CATEGORIES, EXCLUDED_PARTS } from './power-creator-constants';
import { PowerPartCard } from './PowerPartCard';
import { PowerAdvancedMechanicsSection } from './PowerAdvancedMechanics';

// =============================================================================
// Main Component
// =============================================================================

// Cache interface for localStorage
interface PowerCreatorCache {
  name: string;
  description: string;
  selectedParts: Array<{
    partId: string | number;
    op_1_lvl: number;
    op_2_lvl: number;
    op_3_lvl: number;
    applyDuration: boolean;
    selectedCategory: string;
  }>;
  selectedAdvancedParts: Array<{
    partId: string | number;
    op_1_lvl: number;
    op_2_lvl: number;
    op_3_lvl: number;
    applyDuration: boolean;
  }>;
  actionType: string;
  isReaction: boolean;
  damage: DamageConfig;
  range: RangeConfig;
  area: AreaConfig;
  duration: DurationConfig;
  timestamp: number;
}

function PowerCreatorContent() {
  const { user } = useAuthStore();
  const { isAdmin } = useAdmin();
  const searchParams = useSearchParams();
  const editPowerId = searchParams.get('edit');
  
  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedParts, setSelectedParts] = useState<SelectedPart[]>([]);
  const [selectedAdvancedParts, setSelectedAdvancedParts] = useState<AdvancedPart[]>([]);
  const [actionType, setActionType] = useState('basic');
  const [isReaction, setIsReaction] = useState(false);
  const [damage, setDamage] = useState<DamageConfig>({ amount: 0, size: 6, type: 'none' });
  // Range state (0 = melee/1 space, 1+ = ranged increments)
  const [range, setRange] = useState<RangeConfig>({ steps: 0 });
  // Area of effect state
  const [area, setArea] = useState<AreaConfig>({ type: 'none', level: 1, applyDuration: false });
  // Duration state
  const [duration, setDuration] = useState<DurationConfig>({
    type: 'instant',
    value: 1,
    applyDuration: false,
    focus: false,
    noHarm: false,
    endsOnActivation: false,
    sustain: 0,
  });
  const load = useLoadModalLibrary('power');

  // Fetch power parts
  const { data: powerParts = [], isLoading, error } = usePowerParts();

  // Load cached state from localStorage on mount
  useEffect(() => {
    // Prevent re-running after initial load to avoid overwriting user input
    if (isInitialized || powerParts.length === 0) return;
    
    try {
      const cached = localStorage.getItem(POWER_CREATOR_CACHE_KEY);
      if (cached) {
        const parsed: PowerCreatorCache = JSON.parse(cached);
        // Only use cache if it's less than 30 days old
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        if (Date.now() - parsed.timestamp < thirtyDays) {
          setName(parsed.name || '');
          setDescription(parsed.description || '');
          setActionType(parsed.actionType || 'basic');
          setIsReaction(parsed.isReaction || false);
          setDamage(parsed.damage || { amount: 0, size: 6, type: 'none' });
          setRange(parsed.range || { steps: 0 });
          setArea(parsed.area || { type: 'none', level: 1, applyDuration: false });
          setDuration(parsed.duration || {
            type: 'instant',
            value: 1,
            applyDuration: false,
            focus: false,
            noHarm: false,
            endsOnActivation: false,
            sustain: 0,
          });
          
          // Restore selected parts by finding them in powerParts
          if (parsed.selectedParts && parsed.selectedParts.length > 0) {
            const restoredParts: SelectedPart[] = [];
            for (const savedPart of parsed.selectedParts) {
              const foundPart = powerParts.find((p: PowerPart) => String(p.id) === String(savedPart.partId));
              if (foundPart) {
                restoredParts.push({
                  part: foundPart,
                  op_1_lvl: savedPart.op_1_lvl,
                  op_2_lvl: savedPart.op_2_lvl,
                  op_3_lvl: savedPart.op_3_lvl,
                  applyDuration: savedPart.applyDuration,
                  selectedCategory: savedPart.selectedCategory,
                });
              }
            }
            setSelectedParts(restoredParts);
          }
          
          // Restore advanced parts
          if (parsed.selectedAdvancedParts && parsed.selectedAdvancedParts.length > 0) {
            const restoredAdvanced: AdvancedPart[] = [];
            for (const savedPart of parsed.selectedAdvancedParts) {
              const foundPart = powerParts.find((p: PowerPart) => String(p.id) === String(savedPart.partId));
              if (foundPart) {
                restoredAdvanced.push({
                  part: foundPart,
                  op_1_lvl: savedPart.op_1_lvl,
                  op_2_lvl: savedPart.op_2_lvl,
                  op_3_lvl: savedPart.op_3_lvl,
                  applyDuration: savedPart.applyDuration,
                });
              }
            }
            setSelectedAdvancedParts(restoredAdvanced);
          }
        } else {
          localStorage.removeItem(POWER_CREATOR_CACHE_KEY);
        }
      }
    } catch (e) {
      console.error('Failed to load power creator cache:', e);
    }
    setIsInitialized(true);
  }, [powerParts, isInitialized]);

  // Auto-save to localStorage when state changes
  useEffect(() => {
    if (!isInitialized) return;
    
    try {
      const cache: PowerCreatorCache = {
        name,
        description,
        selectedParts: selectedParts.map(sp => ({
          partId: sp.part.id,
          op_1_lvl: sp.op_1_lvl,
          op_2_lvl: sp.op_2_lvl,
          op_3_lvl: sp.op_3_lvl,
          applyDuration: sp.applyDuration,
          selectedCategory: sp.selectedCategory,
        })),
        selectedAdvancedParts: selectedAdvancedParts.map(ap => ({
          partId: ap.part.id,
          op_1_lvl: ap.op_1_lvl,
          op_2_lvl: ap.op_2_lvl,
          op_3_lvl: ap.op_3_lvl,
          applyDuration: ap.applyDuration,
        })),
        actionType,
        isReaction,
        damage,
        range,
        area,
        duration,
        timestamp: Date.now(),
      };
      localStorage.setItem(POWER_CREATOR_CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
      console.error('Failed to save power creator cache:', e);
    }
  }, [isInitialized, name, description, selectedParts, selectedAdvancedParts, actionType, isReaction, damage, range, area, duration]);

  // Filter out mechanic parts for the "Add Part" dropdown
  // Mechanic parts are handled by basic mechanics UI (action, damage, range, area, duration)
  // or the Advanced Mechanics section
  const nonMechanicParts = useMemo(
    () => powerParts.filter((p: PowerPart) => !p.mechanic),
    [powerParts]
  );

  // Build mechanic parts using unified builder
  const mechanicParts = useMemo(
    () => buildPowerMechanicParts({
      actionTypeSelection: actionType,
      reaction: isReaction,
      damageType: damage.type,
      diceAmt: damage.amount,
      dieSize: damage.size,
      range: range.steps,
      areaType: area.type,
      areaLevel: area.level,
      areaApplyDuration: area.applyDuration,
      durationType: duration.type,
      durationValue: duration.value,
      durationApplyDuration: duration.applyDuration,
      focus: duration.focus,
      noHarm: duration.noHarm,
      endsOnActivation: duration.endsOnActivation,
      sustain: duration.sustain,
      partsDb: powerParts,
    }),
    [actionType, isReaction, damage, range, area, duration, powerParts]
  );

  // Convert selected parts to payload format for calculator
  const partsPayload: PowerPartPayload[] = useMemo(
    () => [
      // Regular parts
      ...selectedParts.map((sp) => ({
        part: sp.part,
        op_1_lvl: sp.op_1_lvl,
        op_2_lvl: sp.op_2_lvl,
        op_3_lvl: sp.op_3_lvl,
        applyDuration: sp.applyDuration,
      })),
      // Advanced mechanic parts
      ...selectedAdvancedParts.map((ap) => ({
        part: ap.part,
        op_1_lvl: ap.op_1_lvl,
        op_2_lvl: ap.op_2_lvl,
        op_3_lvl: ap.op_3_lvl,
        applyDuration: ap.applyDuration,
      })),
      // Auto-generated mechanic parts from action type / damage selections
      ...mechanicParts,
    ],
    [selectedParts, selectedAdvancedParts, mechanicParts]
  );

  // Calculate costs
  const costs = useMemo(
    () => calculatePowerCosts(partsPayload, powerParts),
    [partsPayload, powerParts]
  );

  // Derived display values
  const actionTypeDisplay = useMemo(
    () => computePowerActionTypeFromSelection(actionType, isReaction),
    [actionType, isReaction]
  );

  const rangeDisplay = useMemo(() => deriveRange(partsPayload, powerParts), [partsPayload, powerParts]);
  const areaDisplay = useMemo(() => deriveArea(partsPayload, powerParts), [partsPayload, powerParts]);
  const durationDisplay = useMemo(() => deriveDuration(partsPayload, powerParts), [partsPayload, powerParts]);

  // Actions
  const addPart = useCallback(() => {
    if (nonMechanicParts.length === 0) return;
    setSelectedParts((prev) => [
      ...prev,
      {
        part: nonMechanicParts[0],
        op_1_lvl: 0,
        op_2_lvl: 0,
        op_3_lvl: 0,
        applyDuration: false,
        selectedCategory: 'any',
      },
    ]);
  }, [nonMechanicParts]);

  const removePart = useCallback((index: number) => {
    setSelectedParts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updatePart = useCallback((index: number, updates: Partial<SelectedPart>) => {
    setSelectedParts((prev) =>
      prev.map((sp, i) => (i === index ? { ...sp, ...updates } : sp))
    );
  }, []);

  // Advanced part actions
  const addAdvancedPart = useCallback((part: PowerPart) => {
    // Don't add if already selected
    if (selectedAdvancedParts.some((ap) => ap.part.id === part.id)) {
      return;
    }
    setSelectedAdvancedParts((prev) => [
      ...prev,
      { part, op_1_lvl: 0, op_2_lvl: 0, op_3_lvl: 0, applyDuration: false },
    ]);
  }, [selectedAdvancedParts]);

  const removeAdvancedPart = useCallback((index: number) => {
    setSelectedAdvancedParts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateAdvancedPart = useCallback((index: number, updates: Partial<AdvancedPart>) => {
    setSelectedAdvancedParts((prev) =>
      prev.map((ap, i) => (i === index ? { ...ap, ...updates } : ap))
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
        applyDuration: sp.applyDuration,
      })),
      ...selectedAdvancedParts.map((ap) => ({
        id: Number(ap.part.id),
        name: ap.part.name,
        op_1_lvl: ap.op_1_lvl,
        op_2_lvl: ap.op_2_lvl,
        op_3_lvl: ap.op_3_lvl,
        applyDuration: ap.applyDuration,
        isAdvanced: true,
      })),
      ...mechanicParts.map((mp) => ({
        id: mp.id,
        name: mp.name,
        op_1_lvl: mp.op_1_lvl,
        op_2_lvl: mp.op_2_lvl,
        op_3_lvl: mp.op_3_lvl,
        applyDuration: mp.applyDuration,
        isMechanic: true,
      })),
    ];
    const damageToSave =
      damage.type !== 'none' && damage.amount > 0
        ? [{ amount: damage.amount, size: damage.size, type: damage.type }]
        : [];
    return {
      name: name.trim(),
      data: {
        name: name.trim(),
        description: description.trim(),
        parts: partsToSave,
        damage: damageToSave,
        actionType,
        isReaction,
        range,
        area,
        duration,
      },
    };
  }, [name, description, selectedParts, selectedAdvancedParts, mechanicParts, damage, actionType, isReaction, range, area, duration]);

  const save = useCreatorSave({
    type: 'powers',
    getPayload,
    requirePublishConfirm: true,
    publishConfirmTitle: 'Publish to Public Library',
    publishConfirmDescription: (n) => `Are you sure you wish to publish this power "${n}" to the public library? All users will be able to see and use it.`,
    successMessage: 'Power saved successfully!',
    publicSuccessMessage: 'Power saved to public library!',
    onSaveSuccess: () => {
      setName('');
      setDescription('');
      setSelectedParts([]);
      setSelectedAdvancedParts([]);
      setActionType('basic');
      setIsReaction(false);
      setDamage({ amount: 0, size: 6, type: 'none' });
      setRange({ steps: 0 });
      setArea({ type: 'none', level: 1, applyDuration: false });
      setDuration({
        type: 'instant',
        value: 1,
        applyDuration: false,
        focus: false,
        noHarm: false,
        endsOnActivation: false,
        sustain: 0,
      });
    },
  });

  const handleSave = useCallback(async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    await save.handleSave();
  }, [user, save]);

  const handleReset = useCallback(() => {
    setName('');
    setDescription('');
    setSelectedParts([]);
    setSelectedAdvancedParts([]);
    setActionType('basic');
    setIsReaction(false);
    setDamage({ amount: 0, size: 6, type: 'none' });
    setRange({ steps: 0 });
    setArea({ type: 'none', level: 1, applyDuration: false });
    setDuration({
      type: 'instant',
      value: 1,
      applyDuration: false,
      focus: false,
      noHarm: false,
      endsOnActivation: false,
      sustain: 0,
    });
    save.setSaveMessage(null);
    // Clear localStorage cache
    try {
      localStorage.removeItem(POWER_CREATOR_CACHE_KEY);
    } catch (e) {
      console.error('Failed to clear power creator cache:', e);
    }
  }, [save]);

  // Load a power from the library
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLoadPower = useCallback((power: any) => {
    // Reset all state first to avoid corruption from any existing edits
    handleReset();
    // Set name and description
    setName(power.name || '');
    setDescription(power.description || '');
    
    // Load parts - the data structure from Prisma may vary
    const savedParts = (power.parts || power.powerParts || []) as Array<{
      id?: number | string;
      name?: string;
      op_1_lvl?: number;
      op_2_lvl?: number;
      op_3_lvl?: number;
      applyDuration?: boolean;
      isAdvanced?: boolean;
    }>;
    
    const loadedParts: SelectedPart[] = [];
    const loadedAdvancedParts: AdvancedPart[] = [];
    
    for (const savedPart of savedParts) {
      // Find the matching part in powerParts by id or name
      const matchedPart = powerParts.find(
        (p: PowerPart) => p.id === String(savedPart.id) || p.name === savedPart.name
      );
      
      if (matchedPart) {
        // Skip parts that are handled by basic mechanics UI
        // (these are now auto-generated from actionType, damage, range, area, duration)
        if (EXCLUDED_PARTS.has(matchedPart.name)) {
          continue;
        }
        
        const partData = {
          part: matchedPart,
          op_1_lvl: savedPart.op_1_lvl || 0,
          op_2_lvl: savedPart.op_2_lvl || 0,
          op_3_lvl: savedPart.op_3_lvl || 0,
          applyDuration: savedPart.applyDuration || false,
        };
        
        // Check if it's an advanced mechanic part
        if (savedPart.isAdvanced || (matchedPart.mechanic && ADVANCED_CATEGORIES.includes(matchedPart.category as typeof ADVANCED_CATEGORIES[number]))) {
          loadedAdvancedParts.push(partData);
        } else if (!matchedPart.mechanic) {
          // Only add non-mechanic parts to regular parts section
          loadedParts.push({
            ...partData,
            selectedCategory: matchedPart.category || 'any',
          });
        }
      }
    }
    setSelectedParts(loadedParts);
    setSelectedAdvancedParts(loadedAdvancedParts);
    
    // Load damage - handle both array and object formats
    let damageData: Array<{ amount?: number; size?: number; type?: string }> = [];
    if (Array.isArray(power.damage)) {
      damageData = power.damage;
    } else if (power.damage && typeof power.damage === 'object') {
      // Convert object format to array
      damageData = [{
        amount: power.damage.dice || power.damage.amount || 0,
        size: power.damage.sides || power.damage.size || 6,
        type: power.damage.type || 'none',
      }];
    }
    
    if (damageData.length > 0) {
      const dmg = damageData[0];
      setDamage({
        amount: dmg.amount || 0,
        size: dmg.size || 6,
        type: dmg.type || 'none',
      });
    } else {
      setDamage({ amount: 0, size: 6, type: 'none' });
    }
    
    // Load action type and reaction
    setActionType(power.actionType || 'basic');
    setIsReaction(power.isReaction || false);
    
    // Load range
    if (power.range) {
      setRange({
        steps: power.range.steps || 0,
      });
    } else {
      setRange({ steps: 0 });
    }
    
    // Load area of effect
    if (power.area) {
      setArea({
        type: power.area.type || 'none',
        level: power.area.level || 1,
        applyDuration: power.area.applyDuration || false,
      });
    } else {
      setArea({ type: 'none', level: 1, applyDuration: false });
    }
    
    // Load duration
    if (power.duration) {
      setDuration({
        type: power.duration.type || 'instant',
        value: power.duration.value || 1,
        applyDuration: power.duration.applyDuration || false,
        focus: power.duration.focus || false,
        noHarm: power.duration.noHarm || false,
        endsOnActivation: power.duration.endsOnActivation || false,
        sustain: power.duration.sustain || 0,
      });
    } else {
      setDuration({
        type: 'instant',
        value: 1,
        applyDuration: false,
        focus: false,
        noHarm: false,
        endsOnActivation: false,
        sustain: 0,
      });
    }
    
    save.setSaveMessage({ type: 'success', text: 'Power loaded successfully!' });
    setTimeout(() => save.setSaveMessage(null), 2000);
  }, [powerParts, handleReset, save]);

  // Load power for editing from URL parameter (?edit=<id>)
  useEffect(() => {
    if (!editPowerId || !load.rawItems.length || powerParts.length === 0 || isInitialized) return;
    const powerToEdit = load.rawItems.find(
      (p: { docId?: string; id?: string }) => String(p.docId) === editPowerId || String(p.id) === editPowerId
    ) as Parameters<typeof handleLoadPower>[0] | undefined;
    if (!powerToEdit) {
      console.warn(`Power with ID ${editPowerId} not found in library`);
      setIsInitialized(true);
      return;
    }
    handleLoadPower(powerToEdit);
    localStorage.removeItem(POWER_CREATOR_CACHE_KEY);
    setIsInitialized(true);
  }, [editPowerId, load.rawItems, powerParts, isInitialized, handleLoadPower]);

  if (isLoading) {
    return (
      <PageContainer size="xl">
        <LoadingState message="Loading power parts..." />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer size="xl">
        <Alert variant="danger">
          Failed to load power parts: {error.message}
        </Alert>
      </PageContainer>
    );
  }

  return (
    <CreatorLayout
      icon={<Wand2 className="w-8 h-8 text-primary-600" />}
      title="Power Creator"
      description="Design custom powers by combining power parts. Each part contributes to the total energy cost and training point requirements."
      actions={
        <CreatorSaveToolbar
          saveTarget={save.saveTarget}
          onSaveTargetChange={save.setSaveTarget}
          onSave={handleSave}
          onLoad={() => (user ? load.openLoadModal() : setShowLoginPrompt(true))}
          onReset={handleReset}
          saving={save.saving}
          saveDisabled={!name.trim()}
          showPublicPrivate={isAdmin}
          user={user}
        />
      }
      sidebar={
        <div className="self-start sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto space-y-6">
          <CreatorSummaryPanel
            title="Power Summary"
            costStats={[
              { label: 'Energy Cost', value: costs.totalEnergy, icon: <Zap className="w-6 h-6" />, color: 'energy' },
              { label: 'Training Points', value: costs.totalTP, icon: <Target className="w-6 h-6" />, color: 'tp' },
            ]}
            statRows={[
              { label: 'Action', value: actionTypeDisplay },
              { label: 'Range', value: rangeDisplay },
              { label: 'Area', value: areaDisplay },
              { label: 'Duration', value: durationDisplay },
            ]}
            breakdowns={costs.tpSources.length > 0 ? [
              { title: 'TP Breakdown', items: costs.tpSources }
            ] : undefined}
          >
            {save.saveMessage && (
              <Alert 
                variant={save.saveMessage.type === 'success' ? 'success' : 'danger'}
              >
                {save.saveMessage.text}
              </Alert>
            )}
          </CreatorSummaryPanel>
        </div>
      }
      modals={
        <>
          <LoadFromLibraryModal
            isOpen={load.showLoadModal}
            onClose={load.closeLoadModal}
            selectableItems={load.selectableItems}
            columns={load.columns}
            gridColumns={load.gridColumns}
            headerExtra={<SourceFilter value={load.source} onChange={load.setSource} />}
            emptyMessage={load.emptyMessage}
            emptySubMessage={load.emptySubMessage}
            searchPlaceholder="Search powers..."
            isLoading={load.isLoading}
            error={load.error}
            title="Load Power from Library"
            onSelect={(selected) => handleLoadPower(selected.data as Parameters<typeof handleLoadPower>[0])}
          />
          <LoginPromptModal
            isOpen={showLoginPrompt}
            onClose={() => setShowLoginPrompt(false)}
            returnPath="/power-creator"
            contentType="power"
          />
          <ConfirmActionModal
            isOpen={save.showPublishConfirm}
            onClose={() => save.setShowPublishConfirm(false)}
            onConfirm={() => save.confirmPublish()}
            title={save.publishConfirmTitle}
            description={save.publishConfirmDescription?.(name.trim()) ?? ''}
            confirmLabel="Publish"
            icon="publish"
          />
        </>
      }
    >
      {/* Main Editor */}
          {/* Name & Description */}
          <div className="bg-surface rounded-xl shadow-md p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Power Name *
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter power name..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Description
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what your power does..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Action Type */}
          <div className="bg-surface rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Action Type</h3>
            <div className="flex flex-wrap gap-4">
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="px-4 py-2 border border-border-light rounded-lg text-text-primary bg-surface"
              >
                {ACTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <Checkbox
                  checked={isReaction}
                  onChange={(e) => setIsReaction(e.target.checked)}
                  label="Reaction"
                />
            </div>
          </div>

          {/* Range */}
          <div className="bg-surface rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Range</h3>
            <div className="flex flex-wrap items-center gap-4">
              <ValueStepper
                value={range.steps}
                onChange={(v) => setRange((r) => ({ ...r, steps: v }))}
                label="Range:"
                min={0}
                max={10}
              />
              <span className="text-sm text-text-secondary">
                {range.steps === 0 ? '(1 Space / Melee)' : `(${range.steps * 3} spaces)`}
              </span>
            </div>
          </div>

          {/* Area of Effect */}
          <div className="bg-surface rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Area of Effect</h3>
            <div className="flex flex-wrap items-center gap-4">
              <select
                value={area.type}
                onChange={(e) => setArea((a) => ({ ...a, type: e.target.value as AreaConfig['type'] }))}
                className="px-4 py-2 border border-border-light rounded-lg text-text-primary bg-surface"
              >
                {AREA_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {area.type !== 'none' && (
                <>
                  <ValueStepper
                    value={area.level}
                    onChange={(v) => setArea((a) => ({ ...a, level: v }))}
                    label="Level:"
                    min={1}
                    max={10}
                  />
                  <Checkbox
                      checked={area.applyDuration || false}
                      onChange={(e) => setArea((a) => ({ ...a, applyDuration: e.target.checked }))}
                      label="Apply Duration"
                    />
                </>
              )}
            </div>
          </div>

          {/* Duration */}
          <div className="bg-surface rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Duration</h3>
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <select
                value={duration.type}
                onChange={(e) => {
                  const newType = e.target.value as DurationConfig['type'];
                  // Reset value to first option when changing type
                  const newValue = DURATION_VALUES[newType]?.[0]?.value || 1;
                  // Clear duration modifiers if duration is less than 2 rounds
                  const isShortDuration = newType === 'instant' || (newType === 'rounds' && newValue === 1);
                  if (isShortDuration) {
                    setDuration({
                      type: newType,
                      value: newValue,
                      applyDuration: false,
                      focus: false,
                      noHarm: false,
                      endsOnActivation: false,
                      sustain: 0,
                    });
                  } else {
                    setDuration((d) => ({ ...d, type: newType, value: newValue }));
                  }
                }}
                className="px-4 py-2 border border-border-light rounded-lg text-text-primary bg-surface"
              >
                {DURATION_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {duration.type !== 'instant' && duration.type !== 'permanent' && DURATION_VALUES[duration.type] && (
                <select
                  value={duration.value}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value);
                    // Clear duration modifiers if duration becomes 1 round
                    if (duration.type === 'rounds' && newValue === 1) {
                      setDuration({
                        type: duration.type,
                        value: newValue,
                        applyDuration: duration.applyDuration ?? false,
                        focus: false,
                        noHarm: false,
                        endsOnActivation: false,
                        sustain: 0,
                      });
                    } else {
                      setDuration((d) => ({ ...d, value: newValue }));
                    }
                  }}
                  className="px-4 py-2 border border-border-light rounded-lg text-text-primary bg-surface"
                >
                  {DURATION_VALUES[duration.type].map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {/* Apply Duration + Duration Modifiers - only enabled for durations of 2+ rounds */}
            {(() => {
              const isShortDuration = duration.type === 'instant' || (duration.type === 'rounds' && duration.value === 1);
              return (
                <div className={cn(
                  'flex flex-wrap items-center gap-4 pt-3 border-t border-border-light',
                  isShortDuration && 'opacity-50'
                )}>
                  <Checkbox
                    checked={duration.applyDuration || false}
                    onChange={(e) => setDuration((d) => ({ ...d, applyDuration: e.target.checked }))}
                    label="Apply Duration"
                    disabled={isShortDuration}
                  />
                  <Checkbox
                    checked={duration.focus || false}
                    onChange={(e) => setDuration((d) => ({ ...d, focus: e.target.checked }))}
                    label="Focus"
                    disabled={isShortDuration}
                  />
                  <Checkbox
                    checked={duration.noHarm || false}
                    onChange={(e) => setDuration((d) => ({ ...d, noHarm: e.target.checked }))}
                    label="No Harm or Adaptation Parts"
                    disabled={isShortDuration}
                  />
                  <Checkbox
                    checked={duration.endsOnActivation || false}
                    onChange={(e) => setDuration((d) => ({ ...d, endsOnActivation: e.target.checked }))}
                    label="Ends on Activation"
                    disabled={isShortDuration}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Sustain:</span>
                    <select
                      value={duration.sustain || 0}
                      onChange={(e) => setDuration((d) => ({ ...d, sustain: parseInt(e.target.value) }))}
                      className="px-2 py-1 border border-border-light rounded text-sm text-text-primary bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isShortDuration}
                    >
                      <option value={0}>None</option>
                      <option value={1}>1 AP</option>
                      <option value={2}>2 AP</option>
                      <option value={3}>3 AP</option>
                      <option value={4}>4 AP</option>
                    </select>
                  </div>
                  {isShortDuration && (
                    <span className="text-xs text-text-muted italic">
                      (Requires 2+ rounds)
                    </span>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Power Parts */}
          <div className="bg-surface rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text-primary">
                Power Parts ({selectedParts.length})
              </h3>
              <Button
                type="button"
                variant="primary"
                className="flex items-center gap-1"
                onClick={addPart}
              >
                <Plus className="w-4 h-4" />
                Add Part
              </Button>
            </div>

            {selectedParts.length === 0 ? (
              <div className="text-center py-8 text-text-muted">
                <Info className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No parts added yet. Click &quot;Add Part&quot; to begin building your power.</p>
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
                    allParts={nonMechanicParts}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Advanced Power Mechanics */}
          <PowerAdvancedMechanicsSection
            powerParts={powerParts}
            selectedAdvancedParts={selectedAdvancedParts}
            onAdd={addAdvancedPart}
            onRemove={removeAdvancedPart}
            onUpdate={updateAdvancedPart}
          />

          {/* Damage (Optional) */}
          <div className="bg-surface rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Damage (Optional)</h3>
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
                >
                  {DIE_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
              <select
                value={damage.type}
                onChange={(e) => setDamage((d) => ({ ...d, type: e.target.value }))}
                className="px-3 py-2 border border-border-light rounded-lg"
              >
                {DAMAGE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type === 'none' ? 'No damage' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            {damage.type !== 'none' && damage.amount > 0 && (
              <p className="mt-2 text-sm text-text-secondary">
                Damage: <strong>{damage.amount}d{damage.size} {damage.type}</strong>
              </p>
            )}
          </div>
    </CreatorLayout>
  );
}

export default function PowerCreatorPage() {
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
        <PowerCreatorContent />
      </Suspense>
    </div>
  );
}
