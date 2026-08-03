/**
 * Danger zone — account deletion (TASK-666)
 */

'use client';

import { Trash2, AlertTriangle } from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';

type Props = {
  canChangeEmailPassword: boolean;
  showDeleteConfirm: boolean;
  onShowDeleteConfirm: () => void;
  deletePassword: string;
  setDeletePassword: (v: string) => void;
  deleteConfirmText: string;
  setDeleteConfirmText: (v: string) => void;
  deleting: boolean;
  deleteError: string | null;
  onDelete: () => void;
  onCancel: () => void;
};

export function AccountDangerZoneCard({
  canChangeEmailPassword,
  showDeleteConfirm,
  onShowDeleteConfirm,
  deletePassword,
  setDeletePassword,
  deleteConfirmText,
  setDeleteConfirmText,
  deleting,
  deleteError,
  onDelete,
  onCancel,
}: Props) {
  return (
    <Card className="shadow-md p-6 border-2 border-danger-200 dark:border-danger-700/50">
      <h2 className="text-lg font-bold text-danger-fg mb-4 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5" />
        Danger Zone
      </h2>

      <p className="text-text-secondary mb-4">
        Deleting your account is permanent and cannot be undone. All your characters, creations, and data will be
        permanently deleted.
      </p>

      {!showDeleteConfirm ? (
        <Button variant="danger" onClick={onShowDeleteConfirm}>
          <Trash2 className="w-4 h-4" />
          Delete My Account
        </Button>
      ) : (
        <div className="bg-danger-50 dark:bg-danger-900/30 rounded-lg p-4 space-y-4">
          <p className="text-sm text-danger-fg font-medium">
            {canChangeEmailPassword
              ? 'To confirm deletion, enter your password and type DELETE below:'
              : 'To confirm deletion, type DELETE below:'}
          </p>
          {canChangeEmailPassword && (
            <div>
              <label
                htmlFor="account-delete-password"
                className="block text-sm font-medium text-danger-fg mb-1"
              >
                Password
              </label>
              <Input
                id="account-delete-password"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="border-danger-300 focus:ring-danger-500"
                placeholder="Enter your password"
              />
            </div>
          )}
          <div>
            <label
              htmlFor="account-delete-confirm"
              className="block text-sm font-medium text-danger-fg mb-1"
            >
              Type DELETE to confirm
            </label>
            <Input
              id="account-delete-confirm"
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="border-danger-300 focus:ring-danger-500"
              placeholder="DELETE"
            />
          </div>

          {deleteError && (
            <div className="p-3 rounded-lg bg-danger-light text-danger-fg text-sm">{deleteError}</div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="danger"
              onClick={onDelete}
              disabled={
                deleting ||
                deleteConfirmText !== 'DELETE' ||
                (canChangeEmailPassword && !deletePassword)
              }
              isLoading={deleting}
            >
              Permanently Delete Account
            </Button>
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
