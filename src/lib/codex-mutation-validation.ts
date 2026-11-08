import type { CodexCollection } from '@/lib/codex/collections';
import { codexAdminCamelBodyShapeError } from '@/lib/codex-persisted-contract';

/** Throws with a 400-safe message when an admin codex payload fails deep shape validation. */
export function assertCodexAdminBodyShapes(
  collection: CodexCollection,
  camelBody: Record<string, unknown>,
): void {
  const shapeError = codexAdminCamelBodyShapeError(collection, camelBody);
  if (shapeError) throw new Error(shapeError);
}
