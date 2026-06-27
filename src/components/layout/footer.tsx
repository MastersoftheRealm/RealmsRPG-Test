/**
 * Footer Component
 * =================
 * Site-wide footer matching vanilla site design.
 * Mobile: stacked layout, smaller text, adequate touch targets.
 */

import Link from 'next/link';
import { REALMS_MOTTO } from '@/lib/constants/site-copy';

const footerLinkClass =
  'font-semibold text-sm sm:text-base text-text-primary hover:text-primary-fg-hover transition-colors whitespace-nowrap min-h-[44px] flex items-center justify-center';

export function Footer() {
  return (
    <footer className="w-full bg-surface-alt border-t border-divider mt-auto">
      <div className="layout-shell-wide py-4 sm:py-3">
        <p className="text-center text-sm text-text-secondary mb-3 font-medium">
          {REALMS_MOTTO}
        </p>
        <nav className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 text-center" aria-label="Footer navigation">
          <Link href="/about" prefetch={false} className={footerLinkClass}>About</Link>
          <Link href="/rules" prefetch={false} className={footerLinkClass}>Core Rulebook</Link>
          <Link href="/resources" prefetch={false} className={footerLinkClass}>Resources</Link>
          <Link href="/codex" prefetch={false} className={footerLinkClass}>Codex</Link>
          <Link href="/library" prefetch={false} className={footerLinkClass}>Library</Link>
          <Link href="/terms" prefetch={false} className={footerLinkClass}>Terms</Link>
          <Link href="/privacy" prefetch={false} className={footerLinkClass}>Privacy</Link>
          <a href="mailto:RealmsRoleplayGame@gmail.com" className={footerLinkClass}>Contact</a>
          <a href="https://discord.gg/XbX4nFbxga" target="_blank" rel="noopener noreferrer" className={footerLinkClass} aria-label="Join the community on Discord">Join the Community</a>
        </nav>
      </div>
    </footer>
  );
}

