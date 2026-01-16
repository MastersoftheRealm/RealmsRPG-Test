/**
 * Technique Creator Page
 * ======================
 * Tool for creating custom martial techniques using the technique parts system.
 * 
 * Features:
 * - Select technique parts from RTDB database
 * - Configure option levels for each part
 * - Calculate energy and training point costs
 * - Save to user's Firestore library
 */

'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { X, Plus, ChevronDown, ChevronUp, Swords, Zap, Target, Info, FolderOpen } from 'lucide-react';
import { collection, addDoc, getDocs, query, where, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { cn } from '@/lib/utils';
import { useTechniqueParts, useUserTechniques, useUserItems, type TechniquePart } from '@/hooks';
import { useAuthStore } from '@/stores';
import { LoginPromptModal } from '@/components/shared';
import { LoadFromLibraryModal } from '@/components/creator/LoadFromLibraryModal';
import { NumberStepper } from '@/components/creator/number-stepper';
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
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-gray-500 hover:text-gray-700"
          >
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          <span className="font-medium text-gray-900">{part.name}</span>
          <span className="text-sm text-gray-500">
            En: {partEnergy.toFixed(1)} | TP: {Math.floor(partTP)}
          </span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-gray-400 hover:text-red-500"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 py-4 space-y-4">
          {/* Category and Part Selection */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'any' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
          <p className="text-sm text-gray-600">{part.description}</p>

          {/* Base Values */}
          <div className="flex gap-4 text-sm">
            <span className="text-gray-600">
              Base Energy: <strong>{part.base_en || 0}</strong>
            </span>
            <span className="text-gray-600">
              Base TP: <strong>{part.base_tp}</strong>
            </span>
          </div>

          {/* Options */}
          {(hasOption(1) || hasOption(2) || hasOption(3)) && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              {hasOption(1) && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      Option 1:{' '}
                      <span className="text-gray-500">
                        En {(part.op_1_en || 0) >= 0 ? '+' : ''}{part.op_1_en || 0}, TP{' '}
                        {(part.op_1_tp || 0) >= 0 ? '+' : ''}{part.op_1_tp || 0}
                      </span>
                    </span>
                    <NumberStepper
                      value={selectedPart.op_1_lvl}
                      onChange={(v) => onUpdate({ op_1_lvl: v })}
                      label="Level:"
                    />
                  </div>
                  {part.op_1_desc && (
                    <p className="text-sm text-gray-600">{part.op_1_desc}</p>
                  )}
                </div>
              )}

              {hasOption(2) && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      Option 2:{' '}
                      <span className="text-gray-500">
                        En {(part.op_2_en || 0) >= 0 ? '+' : ''}{part.op_2_en || 0}, TP{' '}
                        {(part.op_2_tp || 0) >= 0 ? '+' : ''}{part.op_2_tp || 0}
                      </span>
                    </span>
                    <NumberStepper
                      value={selectedPart.op_2_lvl}
                      onChange={(v) => onUpdate({ op_2_lvl: v })}
                      label="Level:"
                    />
                  </div>
                  {part.op_2_desc && (
                    <p className="text-sm text-gray-600">{part.op_2_desc}</p>
                  )}
                </div>
              )}

              {hasOption(3) && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      Option 3:{' '}
                      <span className="text-gray-500">
                        En {(part.op_3_en || 0) >= 0 ? '+' : ''}{part.op_3_en || 0}, TP{' '}
                        {(part.op_3_tp || 0) >= 0 ? '+' : ''}{part.op_3_tp || 0}
                      </span>
                    </span>
                    <NumberStepper
                      value={selectedPart.op_3_lvl}
                      onChange={(v) => onUpdate({ op_3_lvl: v })}
                      label="Level:"
                    />
                  </div>
                  {part.op_3_desc && (
                    <p className="text-sm text-gray-600">{part.op_3_desc}</p>
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
              const foundPart = techniqueParts.find(p => String(p.id) === String(savedPart.partId));
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

      // Check if technique with same name exists
      const libraryRef = collection(db, 'users', user.uid, 'techniqueLibrary');
      const q = query(libraryRef, where('name', '==', name.trim()));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        // Update existing technique
        const docRef = doc(db, 'users', user.uid, 'techniqueLibrary', snapshot.docs[0].id);
        await setDoc(docRef, techniqueData);
      } else {
        // Create new technique
        await addDoc(libraryRef, { ...techniqueData, createdAt: new Date() });
      }

      setSaveMessage({ type: 'success', text: 'Technique saved successfully!' });
      
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
        (p) => p.id === String(savedPart.id) || p.name === savedPart.name
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
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700">Failed to load technique parts: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Swords className="w-8 h-8 text-red-600" />
            Technique Creator
          </h1>
          <p className="text-gray-600">
            Design custom martial techniques by combining technique parts. Each part contributes to the total
            energy cost and training point requirements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => user ? setShowLoadModal(true) : setShowLoginPrompt(true)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
              user 
                ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                : "bg-gray-100 text-gray-400 cursor-pointer"
            )}
            title={user ? "Load from library" : "Log in to load from library"}
          >
            <FolderOpen className="w-5 h-5" />
            Load
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700 transition-colors"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors',
              saving || !name.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            )}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

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
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Technique Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter technique name..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what your technique does..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* Weapon & Action Type */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Combat Configuration</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weapon
                </label>
                <select
                  value={String(weapon.id)}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const selected = allWeaponOptions.find(w => String(w.id) === selectedId);
                    if (selected) setWeapon(selected);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action Type
                </label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isReaction}
                  onChange={(e) => setIsReaction(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Can be used as a Reaction</span>
              </label>
            </div>
          </div>

          {/* Technique Parts */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Technique Parts ({selectedParts.length})
              </h3>
              <button
                type="button"
                onClick={addPart}
                className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Part
              </button>
            </div>

            {selectedParts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
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
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Additional Damage</h3>
            <p className="text-sm text-gray-600 mb-4">
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
                  className="px-3 py-2 border border-gray-300 rounded-lg"
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
              <p className="mt-2 text-sm text-gray-600">
                Additional Damage: <strong>+{damage.amount}d{damage.size}</strong>
              </p>
            )}
          </div>
        </div>

        {/* Sidebar - Cost Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Technique Summary</h3>

            {/* Cost Display */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <Zap className="w-6 h-6 mx-auto text-red-600 mb-1" />
                <div className="text-3xl font-bold text-red-600">{costs.totalEnergy}</div>
                <div className="text-xs text-red-600">Energy Cost</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <Target className="w-6 h-6 mx-auto text-purple-600 mb-1" />
                <div className="text-3xl font-bold text-purple-600">{costs.totalTP}</div>
                <div className="text-xs text-purple-600">Training Points</div>
              </div>
            </div>

            {/* Derived Stats */}
            <div className="space-y-2 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Action:</span>
                <span className="font-medium">{actionTypeDisplay}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Weapon:</span>
                <span className="font-medium">{weapon.name}</span>
              </div>
              {damageDisplay && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Damage:</span>
                  <span className="font-medium">{damageDisplay}</span>
                </div>
              )}
            </div>

            {/* TP Sources */}
            {costs.tpSources.length > 0 && (
              <div className="border-t border-gray-100 pt-4 mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">TP Breakdown</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  {costs.tpSources.map((src, i) => (
                    <li key={i}>• {src}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Save Message */}
            {saveMessage && (
              <div
                className={cn(
                  'mt-4 p-3 rounded-lg text-sm',
                  saveMessage.type === 'success'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                )}
              >
                {saveMessage.text}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Login Prompt Modal */}
      <LoginPromptModal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        returnPath="/technique-creator"
        contentType="technique"
      />
    </div>
  );
}

export default function TechniqueCreatorPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <TechniqueCreatorContent />
    </div>
  );
}
