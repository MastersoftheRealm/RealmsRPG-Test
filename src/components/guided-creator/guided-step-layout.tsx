/**
 * GuidedStepLayout — consistent step chrome (landing typography).
 */

'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { GuidedStepFooter } from './guided-step-footer';
import { useGuidedCreatorStore, type GuidedSubStep } from '@/stores/guided-creator-store';

export interface GuidedStepLayoutProps {
  subStep: GuidedSubStep;
  title: string;
  /** Optional help beside the title (e.g. InfoTippy). */
  titleAddon?: ReactNode | undefined;
  description?: ReactNode | undefined;
  guidance?: ReactNode | undefined;
  children: ReactNode;
  canContinue?: boolean | undefined;
  continueLabel?: string | undefined;
  completionHint?: ReactNode | undefined;
  primaryAction?: ReactNode | undefined;
  /** Override default footer back (e.g. ancestry micro-flow). */
  footerBack?: (() => void) | undefined;
  /** Override default footer continue (e.g. ancestry micro-flow). */
  footerContinue?: (() => void) | undefined;
  /** Continue chrome: primary forward (default) or outline shallower (e.g. loadout L2). */
  continueTone?: 'progress' | 'previous' | undefined;
  hideBack?: boolean | undefined;
}

export function GuidedStepLayout({
  title,
  titleAddon,
  description,
  guidance,
  children,
  canContinue = true,
  continueLabel,
  completionHint,
  primaryAction,
  hideBack,
  footerBack,
  footerContinue,
  continueTone,
}: GuidedStepLayoutProps) {
  const { prevSubStep, nextSubStep } = useGuidedCreatorStore();

  return (
    <div className={cn('flex flex-col', completionHint ? 'pb-32 sm:pb-24' : 'pb-24')}>
      <header className="mb-4">
        <div className="flex items-center gap-1">
          <h2 className="font-display text-2xl font-bold text-text-primary sm:text-3xl">{title}</h2>
          {titleAddon}
        </div>
        {description && (
          <p className="mt-2 font-nunito text-base leading-relaxed text-text-secondary">
            {description}
          </p>
        )}
      </header>

      {guidance && (
        <div className="mb-5 rounded-card border border-border-light bg-primary-subtle-bg/50 px-4 py-3 font-nunito text-sm text-text-secondary dark:border-border">
          {guidance}
        </div>
      )}

      <div className="flex-1">{children}</div>

      <GuidedStepFooter
        onBack={hideBack ? undefined : (footerBack ?? prevSubStep)}
        onContinue={primaryAction ? undefined : (footerContinue ?? nextSubStep)}
        continueDisabled={!canContinue}
        continueLabel={continueLabel ?? 'Continue'}
        continueTone={continueTone}
        backLabel="Back"
        completionHint={completionHint}
        primaryAction={primaryAction}
      />
    </div>
  );
}
