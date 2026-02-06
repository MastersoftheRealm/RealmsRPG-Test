/**
 * Encounter Detail Redirect
 * ===========================
 * Redirects /encounters/[id] to the correct encounter type page.
 */

'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer, LoadingState, Alert } from '@/components/ui';
import { useEncounter } from '@/hooks';
import Link from 'next/link';

interface PageParams {
  params: Promise<{ id: string }>;
}

export default function EncounterRedirectPage({ params }: PageParams) {
  const { id } = use(params);
  const router = useRouter();
  const { data: encounter, isLoading, error } = useEncounter(id);

  useEffect(() => {
    if (encounter) {
      router.replace(`/encounters/${id}/${encounter.type}`);
    }
  }, [encounter, id, router]);

  if (isLoading) {
    return (
      <PageContainer size="xl">
        <LoadingState message="Loading encounter..." size="lg" />
      </PageContainer>
    );
  }

  if (error || (!isLoading && !encounter)) {
    return (
      <PageContainer size="xl">
        <Alert variant="danger" title="Encounter not found">
          This encounter may have been deleted or you may not have access.
        </Alert>
        <Link
          href="/encounters"
          className="mt-4 inline-block text-primary-600 hover:underline"
        >
          Back to Encounters
        </Link>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="xl">
      <LoadingState message="Redirecting..." />
    </PageContainer>
  );
}
