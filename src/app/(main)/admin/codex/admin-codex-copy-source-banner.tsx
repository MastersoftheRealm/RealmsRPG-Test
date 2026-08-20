/**
 * Shared Admin Codex duplicate-source callout (TASK-852).
 * Not shared/ / ui/ — stays with ADR-0025 tab-local CRUD chrome.
 */
export function AdminCodexCopySourceBanner({
  copySourceName,
  entityLabel,
}: {
  copySourceName: string | null;
  entityLabel: string;
}) {
  if (!copySourceName) return null;
  return (
    <p className="rounded-md border border-border-light bg-surface-alt px-3 py-2 text-sm text-text-secondary">
      Creating a copy of <strong className="text-text-primary">{copySourceName}</strong>. Change the
      name and details as needed, then save to add the new {entityLabel}.
    </p>
  );
}
