/**
 * About Us Page
 * =============
 * Authentic to the Core Rulebook tone. Uses dice images for carousel selection.
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PageContainer, PageHeader } from '@/components/ui';
import { Swords, Sparkles, BookOpen, Users, Wand2, Shield, Skull } from 'lucide-react';

const DICE_IMAGES = [
  { src: '/images/D4.png', alt: 'D4', label: 'Our Philosophy' },
  { src: '/images/D6.png', alt: 'D6', label: 'What We Offer' },
  { src: '/images/D8.png', alt: 'D8', label: 'What Makes Realms Unique' },
  { src: '/images/D12.png', alt: 'D12', label: 'Join the Adventure' },
];

const CAROUSEL_SLIDES = [
  {
    title: 'Our Philosophy',
    content: (
      <>
        <p className="text-lg text-text-secondary leading-relaxed mb-4">
          Realms is built around three core goals for the player experience: <strong className="text-text-primary">freedom in player creativity and customization</strong>, <strong className="text-text-primary">engaging and fluid gameplay</strong>, and <strong className="text-text-primary">putting fun first, flavor second, and rules third</strong>.
        </p>
        <p className="text-lg text-text-secondary leading-relaxed mb-4">
          If you give time and energy to the game, trusting the system with your most precious and creative ideas, it promises to reward you with immersive and satisfying Characters built on exactly what you envision—adventuring in a way only the imagination can picture.
        </p>
        <p className="text-lg text-text-secondary leading-relaxed italic">
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
          This website is your digital companion for Realms—a TTRPG designed for ultimate creative freedom. We provide the tools to turn any imagination into creation through the imaginative joy of tabletop roleplaying.
        </p>
        <ul className="space-y-3 text-text-secondary">
          <li className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <span><strong className="text-text-primary">Digital Character Sheets</strong> — Automatic ability calculations, dropdown menus for Skills and Feats, and user-friendly tools to streamline gameplay and Character creation.</span>
          </li>
          <li className="flex items-start gap-3">
            <Wand2 className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <span><strong className="text-text-primary">Power & Technique Creator</strong> — Design your Character&apos;s unique toolset with infinite combinations of flavor and effect.</span>
          </li>
          <li className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <span><strong className="text-text-primary">Item Creator</strong> — Craft custom Armaments, weapons, and armor to fit your vision.</span>
          </li>
          <li className="flex items-start gap-3">
            <Skull className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <span><strong className="text-text-primary">Creature Creator</strong> — Build custom monsters, companions, and Encounters for your party.</span>
          </li>
          <li className="flex items-start gap-3">
            <Users className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <span><strong className="text-text-primary">Encounter Tracker</strong> — Run Skill and Combat Encounters with ease.</span>
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
          Each Power, Technique, Feat, and Character choice is a <strong className="text-text-primary">blank slate</strong>, waiting for you to imagine, create, and develop into your perfect vision. The rules and mechanics of Realms are designed as <strong className="text-text-primary">scaffolding to help you build upon</strong>—to create every aspect of your Character and ideas.
        </p>
        <p className="text-lg text-text-secondary leading-relaxed mb-4">
          You are not confined by the description or name of a Feat, the way a Species is portrayed, or any other predefined aspect of the game. Ultimately, you decide why a Feat works the way it does, what a Power looks like in action, or how your Character uses a Skill.
        </p>
        <p className="text-lg text-text-secondary leading-relaxed">
          With the added layer of freedom in world-building backed by the idea of <strong className="text-text-primary">&quot;The Realms,&quot;</strong> the cooperative style of fantasy Table-Top Role Playing Games (TTRPG) gameplay, and the combined creativity of a party of friends, Realms is a rewarding role-play experience for all.
        </p>
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
          Character creation is the most exciting part of the game—a comprehensive guide for everything you need to create a unique Character. Whether you&apos;re a Realm Master crafting adventures for your party or a player bringing your dream Character to life, we&apos;re here to support your journey.
        </p>
        <p className="text-lg text-text-secondary leading-relaxed">
          Realms promises to reward you with immersive and satisfying Characters built on exactly what you envision. We invite you to explore the Codex, build in the Creators, and adventure in a way only the imagination can picture.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link href="/characters/new" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors">
            <Sparkles className="w-5 h-5" />
            Create a Character
          </Link>
          <Link href="/rules" className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-primary-600 text-primary-700 font-semibold rounded-lg hover:bg-primary-50 transition-colors">
            <BookOpen className="w-5 h-5" />
            Read the Core Rulebook
          </Link>
        </div>
      </>
    ),
  },
];

export default function AboutPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goPrev = () => {
    setCurrentSlide((prev) => (prev === 0 ? CAROUSEL_SLIDES.length - 1 : prev - 1));
  };

  const goNext = () => {
    setCurrentSlide((prev) => (prev === CAROUSEL_SLIDES.length - 1 ? 0 : prev + 1));
  };

  return (
    <PageContainer size="xl" padded>
      <PageHeader
        title="About Realms"
        description="The tabletop RPG built for ultimate creative freedom—where fun comes first, flavor second, and rules third."
        size="lg"
      />

      {/* Carousel */}
      <section className="bg-surface rounded-xl shadow-lg border border-border-light overflow-hidden mb-12">
        <div className="p-8 md:p-12 min-h-[320px]">
          <h2 className="text-xl font-bold text-primary-700 mb-6 flex items-center gap-2">
            <Swords className="w-6 h-6" />
            {CAROUSEL_SLIDES[currentSlide].title}
          </h2>
          <div className="text-text-secondary">
            {CAROUSEL_SLIDES[currentSlide].content}
          </div>
        </div>

        {/* Carousel controls - arrows */}
        <div className="flex items-center justify-between px-6 py-4 bg-surface-alt border-t border-border-light">
          <button
            onClick={goPrev}
            className="p-2 rounded-lg hover:bg-surface transition-colors"
            aria-label="Previous slide"
          >
            <Image src="/images/ArrowL.png" alt="" width={24} height={26} className="opacity-70" />
          </button>

          {/* Dice carousel selection bubbles */}
          <div className="flex items-center gap-3">
            {DICE_IMAGES.map((dice, index) => (
              <button
                key={dice.alt}
                onClick={() => goToSlide(index)}
                className={`
                  w-10 h-10 rounded-lg overflow-hidden border-2 transition-all
                  ${currentSlide === index
                    ? 'border-primary-600 shadow-md scale-110'
                    : 'border-border-light hover:border-primary-400 opacity-70 hover:opacity-100'
                  }
                `}
                aria-label={`Go to ${dice.label}`}
                title={dice.label}
              >
                <Image
                  src={dice.src}
                  alt={dice.alt}
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </button>
            ))}
          </div>

          <button
            onClick={goNext}
            className="p-2 rounded-lg hover:bg-surface transition-colors"
            aria-label="Next slide"
          >
            <Image src="/images/ArrowR.png" alt="" width={24} height={26} className="opacity-70" />
          </button>
        </div>
      </section>

      {/* Creator message - matches home page tone */}
      <section className="bg-surface-alt rounded-xl p-8 border border-border-light">
        <h2 className="text-xl font-bold text-text-primary mb-4">A Note from the Creator</h2>
        <p className="text-lg text-text-muted italic mb-4">
          Dear Realms Players,
        </p>
        <p className="text-lg text-text-secondary leading-relaxed mb-4">
          Thank you for playing my game! I designed it with the hope that others would have as much fun with it as I do, and it means a lot to see people enjoying it. Realms is built to put <strong className="text-text-primary">fun first, flavor second, and rules third</strong>—so that your imagination can run free. I appreciate your time and enthusiasm.
        </p>
        <p className="text-lg text-text-muted italic">
          Sincerely,<br />
          <span className="font-semibold text-text-primary">Kadin Brooksby</span><br />
          Creator of Realms
        </p>
      </section>
    </PageContainer>
  );
}
