/**
 * Footer Component
 * =================
 * Grouped site footer (Play / Learn / Create / Legal) with Discord CTA and
 * copyright. Use variant="minimal" on auth shells.
 */

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { FOOTER_COPY, DISCORD_URL } from '@/lib/constants/site-copy';
import { DiscordIcon } from '@/components/shared/discord-icon';
import { MarketingExternalButton } from '@/components/landing/marketing-button';

const GROUPS = [
  FOOTER_COPY.groups.play,
  FOOTER_COPY.groups.learn,
  FOOTER_COPY.groups.create,
  FOOTER_COPY.groups.legal,
] as const;

type FooterVariant = 'full' | 'minimal';
type FooterTone = 'default' | 'auth';

export interface FooterProps {
  variant?: FooterVariant;
  /** Auth gradient shell — lighter link colors on dark gradient */
  tone?: FooterTone;
  className?: string;
}

const linkBase =
  'text-sm transition-colors py-2 min-h-[44px] flex items-center md:min-h-0 md:py-1';

function footerLinkClass(tone: FooterTone) {
  return cn(
    linkBase,
    tone === 'auth'
      ? 'text-text-secondary hover:text-text-primary dark:text-text-on-dark/80 dark:hover:text-text-on-dark'
      : 'text-text-secondary hover:text-text-primary'
  );
}

function groupHeadingClass(tone: FooterTone) {
  return cn(
    'text-xs font-semibold uppercase tracking-wide mb-2 sm:mb-3',
    tone === 'auth' ? 'text-text-primary dark:text-text-on-dark' : 'text-text-muted dark:text-text-secondary'
  );
}

function resolveHref(href: string): { href: string; external?: boolean } {
  if (href === 'contact') {
    return { href: `mailto:${FOOTER_COPY.contactEmail}`, external: true };
  }
  if (href === 'discord') {
    return { href: DISCORD_URL, external: true };
  }
  return { href };
}

function FooterLink({
  href,
  label,
  className,
  external,
}: {
  href: string;
  label: string;
  className: string;
  external?: boolean;
}) {
  if (external) {
    const isMailto = href.startsWith('mailto:');
    return (
      <a
        href={href}
        className={className}
        {...(isMailto
          ? {}
          : { target: '_blank', rel: 'noopener noreferrer' })}
      >
        {label}
      </a>
    );
  }

  return (
    <Link href={href} prefetch={false} className={className}>
      {label}
    </Link>
  );
}

function FooterMinimal({ tone, className }: { tone: FooterTone; className?: string }) {
  const linkClass = footerLinkClass(tone);

  return (
    <footer
      className={cn(
        tone === 'default' && 'w-full bg-surface-alt border-t border-divider mt-auto',
        className
      )}
    >
      <nav
        className="flex flex-wrap justify-center gap-x-6 gap-y-1 px-4 py-4 text-center"
        aria-label="Footer navigation"
      >
        {FOOTER_COPY.minimalLinks.map((item) => {
          const resolved = resolveHref(item.href);
          return (
            <FooterLink
              key={item.href}
              href={resolved.href}
              label={item.label}
              className={cn(linkClass, 'justify-center whitespace-nowrap')}
              external={resolved.external}
            />
          );
        })}
      </nav>
    </footer>
  );
}

function FooterFull({ tone, className }: { tone: FooterTone; className?: string }) {
  const linkClass = footerLinkClass(tone);
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        'w-full bg-surface-alt border-t border-divider mt-auto',
        className
      )}
    >
      <div className="layout-shell-wide py-8 sm:py-10">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 flex flex-col items-center md:col-span-4 lg:col-span-1 lg:items-start">
            <Link href="/" className="shrink-0 min-h-[44px] flex items-center" aria-label="Realms RPG home">
              <Image
                src="/images/LogoSmall.png"
                alt=""
                width={44}
                height={49}
                className="w-11 h-auto"
              />
            </Link>
          </div>

          {GROUPS.map((group) => (
            <div key={group.heading} className="min-w-0">
              <p className={groupHeadingClass(tone)}>{group.heading}</p>
              <ul className="space-y-0">
                {group.links.map((item) => {
                  const resolved = resolveHref(item.href);
                  return (
                    <li key={item.href}>
                      <FooterLink
                        href={resolved.href}
                        label={item.label}
                        className={linkClass}
                        external={resolved.external}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-divider flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <MarketingExternalButton href={DISCORD_URL} variant="outline">
            <DiscordIcon className="w-5 h-5" />
            {FOOTER_COPY.discordCta}
          </MarketingExternalButton>
          <p className="text-sm text-text-secondary text-center sm:text-right">
            {FOOTER_COPY.copyright(year)}
          </p>
        </div>
      </div>
    </footer>
  );
}

export function Footer({ variant = 'full', tone = 'default', className }: FooterProps) {
  if (variant === 'minimal') {
    return <FooterMinimal tone={tone} className={className} />;
  }
  return <FooterFull tone={tone} className={className} />;
}
