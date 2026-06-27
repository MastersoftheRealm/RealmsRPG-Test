/**
 * About Us Page
 * =============
 * Sleek, modern design. Fixed-height carousel with floating text.
 * Dice selector: active slide's die centered, borderless hover style.
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PageContainer, PageHeader, Button } from '@/components/ui';
import { Swords, Sparkles, BookOpen, Users, Wand2, Shield, Skull, Sword, Zap, MessageCircle } from 'lucide-react';
import { REALMS_MOTTO } from '@/lib/constants/site-copy';

// Discord link (same as home/footer)
const DISCORD_URL = 'https://discord.gg/XbX4nFbxga';

type MarketingButtonVariant = 'primary' | 'outline';

function MarketingLinkButton({
  href,
  variant = 'primary',
  size,
  className,
  children,
}: {
  href: string;
  variant?: MarketingButtonVariant;
  size?: 'sm';
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Button asChild variant={variant} size={size} className={className}>
      <Link prefetch={false} href={href}>
        {children}
      </Link>
    </Button>
  );
}

function MarketingExternalButton({
  href,
  variant = 'primary',
  size,
  className,
  children,
}: {
  href: string;
  variant?: MarketingButtonVariant;
  size?: 'sm';
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Button asChild variant={variant} size={size} className={className}>
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    </Button>
  );
}

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
            <MessageCircle className="w-5 h-5" />
            Join the Discord
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
            <MessageCircle className="w-4 h-4" />
            Discord
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

// Fixed height so carousel doesn't jump when switching slides
const CAROUSEL_CONTENT_MIN_H = 'min-h-[420px]';

const FADE_DURATION_MS = 180;

const CENTER_INDEX = 3; // d4 in order: d10, d12, d20, d4, d6, d8, d10
const NUM_DICE = DICE_IMAGES.length;

/** Indices of dice to show: selected at center (position 3), 3 left, 3 right. Wraps circularly. */
function getVisibleDiceIndices(selectedIndex: number): number[] {
  return Array.from({ length: NUM_DICE }, (_, i) => (selectedIndex - 3 + i + NUM_DICE * 2) % NUM_DICE);
}

export default function AboutPage() {
  const [currentSlide, setCurrentSlide] = useState(CENTER_INDEX); // Start on d4 (center)
  const [pendingSlide, setPendingSlide] = useState<number | null>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const goToSlide = (index: number) => {
    if (index === currentSlide && !pendingSlide) return;
    if (pendingSlide !== null) return; // Ignore rapid clicks during transition
    setPendingSlide(index);
    setIsFadingOut(true);
  };

  const goPrev = () => {
    const next = (currentSlide - 1 + NUM_DICE) % NUM_DICE;
    goToSlide(next);
  };

  const goNext = () => {
    const next = (currentSlide + 1) % NUM_DICE;
    goToSlide(next);
  };

  const visibleIndices = getVisibleDiceIndices(currentSlide);

  // Phase 1: fade out current content. Phase 2: swap slide, then fade in new content.
  const [isFadingIn, setIsFadingIn] = useState(false);
  useEffect(() => {
    if (!isFadingOut || pendingSlide === null) return;
    const t = setTimeout(() => {
      setCurrentSlide(pendingSlide);
      setPendingSlide(null);
      setIsFadingOut(false);
      setIsFadingIn(true);
    }, FADE_DURATION_MS);
    return () => clearTimeout(t);
  }, [isFadingOut, pendingSlide]);

  // Trigger fade-in: start new content at opacity-0, then animate to 1.
  useEffect(() => {
    if (!isFadingIn) return;
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsFadingIn(false));
    });
    return () => cancelAnimationFrame(raf);
  }, [isFadingIn]);

  return (
    <PageContainer size="xl" padded>
      <PageHeader
        title="About Realms"
        description={`${REALMS_MOTTO}. The tabletop RPG built for ultimate creative freedom, where fun comes first, flavor second, and rules third.`}
        size="lg"
      />

      {/* Carousel - floating, borderless, fixed height */}
      <section className="relative mb-12">
        {/* Subtle ambient background */}
        <div className="absolute inset-0 pointer-events-none -z-10">
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary-subtle-bg/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-accent-200/15 rounded-full blur-3xl" />
        </div>

        {/* Content - fixed min-height, no box. Fade out old, swap, then fade in new. */}
        <div className={cn('relative p-8 md:p-12', CAROUSEL_CONTENT_MIN_H)}>
          <h2
            className={cn(
              'text-xl font-bold text-primary-fg mb-6 flex items-center gap-2 transition-all duration-slow',
              (isFadingOut || isFadingIn) ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
            )}
          >
            <Swords className="w-6 h-6" />
            <span>{CAROUSEL_SLIDES[currentSlide].title}</span>
          </h2>
          <div
            className={cn(
              'text-text-secondary transition-all duration-slow',
              (isFadingOut || isFadingIn) ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
            )}
          >
            {(() => {
              const slide = CAROUSEL_SLIDES[currentSlide];
              const mobileContent = slide.contentMobile ?? slide.content;
              return (
                <>
                  <div className="md:hidden">{mobileContent}</div>
                  <div className="max-md:hidden">{slide.content}</div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Dice carousel - selected die always center; 3 on each side; arrows cycle selection */}
        <div className="relative flex items-center justify-center py-6 px-14 overflow-hidden w-full">
          <button
            onClick={goPrev}
            className="absolute left-2 md:left-4 p-2 rounded-full hover:bg-primary-subtle-bg transition-all hover:scale-110 z-10 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Previous slide"
          >
            <Image src="/images/ArrowL.png" alt="" width={24} height={26} className="opacity-60 hover:opacity-100 transition-opacity" />
          </button>

          <div className="flex items-center justify-center w-full overflow-hidden">
            <div className="flex items-center justify-center gap-1 md:gap-2">
              {visibleIndices.map((diceIndex, displayPos) => {
                const dice = DICE_IMAGES[diceIndex];
                const distance = Math.abs(displayPos - 3); // 3 = center
                const isSelected = displayPos === 3;
                const scale = isSelected ? 1.2 : Math.max(0.55, 1 - distance * 0.18);
                const opacity = isSelected ? 1 : Math.max(0.4, 1 - distance * 0.22);
                const zIndex = isSelected ? 20 : 10 - distance;

                return (
                  <button
                    key={`${dice.alt}-${diceIndex}-${displayPos}`}
                    onClick={() => goToSlide(diceIndex)}
                    className={cn(
                      'flex-shrink-0 transition-all duration-slow ease-out rounded-xl p-2 min-h-[44px] min-w-[44px] flex items-center justify-center',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-outline-border focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                      isSelected ? 'bg-primary-subtle-bg' : 'hover:bg-surface-alt/80'
                    )}
                    style={{
                      transform: `scale(${scale})`,
                      opacity,
                      zIndex,
                    }}
                    aria-label={`Go to ${dice.label}`}
                    aria-current={isSelected ? 'true' : undefined}
                    title={dice.label}
                  >
                    <Image
                      src={dice.src}
                      alt=""
                      width={48}
                      height={48}
                      className={cn('w-10 h-10 md:w-12 md:h-12 object-contain', dice.className)}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={goNext}
            className="absolute right-2 md:right-4 p-2 rounded-full hover:bg-primary-subtle-bg transition-all hover:scale-110 z-10 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Next slide"
          >
            <Image src="/images/ArrowR.png" alt="" width={24} height={26} className="opacity-60 hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </section>

      {/* Creator message - floating style, minimal border */}
      <section className="rounded-2xl p-8 transition-all duration-slow hover:shadow-lg bg-surface-alt/60">
        <h2 className="text-xl font-bold text-text-primary mb-4">A Note from the Creator</h2>
        <p className="text-lg text-text-muted dark:text-text-secondary italic mb-4">
          Dear Realms Players,
        </p>
        <p className="text-lg text-text-secondary leading-relaxed mb-4">
          Thank you for playing my game! I designed it with the hope that others would have as much fun with it as I do, and it means a lot to see people enjoying it. Realms is built to put <strong className="text-text-primary">fun first, flavor second, and rules third</strong>, so that your imagination can run free. I appreciate your time and enthusiasm.
        </p>
        <p className="text-lg text-text-muted dark:text-text-secondary italic mb-6">
          Sincerely,<br />
          <span className="font-semibold text-text-primary">Kadin Brooksby</span><br />
          Creator of Realms
        </p>
        {/* Primary CTAs for retention — clear next steps */}
        <div className="flex flex-wrap gap-3 justify-center items-center pt-4 border-t border-border-light">
          <MarketingLinkButton href="/characters/new">
            <Sparkles className="w-5 h-5 shrink-0" />
            Create a Character
          </MarketingLinkButton>
          <MarketingLinkButton href="/codex" variant="outline">
            <BookOpen className="w-5 h-5 shrink-0" />
            Browse Codex
          </MarketingLinkButton>
          <MarketingExternalButton href={DISCORD_URL} variant="outline">
            <MessageCircle className="w-5 h-5 shrink-0" />
            Join the Community
          </MarketingExternalButton>
        </div>
      </section>
    </PageContainer>
  );
}
