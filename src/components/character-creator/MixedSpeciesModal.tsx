/**
 * MixedSpeciesModal — Mixed-species dual picker
 * =============================================
 * Intentional non-USM shell (TASK-605): ordered pair of distinct species via
 * dual `<select>`s + source SegmentedControl — not list add-X / USM.
 * Call sites: Advanced `species-step`, sheet `edit-species-modal`, Guided `species-step` L2 card,
 * Guided Ancestry mixed overview (change parents).
 */

'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Modal, Button } from '@/components/ui';
import { SegmentedControl, type SourceFilterValue } from '@/components/shared';
import type { Species } from '@/hooks';

interface MixedSpeciesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    speciesA: { id: string; name: string },
    speciesB: { id: string; name: string },
  ) => void;
  allSpecies: Species[];
  userSpeciesIds: Set<string>;
  /** Prefill when changing an existing mixed pair (Ancestry overview). */
  initialSpeciesAId?: string;
  initialSpeciesBId?: string;
}

export function MixedSpeciesModal({
  isOpen,
  onClose,
  onConfirm,
  allSpecies,
  userSpeciesIds,
  initialSpeciesAId,
  initialSpeciesBId,
}: MixedSpeciesModalProps) {
  const [source, setSource] = useState<SourceFilterValue>('public');
  const [speciesAId, setSpeciesAId] = useState<string>('');
  const [speciesBId, setSpeciesBId] = useState<string>('');
  const wasOpen = useRef(false);

  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      const a = initialSpeciesAId ?? '';
      const b = initialSpeciesBId ?? '';
      setSpeciesAId(a);
      setSpeciesBId(b);
      setSource(a || b ? 'all' : 'public');
    }
    if (!isOpen && wasOpen.current) {
      setSpeciesAId('');
      setSpeciesBId('');
      setSource('public');
    }
    wasOpen.current = isOpen;
  }, [isOpen, initialSpeciesAId, initialSpeciesBId]);

  const filteredSpecies = useMemo(() => {
    if (source === 'my') return allSpecies.filter((s) => userSpeciesIds.has(s.id));
    if (source === 'public') return allSpecies.filter((s) => !userSpeciesIds.has(s.id));
    return allSpecies;
  }, [allSpecies, source, userSpeciesIds]);

  const speciesA = speciesAId ? filteredSpecies.find((s) => s.id === speciesAId) : null;
  const speciesB = speciesBId ? filteredSpecies.find((s) => s.id === speciesBId) : null;
  const optionsForB = useMemo(
    () => filteredSpecies.filter((s) => s.id !== speciesAId),
    [filteredSpecies, speciesAId],
  );
  const optionsForA = useMemo(
    () => filteredSpecies.filter((s) => s.id !== speciesBId),
    [filteredSpecies, speciesBId],
  );

  const canConfirm = speciesA && speciesB && speciesA.id !== speciesB.id;

  const handleConfirm = () => {
    if (!speciesA || !speciesB) return;
    onConfirm({ id: speciesA.id, name: speciesA.name }, { id: speciesB.id, name: speciesB.name });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mixed species"
      size="lg"
      fullScreenOnMobile
      flexLayout
      contentClassName="p-0"
      footer={
        <div className="flex shrink-0 justify-end gap-2 border-t border-border-light p-4">
          <Button variant="outline" onClick={onClose} className="min-h-[44px] min-w-[44px]">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="min-h-[44px] min-w-[44px]"
          >
            Confirm mixed species
          </Button>
        </div>
      }
    >
      <div className="space-y-4 p-4">
        <p className="text-sm text-text-secondary">
          Choose two species to play a mixed version. On the Ancestry step you will set physical
          traits (averaged), pick one species trait from each species, one ancestry trait, and
          optionally take a flaw for an extra ancestry trait from that same species.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-text-secondary">Source:</span>
          <SegmentedControl
            value={source}
            onChange={setSource}
            options={[
              { value: 'all', label: 'All sources' },
              { value: 'public', label: 'Public species' },
              { value: 'my', label: 'My species' },
            ]}
            aria-label="Species list source"
            className="min-w-0 flex-1 sm:flex-initial"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              First species
            </label>
            <select
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-text-primary"
              value={speciesAId}
              onChange={(e) => setSpeciesAId(e.target.value)}
              aria-label="First species"
            >
              <option value="">Select a species</option>
              {optionsForA.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Second species
            </label>
            <select
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-text-primary"
              value={speciesBId}
              onChange={(e) => setSpeciesBId(e.target.value)}
              aria-label="Second species"
            >
              <option value="">Select a species</option>
              {optionsForB.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {speciesA && speciesB && (
          <p className="text-sm font-medium text-primary-link-fg">
            Mixed: {speciesA.name} / {speciesB.name}
          </p>
        )}
      </div>
    </Modal>
  );
}
