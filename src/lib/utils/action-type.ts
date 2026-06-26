/**
 * Format action type for display across powers/techniques lists.
 * Shows "Long (3 AP)" and "Long (4 AP)" instead of "Long3"/"Long4" or "Long (3)".
 */

export function formatActionTypeForDisplay(raw: string): string {
  if (!raw || typeof raw !== 'string') return '-';
  const s = raw.trim();
  const lower = s.toLowerCase();
  if (lower === 'long3') return 'Long (3 AP)';
  if (lower === 'long4') return 'Long (4 AP)';
  // Computed form from power/technique calcs: "Long (3) Action", "Long (4) Reaction", etc.
  if (s.includes('Long (3)')) return s.replace('Long (3)', 'Long (3 AP)');
  if (s.includes('Long (4)')) return s.replace('Long (4)', 'Long (4 AP)');
  // Basic, Quick, Free, Reaction
  if (lower === 'reaction') return 'Reaction';
  if (lower === 'basic') return 'Basic';
  if (lower === 'quick') return 'Quick';
  if (lower === 'free') return 'Free';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/**
 * Format action from persisted selector fields (actionType + isReaction).
 * e.g. actionType "free" + isReaction → "Free Reaction"; not just "Reaction".
 */
export function formatSavedActionTypeForDisplay(
  actionType?: string | null,
  isReaction?: boolean
): string {
  const raw = String(actionType ?? '').trim();
  if (!raw) {
    return isReaction ? 'Reaction' : '-';
  }
  const lower = raw.toLowerCase();
  if (/\b(action|reaction)\b/i.test(raw)) {
    return formatActionTypeForDisplay(raw);
  }
  let base = 'Basic';
  if (lower === 'quick') base = 'Quick';
  else if (lower === 'free') base = 'Free';
  else if (lower === 'long3' || lower === 'long (3)') base = 'Long (3)';
  else if (lower === 'long4' || lower === 'long (4)') base = 'Long (4)';
  else if (lower === 'basic') base = 'Basic';
  else {
    base = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  }
  const combined = isReaction ? `${base} Reaction` : `${base} Action`;
  return formatActionTypeForDisplay(combined);
}
