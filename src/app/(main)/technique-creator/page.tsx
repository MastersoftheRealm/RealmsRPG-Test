/**
 * Technique Creator Page
 * ======================
 * Tool for creating custom martial techniques using the technique parts system.
 * 
 * Features:
 * - Select technique parts from RTDB database
 * - Configure option levels for each part
 * - Calculate energy and training point costs
 * - Save to user's library (Prisma)
 */

'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { X, Plus, ChevronDown, ChevronUp, Swords, Zap, Target, Info, FolderOpen } from 'lucide-react';
import { saveToLibrary, saveToPublicLibrary, findLibraryItemByName } from '@/services/library-service';
import { cn } from '@/lib/utils';
import { useTechniqueParts, useUserTechniques, useUserItems, useAdmin, type TechniquePart } from '@/hooks';
import { useAuthStore } from '@/stores';
import { LoginPromptModal } from '@/components/shared';
import { LoadingState, IconButton, Checkbox, Button, Input, Textarea, Alert, PageContainer, PageHeader } from '@/components/ui';
import { LoadFromLibraryModal } from '@/components/creator/LoadFromLibraryModal';
import { NumberStepper } from '@/components/creator/number-stepper';
import { CreatorSummaryPanel } from '@/components/creator';
import {
  calculateTechniqueCosts,
  computeTechniqueActionTypeFromSelection,
  buildMechanicPartPayload,
  formatTechniqueDamage,
  type TechniquePartPayload,
} from '@/lib/calculators';

// =============================================================================
// Types
// =============================================================================

interface SelectedPart {
  part: TechniquePart;
  op_1_lvl: number;
  op_2_lvl: number;
  op_3_lvl: number;
  selectedCategory: string;
}

interface DamageConfig {
  amount: number;
  size: number;
  type: string;
}

interface WeaponConfig {
  id: number | string;
  name: string;
  tp?: number; // Training points for weapon scaling
  isUserWeapon?: boolean; // Whether this is a user-created weapon
}

// =============================================================================
// Shared Constants (imported from central location)
// =============================================================================

import {
  ACTION_OPTIONS,
  DIE_SIZES,
  CREATOR_CACHE_KEYS,
  formatCost,
} from '@/lib/game/creator-constants';

// LocalStorage key for caching technique creator state
const TECHNIQUE_CREATOR_CACHE_KEY = CREATOR_CACHE_KEYS.TECHNIQUE;

// Default weapon options (always available)
const DEFAULT_WEAPON_OPTIONS: WeaponConfig[] = [
  { id: 0, name: 'Unarmed Prowess', tp: 0 },
];

// =============================================================================
// Subcomponents
// =============================================================================

function PartCard({
  selectedPart,
  _index,
  onRemove,
  onUpdate,
  allParts,
}: {
  selectedPart: SelectedPart;
  _index: number;
  onRemove: () => void;
  onUpdate: (updates: Partial<SelectedPart>) => void;
  allParts: TechniquePart[];
}) {
  const [expanded, setExpanded] = useState(true);
  const { part } = selectedPart;

  // Get categories from all parts
  const categories = useMemo(() => {
    const cats = new Set(allParts.map((p) => p.category));
    return ['any', ...Array.from(cats).sort()];
  }, [allParts]);

  // Filter parts by selected category
  const filteredParts = useMemo(() => {
    const cat = selectedPart.selectedCategory;
    if (!cat || cat === 'any') return allParts.sort((a, b) => a.name.localeCompare(b.name));
    return allParts.filter((p) => p.category === cat).sort((a, b) => a.name.localeCompare(b.name));
  }, [allParts, selectedPart.selectedCategory]);

  // Check which options have content
  const hasOption = (n: 1 | 2 | 3) => {
    const desc = part[`op_${n}_desc` as keyof TechniquePart] as string | undefined;
    const en = part[`op_${n}_en` as keyof TechniquePart] as number | undefined;
    const tp = part[`op_${n}_tp` as keyof TechniquePart] as number | undefined;
    return (desc && desc.trim() !== '') || (en !== undefined && en !== 0) || (tp !== undefined && tp !== 0);
  };

  // Calculate part's individual contribution
  const partEnergy =
    (part.base_en || 0) +
    (part.op_1_en || 0) * selectedPart.op_1_lvl +
    (part.op_2_en || 0) * selectedPart.op_2_lvl +
    (part.op_3_en || 0) * selectedPart.op_3_lvl;

  const partTP =
    (part.base_tp || 0) +
    (part.op_1_tp || 0) * selectedPart.op_1_lvl +
    (part.op_2_tp || 0) * selectedPart.op_2_lvl +
    (part.op_3_tp || 0) * selectedPart.op_3_lvl;

  return (
    <div className="bg-surface rounded-lg border border-border-light shadow-sm overflow-hidden">
      {/* Header - entire header clickable except X button */}
      <div className="bg-surface-alt px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left hover:bg-surface-alt/80 -ml-2 pl-2 py-1 rounded transition-colors"
        >
          <span className="text-text-muted">
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </span>
          <span className="font-medium text-text-primary truncate">{part.name}</span>
          <span className="flex items-center gap-2 text-sm font-semibold flex-shrink-0">
            <span className="text-red-600">EN: {formatCost(partEnergy)}</span>
            <span className="text-tp">TP: {formatCost(partTP)}</span>
          </span>
        </button>
        <IconButton
          onClick={onRemove}
          label="Remove part"
          variant="danger"
          size="sm"
        >
          <X className="w-5 h-5" />
        </IconButton>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 py-4 space-y-4">
          {/* Category and Part Selection */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Category
              </label>
              <select
                value={selectedPart.selectedCategory}
                onChange={(e) => {
                  const newCategory = e.target.value;
                  // Get parts for the new category
                  const partsInCategory = newCategory === 'any' 
                    ? allParts.sort((a, b) => a.name.localeCompare(b.name))
                    : allParts.filter((p) => p.category === newCategory).sort((a, b) => a.name.localeCompare(b.name));
                  // Auto-select first alphabetical part in the new category
                  const firstPart = partsInCategory[0];
                  if (firstPart) {
                    onUpdate({
                      selectedCategory: newCategory,
                      part: firstPart,
                      op_1_lvl: 0,
                    });
                  } else {
                    onUpdate({ selectedCategory: newCategory });
                  }
                }}
                className="w-full px-3 py-2 border border-border-light rounded-lg text-sm"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'any' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Part
              </label>
              <select
                value={filteredParts.findIndex((p) => p.id === part.id)}
                onChange={(e) => {
                  const idx = parseInt(e.target.value);
                  const newPart = filteredParts[idx];
                  if (newPart) {
                    onUpdate({
                      part: newPart,
                      op_1_lvl: 0,
                      op_2_lvl: 0,
                      op_3_lvl: 0,
                    });
                  }
                }}
                className="w-full px-3 py-2 border border-border-light rounded-lg text-sm"
              >
                {filteredParts.map((p, idx) => (
                  <option key={p.id} value={idx}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <p className="text-base text-text-primary leading-relaxed">{part.description}</p>

          {/* Base Values */}
          <div className="flex gap-4 text-sm">
            <span className="text-text-secondary">
              Base Energy: <strong className="text-red-600">{formatCost(part.base_en || 0)}</strong>
            </span>
            <span className="text-text-secondary">
              Base TP: <strong className="text-tp">{formatCost(part.base_tp || 0)}</strong>
            </span>
          </div>

          {/* Options */}
          {(hasOption(1) || hasOption(2) || hasOption(3)) && (
            <div className="space-y-3 pt-2 border-t border-border-light">
              {hasOption(1) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-red-800">Option 1</span>
                      <span className="text-sm font-medium text-red-600">
                        EN {(part.op_1_en || 0) >= 0 ? '+' : ''}{formatCost(part.op_1_en || 0)}
                      </span>
                      <span className="text-sm font-medium text-tp">
                        TP {(part.op_1_tp || 0) >= 0 ? '+' : ''}{formatCost(part.op_1_tp || 0)}
                      </span>
                    </div>
                    <NumberStepper
                      value={selectedPart.op_1_lvl}
                      onChange={(v) => onUpdate({ op_1_lvl: v })}
                      label="Level:"
                    />
                  </div>
                  {part.op_1_desc && (
                    <p className="text-sm text-text-primary">{part.op_1_desc}</p>
                  )}
                </div>
              )}

              {hasOption(2) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-red-800">Option 2</span>
                      <span className="text-sm font-medium text-red-600">
                        EN {(part.op_2_en || 0) >= 0 ? '+' : ''}{formatCost(part.op_2_en || 0)}
                      </span>
                      <span className="text-sm font-medium text-tp">
                        TP {(part.op_2_tp || 0) >= 0 ? '+' : ''}{formatCost(part.op_2_tp || 0)}
                      </span>
                    </div>
                    <NumberStepper
                      value={selectedPart.op_2_lvl}
                      onChange={(v) => onUpdate({ op_2_lvl: v })}
                      label="Level:"
                    />
                  </div>
                  {part.op_2_desc && (
                    <p className="text-sm text-text-primary">{part.op_2_desc}</p>
                  )}
                </div>
              )}

              {hasOption(3) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-red-800">Option 3</span>
                      <span className="text-sm font-medium text-red-600">
                        EN {(part.op_3_en || 0) >= 0 ? '+' : ''}{formatCost(part.op_3_en || 0)}
                      </span>
                      <span className="text-sm font-medium text-tp">
                        TP {(part.op_3_tp || 0) >= 0 ? '+' : ''}{formatCost(part.op_3_tp || 0)}
                      </span>
                    </div>
                    <NumberStepper
                      value={selectedPart.op_3_lvl}
                      onChange={(v) => onUpdate({ op_3_lvl: v })}
                      label="Level:"
                    />
                  </div>
                  {part.op_3_desc && (
                    <p className="text-sm text-text-primary">{part.op_3_desc}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

// Cache interface for localStorage
interface TechniqueCreatorCache {
  name: string;
  description: string;
  selectedParts: Array<{
    partId: string | number;
    op_1_lvl: number;
    op_2_lvl: number;
    op_3_lvl: number;
    selectedCategory: string;
  }>;
  actionType: string;
  isReaction: boolean;
  damage: DamageConfig;
  weaponId: string | number;
  timestamp: number;
}

function TechniqueCreatorContent() {
  const { user } = useAuthStore();
  const { isAdmin } = useAdmin();
  
  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedParts, setSelectedParts] = useState<SelectedPart[]>([]);
  const [actionType, setActionType] = useState('basic');
  const [isReaction, setIsReaction] = useState(false);
  const [damage, setDamage] = useState<DamageConfig>({ amount: 0, size: 6, type: 'none' });
  const [weapon, setWeapon] = useState<WeaponConfig>(DEFAULT_WEAPON_OPTIONS[0]);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saveTarget, setSaveTarget] = useState<'private' | 'public'>('private');
  const [showLoadModal, setShowLoadModal] = useState(false);

  // Fetch technique parts
  const { data: techniqueParts = [], isLoading, error } = useTechniqueParts();
  
  // Fetch user's saved techniques for loading (only if user is logged in)
  const { data: userTechniques, isLoading: loadingUserTechniques, error: userTechniquesError } = useUserTechniques();

  // Fetch user's saved items (weapons)
  const { data: userItems = [] } = useUserItems();

  // Combine default weapons with user's saved weapons
  const allWeaponOptions = useMemo(() => {
    const userWeapons: WeaponConfig[] = userItems
      .filter((item) => item.type === 'weapon')
      .map((item) => ({
        id: item.docId,
        name: item.name,
        tp: 1, // Default TP for user weapons; could calculate from properties
        isUserWeapon: true,
      }));
    
    return [...DEFAULT_WEAPON_OPTIONS, ...userWeapons];
  }, [userItems]);

  // Load cached state from localStorage on mount (only once when parts are available)
  useEffect(() => {
    // Only load once - when we have parts and haven't initialized yet
    if (isInitialized || techniqueParts.length === 0) return;
    
    try {
      const cached = localStorage.getItem(TECHNIQUE_CREATOR_CACHE_KEY);
      if (cached) {
        const parsed: TechniqueCreatorCache = JSON.parse(cached);
        // Only use cache if it's less than 30 days old
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        if (Date.now() - parsed.timestamp < thirtyDays) {
          setName(parsed.name || '');
          setDescription(parsed.description || '');
          setActionType(parsed.actionType || 'basic');
          setIsReaction(parsed.isReaction || false);
          setDamage(parsed.damage || { amount: 0, size: 6, type: 'none' });
          
          // Restore weapon selection
          if (parsed.weaponId) {
            const foundWeapon = allWeaponOptions.find(w => String(w.id) === String(parsed.weaponId));
            if (foundWeapon) setWeapon(foundWeapon);
          }
          
          // Restore selected parts by finding them in techniqueParts
          if (parsed.selectedParts && parsed.selectedParts.length > 0) {
            const restoredParts: SelectedPart[] = [];
            for (const savedPart of parsed.selectedParts) {
              const foundPart = techniqueParts.find((p: { id: string }) => String(p.id) === String(savedPart.partId));
              if (foundPart) {
                restoredParts.push({
                  part: foundPart,
                  op_1_lvl: savedPart.op_1_lvl,
                  op_2_lvl: savedPart.op_2_lvl,
                  op_3_lvl: savedPart.op_3_lvl,
                  selectedCategory: savedPart.selectedCategory,
                });
              }
            }
            setSelectedParts(restoredParts);
          }
        } else {
          localStorage.removeItem(TECHNIQUE_CREATOR_CACHE_KEY);
        }
      }
    } catch (e) {
      console.error('Failed to load technique creator cache:', e);
    }
    setIsInitialized(true);
  }, [techniqueParts, allWeaponOptions, isInitialized]);

  // Auto-save to localStorage when state changes
  useEffect(() => {
    if (!isInitialized) return;
    
    try {
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
      localStorage.setItem(TECHNIQUE_CREATOR_CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
      console.error('Failed to save technique creator cache:', e);
    }
  }, [isInitialized, name, description, selectedParts, actionType, isReaction, damage, weapon]);

  // Build mechanic parts from action type, damage, and weapon selections
  const mechanicParts = useMemo(
    () => buildMechanicPartPayload({
      actionTypeSelection: actionType,
      reaction: isReaction,
      diceAmt: damage.amount,
      dieSize: damage.size,
      weaponTP: weapon.tp ?? (weapon.id !== 0 ? 1 : 0), // Use weapon TP if available
      partsDb: techniqueParts,
    }),
    [actionType, isReaction, damage, weapon, techniqueParts]
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
      // Auto-generated mechanic parts from action type / damage / weapon selections
      ...mechanicParts,
    ],
    [selectedParts, mechanicParts]
  );

  // Calculate costs - using technique parts as the database
  const costs = useMemo(
    () => calculateTechniqueCosts(partsPayload, techniqueParts),
    [partsPayload, techniqueParts]
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

  // Actions
  const addPart = useCallback(() => {
    if (techniqueParts.length === 0) return;
    setSelectedParts((prev) => [
      ...prev,
      {
        part: techniqueParts[0],
        op_1_lvl: 0,
        op_2_lvl: 0,
        op_3_lvl: 0,
        selectedCategory: 'any',
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

  const handleSave = async () => {
    if (!name.trim()) {
      setSaveMessage({ type: 'error', text: 'Please enter a technique name' });
      return;
    }
    if (!user) {
      // Show login prompt modal instead of error message
      setShowLoginPrompt(true);
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    try {
      // Format parts for saving
      const partsToSave = selectedParts.map((sp) => ({
        id: Number(sp.part.id),
        name: sp.part.name,
        op_1_lvl: sp.op_1_lvl,
        op_2_lvl: sp.op_2_lvl,
        op_3_lvl: sp.op_3_lvl,
      }));

      // Format damage
      const damageToSave =
        damage.amount > 0
          ? [{ amount: damage.amount, size: damage.size }]
          : [];

      const techniqueData = {
        name: name.trim(),
        description: description.trim(),
        parts: partsToSave,
        damage: damageToSave,
        weapon: Number(weapon.id) > 0 ? weapon : null,
        updatedAt: new Date(),
      };

      if (saveTarget === 'public') {
        await saveToPublicLibrary('techniques', { ...techniqueData, createdAt: new Date().toISOString() });
        setSaveMessage({ type: 'success', text: 'Technique saved to public library!' });
      } else {
        const existing = await findLibraryItemByName('techniques', name.trim());
        await saveToLibrary('techniques', { ...techniqueData, createdAt: new Date().toISOString() }, existing ? { existingId: existing.id } : undefined);
        setSaveMessage({ type: 'success', text: 'Technique saved successfully!' });
      }
      
      // Reset form after short delay
      setTimeout(() => {
        setName('');
        setDescription('');
        setSelectedParts([]);
        setDamage({ amount: 0, size: 6, type: 'none' });
        setWeapon(DEFAULT_WEAPON_OPTIONS[0]);
        setSaveMessage(null);
      }, 2000);
    } catch (err) {
      console.error('Error saving technique:', err);
      setSaveMessage({
        type: 'error',
        text: `Failed to save: ${(err as Error).message}`,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setName('');
    setDescription('');
    setSelectedParts([]);
    setActionType('basic');
    setIsReaction(false);
    setDamage({ amount: 0, size: 6, type: 'none' });
    setWeapon(DEFAULT_WEAPON_OPTIONS[0]);
    setSaveMessage(null);
    // Clear localStorage cache
    try {
      localStorage.removeItem(TECHNIQUE_CREATOR_CACHE_KEY);
    } catch (e) {
      console.error('Failed to clear technique creator cache:', e);
    }
  };

  // Load a technique from the library
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLoadTechnique = useCallback((technique: any) => {
    // Set name and description
    setName(technique.name || '');
    setDescription(technique.description || '');
    
    // Load parts
    const savedParts = (technique.parts || technique.techniqueParts || []) as Array<{
      id?: number | string;
      name?: string;
      op_1_lvl?: number;
      op_2_lvl?: number;
      op_3_lvl?: number;
    }>;
    
    const loadedParts: SelectedPart[] = [];
    for (const savedPart of savedParts) {
      const matchedPart = techniqueParts.find(
        (p: { id: string; name: string }) => p.id === String(savedPart.id) || p.name === savedPart.name
      );
      
      if (matchedPart) {
        loadedParts.push({
          part: matchedPart,
          op_1_lvl: savedPart.op_1_lvl || 0,
          op_2_lvl: savedPart.op_2_lvl || 0,
          op_3_lvl: savedPart.op_3_lvl || 0,
          selectedCategory: matchedPart.category || 'any',
        });
      }
    }
    setSelectedParts(loadedParts);
    
    // Load weapon
    if (technique.weapon) {
      const weaponMatch = allWeaponOptions.find(
        (w) => String(w.id) === String(technique.weapon.id) || w.name === technique.weapon.name
      );
      if (weaponMatch) {
        setWeapon(weaponMatch);
      }
    }
    
    // Load damage
    if (technique.damage) {
      const dmg = technique.damage;
      setDamage({
        amount: dmg.amount || dmg.dice || 0,
        size: dmg.size || dmg.sides || 6,
        type: dmg.type || 'none',
      });
    } else {
      setDamage({ amount: 0, size: 6, type: 'none' });
    }
    
    setSaveMessage({ type: 'success', text: 'Technique loaded successfully!' });
    setTimeout(() => setSaveMessage(null), 2000);
  }, [techniqueParts, allWeaponOptions]);

  if (isLoading) {
    return (
      <PageContainer size="xl">
        <LoadingState message="Loading technique parts..." />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer size="xl">
        <Alert variant="danger">
          Failed to load technique parts: {error.message}
        </Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="xl">
      <PageHeader
        icon={<Swords className="w-8 h-8 text-red-600" />}
        title="Technique Creator"
        description="Design custom martial techniques by combining technique parts. Each part contributes to the total energy cost and training point requirements."
        actions={
          <>
            {isAdmin && (
              <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-alt">
                <button
                  type="button"
                  onClick={() => setSaveTarget('private')}
                  className={cn(
                    'px-2 py-1 rounded text-sm font-medium transition-colors',
                    saveTarget === 'private' ? 'bg-primary-600 text-white' : 'text-text-muted hover:text-text-secondary'
                  )}
                >
                  My library
                </button>
                <button
                  type="button"
                  onClick={() => setSaveTarget('public')}
                  className={cn(
                    'px-2 py-1 rounded text-sm font-medium transition-colors',
                    saveTarget === 'public' ? 'bg-primary-600 text-white' : 'text-text-muted hover:text-text-secondary'
                  )}
                >
                  Public library
                </button>
              </div>
            )}
            <Button
              variant="secondary"
              onClick={() => user ? setShowLoadModal(true) : setShowLoginPrompt(true)}
              title={user ? "Load from library" : "Log in to load from library"}
            >
              <FolderOpen className="w-5 h-5" />
              Load
            </Button>
            <Button
              variant="secondary"
              onClick={handleReset}
            >
              Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              isLoading={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </>
        }
        className="mb-6"
      />

      {/* Load from Library Modal */}
      <LoadFromLibraryModal
        isOpen={showLoadModal}
        onClose={() => setShowLoadModal(false)}
        onSelect={handleLoadTechnique}
        items={userTechniques}
        isLoading={loadingUserTechniques}
        error={userTechniquesError}
        itemType="technique"
        title="Load Technique from Library"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Name & Description */}
          <div className="bg-surface rounded-xl shadow-md p-6">
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
          </div>

          {/* Weapon & Action Type */}
          <div className="bg-surface rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Combat Configuration</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Weapon
                </label>
                <select
                  value={String(weapon.id)}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const selected = allWeaponOptions.find(w => String(w.id) === selectedId);
                    if (selected) setWeapon(selected);
                  }}
                  className="w-full px-4 py-2 border border-border-light rounded-lg"
                >
                  {/* Default options */}
                  <optgroup label="General">
                    {DEFAULT_WEAPON_OPTIONS.map((opt) => (
                      <option key={String(opt.id)} value={String(opt.id)}>
                        {opt.name}
                      </option>
                    ))}
                  </optgroup>
                  {/* User's saved weapons */}
                  {allWeaponOptions.filter(w => w.isUserWeapon).length > 0 && (
                    <optgroup label="My Weapons">
                      {allWeaponOptions
                        .filter(w => w.isUserWeapon)
                        .map((opt) => (
                          <option key={String(opt.id)} value={String(opt.id)}>
                            {opt.name}
                          </option>
                        ))}
                    </optgroup>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Action Type
                </label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full px-4 py-2 border border-border-light rounded-lg"
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
              <Checkbox
                checked={isReaction}
                onChange={(e) => setIsReaction(e.target.checked)}
                label="Can be used as a Reaction"
              />
            </div>
          </div>

          {/* Technique Parts */}
          <div className="bg-surface rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text-primary">
                Technique Parts ({selectedParts.length})
              </h3>
              <Button
                variant="danger"
                onClick={addPart}
              >
                <Plus className="w-4 h-4" />
                Add Part
              </Button>
            </div>

            {selectedParts.length === 0 ? (
              <div className="text-center py-8 text-text-muted">
                <Info className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No parts added yet. Click &quot;Add Part&quot; to begin building your technique.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedParts.map((sp, idx) => (
                  <PartCard
                    key={idx}
                    selectedPart={sp}
                    _index={idx}
                    onRemove={() => removePart(idx)}
                    onUpdate={(updates) => updatePart(idx, updates)}
                    allParts={techniqueParts}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Additional Damage */}
          <div className="bg-surface rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Additional Damage</h3>
            <p className="text-sm text-text-secondary mb-4">
              Add extra damage dice to your technique. The damage type matches the weapon&apos;s damage type.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <NumberStepper
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
                  className="px-3 py-2 border border-border-light rounded-lg"
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
          </div>
        </div>

        {/* Sidebar - Cost Summary (sticky to match creature creator) */}
        <div className="self-start sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto space-y-6">
          <CreatorSummaryPanel
            title="Technique Summary"
            costStats={[
              { label: 'Energy Cost', value: costs.totalEnergy, icon: <Zap className="w-6 h-6" />, color: 'health' },
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
            {/* Save Message */}
            {saveMessage && (
              <Alert 
                variant={saveMessage.type === 'success' ? 'success' : 'danger'}
              >
                {saveMessage.text}
              </Alert>
            )}
          </CreatorSummaryPanel>
        </div>
      </div>

      {/* Login Prompt Modal */}
      <LoginPromptModal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        returnPath="/technique-creator"
        contentType="technique"
      />
    </PageContainer>
  );
}

export default function TechniqueCreatorPage() {
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <TechniqueCreatorContent />
    </div>
  );
}
