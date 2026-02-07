/**
 * Footer Component
 * =================
 * Site-wide footer matching vanilla site design
 */

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full bg-neutral-400 border-t border-divider h-10 flex items-center justify-center mt-auto">
      <div className="w-full max-w-[1440px] px-4 sm:px-6 lg:px-24 flex items-center justify-center flex-wrap gap-4 sm:gap-6">
        <Link href="/about" className="font-semibold text-lg text-text-primary hover:text-primary-700 transition-colors whitespace-nowrap">About</Link>
        <Link href="/rules" className="font-semibold text-lg text-text-primary hover:text-primary-700 transition-colors whitespace-nowrap">Core Rulebook</Link>
        <Link href="/codex" className="font-semibold text-lg text-text-primary hover:text-primary-700 transition-colors whitespace-nowrap">Codex</Link>
        <Link href="/library" className="font-semibold text-lg text-text-primary hover:text-primary-700 transition-colors whitespace-nowrap">Library</Link>
        <Link href="/terms" className="font-semibold text-lg text-text-primary hover:text-primary-700 transition-colors whitespace-nowrap">Terms</Link>
        <Link href="/privacy" className="font-semibold text-lg text-text-primary hover:text-primary-700 transition-colors whitespace-nowrap">Privacy</Link>
        <a href="mailto:RealmsRoleplayGame@gmail.com" className="font-semibold text-lg text-text-primary hover:text-primary-700 transition-colors whitespace-nowrap">Contact</a>
        <a href="https://discord.gg/Dbd5X9FQFJ" target="_blank" rel="noopener noreferrer" className="font-semibold text-lg text-text-primary hover:text-primary-700 transition-colors whitespace-nowrap">Discord</a>
      </div>
    </footer>
  );
}
