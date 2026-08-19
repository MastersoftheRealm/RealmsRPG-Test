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
import { Trash2, Users, User } from 'lucide-react';
import { useRolls, type RollEntry, type RollType, type DieResult } from './roll-context';
import { useCampaignRolls } from '@/hooks/use-campaign-rolls';
import { DecrementButton, IncrementButton } from '@/components/patterns';
import { LoadingState, EmptyState, Card } from '@/components/ui';
import type { CampaignRollEntry } from '@/types/campaign-roll';
import { formatRollTimestamp } from '@/lib/roll-timestamp';
import { DIE_IMAGES, DIE_MAX, generateRollId, rollDie, type DieType } from '@/lib/rolls/die';

// Re-export types for convenience
export type { RollEntry, RollType, DieResult };

// Roll type colors (left border accent)
const ROLL_TYPE_COLORS: Record<RollType, string> = {
  attack: 'border-l-danger-500',
  damage: 'border-l-martial-dark',
  skill: 'border-l-primary-outline-border',
  ability: 'border-l-power-dark',
  defense: 'border-l-info-500',
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

interface RollLogProps {
  className?: string | undefined;
  /** When set (e.g. on encounter page), campaign tab shows this campaign's rolls but new rolls stay personal (not sent to campaign). */
  viewOnlyCampaignId?: string | undefined;
}

type RollLogMode = 'personal' | 'campaign';

export function RollLog({ className, viewOnlyCampaignId }: RollLogProps) {
  const { rolls, addRoll, clearHistory, subscribeToRolls, campaignContext } = useRolls();
  // Normalize to string so query key matches campaign page (params.id) and realtime subscription is consistent
  const rawCampaignId = campaignContext?.campaignId ?? viewOnlyCampaignId;
  const campaignId = rawCampaignId != null ? String(rawCampaignId) : undefined;
  const {
    rolls: campaignRolls,
    refetch: refetchCampaignRolls,
    dataUpdatedAt = 0,
    loading: campaignRollsLoading,
    isError: campaignRollsFailed,
    error: campaignRollsError,
  } = useCampaignRolls(campaignId);
  const [mode, setMode] = React.useState<RollLogMode>('personal');
  const [isOpen, setIsOpen] = React.useState(false);
  const listRef = React.useRef<HTMLDivElement>(null);

  // When switching to Campaign tab, refetch so in-sheet/encounter log stays in sync with campaign page
  React.useEffect(() => {
    if (mode === 'campaign' && campaignId) refetchCampaignRolls();
  }, [mode, campaignId, refetchCampaignRolls]);

  // New rolls at bottom: personal rolls are oldest-first; campaign API returns newest-first so reverse
  const displayRolls = mode === 'campaign' && campaignId ? [...campaignRolls].reverse() : rolls;
  const isCampaignMode = mode === 'campaign' && campaignId;

  // Subscribe to roll events to auto-open the log (personal mode only)
  React.useEffect(() => {
    const unsubscribe = subscribeToRolls(() => {
      setIsOpen(true);
      if (!campaignId) setMode('personal');
    });
    return unsubscribe;
  }, [subscribeToRolls, campaignId]);

  // Scroll to bottom when newest roll changes. Campaign list length can stay flat at MAX_CAMPAIGN_ROLLS, so use dataUpdatedAt.
  const scrollToLatestKey = mode === 'campaign' && campaignId ? dataUpdatedAt : rolls.length;
  React.useLayoutEffect(() => {
    if (!isOpen || !listRef.current) return;
    const el = listRef.current;
    const scroll = () => {
      el.scrollTop = el.scrollHeight;
    };
    scroll();
    // After React paints new list items (campaign refetch is async)
    requestAnimationFrame(() => {
      requestAnimationFrame(scroll);
    });
  }, [isOpen, scrollToLatestKey]);

  // Dice pool state (local to the manual dice builder)
  const [dicePool, setDicePool] = React.useState<Record<DieType, number>>({
    d4: 0,
    d6: 0,
    d8: 0,
    d10: 0,
    d12: 0,
    d20: 0,
  });
  const [modifier, setModifier] = React.useState(0);

  // Add a die to pool (left click)
  const addDie = (type: DieType) => {
    setDicePool((prev) => ({ ...prev, [type]: Math.min(prev[type] + 1, 20) }));
  };

  // Remove a die from pool (right click)
  const removeDie = (type: DieType) => {
    setDicePool((prev) => ({ ...prev, [type]: Math.max(prev[type] - 1, 0) }));
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
    <div
      className={cn('floating-dock-bottom-right', className)}
      data-floating-dock="bottom-right"
      data-tour-id="sheet-tour-roll-log"
    >
      {/* Panel */}
      <Card
        className={cn(
          'absolute right-0 bottom-[calc(var(--dock-fab-size)+0.75rem)]',
          'overflow-hidden p-0 shadow-2xl',
          'duration-slow flex flex-col transition-all ease-standard',
          isOpen
            ? 'h-[70vh] max-h-[600px] w-[min(22.5rem,calc(100svw-2*var(--dock-gap)))] opacity-100'
            : 'pointer-events-none h-0 w-0 max-w-0 opacity-0',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-primary-button px-4 py-3 text-text-on-dark">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold tracking-wide">🎲 Roll Log</h3>
            {campaignId && (
              <div className="flex overflow-hidden rounded-lg border border-text-on-dark/30">
                <button
                  onClick={() => setMode('personal')}
                  className={cn(
                    'px-2.5 py-1 text-xs font-medium transition-colors',
                    mode === 'personal'
                      ? 'bg-text-on-dark/25 text-text-on-dark'
                      : 'bg-text-on-dark/10 text-text-on-dark/80 hover:bg-text-on-dark/15 dark:bg-text-on-dark/20 dark:text-text-on-dark dark:hover:bg-text-on-dark/30',
                  )}
                  title="Your personal rolls"
                >
                  <User className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setMode('campaign')}
                  className={cn(
                    'px-2.5 py-1 text-xs font-medium transition-colors',
                    mode === 'campaign'
                      ? 'bg-text-on-dark/25 text-text-on-dark'
                      : 'bg-text-on-dark/10 text-text-on-dark/80 hover:bg-text-on-dark/15 dark:bg-text-on-dark/20 dark:text-text-on-dark dark:hover:bg-text-on-dark/30',
                  )}
                  title="Campaign rolls (all players)"
                >
                  <Users className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
          {!isCampaignMode && (
            <button
              onClick={clearHistory}
              className="flex items-center gap-1 rounded-lg border-2 border-text-on-dark/30 bg-text-on-dark/15 px-3 py-1.5 text-xs font-semibold text-text-on-dark transition-colors hover:bg-text-on-dark/25"
            >
              <Trash2 className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>

        {/* Roll History */}
        <div ref={listRef} className="flex-1 overflow-y-auto bg-surface-alt p-2">
          {isCampaignMode &&
          campaignRollsLoading &&
          campaignRolls.length === 0 &&
          !campaignRollsFailed ? (
            <LoadingState message="Loading campaign rolls…" size="md" padding="sm" />
          ) : isCampaignMode && campaignRollsFailed ? (
            <div className="space-y-3 px-3 py-6 text-center">
              <p className="text-sm text-danger-fg">
                Couldn&apos;t load campaign rolls.
                {campaignRollsError?.message ? (
                  <span className="mt-1 block text-text-secondary">
                    {campaignRollsError.message}
                  </span>
                ) : null}
              </p>
              <button
                type="button"
                onClick={() => void refetchCampaignRolls()}
                className="min-h-[44px] min-w-[44px] rounded-lg bg-primary-button px-4 py-2 text-sm font-semibold text-text-on-dark hover:bg-primary-button-hover"
                aria-label="Retry loading campaign rolls"
              >
                Retry
              </button>
            </div>
          ) : displayRolls.length === 0 ? (
            <EmptyState
              title={isCampaignMode ? 'No campaign rolls yet' : 'No rolls yet'}
              description={
                isCampaignMode
                  ? 'Rolls from any character sheet will appear here.'
                  : 'Build your dice pool below!'
              }
              size="sm"
              className="py-10"
            />
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

        {/* Dice Builder - visible in both Personal and Campaign tabs so users can send custom rolls to campaign */}
        <div className="border-t-2 border-border-light bg-primary-button p-3">
          {/* Dice Grid - clickable images with labels and counts */}
          <div className="mb-3 grid grid-cols-6 gap-1.5">
            {(['d4', 'd6', 'd8', 'd10', 'd12', 'd20'] as DieType[]).map((die) => (
              <button
                key={die}
                onClick={() => addDie(die)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  removeDie(die);
                }}
                className={cn(
                  'relative flex flex-col items-center justify-center rounded-lg px-1 py-1.5',
                  'cursor-pointer bg-text-on-dark/10 transition-all hover:bg-text-on-dark/25 dark:bg-text-on-dark/20 dark:hover:bg-text-on-dark/35',
                  dicePool[die] > 0 && 'bg-text-on-dark/20 ring-2 ring-warning-400',
                )}
                title={`Left-click: add ${die} · Right-click: remove`}
              >
                <Image
                  src={DIE_IMAGES[die]}
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain drop-shadow-md"
                />
                <span className="mt-0.5 text-[10px] font-bold text-text-on-dark/80">{die}</span>
                {dicePool[die] > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-warning-400 text-xs font-bold text-warning-900 shadow">
                    {dicePool[die]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Modifier Row */}
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-text-on-dark/70">MOD</span>
              <DecrementButton
                onClick={() => setModifier((m) => m - 1)}
                size="sm"
                title="Decrease bonus"
              />
              <span className="min-w-[36px] text-center text-sm font-bold text-text-on-dark tabular-nums">
                {modifier >= 0 ? '+' : ''}
                {modifier}
              </span>
              <IncrementButton
                onClick={() => setModifier((m) => m + 1)}
                size="sm"
                title="Increase bonus"
              />
            </div>
            {totalDice > 0 && (
              <button
                onClick={clearPool}
                className="text-xs text-text-on-dark/60 underline hover:text-text-on-dark"
              >
                Clear pool
              </button>
            )}
          </div>

          {/* Roll Button */}
          <button
            onClick={executeRoll}
            disabled={totalDice === 0}
            className={cn(
              'w-full rounded-lg py-2.5 text-sm font-bold text-text-on-dark transition-all',
              'bg-success-600 hover:bg-success-700 focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:bg-text-muted disabled:opacity-70',
            )}
          >
            {totalDice > 0
              ? `Roll ${totalDice} ${totalDice === 1 ? 'die' : 'dice'}`
              : 'Select dice to roll'}
          </button>
        </div>
      </Card>

      {/* Toggle Button - custom d20 image matching vanilla site */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'duration-slow h-14 w-14 rounded-full shadow-lg transition-all ease-standard',
          'flex items-center justify-center',
          'bg-primary-button text-text-on-dark hover:scale-110 hover:bg-primary-button-hover active:scale-95',
          isOpen && 'bg-primary-button-hover',
        )}
        aria-label={isOpen ? 'Close roll log' : 'Open roll log'}
      >
        <Image
          src="/images/RD20.png"
          alt="Roll Dice"
          width={36}
          height={36}
          className="h-9 w-9 object-contain drop-shadow-md"
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

export function RollEntryCard({
  roll,
  characterName,
}: {
  roll: RollEntry | CampaignRollEntry;
  characterName?: string | undefined;
}) {
  const diceGroups = groupDiceByType(roll.dice);
  const showModifier = roll.modifier !== 0;
  const showSubtotal = showModifier || roll.dice.length > 1;
  const timestampStr = formatRollTimestamp(roll.timestamp);

  return (
    <div
      className={cn(
        'mb-2 rounded-lg border-l-4 bg-surface p-3 shadow-sm',
        ROLL_TYPE_COLORS[roll.type],
        roll.isCrit && 'ring-2 ring-success-400',
        roll.isCritFail && 'ring-2 ring-danger-400',
      )}
    >
      {/* Header: icon + title + character name (campaign) + date/time */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex-shrink-0 text-sm">{ROLL_TYPE_ICONS[roll.type as RollType]}</span>
          <div className="min-w-0">
            {characterName && (
              <span
                className="block truncate text-xs font-medium text-primary-link-fg"
                title={characterName}
              >
                {characterName}
              </span>
            )}
            <span className="block truncate text-sm font-semibold text-primary-fg">
              {roll.title}
            </span>
          </div>
        </div>
        <span className="ml-1 flex-shrink-0 text-[10px] text-text-secondary" title={timestampStr}>
          {timestampStr}
        </span>
      </div>

      {/* Single-row: dice notation + roll value + bonus + total in boxes */}
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Dice notation + roll value (light grey) */}
        {diceGroups.map((group, gi) => (
          <div key={gi} className="flex items-center gap-1">
            <span className="inline-flex items-center gap-0.5 rounded bg-surface-alt px-1.5 py-0.5 text-xs font-medium text-text-secondary dark:bg-surface dark:text-text-primary">
              <Image
                src={DIE_IMAGES[group.type]}
                alt=""
                width={16}
                height={16}
                className="h-4 w-4 object-contain opacity-75 dark:opacity-90"
              />
              <span>
                {group.results.length}
                {group.type}
              </span>
            </span>
            {group.results.map((die, di) => (
              <span
                key={di}
                className={cn(
                  'inline-flex h-6 min-w-[22px] items-center justify-center rounded border px-1 text-xs font-bold',
                  die.isMax &&
                    'border-success-300 bg-success-50 text-success-fg dark:border-success-700/60 dark:bg-success-900/40',
                  die.isMin &&
                    'border-danger-300 bg-danger-50 text-danger-fg dark:border-danger-700/60 dark:bg-danger-900/40',
                  !die.isMax &&
                    !die.isMin &&
                    'border-border-light bg-surface-alt text-text-secondary dark:bg-surface dark:text-text-primary',
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
            <span className="text-xs text-text-muted">{roll.modifier >= 0 ? '+' : '−'}</span>
            <span
              className={cn(
                'inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-semibold',
                roll.modifier >= 0
                  ? 'border-success-200 bg-success-50 text-success-fg dark:border-success-700/50 dark:bg-success-900/30'
                  : 'border-danger-200 bg-danger-50 text-danger-fg dark:border-danger-700/50 dark:bg-danger-900/30',
              )}
            >
              {roll.modifier >= 0 ? roll.modifier : -roll.modifier}
            </span>
          </>
        )}

        {/* = Total (blue) */}
        {(showSubtotal || roll.dice.length === 1) && (
          <>
            <span className="text-xs text-text-muted">=</span>
            <span
              className={cn(
                'inline-flex items-center rounded border px-2 py-0.5 text-sm font-bold',
                roll.isCrit &&
                  'border-success-300 bg-success-50 text-success-fg dark:border-success-700/60 dark:bg-success-900/40',
                roll.isCritFail &&
                  'border-danger-300 bg-danger-50 text-danger-fg dark:border-danger-700/60 dark:bg-danger-900/40',
                !roll.isCrit &&
                  !roll.isCritFail &&
                  'border-primary-subtle-border bg-primary-subtle-bg text-primary-fg',
              )}
            >
              {roll.total}
            </span>
          </>
        )}
      </div>

      {/* Crit Message */}
      {roll.critMessage && (
        <div
          className={cn(
            'mt-2 inline-block rounded px-2 py-0.5 text-xs font-bold tracking-wide text-text-on-dark uppercase',
            roll.isCrit && 'bg-gradient-to-r from-success-500 to-success-600',
            roll.isCritFail && 'bg-gradient-to-r from-danger-500 to-danger-600',
          )}
        >
          {roll.isCrit ? 'Natural 20!' : roll.isCritFail ? 'Natural 1!' : ''}
        </div>
      )}
    </div>
  );
}
