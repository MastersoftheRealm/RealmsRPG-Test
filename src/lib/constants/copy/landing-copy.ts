/** Landing page copy — edit text for `/` (REALMS_PRODUCT_OVERVIEW Section 4). */

export const LANDING_COPY = {
  hero: {
    headline: 'Become Any Character You Can Imagine',
    subline:
      'Realms is a tabletop RPG built for limitless creativity; from character creation, to your weapons and powers, you design it all.',
    primaryCta: 'Start Playing',
    explorer: 'New to TTRPGs? See how Realms works',
    returning: {
      headline: 'Welcome back, adventurer.',
      subline: 'Pick up where you left off, or bring a new character to life.',
      primaryCta: 'Continue your adventure',
      secondaryCta: 'Create another character',
    },
  },
  uniqueness: {
    heading: 'A System Built Around Your Imagination',
    subheading: 'Create something unique, or utilize something tried and true.',
    items: [
      {
        title: 'Limitless Character Creation',
        body: 'Bring any dream characters to life. Follow a guided path or forge your own from species, feats, powers, and gear.',
        href: '/characters/new',
        linkLabel: 'Start character creation',
      },
      {
        title: 'Custom Powers & Gear',
        body: 'Design powers from infinite combinations of parts and effects, or craft weapons and armor to perfectly fit your build.',
        href: '/power-creator',
        linkLabel: 'Create custom powers',
      },
      {
        title: 'Rules that Support Your Creativity',
        body: 'The rules are scaffolding, not handcuffs. You decide why a feat works, what a power looks like, and how your story unfolds.',
        href: '/rules',
        linkLabel: 'Read the Core Rulebook',
      },
    ],
  },
  howItWorks: {
    heading: 'Start Playing in Three Steps',
    steps: [
      {
        title: 'Choose Your Path',
        body: 'Begin with character creation, and choose an Archetype Path.',
      },
      {
        title: 'Become Your Character',
        body: 'Pick and customize your Species, Abilities, Skills, Feats, and everything in between!',
      },
      {
        title: 'Play with Friends',
        body: 'Bring your character to the table and start your adventure.',
      },
    ],
  },
  secondaryDiscovery: {
    heading: 'Want to Build Something Custom?',
    subheading: 'Create the exact powers and equipment your character needs.',
    power: {
      title: 'Create a Custom Power',
      body: 'Combine parts and effects into a power that is truly your own.',
      cta: 'Open the Power Creator',
    },
    item: {
      title: 'Create Weapons & Armor',
      body: 'Forge custom armaments crafted for your build and your story.',
      cta: 'Open the Item Creator',
    },
  },
  community: {
    heading: 'Realms is better together',
    body: 'Find a group, share your builds, and get help from players and Realm Masters. Friends bring the game to life!',
    cta: 'Join the Discord',
  },
} as const;
