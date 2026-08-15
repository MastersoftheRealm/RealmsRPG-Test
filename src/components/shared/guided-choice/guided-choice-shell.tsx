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
import type { CreatorLayer } from '@/stores/character-creator-store';
import type { StepCompletion } from '@/lib/character-creator-validation';
import { GuidedLayerNav } from './guided-layer-nav';

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
  /** Return to Layer 1 ("See recommendations"). */
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
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold',
        completion.done ? statusPanel.completeBadge : statusPanel.warningBadge,
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
  collapseLabel = 'See recommendations',
  canExpand = true,
  primaryAction,
  className,
}: GuidedChoiceShellProps) {
  const showGroups = layer === 1 && groups && groups.length > 0;
  const resolvedExpandLabel = expandLabel ?? (layer === 1 ? 'See more options' : 'See all');

  return (
    <div className={cn('w-full', className)}>
      {(title || description || completionState || primaryAction) && (
        <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h2 className="inline-flex flex-wrap items-center gap-1 text-2xl font-bold text-text-primary">
                {title}
                {titleAddon}
              </h2>
            )}
            {description && <p className="mt-1 text-text-secondary">{description}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {completionState && <CompletionBadge completion={completionState} />}
            {primaryAction}
          </div>
        </div>
      )}

      {guidance && <div className="mt-4">{guidance}</div>}

      {showGroups ? (
        <div className="mt-4 space-y-6">
          {groups!.map((group) => (
            <section
              key={group.id}
              aria-label={typeof group.title === 'string' ? group.title : undefined}
            >
              <div className="mb-2">
                <h3 className="text-lg font-semibold text-text-primary">{group.title}</h3>
                {group.why && <p className="mt-0.5 text-sm text-text-secondary">{group.why}</p>}
              </div>
              {group.children}
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-4">{children}</div>
      )}

      {(onExpandLayer || onCollapseLayer) && (
        <GuidedLayerNav
          expandLabel={layer === 1 && canExpand && onExpandLayer ? resolvedExpandLabel : undefined}
          onExpand={layer === 1 && canExpand ? onExpandLayer : undefined}
          collapseLabel={collapseLabel}
          onCollapse={layer > 1 ? onCollapseLayer : undefined}
        />
      )}
    </div>
  );
}
