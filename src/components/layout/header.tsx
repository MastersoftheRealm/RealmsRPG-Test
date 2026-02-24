/**
 * Main Navigation Header
 * =======================
 * Site-wide navigation with dropdowns
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth, useAdmin, useProfile } from '@/hooks';
import { ThemeToggle } from '@/components/shared';

const navLinks: Array<{ href: string; label: string; external?: boolean } | { label: string; dropdown: { href: string; label: string }[] }> = [
  { href: '/characters', label: 'Characters' },
  { href: '/library', label: 'Library' },
  { href: '/codex', label: 'Codex' },
  {
    label: 'Creators',
    dropdown: [
      { href: '/power-creator', label: 'Powers' },
      { href: '/technique-creator', label: 'Techniques' },
      { href: '/item-creator', label: 'Armaments' },
      { href: '/species-creator', label: 'Species' },
    ],
  },
  {
    label: 'Rules',
    dropdown: [
      { href: '/rules', label: 'Core Rulebook' },
      { href: '/resources', label: 'Resources' },
    ],
  },
  {
    label: 'RM Tools',
    dropdown: [
      { href: '/encounters', label: 'Encounters' },
      { href: '/creature-creator', label: 'Creature Creator' },
    ],
  },
  { href: '/campaigns', label: 'Campaigns' },
  { href: '/about', label: 'About' },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { profile } = useProfile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle login click - store current path for redirect after login
  const handleLoginClick = () => {
    // Store current path in sessionStorage for redirect after login
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('loginRedirect', pathname);
    }
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-surface-secondary border-b border-divider h-20">
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
              suppressHydrationWarning
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-14 flex-1 justify-center">
            {isAdmin && (
              <Link
                href="/admin"
                className={cn(
                  'font-semibold text-lg text-primary-700 dark:text-primary-300 hover:text-primary-500 dark:hover:text-primary-200 transition-colors whitespace-nowrap',
                  pathname?.startsWith('/admin') ? 'text-primary-500 dark:text-primary-400' : ''
                )}
              >
                Admin
              </Link>
            )}
            {navLinks.map((item) => (
              'dropdown' in item ? (
                <NavDropdown key={item.label} item={item} pathname={pathname} />
              ) : item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'font-semibold text-lg text-primary-700 dark:text-primary-300 hover:text-primary-500 dark:hover:text-primary-200 transition-colors whitespace-nowrap',
                    pathname === item.href ? 'text-primary-500 dark:text-primary-400' : ''
                  )}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'font-semibold text-lg text-primary-700 dark:text-primary-300 hover:text-primary-500 dark:hover:text-primary-200 transition-colors whitespace-nowrap',
                    pathname === item.href ? 'text-primary-500 dark:text-primary-400' : ''
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
              <AccountDropdown profile={profile} signOut={signOut} />
            ) : (
              <button
                type="button"
                onClick={handleLoginClick}
                className="font-semibold text-lg text-primary-700 dark:text-primary-300 hover:text-primary-500 dark:hover:text-primary-200 transition-colors whitespace-nowrap"
              >
                Login
              </button>
            )}

            {/* Mobile menu button */}
            <button
              type="button"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
              className="lg:hidden p-2 text-text-secondary"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
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
        <div className="lg:hidden border-t border-border-light bg-surface">
          <nav className="px-4 py-4 space-y-2">
            {isAdmin && (
              <Link
                href="/admin"
                className="block py-3 text-lg font-semibold text-primary-700 dark:text-primary-300 min-h-[44px] flex items-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin
              </Link>
            )}
            {navLinks.map((item) => (
              'dropdown' in item ? (
                <MobileDropdown key={item.label} item={item} pathname={pathname} onLinkClick={() => setMobileMenuOpen(false)} />
              ) : item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-3 text-lg font-semibold text-primary-700 dark:text-primary-300 min-h-[44px] flex items-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block py-3 text-lg font-semibold text-primary-700 dark:text-primary-300 min-h-[44px] flex items-center"
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
  external?: boolean;
  dropdown?: { href: string; label: string }[];
}

function AccountDropdown({ profile, signOut }: { profile: { username?: string | null } | null; signOut: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);
  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-label="Account menu"
        aria-expanded={open}
        className="flex items-center gap-2 min-h-[44px] min-w-[44px]"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
      >
        <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">
          {profile?.username?.charAt(0).toUpperCase() ?? '?'}
        </div>
      </button>
      {open && (
        <div className="absolute right-0 top-full pt-2 z-50">
          <div className="w-56 bg-surface rounded-lg shadow-lg border border-border-light py-2">
            <Link href="/my-account" className="block px-4 py-2.5 text-text-secondary hover:bg-surface-alt min-h-[44px] flex items-center" onClick={() => setOpen(false)}>
              My Account
            </Link>
            <div className="border-t border-border-light my-1" />
            <ThemeToggle />
            <div className="border-t border-border-light my-1" />
            <button
              type="button"
              onClick={() => { signOut(); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-text-secondary hover:bg-surface-alt min-h-[44px]"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NavDropdown({ item, pathname }: { item: DropdownItem; pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);
  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-label={`${item.label} menu`}
        aria-expanded={open}
        className="font-semibold text-lg text-primary-700 dark:text-primary-300 hover:text-primary-500 dark:hover:text-primary-200 transition-colors flex items-center gap-1 whitespace-nowrap min-h-[44px] items-center"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
      >
        {item.label}
        <ChevronDownIcon className={cn('w-4 h-4 transition-transform', open ? 'rotate-180' : '')} />
      </button>
      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50 before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-2">
          <div className="w-48 bg-surface-secondary rounded-lg shadow-lg border border-divider py-2">
            {item.dropdown?.map((subItem) => (
              <Link
                key={subItem.href}
                href={subItem.href}
                className={cn(
                  'block px-5 py-3 text-primary-700 dark:text-primary-300 hover:bg-surface hover:text-primary-500 dark:hover:text-primary-200 transition-colors min-h-[44px] flex items-center',
                  pathname === subItem.href ? 'bg-surface-alt text-primary-500 dark:text-primary-400' : ''
                )}
                onClick={() => setOpen(false)}
              >
                {subItem.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MobileDropdown({ item, pathname, onLinkClick }: { item: DropdownItem; pathname: string; onLinkClick?: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-label={`${item.label} menu`}
        className="flex items-center justify-between w-full py-3 text-lg font-semibold text-primary-700 dark:text-primary-300 min-h-[44px]"
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
                'block py-3 text-primary-700 dark:text-primary-300 min-h-[44px] flex items-center',
                pathname === subItem.href ? 'text-primary-500 dark:text-primary-400' : ''
              )}
              onClick={onLinkClick}
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
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} suppressHydrationWarning>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} suppressHydrationWarning>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className} suppressHydrationWarning>
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );
}
