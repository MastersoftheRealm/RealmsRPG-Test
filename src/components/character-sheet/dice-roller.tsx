/**
 * Dice Roller Component
 * =====================
 * A component for rolling dice with modifiers.
 * Displays roll history and supports various die types.
 */

'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, X, History, Trash2 } from 'lucide-react';
import { ValueStepper } from '@/components/shared';

interface DieRoll {
  id: string;
  dieType: number;
  count: number;
  modifier: number;
  results: number[];
  total: number;
  label?: string;
  timestamp: Date;
}

interface DiceRollerProps {
  className?: string;
  onRoll?: (roll: DieRoll) => void;
}

// Generate random die roll
function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

// Die type buttons
const DIE_TYPES = [4, 6, 8, 10, 12, 20] as const;

// Get appropriate icon for display
function DieIcon({ value, className }: { value: number; className?: string }) {
  const icons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];
  const Icon = icons[Math.min(value - 1, 5)] || Dice6;
  return <Icon className={className} />;
}

export function DiceRoller({ className, onRoll }: DiceRollerProps) {
  const [dieType, setDieType] = useState<number>(20);
  const [dieCount, setDieCount] = useState<number>(1);
  const [modifier, setModifier] = useState<number>(0);
  const [rollHistory, setRollHistory] = useState<DieRoll[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const performRoll = useCallback((label?: string) => {
    const results: number[] = [];
    for (let i = 0; i < dieCount; i++) {
      results.push(rollDie(dieType));
    }
    const total = results.reduce((sum, r) => sum + r, 0) + modifier;

    const roll: DieRoll = {
      id: Date.now().toString(),
      dieType,
      count: dieCount,
      modifier,
      results,
      total,
      label,
      timestamp: new Date(),
    };

    setRollHistory(prev => [roll, ...prev.slice(0, 49)]); // Keep last 50 rolls
    onRoll?.(roll);
    
    return roll;
  }, [dieType, dieCount, modifier, onRoll]);

  const clearHistory = () => {
    setRollHistory([]);
  };

  const formatModifier = (mod: number) => {
    if (mod === 0) return '';
    return mod > 0 ? `+${mod}` : `${mod}`;
  };

  const formatRollFormula = () => {
    const formula = `${dieCount}d${dieType}`;
    const mod = formatModifier(modifier);
    return mod ? `${formula}${mod}` : formula;
  };

  const lastRoll = rollHistory[0];

  return (
    <div className={cn('bg-white rounded-xl shadow-md p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-text-primary">🎲 Dice Roller</h3>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={cn(
            'p-2 rounded-lg transition-colors',
            showHistory ? 'bg-primary-100 text-primary-700' : 'text-text-muted hover:bg-neutral-100'
          )}
          title="Roll history"
        >
          <History className="w-5 h-5" />
        </button>
      </div>

      {!showHistory ? (
        <>
          {/* Die Type Selection */}
          <div className="grid grid-cols-6 gap-1 mb-4">
            {DIE_TYPES.map((die) => (
              <button
                key={die}
                onClick={() => setDieType(die)}
                className={cn(
                  'py-2 px-1 rounded-lg text-sm font-bold transition-colors',
                  dieType === die
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 text-text-secondary hover:bg-neutral-200'
                )}
              >
                d{die}
              </button>
            ))}
          </div>

          {/* Count and Modifier */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <ValueStepper
                value={dieCount}
                onChange={setDieCount}
                min={1}
                max={10}
                size="sm"
                enableHoldRepeat
              />
              <span className="text-sm text-text-secondary">dice</span>
            </div>

            <div className="flex items-center gap-2">
              <ValueStepper
                value={modifier}
                onChange={setModifier}
                size="sm"
                formatValue={(v) => formatModifier(v) || '±0'}
                colorValue
                enableHoldRepeat
              />
              <span className="text-sm text-text-secondary">mod</span>
            </div>
          </div>

          {/* Roll Button */}
          <button
            onClick={() => performRoll()}
            className="w-full py-3 bg-gradient-to-b from-primary-500 to-primary-700 text-white font-bold rounded-xl hover:from-primary-600 hover:to-primary-800 transition-all shadow-md hover:shadow-lg"
          >
            Roll {formatRollFormula()}
          </button>

          {/* Last Roll Result */}
          {lastRoll && (
            <div className="mt-4 p-4 bg-neutral-50 rounded-xl text-center">
              <div className="text-sm text-text-secondary mb-1">
                {lastRoll.count}d{lastRoll.dieType}{formatModifier(lastRoll.modifier)}
              </div>
              <div className="text-4xl font-bold text-primary-600 mb-2">
                {lastRoll.total}
              </div>
              <div className="flex items-center justify-center gap-1 text-sm text-text-muted">
                {lastRoll.results.map((r, i) => (
                  <span key={i} className={cn(
                    'px-2 py-0.5 rounded',
                    r === lastRoll.dieType ? 'bg-green-200 text-green-800' :
                    r === 1 ? 'bg-red-200 text-red-800' : 'bg-neutral-200'
                  )}>
                    {r}
                  </span>
                ))}
                {lastRoll.modifier !== 0 && (
                  <span className={cn(
                    'px-2 py-0.5',
                    lastRoll.modifier > 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {formatModifier(lastRoll.modifier)}
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        /* Roll History */
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-secondary">Recent Rolls</span>
            <button
              onClick={clearHistory}
              className="p-1 text-text-muted hover:text-red-500 transition-colors"
              title="Clear history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          
          {rollHistory.length === 0 ? (
            <p className="text-center text-text-muted py-4">No rolls yet</p>
          ) : (
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {rollHistory.map((roll) => (
                <div key={roll.id} className="flex items-center justify-between p-2 bg-neutral-50 rounded-lg">
                  <div>
                    <span className="font-medium text-text-primary">
                      {roll.count}d{roll.dieType}{formatModifier(roll.modifier)}
                    </span>
                    {roll.label && (
                      <span className="ml-2 text-xs text-text-muted">{roll.label}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted">
                      [{roll.results.join(', ')}]
                    </span>
                    <span className="font-bold text-primary-600">= {roll.total}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Export types for use elsewhere
export type { DieRoll };
