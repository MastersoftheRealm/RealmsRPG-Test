'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Map } from 'lucide-react';
import { Button, useToast } from '@/components/ui';
import { openEncounterTabletop } from '@/services/tabletop-service';

interface OpenTabletopButtonProps {
  encounterId: string;
  campaignId?: string | undefined;
  onBeforeOpen?: (() => Promise<void>) | undefined;
}

export function OpenTabletopButton({
  encounterId,
  campaignId,
  onBeforeOpen,
}: OpenTabletopButtonProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!campaignId) {
      showToast('Link this encounter to a campaign before opening the tabletop.', 'error');
      return;
    }
    setLoading(true);
    try {
      await onBeforeOpen?.();
      const result = await openEncounterTabletop(encounterId);
      router.push(`/campaigns/${result.campaignId}/tabletop?scene=${result.sceneId}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to open tabletop.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button type="button" variant="secondary" onClick={handleClick} isLoading={loading}>
      <Map className="h-4 w-4" aria-hidden />
      Open Tabletop
    </Button>
  );
}
