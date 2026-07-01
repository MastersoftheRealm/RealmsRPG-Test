/**
 * GuidedStepLayout — consistent step chrome (landing typography).
 */

'use client';

import type { ReactNode } from 'react';
import { GuidedStepFooter } from './guided-step-footer';
import { useGuidedCreatorStore, type GuidedSubStep } from '@/stores/guided-creator-store';

export interface GuidedStepLayoutProps {
  subStep: GuidedSubStep;
  title: string;
  description?: ReactNode;
  guidance?: ReactNode;
  children: ReactNode;
  canContinue?: boolean;
  continueLabel?: string;
  completionHint?: ReactNode;
  primaryAction?: ReactNode;
  /** Override default footer back (e.g. ancestry micro-flow). */
  footerBack?: () => void;
  /** Override default footer continue (e.g. ancestry micro-flow). */
  footerContinue?: () => void;
  hideBack?: boolean;
}

export function GuidedStepLayout({
  subStep,
  title,
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
}: GuidedStepLayoutProps) {
  const { prevSubStep, nextSubStep } = useGuidedCreatorStore();

  return (
    <div className="flex flex-col pb-24">
      <header className="mb-4">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-text-primary">{title}</h2>
        {description && (
          <p className="mt-2 font-nunito text-base text-text-secondary leading-relaxed">{description}</p>
        )}
      </header>

      {guidance && (
        <div className="mb-5 rounded-card border border-border-light dark:border-border bg-primary-subtle-bg/50 px-4 py-3 font-nunito text-sm text-text-secondary">
          {guidance}
        </div>
      )}

      <div className="flex-1">{children}</div>

      <GuidedStepFooter
        onBack={hideBack ? undefined : (footerBack ?? prevSubStep)}
        onContinue={primaryAction ? undefined : (footerContinue ?? nextSubStep)}
        continueDisabled={!canContinue}
        continueLabel={continueLabel ?? 'Continue'}
        backLabel="Back"
        completionHint={completionHint}
        primaryAction={primaryAction}
      />
    </div>
  );
}
