'use client';

import { useState } from 'react';

export interface CombatantCardResourceQuickActionsProps {
  variant: 'full' | 'compact';
  isLinkedToCharacter: boolean;
  onDamage?: (amount: number) => void;
  onHeal?: (amount: number) => void;
  onEnergyDrain?: (amount: number) => void;
  onEnergyRestore?: (amount: number) => void;
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

  if (variant !== 'full' || isLinkedToCharacter || !onDamage || !onHeal || !onEnergyDrain || !onEnergyRestore) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-0.5 bg-danger-light rounded px-1.5 py-0.5">
        <input
          type="number"
          value={damageInput}
          onChange={(e) => setDamageInput(e.target.value)}
          placeholder="−"
          className="w-10 px-1 py-0.5 text-xs bg-surface border border-danger-300 rounded text-center min-h-[var(--touch-target-min,44px)] md:min-h-0"
          onKeyDown={(e) => e.key === 'Enter' && handleDamage()}
        />
        <button
          onClick={handleDamage}
          className="px-1.5 py-0.5 text-xs text-danger-fg hover:opacity-80 font-medium touch-target-md-compact inline-flex items-center justify-center"
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
          className="w-10 px-1 py-0.5 text-xs bg-surface border border-success-300 rounded text-center min-h-[var(--touch-target-min,44px)] md:min-h-0"
          onKeyDown={(e) => e.key === 'Enter' && handleHeal()}
        />
        <button
          onClick={handleHeal}
          className="px-1.5 py-0.5 text-xs text-success-fg hover:opacity-80 font-medium touch-target-md-compact inline-flex items-center justify-center"
          title="Apply healing"
        >
          Heal
        </button>
      </div>

      <div className="flex items-center gap-0.5 bg-energy-light rounded px-1.5 py-0.5">
        <input
          type="number"
          value={energyDrainInput}
          onChange={(e) => setEnergyDrainInput(e.target.value)}
          placeholder="−"
          className="w-10 px-1 py-0.5 text-xs bg-surface border border-energy-border rounded text-center min-h-[var(--touch-target-min,44px)] md:min-h-0"
          onKeyDown={(e) => e.key === 'Enter' && handleEnergyDrain()}
        />
        <button
          onClick={handleEnergyDrain}
          className="px-1.5 py-0.5 text-xs text-energy-text hover:opacity-80 font-medium touch-target-md-compact inline-flex items-center justify-center"
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
          className="w-10 px-1 py-0.5 text-xs bg-surface border border-info-border rounded text-center min-h-[var(--touch-target-min,44px)] md:min-h-0"
          onKeyDown={(e) => e.key === 'Enter' && handleEnergyRestore()}
        />
        <button
          onClick={handleEnergyRestore}
          className="px-1.5 py-0.5 text-xs text-info-fg hover:opacity-80 font-medium touch-target-md-compact inline-flex items-center justify-center"
          title="Restore energy"
        >
          Rest
        </button>
      </div>
    </>
  );
}
