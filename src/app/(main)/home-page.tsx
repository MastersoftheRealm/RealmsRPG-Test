/**
 * Home Page Content
 * =================
 * Landing page with hero banner, feature cards, reviews, and CTAs.
 * Not a route — imported by app/page.tsx for the root "/" URL.
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import type { ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, BookOpen, Sword, MessageCircle, X } from 'lucide-react';
import { useAuth } from '@/hooks';
import { OnboardingTour } from '@/components/shared';

// Discord / community link (same as About page)
const DISCORD_URL = 'https://discord.com/invite/WW7uVEEdpk';

// Reviews data - quote can include inline links for CTAs
const reviews: Array<{ quote: ReactNode; author: string }> = [
  {
    quote: (
      <>
        It&apos;s a genuinely enjoyable time. I love the{' '}
        <Link href="/characters/new" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
          character creation experience
        </Link>
        .
      </>
    ),
    author: "Olive, Realms Playtester"
  },
  {
    quote: (
      <>
        A refreshing take on tabletop RPGs with incredible flexibility in{' '}
        <Link href="/characters/new" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
          character building
        </Link>
        .
      </>
    ),
    author: "Marcus, Realms Player"
  },
  {
    quote: (
      <>
        The{' '}
        <Link href="/power-creator" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
          power creation system
        </Link>
        {' '}is unlike anything I&apos;ve seen before. So creative!
      </>
    ),
    author: "Sarah, Game Master"
  }
];

const WELCOME_DISMISSED_KEY = 'realms_welcome_dismissed';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (user && !sessionStorage.getItem(WELCOME_DISMISSED_KEY)) {
      setShowWelcome(true);
    }
  }, [user]);

  const dismissWelcome = () => {
    if (typeof window !== 'undefined') sessionStorage.setItem(WELCOME_DISMISSED_KEY, '1');
    setShowWelcome(false);
  };

  // Redirect OAuth code to callback when Supabase redirects to / instead of /auth/callback
  const code = searchParams.get('code');
  useEffect(() => {
    if (code) {
      const next = searchParams.get('next') ?? '/';
      router.replace(`/auth/callback?code=${encodeURIComponent(code)}${next !== '/' ? `&next=${encodeURIComponent(next)}` : ''}`);
    }
  }, [code, searchParams, router]);

  if (code) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-text-muted dark:text-text-secondary">Signing you in...</p>
      </div>
    );
  }

  const handlePrevReview = () => {
    setCurrentReviewIndex((prev) => (prev === 0 ? reviews.length - 1 : prev - 1));
  };

  const handleNextReview = () => {
    setCurrentReviewIndex((prev) => (prev === reviews.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      {/* Hero Banner - constrain on small screens */}
      <section className="relative w-full h-[240px] sm:h-[320px] md:h-[400px] overflow-hidden">
        <Image
          src="/images/Banner.png"
          alt="Realms Banner"
          fill
          className="object-cover"
          priority
          suppressHydrationWarning
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 gap-3 sm:gap-4">
          <Image
            src="/images/LogoFullGrey.png"
            alt="Realms Logo"
            width={600}
            height={200}
            className="w-full max-w-[90vw] sm:max-w-[70vw] md:w-1/2 h-auto object-contain pointer-events-none"
            priority
            suppressHydrationWarning
          />
          <p className="text-center text-sm sm:text-base md:text-lg text-white drop-shadow-md max-w-[520px] font-nunito">
            Create your character your way — use what&apos;s in the game or build your own.
          </p>
        </div>
      </section>

      {/* Welcome banner for logged-in users (dismissible, once per session) */}
      {showWelcome && user && (
        <section className="bg-primary-50 dark:bg-primary-900/20 border-b border-primary-200 dark:border-primary-800">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-24 py-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm sm:text-base text-primary-800 dark:text-primary-200 font-medium">
              Welcome! Finish your character, browse Realms Library, or join the community.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Link href="/characters/new" className="text-sm font-semibold text-primary-700 dark:text-primary-300 hover:underline">
                Create character
              </Link>
              <span className="text-primary-600 dark:text-primary-400">·</span>
              <Link href="/library" className="text-sm font-semibold text-primary-700 dark:text-primary-300 hover:underline">
                Realms Library
              </Link>
              <span className="text-primary-600 dark:text-primary-400">·</span>
              <button
                type="button"
                onClick={() => setShowTour(true)}
                className="text-sm font-semibold text-primary-700 dark:text-primary-300 hover:underline"
              >
                Take a quick tour
              </button>
              <span className="text-primary-600 dark:text-primary-400">·</span>
              <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary-700 dark:text-primary-300 hover:underline">
                Join Discord
              </a>
              <button
                type="button"
                onClick={dismissWelcome}
                className="p-1 rounded hover:bg-primary-200/50 dark:hover:bg-primary-800/50 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Dismiss welcome"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>
      )}

      <OnboardingTour isOpen={showTour} onClose={() => setShowTour(false)} />

      {/* Features Section - linked cards; mobile: stack single column, desktop: row */}
      <section className="bg-neutral-300 dark:bg-neutral-800 py-8 sm:py-14 px-4 sm:px-6 lg:px-24 shadow-md">
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row justify-between items-stretch lg:items-start gap-8 lg:gap-[116px]">
          <FeatureCard
            href="/characters/new"
            title="CREATE A CHARACTER"
            description="Use what's in the game or build your own. Choose species, feats, powers, and more."
            icon={<Sparkles className="w-6 h-6" suppressHydrationWarning />}
          />
          <div className="hidden lg:block w-px h-[106px] bg-neutral-400 dark:bg-neutral-600 flex-shrink-0" />
          <FeatureCard
            href="/codex"
            title="BROWSE CODEX"
            description="Full reference: feats, skills, species, equipment, and parts for the Realms system."
            icon={<BookOpen className="w-6 h-6" suppressHydrationWarning />}
          />
          <div className="hidden lg:block w-px h-[106px] bg-neutral-400 dark:bg-neutral-600 flex-shrink-0" />
          <FeatureCard
            href="/browse"
            title="BROWSE REALMS LIBRARY"
            description="Official powers, techniques, armaments, and creatures. Add to your library to use as-is or customize."
            icon={<Sword className="w-6 h-6" suppressHydrationWarning />}
          />
        </div>
      </section>

      {/* Content Section: Reviews + Creator Message + CTAs; mobile: stack, no horizontal overflow */}
      <section className="flex flex-col lg:flex-row bg-surface-alt min-h-[272px]">
        {/* Reviews Section */}
        <div className="flex-1 py-6 sm:py-2 pl-4 sm:pl-6 lg:pl-24 pr-4 flex items-center justify-center min-w-0">
          <div className="flex items-center gap-3 sm:gap-6 w-full max-w-[781px]">
            <button
              type="button"
              onClick={handlePrevReview}
              className="p-2 hover:opacity-70 transition-opacity flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Previous review"
            >
              <Image
                src="/images/ArrowL.png"
                alt="Previous"
                width={24}
                height={26}
                className="object-contain"
                suppressHydrationWarning
              />
            </button>

            <div className="flex-1 text-left min-w-0">
              <h2 className="font-nunito font-semibold text-2xl sm:text-3xl text-text-primary mb-4 sm:mb-6">
                Reviews
              </h2>
              <div className="flex gap-3 sm:gap-6 items-start">
                <div className="w-20 h-24 sm:w-[133px] sm:h-[148px] bg-border-light flex-shrink-0 rounded" />
                <div className="flex-1 min-w-0">
                  <p className="font-nunito text-base sm:text-xl text-text-primary leading-relaxed mb-3 sm:mb-4">
                    {reviews[currentReviewIndex].quote}
                  </p>
                  <p className="font-nunito text-sm sm:text-xl text-text-primary leading-relaxed text-right">
                    {reviews[currentReviewIndex].author}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNextReview}
              className="p-2 hover:opacity-70 transition-opacity flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Next review"
            >
              <Image
                src="/images/ArrowR.png"
                alt="Next"
                width={24}
                height={26}
                className="object-contain"
                suppressHydrationWarning
              />
            </button>
          </div>
        </div>

        {/* Creator Message + CTAs */}
        <div className="w-full lg:w-[499px] py-6 sm:py-2 px-4 sm:pr-24 flex items-center justify-center gap-4 sm:gap-6 flex-shrink-0 border-t lg:border-t-0 border-border-light">
          <div className="hidden lg:block w-px h-[225px] bg-divider flex-shrink-0" />
          <div className="flex-1 max-w-[328px] min-w-0">
            <p className="font-nunito text-base sm:text-lg text-text-muted dark:text-text-secondary text-center italic mb-3 sm:mb-4">
              Dear Realms Players,
            </p>
            <p className="font-nunito text-base sm:text-lg text-text-muted dark:text-text-secondary text-center italic mb-3 sm:mb-4">
              Thank you for playing my game! I designed it with the hope that others would have as much fun with it as I do, and it means a lot to see people enjoying it. I appreciate your time and enthusiasm.
            </p>
            <p className="font-nunito text-base sm:text-lg text-text-muted dark:text-text-secondary text-center italic mb-4 sm:mb-6">
              Sincerely, Realms creator<br />Kadin Brooksby
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center flex-wrap">
              <Link
                href="/about"
                className="btn-outline-clean inline-flex items-center gap-2"
              >
                <BookOpen className="w-5 h-5" suppressHydrationWarning />
                About Realms
              </Link>
              <Link
                href="/characters/new"
                className="btn-solid inline-flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" suppressHydrationWarning />
                Create a Character
              </Link>
              <a
                href={DISCORD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline-clean inline-flex items-center gap-2"
              >
                <MessageCircle className="w-5 h-5" suppressHydrationWarning />
                Join the Community
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-24">
        <p className="text-text-muted dark:text-text-secondary">Loading...</p>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}

function FeatureCard({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex-1 max-w-full lg:max-w-[286px] group block transition-transform hover:-translate-y-1 min-w-0"
    >
      <div className="flex items-center gap-2 mb-3">
        {icon && <span className="text-primary-600 dark:text-primary-400 group-hover:text-primary-500 dark:text-primary-300 transition-colors">{icon}</span>}
        <h3 className="font-display font-normal text-xl text-text-primary uppercase group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {title}
        </h3>
      </div>
      <p className="font-nunito font-normal text-xl text-text-primary leading-relaxed">
        {description}
      </p>
    </Link>
  );
}
