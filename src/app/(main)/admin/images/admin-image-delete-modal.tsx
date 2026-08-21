'use client';

import { Modal, Button } from '@/components/ui';
import { AlertTriangle } from 'lucide-react';
import type { RealmsImageUsageRef } from '@/lib/realms-images';

const ENTITY_KIND_LABELS: Record<string, string> = {
  species: 'Species',
  equipment: 'Equipment',
  creature: 'Creature',
  item: 'Armament',
  power: 'Power',
  technique: 'Technique',
  empowered_technique: 'Empowered technique',
  user_species: 'User species',
  user_creature: 'User creature',
  user_item: 'User armament',
  user_power: 'User power',
  user_technique: 'User technique',
  user_empowered_technique: 'User empowered technique',
};

function formatEntityKind(kind: string): string {
  return ENTITY_KIND_LABELS[kind] ?? kind;
}

export interface AdminImageDeleteModalProps {
  isOpen: boolean;
  imageName: string;
  usages: RealmsImageUsageRef[];
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function AdminImageDeleteModal({
  isOpen,
  imageName,
  usages,
  isDeleting,
  onConfirm,
  onClose,
}: AdminImageDeleteModalProps) {
  const hasUsages = usages.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Delete ${imageName}?`}
      size="md"
      fullScreenOnMobile
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            size="lg"
            variant="danger"
            onClick={onConfirm}
            disabled={isDeleting}
            isLoading={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete image'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-danger-300 bg-danger-light p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-danger-fg" aria-hidden />
          <div className="text-sm text-text-primary">
            <p className="font-medium">This permanently removes the image from the shared bank.</p>
            {hasUsages ? (
              <p className="mt-1 text-text-secondary">
                {usages.length} {usages.length === 1 ? 'entity uses' : 'entities use'} this image.
                Deleting clears the image reference everywhere — entities will show placeholder art
                until a new image is assigned.
              </p>
            ) : (
              <p className="mt-1 text-text-secondary">
                No entities currently reference this image.
              </p>
            )}
          </div>
        </div>

        {hasUsages && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-text-secondary">Referenced by</h3>
            <ul className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-border-light bg-surface-alt p-3 text-sm">
              {usages.map((usage) => (
                <li key={`${usage.table}-${usage.id}`} className="text-text-primary">
                  <span className="font-medium">{usage.name ?? usage.id}</span>
                  <span className="text-text-muted"> — {formatEntityKind(usage.entityKind)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}
