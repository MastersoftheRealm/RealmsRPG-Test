/**
 * Main Navigation Header
 * =======================
 * Site-wide navigation with dropdowns
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks';

const navLinks = [
  { href: '/library', label: 'Library' },
  { href: '/characters', label: 'Characters' },
  { href: '/codex', label: 'Codex' },
  {
    label: 'Rules',
    dropdown: [
      { href: '/rules', label: 'Core Rulebook' },
      { href: '/resources', label: 'Resources' },
    ],
  },
  {
    label: 'Creators',
    dropdown: [
      { href: '/power-creator', label: 'Powers' },
      { href: '/technique-creator', label: 'Techniques' },
      { href: '/item-creator', label: 'Armaments' },
    ],
  },
  {
    label: 'RM Tools',
    dropdown: [
      { href: '/encounter-tracker', label: 'Encounter Tracker' },
      { href: '/creature-creator', label: 'Creature Creator' },
    ],
  },
];

export function Header() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#f6f6f6] border-b border-[#707070] h-20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-24">
        <div className="flex items-center justify-between h-20 gap-14">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/images/LogoSmall.png"
              alt="Realms RPG"
              width={44}
              height={49}
              className="w-11 h-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-14 flex-1 justify-center">
            {navLinks.map((item) => (
              item.dropdown ? (
                <NavDropdown key={item.label} item={item} pathname={pathname} />
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'font-semibold text-lg text-[#053357] hover:text-[#0a5a94] transition-colors whitespace-nowrap',
                    pathname === item.href ? 'text-[#0a5a94]' : ''
                  )}
                >
                  {item.label}
                </Link>
              )
            ))}
          </nav>

          {/* Account Section */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">
                    {user.displayName?.charAt(0).toUpperCase() ?? user.email?.charAt(0).toUpperCase() ?? '?'}
                  </div>
                </button>
                {/* Hover bridge: invisible pseudo-element to prevent dropdown from closing */}
                <div className="hidden group-hover:block absolute right-0 top-full pt-4 before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-4">
                  <div className="w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                    <Link href="/my-account" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                      My Account
                    </Link>
                    <button
                      onClick={() => signOut()}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link href="/login">
                <Image
                  src="/images/ProfileIcon.png"
                  alt="Sign In"
                  width={40}
                  height={40}
                  className="w-10 h-10"
                />
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              type="button"
              className="lg:hidden p-2 text-gray-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open menu</span>
              {mobileMenuOpen ? (
                <XIcon className="w-6 h-6" />
              ) : (
                <MenuIcon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen ? (
        <div className="lg:hidden border-t border-gray-200 bg-white">
          <nav className="px-4 py-4 space-y-2">
            {navLinks.map((item) => (
              item.dropdown ? (
                <MobileDropdown key={item.label} item={item} pathname={pathname} />
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block py-2 text-lg font-semibold text-primary-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              )
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

interface DropdownItem {
  label: string;
  href?: string;
  dropdown?: { href: string; label: string }[];
}

function NavDropdown({ item, pathname }: { item: DropdownItem; pathname: string }) {
  return (
    <div className="relative group">
      <button className="font-semibold text-lg text-[#053357] hover:text-[#0a5a94] transition-colors flex items-center gap-1 whitespace-nowrap">
        {item.label}
        <ChevronDownIcon className="w-4 h-4 group-hover:rotate-180 transition-transform" />
      </button>
      {/* Hover bridge: invisible pseudo-element to prevent dropdown from closing when mouse moves from button to dropdown */}
      <div className="hidden group-hover:block absolute top-full left-1/2 -translate-x-1/2 pt-2 before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-4">
        <div className="w-48 bg-[#f6f6f6] rounded-lg shadow-lg border border-[#707070] py-2">
          {item.dropdown?.map((subItem) => (
            <Link
              key={subItem.href}
              href={subItem.href}
              className={cn(
                'block px-5 py-3 text-[#053357] hover:bg-gray-200 hover:text-[#0a5a94] transition-colors',
                pathname === subItem.href ? 'bg-gray-100 text-[#0a5a94]' : ''
              )}
            >
              {subItem.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileDropdown({ item, pathname }: { item: DropdownItem; pathname: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        className="flex items-center justify-between w-full py-2 text-lg font-semibold text-[#053357]"
        onClick={() => setOpen(!open)}
      >
        {item.label}
        <ChevronDownIcon className={cn('w-4 h-4 transition-transform', open ? 'rotate-180' : '')} />
      </button>
      {open ? (
        <div className="pl-4 space-y-1">
          {item.dropdown?.map((subItem) => (
            <Link
              key={subItem.href}
              href={subItem.href}
              className={cn(
                'block py-2 text-[#053357]',
                pathname === subItem.href ? 'text-[#0a5a94]' : ''
              )}
            >
              {subItem.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );
}
