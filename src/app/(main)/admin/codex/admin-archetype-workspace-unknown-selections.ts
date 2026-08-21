/**
 * Admin Archetypes — unknown selection validation (TASK-617)
 */

import type { PathItemRecommendation } from '@/types/archetype';
import type { PathLevelForm, PathSelectionKey, SelectionOption } from './admin-archetype-path-form';

type OptionsByField = Partial<
  Record<PathSelectionKey | 'armaments' | 'equipment', SelectionOption[]>
>;

function getSelectedLabels(values: string[], options: SelectionOption[]) {
  return values.map((value) => options.find((option) => option.value === value)?.label ?? value);
}

export function getUnknownSelectionsForLevel(
  levelForm: PathLevelForm,
  labelPrefix: string,
  optionsByField: OptionsByField,
): string[] {
  const unknowns: string[] = [];

  const checkField = (key: PathSelectionKey, label: string) => {
    const options = optionsByField[key];
    if (!options) return;
    const knownIds = new Set(options.map((opt) => opt.value));
    const ids = levelForm[key].filter(Boolean);
    const invalidIds = ids.filter((id) => !knownIds.has(id));
    if (invalidIds.length) {
      const prettyLabels = getSelectedLabels(invalidIds, options);
      unknowns.push(`${labelPrefix}${label}: ${prettyLabels.join(', ')}`);
    }
  };

  const checkEntries = (entries: PathItemRecommendation[], label: string) => {
    const options =
      entries.length && label === 'Armaments' ? optionsByField.armaments : optionsByField.equipment;
    if (!options) return;
    const knownIds = new Set(options.map((opt) => opt.value));
    const invalid = entries.filter((e) => !knownIds.has(e.id));
    if (invalid.length) {
      const pretty = invalid.map((e) => getSelectedLabels([e.id], options).join(', ') || e.id);
      unknowns.push(`${labelPrefix}${label}: ${pretty.join(', ')}`);
    }
  };

  checkField('feats', 'Feats');
  checkField('skills', 'Skills');
  checkField('powers', 'Powers');
  checkField('innatePowers', 'Innate Powers');
  checkField('techniques', 'Techniques');
  if (levelForm.armamentEntries?.length) checkEntries(levelForm.armamentEntries, 'Armaments');
  else checkField('armaments', 'Armaments');
  if (levelForm.equipmentEntries?.length) checkEntries(levelForm.equipmentEntries, 'Equipment');
  else checkField('equipment', 'Equipment');
  checkField('removeFeats', 'Remove Feats');
  checkField('removePowers', 'Remove Powers');
  checkField('removeTechniques', 'Remove Techniques');
  checkField('removeArmaments', 'Remove Armaments');

  return unknowns;
}
