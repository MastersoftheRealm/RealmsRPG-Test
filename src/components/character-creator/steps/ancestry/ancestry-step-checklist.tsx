'use client';

import { cn } from '@/lib/utils';
import { PathHelpCard, PathNotes } from '@/components/character-creator/PathHelpCard';
import { statusPanel } from '@/lib/ui/status-surface-classes';
import type { CharacterDraft } from '@/types';
import type { ValidationIssue } from '@/lib/character-creator-validation';

export interface AncestryStepChecklistProps {
  draft: CharacterDraft;
  ancestryIssues: ValidationIssue[];
  ancestryPathNotes: string | undefined;
}

export function AncestryStepChecklist({
  draft,
  ancestryIssues,
  ancestryPathNotes,
}: AncestryStepChecklistProps) {
  return (
    <>
      {draft.creationMode === 'path' && draft.archetype?.name && (
        <>
          <PathHelpCard pathName={draft.archetype.name}>
            Complete each ancestry choice below. The checklist updates as you go.
          </PathHelpCard>
          <PathNotes pathName={draft.archetype.name} notes={ancestryPathNotes} />
        </>
      )}
      <div
        className={cn(
          'mb-6 rounded-xl border-2 p-4',
          ancestryIssues.length === 0 ? statusPanel.complete : statusPanel.info,
        )}
        role="region"
        aria-label="Ancestry choices remaining"
      >
        <h3 className="mb-2 font-semibold text-text-primary">What to choose</h3>
        {ancestryIssues.length === 0 ? (
          <p className="text-sm text-success-fg">
            ✓ Your ancestry is complete. Nothing left to pick.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {ancestryIssues.map((issue, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <span aria-hidden className="shrink-0">
                  {issue.emoji}
                </span>
                <span>{issue.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
