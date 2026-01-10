/**
 * CreatorActions Component
 * ========================
 * Save/Reset action buttons for creator tools.
 * Handles loading states, validation, and success/error messages.
 */

'use client';

import { cn } from '@/lib/utils';
import { Save, RotateCcw, Loader2 } from 'lucide-react';

interface CreatorActionsProps {
  onSave: () => void | Promise<void>;
  onReset: () => void;
  saveLabel?: string;
  resetLabel?: string;
  isSaving?: boolean;
  isValid?: boolean;
  message?: { type: 'success' | 'error'; text: string } | null;
  className?: string;
}

export function CreatorActions({
  onSave,
  onReset,
  saveLabel = 'Save to Library',
  resetLabel = 'Reset',
  isSaving = false,
  isValid = true,
  message,
  className,
}: CreatorActionsProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Status Message */}
      {message && (
        <div
          className={cn(
            'p-3 rounded-lg text-sm font-medium',
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          )}
        >
          {message.text}
        </div>
      )}

      {/* Save Button */}
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving || !isValid}
        className={cn(
          'w-full py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2',
          isSaving || !isValid
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg'
        )}
      >
        {isSaving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            {saveLabel}
          </>
        )}
      </button>

      {/* Reset Button */}
      <button
        type="button"
        onClick={onReset}
        disabled={isSaving}
        className={cn(
          'w-full py-2 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2',
          isSaving
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-600 hover:bg-gray-100'
        )}
      >
        <RotateCcw className="w-4 h-4" />
        {resetLabel}
      </button>
    </div>
  );
}
