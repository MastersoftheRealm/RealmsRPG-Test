/**
 * PathHelpCard
 * ============
 * Consistent archetype-path help card for character creator steps.
 * Renders below the step description, above page content.
 * Use for "Choose a Path" flows so messaging is user-friendly and visible.
 */

'use client';

import { ReactNode } from 'react';

export interface PathHelpCardProps {
  /** Archetype path name (e.g. from draft.archetype?.name) */
  pathName: string;
  /** Message content; can be a paragraph or list */
  children: ReactNode;
  /** Optional className */
  className?: string;
}

export function PathHelpCard({ pathName, children, className }: PathHelpCardProps) {
  return (
    <div
      className={
        'mb-6 rounded-xl border-2 border-primary-200 dark:border-primary-800 bg-primary-50/80 dark:bg-primary-900/20 px-5 py-4 text-base ' +
        (className ?? '')
      }
      role="region"
      aria-label={`Guidance for path: ${pathName}`}
    >
      <p className="text-text-primary font-medium">
        As a <strong className="text-primary-700 dark:text-primary-300">{pathName}</strong>, {children}
      </p>
    </div>
  );
}
