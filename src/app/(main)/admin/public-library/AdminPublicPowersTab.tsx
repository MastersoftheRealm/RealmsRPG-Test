/**
 * Admin Official Library — Powers tab
 * List displayed like Library. Edit opens Power Creator with item loaded; row delete remains.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DeleteConfirmModal, OfficialPowerList } from '@/components/shared';
import { useToast } from '@/components/ui';
import { useOfficialLibrary, usePowerParts } from '@/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Wand2 } from 'lucide-react';

const QUERY_KEY = ['official-library', 'powers'] as const;

export function AdminPublicPowersTab() {
  const { showToast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: items = [], isLoading, error, refetch } = useOfficialLibrary('powers');
  const { data: partsDb = [] } = usePowerParts();
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const handleDeleteFromList = async () => {
    if (!deleteConfirm) return;
    try {
      await apiFetch(`/api/official/powers?id=${encodeURIComponent(deleteConfirm.id)}`, {
        method: 'DELETE',
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      await queryClient.refetchQueries({ queryKey: QUERY_KEY });
      setDeleteConfirm(null);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to delete', 'error');
    }
  };

  return (
    <>
      <OfficialPowerList
        items={items as Array<Record<string, unknown>>}
        partsDb={partsDb}
        isLoading={isLoading}
        error={error}
        onRetry={() => { void refetch(); }}
        errorMessage="Failed to load official powers"
        sectionTitle="Official Powers"
        emptyIcon={<Wand2 className="w-8 h-8" />}
        emptyTitle="No official powers"
        emptyMessage="Add one from the header or publish from a creator."
        variant="admin"
        onEdit={(id) => router.push(`/power-creator?edit=${encodeURIComponent(id)}`)}
        onDelete={(id, name) => setDeleteConfirm({ id, name })}
      />

      {deleteConfirm && (
        <DeleteConfirmModal
          isOpen={true}
          itemName={deleteConfirm.name}
          itemType="power"
          deleteContext="Realms Library"
          isDeleting={false}
          onConfirm={handleDeleteFromList}
          onClose={() => setDeleteConfirm(null)}
        />
      )}
    </>
  );
}
