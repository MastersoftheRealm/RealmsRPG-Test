/**
 * Footer Component
 * =================
 * Site-wide footer matching vanilla site design
 */

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full bg-gray-400 border-t border-[#707070] h-10 flex items-center justify-center mt-auto">
      <div className="w-full max-w-[1440px] px-4 sm:px-6 lg:px-24 flex items-center justify-between">
        <Link 
          href="/terms" 
          className="font-semibold text-lg text-gray-800 hover:text-gray-900 transition-colors whitespace-nowrap"
        >
          Terms of Service
        </Link>
        <Link 
          href="/privacy" 
          className="font-semibold text-lg text-gray-800 hover:text-gray-900 transition-colors whitespace-nowrap"
        >
          Privacy Policy
        </Link>
        <a 
          href="mailto:RealmsRoleplayGame@gmail.com" 
          className="font-semibold text-lg text-gray-800 hover:text-gray-900 transition-colors whitespace-nowrap"
        >
          Contact
        </a>
        <a 
          href="https://discord.gg/Dbd5X9FQFJ" 
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-lg text-gray-800 hover:text-gray-900 transition-colors whitespace-nowrap"
        >
          Discord
        </a>
      </div>
    </footer>
  );
}
