/**
 * GuidedChoiceShell
 * =================
 * Unified Layer 1 / 2 / 3 chrome for character-creator (and future creator) steps.
 * Implements the three-layer interaction model from REALMS_PRODUCT_OVERVIEW.md §3:
 *
 *   Layer 1 (Guided)  → grouped recommendations with one-line "why" copy.
 *   Layer 2/3 (Full)  → the step's own filters + full catalog (passed as children).
 *
 * The shell owns: the header (title/description/completion badge/primary action),
 * the guidance slot, the recommendation groups, and the expand/collapse affordances.
 * Steps keep ownership of their actual choice rows.
 */

'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { statusPanel } from '@/lib/ui/status-surface-classes';
import { Button } from '@/components/ui';
import type { CreatorLayer } from '@/stores/character-creator-store';
import type { StepCompletion } from '@/lib/character-creator-validation';

export interface GuidedChoiceGroup {
  id: string;
  /** Group heading, e.g. "Sturdy tank" or "Recommended weapons". */
  title: ReactNode;
  /** One-line "why pick this" copy (Appendix D). */
  why?: ReactNode;
  /** The choice rows/cards for this group. */
  children: ReactNode;
}

export interface GuidedChoiceShellProps {
  /** Current disclosure layer for this step. */
  layer: CreatorLayer;
  title?: ReactNode;
  /** Optional help icon or badge beside the title (e.g. InfoTippy). */
  titleAddon?: ReactNode;
  description?: ReactNode;
  /** Path guidance (e.g. PathHelpCard / PathNotes). Rendered above the choices. */
  guidance?: ReactNode;
  /** Drives the completion badge ("2 / 3 feats"). */
  completionState?: StepCompletion;
  /** Recommendation groups shown at Layer 1. */
  groups?: GuidedChoiceGroup[];
  /** Full-system content (filters + full list); shown at Layer 2+. */
  children?: ReactNode;
  /** Advance one layer (1 → 2 → 3). */
  onExpandLayer?: () => void;
  /** Return to Layer 1 ("Back to recommendations"). */
  onCollapseLayer?: () => void;
  expandLabel?: string;
  collapseLabel?: string;
  /** Hide the expand affordance (e.g. nothing more to reveal). */
  canExpand?: boolean;
  /** Optional header-level primary action. */
  primaryAction?: ReactNode;
  className?: string;
}

function CompletionBadge({ completion }: { completion: StepCompletion }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold shrink-0',
        completion.done ? statusPanel.completeBadge : statusPanel.warningBadge
      )}
      aria-live="polite"
    >
      {completion.done && <span aria-hidden>✓</span>}
      {completion.label}
    </span>
  );
}

export function GuidedChoiceShell({
  layer,
  title,
  titleAddon,
  description,
  guidance,
  completionState,
  groups,
  children,
  onExpandLayer,
  onCollapseLayer,
  expandLabel,
  collapseLabel = 'Back to recommendations',
  canExpand = true,
  primaryAction,
  className,
}: GuidedChoiceShellProps) {
  const showGroups = layer === 1 && groups && groups.length > 0;
  const resolvedExpandLabel = expandLabel ?? (layer === 1 ? 'See more options' : 'See all');

  return (
    <div className={cn('w-full', className)}>
      {(title || description || completionState || primaryAction) && (
        <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            {title && (
              <h2 className="text-2xl font-bold text-text-primary inline-flex items-center gap-1 flex-wrap">
                {title}
                {titleAddon}
              </h2>
            )}
            {description && <p className="text-text-secondary mt-1">{description}</p>}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {completionState && <CompletionBadge completion={completionState} />}
            {primaryAction}
          </div>
        </div>
      )}

      {guidance && <div className="mt-4">{guidance}</div>}

      {showGroups ? (
        <div className="space-y-6 mt-4">
          {groups!.map((group) => (
            <section key={group.id} aria-label={typeof group.title === 'string' ? group.title : undefined}>
              <div className="mb-2">
                <h3 className="text-lg font-semibold text-text-primary">{group.title}</h3>
                {group.why && <p className="text-sm text-text-secondary mt-0.5">{group.why}</p>}
              </div>
              {group.children}
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-4">{children}</div>
      )}

      {(onExpandLayer || onCollapseLayer) && (
        <div className="flex flex-wrap items-center gap-3 mt-5">
          {layer < 3 && canExpand && onExpandLayer && (
            <Button type="button" variant="outline" size="sm" onClick={onExpandLayer} className="min-h-11">
              {resolvedExpandLabel}
            </Button>
          )}
          {layer > 1 && onCollapseLayer && (
            <Button type="button" variant="link" onClick={onCollapseLayer} className="min-h-11 px-0">
              ← {collapseLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
