'use client';

/**
 * ExpandableImage — click any inline image to preview larger in a modal.
 * Used for list thumbs, guided choice cards, species reveal, portraits, etc.
 *
 * **Agents:** Default for entity art and user-facing images with meaning.
 * See `AGENT_GUIDE.md` § Entity card art & list thumbnails.
 */

import { useState, useCallback, type MouseEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui';

export interface ExpandableImageModalProps {
  src: string;
  alt: string;
  isPlaceholder?: boolean;
  isOpen: boolean;
  onClose: () => void;
}

/** Shared preview modal — use via ExpandableImage or standalone when state is external. */
export function ExpandableImageModal({
  src,
  alt,
  isPlaceholder = false,
  isOpen,
  onClose,
}: ExpandableImageModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={alt}
      description={
        isPlaceholder ? 'Placeholder art. Full illustration coming later.' : undefined
      }
      size="lg"
      fullScreenOnMobile
      contentClassName="flex items-center justify-center p-4"
    >
      <div className="flex max-h-[min(70vh,32rem)] max-w-full items-center justify-center rounded-lg bg-image-matte p-3 sm:p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="max-h-[min(calc(70vh-1.5rem),30rem)] w-auto max-w-full object-contain"
        />
      </div>
    </Modal>
  );
}

export interface ExpandableImageProps {
  src: string;
  /** Accessible name for preview modal title and expand button */
  alt: string;
  isPlaceholder?: boolean;
  /** Visible image area (e.g. next/image with fill, or img) */
  children: ReactNode;
  className?: string;
  /** When true, click does not bubble (nested cards / list rows). Default true. */
  stopPropagation?: boolean;
  /** Render children only — no expand affordance (e.g. missing src). */
  disabled?: boolean;
  previewAriaLabel?: string;
}

const EXPAND_TRIGGER_CLASS =
  'cursor-pointer overflow-hidden transition-shadow hover:ring-2 hover:ring-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary touch-target-md-compact';

export function ExpandableImage({
  src,
  alt,
  isPlaceholder = false,
  children,
  className,
  stopPropagation = true,
  disabled = false,
  previewAriaLabel,
}: ExpandableImageProps) {
  const [open, setOpen] = useState(false);

  const handleClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (stopPropagation) e.stopPropagation();
      setOpen(true);
    },
    [stopPropagation]
  );

  const label =
    previewAriaLabel ??
    (isPlaceholder ? `View placeholder art for ${alt}` : `View enlarged image: ${alt}`);

  if (disabled || !src.trim()) {
    return <div className={className}>{children}</div>;
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label={label}
        className={cn(EXPAND_TRIGGER_CLASS, className)}
      >
        {children}
      </button>
      <ExpandableImageModal
        isOpen={open}
        onClose={() => setOpen(false)}
        src={src}
        alt={alt}
        isPlaceholder={isPlaceholder}
      />
    </>
  );
}
