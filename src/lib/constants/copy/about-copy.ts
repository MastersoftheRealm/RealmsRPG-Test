/** About page copy — edit text for `/about` (header, creator note, dice carousel). */

import { DISCORD_URL, REALMS_MOTTO } from './shared-copy';
import { LANDING_COPY } from './landing-copy';

/** Inline run of paragraph text — string, bold, or in-page link. */
export type AboutInline =
  | string
  | { type: 'strong'; text: string }
  | { type: 'link'; text: string; href: string; medium?: boolean | undefined };

export type AboutParagraph = {
  parts: AboutInline[];
  italic?: boolean | undefined;
};

export type AboutListItem = {
  icon: Exclude<AboutIconKey, 'discord'>;
  parts: AboutInline[];
};

export type AboutIconKey =
  | 'sword'
  | 'skull'
  | 'users'
  | 'sparkles'
  | 'book'
  | 'wand'
  | 'shield'
  | 'zap'
  | 'discord';

export type AboutCta = {
  href: string;
  label: string;
  variant?: 'primary' | 'outline' | undefined;
  icon: AboutIconKey;
  /** External URL (Discord, etc.) */
  external?: boolean | undefined;
};

export type AboutSlideBody = {
  paragraphs: AboutParagraph[];
  list?: AboutListItem[] | undefined;
  ctas?: AboutCta[] | undefined;
};

export type AboutCarouselSlideCopy = {
  title: string;
  desktop: AboutSlideBody;
  mobile: AboutSlideBody;
};

/** Dice strip — asset metadata; labels come from matching slide titles. */
export const ABOUT_DICE_ASSETS = [
  { src: '/images/D10.png', alt: 'D10', className: '' },
  { src: '/images/D12.png', alt: 'D12', className: '' },
  { src: '/images/D20_1.png', alt: 'D20', className: '' },
  { src: '/images/D4.png', alt: 'D4', className: '' },
  { src: '/images/D6.png', alt: 'D6', className: '' },
  { src: '/images/D8.png', alt: 'D8', className: '' },
  { src: '/images/D10.png', alt: 'D10', className: 'scale-x-[-1]' },
] as const;

/** Center die on load (d4) — order: d10, d12, d20, d4, d6, d8, d10 */
export const ABOUT_CAROUSEL_CENTER_INDEX = 3;

export const ABOUT_CAROUSEL_SLIDES: AboutCarouselSlideCopy[] = [
  {
    title: 'How You Adventure',
    desktop: {
      paragraphs: [
        {
          parts: [
            { type: 'strong', text: 'Equip your party and run the game.' },
            ' Craft custom ',
            { type: 'link', text: 'Armaments', href: '/item-creator', medium: true },
            ' and weapons, build ',
            { type: 'link', text: 'Creatures', href: '/creature-creator', medium: true },
            ' and companions, and manage ',
            { type: 'link', text: 'Encounters', href: '/encounters', medium: true },
            ' with ease. Whether you\u2019re a player outfitting your Character or a Realm Master preparing the next challenge, these tools put creation at your fingertips.',
          ],
        },
        {
          parts: [
            'Design the perfect sword, summon a custom creature, or track your party\u2019s progress through Skill and Combat Encounters, all in one place.',
          ],
        },
      ],
      ctas: [
        { href: '/item-creator', label: 'Create an Armament', icon: 'sword' },
        { href: '/creature-creator', label: 'Creature Creator', variant: 'outline', icon: 'skull' },
        { href: '/encounters', label: 'Encounter Tracker', variant: 'outline', icon: 'users' },
      ],
    },
    mobile: {
      paragraphs: [
        {
          parts: [
            { type: 'strong', text: 'Equip your party and run the game.' },
            ' Craft Armaments, build Creatures, and manage Encounters, all in one place.',
          ],
        },
      ],
      ctas: [
        { href: '/item-creator', label: 'Armaments', icon: 'sword' },
        { href: '/creature-creator', label: 'Creatures', variant: 'outline', icon: 'skull' },
        { href: '/encounters', label: 'Encounters', variant: 'outline', icon: 'users' },
      ],
    },
  },
  {
    title: 'Join the Adventure',
    desktop: {
      paragraphs: [
        {
          parts: [
            { type: 'strong', text: 'Dice are the lifeblood of the story.' },
            ' They introduce random chance and represent a hint of chaos in every Encounter, making each roll an exciting part of the game.',
          ],
        },
        {
          parts: [
            { type: 'link', text: 'Character creation', href: '/characters/new', medium: true },
            ' is the most exciting part of the game, and it\u2019s a comprehensive guide for everything you need to create a unique Character. Whether you\u2019re a Realm Master crafting adventures for your party or a player bringing your dream Character to life, we\u2019re here to support your journey.',
          ],
        },
        {
          parts: [
            'Realms promises to reward you with immersive and satisfying Characters built on exactly what you envision. We invite you to explore the ',
            { type: 'link', text: 'Codex', href: '/codex', medium: true },
            ', build in the ',
            { type: 'link', text: 'Creators', href: '/power-creator', medium: true },
            ', and adventure in a way only the imagination can picture.',
          ],
        },
      ],
      ctas: [
        { href: '/characters/new', label: 'Create a Character', icon: 'sparkles' },
        { href: '/rules', label: 'Read the Core Rulebook', variant: 'outline', icon: 'book' },
      ],
    },
    mobile: {
      paragraphs: [
        {
          parts: [
            { type: 'strong', text: 'Dice are the lifeblood of the story.' },
            ' Character creation is the most exciting part. We support your journey from Codex to Creators to adventure.',
          ],
        },
      ],
      ctas: [
        { href: '/characters/new', label: 'Create a Character', icon: 'sparkles' },
        { href: '/rules', label: 'Core Rulebook', variant: 'outline', icon: 'book' },
      ],
    },
  },
  {
    title: 'Our Philosophy',
    desktop: {
      paragraphs: [
        {
          parts: [
            'Realms is built around three core goals for the player experience: ',
            { type: 'strong', text: 'freedom in player creativity and customization' },
            ', ',
            { type: 'strong', text: 'engaging and fluid gameplay' },
            ', and ',
            { type: 'strong', text: 'putting fun first, flavor second, and rules third' },
            '.',
          ],
        },
        {
          parts: [
            'If you give time and energy to the game, trusting the system with your most precious and creative ideas, it promises to reward you with immersive and satisfying Characters built on exactly what you envision, adventuring in a way only the imagination can picture.',
          ],
        },
        {
          italic: true,
          parts: ['Games are about having fun, after all!'],
        },
      ],
    },
    mobile: {
      paragraphs: [
        {
          parts: [
            'Realms is built around ',
            { type: 'strong', text: 'freedom in creativity' },
            ', ',
            { type: 'strong', text: 'fluid gameplay' },
            ', and ',
            { type: 'strong', text: 'fun first, flavor second, rules third' },
            '.',
          ],
        },
        {
          italic: true,
          parts: ['Games are about having fun, after all!'],
        },
      ],
    },
  },
  {
    title: 'What We Offer',
    desktop: {
      paragraphs: [
        {
          parts: [
            'This website is your digital companion for Realms, a TTRPG designed for ultimate creative freedom. We provide the tools to turn any imagination into creation through the imaginative joy of tabletop roleplaying.',
          ],
        },
      ],
      list: [
        {
          icon: 'book',
          parts: [
            { type: 'link', text: 'Digital Character Sheets', href: '/characters/new' },
            ': Automatic ability calculations, dropdown menus for Skills and Feats, and user-friendly tools to streamline gameplay and Character creation.',
          ],
        },
        {
          icon: 'wand',
          parts: [
            { type: 'link', text: 'Power', href: '/power-creator' },
            ' & ',
            { type: 'link', text: 'Technique Creator', href: '/technique-creator' },
            ': Design your Character\u2019s unique toolset with infinite combinations of flavor and effect.',
          ],
        },
        {
          icon: 'shield',
          parts: [
            { type: 'link', text: 'Item Creator', href: '/item-creator' },
            ': Craft custom Armaments, weapons, and armor to fit your vision.',
          ],
        },
        {
          icon: 'skull',
          parts: [
            { type: 'link', text: 'Creature Creator', href: '/creature-creator' },
            ': Build custom monsters, companions, and Encounters for your party.',
          ],
        },
        {
          icon: 'users',
          parts: [
            { type: 'link', text: 'Encounter Tracker', href: '/encounters' },
            ': Run Skill and Combat Encounters with ease.',
          ],
        },
      ],
    },
    mobile: {
      paragraphs: [
        {
          parts: [
            'Your digital companion for Realms, with tools to turn imagination into creation.',
          ],
        },
      ],
      list: [
        {
          icon: 'book',
          parts: [
            { type: 'link', text: 'Character Sheets', href: '/characters/new', medium: true },
            ': calculations, Skills, Feats.',
          ],
        },
        {
          icon: 'wand',
          parts: [
            { type: 'link', text: 'Powers', href: '/power-creator', medium: true },
            ' & ',
            { type: 'link', text: 'Techniques', href: '/technique-creator', medium: true },
            '.',
          ],
        },
        {
          icon: 'shield',
          parts: [
            { type: 'link', text: 'Armaments', href: '/item-creator', medium: true },
            ': weapons, armor.',
          ],
        },
        {
          icon: 'skull',
          parts: [
            { type: 'link', text: 'Creatures', href: '/creature-creator', medium: true },
            ' & ',
            { type: 'link', text: 'Encounters', href: '/encounters', medium: true },
            '.',
          ],
        },
      ],
    },
  },
  {
    title: 'What Makes Realms Unique',
    desktop: {
      paragraphs: [
        {
          parts: [
            'Each Power, Technique, Feat, and Character choice is a ',
            { type: 'strong', text: 'blank slate' },
            ', waiting for you to imagine, create, and develop into your perfect vision. The rules and mechanics of Realms are designed as ',
            { type: 'strong', text: 'scaffolding to help you build upon' },
            ', so you can shape every aspect of your Character and ideas.',
          ],
        },
        {
          parts: [
            'You are not confined by the description or name of a Feat, the way a Species is portrayed, or any other predefined aspect of the game. Ultimately, you decide why a Feat works the way it does, what a Power looks like in action, or how your Character uses a Skill.',
          ],
        },
        {
          parts: [
            'With the added layer of freedom in world-building backed by the idea of ',
            { type: 'strong', text: '"The Realms,"' },
            ' the cooperative style of fantasy Table-Top Role Playing Games (TTRPG) gameplay, and the combined creativity of a party of friends, Realms is a rewarding role-play experience for all.',
          ],
        },
      ],
    },
    mobile: {
      paragraphs: [
        {
          parts: [
            'Each Power, Technique, Feat, and Character choice is a ',
            { type: 'strong', text: 'blank slate' },
            '. The rules are ',
            { type: 'strong', text: 'scaffolding' },
            '; you decide why a Feat works, what a Power looks like, and how your Character uses a Skill.',
          ],
        },
        {
          parts: ['Realms rewards creativity and collaboration.'],
        },
      ],
    },
  },
  {
    title: 'Choose Who You Play',
    desktop: {
      paragraphs: [
        {
          parts: [
            { type: 'strong', text: 'Your Character is yours to define.' },
            ' From Species and Ancestry to ',
            { type: 'link', text: 'Powers', href: '/power-creator', medium: true },
            ', ',
            { type: 'link', text: 'Techniques', href: '/technique-creator', medium: true },
            ', Skills, and Feats, every choice shapes who they are. Create custom Powers that fit your vision, design Techniques that feel uniquely yours, and build a ',
            { type: 'link', text: 'Character', href: '/characters/new', medium: true },
            ' that reflects your imagination.',
          ],
        },
        {
          parts: [
            'Whether you\u2019re a spellcaster weaving magic or a martial warrior mastering the blade, Realms gives you the tools to bring your ideal adventurer to life.',
          ],
        },
      ],
      ctas: [
        { href: '/power-creator', label: 'Create a Power', icon: 'wand' },
        {
          href: '/technique-creator',
          label: 'Create a Technique',
          variant: 'outline',
          icon: 'zap',
        },
        {
          href: '/characters/new',
          label: 'Create a Character',
          variant: 'outline',
          icon: 'sparkles',
        },
      ],
    },
    mobile: {
      paragraphs: [
        {
          parts: [
            { type: 'strong', text: 'Your Character is yours to define.' },
            ' From Species to Powers, Techniques, and Feats, every choice shapes who they are.',
          ],
        },
      ],
      ctas: [
        { href: '/power-creator', label: 'Power', icon: 'wand' },
        { href: '/technique-creator', label: 'Technique', variant: 'outline', icon: 'zap' },
        { href: '/characters/new', label: 'Character', variant: 'outline', icon: 'sparkles' },
      ],
    },
  },
  {
    title: 'Join the Community',
    desktop: {
      paragraphs: [
        {
          parts: [
            { type: 'strong', text: 'Realms is better together.' },
            ' Connect with other players and Realm Masters, share house rules, and find games. The core rules give you the foundation; your table brings it to life.',
          ],
        },
        {
          parts: [
            'Join the community to get the most out of Realms: ask questions, share characters and creatures, and stay updated on tools and rules.',
          ],
        },
      ],
      ctas: [
        {
          href: DISCORD_URL,
          label: LANDING_COPY.community.cta,
          icon: 'discord',
          external: true,
        },
        { href: '/rules', label: 'Core Rules', variant: 'outline', icon: 'book' },
      ],
    },
    mobile: {
      paragraphs: [
        {
          parts: [
            { type: 'strong', text: 'Realms is better together.' },
            ' Connect with players, share house rules, find games.',
          ],
        },
      ],
      ctas: [
        {
          href: DISCORD_URL,
          label: LANDING_COPY.community.cta,
          icon: 'discord',
          external: true,
        },
        { href: '/rules', label: 'Core Rules', variant: 'outline', icon: 'book' },
      ],
    },
  },
];

export const ABOUT_COPY = {
  pageTitle: 'About Realms',
  pageDescription: `${REALMS_MOTTO}. The tabletop RPG built for limitless creative freedom prioritizing fun first, flavor second, rules third.`,
  creatorNote: {
    heading: 'A Note from the Creator',
    greeting: 'Dear Realms Player,',
    bodyLead:
      'Thank you for playing my game! I designed it with the hope that others would have as much fun with it as I do, and it means a lot to see people enjoying it. Realms is built to make',
    bodyEmphasis: 'your ideas into reality',
    bodyTail: 'I deeply appreciate your enthusiasm for the game. I hope you have fun!',
    closing: 'Sincerely,',
    authorName: 'Kadin Brooksby',
    authorTitle: 'Creator of Realms',
  },
  ctas: {
    rules: 'Read the Core Rulebook',
  },
  carousel: ABOUT_CAROUSEL_SLIDES,
  diceAssets: ABOUT_DICE_ASSETS,
  carouselCenterIndex: ABOUT_CAROUSEL_CENTER_INDEX,
} as const;
