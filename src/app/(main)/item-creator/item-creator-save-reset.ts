/**
 * Item creator form reset after a successful save (86e3jww8a).
 * Keeps the current armament type; clears every other field to defaults.
 */

import type { ArmamentType, ItemCreatorFormState } from './item-creator-bootstrap';
import { emptyItemCreatorFormState } from './item-creator-bootstrap';

export function itemCreatorFormAfterSave(armamentType: ArmamentType): ItemCreatorFormState {
  return { ...emptyItemCreatorFormState(), armamentType };
}
