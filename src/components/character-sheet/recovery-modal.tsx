/**
 * Recovery Modal
 * ===============
 * Modal for character recovery with full and partial recovery options.
 * 
 * Full Recovery: Restores HP, EN, and all feat/trait uses to max.
 * Partial Recovery: 2/4/6 hours with 1/4 resource allocation per 2 hours.
 *   - User can manually allocate quarters to HP or EN
 *   - Automatic mode optimizes allocation based on deficit percentages
 *   - Resets feats/traits with "Partial" recovery period
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { Moon, Sun, Clock, Zap, Heart, Sparkles, RotateCcw } from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import { cn } from '@/lib/utils';

interface RecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentHealth: number;
  maxHealth: number;
  currentEnergy: number;
  maxEnergy: number;
  /** Feats with uses that can be recovered */
  feats?: Array<{
    id: string | number;
    name: string;
    currentUses?: number;
    maxUses?: number;
    recovery?: string; // 'Full' | 'Partial' | etc.
  }>;
  /** Traits with uses that can be recovered */
  traits?: Array<{
    name: string;
    currentUses?: number;
    maxUses?: number;
    recovery?: string; // 'Full' | 'Partial' | etc.
  }>;
  onConfirmFullRecovery: () => void;
  onConfirmPartialRecovery: (hpRestored: number, enRestored: number, resetPartialFeats: boolean) => void;
}

type RecoveryMode = 'full' | 'partial';
type PartialHours = 2 | 4 | 6;
type AllocationMode = 'manual' | 'automatic';

// Round up helper
const roundUp = (value: number): number => Math.ceil(value);

export function RecoveryModal({
  isOpen,
  onClose,
  currentHealth,
  maxHealth,
  currentEnergy,
  maxEnergy,
  feats = [],
  traits = [],
  onConfirmFullRecovery,
  onConfirmPartialRecovery,
}: RecoveryModalProps) {
  const [mode, setMode] = useState<RecoveryMode>('full');
  const [hours, setHours] = useState<PartialHours>(4);
  const [allocationMode, setAllocationMode] = useState<AllocationMode>('automatic');
  
  // Manual allocation: how many quarters go to HP (rest go to EN)
  const totalQuarters = hours / 2;
  const [hpQuarters, setHpQuarters] = useState<number>(Math.ceil(totalQuarters / 2));
  
  // Calculate deficits
  const hpDeficit = maxHealth - currentHealth;
  const enDeficit = maxEnergy - currentEnergy;
  const hpDeficitPercent = maxHealth > 0 ? hpDeficit / maxHealth : 0;
  const enDeficitPercent = maxEnergy > 0 ? enDeficit / maxEnergy : 0;
  
  // Calculate what each quarter restores
  const hpPerQuarter = roundUp(maxHealth / 4);
  const enPerQuarter = roundUp(maxEnergy / 4);
  
  // Automatic allocation: optimize based on percentage recovered
  const autoAllocation = useMemo(() => {
    if (hpDeficit === 0 && enDeficit === 0) {
      // Both full - doesn't matter, split evenly
      const halfQuarters = Math.floor(totalQuarters / 2);
      return { hp: halfQuarters, en: totalQuarters - halfQuarters };
    }
    
    if (hpDeficit === 0) {
      // HP full, all to EN
      return { hp: 0, en: totalQuarters };
    }
    
    if (enDeficit === 0) {
      // EN full, all to HP
      return { hp: totalQuarters, en: 0 };
    }
    
    // Both have deficits - find optimal allocation
    // Try all possible allocations and pick the one with highest total % recovered
    let bestAllocation = { hp: 0, en: 0 };
    let bestScore = -1;
    
    for (let hpQ = 0; hpQ <= totalQuarters; hpQ++) {
      const enQ = totalQuarters - hpQ;
      
      // Calculate how much would be restored (capped at deficit)
      const hpRestored = Math.min(hpQ * hpPerQuarter, hpDeficit);
      const enRestored = Math.min(enQ * enPerQuarter, enDeficit);
      
      // Calculate percentage of total possible recovery
      const hpRecoveredPercent = maxHealth > 0 ? hpRestored / maxHealth : 0;
      const enRecoveredPercent = maxEnergy > 0 ? enRestored / maxEnergy : 0;
      const totalScore = hpRecoveredPercent + enRecoveredPercent;
      
      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestAllocation = { hp: hpQ, en: enQ };
      } else if (totalScore === bestScore) {
        // When tied, prefer balanced allocation
        const currentBalance = Math.abs(bestAllocation.hp - bestAllocation.en);
        const newBalance = Math.abs(hpQ - enQ);
        if (newBalance < currentBalance) {
          bestAllocation = { hp: hpQ, en: enQ };
        }
      }
    }
    
    return bestAllocation;
  }, [totalQuarters, hpDeficit, enDeficit, hpPerQuarter, enPerQuarter, maxHealth, maxEnergy]);
  
  // Get current allocation based on mode
  const currentAllocation = allocationMode === 'automatic' 
    ? autoAllocation 
    : { hp: hpQuarters, en: totalQuarters - hpQuarters };
  
  // Calculate restored amounts
  const hpRestored = Math.min(currentAllocation.hp * hpPerQuarter, hpDeficit);
  const enRestored = Math.min(currentAllocation.en * enPerQuarter, enDeficit);
  
  // New totals after recovery
  const newHealth = currentHealth + hpRestored;
  const newEnergy = currentEnergy + enRestored;
  
  // Count feats/traits that will be reset
  const partialFeatsCount = feats.filter(f => 
    f.recovery?.toLowerCase().includes('partial') && 
    f.maxUses && 
    (f.currentUses || 0) < f.maxUses
  ).length;
  
  const partialTraitsCount = traits.filter(t => 
    t.recovery?.toLowerCase().includes('partial') && 
    t.maxUses && 
    (t.currentUses || 0) < t.maxUses
  ).length;
  
  const fullFeatsCount = feats.filter(f => 
    (f.recovery?.toLowerCase().includes('full') || !f.recovery) && 
    f.maxUses && 
    (f.currentUses || 0) < f.maxUses
  ).length;
  
  const fullTraitsCount = traits.filter(t => 
    (t.recovery?.toLowerCase().includes('full') || !t.recovery) && 
    t.maxUses && 
    (t.currentUses || 0) < t.maxUses
  ).length;
  
  const handleConfirm = useCallback(() => {
    if (mode === 'full') {
      onConfirmFullRecovery();
    } else {
      onConfirmPartialRecovery(hpRestored, enRestored, true);
    }
    onClose();
  }, [mode, hpRestored, enRestored, onConfirmFullRecovery, onConfirmPartialRecovery, onClose]);
  
  // Update hpQuarters when hours change
  const handleHoursChange = (newHours: PartialHours) => {
    setHours(newHours);
    const newTotalQuarters = newHours / 2;
    setHpQuarters(Math.ceil(newTotalQuarters / 2));
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Recovery"
      size="md"
    >
      <div className="space-y-6">
        {/* Mode Selection */}
        <div className="flex gap-2">
          <button
            onClick={() => setMode('full')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all',
              mode === 'full'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-border-light hover:border-blue-300 hover:bg-blue-50/50'
            )}
          >
            <Moon className="w-5 h-5" />
            <span className="font-medium">Full Recovery</span>
          </button>
          <button
            onClick={() => setMode('partial')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all',
              mode === 'partial'
                ? 'border-amber-500 bg-amber-50 text-amber-700'
                : 'border-border-light hover:border-amber-300 hover:bg-amber-50/50'
            )}
          >
            <Clock className="w-5 h-5" />
            <span className="font-medium">Partial Recovery</span>
          </button>
        </div>
        
        {/* Full Recovery Info */}
        {mode === 'full' && (
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              A full recovery restores all resources to maximum and resets all ability uses.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              {/* HP Recovery */}
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <Heart className="w-6 h-6 text-red-500" />
                <div>
                  <div className="text-xs text-text-muted">Health</div>
                  <div className="font-bold">
                    {currentHealth} → <span className="text-green-600">{maxHealth}</span>
                  </div>
                </div>
              </div>
              
              {/* EN Recovery */}
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <Zap className="w-6 h-6 text-blue-500" />
                <div>
                  <div className="text-xs text-text-muted">Energy</div>
                  <div className="font-bold">
                    {currentEnergy} → <span className="text-green-600">{maxEnergy}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Feat/Trait Reset Info */}
            {(fullFeatsCount > 0 || fullTraitsCount > 0 || partialFeatsCount > 0 || partialTraitsCount > 0) && (
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <RotateCcw className="w-4 h-4" />
                <span>
                  Resets {fullFeatsCount + partialFeatsCount + fullTraitsCount + partialTraitsCount} ability uses
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* Partial Recovery Options */}
        {mode === 'partial' && (
          <div className="space-y-4">
            {/* Hours Selection */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Recovery Duration
              </label>
              <div className="flex gap-2">
                {([2, 4, 6] as PartialHours[]).map((h) => (
                  <button
                    key={h}
                    onClick={() => handleHoursChange(h)}
                    className={cn(
                      'flex-1 py-2 px-4 rounded-lg border-2 font-medium transition-all',
                      hours === h
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-border-light hover:border-amber-300'
                    )}
                  >
                    {h} hours
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-text-muted">
                {totalQuarters} quarter{totalQuarters > 1 ? 's' : ''} of resources to allocate 
                ({hpPerQuarter} HP or {enPerQuarter} EN per quarter)
              </p>
            </div>
            
            {/* Allocation Mode */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Allocation Mode
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setAllocationMode('automatic')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border-2 transition-all',
                    allocationMode === 'automatic'
                      ? 'border-violet-500 bg-violet-50 text-violet-700'
                      : 'border-border-light hover:border-violet-300'
                  )}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Automatic</span>
                </button>
                <button
                  onClick={() => setAllocationMode('manual')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border-2 transition-all',
                    allocationMode === 'manual'
                      ? 'border-violet-500 bg-violet-50 text-violet-700'
                      : 'border-border-light hover:border-violet-300'
                  )}
                >
                  <Sun className="w-4 h-4" />
                  <span>Manual</span>
                </button>
              </div>
            </div>
            
            {/* Manual Allocation Slider */}
            {allocationMode === 'manual' && (
              <div className="space-y-3 p-4 bg-surface-alt rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-red-600 font-medium">
                    <Heart className="w-4 h-4" />
                    HP: {hpQuarters}/{totalQuarters}
                  </span>
                  <span className="flex items-center gap-1 text-blue-600 font-medium">
                    EN: {totalQuarters - hpQuarters}/{totalQuarters}
                    <Zap className="w-4 h-4" />
                  </span>
                </div>
                
                <input
                  type="range"
                  min="0"
                  max={totalQuarters}
                  value={hpQuarters}
                  onChange={(e) => setHpQuarters(Number(e.target.value))}
                  className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, 
                      #ef4444 0%, 
                      #ef4444 ${(hpQuarters / totalQuarters) * 100}%, 
                      #3b82f6 ${(hpQuarters / totalQuarters) * 100}%, 
                      #3b82f6 100%)`
                  }}
                />
                
                <div className="flex justify-between text-xs text-text-muted">
                  <span>All to HP</span>
                  <span>All to EN</span>
                </div>
              </div>
            )}
            
            {/* Preview */}
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h4 className="text-sm font-semibold text-amber-800 mb-3">Recovery Preview</h4>
              
              <div className="grid grid-cols-2 gap-4">
                {/* HP Recovery */}
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  <Heart className="w-6 h-6 text-red-500" />
                  <div>
                    <div className="text-xs text-text-muted">Health</div>
                    <div className="font-bold">
                      {currentHealth} → <span className={hpRestored > 0 ? 'text-green-600' : 'text-text-muted'}>{newHealth}</span>
                    </div>
                    <div className="text-xs text-green-600">
                      +{hpRestored} HP ({currentAllocation.hp}/4)
                    </div>
                  </div>
                </div>
                
                {/* EN Recovery */}
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  <Zap className="w-6 h-6 text-blue-500" />
                  <div>
                    <div className="text-xs text-text-muted">Energy</div>
                    <div className="font-bold">
                      {currentEnergy} → <span className={enRestored > 0 ? 'text-green-600' : 'text-text-muted'}>{newEnergy}</span>
                    </div>
                    <div className="text-xs text-green-600">
                      +{enRestored} EN ({currentAllocation.en}/4)
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Feat/Trait Reset Info */}
              {(partialFeatsCount > 0 || partialTraitsCount > 0) && (
                <div className="flex items-center gap-2 mt-3 text-sm text-amber-700">
                  <RotateCcw className="w-4 h-4" />
                  <span>
                    Resets {partialFeatsCount + partialTraitsCount} partial-recovery ability uses
                  </span>
                </div>
              )}
              
              {allocationMode === 'automatic' && (
                <p className="mt-3 text-xs text-amber-700 italic">
                  Automatic mode optimizes allocation for maximum total recovery.
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border-light">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleConfirm}
            className={mode === 'full' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-600 hover:bg-amber-700'}
          >
            {mode === 'full' ? 'Full Recovery' : `Recover (${hours}h)`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default RecoveryModal;
