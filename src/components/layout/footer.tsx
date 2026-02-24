/**
 * Footer Component
 * =================
 * Site-wide footer matching vanilla site design.
 * Mobile: stacked layout, smaller text, adequate touch targets.
 */

import Link from 'next/link';
import { REALMS_MOTTO } from '@/lib/constants/site-copy';

export function Footer() {
  return (
    <footer className="w-full bg-neutral-400 dark:bg-neutral-800 border-t border-divider mt-auto">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-24 py-4 sm:py-3">
        <p className="text-center text-sm text-neutral-700 dark:text-neutral-300 mb-3 font-medium">
          {REALMS_MOTTO}
        </p>
        <nav className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 text-center" aria-label="Footer navigation">
          <Link href="/about" className="font-semibold text-sm sm:text-base text-neutral-900 dark:text-white hover:text-primary-700 dark:hover:text-primary-300 transition-colors whitespace-nowrap min-h-[44px] flex items-center justify-center">About</Link>
          <Link href="/rules" className="font-semibold text-sm sm:text-base text-neutral-900 dark:text-white hover:text-primary-700 dark:hover:text-primary-300 transition-colors whitespace-nowrap min-h-[44px] flex items-center justify-center">Core Rulebook</Link>
          <Link href="/codex" className="font-semibold text-sm sm:text-base text-neutral-900 dark:text-white hover:text-primary-700 dark:hover:text-primary-300 transition-colors whitespace-nowrap min-h-[44px] flex items-center justify-center">Codex</Link>
          <Link href="/library" className="font-semibold text-sm sm:text-base text-neutral-900 dark:text-white hover:text-primary-700 dark:hover:text-primary-300 transition-colors whitespace-nowrap min-h-[44px] flex items-center justify-center">Library</Link>
          <Link href="/terms" className="font-semibold text-sm sm:text-base text-neutral-900 dark:text-white hover:text-primary-700 dark:hover:text-primary-300 transition-colors whitespace-nowrap min-h-[44px] flex items-center justify-center">Terms</Link>
          <Link href="/privacy" className="font-semibold text-sm sm:text-base text-neutral-900 dark:text-white hover:text-primary-700 dark:hover:text-primary-300 transition-colors whitespace-nowrap min-h-[44px] flex items-center justify-center">Privacy</Link>
          <a href="mailto:RealmsRoleplayGame@gmail.com" className="font-semibold text-sm sm:text-base text-neutral-900 dark:text-white hover:text-primary-700 dark:hover:text-primary-300 transition-colors whitespace-nowrap min-h-[44px] flex items-center justify-center">Contact</a>
          <a href="https://discord.com/invite/WW7uVEEdpk" target="_blank" rel="noopener noreferrer" className="font-semibold text-sm sm:text-base text-neutral-900 dark:text-white hover:text-primary-700 dark:hover:text-primary-300 transition-colors whitespace-nowrap min-h-[44px] flex items-center justify-center" aria-label="Join the community on Discord">Join the Community</a>
        </nav>
      </div>
    </footer>
  );
}
