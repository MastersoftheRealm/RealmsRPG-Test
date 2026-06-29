/**
 * About Us Page
 * =============
 * Sleek, modern design. Fixed-height carousel with floating text.
 * Dice selector: active slide's die centered, borderless hover style.
 */

'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { Sparkles, BookOpen, Users, Wand2, Shield, Skull, Sword, Zap } from 'lucide-react';
import { ABOUT_COPY, DISCORD_URL, LANDING_COPY } from '@/lib/constants/site-copy';
import { DiscordIcon } from '@/components/shared/discord-icon';
import {
  MarketingLinkButton,
  MarketingExternalButton,
} from '@/components/landing/marketing-button';
import { LandingGradientBackdrop } from '@/components/landing/landing-gradient-backdrop';
import { LandingDiceDecor } from '@/components/landing/landing-dice-decor';
import { AboutCarouselSection } from '@/components/about/about-carousel-section';

// Order: d10, d12, d20, d4(center on load), d6, d8, d10 — 7 dice; selected always centered; cycling wraps (leftmost moves to right)
const DICE_IMAGES = [
  { src: '/images/D10.png', alt: 'D10', label: 'How You Adventure', className: '' },
  { src: '/images/D12.png', alt: 'D12', label: 'Join the Adventure', className: '' },
  { src: '/images/D20_1.png', alt: 'D20', label: 'Our Philosophy', className: '' },
  { src: '/images/D4.png', alt: 'D4', label: 'What We Offer', className: '' },
  { src: '/images/D6.png', alt: 'D6', label: 'What Makes Realms Unique', className: '' },
  { src: '/images/D8.png', alt: 'D8', label: 'Choose Who You Play', className: '' },
  { src: '/images/D10.png', alt: 'D10', label: 'Join the Community', className: 'scale-x-[-1]' },
];

// Ordered to match DICE_IMAGES: d10, d12, d20, d4, d6, d8, d10 — d4 at index 3 (center on load)
const CAROUSEL_SLIDES: Array<{
  title: string;
  content: React.ReactNode;
  /** Shorter, focused message for mobile (optional) */
  contentMobile?: React.ReactNode;
}> = [
  {
    title: 'How You Adventure',
    content: (
      <>
        <p className="text-lg text-text-secondary leading-relaxed mb-4">
          <strong className="text-text-primary">Equip your party and run the game.</strong> Craft custom <Link prefetch={false} href="/item-creator" className="text-primary-link-fg hover:underline font-medium">Armaments</Link> and weapons, build <Link prefetch={false} href="/creature-creator" className="text-primary-link-fg hover:underline font-medium">Creatures</Link> and companions, and manage <Link prefetch={false} href="/encounters" className="text-primary-link-fg hover:underline font-medium">Encounters</Link> with ease. Whether you&apos;re a player outfitting your Character or a Realm Master preparing the next challenge, these tools put creation at your fingertips.
        </p>
        <p className="text-lg text-text-secondary leading-relaxed mb-4">
          Design the perfect sword, summon a custom creature, or track your party&apos;s progress through Skill and Combat Encounters, all in one place.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <MarketingLinkButton href="/item-creator">
            <Sword className="w-5 h-5" />
            Create an Armament
          </MarketingLinkButton>
          <MarketingLinkButton href="/creature-creator" variant="outline">
            <Skull className="w-5 h-5" />
            Creature Creator
          </MarketingLinkButton>
          <MarketingLinkButton href="/encounters" variant="outline">
            <Users className="w-5 h-5" />
            Encounter Tracker
          </MarketingLinkButton>
        </div>
      </>
    ),
    contentMobile: (
      <>
        <p className="text-base text-text-secondary leading-relaxed mb-4">
          <strong className="text-text-primary">Equip your party and run the game.</strong> Craft Armaments, build Creatures, and manage Encounters, all in one place.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <MarketingLinkButton href="/item-creator" size="sm">
            <Sword className="w-4 h-4" />
            Armaments
          </MarketingLinkButton>
          <MarketingLinkButton href="/creature-creator" variant="outline" size="sm">
            <Skull className="w-4 h-4" />
            Creatures
          </MarketingLinkButton>
          <MarketingLinkButton href="/encounters" variant="outline" size="sm">
            <Users className="w-4 h-4" />
            Encounters
          </MarketingLinkButton>
        </div>
      </>
    ),
  },
  {
    title: 'Join the Adventure',
    content: (
      <>
        <p className="text-lg text-text-secondary leading-relaxed mb-4">
          <strong className="text-text-primary">Dice are the lifeblood of the story.</strong> They introduce random chance and represent a hint of chaos in every Encounter, making each roll an exciting part of the game.
        </p>
        <p className="text-lg text-text-secondary leading-relaxed mb-4">
          <Link prefetch={false} href="/characters/new" className="text-primary-link-fg hover:underline font-medium">Character creation</Link> is the most exciting part of the game, and it&apos;s a comprehensive guide for everything you need to create a unique Character. Whether you&apos;re a Realm Master crafting adventures for your party or a player bringing your dream Character to life, we&apos;re here to support your journey.
        </p>
        <p className="text-lg text-text-secondary leading-relaxed">
          Realms promises to reward you with immersive and satisfying Characters built on exactly what you envision. We invite you to explore the <Link prefetch={false} href="/codex" className="text-primary-link-fg hover:underline font-medium">Codex</Link>, build in the <Link prefetch={false} href="/power-creator" className="text-primary-link-fg hover:underline font-medium">Creators</Link>, and adventure in a way only the imagination can picture.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <MarketingLinkButton href="/characters/new">
            <Sparkles className="w-5 h-5" />
            Create a Character
          </MarketingLinkButton>
          <MarketingLinkButton href="/rules" variant="outline">
            <BookOpen className="w-5 h-5" />
            Read the Core Rulebook
          </MarketingLinkButton>
        </div>
      </>
    ),
    contentMobile: (
      <>
        <p className="text-base text-text-secondary leading-relaxed mb-4">
          <strong className="text-text-primary">Dice are the lifeblood of the story.</strong> Character creation is the most exciting part. We support your journey from Codex to Creators to adventure.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <MarketingLinkButton href="/characters/new" size="sm">
            <Sparkles className="w-4 h-4" />
            Create a Character
          </MarketingLinkButton>
          <MarketingLinkButton href="/rules" variant="outline" size="sm">
            <BookOpen className="w-4 h-4" />
            Core Rulebook
          </MarketingLinkButton>
        </div>
      </>
    ),
  },
  {
    title: 'Our Philosophy',
    content: (
      <>
        <p className="text-lg text-text-secondary leading-relaxed mb-4">
          Realms is built around three core goals for the player experience: <strong className="text-text-primary">freedom in player creativity and customization</strong>, <strong className="text-text-primary">engaging and fluid gameplay</strong>, and <strong className="text-text-primary">putting fun first, flavor second, and rules third</strong>.
        </p>
        <p className="text-lg text-text-secondary leading-relaxed mb-4">
          If you give time and energy to the game, trusting the system with your most precious and creative ideas, it promises to reward you with immersive and satisfying Characters built on exactly what you envision, adventuring in a way only the imagination can picture.
        </p>
        <p className="text-lg text-text-secondary leading-relaxed italic">
          Games are about having fun, after all!
        </p>
      </>
    ),
    contentMobile: (
      <>
        <p className="text-base text-text-secondary leading-relaxed mb-4">
          Realms is built around <strong className="text-text-primary">freedom in creativity</strong>, <strong className="text-text-primary">fluid gameplay</strong>, and <strong className="text-text-primary">fun first, flavor second, rules third</strong>.
        </p>
        <p className="text-base text-text-secondary leading-relaxed italic">
          Games are about having fun, after all!
        </p>
      </>
    ),
  },
  {
    title: 'What We Offer',
    content: (
      <>
        <p className="text-lg text-text-secondary leading-relaxed mb-4">
          This website is your digital companion for Realms, a TTRPG designed for ultimate creative freedom. We provide the tools to turn any imagination into creation through the imaginative joy of tabletop roleplaying.
        </p>
        <ul className="space-y-3 text-text-secondary">
          <li className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-primary-link-fg flex-shrink-0 mt-0.5" />
            <span><strong className="text-text-primary"><Link prefetch={false} href="/characters/new" className="text-primary-link-fg hover:underline">Digital Character Sheets</Link></strong>: Automatic ability calculations, dropdown menus for Skills and Feats, and user-friendly tools to streamline gameplay and Character creation.</span>
          </li>
          <li className="flex items-start gap-3">
            <Wand2 className="w-5 h-5 text-primary-link-fg flex-shrink-0 mt-0.5" />
            <span><strong className="text-text-primary"><Link prefetch={false} href="/power-creator" className="text-primary-link-fg hover:underline">Power</Link> & <Link prefetch={false} href="/technique-creator" className="text-primary-link-fg hover:underline">Technique Creator</Link></strong>: Design your Character&apos;s unique toolset with infinite combinations of flavor and effect.</span>
          </li>
          <li className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary-link-fg flex-shrink-0 mt-0.5" />
            <span><strong className="text-text-primary"><Link prefetch={false} href="/item-creator" className="text-primary-link-fg hover:underline">Item Creator</Link></strong>: Craft custom Armaments, weapons, and armor to fit your vision.</span>
          </li>
          <li className="flex items-start gap-3">
            <Skull className="w-5 h-5 text-primary-link-fg flex-shrink-0 mt-0.5" />
            <span><strong className="text-text-primary"><Link prefetch={false} href="/creature-creator" className="text-primary-link-fg hover:underline">Creature Creator</Link></strong>: Build custom monsters, companions, and Encounters for your party.</span>
          </li>
          <li className="flex items-start gap-3">
            <Users className="w-5 h-5 text-primary-link-fg flex-shrink-0 mt-0.5" />
            <span><strong className="text-text-primary"><Link prefetch={false} href="/encounters" className="text-primary-link-fg hover:underline">Encounter Tracker</Link></strong>: Run Skill and Combat Encounters with ease.</span>
          </li>
        </ul>
      </>
    ),
    contentMobile: (
      <>
        <p className="text-base text-text-secondary leading-relaxed mb-4">
          Your digital companion for Realms, with tools to turn imagination into creation.
        </p>
        <ul className="space-y-2 text-text-secondary text-sm">
          <li className="flex items-start gap-2">
            <BookOpen className="w-4 h-4 text-primary-link-fg flex-shrink-0 mt-0.5" />
            <span><Link prefetch={false} href="/characters/new" className="text-primary-link-fg hover:underline font-medium">Character Sheets</Link>: calculations, Skills, Feats.</span>
          </li>
          <li className="flex items-start gap-2">
            <Wand2 className="w-4 h-4 text-primary-link-fg flex-shrink-0 mt-0.5" />
            <span><Link prefetch={false} href="/power-creator" className="text-primary-link-fg hover:underline font-medium">Powers</Link> & <Link prefetch={false} href="/technique-creator" className="text-primary-link-fg hover:underline font-medium">Techniques</Link>.</span>
          </li>
          <li className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-primary-link-fg flex-shrink-0 mt-0.5" />
            <span><Link prefetch={false} href="/item-creator" className="text-primary-link-fg hover:underline font-medium">Armaments</Link>: weapons, armor.</span>
          </li>
          <li className="flex items-start gap-2">
            <Skull className="w-4 h-4 text-primary-link-fg flex-shrink-0 mt-0.5" />
            <span><Link prefetch={false} href="/creature-creator" className="text-primary-link-fg hover:underline font-medium">Creatures</Link> & <Link prefetch={false} href="/encounters" className="text-primary-link-fg hover:underline font-medium">Encounters</Link>.</span>
          </li>
        </ul>
      </>
    ),
  },
  {
    title: 'What Makes Realms Unique',
    content: (
      <>
        <p className="text-lg text-text-secondary leading-relaxed mb-4">
          Each Power, Technique, Feat, and Character choice is a <strong className="text-text-primary">blank slate</strong>, waiting for you to imagine, create, and develop into your perfect vision. The rules and mechanics of Realms are designed as <strong className="text-text-primary">scaffolding to help you build upon</strong>, so you can shape every aspect of your Character and ideas.
        </p>
        <p className="text-lg text-text-secondary leading-relaxed mb-4">
          You are not confined by the description or name of a Feat, the way a Species is portrayed, or any other predefined aspect of the game. Ultimately, you decide why a Feat works the way it does, what a Power looks like in action, or how your Character uses a Skill.
        </p>
        <p className="text-lg text-text-secondary leading-relaxed">
          With the added layer of freedom in world-building backed by the idea of <strong className="text-text-primary">&quot;The Realms,&quot;</strong> the cooperative style of fantasy Table-Top Role Playing Games (TTRPG) gameplay, and the combined creativity of a party of friends, Realms is a rewarding role-play experience for all.
        </p>
      </>
    ),
    contentMobile: (
      <>
        <p className="text-base text-text-secondary leading-relaxed mb-4">
          Each Power, Technique, Feat, and Character choice is a <strong className="text-text-primary">blank slate</strong>. The rules are <strong className="text-text-primary">scaffolding</strong>; you decide why a Feat works, what a Power looks like, and how your Character uses a Skill.
        </p>
        <p className="text-base text-text-secondary leading-relaxed">
          Realms rewards creativity and collaboration.
        </p>
      </>
    ),
  },
  {
    title: 'Choose Who You Play',
    content: (
      <>
        <p className="text-lg text-text-secondary leading-relaxed mb-4">
          <strong className="text-text-primary">Your Character is yours to define.</strong> From Species and Ancestry to <Link prefetch={false} href="/power-creator" className="text-primary-link-fg hover:underline font-medium">Powers</Link>, <Link prefetch={false} href="/technique-creator" className="text-primary-link-fg hover:underline font-medium">Techniques</Link>, Skills, and Feats, every choice shapes who they are. Create custom Powers that fit your vision, design Techniques that feel uniquely yours, and build a <Link prefetch={false} href="/characters/new" className="text-primary-link-fg hover:underline font-medium">Character</Link> that reflects your imagination.
        </p>
        <p className="text-lg text-text-secondary leading-relaxed mb-4">
          Whether you&apos;re a spellcaster weaving magic or a martial warrior mastering the blade, Realms gives you the tools to bring your ideal adventurer to life.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <MarketingLinkButton href="/power-creator">
            <Wand2 className="w-5 h-5" />
            Create a Power
          </MarketingLinkButton>
          <MarketingLinkButton href="/technique-creator" variant="outline">
            <Zap className="w-5 h-5" />
            Create a Technique
          </MarketingLinkButton>
          <MarketingLinkButton href="/characters/new" variant="outline">
            <Sparkles className="w-5 h-5" />
            Create a Character
          </MarketingLinkButton>
        </div>
      </>
    ),
    contentMobile: (
      <>
        <p className="text-base text-text-secondary leading-relaxed mb-4">
          <strong className="text-text-primary">Your Character is yours to define.</strong> From Species to Powers, Techniques, and Feats, every choice shapes who they are.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <MarketingLinkButton href="/power-creator" size="sm">
            <Wand2 className="w-4 h-4" />
            Power
          </MarketingLinkButton>
          <MarketingLinkButton href="/technique-creator" variant="outline" size="sm">
            <Zap className="w-4 h-4" />
            Technique
          </MarketingLinkButton>
          <MarketingLinkButton href="/characters/new" variant="outline" size="sm">
            <Sparkles className="w-4 h-4" />
            Character
          </MarketingLinkButton>
        </div>
      </>
    ),
  },
  {
    title: 'Join the Community',
    content: (
      <>
        <p className="text-lg text-text-secondary leading-relaxed mb-4">
          <strong className="text-text-primary">Realms is better together.</strong> Connect with other players and Realm Masters, share house rules, and find games. The core rules give you the foundation; your table brings it to life.
        </p>
        <p className="text-lg text-text-secondary leading-relaxed mb-4">
          Join the community to get the most out of Realms: ask questions, share characters and creatures, and stay updated on tools and rules.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <MarketingExternalButton href={DISCORD_URL}>
            <DiscordIcon className="w-5 h-5" />
            {LANDING_COPY.community.cta}
          </MarketingExternalButton>
          <MarketingLinkButton href="/rules" variant="outline">
            <BookOpen className="w-5 h-5" />
            Core Rules
          </MarketingLinkButton>
        </div>
      </>
    ),
    contentMobile: (
      <>
        <p className="text-base text-text-secondary leading-relaxed mb-4">
          <strong className="text-text-primary">Realms is better together.</strong> Connect with players, share house rules, find games.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <MarketingExternalButton href={DISCORD_URL} size="sm">
            <DiscordIcon className="w-4 h-4" />
            {LANDING_COPY.community.cta}
          </MarketingExternalButton>
          <MarketingLinkButton href="/rules" variant="outline" size="sm">
            <BookOpen className="w-4 h-4" />
            Core Rules
          </MarketingLinkButton>
        </div>
      </>
    ),
  },
];

const CENTER_INDEX = 3; // d4 in order: d10, d12, d20, d4, d6, d8, d10

export default function AboutPage() {
  return (
    <>
      <section
        className={cn(
          'relative overflow-hidden',
          'bg-gradient-to-br from-background via-primary-subtle-bg to-primary-100',
          'dark:from-primary-900 dark:via-primary-800 dark:to-primary-900'
        )}
      >
        <LandingGradientBackdrop />
        <LandingDiceDecor variant="auth" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent dark:from-background" aria-hidden="true" />
        <div className="relative z-10 layout-shell-wide mx-auto max-w-[var(--container-wide)] px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-14 text-center lg:text-left">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary dark:text-text-on-dark mb-3">
            {ABOUT_COPY.pageTitle}
          </h1>
          <p className="font-nunito text-base sm:text-lg text-text-secondary dark:text-text-on-dark/90 max-w-[58ch] mx-auto lg:mx-0">
            {ABOUT_COPY.pageDescription}
          </p>
        </div>
      </section>

      <section className="bg-background pb-14 sm:pb-20 pt-8 sm:pt-10 -mt-1">
        <div className="layout-shell-wide mx-auto max-w-[var(--container-wide)] px-4 sm:px-6 lg:px-8 space-y-14 sm:space-y-16">
          <AboutCarouselSection
            slides={CAROUSEL_SLIDES}
            dice={DICE_IMAGES}
            initialIndex={CENTER_INDEX}
          />

          <div className="max-w-3xl lg:max-w-none">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-text-primary mb-4">
              {ABOUT_COPY.creatorNote.heading}
            </h2>
            <p className="font-nunito text-lg text-text-muted dark:text-text-secondary italic mb-4">
              {ABOUT_COPY.creatorNote.greeting}
            </p>
            <p className="font-nunito text-base sm:text-lg text-text-secondary leading-relaxed mb-4">
              {ABOUT_COPY.creatorNote.bodyLead}{' '}
              <strong className="text-text-primary">{ABOUT_COPY.creatorNote.bodyEmphasis}</strong>,{' '}
              {ABOUT_COPY.creatorNote.bodyTail}
            </p>
            <p className="font-nunito text-lg text-text-muted dark:text-text-secondary italic mb-8">
              {ABOUT_COPY.creatorNote.closing}
              <br />
              <span className="font-semibold text-text-primary not-italic">{ABOUT_COPY.creatorNote.authorName}</span>
              <br />
              {ABOUT_COPY.creatorNote.authorTitle}
            </p>
            <div className="flex flex-wrap gap-3 justify-center sm:justify-start items-center">
              <MarketingLinkButton href="/characters/new">
                <Sparkles className="w-5 h-5 shrink-0" />
                {LANDING_COPY.hero.primaryCta}
              </MarketingLinkButton>
              <MarketingLinkButton href="/rules" variant="outline">
                <BookOpen className="w-5 h-5 shrink-0" />
                {ABOUT_COPY.ctas.rules}
              </MarketingLinkButton>
              <MarketingExternalButton href={DISCORD_URL} variant="outline">
                <DiscordIcon className="w-5 h-5" />
                {LANDING_COPY.community.cta}
              </MarketingExternalButton>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
