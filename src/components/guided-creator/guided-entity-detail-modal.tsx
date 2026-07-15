/**
 * GuidedEntityDetailModal — read-only deep-dive for a choice-card entity.
 *
 * Progressive disclosure on the card:
 *   truncated copy → inline Read more → More details (this modal).
 * Distinct from catalog Layer 2 (`GuidedLayerNav` / browse panels).
 */

'use client';

import type { ReactNode } from 'react';
import { Button, Modal } from '@/components/ui';
import { CollapsibleSection } from '@/components/creator';
import { InfoTippy } from '@/components/shared';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { cn } from '@/lib/utils';
import { GUIDED_OVERVIEW_STYLES as o } from './guided-choice-styles';

export interface GuidedEntityDetailSection {
  id: string;
  title: string;
  subtitle?: string;
  /** Hover/focus tip explaining pick counts or section purpose (InfoTippy). */
  tip?: ReactNode;
  collapsedSummary?: string;
  defaultExpanded?: boolean;
  itemCount?: number;
  children: ReactNode;
}

export interface GuidedEntityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  /** Short header line under the title (optional). */
  description?: string;
  /** Primary overview block (vitals, prose, proficiency, etc.). */
  overview: ReactNode;
  /** Expandable option catalogs below the overview. Omit or pass [] when empty. */
  sections?: GuidedEntityDetailSection[];
  /**
   * Optional bridge above catalogs (e.g. Path Options title + intro).
   * Rendered only when `sections` is non-empty so overview stays about the entity itself.
   */
  optionsPreamble?: ReactNode;
  /** Override footer actions (default: Close). */
  footer?: ReactNode;
  size?: 'md' | 'lg' | 'xl' | '2xl' | 'full';
  className?: string;
}

export function GuidedEntityDetailModal({
  isOpen,
  onClose,
  title,
  description,
  overview,
  sections = [],
  optionsPreamble,
  footer,
  size = '2xl',
  className,
}: GuidedEntityDetailModalProps) {
  const copy = GUIDED_CREATOR_COPY.entityDetail;
  const hasSections = sections.length > 0;
  const hasOptionsRegion = hasSections || Boolean(optionsPreamble);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size={size}
      flexLayout
      fullScreenOnMobile
      className={className}
      contentClassName="px-4 pb-4 pt-2 sm:px-6 sm:pb-6"
      footer={
        footer ?? (
          <div className="flex shrink-0 justify-end gap-2 border-t border-border-light bg-surface px-4 py-3 sm:px-6">
            <Button variant="secondary" onClick={onClose} className="min-h-[44px]">
              {copy.close}
            </Button>
          </div>
        )
      }
    >
      <div className="flex flex-col gap-6">
        {/*
          Modal title is h2. Overview uses a styled label (not a heading) so catalogs can be
          CollapsibleSection headingLevel={3} without skipping levels.
        */}
        <section aria-labelledby="guided-entity-overview-heading" className="space-y-3">
          <div id="guided-entity-overview-heading" className={o.sectionTitle}>
            {copy.overviewHeading}
          </div>
          <div className={cn('space-y-4 text-base leading-relaxed', o.body)}>{overview}</div>
        </section>

        {hasOptionsRegion ? (
          <section aria-label={copy.optionsRegionLabel} className="flex flex-col gap-3">
            {optionsPreamble ? <div className="mb-1">{optionsPreamble}</div> : null}
            {sections.map((section) => (
              <CollapsibleSection
                key={section.id}
                title={section.title}
                subtitle={section.subtitle}
                collapsedSummary={section.collapsedSummary}
                defaultExpanded={section.defaultExpanded ?? false}
                itemCount={section.itemCount}
                headingLevel={3}
                rightSlot={
                  section.tip ? (
                    <InfoTippy
                      content={section.tip}
                      label={`About ${section.title}`}
                      size="icon"
                    />
                  ) : undefined
                }
              >
                {section.children}
              </CollapsibleSection>
            ))}
          </section>
        ) : null}
      </div>
    </Modal>
  );
}
