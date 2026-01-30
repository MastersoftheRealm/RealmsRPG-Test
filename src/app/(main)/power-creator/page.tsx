/**
 * Power Creator Page
 * ==================
 * Tool for creating custom powers using the power parts system.
 * 
 * Features:
 * - Select power parts from RTDB database
 * - Configure option levels for each part
 * - Calculate energy and training point costs
 * - Save to user's Firestore library
 */

'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { X, Plus, ChevronDown, ChevronUp, Wand2, Zap, Target, Info, FolderOpen } from 'lucide-react';
import { collection, addDoc, getDocs, query, where, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { cn } from '@/lib/utils';
import { usePowerParts, useUserPowers, type PowerPart } from '@/hooks';
import { useAuthStore } from '@/stores';
import { LoginPromptModal } from '@/components/shared';
import { LoadFromLibraryModal } from '@/components/creator/LoadFromLibraryModal';
import { NumberStepper } from '@/components/creator/number-stepper';
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

// =============================================================================
// Types
// =============================================================================

interface SelectedPart {
  part: PowerPart;
  op_1_lvl: number;
  op_2_lvl: number;
  op_3_lvl: number;
  applyDuration: boolean;
  selectedCategory: string;
}

interface DamageConfig {
  amount: number;
  size: number;
  type: string;
  applyDuration?: boolean;
}

interface RangeConfig {
  steps: number; // 0 = melee (1 space), 1+ = ranged
  applyDuration?: boolean;
}

// =============================================================================
// Shared Constants (imported from central location)
// =============================================================================

import {
  ACTION_OPTIONS,
  MAGIC_DAMAGE_TYPES as DAMAGE_TYPES,
  DIE_SIZES,
  AREA_TYPES,
  DURATION_TYPES,
  DURATION_VALUES,
  CATEGORY_COLORS,
  CREATOR_CACHE_KEYS,
} from '@/lib/game/creator-constants';

// LocalStorage key for caching power creator state
const POWER_CREATOR_CACHE_KEY = CREATOR_CACHE_KEYS.POWER;

// Advanced mechanics categories
const ADVANCED_CATEGORIES = [
  'Action',
  'Activation', 
  'Area of Effect',
  'Duration',
  'Target',
  'Special',
  'Restriction'
] as const;

// Parts that are handled in basic mechanics (excluded from advanced section)
const EXCLUDED_PARTS = new Set([
  'Power Quick or Free Action',
  'Power Long Action',
  'Power Reaction',
  'Sphere of Effect',
  'Cylinder of Effect',
  'Cone of Effect',
  'Line of Effect',
  'Trail of Effect',
  'Magic Damage',
  'Light Damage',
  'Elemental Damage',
  'Poison or Necrotic Damage',
  'Sonic Damage',
  'Spiritual Damage',
  'Psychic Damage',
  'Physical Damage',
  'Duration (Round)',
  'Duration (Minute)',
  'Duration (Hour)',
  'Duration (Days)',
  'Duration (Permanent)',
  'Focus for Duration',
  'No Harm or Adaptation for Duration',
  'Duration Ends On Activation',
  'Sustain for Duration',
  'Power Range'
]);

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
  allParts: PowerPart[];
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
    const desc = part[`op_${n}_desc` as keyof PowerPart] as string | undefined;
    const en = part[`op_${n}_en` as keyof PowerPart] as number | undefined;
    const tp = part[`op_${n}_tp` as keyof PowerPart] as number | undefined;
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
    <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-neutral-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-text-muted hover:text-text-secondary"
          >
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          <span className="font-medium text-text-primary">{part.name}</span>
          <span className="text-sm text-text-muted">
            EN: {partEnergy.toFixed(1)} | TP: {Math.floor(partTP)}
          </span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-text-muted hover:text-red-500"
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
                      op_2_lvl: 0,
                      op_3_lvl: 0,
                      applyDuration: false,
                    });
                  } else {
                    onUpdate({ selectedCategory: newCategory });
                  }
                }}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
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
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
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
          <p className="text-sm text-text-secondary">{part.description}</p>

          {/* Base Values */}
          <div className="flex gap-4 text-sm">
            <span className="text-text-secondary">
              Base Energy: <strong>{part.base_en}</strong>
            </span>
            <span className="text-text-secondary">
              Base TP: <strong>{part.base_tp}</strong>
            </span>
          </div>

          {/* Options */}
          {(hasOption(1) || hasOption(2) || hasOption(3)) && (
            <div className="space-y-3 pt-2 border-t border-neutral-100">
              {hasOption(1) && (
                <div className="bg-neutral-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      Option 1:{' '}
                      <span className="text-text-muted">
                        EN {(part.op_1_en || 0) >= 0 ? '+' : ''}{part.op_1_en || 0}, TP{' '}
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
                    <p className="text-sm text-text-secondary">{part.op_1_desc}</p>
                  )}
                </div>
              )}

              {hasOption(2) && (
                <div className="bg-neutral-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      Option 2:{' '}
                      <span className="text-text-muted">
                        EN {(part.op_2_en || 0) >= 0 ? '+' : ''}{part.op_2_en || 0}, TP{' '}
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
                    <p className="text-sm text-text-secondary">{part.op_2_desc}</p>
                  )}
                </div>
              )}

              {hasOption(3) && (
                <div className="bg-neutral-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      Option 3:{' '}
                      <span className="text-text-muted">
                        EN {(part.op_3_en || 0) >= 0 ? '+' : ''}{part.op_3_en || 0}, TP{' '}
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
                    <p className="text-sm text-text-secondary">{part.op_3_desc}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Apply Duration Checkbox */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedPart.applyDuration}
              onChange={(e) => onUpdate({ applyDuration: e.target.checked })}
              className="rounded border-neutral-300"
            />
            <span className="text-sm text-text-secondary">Apply to Duration</span>
          </label>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Advanced Mechanics Components
// =============================================================================

interface AdvancedPart {
  part: PowerPart;
  op_1_lvl: number;
  op_2_lvl: number;
  op_3_lvl: number;
  applyDuration: boolean;
}

function AdvancedChip({
  part,
  onAdd,
}: {
  part: PowerPart;
  onAdd: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const colors = CATEGORY_COLORS[part.category] || CATEGORY_COLORS['Special'];

  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2 cursor-pointer transition-all',
        colors.bg,
        colors.border,
        colors.hoverBg
      )}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={cn('text-sm font-medium', colors.text)}>
          {part.name}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-sm',
            'bg-primary-600 hover:bg-primary-700'
          )}
        >
          +
        </button>
      </div>
      {expanded && (
        <div className="mt-2 pt-2 border-t border-current/20 text-sm space-y-1">
          <p className={colors.text}>{part.description || 'No description available.'}</p>
          {part.op_1_desc && (
            <p className="text-text-secondary">
              <span className="font-medium">Option 1:</span> {part.op_1_desc}
            </p>
          )}
          {part.op_2_desc && (
            <p className="text-text-secondary">
              <span className="font-medium">Option 2:</span> {part.op_2_desc}
            </p>
          )}
          {part.op_3_desc && (
            <p className="text-text-secondary">
              <span className="font-medium">Option 3:</span> {part.op_3_desc}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function AddedAdvancedChip({
  advPart,
  _index,
  onRemove,
  onUpdate,
}: {
  advPart: AdvancedPart;
  _index: number;
  onRemove: () => void;
  onUpdate: (updates: Partial<AdvancedPart>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { part } = advPart;
  const colors = CATEGORY_COLORS[part.category] || CATEGORY_COLORS['Special'];

  const hasOption = (n: 1 | 2 | 3) => {
    const desc = part[`op_${n}_desc` as keyof PowerPart] as string | undefined;
    return desc && desc.trim() !== '';
  };

  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2 transition-all cursor-pointer',
        colors.bg,
        colors.border
      )}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={cn('text-sm font-medium', colors.text)}>
          {part.name}
          {(advPart.op_1_lvl > 0 || advPart.op_2_lvl > 0 || advPart.op_3_lvl > 0) && (
            <span className="ml-2 text-xs opacity-75">
              ({advPart.op_1_lvl}/{advPart.op_2_lvl}/{advPart.op_3_lvl})
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-sm bg-red-500 hover:bg-red-600"
        >
          ×
        </button>
      </div>
      {expanded && (
        <div className="mt-2 pt-2 border-t border-current/20 text-sm space-y-2" onClick={(e) => e.stopPropagation()}>
          <p className={colors.text}>{part.description}</p>
          
          {hasOption(1) && (
            <div className="bg-white/50 rounded p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">
                  Option 1: EN {(part.op_1_en || 0) >= 0 ? '+' : ''}{part.op_1_en || 0}, TP {(part.op_1_tp || 0) >= 0 ? '+' : ''}{part.op_1_tp || 0}
                </span>
                <NumberStepper
                  value={advPart.op_1_lvl}
                  onChange={(v) => onUpdate({ op_1_lvl: v })}
                  label=""
                />
              </div>
              <p className="text-text-secondary mt-1">{part.op_1_desc}</p>
            </div>
          )}
          
          {hasOption(2) && (
            <div className="bg-white/50 rounded p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">
                  Option 2: EN {(part.op_2_en || 0) >= 0 ? '+' : ''}{part.op_2_en || 0}, TP {(part.op_2_tp || 0) >= 0 ? '+' : ''}{part.op_2_tp || 0}
                </span>
                <NumberStepper
                  value={advPart.op_2_lvl}
                  onChange={(v) => onUpdate({ op_2_lvl: v })}
                  label=""
                />
              </div>
              <p className="text-text-secondary mt-1">{part.op_2_desc}</p>
            </div>
          )}
          
          {hasOption(3) && (
            <div className="bg-white/50 rounded p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">
                  Option 3: EN {(part.op_3_en || 0) >= 0 ? '+' : ''}{part.op_3_en || 0}, TP {(part.op_3_tp || 0) >= 0 ? '+' : ''}{part.op_3_tp || 0}
                </span>
                <NumberStepper
                  value={advPart.op_3_lvl}
                  onChange={(v) => onUpdate({ op_3_lvl: v })}
                  label=""
                />
              </div>
              <p className="text-text-secondary mt-1">{part.op_3_desc}</p>
            </div>
          )}
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={advPart.applyDuration}
              onChange={(e) => onUpdate({ applyDuration: e.target.checked })}
              className="rounded border-neutral-300"
            />
            <span className="text-sm text-text-secondary">Apply Duration</span>
          </label>
        </div>
      )}
    </div>
  );
}

function AdvancedMechanicsSection({
  powerParts,
  selectedAdvancedParts,
  onAdd,
  onRemove,
  onUpdate,
}: {
  powerParts: PowerPart[];
  selectedAdvancedParts: AdvancedPart[];
  onAdd: (part: PowerPart) => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, updates: Partial<AdvancedPart>) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  // Filter parts by category, excluding basic mechanic parts
  const getPartsForCategory = useCallback(
    (category: string) => {
      return powerParts.filter(
        (p) => p.mechanic && p.category === category && !EXCLUDED_PARTS.has(p.name)
      );
    },
    [powerParts]
  );

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Toggle Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between bg-neutral-50 hover:bg-neutral-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-text-muted" />
          ) : (
            <ChevronDown className="w-5 h-5 text-text-muted" />
          )}
          <span className="font-bold text-text-primary">Advanced Power Mechanics</span>
        </div>
        {!expanded && selectedAdvancedParts.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {selectedAdvancedParts.slice(0, 5).map((ap, i) => {
              const colors = CATEGORY_COLORS[ap.part.category] || CATEGORY_COLORS['Special'];
              return (
                <span
                  key={i}
                  className={cn('px-2 py-0.5 rounded text-xs font-medium', colors.bg, colors.text)}
                >
                  {ap.part.name}
                </span>
              );
            })}
            {selectedAdvancedParts.length > 5 && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-neutral-200 text-text-secondary">
                +{selectedAdvancedParts.length - 5} more
              </span>
            )}
          </div>
        )}
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-6 space-y-6">
          {/* Added Advanced Mechanics */}
          {selectedAdvancedParts.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-text-secondary mb-3">Added Advanced Mechanics</h4>
              <div className="flex flex-wrap gap-2">
                {selectedAdvancedParts.map((ap, idx) => (
                  <AddedAdvancedChip
                    key={idx}
                    advPart={ap}
                    _index={idx}
                    onRemove={() => onRemove(idx)}
                    onUpdate={(updates) => onUpdate(idx, updates)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Category Grids - max 5 items per row, expand horizontally */}
          <div className="space-y-4">
            {ADVANCED_CATEGORIES.map((category) => {
              const parts = getPartsForCategory(category);
              if (parts.length === 0) return null;
              return (
                <div key={category}>
                  <h4 className="text-sm font-bold text-text-secondary mb-2">{category}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {parts.map((part) => (
                      <AdvancedChip
                        key={part.id}
                        part={part}
                        onAdd={() => onAdd(part)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [range, setRange] = useState<RangeConfig>({ steps: 0, applyDuration: false });
  // Area of effect state
  const [area, setArea] = useState<AreaConfig>({ type: 'none', level: 1, applyDuration: false });
  // Duration state
  const [duration, setDuration] = useState<DurationConfig>({
    type: 'instant',
    value: 1,
    focus: false,
    noHarm: false,
    endsOnActivation: false,
    sustain: 0,
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showLoadModal, setShowLoadModal] = useState(false);

  // Fetch power parts
  const { data: powerParts = [], isLoading, error } = usePowerParts();
  
  // Fetch user's saved powers for loading (only if user is logged in)
  const { data: userPowers, isLoading: loadingUserPowers, error: userPowersError } = useUserPowers();

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
          setRange(parsed.range || { steps: 0, applyDuration: false });
          setArea(parsed.area || { type: 'none', level: 1, applyDuration: false });
          setDuration(parsed.duration || {
            type: 'instant',
            value: 1,
            focus: false,
            noHarm: false,
            endsOnActivation: false,
            sustain: 0,
          });
          
          // Restore selected parts by finding them in powerParts
          if (parsed.selectedParts && parsed.selectedParts.length > 0) {
            const restoredParts: SelectedPart[] = [];
            for (const savedPart of parsed.selectedParts) {
              const foundPart = powerParts.find(p => String(p.id) === String(savedPart.partId));
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
              const foundPart = powerParts.find(p => String(p.id) === String(savedPart.partId));
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
    () => powerParts.filter((p) => !p.mechanic),
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
      rangeApplyDuration: range.applyDuration,
      areaType: area.type,
      areaLevel: area.level,
      areaApplyDuration: area.applyDuration,
      durationType: duration.type,
      durationValue: duration.value,
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

  const handleSave = async () => {
    if (!name.trim()) {
      setSaveMessage({ type: 'error', text: 'Please enter a power name' });
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
      // Format parts for saving (combine regular and advanced parts)
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
          isAdvanced: true, // Flag for identifying advanced mechanics
        })),
      ];

      // Format damage
      const damageToSave =
        damage.type !== 'none' && damage.amount > 0
          ? [{ amount: damage.amount, size: damage.size, type: damage.type }]
          : [];

      const powerData = {
        name: name.trim(),
        description: description.trim(),
        parts: partsToSave,
        damage: damageToSave,
        actionType,
        isReaction,
        range,
        area,
        duration,
        updatedAt: new Date(),
      };

      // Check if power with same name exists
      const libraryRef = collection(db, 'users', user.uid, 'library');
      const q = query(libraryRef, where('name', '==', name.trim()));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        // Update existing power
        const docRef = doc(db, 'users', user.uid, 'library', snapshot.docs[0].id);
        await setDoc(docRef, powerData);
      } else {
        // Create new power
        await addDoc(libraryRef, { ...powerData, createdAt: new Date() });
      }

      setSaveMessage({ type: 'success', text: 'Power saved successfully!' });
      
      // Reset form after short delay
      setTimeout(() => {
        setName('');
        setDescription('');
        setSelectedParts([]);
        setSelectedAdvancedParts([]);
        setActionType('basic');
        setIsReaction(false);
        setDamage({ amount: 0, size: 6, type: 'none' });
        setRange({ steps: 0, applyDuration: false });
        setArea({ type: 'none', level: 1, applyDuration: false });
        setDuration({
          type: 'instant',
          value: 1,
          focus: false,
          noHarm: false,
          endsOnActivation: false,
          sustain: 0,
        });
        setSaveMessage(null);
      }, 2000);
    } catch (err) {
      console.error('Error saving power:', err);
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
    setSelectedAdvancedParts([]);
    setActionType('basic');
    setIsReaction(false);
    setDamage({ amount: 0, size: 6, type: 'none' });
    setRange({ steps: 0, applyDuration: false });
    setArea({ type: 'none', level: 1, applyDuration: false });
    setDuration({
      type: 'instant',
      value: 1,
      focus: false,
      noHarm: false,
      endsOnActivation: false,
      sustain: 0,
    });
    setSaveMessage(null);
    // Clear localStorage cache
    try {
      localStorage.removeItem(POWER_CREATOR_CACHE_KEY);
    } catch (e) {
      console.error('Failed to clear power creator cache:', e);
    }
  };

  // Load a power from the library
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLoadPower = useCallback((power: any) => {
    // Set name and description
    setName(power.name || '');
    setDescription(power.description || '');
    
    // Load parts - the data structure from Firestore may vary
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
        (p) => p.id === String(savedPart.id) || p.name === savedPart.name
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
        applyDuration: power.range.applyDuration || false,
      });
    } else {
      setRange({ steps: 0, applyDuration: false });
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
        focus: power.duration.focus || false,
        noHarm: power.duration.noHarm || false,
        endsOnActivation: power.duration.endsOnActivation || false,
        sustain: power.duration.sustain || 0,
      });
    } else {
      setDuration({
        type: 'instant',
        value: 1,
        focus: false,
        noHarm: false,
        endsOnActivation: false,
        sustain: 0,
      });
    }
    
    setSaveMessage({ type: 'success', text: 'Power loaded successfully!' });
    setTimeout(() => setSaveMessage(null), 2000);
  }, [powerParts]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-neutral-200 rounded w-1/3"></div>
          <div className="h-4 bg-neutral-200 rounded w-2/3"></div>
          <div className="h-64 bg-neutral-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700">Failed to load power parts: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-2">
            <Wand2 className="w-8 h-8 text-primary-600" />
            Power Creator
          </h1>
          <p className="text-text-secondary">
            Design custom powers by combining power parts. Each part contributes to the total
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
                ? "bg-neutral-100 hover:bg-neutral-200 text-text-secondary"
                : "bg-neutral-100 text-text-muted cursor-pointer"
            )}
            title={user ? "Load from library" : "Log in to load from library"}
          >
            <FolderOpen className="w-5 h-5" />
            Load
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 rounded-lg border border-neutral-300 hover:bg-neutral-100 text-text-secondary transition-colors"
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
                ? 'bg-neutral-300 text-text-muted cursor-not-allowed'
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
        onSelect={handleLoadPower}
        items={userPowers}
        isLoading={loadingUserPowers}
        error={userPowersError}
        itemType="power"
        title="Load Power from Library"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Name & Description */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Power Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter power name..."
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what your power does..."
                  rows={3}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Action Type */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Action Type</h3>
            <div className="flex flex-wrap gap-4">
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="px-4 py-2 border border-neutral-300 rounded-lg"
              >
                {ACTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isReaction}
                  onChange={(e) => setIsReaction(e.target.checked)}
                  className="rounded border-neutral-300"
                />
                <span className="text-sm">Reaction</span>
              </label>
            </div>
          </div>

          {/* Range */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Range</h3>
            <div className="flex flex-wrap items-center gap-4">
              <NumberStepper
                value={range.steps}
                onChange={(v) => setRange((r) => ({ ...r, steps: v }))}
                label="Range:"
                min={0}
                max={10}
              />
              <span className="text-sm text-text-secondary">
                {range.steps === 0 ? '(1 Space / Melee)' : `(${range.steps * 3} spaces)`}
              </span>
              <label className="flex items-center gap-2 ml-4">
                <input
                  type="checkbox"
                  checked={range.applyDuration || false}
                  onChange={(e) => setRange((r) => ({ ...r, applyDuration: e.target.checked }))}
                  className="rounded border-neutral-300"
                />
                <span className="text-sm">Apply Duration</span>
              </label>
            </div>
          </div>

          {/* Area of Effect */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Area of Effect</h3>
            <div className="flex flex-wrap items-center gap-4">
              <select
                value={area.type}
                onChange={(e) => setArea((a) => ({ ...a, type: e.target.value as AreaConfig['type'] }))}
                className="px-4 py-2 border border-neutral-300 rounded-lg"
              >
                {AREA_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {area.type !== 'none' && (
                <>
                  <NumberStepper
                    value={area.level}
                    onChange={(v) => setArea((a) => ({ ...a, level: v }))}
                    label="Level:"
                    min={1}
                    max={10}
                  />
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={area.applyDuration || false}
                      onChange={(e) => setArea((a) => ({ ...a, applyDuration: e.target.checked }))}
                      className="rounded border-neutral-300"
                    />
                    <span className="text-sm">Apply Duration</span>
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Duration */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Duration</h3>
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <select
                value={duration.type}
                onChange={(e) => {
                  const newType = e.target.value as DurationConfig['type'];
                  // Reset value to first option when changing type
                  const newValue = DURATION_VALUES[newType]?.[0]?.value || 1;
                  setDuration((d) => ({ ...d, type: newType, value: newValue }));
                }}
                className="px-4 py-2 border border-neutral-300 rounded-lg"
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
                  onChange={(e) => setDuration((d) => ({ ...d, value: parseInt(e.target.value) }))}
                  className="px-4 py-2 border border-neutral-300 rounded-lg"
                >
                  {DURATION_VALUES[duration.type].map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {/* Duration Modifiers */}
            <div className="flex flex-wrap gap-4 pt-3 border-t border-neutral-200">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={duration.focus || false}
                  onChange={(e) => setDuration((d) => ({ ...d, focus: e.target.checked }))}
                  className="rounded border-neutral-300"
                />
                <span className="text-sm">Focus</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={duration.noHarm || false}
                  onChange={(e) => setDuration((d) => ({ ...d, noHarm: e.target.checked }))}
                  className="rounded border-neutral-300"
                />
                <span className="text-sm">No Harm or Adaptation Parts</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={duration.endsOnActivation || false}
                  onChange={(e) => setDuration((d) => ({ ...d, endsOnActivation: e.target.checked }))}
                  className="rounded border-neutral-300"
                />
                <span className="text-sm">Ends on Activation</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm">Sustain:</span>
                <select
                  value={duration.sustain || 0}
                  onChange={(e) => setDuration((d) => ({ ...d, sustain: parseInt(e.target.value) }))}
                  className="px-2 py-1 border border-neutral-300 rounded text-sm"
                >
                  <option value={0}>None</option>
                  <option value={1}>1 AP</option>
                  <option value={2}>2 AP</option>
                  <option value={3}>3 AP</option>
                  <option value={4}>4 AP</option>
                </select>
              </div>
            </div>
          </div>

          {/* Power Parts */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text-primary">
                Power Parts ({selectedParts.length})
              </h3>
              <button
                type="button"
                onClick={addPart}
                className="flex items-center gap-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Part
              </button>
            </div>

            {selectedParts.length === 0 ? (
              <div className="text-center py-8 text-text-muted">
                <Info className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No parts added yet. Click &quot;Add Part&quot; to begin building your power.</p>
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
                    allParts={nonMechanicParts}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Advanced Power Mechanics */}
          <AdvancedMechanicsSection
            powerParts={powerParts}
            selectedAdvancedParts={selectedAdvancedParts}
            onAdd={addAdvancedPart}
            onRemove={removeAdvancedPart}
            onUpdate={updateAdvancedPart}
          />

          {/* Damage (Optional) */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Damage (Optional)</h3>
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
                  className="px-3 py-2 border border-neutral-300 rounded-lg"
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
                className="px-3 py-2 border border-neutral-300 rounded-lg"
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
        </div>

        {/* Sidebar - Cost Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
            <h3 className="text-lg font-bold text-text-primary mb-4">Power Summary</h3>

            {/* Cost Display */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <Zap className="w-6 h-6 mx-auto text-blue-600 mb-1" />
                <div className="text-3xl font-bold text-blue-600">{costs.totalEnergy}</div>
                <div className="text-xs text-blue-600">Energy Cost</div>
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
                <span className="text-text-secondary">Action:</span>
                <span className="font-medium">{actionTypeDisplay}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Range:</span>
                <span className="font-medium">{rangeDisplay}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Area:</span>
                <span className="font-medium">{areaDisplay}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Duration:</span>
                <span className="font-medium">{durationDisplay}</span>
              </div>
            </div>

            {/* TP Sources */}
            {costs.tpSources.length > 0 && (
              <div className="border-t border-neutral-100 pt-4">
                <h4 className="text-sm font-medium text-text-secondary mb-2">TP Breakdown</h4>
                <ul className="text-xs text-text-secondary space-y-1">
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
        returnPath="/power-creator"
        contentType="power"
      />
    </div>
  );
}

export default function PowerCreatorPage() {
  return (
    <div className="min-h-screen bg-neutral-50 py-8 px-4">
      <PowerCreatorContent />
    </div>
  );
}
