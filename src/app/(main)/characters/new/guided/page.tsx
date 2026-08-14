/**
 * Guided Character Creator Page
 * =============================
 * Cohesive chapter-based creator (REALMS_PRODUCT_OVERVIEW.md §5.0).
 * `?entry=guided` → Path L1 + guided catalog faces; `?entry=custom` → Path L3.
 */

'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useIsClient } from '@/hooks';
import { LoadingState } from '@/components/ui';
import { GuidedCreatorShell } from '@/components/guided-creator';
import {
  buildOpenCustomPathEntryPatch,
  buildOpenGuidedPathEntryPatch,
} from '@/lib/guided-creator/path-selection-draft';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';

function guidedPathAfterEntryBootstrap(searchParams: URLSearchParams): string {
  const next = new URLSearchParams(searchParams.toString());
  next.delete('entry');
  const qs = next.toString();
  return qs ? `/characters/new/guided?${qs}` : '/characters/new/guided';
}

function GuidedEntryBootstrap() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const updateDraft = useGuidedCreatorStore((s) => s.updateDraft);
  const applied = useRef(false);

  useEffect(() => {
    if (applied.current) return;
    const entry = searchParams.get('entry');
    if (entry !== 'guided' && entry !== 'custom') return;
    applied.current = true;
    updateDraft(
      entry === 'custom' ? buildOpenCustomPathEntryPatch() : buildOpenGuidedPathEntryPatch()
    );
    router.replace(guidedPathAfterEntryBootstrap(searchParams), { scroll: false });
  }, [searchParams, updateDraft, router]);

  return null;
}

/**
 * The creator is guest-friendly (persists to localStorage; login is required only to save),
 * so the shell must not wait on the Supabase session round-trip — that put a blank screen on
 * the entry screen of the acquisition funnel (report 03 P1-6). `RevealStep` consumes `user`
 * lazily and gates saving behind `LoginPromptModal`.
 *
 * The client-only guard stays: the server has no `localStorage`, so rendering the shell
 * during SSR would mismatch the `currentSubStep` zustand-persist hydrates on the client.
 */
function GuidedCharacterCreatorInner() {
  const isClient = useIsClient();

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingState message="Loading..." size="lg" />
      </div>
    );
  }

  return (
    <>
      <GuidedEntryBootstrap />
      <GuidedCreatorShell />
    </>
  );
}

export default function GuidedCharacterCreatorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <LoadingState message="Loading..." size="lg" />
        </div>
      }
    >
      <GuidedCharacterCreatorInner />
    </Suspense>
  );
}
