const AGE_IN_APPEARANCE = /^Age:\s*(\d+)\s*(?:\n|$)/;

export function parseAgeFromAppearance(appearance?: string): string {
  const match = appearance?.match(AGE_IN_APPEARANCE);
  return match?.[1] ?? '';
}

export function mergeAgeIntoAppearance(age: string, appearance?: string): string | undefined {
  const rest = appearance?.replace(AGE_IN_APPEARANCE, '').trim() ?? '';
  const trimmedAge = age.trim();
  if (!trimmedAge && !rest) return undefined;
  if (!trimmedAge) return rest || undefined;
  return rest ? `Age: ${trimmedAge}\n${rest}` : `Age: ${trimmedAge}`;
}

export { AGE_IN_APPEARANCE };
