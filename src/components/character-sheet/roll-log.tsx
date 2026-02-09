/**
 * Roll Log Component
 * ==================
 * Fixed-position dice rolling panel matching vanilla site's roll-log.
 * Features: Custom dice images, dice pool builder, roll history,
 * color-coded roll types, critical success/fail highlighting,
 * modifier input, and localStorage persistence via RollContext.
 */

'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';
import { Minus, Plus, Trash2, Users, User } from 'lucide-react';
import { useRolls, type RollEntry, type RollType, type DieResult } from './roll-context';
import { useCampaignRolls } from '@/hooks/use-campaign-rolls';
import type { CampaignRollEntry } from '@/types/campaign-roll';

// Re-export types for convenience
export type { RollEntry, RollType, DieResult };
export type DieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';

// Die max values
const DIE_MAX: Record<DieType, number> = {
  d4: 4, d6: 6, d8: 8, d10: 10, d12: 12, d20: 20,
};

// Dice image paths (matching vanilla site assets)
const DIE_IMAGES: Record<DieType, string> = {
  d4: '/images/D4.png',
  d6: '/images/D6.png',
  d8: '/images/D8.png',
  d10: '/images/D10.png',
  d12: '/images/D12.png',
  d20: '/images/D20_1.png',
};

// Roll type colors (left border accent)
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

/** Normalize roll timestamp from API (Date serialized as ISO string), Firestore ({ seconds }), or Date to a Date. */
function normalizeRollTimestamp(
  timestamp: Date | string | { seconds: number; nanoseconds?: number } | unknown
): Date {
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'string') return new Date(timestamp);
  const sec = (timestamp as { seconds?: number })?.seconds;
  if (typeof sec === 'number') return new Date(sec * 1000);
  return new Date();
}

/** Format roll timestamp for display: short date + time so "unavailable" is avoided. */
function formatRollTimestamp(timestamp: Date | string | { seconds: number } | unknown): string {
  const d = normalizeRollTimestamp(timestamp);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface RollLogProps {
  className?: string;
  /** When set (e.g. on encounter page), campaign tab shows this campaign's rolls but new rolls stay personal (not sent to campaign). */
  viewOnlyCampaignId?: string;
}

type RollLogMode = 'personal' | 'campaign';

export function RollLog({ className, viewOnlyCampaignId }: RollLogProps) {
  const { rolls, addRoll, clearHistory, subscribeToRolls, campaignContext } = useRolls();
  const campaignId = campaignContext?.campaignId ?? viewOnlyCampaignId;
  const { rolls: campaignRolls } = useCampaignRolls(campaignId);
  const [mode, setMode] = React.useState<RollLogMode>('personal');
  const [isOpen, setIsOpen] = React.useState(false);
  const listRef = React.useRef<HTMLDivElement>(null);

  const displayRolls = mode === 'campaign' && campaignId ? campaignRolls : rolls;
  const isCampaignMode = mode === 'campaign' && campaignId;
  
  // Subscribe to roll events to auto-open the log (personal mode only)
  React.useEffect(() => {
    const unsubscribe = subscribeToRolls(() => {
      setIsOpen(true);
      if (!campaignId) setMode('personal');
    });
    return unsubscribe;
  }, [subscribeToRolls, campaignId]);
  
  // Scroll to top when new roll added (newest first)
  React.useEffect(() => {
    if (isOpen && listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [displayRolls.length, isOpen]);
  
  // Dice pool state (local to the manual dice builder)
  const [dicePool, setDicePool] = React.useState<Record<DieType, number>>({
    d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0,
  });
  const [modifier, setModifier] = React.useState(0);

  // Add a die to pool (left click)
  const addDie = (type: DieType) => {
    setDicePool(prev => ({ ...prev, [type]: Math.min(prev[type] + 1, 20) }));
  };

  // Remove a die from pool (right click)
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

    // Check for critical (only when rolling exactly 1d20)
    const isCrit = hasD20 && d20Value === 20;
    const isCritFail = hasD20 && d20Value === 1;

    // Apply crit bonuses matching game rules
    let critMessage: string | undefined;
    if (isCrit) {
      total += 2;
      critMessage = 'Natural 20! +2 to the total!';
    } else if (isCritFail) {
      total -= 2;
      critMessage = 'Natural 1! -2 from the total!';
    }

    const newRoll: RollEntry = {
      id: generateRollId(),
      type: 'custom',
      title: 'Custom Roll',
      dice: diceResults,
      modifier,
      total,
      isCrit,
      isCritFail,
      critMessage,
      timestamp: new Date(),
    };

    addRoll(newRoll);
    clearPool();
  };

  // Get total dice count in pool
  const totalDice = Object.values(dicePool).reduce((a, b) => a + b, 0);

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
        <div className="flex items-center justify-between px-4 py-3 bg-primary-700 text-white">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base tracking-wide">🎲 Roll Log</h3>
            {campaignId && (
              <div className="flex rounded-lg overflow-hidden border border-white/30">
                <button
                  onClick={() => setMode('personal')}
                  className={cn(
                    'px-2.5 py-1 text-xs font-medium transition-colors',
                    mode === 'personal' ? 'bg-white/25 text-white' : 'bg-white/10 text-white/80 hover:bg-white/15'
                  )}
                  title="Your personal rolls"
                >
                  <User className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setMode('campaign')}
                  className={cn(
                    'px-2.5 py-1 text-xs font-medium transition-colors',
                    mode === 'campaign' ? 'bg-white/25 text-white' : 'bg-white/10 text-white/80 hover:bg-white/15'
                  )}
                  title="Campaign rolls (all players)"
                >
                  <Users className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
          {!isCampaignMode && (
            <button
              onClick={clearHistory}
              className="px-3 py-1.5 rounded-lg bg-white/15 border-2 border-white/30 text-white text-xs font-semibold hover:bg-white/25 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>

        {/* Roll History */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 bg-surface-alt">
          {displayRolls.length === 0 ? (
            <p className="text-center text-text-muted italic py-10">
              {isCampaignMode ? 'No campaign rolls yet. Rolls from any character sheet will appear here.' : 'No rolls yet. Build your dice pool below!'}
            </p>
          ) : (
            displayRolls.map((roll) => (
              <RollEntryCard
                key={roll.id}
                roll={roll}
                characterName={'characterName' in roll ? roll.characterName : undefined}
              />
            ))
          )}
        </div>

        {/* Dice Builder - hide when viewing campaign log */}
        {!isCampaignMode && (
        <div className="p-3 bg-primary-700 border-t-2 border-border-light">
          {/* Dice Grid - clickable images with labels and counts */}
          <div className="grid grid-cols-6 gap-1.5 mb-3">
            {(['d4', 'd6', 'd8', 'd10', 'd12', 'd20'] as DieType[]).map((die) => (
              <button
                key={die}
                onClick={() => addDie(die)}
                onContextMenu={(e) => { e.preventDefault(); removeDie(die); }}
                className={cn(
                  'relative flex flex-col items-center justify-center py-1.5 px-1 rounded-lg',
                  'bg-white/10 hover:bg-white/25 transition-all cursor-pointer',
                  dicePool[die] > 0 && 'ring-2 ring-yellow-400 bg-white/20'
                )}
                title={`Left-click: add ${die} · Right-click: remove`}
              >
                <Image
                  src={DIE_IMAGES[die]}
                  alt={die}
                  width={32}
                  height={32}
                  className="w-8 h-8 object-contain drop-shadow-md"
                />
                <span className="text-[10px] font-bold text-white/80 mt-0.5">{die}</span>
                {dicePool[die] > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-yellow-400 text-yellow-900 text-xs font-bold shadow">
                    {dicePool[die]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Modifier Row */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-white/70 text-xs font-semibold">MOD</span>
              <button
                onClick={() => setModifier(m => m - 1)}
                className="w-7 h-7 rounded bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-white font-bold min-w-[36px] text-center text-sm">
                {modifier >= 0 ? '+' : ''}{modifier}
              </span>
              <button
                onClick={() => setModifier(m => m + 1)}
                className="w-7 h-7 rounded bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {totalDice > 0 && (
              <button
                onClick={clearPool}
                className="text-white/60 hover:text-white text-xs underline"
              >
                Clear pool
              </button>
            )}
          </div>

          {/* Roll Button - solid green matching btn-solid style */}
          <button
            onClick={executeRoll}
            disabled={totalDice === 0}
            className={cn(
              'w-full py-2.5 rounded-lg font-bold text-white transition-all text-sm',
              'bg-success-600 hover:bg-success-700 focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2',
              'disabled:bg-text-muted disabled:cursor-not-allowed disabled:opacity-70'
            )}
          >
            {totalDice > 0 ? `Roll ${totalDice} ${totalDice === 1 ? 'die' : 'dice'}` : 'Select dice to roll'}
          </button>
        </div>
        )}
      </div>

      {/* Toggle Button - custom d20 image matching vanilla site */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-14 h-14 rounded-full shadow-lg transition-all duration-300',
          'flex items-center justify-center',
          'bg-primary-600 text-white hover:bg-primary-700 hover:scale-110 active:scale-95',
          isOpen && 'bg-primary-800'
        )}
        aria-label={isOpen ? 'Close roll log' : 'Open roll log'}
      >
        <Image
          src="/images/RD20.png"
          alt="Roll Dice"
          width={36}
          height={36}
          className="w-9 h-9 object-contain drop-shadow-md"
        />
      </button>
    </div>
  );
}

/**
 * Group dice results by type for display
 */
function groupDiceByType(dice: DieResult[]): { type: DieType; results: DieResult[] }[] {
  const groups = new Map<DieType, DieResult[]>();
  for (const die of dice) {
    const existing = groups.get(die.type as DieType) || [];
    existing.push(die);
    groups.set(die.type as DieType, existing);
  }
  return Array.from(groups.entries()).map(([type, results]) => ({ type, results }));
}

export function RollEntryCard({ roll, characterName }: { roll: RollEntry | CampaignRollEntry; characterName?: string }) {
  const diceGroups = groupDiceByType(roll.dice);
  const diceSubtotal = roll.dice.reduce((sum, d) => sum + d.value, 0);
  const showModifier = roll.modifier !== 0;
  const showSubtotal = showModifier || roll.dice.length > 1;
  const timestampStr = formatRollTimestamp(roll.timestamp);

  return (
    <div
      className={cn(
        'bg-surface rounded-lg mb-2 p-3 shadow-sm border-l-4',
        ROLL_TYPE_COLORS[roll.type],
        roll.isCrit && 'ring-2 ring-green-400',
        roll.isCritFail && 'ring-2 ring-red-400'
      )}
    >
      {/* Header: icon + title + character name (campaign) + date/time */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm flex-shrink-0">{ROLL_TYPE_ICONS[roll.type as RollType]}</span>
          <div className="min-w-0">
            {characterName && (
              <span className="block text-xs font-medium text-primary-600 dark:text-primary-400 truncate" title={characterName}>
                {characterName}
              </span>
            )}
            <span className="font-semibold text-sm text-primary-dark dark:text-primary-200 truncate block">{roll.title}</span>
          </div>
        </div>
        <span className="text-[10px] text-text-muted dark:text-neutral-400 flex-shrink-0 ml-1" title={timestampStr}>
          {timestampStr}
        </span>
      </div>

      {/* Single-row: dice notation + roll value + bonus + total in boxes */}
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Dice notation + roll value (light grey) */}
        {diceGroups.map((group, gi) => (
          <div key={gi} className="flex items-center gap-1">
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-surface-alt dark:bg-neutral-800 text-text-secondary text-xs font-medium">
              <Image
                src={DIE_IMAGES[group.type]}
                alt={group.type}
                width={16}
                height={16}
                className="w-4 h-4 object-contain opacity-75"
              />
              <span>{group.results.length}{group.type}</span>
            </span>
            {group.results.map((die, di) => (
              <span
                key={di}
                className={cn(
                  'inline-flex items-center justify-center min-w-[22px] h-6 px-1 rounded text-xs font-bold',
                  die.type === 'd20'
                    ? cn(
                        'border',
                        die.isMax && 'bg-green-100 border-green-500 text-green-800',
                        die.isMin && 'bg-red-100 border-red-500 text-red-800',
                        !die.isMax && !die.isMin && 'bg-surface-alt dark:bg-neutral-800 text-text-secondary border-border-light'
                      )
                    : cn(
                        die.isMax ? 'bg-green-100 border border-green-400 text-green-800' :
                        die.isMin ? 'bg-red-100 border border-red-400 text-red-800' :
                        'bg-surface-alt dark:bg-neutral-800 text-text-secondary border border-border-light'
                      )
                )}
              >
                {die.value}
              </span>
            ))}
          </div>
        ))}

        {/* Bonus when modifier present - avoid duplicate +/- (e.g. d20 + +5 → d20 + 5); red for negative */}
        {showModifier && (
          <>
            <span className="text-text-muted text-xs">{roll.modifier >= 0 ? '+' : '−'}</span>
            <span className={cn(
              'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold border',
              roll.modifier >= 0
                ? 'bg-success-50 text-success-700 border-success-200'
                : 'bg-danger-50 text-danger-700 border-danger-200'
            )}>
              {roll.modifier >= 0 ? roll.modifier : -roll.modifier}
            </span>
          </>
        )}

        {/* = Total (blue) */}
        {(showSubtotal || roll.dice.length === 1) && (
          <>
            <span className="text-text-muted text-xs">=</span>
            <span className={cn(
              'inline-flex items-center px-2 py-0.5 rounded text-sm font-bold',
              roll.isCrit && 'bg-green-100 border border-green-400 text-green-800',
              roll.isCritFail && 'bg-red-100 border border-red-400 text-red-800',
              !roll.isCrit && !roll.isCritFail && 'bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-700/50 text-primary-700 dark:text-primary-300'
            )}>
              {roll.total}
            </span>
          </>
        )}
      </div>

      {/* Crit Message */}
      {roll.critMessage && (
        <div className={cn(
          'mt-2 inline-block px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide text-white',
          roll.isCrit && 'bg-gradient-to-r from-green-500 to-teal-500',
          roll.isCritFail && 'bg-gradient-to-r from-red-500 to-red-600',
        )}>
          {roll.isCrit ? 'Natural 20!' : roll.isCritFail ? 'Natural 1!' : ''}
        </div>
      )}
    </div>
  );
}

export default RollLog;
