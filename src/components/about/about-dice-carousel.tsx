/**
 * About page dice carousel strip
 * ==============================
 * Circular selector: selected die centers, neighbors slide with transform/opacity.
 * Wrap-around uses fade (no cross-screen slide). Respects prefers-reduced-motion.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

export type AboutDiceImage = {
  src: string;
  alt: string;
  label: string;
  className?: string | undefined;
};

type AboutDiceCarouselProps = {
  dice: AboutDiceImage[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  centerSlot?: number | undefined;
  className?: string | undefined;
};

const SLOT_WIDTH_MOBILE = 68;
const SLOT_WIDTH_DESKTOP = 80;

function getDisplaySlot(
  diceIndex: number,
  selectedIndex: number,
  total: number,
  centerSlot: number,
): number {
  return (diceIndex - selectedIndex + centerSlot + total * 2) % total;
}

function slotToOffset(slot: number, centerSlot: number): number {
  return slot - centerSlot;
}

function slotMetrics(offset: number) {
  const distance = Math.abs(offset);
  return {
    scale: offset === 0 ? 1.12 : Math.max(0.52, 1 - distance * 0.12),
    opacity: offset === 0 ? 1 : Math.max(0.3, 1 - distance * 0.17),
    zIndex: 20 - distance,
  };
}

function getWrappedDiceIndices(
  fromIndex: number,
  toIndex: number,
  total: number,
  centerSlot: number,
): Set<number> {
  const wrapped = new Set<number>();
  for (let diceIndex = 0; diceIndex < total; diceIndex += 1) {
    const nextSlot = getDisplaySlot(diceIndex, toIndex, total, centerSlot);
    const prevSlot = getDisplaySlot(diceIndex, fromIndex, total, centerSlot);
    if (Math.abs(nextSlot - prevSlot) > total / 2) wrapped.add(diceIndex);
  }
  return wrapped;
}

export function AboutDiceCarousel({
  dice,
  selectedIndex,
  onSelect,
  centerSlot = 3,
  className,
}: AboutDiceCarouselProps) {
  const total = dice.length;
  const [wrapFadeDice, setWrapFadeDice] = useState<Set<number>>(() => new Set());
  const [reduceMotion, setReduceMotion] = useState(false);
  const [slotWidth, setSlotWidth] = useState(SLOT_WIDTH_MOBILE);

  useEffect(() => {
    const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const widthMq = window.matchMedia('(min-width: 768px)');

    const update = () => {
      setReduceMotion(motionMq.matches);
      setSlotWidth(widthMq.matches ? SLOT_WIDTH_DESKTOP : SLOT_WIDTH_MOBILE);
    };

    update();
    motionMq.addEventListener('change', update);
    widthMq.addEventListener('change', update);
    return () => {
      motionMq.removeEventListener('change', update);
      widthMq.removeEventListener('change', update);
    };
  }, []);

  const select = useCallback(
    (index: number) => {
      if (index === selectedIndex) return;
      const wrapped = getWrappedDiceIndices(selectedIndex, index, total, centerSlot);
      if (wrapped.size > 0 && !reduceMotion) {
        setWrapFadeDice(wrapped);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setWrapFadeDice(new Set()));
        });
      }
      onSelect(index);
    },
    [centerSlot, onSelect, reduceMotion, selectedIndex, total],
  );

  const goPrev = () => select((selectedIndex - 1 + total) % total);
  const goNext = () => select((selectedIndex + 1) % total);

  const motionTransition = reduceMotion
    ? ''
    : 'transition-[transform,opacity] duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]';
  const wrapTransition = reduceMotion
    ? ''
    : 'transition-opacity duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]';

  const arrowButtonClass =
    'absolute top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full p-2 text-text-secondary transition-colors hover:bg-surface-alt/60 hover:text-text-primary';

  return (
    <div className={cn('relative mx-auto w-full max-w-full min-w-0', className)}>
      <button
        type="button"
        onClick={goPrev}
        className={cn(arrowButtonClass, 'left-0')}
        aria-label="Previous section"
      >
        <Image
          src="/images/ArrowL.png"
          alt=""
          width={22}
          height={24}
          className="opacity-75 transition-opacity hover:opacity-100"
        />
      </button>

      <div className="relative h-[4.25rem] w-full min-w-0 overflow-hidden sm:h-[4.5rem]">
        {dice.map((die, diceIndex) => {
          const slot = getDisplaySlot(diceIndex, selectedIndex, total, centerSlot);
          const offset = slotToOffset(slot, centerSlot);
          const isWrapFading = wrapFadeDice.has(diceIndex);
          const { scale, opacity, zIndex } = slotMetrics(offset);
          const isCenter = offset === 0;

          return (
            <button
              key={`${die.label}-${die.src}`}
              type="button"
              onClick={() => select(diceIndex)}
              className={cn(
                'absolute top-1/2 left-1/2 flex h-11 w-11 items-center justify-center',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-outline-border focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                isWrapFading ? wrapTransition : motionTransition,
              )}
              style={{
                zIndex,
                opacity: isWrapFading ? 0 : opacity,
                transform: `translate(-50%, -50%) translateX(${offset * slotWidth}px)`,
              }}
              aria-label={`Go to ${die.label}`}
              aria-current={isCenter ? 'true' : undefined}
              title={die.label}
            >
              <Image
                src={die.src}
                alt=""
                width={48}
                height={48}
                className={cn(
                  'pointer-events-none h-10 w-10 object-contain sm:h-11 sm:w-11 md:h-12 md:w-12',
                  die.className,
                  isCenter &&
                    'drop-shadow-[0_2px_10px_rgba(59,130,246,0.28)] dark:drop-shadow-[0_2px_12px_rgba(147,197,253,0.22)]',
                )}
                style={{ transform: `scale(${scale})` }}
              />
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={goNext}
        className={cn(arrowButtonClass, 'right-0')}
        aria-label="Next section"
      >
        <Image
          src="/images/ArrowR.png"
          alt=""
          width={22}
          height={24}
          className="opacity-75 transition-opacity hover:opacity-100"
        />
      </button>
    </div>
  );
}
