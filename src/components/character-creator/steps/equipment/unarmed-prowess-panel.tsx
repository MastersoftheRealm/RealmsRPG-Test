'use client';

import { cn } from '@/lib/utils';
import { statusPanel } from '@/lib/ui/status-surface-classes';
import { DescriptorChip } from '@/components/ui';
import { Check, Swords } from 'lucide-react';
import {
  UNARMED_PROWESS_BASE_TP,
  UNARMED_PROWESS_UPGRADE_TP,
  type UnarmedProwessLevel,
} from '@/lib/creator/advanced-equipment-catalog';

export interface UnarmedProwessPanelProps {
  /** Path Layer 1 compact card vs full-catalog tab layout */
  variant: 'path' | 'tab';
  availableLevels: UnarmedProwessLevel[];
  characterLevel: number;
  currentUnarmedProwess: number;
  unarmedProwessTPCost: number;
  onSetLevel: (level: number) => void;
}

export function UnarmedProwessPanel({
  variant,
  availableLevels,
  characterLevel,
  currentUnarmedProwess,
  unarmedProwessTPCost,
  onSetLevel,
}: UnarmedProwessPanelProps) {
  const isPath = variant === 'path';

  return (
    <div
      className={cn(
        'rounded-lg border border-border-light bg-surface',
        isPath ? 'mb-6 p-4' : 'mb-8 p-6',
      )}
    >
      {isPath ? (
        <>
          <h3 className="mb-2 text-lg font-semibold text-text-primary">Unarmed Prowess</h3>
          <p className="mb-4 text-sm text-text-secondary">
            Your path recommends Unarmed Prowess. Add it below if you want to use unarmed combat.
          </p>
        </>
      ) : (
        <div className="mb-6 flex items-start gap-4">
          <div className="rounded-full bg-warning-light p-3">
            <Swords className="h-8 w-8 text-martial-dark" />
          </div>
          <div className="flex-1">
            <h3 className="mb-1 text-lg font-bold text-text-primary">Unarmed Prowess</h3>
            <p className="text-sm text-text-secondary">
              Master the art of unarmed combat. Your fists become deadly weapons, dealing increasing
              damage as you train. Upgrades become available at higher character levels.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {availableLevels.map((prowessLevel) => {
          const isAvailable = prowessLevel.charLevel <= characterLevel;
          const isSelected = currentUnarmedProwess >= prowessLevel.level;
          const tpCost =
            prowessLevel.level === 1 ? UNARMED_PROWESS_BASE_TP : UNARMED_PROWESS_UPGRADE_TP;
          const canSelect =
            isAvailable && (currentUnarmedProwess === prowessLevel.level - 1 || isSelected);

          return (
            <div
              key={prowessLevel.level}
              className={cn(
                'flex items-center gap-4 rounded-lg border transition-all',
                isPath ? 'p-3' : 'p-4',
                isSelected
                  ? 'border-primary-subtle-border bg-primary-subtle-bg'
                  : isPath
                    ? 'border-border-light bg-surface-alt'
                    : 'border-border-light bg-surface',
                !isAvailable && 'opacity-50',
                canSelect && !isSelected && 'cursor-pointer hover:border-primary-outline-border',
              )}
              onClick={() => {
                if (!isAvailable) return;
                if (isSelected) onSetLevel(prowessLevel.level - 1);
                else if (currentUnarmedProwess === prowessLevel.level - 1)
                  onSetLevel(prowessLevel.level);
              }}
            >
              <div
                className={cn(
                  'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full',
                  isSelected
                    ? 'bg-primary-button text-text-on-dark'
                    : isPath
                      ? 'border border-border-light bg-surface'
                      : 'border border-border-light bg-surface-alt',
                )}
              >
                {isSelected && <Check className="h-4 w-4" />}
              </div>

              {isPath ? (
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-text-primary">{prowessLevel.name}</span>
                  {!isAvailable && (
                    <DescriptorChip size="sm" className="ml-2">
                      Level {prowessLevel.charLevel}
                    </DescriptorChip>
                  )}
                </div>
              ) : (
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary">{prowessLevel.name}</span>
                    {!isAvailable && (
                      <DescriptorChip size="sm">
                        Requires Level {prowessLevel.charLevel}
                      </DescriptorChip>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">{prowessLevel.description}</p>
                </div>
              )}

              <div
                className={cn(
                  'flex-shrink-0 rounded-lg px-3 py-1.5 text-sm font-bold',
                  isSelected
                    ? 'bg-primary-subtle-bg text-primary-fg'
                    : cn(statusPanel.warningBg, 'text-warning-fg'),
                )}
              >
                {tpCost} TP
              </div>
            </div>
          );
        })}
      </div>

      {currentUnarmedProwess > 0 && (
        <div
          className={cn(
            'flex items-center justify-between border-t border-border-light',
            isPath ? 'mt-4 pt-3' : 'mt-6 pt-4',
          )}
        >
          <span className="text-text-secondary">
            {isPath ? 'Total Unarmed Prowess:' : 'Total Unarmed Prowess Cost:'}
          </span>
          <span className={cn('font-bold text-primary-link-fg', !isPath && 'text-lg')}>
            {unarmedProwessTPCost} TP
          </span>
        </div>
      )}
    </div>
  );
}
