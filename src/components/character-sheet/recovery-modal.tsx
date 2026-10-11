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
import { SegmentedControl } from '@/components/patterns';
import {
  autoRecoveryQuarters,
  formatRecoveredAmount,
  partialAmountRestored,
  quarterRestoreAmount,
  resourceAfterFullRecovery,
} from '@/lib/character/recovery-over-max';
import { statusPanel } from '@/lib/ui/status-surface-classes';
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
    currentUses?: number | undefined;
    maxUses?: number | undefined;
    recovery?: string | undefined; // 'Full' | 'Partial' | etc.
  }>;
  /** Traits with uses that can be recovered */
  traits?: Array<{
    name: string;
    currentUses?: number | undefined;
    maxUses?: number | undefined;
    recovery?: string | undefined; // 'Full' | 'Partial' | etc.
  }>;
  onConfirmFullRecovery: () => void;
  onConfirmPartialRecovery: (
    hpRestored: number,
    enRestored: number,
    resetPartialFeats: boolean,
  ) => void;
}

type RecoveryMode = 'full' | 'partial';
/** String keys so SegmentedControl can type the hours group. */
type PartialHours = '2' | '4' | '6';
type AllocationMode = 'manual' | 'automatic';

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
  const [hours, setHours] = useState<PartialHours>('4');
  const [allocationMode, setAllocationMode] = useState<AllocationMode>('automatic');

  // Each 2h = 2 quarters (1 for HP, 1 for EN). 2h=2, 4h=4, 6h=6 quarters total to allocate.
  const totalQuarters = Number(hours);
  const [hpQuarters, setHpQuarters] = useState(2);

  // Calculate what each quarter restores
  const hpPerQuarter = quarterRestoreAmount(maxHealth);
  const enPerQuarter = quarterRestoreAmount(maxEnergy);

  // Automatic allocation: optimize based on percentage recovered.
  // A pool already at or above max has no gap, so those quarters go to the other pool.
  const autoAllocation = useMemo(
    () =>
      autoRecoveryQuarters({
        totalQuarters,
        currentHealth,
        maxHealth,
        currentEnergy,
        maxEnergy,
      }),
    [totalQuarters, currentHealth, maxHealth, currentEnergy, maxEnergy],
  );

  // Get current allocation based on mode
  const currentAllocation =
    allocationMode === 'automatic'
      ? autoAllocation
      : { hp: hpQuarters, en: totalQuarters - hpQuarters };

  // Restored amounts stop at max and are never negative. Over-max stays put.
  const hpRestored = partialAmountRestored(
    currentAllocation.hp,
    hpPerQuarter,
    currentHealth,
    maxHealth,
  );
  const enRestored = partialAmountRestored(
    currentAllocation.en,
    enPerQuarter,
    currentEnergy,
    maxEnergy,
  );

  // New totals after recovery
  const newHealth = currentHealth + hpRestored;
  const newEnergy = currentEnergy + enRestored;
  const fullHealth = resourceAfterFullRecovery(currentHealth, maxHealth);
  const fullEnergy = resourceAfterFullRecovery(currentEnergy, maxEnergy);

  // Count feats/traits that will be reset
  const partialFeatsCount = feats.filter(
    (f) =>
      f.recovery?.toLowerCase().includes('partial') &&
      f.maxUses &&
      (f.currentUses || 0) < f.maxUses,
  ).length;

  const partialTraitsCount = traits.filter(
    (t) =>
      t.recovery?.toLowerCase().includes('partial') &&
      t.maxUses &&
      (t.currentUses || 0) < t.maxUses,
  ).length;

  const fullFeatsCount = feats.filter(
    (f) =>
      (f.recovery?.toLowerCase().includes('full') || !f.recovery) &&
      f.maxUses &&
      (f.currentUses || 0) < f.maxUses,
  ).length;

  const fullTraitsCount = traits.filter(
    (t) =>
      (t.recovery?.toLowerCase().includes('full') || !t.recovery) &&
      t.maxUses &&
      (t.currentUses || 0) < t.maxUses,
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
    const newTotalQuarters = Number(newHours);
    setHpQuarters(Math.floor(newTotalQuarters / 2));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      fullScreenOnMobile
      flexLayout
      title="Recovery"
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="lg" onClick={handleConfirm}>
            {mode === 'full' ? 'Full Recovery' : `Recover (${hours}h)`}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Mode Selection */}
        <SegmentedControl<RecoveryMode>
          value={mode}
          onChange={setMode}
          equalWidth
          aria-label="Recovery mode"
          options={[
            {
              value: 'full',
              label: 'Full Recovery',
              icon: <Moon className="h-4 w-4" aria-hidden />,
            },
            {
              value: 'partial',
              label: 'Partial Recovery',
              icon: <Clock className="h-4 w-4" aria-hidden />,
            },
          ]}
        />

        {/* Full Recovery Info */}
        {mode === 'full' && (
          <div className="space-y-4 rounded-lg border border-primary-subtle-border bg-primary-subtle-bg p-4">
            <p className="text-sm text-primary-subtle-fg">
              A full recovery restores Health and Energy that are below maximum, and resets all
              ability uses. Health or Energy already above maximum stays there.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {/* HP Recovery */}
              <div className="flex items-center gap-3 rounded-lg bg-surface p-3">
                <Heart className="h-6 w-6 text-success-fg" />
                <div>
                  <div className="text-xs text-text-muted">Health</div>
                  <div className="font-bold">
                    {currentHealth} →{' '}
                    <span
                      className={cn(
                        fullHealth > currentHealth ? 'text-success-fg' : 'text-text-primary',
                      )}
                    >
                      {fullHealth}
                    </span>
                  </div>
                </div>
              </div>

              {/* EN Recovery */}
              <div className="flex items-center gap-3 rounded-lg bg-surface p-3">
                <Zap className="h-6 w-6 text-info-fg" />
                <div>
                  <div className="text-xs text-text-muted">Energy</div>
                  <div className="font-bold">
                    {currentEnergy} →{' '}
                    <span
                      className={cn(
                        fullEnergy > currentEnergy ? 'text-success-fg' : 'text-text-primary',
                      )}
                    >
                      {fullEnergy}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feat/Trait Reset Info */}
            {(fullFeatsCount > 0 ||
              fullTraitsCount > 0 ||
              partialFeatsCount > 0 ||
              partialTraitsCount > 0) && (
              <div className="flex items-center gap-2 text-sm text-info-fg">
                <RotateCcw className="h-4 w-4" />
                <span>
                  Resets {fullFeatsCount + partialFeatsCount + fullTraitsCount + partialTraitsCount}{' '}
                  ability uses
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
              <p className="mb-2 block text-sm font-medium text-text-secondary">
                Recovery Duration
              </p>
              <SegmentedControl<PartialHours>
                value={hours}
                onChange={handleHoursChange}
                equalWidth
                aria-label="Recovery duration"
                options={[
                  { value: '2', label: '2 hours' },
                  { value: '4', label: '4 hours' },
                  { value: '6', label: '6 hours' },
                ]}
              />
              <p className="mt-2 text-xs text-text-muted">
                Each 2 hours = 2 quarters (¼ HP + ¼ EN, or allocate freely).
                {hours}h = {totalQuarters} quarter{totalQuarters > 1 ? 's' : ''} ({hpPerQuarter} HP
                or {enPerQuarter} EN per quarter). Full recovery (8h) restores all.
              </p>
            </div>

            {/* Allocation Mode */}
            <div>
              <p className="mb-2 block text-sm font-medium text-text-secondary">Allocation Mode</p>
              <SegmentedControl<AllocationMode>
                value={allocationMode}
                onChange={setAllocationMode}
                equalWidth
                aria-label="Allocation mode"
                options={[
                  {
                    value: 'automatic',
                    label: 'Automatic',
                    icon: <Sparkles className="h-4 w-4" aria-hidden />,
                  },
                  {
                    value: 'manual',
                    label: 'Manual',
                    icon: <Sun className="h-4 w-4" aria-hidden />,
                  },
                ]}
              />
            </div>

            {/* Manual Allocation Slider */}
            {allocationMode === 'manual' && (
              <div className="space-y-3 rounded-lg bg-surface-alt p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 font-medium text-success-fg">
                    <Heart className="h-4 w-4" />
                    HP: {hpQuarters}/{totalQuarters}
                  </span>
                  <span className="flex items-center gap-1 font-medium text-info-fg">
                    EN: {totalQuarters - hpQuarters}/{totalQuarters}
                    <Zap className="h-4 w-4" />
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max={totalQuarters}
                  value={hpQuarters}
                  onChange={(e) => setHpQuarters(Number(e.target.value))}
                  aria-label="Allocate quarters between Health and Energy"
                  className="h-3 w-full cursor-pointer appearance-none rounded-lg"
                  style={{
                    background: `linear-gradient(to right, 
                      var(--color-health) 0%, 
                      var(--color-health) ${(hpQuarters / totalQuarters) * 100}%, 
                      var(--color-energy) ${(hpQuarters / totalQuarters) * 100}%, 
                      var(--color-energy) 100%)`,
                  }}
                />

                <div className="flex justify-between text-xs text-text-muted">
                  <span>All to HP</span>
                  <span>All to EN</span>
                </div>
              </div>
            )}

            {/* Preview */}
            <div className={cn('rounded-lg border p-4', statusPanel.warning)}>
              <h3 className="mb-3 text-sm font-semibold text-warning-fg">Recovery Preview</h3>

              <div className="grid grid-cols-2 gap-4">
                {/* HP Recovery */}
                <div className="flex items-center gap-3 rounded-lg bg-surface p-3">
                  <Heart className="h-6 w-6 text-success-fg" />
                  <div>
                    <div className="text-xs text-text-muted">Health</div>
                    <div className="font-bold">
                      {currentHealth} →{' '}
                      <span className={cn(hpRestored > 0 ? 'text-success-fg' : 'text-text-muted')}>
                        {newHealth}
                      </span>
                    </div>
                    <div className="text-xs text-success-fg">
                      {formatRecoveredAmount(hpRestored)} HP ({currentAllocation.hp}/{totalQuarters}{' '}
                      quarters)
                    </div>
                  </div>
                </div>

                {/* EN Recovery */}
                <div className="flex items-center gap-3 rounded-lg bg-surface p-3">
                  <Zap className="h-6 w-6 text-info-fg" />
                  <div>
                    <div className="text-xs text-text-muted">Energy</div>
                    <div className="font-bold">
                      {currentEnergy} →{' '}
                      <span className={cn(enRestored > 0 ? 'text-success-fg' : 'text-text-muted')}>
                        {newEnergy}
                      </span>
                    </div>
                    <div className="text-xs text-success-fg">
                      {formatRecoveredAmount(enRestored)} EN ({currentAllocation.en}/{totalQuarters}{' '}
                      quarters)
                    </div>
                  </div>
                </div>
              </div>

              {/* Feat/Trait Reset Info */}
              {(partialFeatsCount > 0 || partialTraitsCount > 0) && (
                <div className="mt-3 flex items-center gap-2 text-sm text-warning-fg">
                  <RotateCcw className="h-4 w-4" />
                  <span>
                    Resets {partialFeatsCount + partialTraitsCount} partial-recovery ability uses
                  </span>
                </div>
              )}

              {allocationMode === 'automatic' && (
                <p className="mt-3 text-xs text-warning-fg italic">
                  Automatic mode optimizes allocation for maximum total recovery.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
