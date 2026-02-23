/**
 * Footer Component
 * =================
 * Site-wide footer matching vanilla site design.
 * Mobile: stacked layout, smaller text, adequate touch targets.
 */

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full bg-neutral-400 dark:bg-neutral-700 border-t border-divider mt-auto">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-24 py-4 sm:py-3">
        <nav className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 text-center" aria-label="Footer navigation">
          <Link href="/about" className="font-semibold text-sm sm:text-base text-text-primary dark:text-neutral-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors whitespace-nowrap min-h-[44px] flex items-center justify-center">About</Link>
          <Link href="/rules" className="font-semibold text-sm sm:text-base text-text-primary dark:text-neutral-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors whitespace-nowrap min-h-[44px] flex items-center justify-center">Core Rulebook</Link>
          <Link href="/codex" className="font-semibold text-sm sm:text-base text-text-primary dark:text-neutral-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors whitespace-nowrap min-h-[44px] flex items-center justify-center">Codex</Link>
          <Link href="/library" className="font-semibold text-sm sm:text-base text-text-primary dark:text-neutral-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors whitespace-nowrap min-h-[44px] flex items-center justify-center">Library</Link>
          <Link href="/terms" className="font-semibold text-sm sm:text-base text-text-primary dark:text-neutral-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors whitespace-nowrap min-h-[44px] flex items-center justify-center">Terms</Link>
          <Link href="/privacy" className="font-semibold text-sm sm:text-base text-text-primary dark:text-neutral-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors whitespace-nowrap min-h-[44px] flex items-center justify-center">Privacy</Link>
          <a href="mailto:RealmsRoleplayGame@gmail.com" className="font-semibold text-sm sm:text-base text-text-primary dark:text-neutral-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors whitespace-nowrap min-h-[44px] flex items-center justify-center">Contact</a>
          <a href="https://discord.gg/Dbd5X9FQFJ" target="_blank" rel="noopener noreferrer" className="font-semibold text-sm sm:text-base text-text-primary dark:text-neutral-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors whitespace-nowrap min-h-[44px] flex items-center justify-center">Discord</a>
        </nav>
      </div>
    </footer>
  );
}
