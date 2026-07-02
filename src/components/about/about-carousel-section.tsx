/**
 * About carousel — slide content with fade-out/fade-in + animated dice strip
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { Swords } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { AboutDiceCarousel, type AboutDiceImage } from '@/components/about/about-dice-carousel';

const FADE_OUT_MS = 180;
const FADE_IN_MS = 220;

export type AboutCarouselSlide = {
  title: string;
  content: React.ReactNode;
  contentMobile?: React.ReactNode;
};

type AboutCarouselSectionProps = {
  slides: AboutCarouselSlide[];
  dice: AboutDiceImage[];
  initialIndex: number;
};

function SlidePanel({
  slide,
  className,
}: {
  slide: AboutCarouselSlide;
  className?: string;
}) {
  const mobileContent = slide.contentMobile ?? slide.content;

  return (
    <div className={className}>
      <h2 className="font-display text-xl sm:text-2xl font-bold text-text-primary mb-5 sm:mb-6 flex items-center justify-center md:justify-start gap-2">
        <Swords className="w-6 h-6 text-primary-link-fg shrink-0" aria-hidden="true" />
        <span>{slide.title}</span>
      </h2>
      <div className="font-nunito text-text-secondary">
        <div className="md:hidden">{mobileContent}</div>
        <div className="max-md:hidden">{slide.content}</div>
      </div>
    </div>
  );
}

export function AboutCarouselSection({
  slides,
  dice,
  initialIndex,
}: AboutCarouselSectionProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [contentVisible, setContentVisible] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const selectSlide = useCallback(
    (index: number) => {
      if (index === activeIndex || isTransitioning) return;

      if (reduceMotion) {
        setActiveIndex(index);
        return;
      }

      setIsTransitioning(true);
      setContentVisible(false);

      window.setTimeout(() => {
        setActiveIndex(index);
        requestAnimationFrame(() => {
          setContentVisible(true);
          window.setTimeout(() => setIsTransitioning(false), FADE_IN_MS);
        });
      }, FADE_OUT_MS);
    },
    [activeIndex, isTransitioning, reduceMotion]
  );

  const fadeClass = reduceMotion
    ? ''
    : cn(
        'transition-opacity ease-in-out',
        contentVisible ? 'duration-[220ms] ease-in' : 'duration-[180ms] ease-out'
      );

  return (
    <div>
      <div
        className={cn(fadeClass, contentVisible ? 'opacity-100' : 'opacity-0')}
        aria-live="polite"
      >
        <SlidePanel slide={slides[activeIndex]} />
      </div>

      <AboutDiceCarousel
        className="mt-3 sm:mt-4"
        dice={dice}
        selectedIndex={activeIndex}
        onSelect={selectSlide}
      />
    </div>
  );
}
