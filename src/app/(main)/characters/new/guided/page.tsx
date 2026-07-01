/**
 * Guided ("Simple") Character Creator Page
 * ========================================
 * Chapter-based onboarding creator (REALMS_PRODUCT_OVERVIEW.md §5.0).
 * Separate from the Advanced creator at /characters/new/advanced.
 */

'use client';

import { useAuth } from '@/hooks';
import { LoadingState } from '@/components/ui';
import { GuidedCreatorShell } from '@/components/guided-creator';

export default function GuidedCharacterCreatorPage() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingState message="Loading..." size="lg" />
      </div>
    );
  }

  return <GuidedCreatorShell />;
}
