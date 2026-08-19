'use client';

import { useState } from 'react';

export interface CombatantCardResourceQuickActionsProps {
  variant: 'full' | 'compact';
  isLinkedToCharacter: boolean;
  onDamage?: ((amount: number) => void) | undefined;
  onHeal?: ((amount: number) => void) | undefined;
  onEnergyDrain?: ((amount: number) => void) | undefined;
  onEnergyRestore?: ((amount: number) => void) | undefined;
}

export function CombatantCardResourceQuickActions({
  variant,
  isLinkedToCharacter,
  onDamage,
  onHeal,
  onEnergyDrain,
  onEnergyRestore,
}: CombatantCardResourceQuickActionsProps) {
  const [damageInput, setDamageInput] = useState('');
  const [healInput, setHealInput] = useState('');
  const [energyDrainInput, setEnergyDrainInput] = useState('');
  const [energyRestoreInput, setEnergyRestoreInput] = useState('');

  const handleDamage = () => {
    const amount = parseInt(damageInput);
    if (amount > 0 && onDamage) {
      onDamage(amount);
      setDamageInput('');
    }
  };

  const handleHeal = () => {
    const amount = parseInt(healInput);
    if (amount > 0 && onHeal) {
      onHeal(amount);
      setHealInput('');
    }
  };

  const handleEnergyDrain = () => {
    const amount = parseInt(energyDrainInput);
    if (amount > 0 && onEnergyDrain) {
      onEnergyDrain(amount);
      setEnergyDrainInput('');
    }
  };

  const handleEnergyRestore = () => {
    const amount = parseInt(energyRestoreInput);
    if (amount > 0 && onEnergyRestore) {
      onEnergyRestore(amount);
      setEnergyRestoreInput('');
    }
  };

  if (
    variant !== 'full' ||
    isLinkedToCharacter ||
    !onDamage ||
    !onHeal ||
    !onEnergyDrain ||
    !onEnergyRestore
  ) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-0.5 rounded bg-danger-light px-1.5 py-0.5">
        <input
          type="number"
          value={damageInput}
          onChange={(e) => setDamageInput(e.target.value)}
          placeholder="−"
          className="min-h-[var(--touch-target-min,44px)] w-10 rounded border border-danger-300 bg-surface px-1 py-0.5 text-center text-xs md:min-h-0"
          onKeyDown={(e) => e.key === 'Enter' && handleDamage()}
        />
        <button
          onClick={handleDamage}
          className="touch-target-md-compact inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium text-danger-fg hover:opacity-80"
          title="Apply damage"
        >
          Dmg
        </button>
        <span className="text-border-light">|</span>
        <input
          type="number"
          value={healInput}
          onChange={(e) => setHealInput(e.target.value)}
          placeholder="+"
          className="min-h-[var(--touch-target-min,44px)] w-10 rounded border border-success-300 bg-surface px-1 py-0.5 text-center text-xs md:min-h-0"
          onKeyDown={(e) => e.key === 'Enter' && handleHeal()}
        />
        <button
          onClick={handleHeal}
          className="touch-target-md-compact inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium text-success-fg hover:opacity-80"
          title="Apply healing"
        >
          Heal
        </button>
      </div>

      <div className="flex items-center gap-0.5 rounded bg-energy-light px-1.5 py-0.5">
        <input
          type="number"
          value={energyDrainInput}
          onChange={(e) => setEnergyDrainInput(e.target.value)}
          placeholder="−"
          className="min-h-[var(--touch-target-min,44px)] w-10 rounded border border-energy-border bg-surface px-1 py-0.5 text-center text-xs md:min-h-0"
          onKeyDown={(e) => e.key === 'Enter' && handleEnergyDrain()}
        />
        <button
          onClick={handleEnergyDrain}
          className="touch-target-md-compact inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium text-energy-text hover:opacity-80"
          title="Drain energy"
        >
          Use
        </button>
        <span className="text-border-light">|</span>
        <input
          type="number"
          value={energyRestoreInput}
          onChange={(e) => setEnergyRestoreInput(e.target.value)}
          placeholder="+"
          className="min-h-[var(--touch-target-min,44px)] w-10 rounded border border-info-border bg-surface px-1 py-0.5 text-center text-xs md:min-h-0"
          onKeyDown={(e) => e.key === 'Enter' && handleEnergyRestore()}
        />
        <button
          onClick={handleEnergyRestore}
          className="touch-target-md-compact inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium text-info-fg hover:opacity-80"
          title="Restore energy"
        >
          Rest
        </button>
      </div>
    </>
  );
}
