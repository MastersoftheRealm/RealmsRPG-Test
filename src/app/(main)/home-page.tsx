/**
 * Home Page Content
 * =================
 * Modern TTRPG startup landing page (REALMS_PRODUCT_OVERVIEW.md Section 4).
 * AIDA scroll story with one dominant primary CTA:
 *   Hero -> Uniqueness -> How it works -> Secondary discovery -> Community.
 *
 * Not a route — imported by app/page.tsx for the root "/" URL.
 *
 * Removed in the TASK-387 rebuild: OnboardingTour + "Take a quick tour",
 * logged-in welcome link-farm, review carousel, equal-weight feature cards, and
 * Codex/Library landing CTAs (nav only). Returning users get a continue-focused
 * hero (handled inside HeroSection).
 */

'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoadingState } from '@/components/ui';
import {
  HeroSection,
  UniquenessSection,
  HowItWorksSection,
  SecondaryDiscoverySection,
  CommunitySection,
} from '@/components/landing';
import { sanitizeRedirectPath } from '@/lib/safe-redirect';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Redirect OAuth code to callback when Supabase redirects to / instead of /auth/callback
  const code = searchParams.get('code');
  useEffect(() => {
    if (code) {
      const next = sanitizeRedirectPath(searchParams.get('next'));
      router.replace(
        `/auth/callback?code=${encodeURIComponent(code)}${next !== '/' ? `&next=${encodeURIComponent(next)}` : ''}`
      );
    }
  }, [code, searchParams, router]);

  if (code) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-text-muted dark:text-text-secondary">Signing you in...</p>
      </div>
    );
  }

  return (
    <>
      <HeroSection />
      <UniquenessSection />
      <HowItWorksSection />
      <SecondaryDiscoverySection />
      <CommunitySection />
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<LoadingState message="Loading..." size="lg" padding="lg" />}>
      <HomeContent />
    </Suspense>
  );
}
