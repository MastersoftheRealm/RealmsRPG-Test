/**
 * Onboarding Tour
 * ===============
 * Optional first-time guided tour: Codex → Library → Character creator → Save.
 * Skip prominent; "Don't show again" stored in localStorage.
 */

'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Modal, Button } from '@/components/ui';
import { BookOpen, Library, Sparkles, CheckCircle } from 'lucide-react';

const TOUR_COMPLETED_KEY = 'realms_tour_completed';

const TOUR_STEPS: Array<{ title: string; body: React.ReactNode; icon: React.ReactNode }> = [
  {
    title: 'Welcome to Realms',
    body: (
      <>
        <p className="text-text-secondary mb-3">
          Here&apos;s a quick overview of where to find everything. You can skip anytime.
        </p>
      </>
    ),
    icon: <Sparkles className="w-8 h-8 text-primary-500" />,
  },
  {
    title: 'Realms Codex',
    body: (
      <>
        <p className="text-text-secondary mb-3">
          The <strong className="text-text-primary">Codex</strong> is the game&apos;s reference: species, feats, skills, equipment, and parts. Use it when building characters or creating custom content.
        </p>
        <Link href="/codex" className="text-primary-600 dark:text-primary-400 hover:underline font-medium text-sm">
          Open Codex →
        </Link>
      </>
    ),
    icon: <BookOpen className="w-8 h-8 text-primary-500" />,
  },
  {
    title: 'Library',
    body: (
      <>
        <p className="text-text-secondary mb-3">
          <strong className="text-text-primary">Realms Library</strong> has official powers, techniques, armaments, and creatures. <strong className="text-text-primary">My Library</strong> is your personal collection—add from Realms Library to use as-is or customize.
        </p>
        <Link href="/library" className="text-primary-600 dark:text-primary-400 hover:underline font-medium text-sm">
          Open Library →
        </Link>
      </>
    ),
    icon: <Library className="w-8 h-8 text-primary-500" />,
  },
  {
    title: 'Character creator & save',
    body: (
      <>
        <p className="text-text-secondary mb-3">
          Create a character using the Codex and Realms Library at each step. When you&apos;re ready, sign in and save—your character will be ready for the table.
        </p>
        <Link href="/characters/new" className="text-primary-600 dark:text-primary-400 hover:underline font-medium text-sm">
          Create a character →
        </Link>
      </>
    ),
    icon: <CheckCircle className="w-8 h-8 text-primary-500" />,
  },
];

export function getTourCompleted(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(TOUR_COMPLETED_KEY) === 'true';
}

export function setTourCompleted(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
  }
}

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingTour({ isOpen, onClose }: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const close = useCallback(() => {
    if (dontShowAgain) setTourCompleted();
    setStep(0);
    setDontShowAgain(false);
    onClose();
  }, [dontShowAgain, onClose]);

  const handleNext = () => {
    if (step >= TOUR_STEPS.length - 1) {
      if (dontShowAgain) setTourCompleted();
      setStep(0);
      setDontShowAgain(false);
      onClose();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleSkip = () => {
    close();
  };

  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={`${current.title} (${step + 1} of ${TOUR_STEPS.length})`}
      titleA11y="Guided tour"
      size="md"
      showCloseButton={true}
      footer={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 border-t border-border-light bg-surface-alt/50">
          <label className="flex items-center gap-2 cursor-pointer min-h-[44px] order-2 sm:order-1">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded border-border-light"
              aria-label="Don't show this tour again"
            />
            <span className="text-sm text-text-secondary">Don&apos;t show again</span>
          </label>
          <div className="flex gap-2 order-1 sm:order-2">
            <Button variant="secondary" onClick={handleSkip} className="min-h-[44px]">
              Skip
            </Button>
            <Button onClick={handleNext} className="min-h-[44px]">
              {isLast ? 'Done' : 'Next'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex gap-4">
        <div className="flex-shrink-0">{current.icon}</div>
        <div className="min-w-0 flex-1">{current.body}</div>
      </div>
    </Modal>
  );
}
