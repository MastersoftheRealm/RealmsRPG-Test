/**
 * Crafting New — Redirect
 * =======================
 * Legacy route. Redirects to the crafting hub. New sessions are created from the hub
 * and open directly in /crafting/[id] (the single-page crafting tool).
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer, LoadingState } from '@/components/ui';

export default function NewCraftingRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/crafting');
  }, [router]);

  return (
    <PageContainer size="xl">
      <LoadingState message="Redirecting to crafting..." />
    </PageContainer>
  );
}
