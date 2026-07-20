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
        'border border-border-light rounded-lg bg-surface',
        isPath ? 'mb-6 p-4' : 'mb-8 p-6'
      )}
    >
      {isPath ? (
        <>
          <h3 className="text-lg font-semibold text-text-primary mb-2">Unarmed Prowess</h3>
          <p className="text-sm text-text-secondary mb-4">
            Your path recommends Unarmed Prowess. Add it below if you want to use unarmed combat.
          </p>
        </>
      ) : (
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-full bg-warning-light">
            <Swords className="w-8 h-8 text-martial-dark" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-text-primary mb-1">Unarmed Prowess</h3>
            <p className="text-text-secondary text-sm">
              Master the art of unarmed combat. Your fists become deadly weapons,
              dealing increasing damage as you train. Upgrades become available at higher character levels.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {availableLevels.map((prowessLevel) => {
          const isAvailable = prowessLevel.charLevel <= characterLevel;
          const isSelected = currentUnarmedProwess >= prowessLevel.level;
          const tpCost = prowessLevel.level === 1 ? UNARMED_PROWESS_BASE_TP : UNARMED_PROWESS_UPGRADE_TP;
          const canSelect = isAvailable && (currentUnarmedProwess === prowessLevel.level - 1 || isSelected);

          return (
            <div
              key={prowessLevel.level}
              className={cn(
                'flex items-center gap-4 rounded-lg border transition-all',
                isPath ? 'p-3' : 'p-4',
                isSelected
                  ? 'bg-primary-subtle-bg border-primary-subtle-border'
                  : isPath
                    ? 'bg-surface-alt border-border-light'
                    : 'bg-surface border-border-light',
                !isAvailable && 'opacity-50',
                canSelect && !isSelected && 'hover:border-primary-outline-border cursor-pointer'
              )}
              onClick={() => {
                if (!isAvailable) return;
                if (isSelected) onSetLevel(prowessLevel.level - 1);
                else if (currentUnarmedProwess === prowessLevel.level - 1) onSetLevel(prowessLevel.level);
              }}
            >
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                  isSelected
                    ? 'bg-primary-button text-text-on-dark'
                    : isPath
                      ? 'bg-surface border border-border-light'
                      : 'bg-surface-alt border border-border-light'
                )}
              >
                {isSelected && <Check className="w-4 h-4" />}
              </div>

              {isPath ? (
                <div className="flex-1 min-w-0">
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
                  <p className="text-sm text-text-secondary mt-1">{prowessLevel.description}</p>
                </div>
              )}

              <div
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-bold flex-shrink-0',
                  isSelected ? 'bg-primary-subtle-bg text-primary-fg' : cn(statusPanel.warningBg, 'text-warning-fg')
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
            'border-t border-border-light flex items-center justify-between',
            isPath ? 'mt-4 pt-3' : 'mt-6 pt-4'
          )}
        >
          <span className="text-text-secondary">
            {isPath ? 'Total Unarmed Prowess:' : 'Total Unarmed Prowess Cost:'}
          </span>
          <span
            className={cn(
              'font-bold text-primary-link-fg',
              !isPath && 'text-lg'
            )}
          >
            {unarmedProwessTPCost} TP
          </span>
        </div>
      )}
    </div>
  );
}
