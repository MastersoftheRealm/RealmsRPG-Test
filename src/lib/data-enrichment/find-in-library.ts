/**
 * Find an item in a library by ID or name (case-insensitive)
 */
export function findInLibrary<T extends { id: string; name: string }>(
  library: T[],
  reference: string | { id?: string | number; name?: string }
): T | undefined {
  if (!library || library.length === 0) return undefined;
  
  // If reference is a string, treat as name
  if (typeof reference === 'string') {
    const searchName = reference.toLowerCase();
    return library.find(item => 
      String(item.name ?? '').toLowerCase() === searchName ||
      item.id === reference
    );
  }
  
  // If reference is an object, try ID first, then name
  if (reference.id !== undefined) {
    const found = library.find(item => item.id === String(reference.id));
    if (found) return found;
  }
  
  if (reference.name) {
    const searchName = String(reference.name ?? '').toLowerCase();
    return library.find(item => String(item.name ?? '').toLowerCase() === searchName);
  }
  
  return undefined;
}

/**
 * Derive ability requirement from item properties when not stored as abilityRequirement.
 * Handles older saves or items where requirement was only in the properties list.
 */
export function deriveAbilityRequirementFromProperties(
  properties: Array<{ id?: number; name?: string; op_1_lvl?: number }>
): { name: string; level: number } | undefined {
  for (const p of properties || []) {
    const name = typeof p === 'string' ? '' : (p.name || '');
    const op1 = typeof p === 'object' && p != null ? (p.op_1_lvl ?? 0) : 0;
    const level = 1 + (Number(op1) || 0);
    if (level < 1) continue;
    if (name.includes('Strength Requirement')) return { name: 'Strength', level };
    if (name.includes('Agility Requirement')) return { name: 'Agility', level };
    if (name.includes('Vitality Requirement')) return { name: 'Vitality', level };
    if (name.includes('Acuity Requirement')) return { name: 'Acuity', level };
    if (name.includes('Intelligence Requirement')) return { name: 'Intelligence', level };
    if (name.includes('Charisma Requirement')) return { name: 'Charisma', level };
  }
  return undefined;
}
