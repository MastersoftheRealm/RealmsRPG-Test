/**
 * Theme Toggle Component
 * ======================
 * Allows users to switch between dark, light, and system themes.
 * Uses next-themes for persistence and system preference detection.
 */

'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  /** Whether to show as a dropdown menu or inline buttons */
  variant?: 'dropdown' | 'inline';
  /** Additional className */
  className?: string;
}

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
] as const;

export function ThemeToggle({ variant = 'dropdown', className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-1 p-1 rounded-lg bg-surface-alt', className)}>
        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={cn(
              'p-2 rounded-md transition-colors',
              theme === value
                ? 'bg-primary-100 text-primary-600'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            )}
            title={label}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>
    );
  }

  // Dropdown variant - returns menu items to be used inside a dropdown
  return (
    <div className={cn('py-1', className)}>
      <div className="px-4 py-1 text-xs font-medium text-text-muted uppercase">Theme</div>
      {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-2 text-left transition-colors',
            theme === value
              ? 'bg-primary-50 text-primary-600'
              : 'text-text-secondary hover:bg-surface-alt'
          )}
        >
          <Icon className="w-4 h-4" />
          <span>{label}</span>
          {theme === value && (
            <span className="ml-auto text-primary-500">✓</span>
          )}
        </button>
      ))}
    </div>
  );
}
