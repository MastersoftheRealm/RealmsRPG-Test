'use client';

import { Textarea } from '@/components/ui';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { AGE_IN_APPEARANCE, parseAgeFromAppearance, mergeAgeIntoAppearance } from './appearance-age';

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
    <div className="mb-6 rounded-xl border border-border-light bg-surface p-5 space-y-4">
      <h3 className="text-lg font-bold text-text-primary">Identity</h3>
      <div>
        <label htmlFor="character-name" className="block text-sm font-medium text-text-secondary mb-2">
          Character Name *
        </label>
        <input
          id="character-name"
          type="text"
          value={draft.name || ''}
          onChange={(e) => updateDraft({ name: e.target.value })}
          placeholder="Enter your character's name"
          className="w-full px-4 py-3 rounded-xl border border-border-light focus:border-primary-outline-border focus:ring-2 focus:ring-primary-outline-border transition-colors"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="character-age" className="block text-sm font-medium text-text-secondary mb-2">
            Age (optional)
          </label>
          <input
            id="character-age"
            type="number"
            min={1}
            value={displayAge}
            onChange={(e) => handleAgeChange(e.target.value)}
            placeholder="—"
            className="w-full px-4 py-3 rounded-xl border border-border-light focus:border-primary-outline-border focus:ring-2 focus:ring-primary-outline-border transition-colors"
          />
        </div>
        <div>
          <label htmlFor="character-height" className="block text-sm font-medium text-text-secondary mb-2">
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
            className="w-full px-4 py-3 rounded-xl border border-border-light focus:border-primary-outline-border focus:ring-2 focus:ring-primary-outline-border transition-colors"
          />
        </div>
        <div>
          <label htmlFor="character-weight" className="block text-sm font-medium text-text-secondary mb-2">
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
            className="w-full px-4 py-3 rounded-xl border border-border-light focus:border-primary-outline-border focus:ring-2 focus:ring-primary-outline-border transition-colors"
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
