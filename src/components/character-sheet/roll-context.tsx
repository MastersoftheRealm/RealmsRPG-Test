/**
 * Roll Context
 * ============
 * Provides dice rolling functions to all character sheet components.
 * Components can trigger rolls that appear in the RollLog.
 */

'use client';

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';

// Types
export interface DieResult {
  type: 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';
  value: number;
  isMax: boolean;
  isMin: boolean;
}

export type RollType = 'attack' | 'damage' | 'skill' | 'ability' | 'defense' | 'custom';

export interface RollEntry {
  id: string;
  type: RollType;
  title: string;
  dice: DieResult[];
  modifier: number;
  total: number;
  isCrit?: boolean;
  isCritFail?: boolean;
  critMessage?: string;
  timestamp: Date;
}

interface RollContextValue {
  // Roll history
  rolls: RollEntry[];
  
  // Roll functions
  rollAbility: (abilityName: string, bonus: number) => void;
  rollDefense: (defenseName: string, bonus: number) => void;
  rollSkill: (skillName: string, bonus: number) => void;
  rollAttack: (weaponName: string, attackBonus: number) => void;
  rollDamage: (damageStr: string, bonus?: number) => void;
  rollCustom: (title: string, dieType: 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20', count: number, modifier: number) => void;
  
  // History management
  clearHistory: () => void;
  addRoll: (roll: RollEntry) => void;
  
  // Subscription for roll log auto-open
  subscribeToRolls: (callback: (roll: RollEntry) => void) => () => void;
}

const RollContext = createContext<RollContextValue | null>(null);

// Helper to generate unique roll IDs
let rollIdCounter = 0;
function generateRollId(): string {
  return `roll-${Date.now()}-${++rollIdCounter}`;
}

// Roll a single die
function rollDie(type: 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20'): number {
  const max = parseInt(type.substring(1));
  return Math.floor(Math.random() * max) + 1;
}

// Max values for each die type
const DIE_MAX: Record<string, number> = {
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
  d20: 20,
};

const STORAGE_KEY = 'realms-roll-log';
const MAX_PERSISTED_ROLLS = 20;

export function RollProvider({ 
  children, 
  maxHistory = 50 
}: { 
  children: React.ReactNode;
  maxHistory?: number;
}) {
  const [rolls, setRolls] = useState<RollEntry[]>(() => {
    // Hydrate from localStorage on mount
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RollEntry[];
        // Restore Date objects from ISO strings
        return parsed.map(r => ({ ...r, timestamp: new Date(r.timestamp) }));
      }
    } catch { /* ignore parse errors */ }
    return [];
  });
  
  // Persist to localStorage whenever rolls change
  useEffect(() => {
    try {
      // Only persist the last MAX_PERSISTED_ROLLS
      const toStore = rolls.slice(0, MAX_PERSISTED_ROLLS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch { /* ignore storage errors */ }
  }, [rolls]);
  
  // Subscribers to be notified when a new roll is added
  const subscribersRef = React.useRef<Set<(roll: RollEntry) => void>>(new Set());

  const addRoll = useCallback((roll: RollEntry) => {
    setRolls(prev => [roll, ...prev].slice(0, maxHistory));
    // Notify all subscribers
    subscribersRef.current.forEach(callback => callback(roll));
  }, [maxHistory]);

  const clearHistory = useCallback(() => {
    setRolls([]);
  }, []);
  
  // Subscribe to roll events (for auto-opening roll log)
  const subscribeToRolls = useCallback((callback: (roll: RollEntry) => void) => {
    subscribersRef.current.add(callback);
    return () => {
      subscribersRef.current.delete(callback);
    };
  }, []);

  // Internal helper for d20 rolls (abilities, defenses, skills, attacks)
  const makeD20Roll = useCallback((
    type: RollType,
    title: string,
    bonus: number
  ) => {
    const roll = rollDie('d20');
    const isCrit = roll === 20;
    const isCritFail = roll === 1;
    
    // Apply natural 20/1 bonuses like vanilla
    let total = roll + bonus;
    let critMessage: string | undefined;
    
    if (isCrit) {
      total += 2; // Natural 20 adds +2
      critMessage = 'Natural 20! +2 to the total!';
    } else if (isCritFail) {
      total -= 2; // Natural 1 subtracts 2
      critMessage = 'Natural 1! -2 from the total!';
    }

    const newRoll: RollEntry = {
      id: generateRollId(),
      type,
      title,
      dice: [{ type: 'd20', value: roll, isMax: isCrit, isMin: isCritFail }],
      modifier: bonus,
      total,
      isCrit,
      isCritFail,
      critMessage,
      timestamp: new Date(),
    };

    addRoll(newRoll);
    return newRoll;
  }, [addRoll]);

  // Roll an ability check
  const rollAbility = useCallback((abilityName: string, bonus: number) => {
    const title = abilityName.charAt(0).toUpperCase() + abilityName.slice(1) + ' Check';
    makeD20Roll('ability', title, bonus);
  }, [makeD20Roll]);

  // Roll a defense/saving throw
  const rollDefense = useCallback((defenseName: string, bonus: number) => {
    makeD20Roll('defense', `${defenseName} Save`, bonus);
  }, [makeD20Roll]);

  // Roll a skill check
  const rollSkill = useCallback((skillName: string, bonus: number) => {
    makeD20Roll('skill', skillName, bonus);
  }, [makeD20Roll]);

  // Roll an attack
  const rollAttack = useCallback((weaponName: string, attackBonus: number) => {
    makeD20Roll('attack', `${weaponName} Attack`, attackBonus);
  }, [makeD20Roll]);

  // Roll damage (parses damage strings like "2d6", "1d8+2", "1d6 Slashing")
  const rollDamage = useCallback((damageStr: string, bonus: number = 0) => {
    // Validate input is a string
    if (typeof damageStr !== 'string') {
      console.warn('rollDamage called with non-string:', damageStr);
      return;
    }
    
    const match = damageStr.match(/(\d+)d(\d+)([+-]\d+)?(?:\s+([a-zA-Z]+))?/);
    if (!match) return;

    const [, numDice, dieSize, modifier, dmgType] = match;
    const num = parseInt(numDice);
    const size = parseInt(dieSize);
    const mod = modifier ? parseInt(modifier) : 0;
    const totalBonus = mod + bonus;

    const diceResults: DieResult[] = [];
    let total = totalBonus;

    for (let i = 0; i < num; i++) {
      const dieType = `d${size}` as DieResult['type'];
      const value = rollDie(dieType);
      diceResults.push({
        type: dieType,
        value,
        isMax: value === size,
        isMin: value === 1,
      });
      total += value;
    }

    const title = `Damage${dmgType ? ` (${dmgType})` : ''}`;

    const newRoll: RollEntry = {
      id: generateRollId(),
      type: 'damage',
      title,
      dice: diceResults,
      modifier: totalBonus,
      total,
      timestamp: new Date(),
    };

    addRoll(newRoll);
  }, [addRoll]);

  // Roll custom dice
  const rollCustom = useCallback((
    title: string, 
    dieType: 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20', 
    count: number, 
    modifier: number
  ) => {
    const diceResults: DieResult[] = [];
    let total = modifier;
    const max = DIE_MAX[dieType];

    for (let i = 0; i < count; i++) {
      const value = rollDie(dieType);
      diceResults.push({
        type: dieType,
        value,
        isMax: value === max,
        isMin: value === 1,
      });
      total += value;
    }

    const isCrit = dieType === 'd20' && count === 1 && diceResults[0]?.value === 20;
    const isCritFail = dieType === 'd20' && count === 1 && diceResults[0]?.value === 1;

    const newRoll: RollEntry = {
      id: generateRollId(),
      type: 'custom',
      title,
      dice: diceResults,
      modifier,
      total,
      isCrit,
      isCritFail,
      timestamp: new Date(),
    };

    addRoll(newRoll);
  }, [addRoll]);

  const value: RollContextValue = {
    rolls,
    rollAbility,
    rollDefense,
    rollSkill,
    rollAttack,
    rollDamage,
    rollCustom,
    clearHistory,
    addRoll,
    subscribeToRolls,
  };

  return (
    <RollContext.Provider value={value}>
      {children}
    </RollContext.Provider>
  );
}

// Hook to use roll functions
export function useRolls() {
  const context = useContext(RollContext);
  if (!context) {
    throw new Error('useRolls must be used within a RollProvider');
  }
  return context;
}

// Optional hook that returns null if not in context (for optional usage)
export function useRollsOptional() {
  return useContext(RollContext);
}
