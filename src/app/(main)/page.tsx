/**
 * Home / marketing landing (`/`).
 * Lives in the `(main)` route group so Header/Footer, `loading.tsx`, and `error.tsx`
 * apply. Do not wrap `(main)/layout` from a root App Router page (that remounts chrome).
 * OAuth `?code=` is redirected in `src/proxy.ts` before this page renders.
 */

import {
  HeroSection,
  UniquenessSection,
  HowItWorksSection,
  SecondaryDiscoverySection,
  CommunitySection,
} from '@/components/landing';

export default function HomePage() {
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
