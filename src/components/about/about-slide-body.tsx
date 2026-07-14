/**
 * Renders structured About carousel slide body from about-copy.ts.
 */

'use client';

import Link from 'next/link';
import {
  BookOpen,
  Shield,
  Skull,
  Sparkles,
  Sword,
  Users,
  Wand2,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { DiscordIcon } from '@/components/shared/discord-icon';
import {
  MarketingExternalButton,
  MarketingLinkButton,
} from '@/components/landing/marketing-button';
import type {
  AboutCta,
  AboutIconKey,
  AboutInline,
  AboutSlideBody,
} from '@/lib/constants/copy/about-copy';

const ICONS: Record<Exclude<AboutIconKey, 'discord'>, LucideIcon> = {
  sword: Sword,
  skull: Skull,
  users: Users,
  sparkles: Sparkles,
  book: BookOpen,
  wand: Wand2,
  shield: Shield,
  zap: Zap,
};

function InlineRuns({
  parts,
  emphasizeLinks,
}: {
  parts: AboutInline[];
  emphasizeLinks?: boolean;
}) {
  return (
    <>
      {parts.map((part, i) => {
        if (typeof part === 'string') return <span key={i}>{part}</span>;
        if (part.type === 'strong') {
          return (
            <strong key={i} className="text-text-primary">
              {part.text}
            </strong>
          );
        }
        const linkClass = cn(
          'text-primary-link-fg hover:underline',
          (part.medium || emphasizeLinks) && 'font-medium'
        );
        if (emphasizeLinks) {
          return (
            <strong key={i} className="text-text-primary">
              <Link prefetch={false} href={part.href} className={linkClass}>
                {part.text}
              </Link>
            </strong>
          );
        }
        return (
          <Link key={i} prefetch={false} href={part.href} className={linkClass}>
            {part.text}
          </Link>
        );
      })}
    </>
  );
}

function CtaIcon({ icon, className }: { icon: AboutIconKey; className?: string }) {
  if (icon === 'discord') {
    return <DiscordIcon className={className} />;
  }
  const Icon = ICONS[icon];
  return <Icon className={className} />;
}

function CtaRow({
  ctas,
  compact,
}: {
  ctas: AboutCta[];
  compact?: boolean;
}) {
  return (
    <div className={cn('flex flex-wrap gap-4', compact ? 'mt-4 gap-3' : 'mt-6')}>
      {ctas.map((cta) => {
        const iconClass = compact ? 'w-4 h-4' : 'w-5 h-5';
        if (cta.external) {
          return (
            <MarketingExternalButton
              key={`${cta.href}-${cta.label}`}
              href={cta.href}
              size={compact ? 'sm' : undefined}
              variant={cta.variant}
            >
              <CtaIcon icon={cta.icon} className={iconClass} />
              {cta.label}
            </MarketingExternalButton>
          );
        }
        return (
          <MarketingLinkButton
            key={`${cta.href}-${cta.label}`}
            href={cta.href}
            variant={cta.variant}
            size={compact ? 'sm' : undefined}
          >
            <CtaIcon icon={cta.icon} className={iconClass} />
            {cta.label}
          </MarketingLinkButton>
        );
      })}
    </div>
  );
}

export function AboutSlideBodyView({
  body,
  compact,
}: {
  body: AboutSlideBody;
  compact?: boolean;
}) {
  const pClass = compact
    ? 'text-base text-text-secondary leading-relaxed mb-4'
    : 'text-lg text-text-secondary leading-relaxed mb-4';
  const listGap = compact ? 'space-y-2 text-sm' : 'space-y-3';
  const iconSize = compact ? 'w-4 h-4' : 'w-5 h-5';
  const itemGap = compact ? 'gap-2' : 'gap-3';

  return (
    <>
      {body.paragraphs.map((para, i) => (
        <p
          key={i}
          className={cn(pClass, para.italic && 'italic', i === body.paragraphs.length - 1 && !body.list && !body.ctas && 'mb-0')}
        >
          <InlineRuns parts={para.parts} />
        </p>
      ))}
      {body.list && body.list.length > 0 && (
        <ul className={cn(listGap, 'text-text-secondary')}>
          {body.list.map((item, i) => {
            const Icon = ICONS[item.icon];
            return (
              <li key={i} className={cn('flex items-start', itemGap)}>
                <Icon
                  className={cn(iconSize, 'text-primary-link-fg flex-shrink-0 mt-0.5')}
                  aria-hidden
                />
                <span>
                  <InlineRuns parts={item.parts} emphasizeLinks={!compact} />
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {body.ctas && body.ctas.length > 0 && <CtaRow ctas={body.ctas} compact={compact} />}
    </>
  );
}
