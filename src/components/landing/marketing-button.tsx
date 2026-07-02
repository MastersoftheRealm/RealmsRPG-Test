/**
 * Marketing button helpers
 * ========================
 * Thin wrappers around the shared <Button> for landing/marketing CTAs so every
 * section renders links consistently (internal Link vs external anchor) without
 * duplicating `asChild` + Link boilerplate. Mirrors the pattern used on the
 * About page.
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { ButtonProps } from '@/components/ui/button';

type Variant = NonNullable<ButtonProps['variant']>;
type Size = NonNullable<ButtonProps['size']>;

export function MarketingLinkButton({
  href,
  variant = 'primary',
  size,
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Button asChild variant={variant} size={size} className={className}>
      <Link prefetch={false} href={href}>
        {children}
      </Link>
    </Button>
  );
}

export function MarketingExternalButton({
  href,
  variant = 'primary',
  size,
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Button asChild variant={variant} size={size} className={className}>
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    </Button>
  );
}
