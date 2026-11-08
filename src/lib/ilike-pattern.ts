/** Escape Postgres ILIKE metacharacters so user input matches literally. */
export function escapeIlikePattern(raw: string): string {
  return raw.replace(/[%_\\]/g, (c) => `\\${c}`);
}
