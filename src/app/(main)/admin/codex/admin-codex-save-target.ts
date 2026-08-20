/** Explicit `editId: null` means create even when an edit session is open. */
export function resolveAdminCodexSaveTargetId(
  editId: string | null | undefined,
  editingId: string | null | undefined,
): string | null {
  if (editId !== undefined) return editId;
  return editingId ?? null;
}
