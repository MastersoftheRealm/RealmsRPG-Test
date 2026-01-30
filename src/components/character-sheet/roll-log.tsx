/**
 * Roll Log Component
 * ==================
 * Fixed-position dice rolling panel matching vanilla site's roll-log.
 * Features: Dice pool builder, roll history, color-coded roll types,
 * critical success/fail highlighting, and smooth animations.
 * Uses RollContext to share roll state with other components.
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { Dices, X, Trash2, Plus, Minus } from 'lucide-react';
import { useRolls, type RollEntry, type RollType, type DieResult } from './roll-context';

// Re-export types for convenience
export type { RollEntry, RollType, DieResult };
export type DieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';

// Die max values
const DIE_MAX: Record<DieType, number> = {
  d4: 4, d6: 6, d8: 8, d10: 10, d12: 12, d20: 20,
};

// Roll type colors
const ROLL_TYPE_COLORS: Record<RollType, string> = {
  attack: 'border-l-red-500',
  damage: 'border-l-orange-500',
  skill: 'border-l-blue-500',
  ability: 'border-l-purple-500',
  defense: 'border-l-teal-500',
  custom: 'border-l-border',
};

const ROLL_TYPE_ICONS: Record<RollType, string> = {
  attack: '⚔️',
  damage: '💥',
  skill: '🎯',
  ability: '💪',
  defense: '🛡️',
  custom: '🎲',
};

// Dice roller helper
function rollDie(type: DieType): number {
  return Math.floor(Math.random() * DIE_MAX[type]) + 1;
}

function generateRollId(): string {
  return `roll-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

interface RollLogProps {
  className?: string;
}

export function RollLog({ className }: RollLogProps) {
  const { rolls, addRoll, clearHistory, subscribeToRolls } = useRolls();
  const [isOpen, setIsOpen] = React.useState(false);
  
  // Subscribe to roll events to auto-open the log
  React.useEffect(() => {
    const unsubscribe = subscribeToRolls(() => {
      setIsOpen(true);
    });
    return unsubscribe;
  }, [subscribeToRolls]);
  
  // Dice pool state (local to the manual dice builder)
  const [dicePool, setDicePool] = React.useState<Record<DieType, number>>({
    d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0,
  });
  const [modifier, setModifier] = React.useState(0);
  const [rollType, setRollType] = React.useState<RollType>('custom');
  const [rollTitle, setRollTitle] = React.useState('');

  // Add a die to pool
  const addDie = (type: DieType) => {
    setDicePool(prev => ({ ...prev, [type]: Math.min(prev[type] + 1, 20) }));
  };

  // Remove a die from pool
  const removeDie = (type: DieType) => {
    setDicePool(prev => ({ ...prev, [type]: Math.max(prev[type] - 1, 0) }));
  };

  // Clear dice pool
  const clearPool = () => {
    setDicePool({ d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0 });
    setModifier(0);
  };

  // Execute roll
  const executeRoll = () => {
    const diceResults: DieResult[] = [];
    let total = 0;
    let hasD20 = false;
    let d20Value = 0;

    // Roll each die in pool
    Object.entries(dicePool).forEach(([type, count]) => {
      const dieType = type as DieType;
      for (let i = 0; i < count; i++) {
        const value = rollDie(dieType);
        const max = DIE_MAX[dieType];
        diceResults.push({
          type: dieType,
          value,
          isMax: value === max,
          isMin: value === 1,
        });
        total += value;
        
        if (dieType === 'd20') {
          hasD20 = true;
          d20Value = value;
        }
      }
    });

    if (diceResults.length === 0) return;

    total += modifier;

    // Check for critical
    const isCrit = hasD20 && d20Value === 20;
    const isCritFail = hasD20 && d20Value === 1;

    const newRoll: RollEntry = {
      id: generateRollId(),
      type: rollType,
      title: rollTitle || `${rollType.charAt(0).toUpperCase() + rollType.slice(1)} Roll`,
      dice: diceResults,
      modifier,
      total,
      isCrit,
      isCritFail,
      timestamp: new Date(),
    };

    addRoll(newRoll);
    clearPool();
    setRollTitle('');
  };

  // Get total dice count in pool
  const totalDice = Object.values(dicePool).reduce((a, b) => a + b, 0);

  // Format dice formula
  const getDiceFormula = () => {
    const parts: string[] = [];
    Object.entries(dicePool).forEach(([type, count]) => {
      if (count > 0) parts.push(`${count}${type}`);
    });
    if (modifier !== 0) {
      parts.push(modifier > 0 ? `+${modifier}` : `${modifier}`);
    }
    return parts.join(' + ') || 'No dice selected';
  };

  return (
    <div className={cn('fixed bottom-5 right-5 z-[1000] flex flex-col items-end', className)}>
      {/* Panel */}
      <div
        className={cn(
          'absolute bottom-[70px] right-0 w-[360px] max-w-[calc(100vw-40px)]',
          'bg-surface rounded-xl shadow-2xl overflow-hidden',
          'flex flex-col transition-all duration-300',
          isOpen ? 'h-[70vh] max-h-[600px] opacity-100' : 'h-0 opacity-0 pointer-events-none'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-dark to-[#053357] text-white">
          <h3 className="font-bold text-base tracking-wide">🎲 Roll Log</h3>
          <button
            onClick={clearHistory}
            className="px-3 py-1.5 rounded-md bg-white/15 border border-white/30 text-white text-xs font-semibold hover:bg-white/25 transition-colors"
          >
            Clear All
          </button>
        </div>

        {/* Roll History */}
        <div className="flex-1 overflow-y-auto p-2 bg-surface-alt">
          {rolls.length === 0 ? (
            <p className="text-center text-text-muted italic py-10">No rolls yet. Build your dice pool below!</p>
          ) : (
            rolls.map((roll) => (
              <RollEntryCard key={roll.id} roll={roll} />
            ))
          )}
        </div>

        {/* Dice Builder */}
        <div className="p-3 bg-gradient-to-r from-primary-dark to-[#053357] border-t-2 border-border-light">
          {/* Roll Type & Title */}
          <div className="flex gap-2 mb-3">
            <select
              value={rollType}
              onChange={(e) => setRollType(e.target.value as RollType)}
              className="flex-1 px-2 py-1.5 rounded bg-white/10 border border-white/30 text-white text-sm"
            >
              <option value="custom" className="text-gray-900">Custom</option>
              <option value="attack" className="text-gray-900">Attack</option>
              <option value="damage" className="text-gray-900">Damage</option>
              <option value="skill" className="text-gray-900">Skill</option>
              <option value="ability" className="text-gray-900">Ability</option>
              <option value="defense" className="text-gray-900">Defense</option>
            </select>
            <input
              type="text"
              value={rollTitle}
              onChange={(e) => setRollTitle(e.target.value)}
              placeholder="Roll name..."
              className="flex-1 px-2 py-1.5 rounded bg-white/10 border border-white/30 text-white placeholder-white/50 text-sm"
            />
          </div>

          {/* Dice Grid */}
          <div className="grid grid-cols-6 gap-1 mb-3">
            {(['d4', 'd6', 'd8', 'd10', 'd12', 'd20'] as DieType[]).map((die) => (
              <button
                key={die}
                onClick={() => addDie(die)}
                onContextMenu={(e) => { e.preventDefault(); removeDie(die); }}
                className={cn(
                  'flex flex-col items-center justify-center py-2 px-1 rounded',
                  'bg-white/10 hover:bg-white/20 transition-colors text-white',
                  dicePool[die] > 0 && 'ring-2 ring-yellow-400'
                )}
              >
                <span className="text-xs font-bold">{die}</span>
                {dicePool[die] > 0 && (
                  <span className="text-yellow-400 text-sm font-bold">{dicePool[die]}</span>
                )}
              </button>
            ))}
          </div>

          {/* Modifier */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setModifier(m => m - 1)}
                className="w-7 h-7 rounded bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-white font-bold min-w-[40px] text-center">
                {modifier >= 0 ? '+' : ''}{modifier}
              </span>
              <button
                onClick={() => setModifier(m => m + 1)}
                className="w-7 h-7 rounded bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <span className="text-white/70 text-xs flex-1 text-center">
              {getDiceFormula()}
            </span>
            <button
              onClick={clearPool}
              className="text-white/70 hover:text-white text-xs"
            >
              Clear
            </button>
          </div>

          {/* Roll Button */}
          <button
            onClick={executeRoll}
            disabled={totalDice === 0}
            className={cn(
              'w-full py-2.5 rounded-lg font-bold text-white transition-all',
              'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
              'disabled:from-neutral-500 disabled:to-neutral-600 disabled:cursor-not-allowed'
            )}
          >
            🎲 Roll {totalDice > 0 ? `(${totalDice} dice)` : ''}
          </button>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-14 h-14 rounded-full shadow-lg transition-all duration-300',
          'flex items-center justify-center',
          'bg-gradient-to-br from-primary-light to-primary-dark hover:scale-110',
          isOpen && 'from-primary-dark to-[#021a2e]'
        )}
        aria-label={isOpen ? 'Close roll log' : 'Open roll log'}
      >
        <Dices className="w-7 h-7 text-white" />
      </button>
    </div>
  );
}

function RollEntryCard({ roll }: { roll: RollEntry }) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div
      className={cn(
        'bg-surface rounded-lg mb-2 p-3 shadow-sm border-l-4 animate-slide-in-right',
        ROLL_TYPE_COLORS[roll.type],
        roll.isCrit && 'ring-2 ring-green-400',
        roll.isCritFail && 'ring-2 ring-red-400'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm">{ROLL_TYPE_ICONS[roll.type]}</span>
          <span className="font-semibold text-sm text-primary-dark">{roll.title}</span>
        </div>
        <span className="text-xs text-text-muted">{formatTime(roll.timestamp)}</span>
      </div>

      {/* Dice Results */}
      <div className="flex items-center gap-2 flex-wrap">
        {roll.dice.map((die, i) => (
          <span
            key={i}
            className={cn(
              'inline-flex items-center justify-center min-w-[28px] h-7 px-1.5 rounded text-sm font-bold',
              die.type === 'd20'
                ? cn(
                    'w-9 h-9 text-base border-2',
                    die.isMax && 'bg-green-100 border-green-500 text-green-800',
                    die.isMin && 'bg-red-100 border-red-500 text-red-800',
                    !die.isMax && !die.isMin && 'bg-surface-alt border-border-light text-text-primary'
                  )
                : cn(
                    'bg-amber-100 border border-amber-400 text-amber-800'
                  )
            )}
          >
            {die.value}
          </span>
        ))}
        
        {roll.modifier !== 0 && (
          <span className="text-text-muted font-semibold">
            {roll.modifier > 0 ? '+' : ''}{roll.modifier}
          </span>
        )}
        
        <span className="text-text-muted">=</span>
        
        <span className={cn(
          'font-bold text-lg px-3 py-0.5 rounded border',
          roll.isCrit && 'bg-green-100 border-green-400 text-green-800',
          roll.isCritFail && 'bg-red-100 border-red-400 text-red-800',
          !roll.isCrit && !roll.isCritFail && 'bg-blue-50 border-blue-200 text-primary-dark'
        )}>
          {roll.total}
        </span>
      </div>

      {/* Crit Indicators */}
      {roll.isCrit && (
        <div className="mt-2 inline-block px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide bg-gradient-to-r from-green-500 to-teal-500 text-white animate-pulse-dot">
          Critical Success!
        </div>
      )}
      {roll.isCritFail && (
        <div className="mt-2 inline-block px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide bg-gradient-to-r from-red-500 to-red-600 text-white animate-pulse-dot">
          Critical Fail!
        </div>
      )}
    </div>
  );
}

export default RollLog;
