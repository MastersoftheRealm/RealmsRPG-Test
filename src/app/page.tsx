/**
 * Home Page
 * ==========
 * Landing page with hero banner
 * Matches the vanilla site design exactly
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Header, Footer } from '@/components/layout';

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

export default function HomePage() {
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

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
        {/* Hero Banner - matches vanilla site exactly */}
        <section className="relative w-full h-[400px] overflow-hidden">
          <Image
            src="/images/Banner.png"
            alt="Realms Banner"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Image
              src="/images/LogoFullGrey.png"
              alt="Realms Logo"
              width={600}
              height={200}
              className="w-1/2 h-auto object-contain pointer-events-none"
              priority
            />
          </div>
        </section>

        {/* Features Section - matches vanilla site exactly */}
        <section className="bg-neutral-300 py-14 px-24 shadow-md">
          <div className="max-w-[1440px] mx-auto flex justify-between items-start gap-[116px]">
            <FeatureCard
              title="CREATE CHARACTERS"
              description="Design your unique characters with detailed attributes and backgrounds."
            />
            <div className="w-px h-[106px] bg-neutral-400 flex-shrink-0" />
            <FeatureCard
              title="DEFINE POWERS"
              description="Customize and create powerful abilities for your characters."
            />
            <div className="w-px h-[106px] bg-neutral-400 flex-shrink-0" />
            <FeatureCard
              title="JOIN ADVENTURES"
              description="Participate in epic adventures and quests with other players."
            />
          </div>
        </section>

        {/* Content Section: Reviews + Creator Message - matches vanilla site exactly */}
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
                />
              </button>
            </div>
          </div>

          {/* Creator Message Section */}
          <div className="w-[499px] py-2 pr-24 flex items-center gap-6 flex-shrink-0">
            <div className="w-px h-[225px] bg-divider flex-shrink-0" />
            <div className="flex-1 max-w-[328px]">
              <p className="font-nunito text-lg text-text-muted text-center italic mb-4">
                Dear Realms Players,
              </p>
              <p className="font-nunito text-lg text-text-muted text-center italic mb-4">
                Thank you for playing my game! I designed it with the hope that others would have as much fun with it as I do, and it means a lot to see people enjoying it. I appreciate your time and enthusiasm.
              </p>
              <p className="font-nunito text-lg text-text-muted text-center italic">
                Sincerely, Realms creator<br />Kadin Brooksby
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex-1 max-w-[286px]">
      <h3 className="font-display font-normal text-xl text-text-muted uppercase mb-3">
        {title}
      </h3>
      <p className="font-nunito font-normal text-xl text-primary-800 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
