/** Primary nav labels — edit for site header (`header.tsx`). */

export type NavLink =
  | { href: string; label: string; external?: boolean | undefined }
  | { label: string; dropdown: { href: string; label: string }[] };

export const NAV_COPY: {
  links: NavLink[];
  tippy: { library: string; codex: string };
} = {
  links: [
    { href: '/characters', label: 'Characters' },
    { href: '/library', label: 'Library' },
    { href: '/codex', label: 'Codex' },
    {
      label: 'Creators',
      dropdown: [
        { href: '/power-creator', label: 'Powers' },
        { href: '/technique-creator', label: 'Techniques' },
        { href: '/empowered-technique-creator', label: 'Empowered Techniques' },
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
        { href: '/crafting', label: 'Crafting' },
        { href: '/creature-creator', label: 'Creature Creator' },
      ],
    },
    { href: '/campaigns', label: 'Campaigns' },
    { href: '/about', label: 'About' },
  ],
  tippy: {
    library: 'About Realms Library',
    codex: 'About Realms Codex',
  },
};
