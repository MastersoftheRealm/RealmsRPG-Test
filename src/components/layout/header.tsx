/**
 * Main Navigation Header
 * =======================
 * Site-wide navigation with dropdowns
 */

'use client';

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth, useAdmin, useProfile } from '@/hooks';
import type { AuthUser } from '@/types/auth';
import { ThemeToggle, InfoTippy } from '@/components/patterns';
import { IconButton } from '@/components/ui';
import { navbarCodex, navbarLibrary } from '../../../public/tooltip-text';
import { NAV_COPY, type NavLink } from '@/lib/constants/site-copy';

const navLinks: NavLink[] = NAV_COPY.links;

const MOBILE_NAV_ID = 'mobile-nav-panel';
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** ClickUp 86e3jw5n1 — close desktop disclosure when focus tabs outside the menu root. */
export function shouldCloseDisclosureOnFocusLeave(
  root: HTMLElement,
  relatedTarget: EventTarget | null,
): boolean {
  if (relatedTarget === null) return true;
  return !root.contains(relatedTarget as Node);
}

/** ClickUp 86e3jywd8 — pointer down outside the menu root dismisses the menu. */
export function shouldCloseDisclosureOnOutsidePointer(
  root: HTMLElement | null,
  target: EventTarget | null,
): boolean {
  if (!root || target === null) return false;
  return !root.contains(target as Node);
}

/**
 * ClickUp 86e3jywd8 — `preventDefault` on pointerdown does not cancel the click
 * that follows, so the same gesture still activates a character card underneath.
 * After an outside pointer dismiss, swallow that next outside click in capture.
 * One-shot, and cleared on timeout if the click never arrives.
 */
const DISMISS_CLICK_SWALLOW_MS = 500;

export function armDismissClickSwallow(options: {
  documentTarget: EventTarget;
  isOutside: (target: EventTarget | null) => boolean;
  timeoutMs?: number;
  scheduleTimeout?: (callback: () => void, ms: number) => ReturnType<typeof setTimeout>;
  cancelTimeout?: (id: ReturnType<typeof setTimeout>) => void;
}): () => void {
  let armed = true;
  const timeoutMs = options.timeoutMs ?? DISMISS_CLICK_SWALLOW_MS;
  const scheduleTimeout = options.scheduleTimeout ?? setTimeout;
  const cancelTimeout = options.cancelTimeout ?? clearTimeout;
  const pending: { id?: ReturnType<typeof setTimeout> } = {};

  const onClick = (event: Event) => {
    if (!armed) return;
    const swallow = options.isOutside(event.target);
    disarm();
    if (!swallow) return;
    event.preventDefault();
    event.stopPropagation();
  };

  function disarm() {
    if (!armed) return;
    armed = false;
    options.documentTarget.removeEventListener('click', onClick, true);
    if (pending.id !== undefined) cancelTimeout(pending.id);
  }

  options.documentTarget.addEventListener('click', onClick, true);
  pending.id = scheduleTimeout(disarm, timeoutMs);
  return disarm;
}

function useDisclosureMenu({ closeOnScroll = false }: { closeOnScroll?: boolean } = {}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const openedByKeyboardRef = useRef(false);
  const dismissSwallowDisarmRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      dismissSwallowDisarmRef.current?.();
      dismissSwallowDisarmRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!shouldCloseDisclosureOnOutsidePointer(rootRef.current, event.target)) return;
      setOpen(false);
      dismissSwallowDisarmRef.current?.();
      dismissSwallowDisarmRef.current = armDismissClickSwallow({
        documentTarget: document,
        isOutside: (target) => shouldCloseDisclosureOnOutsidePointer(rootRef.current, target),
      });
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const root = rootRef.current;
    if (!root) return;
    const handleFocusOut = (e: FocusEvent) => {
      if (!shouldCloseDisclosureOnFocusLeave(root, e.relatedTarget)) return;
      setOpen(false);
    };
    root.addEventListener('focusout', handleFocusOut);
    return () => root.removeEventListener('focusout', handleFocusOut);
  }, [open]);

  useEffect(() => {
    if (!open || !openedByKeyboardRef.current) return;
    openedByKeyboardRef.current = false;
    const node = panelRef.current;
    if (node) {
      const firstFocusable = node.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (firstFocusable ?? node).focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open || !closeOnScroll) return;
    const handleScroll = () => setOpen(false);
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [open, closeOnScroll]);

  const onTriggerKeyDown = useCallback((e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      openedByKeyboardRef.current = true;
    }
  }, []);

  return { open, setOpen, rootRef, triggerRef, panelRef, onTriggerKeyDown };
}

export function Header() {
  const pathname = usePathname();
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

  // Store the return path before the creator leave guard can cancel the click.
  useEffect(() => {
    const rememberLoginRedirect = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a');
      if (!anchor || anchor.getAttribute('data-login-link') !== 'header') return;
      sessionStorage.setItem('loginRedirect', pathname ?? window.location.pathname);
    };
    window.addEventListener('click', rememberLoginRedirect, true);
    return () => window.removeEventListener('click', rememberLoginRedirect, true);
  }, [pathname]);

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
              <AccountDropdown user={user} profile={profile} signOut={signOut} />
            ) : (
              <Link
                href="/login"
                data-login-link="header"
                className="flex min-h-[44px] items-center px-2 text-base font-semibold whitespace-nowrap text-primary-fg transition-colors hover:text-primary-fg-hover 2xl:text-lg"
              >
                Login
              </Link>
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

/** ClickUp 86e3jvjj2: hover opens before click; a toggle would immediately close the menu. */
/** Avatar initial when profile username is still loading (e.g. 404 shell). */
export function accountAvatarInitial(
  profile: { username?: string | null | undefined } | null,
  user: AuthUser | null,
): string {
  const fromProfile = profile?.username?.trim();
  if (fromProfile) return fromProfile.charAt(0).toUpperCase();
  const fromDisplay = user?.displayName?.trim();
  if (fromDisplay) return fromDisplay.charAt(0).toUpperCase();
  const fromEmail = user?.email?.trim();
  if (fromEmail) return fromEmail.charAt(0).toUpperCase();
  return '?';
}

export function accountMenuPointerClickState(
  openedByHover: boolean,
  isOpen: boolean,
): { open: boolean; consumeHoverFlag: boolean } {
  if (openedByHover) {
    return { open: true, consumeHoverFlag: true };
  }
  return { open: !isOpen, consumeHoverFlag: false };
}

function AccountDropdown({
  user,
  profile,
  signOut,
}: {
  user: AuthUser;
  profile: { username?: string | null | undefined } | null;
  signOut: () => void;
}) {
  const { open, setOpen, rootRef, triggerRef, panelRef, onTriggerKeyDown } = useDisclosureMenu({
    closeOnScroll: true,
  });
  const openedByHoverRef = useRef(false);
  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={() => {
        setOpen(true);
        openedByHoverRef.current = true;
      }}
      onMouseLeave={() => {
        setOpen(false);
        openedByHoverRef.current = false;
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label="Account menu"
        aria-expanded={open}
        className="flex min-h-11 min-w-11 items-center gap-2"
        onKeyDown={onTriggerKeyDown}
        onClick={(e) => {
          e.stopPropagation();
          const { open: nextOpen, consumeHoverFlag } = accountMenuPointerClickState(
            openedByHoverRef.current,
            open,
          );
          if (consumeHoverFlag) openedByHoverRef.current = false;
          setOpen(nextOpen);
        }}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-button font-bold text-text-on-dark">
          {accountAvatarInitial(profile, user)}
        </div>
      </button>
      {open && (
        <div className="absolute top-full right-0 z-popover pt-2">
          <div
            ref={panelRef}
            className="w-56 rounded-lg border border-border-light bg-surface py-2 shadow-lg"
          >
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

/** Creators and the other nav dropdowns share Account's hover-then-click guard. */
function NavDropdown({ item, pathname }: { item: DropdownItem; pathname: string }) {
  const { open, setOpen, rootRef, triggerRef, panelRef, onTriggerKeyDown } = useDisclosureMenu();
  const openedByHoverRef = useRef(false);
  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={() => {
        setOpen(true);
        openedByHoverRef.current = true;
      }}
      onMouseLeave={() => {
        setOpen(false);
        openedByHoverRef.current = false;
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label={`${item.label} menu`}
        aria-expanded={open}
        className="flex min-h-11 shrink-0 items-center gap-1 text-base font-semibold whitespace-nowrap text-primary-fg transition-colors hover:text-primary-fg-hover 2xl:text-lg"
        onKeyDown={onTriggerKeyDown}
        onClick={(e) => {
          e.stopPropagation();
          const { open: nextOpen, consumeHoverFlag } = accountMenuPointerClickState(
            openedByHoverRef.current,
            open,
          );
          if (consumeHoverFlag) openedByHoverRef.current = false;
          setOpen(nextOpen);
        }}
      >
        {item.label}
        <ChevronDownIcon className={cn('h-4 w-4 transition-transform', open ? 'rotate-180' : '')} />
      </button>
      {open && (
        <div className="absolute top-full left-1/2 z-popover -translate-x-1/2 pt-2 before:absolute before:top-0 before:right-0 before:left-0 before:h-2 before:content-['']">
          <div
            ref={panelRef}
            className="w-48 rounded-lg border border-divider bg-surface-secondary py-2 shadow-lg"
          >
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
