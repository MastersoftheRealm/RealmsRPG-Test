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
