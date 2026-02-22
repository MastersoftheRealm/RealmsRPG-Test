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
  /** Custom mode: footer content (e.g., action buttons, selection count) */
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Content area className (use for custom padding/layout) */
  contentClassName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  showCloseButton?: boolean;
  /** Use flex layout for scrollable content with sticky header/footer */
  flexLayout?: boolean;
  /** When true, render full-screen on viewports < md (768px). Sticky header/footer, scrollable content. See MOBILE_UX.md. */
  fullScreenOnMobile?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  '2xl': 'max-w-3xl',
  full: 'max-w-4xl',
};

const MOBILE_BREAKPOINT_PX = 768;

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
}: ModalProps) {
  const [mounted, setMounted] = React.useState(false);
  const [animating, setAnimating] = React.useState(false);
  const [isMobileViewport, setIsMobileViewport] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`);
    const update = () => setIsMobileViewport(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [mounted]);

  React.useEffect(() => {
    if (isOpen) {
      setAnimating(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  // Determine if we're using simple mode (title/description) or custom mode (header slot)
  const hasSimpleHeader = (title || description) && !header;
  const hasCustomHeader = !!header;

  const useFullScreenMobile = fullScreenOnMobile && isMobileViewport;

  const modalContent = (
    <div className={cn(
      'fixed inset-0 z-50 flex',
      useFullScreenMobile ? 'items-stretch' : 'items-center justify-center p-4'
    )}>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200',
          animating ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div
        className={cn(
          'relative z-10 w-full bg-surface shadow-2xl border-border-light overflow-hidden',
          useFullScreenMobile
            ? 'inset-0 flex flex-col rounded-none border-0 max-h-none'
            : cn(
                'rounded-2xl border',
                flexLayout ? 'flex flex-col max-h-[90vh]' : 'max-h-[90vh] overflow-auto scrollbar-thin',
                'animate-modal-pop',
                sizeClasses[size]
              ),
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
      >
        {/* Simple Header (title/description mode) */}
        {hasSimpleHeader && (
          <div className="mx-4 mt-4 mb-2 px-4 py-3 bg-primary-50 dark:bg-primary-900/30 rounded-xl border-b border-border-light">
            {title && (
              <h2 id="modal-title" className="text-xl font-semibold text-text-primary">
                {title}
              </h2>
            )}
            {description && (
              <p id="modal-description" className="mt-1 text-sm text-text-muted">
                {description}
              </p>
            )}
          </div>
        )}
        
        {/* Custom Header (slot mode) */}
        {hasCustomHeader && header}
        
        {/* Close button */}
        {showCloseButton && !hasCustomHeader && (
          <IconButton
            variant="ghost"
            onClick={onClose}
            label="Close modal"
            className="absolute right-4 top-4"
          >
            <X className="h-5 w-5" />
          </IconButton>
        )}
        
        {/* Content */}
        <div className={cn(
          (flexLayout || useFullScreenMobile) ? 'flex-1 min-h-0 overflow-y-auto scrollbar-thin' : '',
          contentClassName ?? 'p-6'
        )}>
          {children}
        </div>
        
        {/* Footer (optional slot) */}
        {footer && footer}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
