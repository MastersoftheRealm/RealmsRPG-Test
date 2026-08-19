/**
 * Add character to campaign modal (TASK-666c)
 */

'use client';

import { Button, Modal } from '@/components/ui';
import { PortraitThumb } from '@/components/character/portrait-thumb';

export type AddableCampaignCharacter = {
  id: string;
  name: string;
  level: number;
  portrait?: string | undefined;
  archetypeName?: string | undefined;
  ancestryName?: string | undefined;
  visibility?: string | undefined;
};

export function AddCharacterModal({
  characters,
  onSelect,
  onClose,
  loading,
}: {
  characters: AddableCampaignCharacter[];
  onSelect: (char: AddableCampaignCharacter) => void;
  onClose: () => void;
  loading: boolean;
}) {
  if (characters.length === 0) {
    return (
      <Modal isOpen onClose={onClose} title="Add Character" fullScreenOnMobile>
        <p className="text-text-secondary">You have no more characters to add.</p>
        <Button className="mt-4" onClick={onClose}>
          Close
        </Button>
      </Modal>
    );
  }

  return (
    <Modal isOpen onClose={onClose} title="Add Character to Campaign" fullScreenOnMobile>
      <div className="max-h-64 space-y-2 overflow-y-auto">
        {characters.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c)}
            disabled={loading}
            className="flex w-full items-center gap-3 rounded-lg border border-border-light p-3 text-left transition-colors hover:bg-surface-alt disabled:opacity-50"
          >
            <PortraitThumb portrait={c.portrait} className="h-12 w-12 rounded-lg" />
            <div>
              <p className="font-medium">{c.name}</p>
              <p className="text-sm text-text-muted">
                Level {c.level}
                {c.archetypeName && ` • ${c.archetypeName}`}
                {c.ancestryName && ` • ${c.ancestryName}`}
              </p>
            </div>
          </button>
        ))}
      </div>
      <Button variant="ghost" className="mt-4" onClick={onClose}>
        Cancel
      </Button>
    </Modal>
  );
}
