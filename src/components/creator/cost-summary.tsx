/**
 * CostSummary Component
 * =====================
 * Displays calculated costs (TP, Energy, IP, Currency, etc.) in a consistent format.
 * Used by all creator tools to show the resource cost of the created item/power/technique.
 */

'use client';

import { cn } from '@/lib/utils';
import { Zap, Target, Coins, Shield, Flame } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface CostItem {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  color?: 'amber' | 'purple' | 'blue' | 'green' | 'red' | 'gray';
  sublabel?: string;
}

interface CostSummaryProps {
  title?: string;
  costs: CostItem[];
  className?: string;
  layout?: 'grid' | 'stack';
  columns?: 2 | 3 | 4;
}

// Default icons based on common label patterns
const DEFAULT_ICONS: Record<string, LucideIcon> = {
  'Training Points': Target,
  'TP': Target,
  'Energy': Zap,
  'Stamina': Flame,
  'Gold': Coins,
  'Currency': Coins,
  'IP': Shield,
  'Item Power': Shield,
};

// Default colors based on label patterns
const DEFAULT_COLORS: Record<string, CostItem['color']> = {
  'Training Points': 'purple',
  'TP': 'purple',
  'Energy': 'blue',
  'Stamina': 'amber',
  'Gold': 'amber',
  'Currency': 'amber',
  'IP': 'green',
  'Item Power': 'green',
};

const colorClasses: Record<NonNullable<CostItem['color']>, { bg: string; text: string; icon: string }> = {
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'text-amber-600' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'text-purple-600' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'text-blue-600' },
  green: { bg: 'bg-green-50', text: 'text-green-600', icon: 'text-green-600' },
  red: { bg: 'bg-red-50', text: 'text-red-600', icon: 'text-red-600' },
  gray: { bg: 'bg-gray-50', text: 'text-gray-600', icon: 'text-gray-600' },
};

export function CostSummary({
  title,
  costs,
  className,
  layout = 'grid',
  columns = 2,
}: CostSummaryProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  return (
    <div className={className}>
      {title && (
        <h4 className="text-sm font-medium text-gray-700 mb-3">{title}</h4>
      )}
      <div className={cn(
        layout === 'grid' ? `grid ${gridCols[columns]} gap-3` : 'space-y-3'
      )}>
        {costs.map((cost, index) => {
          const color = cost.color || DEFAULT_COLORS[cost.label] || 'gray';
          const Icon = cost.icon || DEFAULT_ICONS[cost.label];
          const colors = colorClasses[color];

          return (
            <div
              key={index}
              className={cn(
                'rounded-lg p-4 text-center',
                colors.bg
              )}
            >
              {Icon && (
                <Icon className={cn('w-6 h-6 mx-auto mb-1', colors.icon)} />
              )}
              <div className={cn('text-2xl font-bold', colors.text)}>
                {typeof cost.value === 'number' ? cost.value.toLocaleString() : cost.value}
              </div>
              <div className={cn('text-xs', colors.text)}>
                {cost.label}
              </div>
              {cost.sublabel && (
                <div className={cn('text-xs mt-1 opacity-75', colors.text)}>
                  {cost.sublabel}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
