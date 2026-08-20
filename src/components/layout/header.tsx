/**
 * Main Navigation Header
 * =======================
 * Site-wide navigation with dropdowns
 */

'use client';

import { useState, useRef, useEffect, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth, useAdmin, useProfile } from '@/hooks';
import { ThemeToggle, InfoTippy } from '@/components/patterns';
import { IconButton } from '@/components/ui';
import { navbarCodex, navbarLibrary } from '../../../public/tooltip-text';
import { NAV_COPY, type NavLink } from '@/lib/constants/site-copy';

const navLinks: NavLink[] = NAV_COPY.links;

const MOBILE_NAV_ID = 'mobile-nav-panel';
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { profile } = useProfile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const node = mobileNavRef.current;
    const menuButton = mobileMenuButtonRef.current;
    if (node) {
      const firstFocusable = node.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (firstFocusable ?? node).focus();
    }
    return () => {
      menuButton?.focus?.();
    };
  }, [mobileMenuOpen]);

  const handleMobileNavKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;
    const node = mobileNavRef.current;
    if (!node) return;
    const focusables = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement,
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (first === undefined || last === undefined) return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  // Handle login click - store current path for redirect after login
  const handleLoginClick = () => {
    // Store current path in sessionStorage for redirect after login
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('loginRedirect', pathname);
    }
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-header h-20 w-full border-b border-divider bg-surface-secondary">
      {/* DESIGN_INTENT: Inline nav at xl+ with tighter gutters than `.layout-shell-wide` —
          nowrap labels at lg widened the document (empty strip). Do not put overflow-x-clip
          on this header — it clips absolute nav/account menus; clip lives on MainAppChrome. */}
      <div className="mx-auto w-full max-w-[var(--container-wide)] min-w-0 px-4 sm:px-6 lg:px-8 xl:px-16">
        <div className="flex h-20 min-w-0 items-center justify-between gap-3 xl:gap-6 2xl:gap-10">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <Image
              src="/images/LogoSmall.png"
              alt="Realms RPG"
              width={44}
              height={49}
              className="h-auto w-11"
              priority
              suppressHydrationWarning
            />
          </Link>

          {/* Desktop Navigation — xl+ only; nowrap labels need the wider band */}
          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-3 xl:flex xl:gap-5 2xl:gap-8">
            {isAdmin && (
              <Link
                href="/admin"
                className={cn(
                  'text-base font-semibold whitespace-nowrap text-primary-fg transition-colors hover:text-primary-fg-hover 2xl:text-lg',
                  pathname?.startsWith('/admin') ? 'text-primary-fg-active' : '',
                )}
              >
                Admin
              </Link>
            )}
            {navLinks.map((item) =>
              'dropdown' in item ? (
                <NavDropdown key={item.label} item={item} pathname={pathname} />
              ) : item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'text-base font-semibold whitespace-nowrap text-primary-fg transition-colors hover:text-primary-fg-hover 2xl:text-lg',
                    pathname === item.href ? 'text-primary-fg-active' : '',
                  )}
                >
                  {item.label}
                </a>
              ) : (
                <span key={item.href} className="inline-flex shrink-0 items-center gap-1">
                  <Link
                    href={item.href}
                    className={cn(
                      'text-base font-semibold whitespace-nowrap text-primary-fg transition-colors hover:text-primary-fg-hover 2xl:text-lg',
                      pathname === item.href ? 'text-primary-fg-active' : '',
                    )}
                  >
                    {item.label}
                  </Link>
                  {item.href === '/library' && (
                    <InfoTippy
                      content={navbarLibrary}
                      label={NAV_COPY.tippy.library}
                      placement="bottom"
                    />
                  )}
                  {item.href === '/codex' && (
                    <InfoTippy
                      content={navbarCodex}
                      label={NAV_COPY.tippy.codex}
                      placement="bottom"
                    />
                  )}
                </span>
              ),
            )}
          </nav>

          {/* Account Section */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            {!user && (
              <div className="hidden sm:block">
                <ThemeToggle variant="inline" />
              </div>
            )}
            {user ? (
              <AccountDropdown profile={profile} signOut={signOut} />
            ) : (
              <button
                type="button"
                onClick={handleLoginClick}
                className="flex min-h-[44px] items-center px-2 text-base font-semibold whitespace-nowrap text-primary-fg transition-colors hover:text-primary-fg-hover 2xl:text-lg"
              >
                Login
              </button>
            )}

            {/* Compact / tablet menu (below xl) */}
            <IconButton
              ref={mobileMenuButtonRef}
              type="button"
              variant="ghost"
              size="md"
              aria-expanded={mobileMenuOpen}
              aria-controls={MOBILE_NAV_ID}
              label="Toggle navigation menu"
              className="text-text-secondary xl:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </IconButton>
          </div>
        </div>
      </div>

      {/* Compact / tablet Navigation */}
      {mobileMenuOpen ? (
        <div
          id={MOBILE_NAV_ID}
          ref={mobileNavRef}
          tabIndex={-1}
          role="navigation"
          aria-label="Mobile navigation"
          onKeyDown={handleMobileNavKeyDown}
          className="border-t border-border-light bg-surface outline-none xl:hidden"
        >
          {!user && (
            <div className="px-4 pt-4 sm:hidden">
              <ThemeToggle variant="inline" className="w-full justify-center" />
            </div>
          )}
          <nav className="space-y-2 px-4 py-4">
            {isAdmin && (
              <Link
                href="/admin"
                className="flex min-h-11 items-center py-3 text-lg font-semibold text-primary-fg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin
              </Link>
            )}
            {navLinks.map((item) =>
              'dropdown' in item ? (
                <MobileDropdown
                  key={item.label}
                  item={item}
                  pathname={pathname}
                  onLinkClick={() => setMobileMenuOpen(false)}
                />
              ) : item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center py-3 text-lg font-semibold text-primary-fg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex min-h-11 items-center py-3 text-lg font-semibold text-primary-fg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

interface DropdownItem {
  label: string;
  href?: string | undefined;
  external?: boolean | undefined;
  dropdown?: { href: string; label: string }[] | undefined;
}

function AccountDropdown({
  profile,
  signOut,
}: {
  profile: { username?: string | null | undefined } | null;
  signOut: () => void;
}) {
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
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label="Account menu"
        aria-expanded={open}
        className="flex min-h-11 min-w-11 items-center gap-2"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-button font-bold text-text-on-dark">
          {profile?.username?.charAt(0).toUpperCase() ?? '?'}
        </div>
      </button>
      {open && (
        <div className="absolute top-full right-0 z-popover pt-2">
          <div className="w-56 rounded-lg border border-border-light bg-surface py-2 shadow-lg">
            <Link
              href="/my-account"
              className="flex min-h-11 items-center px-4 py-2.5 text-text-secondary hover:bg-surface-alt"
              onClick={() => setOpen(false)}
            >
              My Account
            </Link>
            <div className="my-1 border-t border-border-light" />
            <ThemeToggle />
            <div className="my-1 border-t border-border-light" />
            <button
              type="button"
              onClick={() => {
                signOut();
                setOpen(false);
              }}
              className="min-h-11 w-full px-4 py-2.5 text-left text-text-secondary hover:bg-surface-alt"
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
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={`${item.label} menu`}
        aria-expanded={open}
        className="flex min-h-11 shrink-0 items-center gap-1 text-base font-semibold whitespace-nowrap text-primary-fg transition-colors hover:text-primary-fg-hover 2xl:text-lg"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        {item.label}
        <ChevronDownIcon className={cn('h-4 w-4 transition-transform', open ? 'rotate-180' : '')} />
      </button>
      {open && (
        <div className="absolute top-full left-1/2 z-popover -translate-x-1/2 pt-2 before:absolute before:top-0 before:right-0 before:left-0 before:h-2 before:content-['']">
          <div className="w-48 rounded-lg border border-divider bg-surface-secondary py-2 shadow-lg">
            {item.dropdown?.map((subItem) => (
              <Link
                key={subItem.href}
                href={subItem.href}
                prefetch={false}
                className={cn(
                  'flex min-h-11 items-center px-5 py-3 text-primary-fg transition-colors hover:bg-surface hover:text-primary-fg-hover',
                  pathname === subItem.href ? 'bg-surface-alt text-primary-fg-active' : '',
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

function MobileDropdown({
  item,
  pathname,
  onLinkClick,
}: {
  item: DropdownItem;
  pathname: string;
  onLinkClick?: (() => void) | undefined;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-label={`${item.label} menu`}
        className="flex min-h-11 w-full items-center justify-between py-3 text-lg font-semibold text-primary-fg"
        onClick={() => setOpen(!open)}
      >
        {item.label}
        <ChevronDownIcon className={cn('h-4 w-4 transition-transform', open ? 'rotate-180' : '')} />
      </button>
      {open ? (
        <div className="space-y-1 pl-4">
          {item.dropdown?.map((subItem) => (
            <Link
              key={subItem.href}
              href={subItem.href}
              prefetch={false}
              className={cn(
                'flex min-h-11 items-center py-3 text-primary-fg',
                pathname === subItem.href ? 'text-primary-fg-active' : '',
              )}
              {...(onLinkClick ? { onClick: onLinkClick } : {})}
            >
              {subItem.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MenuIcon({ className }: { className?: string | undefined }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      suppressHydrationWarning
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string | undefined }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      suppressHydrationWarning
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string | undefined }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={className}
      suppressHydrationWarning
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );
}
