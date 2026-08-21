'use client';

import { Textarea } from '@/components/ui';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import {
  AGE_IN_APPEARANCE,
  parseAgeFromAppearance,
  mergeAgeIntoAppearance,
} from '@/lib/character/appearance-age';

export function IdentityFields() {
  const { draft, updateDraft } = useCharacterCreatorStore();
  const displayAge = parseAgeFromAppearance(draft.appearance);
  const physicalDescription = draft.appearance?.replace(AGE_IN_APPEARANCE, '').trim() ?? '';

  const handleAgeChange = (value: string) => {
    updateDraft({ appearance: mergeAgeIntoAppearance(value, draft.appearance) });
  };

  const handlePhysicalDescriptionChange = (value: string) => {
    updateDraft({ appearance: mergeAgeIntoAppearance(displayAge, value) });
  };

  return (
    <div className="mb-6 space-y-4 rounded-xl border border-border-light bg-surface p-5">
      <h3 className="text-lg font-bold text-text-primary">Identity</h3>
      <div>
        <label
          htmlFor="character-name"
          className="mb-2 block text-sm font-medium text-text-secondary"
        >
          Character Name *
        </label>
        <input
          id="character-name"
          type="text"
          value={draft.name || ''}
          onChange={(e) => updateDraft({ name: e.target.value })}
          placeholder="Enter your character's name"
          className="w-full rounded-xl border border-border-light px-4 py-3 transition-colors focus:border-primary-outline-border focus:ring-2 focus:ring-primary-outline-border"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label
            htmlFor="character-age"
            className="mb-2 block text-sm font-medium text-text-secondary"
          >
            Age (optional)
          </label>
          <input
            id="character-age"
            type="number"
            min={1}
            value={displayAge}
            onChange={(e) => handleAgeChange(e.target.value)}
            placeholder="—"
            className="w-full rounded-xl border border-border-light px-4 py-3 transition-colors focus:border-primary-outline-border focus:ring-2 focus:ring-primary-outline-border"
          />
        </div>
        <div>
          <label
            htmlFor="character-height"
            className="mb-2 block text-sm font-medium text-text-secondary"
          >
            Height cm (optional)
          </label>
          <input
            id="character-height"
            type="number"
            min={0}
            value={draft.height ?? ''}
            onChange={(e) =>
              updateDraft({ height: e.target.value ? Number(e.target.value) : undefined })
            }
            placeholder="—"
            className="w-full rounded-xl border border-border-light px-4 py-3 transition-colors focus:border-primary-outline-border focus:ring-2 focus:ring-primary-outline-border"
          />
        </div>
        <div>
          <label
            htmlFor="character-weight"
            className="mb-2 block text-sm font-medium text-text-secondary"
          >
            Weight kg (optional)
          </label>
          <input
            id="character-weight"
            type="number"
            min={0}
            value={draft.weight ?? ''}
            onChange={(e) =>
              updateDraft({ weight: e.target.value ? Number(e.target.value) : undefined })
            }
            placeholder="—"
            className="w-full rounded-xl border border-border-light px-4 py-3 transition-colors focus:border-primary-outline-border focus:ring-2 focus:ring-primary-outline-border"
          />
        </div>
      </div>
      <Textarea
        label="Appearance (optional)"
        value={physicalDescription}
        onChange={(e) => handlePhysicalDescriptionChange(e.target.value)}
        placeholder="Hair, eyes, distinguishing features…"
        rows={2}
        className="resize-none"
      />
    </div>
  );
}
