/**
 * Codex Spreadsheet View
 * ======================
 * Raw spreadsheet editing for the active codex tab. Find/replace (with whole-cell
 * and limit-to-column options), inline cell edit, Save all (with confirmation and
 * validation), per-row save, copy row with " copy" name and derived ID.
 */

'use client';

import { Save, Loader2 } from 'lucide-react';
import { Button, LoadingState, Modal } from '@/components/ui';
import { ErrorDisplay } from '@/components/shared';
import { CodexSpreadsheetTable } from './codex-spreadsheet-table';
import { CodexSpreadsheetToolbar } from './codex-spreadsheet-toolbar';
import { type CodexSpreadsheetTabId } from './codex-spreadsheet-config';
import { useCodexSpreadsheet } from './use-codex-spreadsheet';

interface CodexSpreadsheetViewProps {
  activeTab: CodexSpreadsheetTabId;
}

export function CodexSpreadsheetView({ activeTab }: CodexSpreadsheetViewProps) {
  const ws = useCodexSpreadsheet({ activeTab });

  if (ws.error) {
    return (
      <ErrorDisplay
        message="Failed to load codex"
        subMessage={ws.error.message}
        onRetry={() => {
          void ws.refetch();
        }}
      />
    );
  }

  if (ws.isLoading || !ws.config) {
    return <LoadingState size="lg" padding="lg" />;
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface">
      <div className="md:hidden rounded-t-lg border-b border-border bg-surface-alt/70 px-4 py-2 text-xs text-text-secondary">
        Spreadsheet works best on desktop. Consider List view on small screens.
      </div>

      <CodexSpreadsheetToolbar
        findValue={ws.findValue}
        onFindValueChange={ws.setFindValue}
        findWholeCell={ws.findWholeCell}
        onFindWholeCellChange={ws.setFindWholeCell}
        findLimitToColumn={ws.findLimitToColumn}
        onFindLimitToColumnChange={ws.setFindLimitToColumn}
        columns={ws.columns}
        replaceMode={ws.replaceMode}
        onReplaceModeChange={ws.setReplaceMode}
        replaceValue={ws.replaceValue}
        onReplaceValueChange={ws.setReplaceValue}
        onFindReplace={ws.doFindReplace}
        onAddNewRow={ws.addNewRow}
        onSaveAllClick={ws.handleSaveAllClick}
        saving={ws.saving}
        hasDirty={ws.hasDirty}
      />

      <Modal
        isOpen={ws.saveConfirmOpen}
        onClose={() => !ws.saving && ws.setSaveConfirmOpen(false)}
        title="Save all changes?"
        description={
          ws.dirtyNewCount > 0 && ws.dirtyUpdateCount > 0
            ? `Save ${ws.dirty.size} rows (${ws.dirtyNewCount} new, ${ws.dirtyUpdateCount} updated)?`
            : ws.dirtyNewCount > 0
              ? `Save ${ws.dirty.size} new row(s)?`
              : `Save ${ws.dirty.size} updated row(s)?`
        }
        footer={
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => ws.setSaveConfirmOpen(false)}
              disabled={ws.saving}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={() => ws.performSaveAll()} disabled={ws.saving}>
              {ws.saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
              Save
            </Button>
          </div>
        }
      >
        <p className="text-sm text-text-secondary">
          This will persist all unsaved edits. You cannot undo after saving.
        </p>
      </Modal>

      <CodexSpreadsheetTable
        columns={ws.columns}
        columnWidths={ws.columnWidths}
        minTableWidth={ws.minTableWidth}
        sortedRowIndices={ws.sortedRowIndices}
        rows={ws.rows}
        dirty={ws.dirty}
        sortKey={ws.sortKey}
        sortDir={ws.sortDir}
        focusedCell={ws.focusedCell}
        savingRowIndex={ws.savingRowIndex}
        onSort={ws.handleSort}
        onFocusCell={ws.setFocusedCell}
        onUpdateCell={ws.updateCell}
        onCellBlur={ws.handleCellBlur}
        onSaveRow={ws.saveRow}
        onCopyRow={ws.copyRow}
        stickyLeftFor={ws.stickyLeftFor}
      />

      <div className="px-4 py-2 text-xs text-text-muted dark:text-text-secondary border-t border-border">
        {ws.rows.length} rows · {ws.columns.length} columns
        {ws.hasDirty && ` · ${ws.dirty.size} unsaved change(s)`}
      </div>
    </div>
  );
}
