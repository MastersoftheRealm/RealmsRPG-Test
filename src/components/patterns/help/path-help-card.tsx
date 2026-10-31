/**
 * PathHelpCard
 * ============
 * Consistent archetype-path help card for character creator steps.
 * Renders below the step description, above page content.
 * Use for "Choose a Path" flows so messaging is user-friendly and visible.
 */

'use client';

import { ReactNode } from 'react';

/** Strip a leading "As a {pathName}," when notes already include it (codex level1.notes). */
export function stripRedundantPathHelpLead(notes: string, pathName: string): string {
  const trimmed = notes.trim();
  if (!trimmed || !pathName.trim()) return trimmed;
  const escaped = pathName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return trimmed.replace(new RegExp(`^As a\\s+${escaped}\\s*,\\s*`, 'i'), '');
}

export interface PathHelpCardProps {
  /** Archetype path name (e.g. from draft.archetype?.name) */
  pathName: string;
  /** Message content; can be a paragraph or list */
  children: ReactNode;
  /** Optional controls below the guidance sentence (e.g. path skill chips). */
  actions?: ReactNode | undefined;
  /** Optional className */
  className?: string | undefined;
}

export function PathHelpCard({ pathName, children, actions, className }: PathHelpCardProps) {
  return (
    <div
      className={
        'mb-6 rounded-xl border-2 border-primary-subtle-border bg-primary-subtle-bg px-5 py-4 text-base ' +
        (className ?? '')
      }
      role="region"
      aria-label={`Guidance for path: ${pathName}`}
    >
      <p className="font-medium text-text-primary">
        As a <strong className="text-primary-fg">{pathName}</strong>, {children}
      </p>
      {actions ? <div className="mt-3">{actions}</div> : null}
    </div>
  );
}
