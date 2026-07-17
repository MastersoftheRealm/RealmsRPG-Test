/** Site footer copy and link groups — edit for global footer / auth shell. */

import { SITE_CONTACT_EMAIL } from './shared-copy';

export const FOOTER_COPY = {
  contactEmail: SITE_CONTACT_EMAIL,
  discordCta: 'Join the Discord',
  copyright: (year: number) => `© ${year} Realms RPG`,
  groups: {
    play: {
      heading: 'Play',
      links: [
        { href: '/characters', label: 'Characters' },
        { href: '/campaigns', label: 'Campaigns' },
        { href: '/encounters', label: 'Encounters' },
      ],
    },
    learn: {
      heading: 'Learn',
      links: [
        { href: '/about', label: 'About' },
        { href: '/rules', label: 'Core Rulebook' },
        { href: '/resources', label: 'Resources' },
      ],
    },
    create: {
      heading: 'Create',
      links: [
        { href: '/power-creator', label: 'Power Creator' },
        { href: '/item-creator', label: 'Armament Creator' },
        { href: '/technique-creator', label: 'Technique Creator' },
      ],
    },
    legal: {
      heading: 'Legal',
      links: [
        { href: '/terms', label: 'Terms' },
        { href: '/privacy', label: 'Privacy' },
        { href: 'contact', label: 'Contact' },
      ],
    },
  },
  minimalLinks: [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
    { href: 'contact', label: 'Contact' },
    { href: 'discord', label: 'Join the Discord' },
  ],
} as const;
