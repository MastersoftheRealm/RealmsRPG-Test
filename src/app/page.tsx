/**
 * Home Page
 * ==========
 * Landing page with hero banner, feature cards, reviews, and CTAs
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Header, Footer } from '@/components/layout';
import { Sparkles, BookOpen, Sword, Wand2 } from 'lucide-react';

// Reviews data - can be expanded
const reviews = [
  {
    quote: "It's a genuinely enjoyable time. I love the character creation experience.",
    author: "Olive, Realms Playtester"
  },
  {
    quote: "A refreshing take on tabletop RPGs with incredible flexibility in character building.",
    author: "Marcus, Realms Player"
  },
  {
    quote: "The power creation system is unlike anything I've seen before. So creative!",
    author: "Sarah, Game Master"
  }
];

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-text-muted">Signing you in...</p>
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
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Banner */}
        <section className="relative w-full h-[400px] overflow-hidden">
          <Image
            src="/images/Banner.png"
            alt="Realms Banner"
            fill
            className="object-cover"
            priority
            suppressHydrationWarning
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Image
              src="/images/LogoFullGrey.png"
              alt="Realms Logo"
              width={600}
              height={200}
              className="w-1/2 h-auto object-contain pointer-events-none"
              priority
              suppressHydrationWarning
            />
          </div>
        </section>

        {/* Features Section - linked cards */}
        <section className="bg-neutral-300 py-14 px-24 shadow-md">
          <div className="max-w-[1440px] mx-auto flex justify-between items-start gap-[116px]">
            <FeatureCard
              href="/characters/new"
              title="CREATE CHARACTERS"
              description="Design your unique characters with detailed attributes and backgrounds."
              icon={<Sparkles className="w-6 h-6" suppressHydrationWarning />}
            />
            <div className="w-px h-[106px] bg-neutral-400 flex-shrink-0" />
            <FeatureCard
              href="/power-creator"
              title="DEFINE POWERS"
              description="Customize and create powerful abilities for your characters."
              icon={<Wand2 className="w-6 h-6" suppressHydrationWarning />}
            />
            <div className="w-px h-[106px] bg-neutral-400 flex-shrink-0" />
            <FeatureCard
              href="/library"
              title="JOIN ADVENTURES"
              description="Browse your library of armaments, powers, and creatures."
              icon={<Sword className="w-6 h-6" suppressHydrationWarning />}
            />
          </div>
        </section>

        {/* Content Section: Reviews + Creator Message + CTAs */}
        <section className="flex bg-surface-alt min-h-[272px]">
          {/* Reviews Section */}
          <div className="flex-1 py-2 pl-24 flex items-center justify-center">
            <div className="flex items-center gap-6 w-full max-w-[781px]">
              <button 
                onClick={handlePrevReview}
                className="p-2 hover:opacity-70 transition-opacity flex-shrink-0"
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
              
              <div className="flex-1 text-left">
                <h2 className="font-nunito font-semibold text-3xl text-title mb-6">
                  Reviews
                </h2>
                <div className="flex gap-6 items-start">
                  <div className="w-[133px] h-[148px] bg-border-light flex-shrink-0 rounded" />
                  <div className="flex-1">
                    <p className="font-nunito text-xl text-title leading-relaxed mb-4">
                      {reviews[currentReviewIndex].quote}
                    </p>
                    <p className="font-nunito text-xl text-title leading-relaxed text-right">
                      {reviews[currentReviewIndex].author}
                    </p>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={handleNextReview}
                className="p-2 hover:opacity-70 transition-opacity flex-shrink-0"
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
          <div className="w-[499px] py-2 pr-24 flex items-center gap-6 flex-shrink-0">
            <div className="w-px h-[225px] bg-divider flex-shrink-0" />
            <div className="flex-1 max-w-[328px]">
              <p className="font-nunito text-lg text-text-muted text-center italic mb-4">
                Dear Realms Players,
              </p>
              <p className="font-nunito text-lg text-text-muted text-center italic mb-4">
                Thank you for playing my game! I designed it with the hope that others would have as much fun with it as I do, and it means a lot to see people enjoying it. I appreciate your time and enthusiasm.
              </p>
              <p className="font-nunito text-lg text-text-muted text-center italic mb-6">
                Sincerely, Realms creator<br />Kadin Brooksby
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
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
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-text-muted">Loading...</p>
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
      className="flex-1 max-w-[286px] group block transition-transform hover:-translate-y-1"
    >
      <div className="flex items-center gap-2 mb-3">
        {icon && <span className="text-primary-600 group-hover:text-primary-500 transition-colors">{icon}</span>}
        <h3 className="font-display font-normal text-xl text-text-muted uppercase group-hover:text-primary-700 transition-colors">
          {title}
        </h3>
      </div>
      <p className="font-nunito font-normal text-xl text-primary-800 leading-relaxed">
        {description}
      </p>
    </Link>
  );
}
