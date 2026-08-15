'use client';

/**
 * Modal Component
 * ================
 * Reusable modal/dialog with portal rendering and animation.
 * Matches vanilla site's modal-pop animation.
 *
 * Supports two modes:
 * 1. Simple mode: Pass title/description for standard header + children as content
 * 2. Custom mode: Pass header/footer slots for full control over layout
 */

import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useIsClient } from '@/hooks/use-is-client';
import { IconButton } from './icon-button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Simple mode: title text for header */
  title?: string;
  /** Simple mode: description text for header */
  description?: string;
  /** Custom mode: full control over header content */
  header?: React.ReactNode;
  /** Custom mode: footer content (e.g., action buttons, selection count).
   *  Modal applies horizontal/vertical inset — do not add a second `p-4`/`px-6` on the row. */
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Content area className (use for custom padding/layout) */
  contentClassName?: string;
  /**
   * Desktop max-width. Prefer `sm`–`md` for confirms, `lg`–`2xl` for typical forms/lists,
   * `full` for high-complexity editors (admin codex, multi-section forms).
   * On viewports &lt; md with `fullScreenOnMobile`, size is ignored (full viewport).
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  showCloseButton?: boolean;
  /** Use flex layout for scrollable content with sticky header/footer */
  flexLayout?: boolean;
  /** When true, render full-screen on viewports < md (768px). Sticky header/footer, scrollable content. See MOBILE_UX.md. */
  fullScreenOnMobile?: boolean;
  /** Accessible name for the dialog when using custom content (no title/header). Overrides default "Dialog". */
  titleA11y?: string;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  '2xl': 'max-w-3xl',
  /** High-complexity admin / multi-section editors (~1152px; still inset via overlay padding) */
  full: 'max-w-6xl',
};

const MOBILE_BREAKPOINT_PX = 768;

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Every Modal portals into `document.body`, so nested dialogs cannot coordinate
 * through the React tree. These two module-level registries are what let a
 * stacked dialog behave correctly:
 * - the lock counter stops a closing child from restoring background scroll
 *   while its parent is still open;
 * - the id stack stops one Escape keypress from closing the whole stack.
 */
let bodyScrollLockCount = 0;
const openDialogIds: string[] = [];

function lockBodyScroll() {
  bodyScrollLockCount += 1;
  if (bodyScrollLockCount === 1) {
    document.body.style.overflow = 'hidden';
  }
}

function releaseBodyScroll() {
  bodyScrollLockCount = Math.max(0, bodyScrollLockCount - 1);
  if (bodyScrollLockCount === 0) {
    document.body.style.overflow = '';
  }
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  header,
  footer,
  children,
  className,
  contentClassName,
  size = 'md',
  showCloseButton = true,
  flexLayout = false,
  fullScreenOnMobile = false,
  titleA11y,
}: ModalProps) {
  const mounted = useIsClient();
  const [animating, setAnimating] = React.useState(false);
  const [isMobileViewport, setIsMobileViewport] = React.useState(false);
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = React.useRef<HTMLElement | null>(null);
  const onCloseRef = React.useRef(onClose);
  const dialogId = React.useId();
  const titleId = `${dialogId}-title`;
  const descriptionId = `${dialogId}-description`;

  // Render-time adjust: first open paint stays opacity-0, then transitions in.
  if (isOpen && !animating) {
    setAnimating(true);
  } else if (!isOpen && animating) {
    setAnimating(false);
  }

  React.useEffect(() => {
    if (!mounted) return;
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`);
    const update = () => setIsMobileViewport(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [mounted]);

  React.useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  React.useEffect(() => {
    if (!isOpen) return;
    lockBodyScroll();
    return releaseBodyScroll;
  }, [isOpen]);

  // Keyed on the stable dialog id (never on `onClose`) so a parent re-render
  // cannot re-push this dialog above an already-open child.
  React.useEffect(() => {
    if (!isOpen) return;
    openDialogIds.push(dialogId);
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (openDialogIds[openDialogIds.length - 1] !== dialogId) return;
      onCloseRef.current();
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      const index = openDialogIds.lastIndexOf(dialogId);
      if (index !== -1) openDialogIds.splice(index, 1);
    };
  }, [isOpen, dialogId]);

  // Focus management: remember the trigger, move focus into the dialog on open,
  // and restore focus to the trigger on close/unmount (a11y — TASK-332).
  React.useEffect(() => {
    if (!mounted || !isOpen) return;
    previouslyFocusedRef.current = (document.activeElement as HTMLElement | null) ?? null;
    const node = dialogRef.current;
    if (node) {
      const firstFocusable = node.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (firstFocusable ?? node).focus();
    }
    return () => {
      previouslyFocusedRef.current?.focus?.();
    };
  }, [mounted, isOpen]);

  if (!mounted || !isOpen) return null;

  // Keep keyboard focus inside the dialog while it is open.
  const handleFocusTrap = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;
    const node = dialogRef.current;
    if (!node) return;
    const focusables = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement,
    );
    if (focusables.length === 0) {
      e.preventDefault();
      node.focus();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (e.shiftKey) {
      if (active === first || !node.contains(active)) {
        e.preventDefault();
        last.focus();
      }
    } else if (active === last || !node.contains(active)) {
      e.preventDefault();
      first.focus();
    }
  };

  // Determine if we're using simple mode (title/description) or custom mode (header slot)
  const hasSimpleHeader = (title || description) && !header;
  const hasCustomHeader = !!header;

  const useFullScreenMobile = fullScreenOnMobile && isMobileViewport;

  // Callers may own overflow (e.g. UnifiedSelectionModal: overflow-hidden + inner list scroll).
  // Do not also apply overflow-y-auto — twMerge keeps both and forces an !important fight.
  const contentOwnsOverflow =
    typeof contentClassName === 'string' && /(?:^|\s)!?overflow-/.test(contentClassName);

  const modalContent = (
    <div
      className={cn(
        'fixed inset-0 z-overlay flex',
        useFullScreenMobile ? 'items-stretch' : 'items-center justify-center p-4',
      )}
    >
      {/* Backdrop */}
      <div
        className={cn(
          'duration-base fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity ease-standard',
          animating ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        onKeyDown={handleFocusTrap}
        className={cn(
          'relative z-10 w-full overflow-hidden border-border-light bg-surface shadow-2xl focus:outline-none',
          useFullScreenMobile
            ? 'inset-0 flex max-h-none flex-col rounded-none border-0'
            : cn(
                'rounded-2xl border',
                flexLayout
                  ? 'flex max-h-[90vh] flex-col'
                  : 'max-h-[90vh] scrollbar-thin overflow-auto',
                'animate-modal-pop',
                sizeClasses[size],
              ),
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={
          (title && hasSimpleHeader) || (!title && hasCustomHeader) ? titleId : undefined
        }
        aria-label={
          (title && hasSimpleHeader) || (!title && hasCustomHeader)
            ? undefined
            : (titleA11y ?? (!title && !hasCustomHeader ? 'Dialog' : undefined))
        }
        aria-describedby={description && hasSimpleHeader ? descriptionId : undefined}
      >
        {/* Visually hidden title when custom header without title, for screen readers */}
        {!title && hasCustomHeader && (
          <span id={titleId} className="sr-only">
            {titleA11y ?? 'Dialog'}
          </span>
        )}
        {/* Simple Header (title/description mode) — shrink-0 keeps it sticky outside scroll body */}
        {hasSimpleHeader && (
          <div
            className={cn(
              'mx-4 mt-4 mb-2 shrink-0 rounded-xl border-b border-border-light bg-primary-subtle-bg px-4 py-3',
              showCloseButton && 'pr-12',
            )}
          >
            {title && (
              <h2 id={titleId} className="text-xl font-semibold text-text-primary">
                {title}
              </h2>
            )}
            {description && (
              <p
                id={descriptionId}
                className="mt-1 text-sm text-text-secondary dark:text-text-secondary"
              >
                {description}
              </p>
            )}
          </div>
        )}

        {/* Custom Header (slot mode) */}
        {hasCustomHeader && <div className="shrink-0">{header}</div>}

        {/* Close button */}
        {showCloseButton && !hasCustomHeader && (
          <IconButton
            variant="ghost"
            onClick={onClose}
            label="Close modal"
            className="absolute top-4 right-4 z-10"
          >
            <X className="h-5 w-5" />
          </IconButton>
        )}

        {/* Content — flex column under sticky header/footer. Default scrolls as a whole;
            pass overflow-* in contentClassName for nested list scroll (see MOBILE_UX). */}
        <div
          className={cn(
            (flexLayout || useFullScreenMobile) && 'flex min-h-0 flex-1 flex-col',
            (flexLayout || useFullScreenMobile) &&
              !contentOwnsOverflow &&
              'scrollbar-thin overflow-y-auto',
            contentClassName ?? 'p-6',
          )}
        >
          {children}
        </div>

        {/* Footer (optional slot) — shrink-0 keeps sticky when flexLayout / fullScreenOnMobile.
            Put primary actions (Add Selected, Confirm, etc.) here — not inside children —
            so they stay pinned on mobile full-screen without scrolling. See MOBILE_UX.md. */}
        {footer ? (
          <div
            className={cn(
              // DESIGN_INTENT: Footer inset matches content `p-6` / header `mx-4` — do not
              // re-pad Cancel/Confirm rows inside `footer` (double gutter).
              'shrink-0 px-4 pt-3 pb-3 md:px-6 md:pt-4 md:pb-4',
              useFullScreenMobile && 'pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]',
            )}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
