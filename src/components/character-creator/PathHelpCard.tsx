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
        'mb-6 rounded-xl border-2 border-primary-subtle-border bg-primary-subtle-bg px-5 py-4 text-base ' +
        (className ?? '')
      }
      role="region"
      aria-label={`Guidance for path: ${pathName}`}
    >
      <p className="text-text-primary font-medium">
        As a <strong className="text-primary-fg">{pathName}</strong>, {children}
      </p>
    </div>
  );
}

export interface PathNotesProps {
  /** Path name for the accessible label. */
  pathName: string;
  /** Author-written level-1 guidance (path_data.level1.notes). */
  notes?: string;
  className?: string;
}

/**
 * Renders an archetype path's author-written level-1 notes
 * (`path_data.level1.notes`, parsed by archetype-path.ts) inside the creator.
 * Previously parsed but never surfaced (REALMS_PRODUCT_OVERVIEW.md Appendix C).
 * Renders nothing when there are no notes.
 */
export function PathNotes({ pathName, notes, className }: PathNotesProps) {
  const trimmed = notes?.trim();
  if (!trimmed) return null;
  return (
    <div
      className={
        'mb-6 rounded-xl border border-primary-subtle-border bg-primary-subtle-bg/60 px-5 py-4 ' +
        (className ?? '')
      }
      role="note"
      aria-label={`Path notes for ${pathName}`}
    >
      <p className="text-sm font-semibold text-primary-fg mb-1">Path guidance</p>
      <p className="text-sm text-text-secondary whitespace-pre-wrap">{trimmed}</p>
    </div>
  );
}
