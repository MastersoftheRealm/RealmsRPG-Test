/**
 * Landing media frames
 * ====================
 * Fixed-aspect marketing image shells (16:10). Images are cropped/scaled with
 * object-fit inside the frame — the frame never resizes to the asset.
 */

import Image from 'next/image';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/** Shared visual proof aspect ratio across uniqueness cards. */
export const LANDING_MEDIA_ASPECT = 'aspect-[16/10]';

export const LANDING_ART = {
  faust: {
    src: '/images/Faust.png',
    alt: 'Faust, a masked warrior with glowing tattoos',
    /** Subject sits left in source art — anchor left so he centers in the narrow panel. */
    objectPosition: '42% 14%',
    scale: 1,
    surface: 'dark' as const,
  },
  gnome: {
    src: '/images/gnome.webp',
    alt: 'A gnome artificer character',
    objectPosition: '44% 8%',
    scale: 1.08,
    surface: 'dark' as const,
  },
  humanGreyscale: {
    src: '/images/Human-Greyscale.png',
    alt: 'An imposing human noble character portrait',
    objectPosition: 'center 10%',
    scale: 1,
    surface: 'light' as const,
  },
  shroomShot: {
    src: '/images/Shroom-Shot.png',
    alt: 'A whimsical slingshot with glowing mushroom ammunition',
  },
} as const;

type CropConfig = {
  src: string;
  alt: string;
  objectPosition: string;
  scale?: number;
  surface: 'dark' | 'light';
};

function FrameShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-card border border-border-light dark:border-border shadow-card',
        LANDING_MEDIA_ASPECT,
        className
      )}
    >
      {children}
    </div>
  );
}

function CroppedPanel({
  src,
  alt,
  objectPosition,
  scale = 1.08,
  surface,
  priority = false,
}: CropConfig & { priority?: boolean }) {
  return (
    <div
      className={cn(
        'relative h-full min-h-0 overflow-hidden',
        surface === 'dark' ? 'bg-primary-900' : 'bg-surface-alt dark:bg-surface'
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 768px) 33vw, 200px"
        className="object-cover"
        style={{ objectPosition, transform: `scale(${scale})` }}
      />
    </div>
  );
}

/** Three portrait crops — variety of Realms characters in one fixed frame. */
export function CharacterVarietyTriptych({ priority = false }: { priority?: boolean }) {
  const panels = [
    LANDING_ART.faust,
    LANDING_ART.gnome,
    LANDING_ART.humanGreyscale,
  ];

  return (
    <FrameShell>
      <div className="absolute inset-0 grid grid-cols-3 divide-x divide-border-light/80 dark:divide-border/60">
        {panels.map((panel) => (
          <CroppedPanel key={panel.src} {...panel} priority={priority} />
        ))}
      </div>
    </FrameShell>
  );
}

/** Transparent PNG product shot — letterboxed inside the same 16:10 frame. */
export function GearShowcasePanel() {
  return (
    <FrameShell className="bg-gradient-to-br from-primary-subtle-bg via-surface to-primary-100 dark:from-primary-900 dark:via-primary-800 dark:to-primary-900">
      <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-3">
        <div className="relative h-full w-full">
          <Image
            src={LANDING_ART.shroomShot.src}
            alt={LANDING_ART.shroomShot.alt}
            fill
            sizes="(max-width: 768px) 100vw, 360px"
            className="object-contain object-center drop-shadow-md scale-[1.2] sm:scale-[1.24]"
          />
        </div>
      </div>
    </FrameShell>
  );
}

/** Wire-style rulebook stand-in until licensed rules art is ready. */
export function RulesBookPanel() {
  return (
    <FrameShell className="bg-gradient-to-br from-surface-alt via-surface to-primary-subtle-bg dark:from-primary-900 dark:via-primary-800 dark:to-primary-900">
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <BookOpen
          className="w-[clamp(3rem,18vw,4.5rem)] h-[clamp(3rem,18vw,4.5rem)] text-primary-link-fg dark:text-primary-300"
          strokeWidth={1.25}
          aria-hidden="true"
        />
      </div>
    </FrameShell>
  );
}

/** Placeholder panel for cards without licensed art yet. */
export function PlaceholderMediaPanel({ label = 'Preview' }: { label?: string }) {
  return (
    <FrameShell className="bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-800 dark:to-primary-900 flex items-center justify-center">
      <span className="text-[10px] uppercase tracking-wide text-text-muted dark:text-text-secondary">
        {label}
      </span>
    </FrameShell>
  );
}
