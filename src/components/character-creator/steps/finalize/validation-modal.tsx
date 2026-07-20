'use client';

import { statusPanel } from '@/lib/ui/status-surface-classes';
import { cn } from '@/lib/utils';
import { Button, Modal } from '@/components/ui';
import type { ValidationIssue } from '@/lib/character-creator-validation';

export function ValidationModal({ 
  isOpen, 
  onClose, 
  issues, 
  onContinueAnyway,
  onSave,
  isSaving,
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  issues: ValidationIssue[];
  onContinueAnyway?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
}) {
  const hasErrors = issues.some(i => i.severity === 'error');
  const isValid = issues.length === 0;

  // Custom header for Modal
  const modalHeader = (
    <div className={cn(
      'p-4 border-b flex items-center gap-3',
      isValid ? statusPanel.completeBg : hasErrors ? statusPanel.dangerBg : statusPanel.warningBg
    )}>
      <span className="text-2xl">{isValid ? '✅' : hasErrors ? '⚠️' : '📋'}</span>
      <h2 className="text-xl font-bold text-text-primary">
        {isValid ? 'Character Ready!' : hasErrors ? 'Issues Found' : 'Review Needed'}
      </h2>
    </div>
  );

  // Custom footer for Modal
  const modalFooter = (
    <div className="shrink-0 border-t border-border-light p-4 flex justify-end gap-3">
      <Button
        variant="secondary"
        onClick={onClose}
        disabled={isSaving}
      >
        {isValid ? 'Cancel' : 'Go Back & Fix'}
      </Button>
      {/* Show Save button when valid */}
      {isValid && onSave && (
        <Button
          onClick={onSave}
          disabled={isSaving}
          isLoading={isSaving}
        >
          ✓ Create Character
        </Button>
      )}
      {/* Show Continue Anyway when there are warnings but no errors */}
      {!hasErrors && !isValid && onContinueAnyway && (
        <Button
          onClick={onContinueAnyway}
          disabled={isSaving}
          className="bg-warning-600 text-text-on-dark hover:bg-warning-700 dark:bg-warning-500 dark:hover:bg-warning-600"
        >
          Save Anyway
        </Button>
      )}
    </div>
  );
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      flexLayout
      fullScreenOnMobile
      header={modalHeader}
      footer={modalFooter}
      showCloseButton={false}
      contentClassName="p-4 overflow-y-auto"
    >
      {isValid ? (
        <p className="text-text-secondary text-center py-8">
          Your character is complete and ready for adventure!
        </p>
      ) : (
        <div className="space-y-3">
          {issues.map((issue, idx) => (
            <div 
              key={idx} 
              className={cn(
                'p-3 rounded-lg flex gap-3',
                issue.severity === 'error' ? statusPanel.dangerBg : statusPanel.warningBg
              )}
            >
              <span className="text-xl flex-shrink-0">{issue.emoji}</span>
              <p className="text-text-secondary">{issue.message}</p>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
